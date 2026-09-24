"""
Transforme un événement brut d'une source en la forme Concert du site
(votre §8). Ce module ne sait rien de HTTP ni de SQLite — il prend un
dictionnaire, renvoie un NormalizedConcert. C'est ce qui permettra à
une deuxième source de brancher son propre normalize_xxx() sans toucher
à celui-ci (votre §7).

Chaque champ ci-dessous a été vérifié contre de vraies réponses
Ticketmaster, pas deviné depuis la documentation (voir
pipeline/data/raw/ à l'étape 14).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from watchlist import WatchedArtist

# Ticketmaster abrège les régions ("Idf" au lieu de "Île-de-France").
# Complétée au fil des régions rencontrées plutôt que d'un coup : une
# région absente d'ici reste affichée telle quelle, ce qui est moins
# trompeur qu'une fausse traduction.
REGION_NAMES = {
    "Idf": "Île-de-France",
}


@dataclass
class NormalizedConcert:
    """Reflète exactement Concert (lib/types.ts), côté Python.

    Pas de champ `id` : votre §8 le décrit comme "attribué par le site
    après déduplication" — c'est donc la base (pipeline/db.py) qui le
    génère à l'écriture, jamais ce module.
    """

    artist_id: str
    title: str
    date: str
    time: str | None
    city: str
    region: str | None
    venue: str
    address: str | None
    genre: str
    ticket_status: str
    tickets_open_at: str | None
    price_min: float | None
    price_max: float | None
    official_url: str | None
    image_url: str | None
    source: str
    source_id: str
    first_seen_at: str
    updated_at: str


def _extract_time(local_time: str | None) -> str | None:
    """"19:30:00" → "19:30". Beaucoup d'événements n'ont pas d'heure connue."""
    return local_time[:5] if local_time else None


def _pick_image(images: list[dict]) -> str | None:
    """
    Choisit une image d'assez bonne taille, au format paysage.

    Ticketmaster en propose une dizaine par événement, de la miniature
    de recommandation (100×56) à l'original (souvent >2000px). On vise
    un format intermédiaire, adapté à une carte de site, plutôt que le
    plus lourd disponible.
    """
    landscape = [
        img
        for img in images
        if img.get("ratio") == "16_9" and img.get("width", 0) >= 600
    ]
    if landscape:
        return min(landscape, key=lambda img: img["width"])["url"]
    return images[0]["url"] if images else None


def _map_ticket_status(event: dict[str, Any], *, now: datetime | None = None) -> str:
    """
    Traduit le statut Ticketmaster vers celui du site.

    "offsale" est ambigu chez Ticketmaster : ça peut vouloir dire
    "pas encore ouvert" comme "complet, plus rien à vendre". On tranche
    en comparant la date d'ouverture de la billetterie à aujourd'hui —
    imparfait, mais explicite, plutôt qu'un statut inventé sans base
    (votre §23 : mieux vaut une incertitude assumée qu'une donnée fausse).
    """
    now = now or datetime.now(timezone.utc)
    status = event.get("dates", {}).get("status", {}).get("code")

    if status == "onsale":
        return "on_sale"
    if status == "cancelled":
        return "cancelled"
    if status == "offsale":
        opens_at = event.get("sales", {}).get("public", {}).get("startDateTime")
        if opens_at:
            try:
                opens = datetime.fromisoformat(opens_at.replace("Z", "+00:00"))
                if opens > now:
                    return "upcoming"
            except ValueError:
                pass  # date illisible : on retombe sur "sold_out" ci-dessous
        return "sold_out"
    return "unknown"


def normalize_event(
    event: dict[str, Any],
    artist: WatchedArtist,
    artist_id: str,
    *,
    source: str = "ticketmaster",
) -> NormalizedConcert:
    """
    Convertit un événement brut Ticketmaster en NormalizedConcert.

    Le genre vient de `artist` (watchlist.py), jamais de l'événement
    lui-même : ce concert précis est classé "Rock / Pop" côté
    Ticketmaster alors qu'il s'agit de K-pop — exactement ce que votre
    §5 anticipait en refusant de dépendre du champ "genre" d'une API.
    """
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    start = event.get("dates", {}).get("start", {})
    venue = (event.get("_embedded", {}).get("venues") or [{}])[0]
    price_ranges = event.get("priceRanges") or [{}]
    price = price_ranges[0]
    state_name = venue.get("state", {}).get("name")

    return NormalizedConcert(
        artist_id=artist_id,
        title=event.get("name") or artist.name,
        date=start.get("localDate", ""),
        time=_extract_time(start.get("localTime")),
        city=venue.get("city", {}).get("name", ""),
        region=REGION_NAMES.get(state_name, state_name),
        venue=venue.get("name", ""),
        address=venue.get("address", {}).get("line1"),
        genre=artist.genre,
        ticket_status=_map_ticket_status(event),
        tickets_open_at=event.get("sales", {}).get("public", {}).get("startDateTime"),
        price_min=price.get("min"),
        price_max=price.get("max"),
        official_url=event.get("url"),
        image_url=_pick_image(event.get("images", [])),
        source=source,
        source_id=event["id"],
        first_seen_at=now,
        updated_at=now,
    )
