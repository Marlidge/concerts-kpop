"""
Tests de la normalisation (votre §8, §28).

Le premier test reconstruit un événement Ticketmaster simplifié, mais
fidèle à la vraie réponse obtenue pour LE SSERAFIM à l'étape 14 (voir
pipeline/data/raw/ à l'époque) : mêmes noms de champs, même absence de
priceRanges, même région abrégée "Idf".
"""

from datetime import datetime, timezone

from normalize import _extract_time, _map_ticket_status, normalize_event
from watchlist import WatchedArtist


def make_raw_event(**overrides) -> dict:
    """Un événement Ticketmaster minimal, avec la forme réellement
    observée. `overrides` remplace des clés de premier niveau."""
    event = {
        "id": "ZkyMmBwZ1A7u87F",
        "name": "2026 LE SSERAFIM TOUR - LE SSERAFIM",
        "url": "https://www.ticketmaster.fr/fr/manifestation/...",
        "images": [
            {"ratio": "16_9", "url": "https://example.com/small.jpg", "width": 205},
            {"ratio": "16_9", "url": "https://example.com/big.jpg", "width": 1136},
        ],
        "dates": {
            "start": {"localDate": "2026-10-21", "localTime": "19:30:00"},
            "status": {"code": "onsale"},
        },
        "sales": {
            "public": {"startDateTime": "2026-06-04T08:00:00Z"},
        },
        "_embedded": {
            "venues": [
                {
                    "name": "ACCOR ARENA",
                    "city": {"name": "Paris"},
                    "state": {"name": "Idf", "stateCode": "75"},
                    "address": {"line1": "8 BD DE BERCY"},
                }
            ],
        },
    }
    event.update(overrides)
    return event


ARTIST = WatchedArtist(name="LE SSERAFIM", country="KR", genre="kpop")


def test_extract_time_trims_seconds():
    assert _extract_time("19:30:00") == "19:30"


def test_extract_time_handles_missing_time():
    """Beaucoup de concerts n'ont pas d'heure connue (votre §23) : la
    fonction doit renvoyer None plutôt qu'échouer."""
    assert _extract_time(None) is None


def test_normalize_event_maps_real_ticketmaster_shape():
    concert = normalize_event(make_raw_event(), ARTIST, artist_id="artist-1")

    assert concert.title == "2026 LE SSERAFIM TOUR - LE SSERAFIM"
    assert concert.date == "2026-10-21"
    assert concert.time == "19:30"
    assert concert.city == "Paris"
    # "Idf" doit être développé en région lisible.
    assert concert.region == "Île-de-France"
    assert concert.venue == "ACCOR ARENA"
    assert concert.address == "8 BD DE BERCY"


def test_normalize_event_uses_watchlist_genre_not_source_classification():
    """
    Le vrai concert testé ici est classé "Rock / Pop" côté Ticketmaster
    alors qu'il s'agit de K-pop (votre §5) : le genre doit venir de
    l'artiste suivi, jamais de la source.
    """
    concert = normalize_event(make_raw_event(), ARTIST, artist_id="artist-1")

    assert concert.genre == "kpop"


def test_normalize_event_picks_a_mid_size_landscape_image():
    concert = normalize_event(make_raw_event(), ARTIST, artist_id="artist-1")

    assert concert.image_url == "https://example.com/big.jpg"


def test_normalize_event_handles_missing_prices():
    """Aucun des 3 vrais concerts trouvés à l'étape 14 n'avait de prix :
    ce cas doit rester le cas normal, pas une exception."""
    event = make_raw_event()  # pas de "priceRanges"
    concert = normalize_event(event, ARTIST, artist_id="artist-1")

    assert concert.price_min is None
    assert concert.price_max is None


def test_normalize_event_reads_price_ranges_when_present():
    event = make_raw_event(priceRanges=[{"min": 45.0, "max": 189.0}])
    concert = normalize_event(event, ARTIST, artist_id="artist-1")

    assert concert.price_min == 45.0
    assert concert.price_max == 189.0


def test_status_onsale_maps_to_on_sale():
    event = make_raw_event(dates={"start": {}, "status": {"code": "onsale"}})
    assert _map_ticket_status(event) == "on_sale"


def test_status_cancelled_maps_to_cancelled():
    event = make_raw_event(dates={"start": {}, "status": {"code": "cancelled"}})
    assert _map_ticket_status(event) == "cancelled"


def test_status_offsale_before_public_sale_means_upcoming():
    """"offsale" avant la date d'ouverture publique = pas encore en vente."""
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    event = make_raw_event(
        dates={"start": {}, "status": {"code": "offsale"}},
        sales={"public": {"startDateTime": "2026-06-01T08:00:00Z"}},
    )
    assert _map_ticket_status(event, now=now) == "upcoming"


def test_status_offsale_after_public_sale_means_sold_out():
    """"offsale" après la date d'ouverture publique = plus rien à vendre."""
    now = datetime(2026, 12, 1, tzinfo=timezone.utc)
    event = make_raw_event(
        dates={"start": {}, "status": {"code": "offsale"}},
        sales={"public": {"startDateTime": "2026-06-01T08:00:00Z"}},
    )
    assert _map_ticket_status(event, now=now) == "sold_out"


def test_status_unknown_code_maps_to_unknown():
    """Un statut jamais rencontré ne doit pas faire planter la
    normalisation ni inventer une réponse (votre §23)."""
    event = make_raw_event(dates={"start": {}, "status": {"code": "postponed"}})
    assert _map_ticket_status(event) == "unknown"
