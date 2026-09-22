/**
 * Agrégations pour la page Statistiques (votre §19).
 *
 * Encore des fonctions pures, séparées de l'affichage. C'est ce qui
 * permettra de les tester à l'étape 20, et c'est aussi ce qui montre,
 * dans un portfolio, que les chiffres sont calculés et non recopiés.
 */

import { getAllArtists, getAllConcerts, getUpcomingConcerts } from "./data";

export type Overview = {
  upcoming: number;
  past: number;
  artists: number;
  cities: number;
};

export function getOverview(): Overview {
  const all = getAllConcerts();
  const upcoming = getUpcomingConcerts();

  return {
    upcoming: upcoming.length,
    past: all.length - upcoming.length,
    artists: getAllArtists().length,
    cities: new Set(upcoming.map((concert) => concert.city)).size,
  };
}

export type MonthlyStat = {
  /** "2026-10" */
  month: string;
  /** "oct. 26" */
  label: string;
  count: number;
};

const shortMonth = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/**
 * Concerts par mois, dans l'ordre chronologique.
 *
 * Les mois sans concert sont inclus : sans eux, un trou de trois mois
 * ressemblerait à une succession régulière, et le graphique mentirait
 * sur le rythme des annonces.
 */
export function getMonthlyStats(): MonthlyStat[] {
  const upcoming = getUpcomingConcerts();
  if (upcoming.length === 0) return [];

  const counts = new Map<string, number>();
  for (const concert of upcoming) {
    const key = concert.date.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const keys = [...counts.keys()].sort();
  const [firstYear, firstMonth] = keys[0].split("-").map(Number);
  const [lastYear, lastMonth] = keys[keys.length - 1].split("-").map(Number);
  const span = (lastYear - firstYear) * 12 + (lastMonth - firstMonth);

  return Array.from({ length: span + 1 }, (_, offset) => {
    const date = new Date(firstYear, firstMonth - 1 + offset, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      month,
      // L'année abrégée évite de confondre janvier 2027 et janvier 2028.
      label: `${shortMonth.format(date)} ${String(date.getFullYear()).slice(2)}`,
      count: counts.get(month) ?? 0,
    };
  });
}

export type GenreSplit = {
  kpop: number;
  jpop: number;
  total: number;
};

export function getGenreSplit(): GenreSplit {
  const upcoming = getUpcomingConcerts();
  const kpop = upcoming.filter((concert) => concert.genre === "kpop").length;

  return {
    kpop,
    jpop: upcoming.length - kpop,
    total: upcoming.length,
  };
}
