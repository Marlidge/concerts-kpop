/**
 * Un chiffre clé.
 *
 * Quand l'histoire tient en un nombre, le nombre est le graphique :
 * une barre unique n'apprendrait rien de plus.
 */
export function StatTile({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      {/* Chiffres à chasse proportionnelle : sur un grand nombre isolé,
          les chiffres de largeur égale donnent un rendu lâche. */}
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-subtle">{label}</p>
    </div>
  );
}
