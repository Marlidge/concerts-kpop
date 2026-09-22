import type { GenreSplit as GenreSplitData } from "@/lib/stats";

/**
 * Répartition K-pop / J-pop.
 *
 * Pas de camembert : à deux parts, un disque se lit moins bien qu'une
 * barre, et les deux nombres écrits à côté restent la donnée la plus
 * précise. La barre ne sert qu'à saisir la proportion d'un coup d'œil.
 *
 * Les deux teintes sont celles utilisées partout ailleurs sur le site
 * pour ces genres — une couleur suit toujours la même entité — et elles
 * ont été validées pour rester distinguables en cas de daltonisme,
 * en mode clair comme en mode sombre.
 */
export function GenreSplit({ data }: { data: GenreSplitData }) {
  if (data.total === 0) {
    return <p className="text-sm text-subtle">Aucun concert à venir.</p>;
  }

  const kpopShare = Math.round((data.kpop / data.total) * 100);

  const legend = [
    {
      label: "K-pop",
      count: data.kpop,
      share: kpopShare,
      dot: "bg-kpop",
    },
    {
      label: "J-pop",
      count: data.jpop,
      share: 100 - kpopShare,
      dot: "bg-jpop",
    },
  ];

  return (
    <div>
      {/* gap-0.5 = 2 px de fond entre les deux parts, plutôt qu'un trait
          de séparation dessiné par-dessus. */}
      <div className="flex h-3 gap-0.5" aria-hidden="true">
        <div
          className="rounded-full bg-kpop"
          style={{ width: `${kpopShare}%` }}
        />
        <div
          className="rounded-full bg-jpop"
          style={{ width: `${100 - kpopShare}%` }}
        />
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`size-2.5 shrink-0 rounded-full ${item.dot}`}
            />
            <span className="text-sm">
              {item.label}
              {/* Le texte reste en encre neutre : c'est la pastille qui
                  porte l'identité, jamais la couleur des mots. */}
              <span className="ml-2 text-subtle">
                {item.count} concert{item.count > 1 ? "s" : ""} · {item.share} %
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
