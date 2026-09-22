"use client";

import { useFavorites } from "@/components/useFavorites";

/**
 * Bouton cœur : ajoute ou retire un artiste de vos favoris.
 *
 * Deux variantes : "icon" pour les cartes, "full" pour la page artiste,
 * où le bouton porte un libellé.
 */

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M12 20s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6c0 5.1-7 9.4-7 9.4Z" />
    </svg>
  );
}

type Props = {
  artistId: string;
  artistName: string;
  variant?: "icon" | "full";
};

export function FavoriteButton({ artistId, artistName, variant = "icon" }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(artistId);

  const label = active
    ? `Retirer ${artistName} de mes artistes`
    : `Ajouter ${artistName} à mes artistes`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(artistId)}
        aria-pressed={active}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-primary text-on-primary hover:bg-primary-hover"
            : "border border-border bg-surface text-subtle hover:text-foreground"
        }`}
      >
        <HeartIcon filled={active} />
        {active ? "Dans mes artistes" : "Suivre"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(artistId)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition ${
        active
          ? "bg-surface/80 text-primary"
          : "bg-surface/60 text-subtle hover:text-foreground"
      }`}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
