import type { Metadata } from "next";
import { Suspense } from "react";

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

      {/* ConcertBrowser lit l'adresse de la page. Next.js demande alors
          un <Suspense> : sans lui, la page ne peut plus être préparée à
          l'avance et la compilation échoue — alors même que tout
          fonctionne en développement. */}
      <div className="mt-10">
        <Suspense
          fallback={<p className="text-sm text-subtle">Chargement…</p>}
        >
          <ConcertBrowser concerts={concerts} artists={artists} />
        </Suspense>
      </div>
    </main>
  );
}
