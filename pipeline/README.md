# Pipeline de collecte

Partie Python du projet (votre §6, §7) : récupère les concerts auprès
des sources externes, les normalise, détecte les doublons, les écrit
en base, et s'actualise automatiquement tous les jours (voir
`.github/workflows/collect.yml`).

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
| `dedupe.py` | Regroupe les événements qui décrivent le même concert (même artiste, même date, même salle) en une seule entrée (votre §9). |
| `db.py` | Schéma et écriture SQLite. Rejouable sans effet de bord : relancer `collect.py` deux fois ne duplique rien (clé `source` + `source_id`). Marque aussi "unknown" les concerts qu'une source ne confirme plus, sans jamais les supprimer. |
| `watchlist.py` | La liste des artistes suivis. Modifiable à la main. |
| `tests/` | 27 tests pytest sur la normalisation, la déduplication et le stockage (votre §28). |

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

## Tests

```bash
pipeline\.venv\Scripts\pytest pipeline
```

## Actualisation automatique (étape 17)

`.github/workflows/collect.yml` relance `collect.py` chaque jour à 6h
UTC, et sur demande via le bouton "Run workflow" de l'onglet **Actions**
du dépôt GitHub. Le robot committe `pipeline/data/concerts.db` à chaque
fois qu'elle change, sous l'identité `github-actions[bot]` — ses
commits se distinguent donc facilement des vôtres dans l'historique.

**Pourquoi `concerts.db` est versionné alors que le reste de `data/`
ne l'est pas :** les machines qui exécutent GitHub Actions repartent de
zéro à chaque lancement, sans mémoire de la fois précédente. Committer
le fichier est ce qui lui permet de survivre d'une exécution à l'autre,
sans dépendre d'un service de base de données hébergé. Limite assumée :
l'historique Git grossit un peu à chaque collecte — sans conséquence à
l'échelle d'un projet personnel, à reconsidérer si le volume de données
grossit beaucoup.

La clé `TICKETMASTER_API_KEY` est enregistrée dans les secrets du
dépôt GitHub (Settings → Secrets and variables → Actions), pas dans le
code : chiffrée, invisible même dans les journaux d'exécution.

## `data/`

Les réponses brutes des sources (`data/raw/`) sont enregistrées pour
inspection et ne sont pas versionnées : ce sont des données
re-téléchargeables, pas du code. `data/concerts.db`, lui, l'est
(voir ci-dessus).
