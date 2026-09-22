import Link from "next/link";

import {
  formatDate,
  formatOpening,
  formatPrice,
  formatTime,
  isRecent,
} from "@/lib/format";
import type { Artist, Concert, TicketStatus } from "@/lib/types";

/**
 * Carte d'un concert (votre §13).
 *
 * Toute la difficulté est là : chaque information peut manquer. La carte
 * ne suppose jamais qu'un prix, une heure ou un lien existe — elle
 * affiche la ligne quand l'information est là, et la retire sinon,
 * plutôt que de montrer un vide ou un bouton mort.
 */

/** Badge affiché en haut à droite. null = aucun badge nécessaire. */
const STATUS_BADGE: Record<TicketStatus, string | null> = {
  on_sale: null, // le bouton "Billetterie" suffit
  upcoming: "Bientôt",
  sold_out: "Complet",
  cancelled: "Annulé",
  unknown: null, // on préfère ne rien dire que dire faux
};

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className="size-4 shrink-0 text-subtle"
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-subtle"
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-subtle"
    >
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2.5 2.5 0 0 0 0 5v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2.5 2.5 0 0 0 0-5V8Z" />
      <path d="M14 6v12" strokeDasharray="2 3" />
    </svg>
  );
}

type Props = {
  concert: Concert;
  artist?: Artist;
};

export function ConcertCard({ concert, artist }: Props) {
  const isKpop = concert.genre === "kpop";
  const isCancelled = concert.ticketStatus === "cancelled";

  const time = formatTime(concert.time);
  const price = formatPrice(concert.priceMin, concert.priceMax);
  const opening = formatOpening(concert.ticketsOpenAt);
  const statusBadge = STATUS_BADGE[concert.ticketStatus];
  const showNew = isRecent(concert.firstSeenAt) && !isCancelled;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition duration-200 hover:-translate-y-0.5 ${
        isCancelled ? "opacity-70" : ""
      }`}
    >
      {/* Bandeau teinté selon le genre — il tient lieu d'image tant que
          les sources réelles ne nous en fournissent pas. */}
      <div
        className={`flex h-28 flex-col justify-between p-4 ${
          isKpop ? "bg-kpop-soft" : "bg-jpop-soft"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={`rounded-full bg-surface/70 px-2.5 py-1 text-[11px] font-semibold ${
              isKpop ? "text-kpop-strong" : "text-jpop-strong"
            }`}
          >
            {isKpop ? "K-pop" : "J-pop"}
          </span>

          <div className="flex flex-wrap justify-end gap-1.5">
            {showNew && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary">
                Nouveau
              </span>
            )}
            {statusBadge && (
              <span className="rounded-full bg-surface/70 px-2.5 py-1 text-[11px] font-semibold text-subtle">
                {statusBadge}
              </span>
            )}
          </div>
        </div>

        <h3
          className={`text-xl font-semibold leading-tight ${
            isKpop ? "text-kpop-strong" : "text-jpop-strong"
          }`}
        >
          {/* Seul le nom est cliquable, pas la carte entière : celle-ci
              contient déjà un lien vers la billetterie, et deux liens
              imbriqués seraient invalides autant qu'imprévisibles. */}
          {artist ? (
            <Link
              href={`/artistes/${artist.slug}`}
              className="underline-offset-4 transition hover:underline"
            >
              {artist.name}
            </Link>
          ) : (
            "Artiste inconnu"
          )}
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-snug text-subtle">{concert.title}</p>

        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2.5">
            <CalendarIcon />
            <span>
              {formatDate(concert.date)}
              {time && <span className="text-subtle"> · {time}</span>}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <PinIcon />
            <span>
              {concert.venue}
              <span className="text-subtle"> · {concert.city}</span>
            </span>
          </li>
          {price && (
            <li className="flex items-center gap-2.5">
              <TicketIcon />
              <span>{price}</span>
            </li>
          )}
        </ul>

        {/* Le pied de carte s'adapte à l'état de la billetterie. */}
        <div className="mt-auto pt-1">
          {isCancelled ? (
            <p className="text-sm text-subtle">Ce concert a été annulé.</p>
          ) : concert.ticketStatus === "upcoming" ? (
            <div className="flex flex-col gap-2">
              {opening && (
                <p className="text-sm text-subtle">
                  Billetterie le <span className="text-foreground">{opening}</span>
                </p>
              )}
              {concert.officialUrl && (
                <a
                  href={concert.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center rounded-full bg-muted px-4 py-2 text-sm font-medium transition hover:bg-primary-soft"
                >
                  Voir l&apos;annonce
                </a>
              )}
            </div>
          ) : concert.ticketStatus === "sold_out" ? (
            <p className="text-sm text-subtle">Complet — plus de places.</p>
          ) : concert.officialUrl ? (
            <a
              href={concert.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Billetterie — ${artist?.name ?? concert.title}`}
              className="inline-flex w-fit items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            >
              Billetterie
            </a>
          ) : (
            <p className="text-sm text-subtle">Billetterie non communiquée.</p>
          )}
        </div>
      </div>
    </article>
  );
}
