"use client";

/**
 * Petite cloche dans l'en-tête, avec le nombre de notifications non
 * lues. Reçoit les concerts et artistes en props (calculés côté
 * serveur dans app/layout.tsx) et les combine avec les favoris et les
 * notifications lues, qui eux ne vivent que dans le navigateur.
 */

import Link from "next/link";

import { useDismissals } from "@/components/useDismissals";
import { useFavorites } from "@/components/useFavorites";
import { getNotifications } from "@/lib/notifications";
import type { Artist, Concert } from "@/lib/types";

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

type Props = {
  concerts: Concert[];
  artists: Artist[];
};

export function NotificationBell({ concerts, artists }: Props) {
  const { favorites } = useFavorites();
  const { isDismissed, isLoaded } = useDismissals();

  const count = isLoaded
    ? getNotifications(concerts, artists, favorites).filter(
        (n) => !isDismissed(n.id),
      ).length
    : 0;

  return (
    <Link
      href="/notifications"
      aria-label={
        count > 0 ? `Notifications, ${count} non lue(s)` : "Notifications"
      }
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-muted hover:text-foreground"
    >
      <BellIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-on-primary"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
