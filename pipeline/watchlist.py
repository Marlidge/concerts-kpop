"""
Liste de départ des artistes suivis par le pipeline (votre §5).

Ce n'est PAS la liste des artistes du site — c'est la liste des noms
que le pipeline interroge auprès des sources. Volontairement courte
au départ, et pensée pour être modifiée à la main : ajoutez une ligne
pour suivre un nouvel artiste, sans toucher au reste du code.

Elle recoupe en partie lib/mock-data.ts (les données fictives du site),
mais les deux resteront distinctes : celle-ci pilote la collecte,
l'autre nourrit l'interface tant que les vraies données ne sont pas
branchées.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class WatchedArtist:
    name: str
    country: str  # code ISO : "KR" ou "JP"
    genre: str  # "kpop" ou "jpop"


WATCHLIST: list[WatchedArtist] = [
    # --- K-pop ---
    WatchedArtist("TWICE", "KR", "kpop"),
    WatchedArtist("Stray Kids", "KR", "kpop"),
    WatchedArtist("LE SSERAFIM", "KR", "kpop"),
    WatchedArtist("SEVENTEEN", "KR", "kpop"),
    WatchedArtist("ATEEZ", "KR", "kpop"),
    WatchedArtist("ENHYPEN", "KR", "kpop"),
    WatchedArtist("aespa", "KR", "kpop"),
    WatchedArtist("NewJeans", "KR", "kpop"),
    # --- J-pop ---
    WatchedArtist("BABYMETAL", "JP", "jpop"),
    WatchedArtist("ONE OK ROCK", "JP", "jpop"),
    WatchedArtist("Aimer", "JP", "jpop"),
    WatchedArtist("YOASOBI", "JP", "jpop"),
    WatchedArtist("Official HIGE DANdism", "JP", "jpop"),
]
