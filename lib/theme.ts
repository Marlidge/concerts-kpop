/**
 * Préférence de thème (votre §11 : mode clair, mode sombre).
 *
 * Le mode sombre suit déjà le réglage du système depuis l'étape 4
 * (voir app/globals.css). Ce module ajoute le choix MANUEL, qui doit
 * l'emporter sur le système une fois qu'on l'a fait — exactement ce
 * que globals.css anticipait avec son attribut `data-theme`.
 *
 * Même construction que les favoris et les notifications lues
 * (stockage local, écouteurs, lecture "vide" côté serveur) : c'est le
 * même problème à chaque fois — une préférence propre au navigateur,
 * que React doit pouvoir lire sans jamais désynchroniser le rendu
 * serveur du rendu client.
 */

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "concerts-kpop:theme";

function isValid(value: unknown): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

function read(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isValid(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function write(theme: ThemePreference): void {
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Stockage refusé : le choix reste appliqué pour la session en cours.
  }
}

/**
 * Pose l'attribut que globals.css sait déjà lire. "system" et l'absence
 * d'attribut produisent le même résultat visuel (voir le commentaire
 * dans globals.css) : la valeur littérale "system" peut donc être posée
 * sans condition, pas besoin de la traiter à part.
 */
function apply(theme: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", theme);
}

const listeners = new Set<() => void>();
let cache: ThemePreference | null = null;

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      apply(read());
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getTheme(): ThemePreference {
  cache ??= read();
  return cache;
}

export function getThemeOnServer(): ThemePreference {
  return "system";
}

export function setTheme(theme: ThemePreference): void {
  cache = theme;
  write(theme);
  apply(theme);
  for (const listener of listeners) listener();
}

/**
 * Injecté tel quel dans <head> par app/layout.tsx, AVANT tout rendu
 * React : sans ça, la page s'afficherait d'abord en clair, puis
 * basculerait en sombre une fois React chargé — un flash bref mais
 * agaçant à chaque visite. Ce script s'exécute trop tôt pour passer
 * par lib/dismissals.ts ou toute logique React ; il duplique donc
 * volontairement la lecture du stockage, en aussi peu de code que
 * possible.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v);}}catch(e){}})();`;
