/**
 * Tests du calendrier (votre §17, §28).
 */

import { describe, expect, it } from "vitest";

import { buildMonthGrid, formatMonth, shiftMonth } from "./calendar";

describe("shiftMonth", () => {
  it("avance d'un mois normalement", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
  });

  it("recule d'un mois normalement", () => {
    expect(shiftMonth("2026-10", -1)).toBe("2026-09");
  });

  it("passe correctement à l'année suivante", () => {
    // Le cas vérifié en direct à l'étape 11 en naviguant le calendrier.
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("passe correctement à l'année précédente", () => {
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  });
});

describe("formatMonth", () => {
  it("met une majuscule au mois", () => {
    expect(formatMonth("2026-10")).toBe("Octobre 2026");
  });
});

describe("buildMonthGrid", () => {
  it("chaque ligne contient exactement 7 jours", () => {
    const grid = buildMonthGrid("2026-10", "2026-10-01");
    expect(grid.length % 7).toBe(0);
  });

  it("déborde sur le mois précédent pour compléter la première semaine", () => {
    // Octobre 2026 commence un jeudi : la grille doit inclure les
    // derniers jours de septembre.
    const grid = buildMonthGrid("2026-10", "2026-10-01");
    expect(grid[0].date < "2026-10-01").toBe(true);
    expect(grid[0].isCurrentMonth).toBe(false);
  });

  it("marque le jour du mois demandé comme faisant partie du mois", () => {
    const grid = buildMonthGrid("2026-10", "2026-10-01");
    const oct17 = grid.find((day) => day.date === "2026-10-17");
    expect(oct17?.isCurrentMonth).toBe(true);
    expect(oct17?.dayOfMonth).toBe(17);
  });

  it("marque un seul jour comme étant aujourd'hui", () => {
    const grid = buildMonthGrid("2026-10", "2026-10-17");
    const todayCells = grid.filter((day) => day.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].date).toBe("2026-10-17");
  });

  it("ne marque aucun jour comme aujourd'hui si le mois affiché n'est pas le mois en cours", () => {
    const grid = buildMonthGrid("2026-10", "2027-01-05");
    expect(grid.some((day) => day.isToday)).toBe(false);
  });
});
