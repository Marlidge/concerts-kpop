"use client";

/**
 * Le centre de notifications (votre §20).
 *
 * Rien n'est stocké côté site : la liste est recalculée à chaque
 * visite à partir des concerts, de vos favoris et de l'horloge — voir
 * lib/notifications.ts. Seul ce que vous avez marqué comme lu est
 * mémorisé (dans votre navigateur, comme les favoris).
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { useDismissals } from "@/components/useDismissals";
import { useFavorites } from "@/components/useFavorites";
import { formatDate, formatOpening } from "@/lib/format";
import {
  getNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/notifications";
import type { Artist, Concert } from "@/lib/types";

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path d="M12 2.5c.9 3.6 1.9 5.6 3.3 7 1.4 1.4 3.4 2.4 7 3.3-3.6.9-5.6 1.9-7 3.3-1.4 1.4-2.4 3.4-3.3 7-.9-3.6-1.9-5.6-3.3-7-1.4-1.4-3.4-2.4-7-3.3 3.6-.9 5.6-1.9 7-3.3 1.4-1.4 2.4-3.4 3.3-7Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path d="M12 20s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6c0 5.1-7 9.4-7 9.4Z" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2.5 2.5 0 0 0 0 5v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2.5 2.5 0 0 0 0-5V8Z" />
      <path d="M14 6v12" strokeDasharray="2 3" />
    </svg>
  );
}

/** Une icône, une couleur et un titre par type — pas d'emoji, pour
    rester dans le style d'icônes déjà utilisé partout sur le site. */
const KIND_META: Record<
  NotificationKind,
  { Icon: () => React.ReactElement; badgeClass: string; title: string }
> = {
  new_concert: {
    Icon: SparkleIcon,
    badgeClass: "bg-primary-soft text-primary",
    title: "Nouveau concert détecté",
  },
  favorite_artist: {
    Icon: HeartIcon,
    badgeClass: "bg-kpop-soft text-kpop-strong",
    title: "Nouvel événement pour un artiste favori",
  },
  tickets_opening_soon: {
    Icon: TicketIcon,
    badgeClass: "bg-jpop-soft text-jpop-strong",
    title: "Billetterie bientôt ouverte",
  },
};

/* ------------------------------------------------------------------
   Statut des notifications du navigateur (Notification.permission).

   Même raison qu'ailleurs (useFavorites, useDismissals) : le serveur
   n'a pas accès à l'API Notification, donc son rendu et celui du
   navigateur doivent partir de la même valeur par défaut, ici "non
   disponible". useSyncExternalStore gère cette synchronisation sans
   jamais appeler setState dans un effet.
   ------------------------------------------------------------------ */
const permissionListeners = new Set<() => void>();

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined"
    ? "unsupported"
    : Notification.permission;
}

function getPermissionServerSnapshot(): NotificationPermission | "unsupported" {
  return "unsupported";
}

function subscribeToPermission(listener: () => void): () => void {
  permissionListeners.add(listener);
  return () => permissionListeners.delete(listener);
}

/** À appeler après Notification.requestPermission() pour que le
    composant relise l'état à jour. */
function notifyPermissionChanged(): void {
  for (const listener of permissionListeners) listener();
}

function describe(notification: AppNotification): string {
  const name = notification.artist?.name ?? "Un artiste";
  const { concert } = notification;

  if (notification.kind === "tickets_opening_soon") {
    return `${name} — ouverture ${formatOpening(concert.ticketsOpenAt)}.`;
  }
  return `${name} sera à ${concert.city} le ${formatDate(concert.date)}.`;
}

type Props = {
  concerts: Concert[];
  artists: Artist[];
};

export function NotificationList({ concerts, artists }: Props) {
  const { favorites } = useFavorites();
  const { isDismissed, dismiss, dismissAll, isLoaded } = useDismissals();

  const permission = useSyncExternalStore(
    subscribeToPermission,
    getPermissionSnapshot,
    getPermissionServerSnapshot,
  );
  const browserSupported = permission !== "unsupported";
  const browserEnabled = permission === "granted";

  const all = useMemo(
    () => getNotifications(concerts, artists, favorites),
    [concerts, artists, favorites],
  );
  const visible = all.filter((n) => !isDismissed(n.id));

  /**
   * Notifications du navigateur : uniquement pour ce qui apparaît
   * PENDANT que l'onglet reste ouvert, pas pour ce qui existait déjà à
   * l'arrivée. Sans ça, activer l'option déclencherait une rafale de
   * notifications pour tout l'historique récent d'un coup.
   *
   * Limite assumée : sans "service worker", rien ne se déclenche si le
   * site est fermé — seulement pendant qu'un onglet reste ouvert en
   * arrière-plan. Suffisant pour une V1 gratuite (votre §20).
   */
  const knownIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!browserEnabled) return;

    if (knownIdsRef.current) {
      for (const notification of visible) {
        if (!knownIdsRef.current.has(notification.id)) {
          new Notification(KIND_META[notification.kind].title, {
            body: describe(notification),
          });
        }
      }
    }

    knownIdsRef.current = new Set(visible.map((n) => n.id));
  }, [visible, browserEnabled]);

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
    // requestPermission() ne déclenche aucun événement observable : on
    // prévient nous-mêmes les abonnés que la valeur a pu changer.
    notifyPermissionChanged();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {browserSupported && (
          <button
            type="button"
            onClick={enableBrowserNotifications}
            disabled={browserEnabled}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-subtle transition hover:text-foreground disabled:cursor-default disabled:opacity-60"
          >
            {browserEnabled
              ? "Notifications du navigateur activées"
              : "Activer les notifications du navigateur"}
          </button>
        )}

        {isLoaded && visible.length > 0 && (
          <button
            type="button"
            onClick={() => dismissAll(visible.map((n) => n.id))}
            className="rounded-full px-3 py-2 text-sm text-subtle underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {!isLoaded ? (
        <p className="mt-8 text-sm text-subtle">Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 rounded-card border border-border bg-surface p-10 text-center text-sm text-subtle">
          Aucune notification pour le moment. Revenez après votre prochaine
          visite, ou suivez plus d&apos;artistes depuis{" "}
          <Link href="/mes-artistes" className="text-primary underline-offset-4 hover:underline">
            Mes artistes
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {visible.map((notification) => {
            const meta = KIND_META[notification.kind];
            return (
              <li
                key={notification.id}
                className="flex items-start gap-3 rounded-card border border-border bg-surface p-4"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}
                >
                  <meta.Icon />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{meta.title}</p>
                  <p className="mt-0.5 text-sm text-subtle">
                    {notification.artist ? (
                      <Link
                        href={`/artistes/${notification.artist.slug}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {describe(notification)}
                      </Link>
                    ) : (
                      describe(notification)
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(notification.id)}
                  aria-label="Marquer comme lu"
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs text-subtle transition hover:bg-muted hover:text-foreground"
                >
                  Lu
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
