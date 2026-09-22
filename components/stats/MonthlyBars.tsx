import type { MonthlyStat } from "@/lib/stats";

/**
 * Concerts par mois — histogramme en colonnes.
 *
 * Dessiné en HTML et CSS, sans bibliothèque de graphiques : pour des
 * barres, une div de la bonne hauteur suffit. Ça évite d'ajouter
 * ~150 Ko au site et ça garde les couleurs de votre palette.
 *
 * Une seule série, donc une seule couleur : teinter les barres selon
 * leur valeur redirait en couleur ce que la hauteur dit déjà.
 */

/** Hauteur du tracé, en pixels. Les barres s'y proportionnent. */
const PLOT_HEIGHT = 150;

export function MonthlyBars({ data }: { data: MonthlyStat[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-subtle">Aucun concert à venir.</p>;
  }

  const max = Math.max(...data.map((item) => item.count));

  return (
    <div>
      <ul className="flex items-end gap-2">
        {data.map((item) => {
          // Un mois à 1 concert doit rester visible : d'où la hauteur minimale.
          const height =
            item.count === 0
              ? 0
              : Math.max(4, Math.round((item.count / max) * PLOT_HEIGHT));

          return (
            <li key={item.month} className="flex flex-1 flex-col items-center">
              <div
                className="flex w-full flex-col items-center justify-end"
                style={{ height: PLOT_HEIGHT + 22 }}
              >
                <span className="mb-1.5 text-xs tabular-nums text-subtle">
                  {item.count > 0 ? item.count : ""}
                </span>
                <div
                  // Extrémité arrondie côté valeur, pied posé sur la ligne.
                  className="w-full max-w-10 rounded-t bg-primary"
                  style={{ height }}
                  title={`${item.label} : ${item.count} concert${item.count > 1 ? "s" : ""}`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ligne de base en filet fin, une nuance au-dessus du fond. */}
      <div className="border-t border-border" />

      <ul className="flex gap-2">
        {data.map((item) => (
          <li
            key={item.month}
            className="flex-1 pt-2 text-center text-[11px] text-subtle"
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
