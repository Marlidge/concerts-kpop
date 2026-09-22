import type { Metadata } from "next";

import { CityBars } from "@/components/stats/CityBars";
import { FollowedCount } from "@/components/stats/FollowedCount";
import { GenreSplit } from "@/components/stats/GenreSplit";
import { MonthlyBars } from "@/components/stats/MonthlyBars";
import { StatTile } from "@/components/stats/StatTile";
import { getCityStats } from "@/lib/data";
import { getGenreSplit, getMonthlyStats, getOverview } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Statistiques — K-pop & J-pop en France",
  description:
    "Répartition des concerts K-pop et J-pop en France : par mois, par ville, par genre.",
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-subtle">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function StatsPage() {
  const overview = getOverview();
  const monthly = getMonthlyStats();
  const cities = getCityStats();
  const genres = getGenreSplit();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Statistiques
        </h1>
        <p className="mt-3 text-subtle">
          Tous les chiffres sont recalculés à partir des concerts en base.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile value={overview.upcoming} label="concerts à venir" />
        <StatTile value={overview.cities} label="villes concernées" />
        <StatTile value={overview.artists} label="artistes en base" />
        <FollowedCount />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Card
            title="Concerts par mois"
            description="Les mois sans concert sont conservés, pour ne pas donner l'illusion d'un rythme régulier."
          >
            <MonthlyBars data={monthly} />
          </Card>
        </div>

        <Card
          title="Concerts par ville"
          description="Les villes les mieux servies en premier."
        >
          <CityBars data={cities} />
        </Card>

        <Card
          title="Répartition par genre"
          description={`Sur les ${overview.upcoming} concerts à venir.`}
        >
          <GenreSplit data={genres} />
        </Card>
      </div>

      {overview.past > 0 && (
        <p className="mt-10 text-sm text-subtle">
          {overview.past} concert{overview.past > 1 ? "s" : ""} passé
          {overview.past > 1 ? "s" : ""} {overview.past > 1 ? "sont" : "est"}{" "}
          conservé{overview.past > 1 ? "s" : ""} en base mais exclu
          {overview.past > 1 ? "s" : ""} de ces chiffres.
        </p>
      )}
    </main>
  );
}
