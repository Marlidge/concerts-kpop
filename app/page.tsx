import Link from "next/link";

import { ConcertCard } from "@/components/ConcertCard";
import { getArtistById, getUpcomingConcerts } from "@/lib/data";

/** L'accueil met en avant une sélection ; la page Concerts montre tout. */
const HIGHLIGHT_COUNT = 6;

export default function Home() {
  const concerts = getUpcomingConcerts(HIGHLIGHT_COUNT);
  const total = getUpcomingConcerts().length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          K-pop · J-pop · France
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Tous les concerts au même endroit.
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-subtle">
          Cherchez un artiste, une ville ou une salle, suivez vos groupes
          préférés et ne manquez plus une ouverture de billetterie.
        </p>

        {/* Mention honnête tant que les vraies sources ne sont pas branchées.
            Elle disparaîtra à l'étape 14. */}
        <p className="mt-6 inline-flex rounded-2xl bg-muted px-3.5 py-2 text-xs leading-relaxed text-subtle">
          Données de démonstration — les sources réelles arrivent bientôt.
        </p>
      </header>

      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">Prochains concerts</h2>
          <Link
            href="/concerts"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Voir les {total} concerts
          </Link>
        </div>

        {concerts.length === 0 ? (
          <p className="mt-6 rounded-card border border-border bg-surface p-8 text-center text-sm text-subtle">
            Aucun concert à venir pour le moment.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                artist={getArtistById(concert.artistId)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
