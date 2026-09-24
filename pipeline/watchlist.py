"""
Liste de départ des artistes suivis par le pipeline (votre §5).

Ce n'est PAS la liste des artistes du site — c'est la liste des noms
que le pipeline interroge auprès des sources. Pensée pour être modifiée
à la main : ajoutez une ligne pour suivre un nouvel artiste, sans
toucher au reste du code.

Élargie à l'étape 14 (13 → 41 artistes) après un premier essai jugé
trop étroit pour juger honnêtement la couverture réelle d'une source.

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
    # --- K-pop : groupes ---
    WatchedArtist("TWICE", "KR", "kpop"),
    WatchedArtist("Stray Kids", "KR", "kpop"),
    WatchedArtist("LE SSERAFIM", "KR", "kpop"),
    WatchedArtist("SEVENTEEN", "KR", "kpop"),
    WatchedArtist("ATEEZ", "KR", "kpop"),
    WatchedArtist("ENHYPEN", "KR", "kpop"),
    WatchedArtist("aespa", "KR", "kpop"),
    WatchedArtist("NewJeans", "KR", "kpop"),
    WatchedArtist("BLACKPINK", "KR", "kpop"),
    WatchedArtist("BTS", "KR", "kpop"),
    WatchedArtist("EXO", "KR", "kpop"),
    WatchedArtist("(G)I-DLE", "KR", "kpop"),
    WatchedArtist("ITZY", "KR", "kpop"),
    WatchedArtist("TOMORROW X TOGETHER", "KR", "kpop"),
    WatchedArtist("NCT DREAM", "KR", "kpop"),
    WatchedArtist("NCT 127", "KR", "kpop"),
    WatchedArtist("IVE", "KR", "kpop"),
    WatchedArtist("Red Velvet", "KR", "kpop"),
    WatchedArtist("MONSTA X", "KR", "kpop"),
    WatchedArtist("GOT7", "KR", "kpop"),
    WatchedArtist("SHINee", "KR", "kpop"),
    WatchedArtist("Super Junior", "KR", "kpop"),
    WatchedArtist("BIGBANG", "KR", "kpop"),
    WatchedArtist("ZEROBASEONE", "KR", "kpop"),
    WatchedArtist("RIIZE", "KR", "kpop"),
    # --- K-pop : solistes ---
    WatchedArtist("IU", "KR", "kpop"),
    WatchedArtist("G-Dragon", "KR", "kpop"),
    WatchedArtist("Jimin", "KR", "kpop"),
    WatchedArtist("Jungkook", "KR", "kpop"),
    WatchedArtist("Agust D", "KR", "kpop"),
    # --- J-pop : groupes et solistes ---
    WatchedArtist("BABYMETAL", "JP", "jpop"),
    WatchedArtist("ONE OK ROCK", "JP", "jpop"),
    WatchedArtist("Aimer", "JP", "jpop"),
    WatchedArtist("YOASOBI", "JP", "jpop"),
    WatchedArtist("Official HIGE DANdism", "JP", "jpop"),
    WatchedArtist("Perfume", "JP", "jpop"),
    WatchedArtist("Ado", "JP", "jpop"),
    WatchedArtist("King Gnu", "JP", "jpop"),
    WatchedArtist("LiSA", "JP", "jpop"),
    WatchedArtist("Kenshi Yonezu", "JP", "jpop"),
    WatchedArtist("Fujii Kaze", "JP", "jpop"),
    WatchedArtist("Hikaru Utada", "JP", "jpop"),
]
