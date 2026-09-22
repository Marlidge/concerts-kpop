"use client";

/**
 * Page "Mes artistes" (votre §16).
 *
 * Deux sections : ceux que vous suivez, puis tous les autres, pour
 * pouvoir en ajouter sans quitter la page.
 */

import Link from "next/link";
import { useMemo, useState } from "react";

import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/components/useFavorites";
import { countryLabel } from "@/lib/format";
import { normalize } from "@/lib/filters";
import type { Artist } from "@/lib/types";

type Props = {
  artists: Artist[];
  /** Nombre de concerts à venir par artiste, calculé sur le serveur. */
  upcomingCounts: Record<string, number>;
};

function ArtistRow({
  artist,
  upcoming,
}: {
  artist: Artist;
  upcoming: number;
}) {
  const isKpop = artist.genre === "kpop";

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isKpop
            ? "bg-kpop-soft text-kpop-strong"
            : "bg-jpop-soft text-jpop-strong"
        }`}
      >
        {artist.name
          .split(/\s+/)
          .slice(0, 3)
          .map((word) => word[0])
          .join("")
          .toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <Link
          href={`/artistes/${artist.slug}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {artist.name}
        </Link>
        <p className="mt-0.5 text-sm text-subtle">
          {isKpop ? "K-pop" : "J-pop"} · {countryLabel(artist.country)}
          {upcoming > 0
            ? ` · ${upcoming} concert${upcoming > 1 ? "s" : ""} à venir`
            : " · aucun concert annoncé"}
        </p>
      </div>

      <FavoriteButton artistId={artist.id} artistName={artist.name} />
    </li>
  );
}

export function ArtistDirectory({ artists, upcomingCounts }: Props) {
  const { favorites, isLoaded } = useFavorites();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    if (words.length === 0) return artists;

    return artists.filter((artist) => {
      const haystack = normalize(artist.name);
      return words.every((word) => haystack.includes(word));
    });
  }, [artists, search]);

  const followed = visible.filter((artist) => favorites.includes(artist.id));
  const others = visible.filter((artist) => !favorites.includes(artist.id));

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un artiste…"
        aria-label="Rechercher un artiste"
        className="w-full max-w-md rounded-full border border-border bg-surface px-5 py-3 text-sm transition placeholder:text-subtle focus:border-primary focus:outline-none"
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Mes artistes
          {isLoaded && followed.length > 0 && (
            <span className="ml-2 text-sm font-normal text-subtle">
              {followed.length}
            </span>
          )}
        </h2>

        {/* isLoaded évite d'annoncer "aucun artiste suivi" pendant la
            fraction de seconde où le navigateur n'a pas encore été lu. */}
        {!isLoaded ? (
          <p className="mt-5 text-sm text-subtle">Chargement…</p>
        ) : followed.length === 0 ? (
          <p className="mt-5 rounded-card border border-border bg-surface p-8 text-center text-sm text-subtle">
            Vous ne suivez aucun artiste pour l&apos;instant. Touchez le cœur
            pour en ajouter.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {followed.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                upcoming={upcomingCounts[artist.id] ?? 0}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Tous les artistes</h2>

        {others.length === 0 ? (
          <p className="mt-5 text-sm text-subtle">
            {visible.length === 0
              ? "Aucun artiste ne correspond à cette recherche."
              : "Vous suivez déjà tous les artistes de la base."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {others.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                upcoming={upcomingCounts[artist.id] ?? 0}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
