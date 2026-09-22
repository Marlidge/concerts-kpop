import type { Metadata } from "next";

import { ArtistDirectory } from "@/components/ArtistDirectory";
import { getAllArtists, getConcertsByArtist } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mes artistes — K-pop & J-pop en France",
  description:
    "Suivez vos artistes K-pop et J-pop préférés et retrouvez leurs prochains concerts en France.",
};

export default function MyArtistsPage() {
  const artists = getAllArtists();

  // Le comptage se fait sur le serveur : le navigateur reçoit un résultat
  // déjà calculé plutôt que la totalité des concerts.
  const upcomingCounts = Object.fromEntries(
    artists.map((artist) => [
      artist.id,
      getConcertsByArtist(artist.id).upcoming.length,
    ]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Mes artistes
        </h1>
        <p className="mt-3 text-subtle">
          Les artistes que vous suivez restent enregistrés sur cet appareil.
        </p>
      </header>

      <ArtistDirectory artists={artists} upcomingCounts={upcomingCounts} />
    </main>
  );
}
