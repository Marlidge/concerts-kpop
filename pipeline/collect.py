"""
Le pipeline complet : Ticketmaster → normalisation → déduplication →
SQLite (votre §7).

C'est le script "sérieux" — celui qui sera relancé régulièrement à
l'étape 17. fetch_ticketmaster.py reste l'outil d'exploration qui a
servi à mesurer la couverture réelle de la source ; celui-ci écrit
vraiment dans la base.

La déduplication se fait après avoir collecté TOUS les résultats, pas
artiste par artiste : c'est ce qui permet de fusionner des doublons
même quand rien ne garantit qu'ils sortiront l'un après l'autre — utile
dès aujourd'hui pour les doublons internes à Ticketmaster (le cas
ENHYPEN), indispensable le jour où une deuxième source rejoindra
celle-ci.

Utilisation, depuis la racine du projet :
    pipeline\\.venv\\Scripts\\python.exe pipeline\\collect.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

import db
from dedupe import deduplicate
from normalize import NormalizedConcert, normalize_event
from sources.ticketmaster import TicketmasterError, new_http_client, search_events
from watchlist import WATCHLIST

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DELAY_BETWEEN_CALLS = 0.3  # votre §21 : rester poli avec la source


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def load_api_key() -> str:
    load_dotenv(PROJECT_ROOT / ".env.local")
    api_key = os.environ.get("TICKETMASTER_API_KEY", "").strip()

    if not api_key:
        print(
            "Clé API manquante. Copiez .env.example vers .env.local et "
            "renseignez TICKETMASTER_API_KEY (voir pipeline/README.md).",
            file=sys.stderr,
        )
        sys.exit(1)

    return api_key


def collect_raw(conn, api_key: str) -> list[NormalizedConcert]:
    """Interroge la source pour chaque artiste suivi et renvoie les
    résultats normalisés, AVANT déduplication."""
    normalized: list[NormalizedConcert] = []

    with new_http_client() as client:
        for index, artist in enumerate(WATCHLIST, start=1):
            artist_id = db.upsert_artist(
                conn,
                slug=slugify(artist.name),
                name=artist.name,
                country=artist.country,
                genre=artist.genre,
            )

            try:
                result = search_events(artist.name, api_key, client=client)
            except TicketmasterError as exc:
                print(f"  [{index}/{len(WATCHLIST)}] {artist.name:<24} → erreur : {exc}")
                continue

            if result.events:
                print(
                    f"  [{index}/{len(WATCHLIST)}] {artist.name:<24} "
                    f"→ {len(result.events)} événement(s) brut(s)"
                )

            for event in result.events:
                normalized.append(normalize_event(event, artist, artist_id))

            if index < len(WATCHLIST):
                time.sleep(DELAY_BETWEEN_CALLS)

    return normalized


def main() -> None:
    api_key = load_api_key()

    with db.connect() as conn:
        raw = collect_raw(conn, api_key)
        deduped = deduplicate(raw)

        created = updated = 0
        for concert in deduped:
            _, was_created = db.upsert_concert(conn, concert)
            created += was_created
            updated += not was_created

    merged_away = len(raw) - len(deduped)

    print("\n" + "─" * 44)
    print(f"{len(raw)} événement(s) brut(s) → {len(deduped)} concert(s) unique(s)", end="")
    print(f" ({merged_away} fusionné(s))" if merged_away else "")
    print(f"{created} concert(s) ajouté(s), {updated} mis à jour.")
    print(f"Base : {db.DB_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
