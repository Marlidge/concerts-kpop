/**
 * Tests de la recherche et des filtres (votre §14, §28).
 */

import { describe, expect, it } from "vitest";

import {
  filterConcerts,
  filtersFromParams,
  filtersToQuery,
  getCityFacets,
  getMonthFacets,
  hasActiveFilters,
  normalize,
  NO_FILTERS,
  type ConcertFilters,
} from "./filters";
import type { Artist, Concert } from "./types";

const artists: Artist[] = [
  { id: "a1", slug: "twice", name: "TWICE", country: "KR", genre: "kpop" },
  {
    id: "a2",
    slug: "one-ok-rock",
    name: "ONE OK ROCK",
    country: "JP",
    genre: "jpop",
  },
];

function makeConcert(overrides: Partial<Concert> = {}): Concert {
  return {
    id: "c1",
    artistId: "a1",
    title: "TWICE — TEN Tour",
    date: "2026-10-17",
    city: "Paris",
    venue: "Zénith de Paris",
    genre: "kpop",
    ticketStatus: "on_sale",
    source: "mock",
    sourceId: "mock-c1",
    updatedAt: "2026-09-22T06:00:00Z",
    ...overrides,
  };
}

describe("normalize", () => {
  it("retire les accents et met en minuscules", () => {
    expect(normalize("Zénith")).toBe("zenith");
    expect(normalize("LE SSERAFIM")).toBe("le sserafim");
  });

  it("nettoie les espaces superflus", () => {
    expect(normalize("  Paris  ")).toBe("paris");
  });
});

describe("filterConcerts", () => {
  const concerts: Concert[] = [
    makeConcert({ id: "c1", artistId: "a1", city: "Paris", genre: "kpop" }),
    makeConcert({
      id: "c2",
      artistId: "a2",
      title: "ONE OK ROCK — Detox Tour",
      city: "Toulouse",
      venue: "Zénith de Toulouse",
      genre: "jpop",
      ticketStatus: "sold_out",
    }),
  ];

  it("sans filtre, renvoie tous les concerts", () => {
    expect(filterConcerts(concerts, artists, NO_FILTERS)).toHaveLength(2);
  });

  it("filtre par genre", () => {
    const result = filterConcerts(concerts, artists, {
      ...NO_FILTERS,
      genre: "jpop",
    });
    expect(result.map((c) => c.id)).toEqual(["c2"]);
  });

  it("recherche l'accent en moins, comme dans l'artiste ou la salle", () => {
    // Le cas vérifié en direct à l'étape 8 : "zenith" doit trouver "Zénith".
    const result = filterConcerts(concerts, artists, {
      ...NO_FILTERS,
      search: "zenith",
    });
    expect(result).toHaveLength(2);
  });

  it("la recherche à plusieurs mots exige tous les mots, dans n'importe quel ordre", () => {
    const result = filterConcerts(concerts, artists, {
      ...NO_FILTERS,
      search: "toulouse rock",
    });
    expect(result.map((c) => c.id)).toEqual(["c2"]);
  });

  it("combine plusieurs filtres à la fois", () => {
    const result = filterConcerts(concerts, artists, {
      ...NO_FILTERS,
      genre: "jpop",
      city: "Toulouse",
    });
    expect(result.map((c) => c.id)).toEqual(["c2"]);
  });

  it("le filtre billetterie ouverte exclut un concert complet", () => {
    const result = filterConcerts(concerts, artists, {
      ...NO_FILTERS,
      onlyOnSale: true,
    });
    expect(result.map((c) => c.id)).toEqual(["c1"]);
  });

  it("le filtre mes artistes ne garde que les favoris", () => {
    const result = filterConcerts(
      concerts,
      artists,
      { ...NO_FILTERS, onlyFavorites: true },
      ["a2"],
    );
    expect(result.map((c) => c.id)).toEqual(["c2"]);
  });
});

describe("getCityFacets", () => {
  it("compte les concerts par ville, la mieux fournie en premier", () => {
    const concerts = [
      makeConcert({ id: "c1", city: "Paris" }),
      makeConcert({ id: "c2", city: "Paris" }),
      makeConcert({ id: "c3", city: "Toulouse" }),
    ];

    expect(getCityFacets(concerts)).toEqual([
      { value: "Paris", label: "Paris", count: 2 },
      { value: "Toulouse", label: "Toulouse", count: 1 },
    ]);
  });
});

describe("getMonthFacets", () => {
  it("regroupe par mois dans l'ordre chronologique", () => {
    const concerts = [
      makeConcert({ id: "c1", date: "2026-11-05" }),
      makeConcert({ id: "c2", date: "2026-10-17" }),
      makeConcert({ id: "c3", date: "2026-10-20" }),
    ];

    const facets = getMonthFacets(concerts);
    expect(facets.map((f) => f.value)).toEqual(["2026-10", "2026-11"]);
    expect(facets[0].count).toBe(2);
  });
});

describe("hasActiveFilters", () => {
  it("est faux quand aucun filtre n'est actif", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });

  it("est vrai dès qu'un seul filtre change", () => {
    expect(hasActiveFilters({ ...NO_FILTERS, city: "Paris" })).toBe(true);
  });
});

describe("filtres ↔ URL", () => {
  it("filtersToQuery omet les filtres inactifs", () => {
    expect(filtersToQuery(NO_FILTERS)).toBe("");
  });

  it("filtersToQuery puis filtersFromParams redonne les mêmes filtres", () => {
    const filters: ConcertFilters = {
      search: "twice",
      genre: "kpop",
      city: "Paris",
      month: "2026-10",
      onlyOnSale: true,
      onlyFavorites: true,
    };

    const query = filtersToQuery(filters);
    const params = new URLSearchParams(query);

    expect(filtersFromParams(params)).toEqual(filters);
  });

  it("ignore une valeur de genre invalide plutôt que de planter", () => {
    // Une adresse modifiée à la main (votre §23) : "genre=n-importe-quoi"
    // doit retomber sur "all", pas faire planter la page.
    const params = new URLSearchParams("genre=n-importe-quoi");
    expect(filtersFromParams(params).genre).toBe("all");
  });

  it("ignore un mois mal formé", () => {
    const params = new URLSearchParams("mois=pas-un-mois");
    expect(filtersFromParams(params).month).toBe("all");
  });
});
