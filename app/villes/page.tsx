import type { Metadata } from "next";
import Link from "next/link";

import { getCityStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Villes — K-pop & J-pop en France",
  description:
    "Les villes françaises où des concerts K-pop et J-pop sont annoncés.",
};

export default function CitiesPage() {
  const cities = getCityStats();
  const total = cities.reduce((sum, city) => sum + city.count, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Villes
        </h1>
        <p className="mt-3 text-subtle">
          {cities.length} ville{cities.length > 1 ? "s" : ""} où des concerts
          sont annoncés, pour {total} concert{total > 1 ? "s" : ""} à venir.
        </p>
      </header>

      {cities.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-10 text-center text-sm text-subtle">
          Aucune ville à afficher pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {cities.map((city) => (
            <li key={city.city}>
              {/* Chaque ville mène à la page Concerts déjà filtrée.
                  C'est possible parce que les filtres vivent maintenant
                  dans l'adresse. */}
              <Link
                href={`/concerts?ville=${encodeURIComponent(city.city)}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{city.city}</span>
                  {city.region && (
                    <span className="ml-2 text-sm text-subtle">
                      {city.region}
                    </span>
                  )}
                </span>

                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm text-subtle">
                  {city.count} concert{city.count > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
