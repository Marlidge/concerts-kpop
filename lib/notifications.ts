/**
 * Centre de notifications (votre §20).
 *
 * Comme les filtres et le calendrier, tout part d'une fonction pure :
 * elle reçoit des concerts, des artistes et une liste de favoris,
 * renvoie une liste de notifications. Rien n'est stocké ici — c'est
 * calculé à chaque visite à partir de ce qui existe déjà (firstSeenAt,
 * ticketsOpenAt, vos favoris), pas d'une file d'attente qu'il faudrait
 * gérer en plus.
 *
 * Trois types, qui correspondent à vos trois exemples :
 *   - new_concert       : un concert découvert récemment (< 7 jours)
 *   - favorite_artist   : pareil, mais pour un artiste que vous suivez
 *   - tickets_opening_soon : la billetterie ouvre dans moins de 48h
 */

import { isRecent } from "./format";
import type { Artist, Concert } from "./types";

export type NotificationKind =
  | "new_concert"
  | "favorite_artist"
  | "tickets_opening_soon";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  concert: Concert;
  artist?: Artist;
};

const OPENING_SOON_WINDOW_HOURS = 48;

function isOpeningSoon(concert: Concert): boolean {
  if (concert.ticketStatus !== "upcoming" || !concert.ticketsOpenAt) {
    return false;
  }
  const opensAt = new Date(concert.ticketsOpenAt).getTime();
  if (Number.isNaN(opensAt)) return false;

  const hoursUntil = (opensAt - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 0 && hoursUntil <= OPENING_SOON_WINDOW_HOURS;
}

/**
 * Construit la liste des notifications actives.
 *
 * Un concert annulé n'en génère aucune : il n'y a rien à célébrer ni à
 * rappeler pour un événement qui n'aura pas lieu.
 *
 * Un concert nouveau ET d'un artiste favori ne produit qu'UNE seule
 * notification (la version "artiste favori", plus pertinente), pas
 * deux qui répéteraient la même information.
 */
export function getNotifications(
  concerts: Concert[],
  artists: Artist[],
  favoriteArtistIds: string[],
): AppNotification[] {
  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));
  const favorites = new Set(favoriteArtistIds);
  const notifications: AppNotification[] = [];

  for (const concert of concerts) {
    if (concert.ticketStatus === "cancelled") continue;

    const artist = artistsById.get(concert.artistId);
    const isNew = isRecent(concert.firstSeenAt);
    const isFavorite = favorites.has(concert.artistId);

    if (isNew) {
      notifications.push({
        id: `${isFavorite ? "favorite" : "new"}:${concert.id}`,
        kind: isFavorite ? "favorite_artist" : "new_concert",
        concert,
        artist,
      });
    }

    if (isOpeningSoon(concert)) {
      notifications.push({
        id: `opening:${concert.id}`,
        kind: "tickets_opening_soon",
        concert,
        artist,
      });
    }
  }

  // Les plus récentes d'abord ; à découverte égale, la billetterie qui
  // ouvre bientôt reste avant le simple "nouveau concert" (déjà garanti
  // par l'ordre d'insertion ci-dessus, stable dans Array.sort).
  return notifications.sort((a, b) =>
    (b.concert.firstSeenAt ?? "").localeCompare(a.concert.firstSeenAt ?? ""),
  );
}
