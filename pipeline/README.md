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
| `fetch_ticketmaster.py` | Exploration : interroge Ticketmaster et enregistre les réponses brutes dans `data/raw/`, sans rien écrire en base. Sert à vérifier ce qu'une source couvre réellement avant de lui faire confiance. |
| `collect.py` | Le pipeline complet : interroge Ticketmaster, normalise chaque résultat, l'écrit dans `data/concerts.db`. C'est celui qui sera relancé régulièrement (étape 17). |
| `sources/ticketmaster.py` | Le client HTTP : une fonction, `search_events`, qui ne fait que parler à l'API. |
| `normalize.py` | Convertit un événement brut en la forme `Concert` du site (`lib/types.ts`). Ne connaît ni HTTP ni SQLite. |
| `db.py` | Schéma et écriture SQLite. Rejouable sans effet de bord : relancer `collect.py` deux fois ne duplique rien (clé `source` + `source_id`). |
| `watchlist.py` | La liste des artistes suivis. Modifiable à la main. |

Lancer une exploration (sans écrire en base) :

```bash
pipeline\.venv\Scripts\python pipeline\fetch_ticketmaster.py
```

Lancer la collecte réelle (écrit dans `data/concerts.db`) :

```bash
pipeline\.venv\Scripts\python pipeline\collect.py
```

## Pourquoi le site n'utilise pas encore cette base

`data/concerts.db` existe et se remplit, mais `app/`/`lib/` continuent
de lire `lib/mock-data.ts`. Ce n'est pas un oubli : à l'étape 14, la
source réelle ne couvre que 3 concerts, tous K-pop, tous en
région parisienne. Brancher le site dessus maintenant appauvrirait
l'interface (adieu les cas « complet », « annulé », les villes variées)
pour un gain de réalisme minime. Le branchement définitif viendra une
fois la déduplication en place et le volume de données suffisant.

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
