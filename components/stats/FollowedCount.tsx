"use client";

import { StatTile } from "@/components/stats/StatTile";
import { useFavorites } from "@/components/useFavorites";

/**
 * Le seul chiffre de la page qui ne puisse pas être calculé sur le
 * serveur : vos favoris vivent dans votre navigateur.
 */
export function FollowedCount() {
  const { favorites, isLoaded } = useFavorites();

  return (
    <StatTile
      value={isLoaded ? favorites.length : "—"}
      label="artistes suivis"
    />
  );
}
