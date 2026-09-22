"use client";

/**
 * Le point d'entrée unique des favoris pour l'interface.
 *
 * useSyncExternalStore est l'outil prévu par React pour suivre une
 * donnée qui ne lui appartient pas — ici, le stockage du navigateur.
 * Il gère à notre place l'abonnement, la mise à jour de tous les
 * composants concernés, et la différence entre le rendu serveur et le
 * rendu navigateur.
 *
 * Aucun "fournisseur" n'est nécessaire : n'importe quel composant
 * client peut appeler ce hook directement.
 */

import { useCallback, useSyncExternalStore } from "react";

import {
  getFavorites,
  getFavoritesOnServer,
  subscribeToFavorites,
  toggleFavorite,
} from "@/lib/favorites";

/** Côté serveur : false. Côté navigateur, après hydratation : true. */
const onServer = () => false;
const onClient = () => true;

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavorites,
    getFavoritesOnServer,
  );

  /**
   * Permet de ne pas afficher "vous ne suivez aucun artiste" pendant la
   * fraction de seconde où le navigateur n'a pas encore pris le relais.
   */
  const isLoaded = useSyncExternalStore(
    subscribeToFavorites,
    onClient,
    onServer,
  );

  const isFavorite = useCallback(
    (artistId: string) => favorites.includes(artistId),
    [favorites],
  );

  return { favorites, isFavorite, toggle: toggleFavorite, isLoaded };
}
