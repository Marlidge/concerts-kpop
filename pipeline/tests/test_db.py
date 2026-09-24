"""
Tests du stockage SQLite (votre §21, §28).

Chaque test ouvre une base en mémoire (":memory:") plutôt que le
fichier réel du pipeline : rapide, et sans jamais toucher à de vraies
données pendant qu'on teste.
"""

import sqlite3
from contextlib import contextmanager

import pytest

import db
from normalize import NormalizedConcert


@contextmanager
def memory_db():
    """Une base SQLite en mémoire, avec le même schéma que la vraie —
    db.connect() ouvre toujours un fichier, donc on réplique juste la
    partie utile ici plutôt que de le modifier pour les tests."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(db.SCHEMA)
    try:
        yield conn
    finally:
        conn.close()


def make_concert(**overrides) -> NormalizedConcert:
    defaults = dict(
        artist_id="artist-1",
        title="ENHYPEN",
        date="2027-02-27",
        time="19:30",
        city="Nanterre",
        region="Île-de-France",
        venue="PLENITUDE ARENA",
        address=None,
        genre="kpop",
        ticket_status="on_sale",
        tickets_open_at=None,
        price_min=None,
        price_max=None,
        official_url=None,
        image_url=None,
        source="ticketmaster",
        source_id="event-1",
        first_seen_at="2026-09-24T09:00:00+00:00",
        updated_at="2026-09-24T09:00:00+00:00",
    )
    defaults.update(overrides)
    return NormalizedConcert(**defaults)


@pytest.fixture
def artist_id():
    """Un id d'artiste valide, créé une fois par test."""
    with memory_db() as conn:
        yield db.upsert_artist(
            conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop"
        )


def test_upsert_artist_is_idempotent():
    """Créer deux fois le même artiste (même slug) doit renvoyer le
    même id, pas en créer un second."""
    with memory_db() as conn:
        first = db.upsert_artist(conn, slug="twice", name="TWICE", country="KR", genre="kpop")
        second = db.upsert_artist(conn, slug="twice", name="TWICE", country="KR", genre="kpop")

        assert first == second
        count = conn.execute("SELECT COUNT(*) FROM artists").fetchone()[0]
        assert count == 1


def test_upsert_concert_creates_then_updates():
    """La première écriture doit créer, la seconde (même source +
    source_id) doit mettre à jour la même ligne — jamais en créer une
    seconde (votre §21 : le pipeline doit être rejouable sans effet de
    bord)."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")

        first_id, created = db.upsert_concert(conn, make_concert(artist_id=aid))
        assert created is True

        second_id, created_again = db.upsert_concert(
            conn, make_concert(artist_id=aid, title="ENHYPEN (mis à jour)")
        )
        assert created_again is False
        assert second_id == first_id

        count = conn.execute("SELECT COUNT(*) FROM concerts").fetchone()[0]
        assert count == 1


def test_upsert_concert_preserves_first_seen_at_on_update():
    """La date de première découverte ne doit jamais changer, même
    quand le reste du concert est mis à jour."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")
        db.upsert_concert(
            conn, make_concert(artist_id=aid, first_seen_at="2026-01-01T00:00:00+00:00")
        )
        db.upsert_concert(
            conn, make_concert(artist_id=aid, first_seen_at="2026-06-01T00:00:00+00:00")
        )

        row = conn.execute("SELECT first_seen_at FROM concerts").fetchone()
        assert row["first_seen_at"] == "2026-01-01T00:00:00+00:00"


def test_mark_stale_concerts_flips_unconfirmed_on_sale_to_unknown():
    """Un concert "en vente" que la source ne renvoie plus lors d'une
    collecte doit repasser à "unknown" (votre §21)."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")
        db.upsert_concert(
            conn,
            make_concert(
                artist_id=aid,
                date="2099-01-01",  # loin dans le futur : jamais "passé"
                ticket_status="on_sale",
                updated_at="2026-01-01T00:00:00+00:00",
            ),
        )

        changed = db.mark_stale_concerts(
            conn, source="ticketmaster", run_started_at="2026-06-01T00:00:00+00:00"
        )

        assert changed == 1
        status = conn.execute("SELECT ticket_status FROM concerts").fetchone()[0]
        assert status == "unknown"


def test_mark_stale_concerts_leaves_confirmed_concerts_untouched():
    """Un concert dont updated_at est POSTÉRIEUR au début de la
    collecte a bien été reconfirmé cette fois-ci : il ne doit pas
    devenir "unknown"."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")
        db.upsert_concert(
            conn,
            make_concert(
                artist_id=aid,
                date="2099-01-01",
                ticket_status="on_sale",
                updated_at="2026-06-01T12:00:00+00:00",  # après run_started_at
            ),
        )

        changed = db.mark_stale_concerts(
            conn, source="ticketmaster", run_started_at="2026-06-01T00:00:00+00:00"
        )

        assert changed == 0
        status = conn.execute("SELECT ticket_status FROM concerts").fetchone()[0]
        assert status == "on_sale"


def test_mark_stale_concerts_never_touches_cancelled():
    """Un concert annulé reste annulé : ce n'est pas une information à
    remplacer par une incertitude, même si la source ne le confirme
    plus (elle ne le confirmera jamais plus, justement)."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")
        db.upsert_concert(
            conn,
            make_concert(
                artist_id=aid,
                date="2099-01-01",
                ticket_status="cancelled",
                updated_at="2026-01-01T00:00:00+00:00",
            ),
        )

        changed = db.mark_stale_concerts(
            conn, source="ticketmaster", run_started_at="2026-06-01T00:00:00+00:00"
        )

        assert changed == 0
        status = conn.execute("SELECT ticket_status FROM concerts").fetchone()[0]
        assert status == "cancelled"


def test_mark_stale_concerts_never_touches_past_concerts():
    """Un concert déjà passé garde son dernier statut connu : plus
    personne ne va acheter de billet pour un concert d'hier."""
    with memory_db() as conn:
        aid = db.upsert_artist(conn, slug="enhypen", name="ENHYPEN", country="KR", genre="kpop")
        db.upsert_concert(
            conn,
            make_concert(
                artist_id=aid,
                date="2020-01-01",  # loin dans le passé
                ticket_status="on_sale",
                updated_at="2019-01-01T00:00:00+00:00",
            ),
        )

        changed = db.mark_stale_concerts(
            conn, source="ticketmaster", run_started_at="2026-06-01T00:00:00+00:00"
        )

        assert changed == 0
