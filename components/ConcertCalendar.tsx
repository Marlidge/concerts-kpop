"use client";

/**
 * Calendrier mensuel (votre §17).
 *
 * Interaction volontairement unique : on clique sur un jour, et les
 * concerts de ce jour s'affichent en dessous. Sur téléphone, cliquer
 * une petite pastille dans une case de 40 pixels serait pénible ; une
 * case entière est une cible confortable.
 */

import { useMemo, useState } from "react";

import { ConcertCard } from "@/components/ConcertCard";
import {
  buildMonthGrid,
  formatMonth,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import type { Artist, Concert } from "@/lib/types";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
    </svg>
  );
}

type Props = {
  concerts: Concert[];
  artists: Artist[];
  /** Mois affiché au premier chargement. */
  initialMonth: string;
  /** Date du jour, calculée sur le serveur pour éviter toute incohérence. */
  today: string;
};

export function ConcertCalendar({
  concerts,
  artists,
  initialMonth,
  today,
}: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const artistsById = useMemo(
    () => new Map(artists.map((artist) => [artist.id, artist])),
    [artists],
  );

  /**
   * Les concerts regroupés par date.
   *
   * Sans ce regroupement, chaque case du calendrier devrait parcourir
   * la liste entière — 42 cases × tous les concerts. Ici, une case
   * consulte directement sa date.
   */
  const concertsByDate = useMemo(() => {
    const map = new Map<string, Concert[]>();
    for (const concert of concerts) {
      const existing = map.get(concert.date);
      if (existing) existing.push(concert);
      else map.set(concert.date, [concert]);
    }
    return map;
  }, [concerts]);

  const days = useMemo(() => buildMonthGrid(month, today), [month, today]);

  function goToMonth(delta: number) {
    setMonth((current) => shiftMonth(current, delta));
    setSelectedDate(null);
  }

  const selectedConcerts = selectedDate
    ? (concertsByDate.get(selectedDate) ?? [])
    : [];

  const monthCount = days.filter(
    (day) => day.isCurrentMonth && concertsByDate.has(day.date),
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Mois précédent"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-subtle transition hover:text-foreground"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Mois suivant"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-subtle transition hover:text-foreground"
          >
            <ChevronIcon direction="right" />
          </button>

          <h2 className="ml-2 text-lg font-semibold" aria-live="polite">
            {formatMonth(month)}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-subtle">
            {monthCount === 0
              ? "Aucun concert ce mois-ci"
              : `${monthCount} jour${monthCount > 1 ? "s" : ""} de concert`}
          </span>
          <button
            type="button"
            onClick={() => {
              setMonth(initialMonth);
              setSelectedDate(null);
            }}
            className="rounded-full px-3 py-1.5 text-sm text-subtle underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Revenir
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-2.5 text-center text-xs font-medium text-subtle"
            >
              {/* Une seule lettre suffit sur téléphone. */}
              <span className="sm:hidden">{label.charAt(0).toUpperCase()}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayConcerts = concertsByDate.get(day.date) ?? [];
            const hasConcerts = dayConcerts.length > 0;
            const isSelected = day.date === selectedDate;

            return (
              <div
                key={day.date}
                // Les cases dessinent leurs séparateurs, sauf celles de la
                // dernière colonne et de la dernière ligne : leur bordure
                // doublerait celle de la carte.
                className={`min-h-20 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0 sm:min-h-24 ${
                  day.isCurrentMonth ? "" : "bg-muted/40"
                }`}
              >
                {hasConcerts ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDate(isSelected ? null : day.date)
                    }
                    aria-pressed={isSelected}
                    aria-label={`${formatDate(day.date)} — ${dayConcerts.length} concert${dayConcerts.length > 1 ? "s" : ""}`}
                    className={`flex h-full w-full flex-col gap-1 rounded-lg p-1 text-left transition ${
                      isSelected ? "bg-primary-soft" : "hover:bg-muted"
                    }`}
                  >
                    <DayNumber day={day} />

                    {/* Sur téléphone : une pastille par concert.
                        Au-delà : le nom de l'artiste. */}
                    <span className="flex flex-wrap gap-1 sm:hidden">
                      {dayConcerts.map((concert) => (
                        <span
                          key={concert.id}
                          className={`size-1.5 rounded-full ${
                            concert.genre === "kpop" ? "bg-kpop" : "bg-jpop"
                          }`}
                        />
                      ))}
                    </span>

                    <span className="hidden flex-col gap-1 sm:flex">
                      {dayConcerts.slice(0, 2).map((concert) => (
                        <span
                          key={concert.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            concert.genre === "kpop"
                              ? "bg-kpop-soft text-kpop-strong"
                              : "bg-jpop-soft text-jpop-strong"
                          }`}
                        >
                          {artistsById.get(concert.artistId)?.name ?? "Concert"}
                        </span>
                      ))}
                      {dayConcerts.length > 2 && (
                        <span className="px-1.5 text-[11px] text-subtle">
                          +{dayConcerts.length - 2}
                        </span>
                      )}
                    </span>
                  </button>
                ) : (
                  <div className="p-1">
                    <DayNumber day={day} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        {selectedDate === null ? (
          <p className="text-sm text-subtle">
            Cliquez sur un jour coloré pour voir les concerts.
          </p>
        ) : (
          <>
            <h3 className="text-lg font-semibold">
              {formatDate(selectedDate)}
            </h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {selectedConcerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  artist={artistsById.get(concert.artistId)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DayNumber({
  day,
}: {
  day: { dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean };
}) {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
        day.isToday
          ? "bg-primary font-semibold text-on-primary"
          : day.isCurrentMonth
            ? "text-foreground"
            : "text-subtle/60"
      }`}
    >
      {day.dayOfMonth}
    </span>
  );
}
