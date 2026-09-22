/**
 * Mise en forme des données pour l'affichage, en français.
 *
 * Tout est regroupé ici pour deux raisons : les cartes, le calendrier et
 * la page artiste afficheront les mêmes dates de la même façon, et ce
 * sont des fonctions simples à tester (étape 20).
 */

/**
 * Transforme "2026-10-17" en vraie date.
 *
 * On découpe la chaîne à la main plutôt que d'écrire new Date("2026-10-17") :
 * cette forme-là est interprétée en temps universel, et selon le fuseau
 * horaire la date affichée peut reculer d'un jour. Ici, le 17 reste le 17.
 */
function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const longDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

/** "2026-10-17" → "sam. 17 oct. 2026" */
export function formatDate(date: string): string {
  return longDate.format(parseDate(date));
}

/** "20:00" → "20h00". Rend null si l'heure n'est pas connue. */
export function formatTime(time?: string): string | null {
  if (!time) return null;
  return time.replace(":", "h");
}

/**
 * Fourchette de prix, en gérant les quatre cas réels :
 * prix unique, fourchette, minimum seul, rien du tout.
 */
export function formatPrice(min?: number, max?: number): string | null {
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined) {
    return min === max ? `${min} €` : `${min} € – ${max} €`;
  }
  if (min !== undefined) return `à partir de ${min} €`;
  return `jusqu'à ${max} €`;
}

/** "2026-10-03T10:00" → "3 oct. à 10h00" */
export function formatOpening(isoDateTime?: string): string | null {
  if (!isoDateTime) return null;
  const [date, time] = isoDateTime.split("T");
  const day = shortDate.format(parseDate(date));
  const hour = formatTime(time?.slice(0, 5));
  return hour ? `${day} à ${hour}` : day;
}

/** Date du jour au format "AAAA-MM-JJ", pour comparer avec Concert.date. */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Un concert repéré il y a moins d'une semaine porte le badge "Nouveau". */
export function isRecent(firstSeenAt?: string, days = 7): boolean {
  if (!firstSeenAt) return false;
  const seen = new Date(firstSeenAt).getTime();
  if (Number.isNaN(seen)) return false;
  return Date.now() - seen < days * 24 * 60 * 60 * 1000;
}

const regionNames = new Intl.DisplayNames(["fr"], { type: "region" });

/** "KR" → "Corée du Sud". Renvoie le code tel quel s'il est inconnu. */
export function countryLabel(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
