# Pipeline de collecte

Partie Python du projet (votre §6, §7) : récupère les concerts auprès
des sources externes, les normalisera et les dédupliquera (étapes à
venir), puis les écrira en base (étape 14+).

Le site web (`app/`, `lib/`) et ce pipeline sont indépendants : ils ne
communiquent que par la base de données. Aucun des deux n'a besoin de
connaître le langage de l'autre.

## Installation

Depuis la racine du projet :

```bash
python -m venv pipeline/.venv
pipeline\.venv\Scripts\pip install -r pipeline\requirements.txt
```

Puis copiez `.env.example` vers `.env.local` à la racine du projet et
renseignez `TICKETMASTER_API_KEY` (clé gratuite sur
[developer.ticketmaster.com](https://developer.ticketmaster.com/)).

## Scripts

| Fichier | Rôle |
|---|---|
| `fetch_ticketmaster.py` | Interroge Ticketmaster pour les artistes de `watchlist.py` et enregistre les réponses brutes dans `data/raw/` — sert à vérifier ce que la source couvre réellement. |
| `sources/ticketmaster.py` | Le client HTTP proprement dit : une fonction, `search_events`, qui ne fait que parler à l'API. |
| `watchlist.py` | La liste des artistes suivis par le pipeline. Modifiable à la main. |

Lancer une exploration :

```bash
pipeline\.venv\Scripts\python pipeline\fetch_ticketmaster.py
```

## Pourquoi une recherche par nom d'artiste, pas par genre

Le classement en genre de Ticketmaster est pensé pour le marché
américain et reste incomplet ailleurs. Le pipeline cherche donc chaque
artiste de `watchlist.py` par son nom, ce qui correspond à la décision
du site de ne pas dépendre d'un champ « genre » fourni par une API
(votre §5).

## `data/`

Les réponses brutes des sources sont enregistrées ici pour inspection.
Ce dossier n'est pas versionné (voir `.gitignore`) : ce sont des
données re-téléchargeables, pas du code.
