"use client";

/**
 * Point d'entrée des notifications "lues" pour l'interface — même
 * construction que useFavorites.ts, voir ses commentaires pour le
 * détail de useSyncExternalStore.
 */

import { useCallback, useSyncExternalStore } from "react";

import {
  dismiss,
  dismissAll,
  getDismissals,
  getDismissalsOnServer,
  subscribeToDismissals,
} from "@/lib/dismissals";

const onServer = () => false;
const onClient = () => true;

export function useDismissals() {
  const dismissed = useSyncExternalStore(
    subscribeToDismissals,
    getDismissals,
    getDismissalsOnServer,
  );

  const isLoaded = useSyncExternalStore(
    subscribeToDismissals,
    onClient,
    onServer,
  );

  const isDismissed = useCallback(
    (id: string) => dismissed.includes(id),
    [dismissed],
  );

  return { dismissed, isDismissed, dismiss, dismissAll, isLoaded };
}
