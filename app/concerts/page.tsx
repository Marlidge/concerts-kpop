import type { Metadata } from "next";

import { ConcertBrowser } from "@/components/ConcertBrowser";
import { getAllArtists, getUpcomingConcerts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Concerts — K-pop & J-pop en France",
  description:
    "Tous les concerts K-pop et J-pop à venir en France, filtrables par genre, ville et mois.",
};

export default function ConcertsPage() {
  // La page reste un composant serveur : elle charge les données et les
  // transmet. Seule la partie interactive est côté navigateur.
  const concerts = getUpcomingConcerts();
  const artists = getAllArtists();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Concerts
        </h1>
        <p className="mt-3 text-subtle">
          Tous les concerts à venir en France. Les filtres se combinent.
        </p>
      </header>

      <div className="mt-10">
        <ConcertBrowser concerts={concerts} artists={artists} />
      </div>
    </main>
  );
}
