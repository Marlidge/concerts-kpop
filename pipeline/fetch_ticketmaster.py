"""
Script d'exploration : que trouve réellement Ticketmaster en France
pour les artistes de la liste de suivi ?

C'est un script de VÉRIFICATION, pas encore le pipeline définitif. Son
seul but est de répondre honnêtement à une question : cette source
couvre-t-elle assez le K-pop et le J-pop en France pour être utile ?
La normalisation vers le modèle Concert et la déduplication viendront
aux étapes suivantes, une fois cette réponse en main.

Utilisation, depuis la racine du projet :
    pipeline\\.venv\\Scripts\\python.exe pipeline\\fetch_ticketmaster.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

from sources.ticketmaster import TicketmasterError, new_http_client, search_events
from watchlist import WATCHLIST

# La console Windows n'affiche pas toujours l'UTF-8 par défaut ; sans
# cette ligne, les accents du script ("é", "à"...) peuvent soit
# s'afficher mal, soit provoquer une erreur qui arrête le script.
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = Path(__file__).resolve().parent / "data" / "raw" / "ticketmaster"

# Le compte gratuit Ticketmaster limite à 5 requêtes/seconde. Cette pause
# garde une marge confortable plutôt que de flirter avec la limite
# (votre §21 : éviter les requêtes inutiles, donc rester poli avec la source).
DELAY_BETWEEN_CALLS = 0.3  # secondes


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def load_api_key() -> str:
    """
    Charge la clé depuis .env.local, à la racine du projet.

    Un message clair plutôt qu'une erreur Python brute si la clé manque :
    c'est la première chose que rencontrera quiconque clone le dépôt
    (votre §23, et votre §27 sur les instructions d'installation).
    """
    load_dotenv(PROJECT_ROOT / ".env.local")
    api_key = os.environ.get("TICKETMASTER_API_KEY", "").strip()

    if not api_key:
        print(
            "Clé API manquante.\n"
            "\n"
            "  1. Copiez .env.example vers .env.local à la racine du projet\n"
            "  2. Obtenez une clé gratuite sur https://developer.ticketmaster.com/\n"
            "  3. Collez-la dans .env.local : TICKETMASTER_API_KEY=votre_cle\n",
            file=sys.stderr,
        )
        sys.exit(1)

    return api_key


def main() -> None:
    api_key = load_api_key()
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Recherche de {len(WATCHLIST)} artistes sur Ticketmaster (France)…\n")

    results = []
    errors = []

    # Un seul client HTTP réutilisé pour tous les appels, plutôt qu'une
    # connexion ouverte et fermée à chaque artiste.
    with new_http_client() as client:
        for index, artist in enumerate(WATCHLIST, start=1):
            try:
                result = search_events(artist.name, api_key, client=client)
            except TicketmasterError as exc:
                print(f"  [{index}/{len(WATCHLIST)}] {artist.name:<24} → erreur : {exc}")
                errors.append((artist.name, str(exc)))
                continue

            count = len(result.events)
            print(f"  [{index}/{len(WATCHLIST)}] {artist.name:<24} → {count} événement(s)")

            # On garde la réponse brute pour pouvoir l'inspecter à la
            # main : c'est elle qui dira ce que l'étape 15 devra nettoyer.
            raw_path = RAW_DATA_DIR / f"{slugify(artist.name)}.json"
            raw_path.write_text(
                json.dumps(result.events, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            results.append((artist, result))

            if index < len(WATCHLIST):
                time.sleep(DELAY_BETWEEN_CALLS)

    total_events = sum(len(result.events) for _, result in results)
    artists_with_events = sum(1 for _, result in results if result.events)

    print("\n" + "─" * 44)
    print(f"Total : {total_events} événement(s) trouvé(s)")
    print(f"Artistes avec au moins un résultat : {artists_with_events}/{len(WATCHLIST)}")
    if errors:
        print(f"Artistes en erreur : {len(errors)}")
    print(f"\nDonnées brutes enregistrées dans : {RAW_DATA_DIR.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
