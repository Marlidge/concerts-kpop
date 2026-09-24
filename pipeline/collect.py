"""
Le pipeline complet : Ticketmaster → normalisation → SQLite (votre §7).

C'est le script "sérieux" — celui qui sera relancé régulièrement à
l'étape 17. fetch_ticketmaster.py reste l'outil d'exploration qui a
servi à mesurer la couverture réelle de la source ; celui-ci écrit
vraiment dans la base.

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
from normalize import normalize_event
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


def main() -> None:
    api_key = load_api_key()

    created = updated = 0
    errors: list[tuple[str, str]] = []

    with db.connect() as conn, new_http_client() as client:
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
                errors.append((artist.name, str(exc)))
                continue

            for event in result.events:
                concert = normalize_event(event, artist, artist_id)
                _, was_created = db.upsert_concert(conn, concert)
                created += was_created
                updated += not was_created

            if result.events:
                print(
                    f"  [{index}/{len(WATCHLIST)}] {artist.name:<24} "
                    f"→ {len(result.events)} concert(s) en base"
                )

            if index < len(WATCHLIST):
                time.sleep(DELAY_BETWEEN_CALLS)

    print("\n" + "─" * 44)
    print(f"{created} concert(s) ajouté(s), {updated} mis à jour.")
    if errors:
        print(f"{len(errors)} artiste(s) en erreur.")
    print(f"Base : {db.DB_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
