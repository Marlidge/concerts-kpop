import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConcertCard } from "@/components/ConcertCard";
import { getArtistBySlug, getConcertsByArtist } from "@/lib/data";
import { countryLabel, formatDate } from "@/lib/format";

/**
 * Page artiste (votre §15).
 *
 * Le nom du dossier, [slug], fait de cette page une route dynamique :
 * un seul fichier sert tous les artistes. /artistes/twice et
 * /artistes/babymetal passent tous les deux par ici, et la valeur du
 * slug arrive dans params.
 */

/** "ONE OK ROCK" → "OOR", "TWICE" → "T". Sert d'avatar tant qu'on n'a pas d'images. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: PageProps<"/artistes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);

  if (!artist) return { title: "Artiste introuvable" };

  return {
    title: `${artist.name} — concerts en France`,
    description: `Les prochains concerts de ${artist.name} en France.`,
  };
}

export default async function ArtistPage({
  params,
}: PageProps<"/artistes/[slug]">) {
  // params est une promesse dans cette version de Next.js : il faut l'attendre.
  const { slug } = await params;
  const artist = getArtistBySlug(slug);

  // Une URL inventée ne doit pas provoquer d'erreur, mais une page claire.
  if (!artist) notFound();

  const { upcoming, past } = getConcertsByArtist(artist.id);
  const isKpop = artist.genre === "kpop";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <Link
        href="/concerts"
        className="text-sm text-subtle underline-offset-4 transition hover:text-foreground hover:underline"
      >
        ← Tous les concerts
      </Link>

      <header className="mt-6 flex flex-wrap items-center gap-5">
        <div
          aria-hidden="true"
          className={`flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-semibold ${
            isKpop
              ? "bg-kpop-soft text-kpop-strong"
              : "bg-jpop-soft text-jpop-strong"
          }`}
        >
          {initials(artist.name)}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {artist.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isKpop
                  ? "bg-kpop-soft text-kpop-strong"
                  : "bg-jpop-soft text-jpop-strong"
              }`}
            >
              {isKpop ? "K-pop" : "J-pop"}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-subtle">
              {countryLabel(artist.country)}
            </span>
            {artist.subGenre && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-subtle">
                {artist.subGenre}
              </span>
            )}
            {artist.isFavorite && (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                Dans mes artistes
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Prochains concerts en France</h2>

        {upcoming.length === 0 ? (
          <p className="mt-5 rounded-card border border-border bg-surface p-8 text-center text-sm text-subtle">
            Aucun concert annoncé pour le moment.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} artist={artist} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Concerts passés</h2>

          {/* Présentation volontairement plus sobre que les cartes :
              ces concerts sont une archive, pas une invitation à réserver. */}
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {past.map((concert) => (
              <li
                key={concert.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
              >
                <span className="text-sm">{formatDate(concert.date)}</span>
                <span className="text-sm text-subtle">
                  {concert.venue} · {concert.city}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
