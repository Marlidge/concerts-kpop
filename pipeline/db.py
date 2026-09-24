"""
Stockage local en SQLite (votre §8).

Un seul fichier, pipeline/data/concerts.db, non versionné — au même
titre que les données brutes, c'est une donnée re-générable, pas du
code. Pour l'instant, seul le pipeline lit et écrit ici ; le site
continue d'afficher lib/mock-data.ts tant que le volume de vraies
données ne justifie pas de brancher les deux (voir pipeline/README.md
pour la raison de ce choix).

SQLite plutôt que Postgres à ce stade : c'est un fichier, sans service à
faire tourner, adapté à un pipeline qui s'exécute encore à la main.
Le passage à Postgres/Supabase (prévu pour l'hébergement) n'imposera
pas de revoir ce module : le SQL ci-dessous est du SQL standard.
"""

from __future__ import annotations

import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from normalize import NormalizedConcert

DB_PATH = Path(__file__).resolve().parent / "data" / "concerts.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS artists (
    id         TEXT PRIMARY KEY,
    slug       TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    country    TEXT NOT NULL,
    genre      TEXT NOT NULL CHECK (genre IN ('kpop', 'jpop')),
    sub_genre  TEXT,
    image_url  TEXT
);

CREATE TABLE IF NOT EXISTS concerts (
    id               TEXT PRIMARY KEY,
    artist_id        TEXT NOT NULL REFERENCES artists(id),
    title            TEXT NOT NULL,
    date             TEXT NOT NULL,
    time             TEXT,
    city             TEXT NOT NULL,
    region           TEXT,
    venue            TEXT NOT NULL,
    address          TEXT,
    genre            TEXT NOT NULL CHECK (genre IN ('kpop', 'jpop')),
    ticket_status    TEXT NOT NULL,
    tickets_open_at  TEXT,
    price_min        REAL,
    price_max        REAL,
    official_url     TEXT,
    image_url        TEXT,
    source           TEXT NOT NULL,
    source_id        TEXT NOT NULL,
    first_seen_at    TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    -- Empêche le même événement, de la même source, d'être écrit deux
    -- fois : la même clé que la vraie déduplication utilisera (§9),
    -- mais appliquée ici à l'intérieur d'une seule source.
    UNIQUE (source, source_id)
);
"""


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    """
    Ouvre la base (la crée si besoin) et valide les écritures à la
    sortie du bloc `with` — ou les annule si une exception survient,
    plutôt que de laisser la base à moitié écrite (votre §23).
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def upsert_artist(
    conn: sqlite3.Connection, *, slug: str, name: str, country: str, genre: str
) -> str:
    """Crée l'artiste s'il n'existe pas encore, renvoie son id dans les deux cas."""
    row = conn.execute("SELECT id FROM artists WHERE slug = ?", (slug,)).fetchone()
    if row:
        return row["id"]

    artist_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO artists (id, slug, name, country, genre) VALUES (?, ?, ?, ?, ?)",
        (artist_id, slug, name, country, genre),
    )
    return artist_id


def upsert_concert(conn: sqlite3.Connection, concert: NormalizedConcert) -> tuple[str, bool]:
    """
    Insère un concert, ou met à jour celui qui existe déjà pour la même
    (source, source_id). Renvoie (id, True) pour une création,
    (id, False) pour une mise à jour.

    C'est ce qui rend le pipeline rejouable sans effet de bord (votre
    §21) : relancer le script deux fois de suite ne double pas les
    concerts, et first_seen_at ne bouge plus une fois écrit — seul
    updated_at avance.
    """
    existing = conn.execute(
        "SELECT id FROM concerts WHERE source = ? AND source_id = ?",
        (concert.source, concert.source_id),
    ).fetchone()

    if existing:
        conn.execute(
            """UPDATE concerts SET
                title=?, date=?, time=?, city=?, region=?, venue=?, address=?,
                ticket_status=?, tickets_open_at=?, price_min=?, price_max=?,
                official_url=?, image_url=?, updated_at=?
               WHERE id=?""",
            (
                concert.title, concert.date, concert.time, concert.city,
                concert.region, concert.venue, concert.address,
                concert.ticket_status, concert.tickets_open_at,
                concert.price_min, concert.price_max, concert.official_url,
                concert.image_url, concert.updated_at, existing["id"],
            ),
        )
        return existing["id"], False

    new_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO concerts (
            id, artist_id, title, date, time, city, region, venue, address,
            genre, ticket_status, tickets_open_at, price_min, price_max,
            official_url, image_url, source, source_id, first_seen_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            new_id, concert.artist_id, concert.title, concert.date, concert.time,
            concert.city, concert.region, concert.venue, concert.address,
            concert.genre, concert.ticket_status, concert.tickets_open_at,
            concert.price_min, concert.price_max, concert.official_url,
            concert.image_url, concert.source, concert.source_id,
            concert.first_seen_at, concert.updated_at,
        ),
    )
    return new_id, True


def mark_stale_concerts(conn: sqlite3.Connection, *, source: str, run_started_at: str) -> int:
    """
    Marque "unknown" les concerts à venir de cette source qui n'ont pas
    été confirmés par la collecte en cours (votre §21 : détecter les
    changements importants).

    On ne supprime jamais un concert : il reste visible dans
    l'historique et les statistiques. Mais si la source ne le renvoie
    plus, continuer à afficher "en vente" serait mentir — on repasse
    donc son statut à "unknown" plutôt que d'inventer une raison
    (annulé ? complet ? simple pépin de l'API ce jour-là ?) qu'on ne
    connaît pas réellement (votre §23).

    Les concerts déjà passés ne sont jamais touchés : leur statut n'a
    plus d'effet sur ce que voit l'utilisateur.

    Seuls "on_sale" et "upcoming" basculent : ce sont les statuts qui
    laissent croire qu'on peut encore agir (réserver, attendre une
    ouverture). "cancelled" et "sold_out" restent tels quels — ce sont
    déjà des réponses, les effacer perdrait une information utile pour
    rien.
    """
    cursor = conn.execute(
        """UPDATE concerts
           SET ticket_status = 'unknown'
           WHERE source = ?
             AND updated_at < ?
             AND date >= date('now')
             AND ticket_status IN ('on_sale', 'upcoming')""",
        (source, run_started_at),
    )
    return cursor.rowcount
