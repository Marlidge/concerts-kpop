/**
 * Modèle de données du site.
 *
 * Ce fichier est la description unique de ce qu'est un concert et de ce
 * qu'est un artiste. Tout le reste de l'application s'y réfère : les
 * données fictives, les cartes, les filtres, et plus tard le pipeline
 * Python devra produire exactement cette forme.
 *
 * Les noms de champs sont en anglais (convention du métier, et le code
 * sera lu par des recruteurs) ; les explications restent en français.
 * Les textes affichés à l'écran, eux, seront évidemment en français.
 */

/** Les deux univers couverts par le site. */
export type Genre = "kpop" | "jpop";

/**
 * État de la billetterie.
 * "unknown" est volontaire : une source ne fournit pas toujours
 * l'information, et il vaut mieux l'assumer que d'inventer une valeur.
 */
export type TicketStatus =
  | "on_sale" // billetterie ouverte
  | "upcoming" // annoncée, pas encore ouverte
  | "sold_out" // complet
  | "cancelled" // annulé ou reporté
  | "unknown"; // information non fournie par la source

/**
 * Un artiste, stocké séparément des concerts (votre §5 et §8).
 * Deux concerts du même groupe pointent vers le même artiste : son nom
 * ou sa photo ne sont donc écrits qu'à un seul endroit.
 */
export type Artist = {
  /** Identifiant interne, stable, propre au site. */
  id: string;
  /** Version du nom utilisable dans une URL : "twice", "babymetal". */
  slug: string;
  name: string;
  /** Code pays ISO : "KR" pour la Corée du Sud, "JP" pour le Japon. */
  country: string;
  genre: Genre;
  /** Précision libre : "idol", "j-rock", "ballad"... */
  subGenre?: string;
  imageUrl?: string;
  /** Géré par vous depuis l'interface, pas par les sources de données. */
  isFavorite: boolean;
};

/**
 * Un concert.
 *
 * Les champs suivis d'un `?` sont optionnels : les sources réelles
 * livrent souvent des données incomplètes (pas d'heure, pas de prix).
 * Les marquer optionnels oblige le code à gérer le cas au lieu de
 * planter, ce qui répond à votre §23.
 */
export type Concert = {
  /** Identifiant interne, attribué par le site après déduplication. */
  id: string;
  /** Référence vers Artist.id. */
  artistId: string;
  /** Nom de l'événement : "TWICE — READY TO BE World Tour". */
  title: string;

  /** Date au format "AAAA-MM-JJ", ex. "2026-11-12". */
  date: string;
  /** Heure au format "HH:MM", ex. "20:00". Absente si non communiquée. */
  time?: string;

  city: string;
  /** Région administrative, ex. "Occitanie". Utile pour le filtre par région. */
  region?: string;
  /** Salle, ex. "Zénith de Toulouse". */
  venue: string;
  address?: string;

  genre: Genre;

  ticketStatus: TicketStatus;
  /** Ouverture de la billetterie, date et heure : "2026-03-14T10:00". */
  ticketsOpenAt?: string;
  /** Prix en euros. */
  priceMin?: number;
  priceMax?: number;
  /** Lien vers la billetterie officielle. */
  officialUrl?: string;

  imageUrl?: string;

  /** D'où vient la donnée : "ticketmaster", "manual"... (votre §7) */
  source: string;
  /** Identifiant du concert chez cette source, clé de la déduplication. */
  sourceId: string;
  /** Dernière actualisation, ex. "2026-09-22T06:00:00Z". */
  updatedAt: string;
};
