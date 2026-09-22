/**
 * Couche d'accès aux données — le seul endroit du site qui sait d'où
 * viennent les concerts.
 *
 * Aujourd'hui ces fonctions lisent le fichier de données fictives.
 * À l'étape 14, elles interrogeront la vraie base de données. Les pages
 * et les composants, eux, ne changeront pas d'une ligne : ils appellent
 * getUpcomingConcerts() sans savoir ce qu'il y a derrière.
 *
 * C'est ce qui rendra le passage aux vraies données indolore.
 */

import { todayISO } from "./format";
import { artists, concerts } from "./mock-data";
import type { Artist, Concert } from "./types";

/** Trie par date, puis par heure quand deux concerts tombent le même jour. */
function byDate(a: Concert, b: Concert): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.time ?? "").localeCompare(b.time ?? "");
}

export function getArtistById(id: string): Artist | undefined {
  return artists.find((artist) => artist.id === id);
}

export function getAllArtists(): Artist[] {
  return artists;
}

export function getAllConcerts(): Concert[] {
  return [...concerts].sort(byDate);
}

/**
 * Les concerts à venir, du plus proche au plus lointain.
 *
 * La comparaison de dates se fait sur du texte, sans conversion : au
 * format "AAAA-MM-JJ", l'ordre alphabétique est exactement l'ordre
 * chronologique. C'est la raison de ce choix de format à l'étape 5.
 */
export function getUpcomingConcerts(limit?: number): Concert[] {
  const today = todayISO();
  const upcoming = getAllConcerts().filter((concert) => concert.date >= today);
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((artist) => artist.slug === slug);
}

/**
 * Les concerts d'un artiste, séparés en deux (votre §15).
 *
 * Les concerts passés sont rendus du plus récent au plus ancien : c'est
 * l'ordre dans lequel on a envie de les lire.
 */
export function getConcertsByArtist(artistId: string): {
  upcoming: Concert[];
  past: Concert[];
} {
  const today = todayISO();
  const all = getAllConcerts().filter((concert) => concert.artistId === artistId);

  return {
    upcoming: all.filter((concert) => concert.date >= today),
    past: all.filter((concert) => concert.date < today).reverse(),
  };
}
