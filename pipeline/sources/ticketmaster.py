"""
Client pour l'API Ticketmaster Discovery (votre §6, §7).

Ce module ne fait qu'une chose : parler à cette API et renvoyer ce
qu'elle répond, sans transformation. Il ne normalise rien, ne stocke
rien, ne connaît même pas la forme "Concert" du site — ce travail
viendra aux étapes suivantes (normalisation, déduplication).

Chaque future source (Bandsintown, OpenAgenda...) aura un module de
cette forme : une fonction qui prend une requête, renvoie des données
brutes. C'est ce qui permettra d'ajouter une source sans toucher aux
autres, comme le montre le schéma de votre §7.

Documentation officielle :
https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
"""

from __future__ import annotations

import ssl
from dataclasses import dataclass, field

import httpx
import truststore

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

# Vérifie les certificats HTTPS via le magasin de confiance du système
# d'exploitation plutôt que via le magasin embarqué dans le paquet
# certifi. Sans ça, un pare-feu ou un proxy qui intercepte le trafic
# HTTPS (courant sur un réseau d'entreprise ou d'établissement scolaire)
# fait échouer chaque requête avec une erreur de certificat.
def new_http_client(timeout: float = 10.0) -> httpx.Client:
    """Un client HTTP prêt à l'emploi, exporté pour être réutilisé tel
    quel par les scripts qui appellent search_events plusieurs fois."""
    ssl_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    return httpx.Client(timeout=timeout, verify=ssl_context)


class TicketmasterError(Exception):
    """Levée quand l'API répond, mais signale un problème (clé, quota, réseau)."""


@dataclass
class SearchResult:
    """Le résultat brut d'une recherche pour un artiste."""

    artist_query: str
    events: list[dict] = field(default_factory=list)
    # Nombre total annoncé par l'API, qui peut dépasser len(events) si
    # tous les résultats n'ont pas été récupérés (voir get_page ci-dessous).
    total_elements: int = 0


def search_events(
    artist_name: str,
    api_key: str,
    *,
    country_code: str = "FR",
    page_size: int = 50,
    client: httpx.Client | None = None,
) -> SearchResult:
    """
    Cherche les événements en France dont le mot-clé correspond à cet artiste.

    Pourquoi par mot-clé plutôt que par genre : le classement en genre
    de Ticketmaster est pensé pour le marché américain et se révèle
    incomplet ailleurs. Votre §5 refuse justement de dépendre d'un champ
    "genre" fourni par une API — chercher un artiste précis, par son nom,
    est la méthode la plus fiable dont on dispose ici.

    `client` permet de réutiliser une même connexion HTTP pour plusieurs
    appels (voir fetch_ticketmaster.py) plutôt que d'en ouvrir une par
    artiste, ce qui est à la fois plus rapide et plus poli envers l'API.
    """
    owns_client = client is None
    http_client = client or new_http_client()

    try:
        response = http_client.get(
            BASE_URL,
            params={
                "apikey": api_key,
                "keyword": artist_name,
                "countryCode": country_code,
                "classificationName": "music",
                "size": page_size,
                "sort": "date,asc",
            },
        )
    except httpx.RequestError as exc:
        # Pas de réponse du tout : réseau coupé, DNS, délai dépassé...
        # (votre §23 : une source indisponible ne doit pas planter le site)
        raise TicketmasterError(
            f"Réseau indisponible pour « {artist_name} » : {exc}"
        ) from exc
    finally:
        if owns_client:
            http_client.close()

    if response.status_code == 401:
        raise TicketmasterError(
            "Clé API refusée (401). Vérifiez TICKETMASTER_API_KEY dans .env.local."
        )
    if response.status_code == 429:
        raise TicketmasterError(
            "Quota de requêtes dépassé pour aujourd'hui (429)."
        )
    if response.status_code != 200:
        raise TicketmasterError(
            f"Réponse inattendue ({response.status_code}) pour « {artist_name} »."
        )

    payload = response.json()
    events = payload.get("_embedded", {}).get("events", [])
    total = payload.get("page", {}).get("totalElements", len(events))

    return SearchResult(artist_query=artist_name, events=events, total_elements=total)
