/**
 * Calcul d'une grille mensuelle (votre §17).
 *
 * Écrit en JavaScript natif, sans bibliothèque de dates : une trentaine
 * de lignes suffisent, et c'est une dépendance de moins à maintenir et
 * à faire télécharger au navigateur.
 *
 * Comme pour les filtres, ce sont des fonctions pures : faciles à
 * vérifier à la main, faciles à tester à l'étape 20.
 */

/** Un mois est identifié par "AAAA-MM", une date par "AAAA-MM-JJ". */
export type MonthKey = string;

export type CalendarDay = {
  /** "2026-10-17" */
  date: string;
  dayOfMonth: number;
  /** false pour les jours de complément en début et fin de grille. */
  isCurrentMonth: boolean;
  isToday: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Décale d'un ou plusieurs mois : shiftMonth("2026-12", 1) → "2027-01". */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, index] = month.split("-").map(Number);
  // Le mois 12 d'une année bascule tout seul sur janvier de la suivante :
  // l'objet Date s'en charge, inutile de gérer les cas particuliers.
  const shifted = new Date(year, index - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`;
}

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

/** "2026-10" → "Octobre 2026" */
export function formatMonth(month: MonthKey): string {
  const [year, index] = month.split("-").map(Number);
  const label = monthFormatter.format(new Date(year, index - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

/**
 * Les en-têtes de colonnes : lun., mar., mer.…
 *
 * Calculés à partir d'une semaine réelle plutôt qu'écrits à la main,
 * pour rester cohérents avec le reste des dates du site.
 */
export const WEEKDAY_LABELS: string[] = Array.from({ length: 7 }, (_, i) =>
  // 5 janvier 2026 est un lundi : on part de là.
  weekdayFormatter.format(new Date(2026, 0, 5 + i)),
);

/**
 * Construit la grille d'un mois, semaines commençant le lundi.
 *
 * La grille déborde volontairement sur les mois voisins pour que chaque
 * ligne compte sept cases : c'est ce qui donne un calendrier régulier.
 */
export function buildMonthGrid(
  month: MonthKey,
  todayISO: string,
): CalendarDay[] {
  const [year, index] = month.split("-").map(Number);

  const firstOfMonth = new Date(year, index - 1, 1);
  // getDay() renvoie 0 pour dimanche ; en France la semaine commence
  // le lundi, d'où ce décalage.
  const offset = (firstOfMonth.getDay() + 6) % 7;

  // Le "jour 0" du mois suivant est le dernier jour de celui-ci.
  const daysInMonth = new Date(year, index, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, i) => {
    const date = new Date(year, index - 1, 1 - offset + i);
    const iso = toISO(date);

    return {
      date: iso,
      dayOfMonth: date.getDate(),
      isCurrentMonth: iso.slice(0, 7) === month,
      isToday: iso === todayISO,
    };
  });
}
