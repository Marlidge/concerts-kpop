"use client";

/**
 * Bascule clair / sombre / système, dans l'en-tête (votre §11).
 *
 * Un seul bouton qui fait défiler les trois états plutôt qu'un
 * sélecteur à trois branches : plus compact, et l'en-tête est déjà
 * chargé (logo, six liens, cloche).
 */

import { useSyncExternalStore } from "react";

import {
  getTheme,
  getThemeOnServer,
  setTheme,
  subscribeToTheme,
  type ThemePreference,
} from "@/lib/theme";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABELS: Record<ThemePreference, string> = {
  system: "Système",
  light: "Clair",
  dark: "Sombre",
};

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="size-[18px]"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
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
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function SystemIcon() {
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
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const ICONS: Record<ThemePreference, () => React.ReactElement> = {
  system: SystemIcon,
  light: SunIcon,
  dark: MoonIcon,
};

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    getThemeOnServer,
  );
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Thème : ${LABELS[theme]}. Cliquer pour changer.`}
      title={`Thème : ${LABELS[theme]}`}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-muted hover:text-foreground"
    >
      <Icon />
    </button>
  );
}
