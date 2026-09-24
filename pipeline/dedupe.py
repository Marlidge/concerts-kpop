"""
Détection de doublons (votre §9).

Un même concert peut apparaître plusieurs fois dans les données brutes
— un article Ticketmaster séparé pour un pass VIP ou une option parking
(le cas réel d'ENHYPEN trouvé à l'étape 14), ou plus tard deux sources
différentes qui décrivent le même soir. Ce module les regroupe et n'en
garde qu'un.

Fonctions pures, comme normalize.py côté Python et lib/filters.ts côté
site : elles reçoivent une liste, en renvoient une plus courte, sans
toucher au réseau ni à la base. C'est ce qui les rend faciles à tester
(voir tests/test_dedupe.py) et réutilisables le jour où une deuxième
source rejoindra Ticketmaster.
"""

from __future__ import annotations

import unicodedata
from collections import defaultdict

from normalize import NormalizedConcert

# Quand deux entrées du même concert se contredisent sur son statut de
# billetterie, celle-ci l'emporte : une annulation ou une rupture de
# stock sont des signaux qu'on ne veut jamais perdre en fusionnant,
# même si une autre entrée dit encore "en vente".
_STATUS_PRIORITY = ["cancelled", "sold_out", "on_sale", "upcoming", "unknown"]


def _normalize_text(text: str) -> str:
    """Minuscules, sans accents — pour reconnaître "Accor Arena" et
    "ACCOR ARENA" comme la même salle."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").strip()


def _match_key(concert: NormalizedConcert) -> tuple[str, str, str]:
    """
    La clé qui définit "même concert" : même artiste, même date, même
    salle (votre §9). Le titre n'entre pas dans la clé volontairement —
    "ENHYPEN" et "PACKAGE ENHYPEN" sont deux titres différents pour le
    même soir, c'est justement le cas qu'il faut regrouper.
    """
    return (concert.artist_id, concert.date, _normalize_text(concert.venue))


def _pick_title(group: list[NormalizedConcert]) -> str:
    """
    Le titre le plus court l'emporte : les variantes vues en pratique
    ("PACKAGE ...", "PARKING ...") sont presque toujours le titre normal
    avec un mot ajouté, jamais l'inverse.
    """
    return min((c.title for c in group), key=len)


def _pick_status(group: list[NormalizedConcert]) -> str:
    statuses = {c.ticket_status for c in group}
    for status in _STATUS_PRIORITY:
        if status in statuses:
            return status
    return "unknown"


def _merge_group(group: list[NormalizedConcert]) -> NormalizedConcert:
    """Fusionne un groupe de doublons en une seule entrée."""
    if len(group) == 1:
        return group[0]

    kept_title = _pick_title(group)
    # Une fois le titre choisi, on s'aligne sur l'entrée qui le porte
    # pour les champs propres à "quel article a été vendu" (lien
    # officiel, source_id) : autant garder tout ce qui va ensemble.
    reference = next(c for c in group if c.title == kept_title)

    prices_min = [c.price_min for c in group if c.price_min is not None]
    prices_max = [c.price_max for c in group if c.price_max is not None]
    openings = [c.tickets_open_at for c in group if c.tickets_open_at]

    return NormalizedConcert(
        artist_id=reference.artist_id,
        title=kept_title,
        date=reference.date,
        time=reference.time,
        city=reference.city,
        region=reference.region,
        venue=reference.venue,
        address=next((c.address for c in group if c.address), None),
        genre=reference.genre,
        ticket_status=_pick_status(group),
        # La plus précoce : c'est le vrai moment d'ouverture qui compte
        # pour l'utilisateur, pas celui de l'option VIP annoncée après.
        tickets_open_at=min(openings) if openings else None,
        price_min=min(prices_min) if prices_min else None,
        price_max=max(prices_max) if prices_max else None,
        official_url=reference.official_url,
        image_url=next((c.image_url for c in group if c.image_url), None),
        source=reference.source,
        source_id=reference.source_id,
        first_seen_at=min(c.first_seen_at for c in group),
        updated_at=max(c.updated_at for c in group),
    )


def deduplicate(concerts: list[NormalizedConcert]) -> list[NormalizedConcert]:
    """
    Regroupe les concerts qui décrivent très probablement le même
    événement, puis fusionne chaque groupe en une seule entrée.

    L'ordre du résultat n'est pas garanti : le tri par date vient après,
    à la lecture (déjà fait côté site, lib/data.ts).
    """
    groups: dict[tuple[str, str, str], list[NormalizedConcert]] = defaultdict(list)
    for concert in concerts:
        groups[_match_key(concert)].append(concert)

    return [_merge_group(group) for group in groups.values()]
