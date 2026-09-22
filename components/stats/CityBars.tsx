import type { CityStat } from "@/lib/data";

/**
 * Concerts par ville — barres horizontales.
 *
 * Volontairement construit comme une liste : le nom et le chiffre sont
 * écrits en toutes lettres, la barre ne fait qu'aider l'œil à comparer.
 * Le graphique est donc aussi son propre tableau de données, lisible
 * sans percevoir les couleurs.
 */
export function CityBars({ data }: { data: CityStat[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-subtle">Aucune ville à afficher.</p>;
  }

  const max = Math.max(...data.map((item) => item.count));

  return (
    <ul className="flex flex-col gap-3">
      {data.map((item) => (
        <li key={item.city} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm">{item.city}</span>

          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>

          <span className="w-6 shrink-0 text-right text-sm tabular-nums text-subtle">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
