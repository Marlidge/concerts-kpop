// Bloc temporaire : il sert uniquement à vérifier la palette en mode clair
// et en mode sombre. Il disparaîtra à l'étape 8, quand les vraies cartes
// de concerts prendront sa place.
const swatches = [
  { name: "Fond", color: "bg-background" },
  { name: "Carte", color: "bg-surface" },
  { name: "Secondaire", color: "bg-muted" },
  { name: "Principale", color: "bg-primary" },
  { name: "K-pop", color: "bg-kpop" },
  { name: "J-pop", color: "bg-jpop" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        K-pop · J-pop · France
      </p>

      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Tous les concerts au même endroit.
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-subtle">
        Cherchez un artiste, une ville ou une salle, suivez vos groupes préférés
        et ne manquez plus une ouverture de billetterie.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-kpop-soft px-3 py-1 text-xs font-medium text-kpop-strong">
          K-pop
        </span>
        <span className="rounded-full bg-jpop-soft px-3 py-1 text-xs font-medium text-jpop-strong">
          J-pop
        </span>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          Toute la France
        </span>
      </div>

      <section className="mt-14 rounded-card border border-border bg-surface p-6 shadow-soft">
        <h2 className="text-base font-semibold">Palette du site</h2>
        <p className="mt-1 text-sm leading-relaxed text-subtle">
          Bloc de contrôle temporaire. Basculez votre système en mode sombre
          pour vérifier que les couleurs restent lisibles.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {swatches.map((swatch) => (
            <li key={swatch.name}>
              <div
                className={`h-14 rounded-xl border border-border ${swatch.color}`}
              />
              <p className="mt-2 text-xs text-subtle">{swatch.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
