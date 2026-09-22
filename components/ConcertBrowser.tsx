"use client";

/**
 * Recherche et filtres combinables.
 *
 * La directive "use client" en tête de fichier est la frontière la plus
 * importante de Next.js : elle dit "ce composant a besoin du navigateur".
 * Sans elle, impossible d'utiliser useState ni de réagir à une frappe au
 * clavier, car le composant serait calculé une seule fois sur le serveur.
 *
 * Tout le reste du site — pages, cartes — demeure côté serveur. On ne
 * rend "client" que le strict nécessaire : c'est ce qui garde le site
 * léger et rapide.
 */

import { useMemo, useState } from "react";

import { ConcertCard } from "@/components/ConcertCard";
import {
  filterConcerts,
  getCityFacets,
  getMonthFacets,
  hasActiveFilters,
  NO_FILTERS,
  type ConcertFilters,
} from "@/lib/filters";
import type { Artist, Concert } from "@/lib/types";

const GENRES = [
  { value: "all", label: "Tous" },
  { value: "kpop", label: "K-pop" },
  { value: "jpop", label: "J-pop" },
] as const;

const selectClass =
  "rounded-full border border-border bg-surface px-4 py-2 text-sm transition hover:border-primary focus:border-primary focus:outline-none";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-subtle"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

type Props = {
  concerts: Concert[];
  artists: Artist[];
};

export function ConcertBrowser({ concerts, artists }: Props) {
  const [filters, setFilters] = useState<ConcertFilters>(NO_FILTERS);

  /** Modifie un seul filtre sans effacer les autres : ils se combinent. */
  function update(patch: Partial<ConcertFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  // useMemo évite de tout recalculer à chaque frappe si rien n'a changé.
  const artistsById = useMemo(
    () => new Map(artists.map((artist) => [artist.id, artist])),
    [artists],
  );
  const cities = useMemo(() => getCityFacets(concerts), [concerts]);
  const months = useMemo(() => getMonthFacets(concerts), [concerts]);
  const results = useMemo(
    () => filterConcerts(concerts, artists, filters),
    [concerts, artists, filters],
  );

  const isFiltered = hasActiveFilters(filters);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <label htmlFor="search" className="sr-only">
            Rechercher un artiste, une ville, une salle ou un événement
          </label>
          <SearchIcon />
          <input
            id="search"
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Artiste, ville, salle…"
            className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-sm transition placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Genre : trois boutons plutôt qu'une liste, c'est le filtre
              le plus utilisé et il mérite d'être visible d'un coup d'œil. */}
          <div
            role="group"
            aria-label="Filtrer par genre"
            className="inline-flex rounded-full border border-border bg-surface p-1"
          >
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                type="button"
                onClick={() => update({ genre: genre.value })}
                aria-pressed={filters.genre === genre.value}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filters.genre === genre.value
                    ? "bg-primary text-on-primary"
                    : "text-subtle hover:text-foreground"
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filtrer par ville"
            value={filters.city}
            onChange={(event) => update({ city: event.target.value })}
            className={selectClass}
          >
            <option value="all">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label} ({city.count})
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrer par mois"
            value={filters.month}
            onChange={(event) => update({ month: event.target.value })}
            className={selectClass}
          >
            <option value="all">Tous les mois</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label} ({month.count})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => update({ onlyOnSale: !filters.onlyOnSale })}
            aria-pressed={filters.onlyOnSale}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filters.onlyOnSale
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-subtle hover:text-foreground"
            }`}
          >
            Billetterie ouverte
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="rounded-full px-3 py-2 text-sm text-subtle underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-subtle" aria-live="polite">
        {results.length === 0
          ? "Aucun concert"
          : `${results.length} concert${results.length > 1 ? "s" : ""}`}
        {isFiltered && concerts.length !== results.length
          ? ` sur ${concerts.length}`
          : ""}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface p-10 text-center">
          <p className="text-sm text-subtle">
            Aucun concert ne correspond à cette recherche.
          </p>
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((concert) => (
            <ConcertCard
              key={concert.id}
              concert={concert}
              artist={artistsById.get(concert.artistId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
