/**
 * Suivi des notifications déjà vues, sur le même principe que les
 * favoris ([[lib/favorites.ts]]) : stockage local du navigateur, pas de
 * compte, pas de serveur.
 *
 * Une notification "lue" ne réapparaît plus tant que le concert qui l'a
 * déclenchée reste le même. Rien n'est supprimé côté données — on garde
 * juste la liste des identifiants qu'on ne veut plus voir.
 */

const STORAGE_KEY = "concerts-kpop:dismissed-notifications";

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Stockage plein ou refusé : tant pis, la session en cours reste correcte.
  }
}

const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

export function subscribeToDismissals(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getDismissals(): string[] {
  cache ??= read();
  return cache;
}

export function getDismissalsOnServer(): string[] {
  return EMPTY;
}

export function dismiss(notificationId: string): void {
  const current = getDismissals();
  if (current.includes(notificationId)) return;

  cache = [...current, notificationId];
  write(cache);
  for (const listener of listeners) listener();
}

export function dismissAll(notificationIds: string[]): void {
  const current = new Set(getDismissals());
  for (const id of notificationIds) current.add(id);

  cache = [...current];
  write(cache);
  for (const listener of listeners) listener();
}
