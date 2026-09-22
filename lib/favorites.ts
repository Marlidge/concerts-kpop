/**
 * Stockage des artistes favoris (votre §16).
 *
 * POURQUOI LE NAVIGATEUR ET PAS LA BASE DE DONNÉES
 *
 * Trois possibilités existaient :
 *   1. une table en base   → impose des comptes utilisateurs, que votre
 *                            §26 écarte explicitement pour la V1 ;
 *   2. un fichier partagé  → tout le monde verrait les mêmes favoris ;
 *   3. le stockage local du navigateur → choisi ici.
 *
 * localStorage garde vos favoris sur votre machine, sans compte, sans
 * serveur et sans coût. Limite assumée : ils ne suivent pas d'un appareil
 * à l'autre. Le jour où vous voudrez des comptes, seul ce fichier
 * changera — le reste du site appelle useFavorites() sans savoir où les
 * données sont rangées.
 */

const STORAGE_KEY = "concerts-kpop:favorites";

/**
 * Lit les favoris enregistrés.
 *
 * Tout est entouré d'un try/catch : en navigation privée, ou si la
 * personne a bloqué le stockage, le simple fait de lire lève une
 * exception. Le site doit continuer à fonctionner, sans favoris,
 * plutôt que d'afficher une page blanche (votre §23).
 */
function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // On se méfie du contenu : il a pu être modifié à la main.
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

/** Enregistre les favoris. Un échec est sans gravité : on l'ignore. */
function write(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Stockage plein ou refusé : les favoris resteront valables
    // le temps de la session, ce qui vaut mieux qu'une erreur.
  }
}

/* ------------------------------------------------------------------
   Le "magasin" : une petite source de vérité partagée par tout le site.

   React a besoin de trois choses pour suivre une donnée extérieure à
   lui : savoir s'y abonner, savoir la lire, et savoir quoi afficher
   quand la page est calculée sur le serveur. C'est ce que fournissent
   les trois fonctions ci-dessous.
   ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

/**
 * La valeur lue est mise en cache.
 *
 * React exige que deux lectures successives sans changement renvoient
 * exactement le même tableau, sinon il croirait à une modification
 * permanente et redessinerait la page sans fin.
 */
let cache: string[] | null = null;

/** Tableau vide unique : même raison d'identité stable. */
const EMPTY: string[] = [];

export function subscribeToFavorites(listener: () => void): () => void {
  listeners.add(listener);

  // Deux onglets ouverts : celui qui n'a pas cliqué doit se mettre à jour.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getFavorites(): string[] {
  cache ??= read();
  return cache;
}

/**
 * Ce que voit le serveur : rien.
 *
 * Il n'a pas accès au navigateur. React affiche donc d'abord une page
 * sans favoris, puis la corrige aussitôt côté client — sans jamais
 * signaler d'incohérence entre les deux.
 */
export function getFavoritesOnServer(): string[] {
  return EMPTY;
}

export function toggleFavorite(artistId: string): void {
  const current = getFavorites();

  cache = current.includes(artistId)
    ? current.filter((id) => id !== artistId)
    : [...current, artistId];

  write(cache);
  for (const listener of listeners) listener();
}
