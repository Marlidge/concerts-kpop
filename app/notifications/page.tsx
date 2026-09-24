import type { Metadata } from "next";

import { NotificationList } from "@/components/NotificationList";
import { getAllArtists, getUpcomingConcerts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Notifications — K-pop & J-pop en France",
  description: "Nouveaux concerts, artistes favoris et ouvertures de billetterie.",
};

export default function NotificationsPage() {
  const concerts = getUpcomingConcerts();
  const artists = getAllArtists();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Notifications
        </h1>
        <p className="mt-3 text-subtle">
          Nouveaux concerts, artistes favoris, ouvertures de billetterie.
        </p>
      </header>

      <div className="mt-10">
        <NotificationList concerts={concerts} artists={artists} />
      </div>
    </main>
  );
}
