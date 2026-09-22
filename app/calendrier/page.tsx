import type { Metadata } from "next";

import { ConcertCalendar } from "@/components/ConcertCalendar";
import { getAllArtists, getAllConcerts, getUpcomingConcerts } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata: Metadata = {
  title: "Calendrier — K-pop & J-pop en France",
  description:
    "Le calendrier des concerts K-pop et J-pop en France, mois par mois.",
};

export default function CalendarPage() {
  // Le calendrier affiche aussi les concerts passés : on peut remonter
  // dans les mois précédents.
  const concerts = getAllConcerts();
  const artists = getAllArtists();
  const today = todayISO();

  /**
   * On ouvre sur le mois du prochain concert plutôt que sur le mois en
   * cours : afficher d'emblée une grille vide donnerait l'impression
   * que le site ne contient rien.
   */
  const [nextConcert] = getUpcomingConcerts(1);
  const initialMonth = (nextConcert?.date ?? today).slice(0, 7);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Calendrier
        </h1>
        <p className="mt-3 text-subtle">
          Les concerts mois par mois. Cliquez sur un jour pour voir le détail.
        </p>
      </header>

      <ConcertCalendar
        concerts={concerts}
        artists={artists}
        initialMonth={initialMonth}
        today={today}
      />
    </main>
  );
}
