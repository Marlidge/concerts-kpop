/**
 * Recherche et filtres (votre §14).
 *
 * Tout est écrit ici sous forme de fonctions pures : elles reçoivent des
 * données, renvoient un résultat, et ne touchent ni à l'écran ni au
 * réseau. Deux conséquences utiles — elles sont faciles à tester, et
 * elles resteront valables le jour où les filtres seront appliqués par
 * la base de données plutôt que par le navigateur.
 */

import type { Artist, Concert, Genre } from "./types";

export type ConcertFilters = {
  /** Texte libre : artiste, ville, salle ou nom d'événement. */
  search: string;
  genre: Genre | "all";
  /** Nom de ville, ou "all". */
  city: string;
  /** Mois au format "2026-10", ou "all". */
  month: string;
  /** Ne garder que les concerts dont la billetterie est ouverte. */
  onlyOnSale: boolean;
  /** Ne garder que les concerts de mes artistes suivis. */
  onlyFavorites: boolean;
};

export const NO_FILTERS: ConcertFilters = {
  search: "",
  genre: "all",
  city: "all",
  month: "all",
  onlyOnSale: false,
  onlyFavorites: false,
};

export function hasActiveFilters(filters: ConcertFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.genre !== "all" ||
    filters.city !== "all" ||
    filters.month !== "all" ||
    filters.onlyOnSale ||
    filters.onlyFavorites
  );
}

/**
 * Met un texte sous une forme comparable : minuscules, sans accents,
 * sans espaces superflus.
 *
 * Indispensable en français : sans ça, chercher "zenith" ne trouverait
 * jamais "Zénith", et "le sserafim" raterait "LE SSERAFIM". C'est le
 * même travail de normalisation que fera le pipeline Python sur les
 * données des APIs.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // sépare les lettres de leurs accents
    .replace(/[\u0300-\u036f]/g, "") // puis retire les accents
    .trim();
}

/**
 * Applique tous les filtres, qui se combinent (votre exemple :
 * K-pop + Paris + octobre 2026).
 *
 * La recherche accepte plusieurs mots : "twice paris" ne trouve que les
 * concerts qui contiennent les deux, quel que soit leur ordre.
 */
export function filterConcerts(
  concerts: Concert[],
  artists: Artist[],
  filters: ConcertFilters,
  /** Identifiants des artistes suivis, nécessaires au filtre "mes artistes". */
  favoriteArtistIds: string[] = [],
): Concert[] {
  const artistNames = new Map(artists.map((a) => [a.id, a.name]));
  const favorites = new Set(favoriteArtistIds);
  const words = normalize(filters.search).split(/\s+/).filter(Boolean);

  return concerts.filter((concert) => {
    if (filters.genre !== "all" && concert.genre !== filters.genre) {
      return false;
    }
    if (filters.city !== "all" && concert.city !== filters.city) {
      return false;
    }
    // "2026-10-17".startsWith("2026-10") : le filtre par mois tient en une ligne
    // grâce au format de date choisi à l'étape 5.
    if (filters.month !== "all" && !concert.date.startsWith(filters.month)) {
      return false;
    }
    if (filters.onlyOnSale && concert.ticketStatus !== "on_sale") {
      return false;
    }
    if (filters.onlyFavorites && !favorites.has(concert.artistId)) {
      return false;
    }

    if (words.length > 0) {
      const haystack = normalize(
        [
          artistNames.get(concert.artistId) ?? "",
          concert.title,
          concert.city,
          concert.venue,
        ].join(" "),
      );
      if (!words.every((word) => haystack.includes(word))) return false;
    }

    return true;
  });
}

/** Une valeur proposée dans un filtre, avec le nombre de concerts concernés. */
export type Facet = {
  value: string;
  label: string;
  count: number;
};

/**
 * Les villes présentes dans les données, les plus fournies d'abord.
 *
 * Rien n'est codé en dur (votre §4) : si un concert à Brest apparaît
 * demain, Brest apparaît dans le filtre sans qu'on touche au code.
 */
export function getCityFacets(concerts: Concert[]): Facet[] {
  const counts = new Map<string, number>();
  for (const concert of concerts) {
    counts.set(concert.city, (counts.get(concert.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

const monthLabel = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

/** Les mois présents dans les données, dans l'ordre chronologique. */
export function getMonthFacets(concerts: Concert[]): Facet[] {
  const counts = new Map<string, number>();
  for (const concert of concerts) {
    const key = concert.date.slice(0, 7); // "2026-10"
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => {
      const [year, month] = value.split("-").map(Number);
      return {
        value,
        label: monthLabel.format(new Date(year, month - 1, 1)),
        count,
      };
    });
}

/* ------------------------------------------------------------------
   Filtres ↔ URL (votre §14).

   Mettre les filtres dans l'adresse a trois effets :
   partager un lien "K-pop à Paris en octobre", revenir en arrière avec
   le bouton du navigateur, et retrouver ses filtres en rechargeant.

   Les noms de paramètres sont en français parce qu'ils sont visibles :
   /concerts?genre=kpop&ville=Paris&mois=2026-10
   ------------------------------------------------------------------ */

/** Minimum attendu d'un jeu de paramètres, pour rester testable sans navigateur. */
type ParamsLike = { get(key: string): string | null };

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function filtersFromParams(params: ParamsLike): ConcertFilters {
  const genre = params.get("genre");
  const month = params.get("mois");

  return {
    search: params.get("q") ?? "",
    // On ne fait pas confiance à l'URL : elle se modifie à la main.
    genre: genre === "kpop" || genre === "jpop" ? genre : "all",
    city: params.get("ville") ?? "all",
    month: month && MONTH_PATTERN.test(month) ? month : "all",
    onlyOnSale: params.get("billetterie") === "ouverte",
    onlyFavorites: params.get("favoris") === "1",
  };
}

/**
 * L'opération inverse. Les filtres inactifs sont omis : une adresse sans
 * filtre reste /concerts, propre et lisible.
 */
export function filtersToQuery(filters: ConcertFilters): string {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.genre !== "all") params.set("genre", filters.genre);
  if (filters.city !== "all") params.set("ville", filters.city);
  if (filters.month !== "all") params.set("mois", filters.month);
  if (filters.onlyOnSale) params.set("billetterie", "ouverte");
  if (filters.onlyFavorites) params.set("favoris", "1");

  return params.toString();
}
