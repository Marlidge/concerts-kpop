/**
 * @vitest-environment jsdom
 *
 * Tests des notifications marquées comme lues (votre §20, §28).
 * Même construction que favorites.test.ts : voir ses commentaires.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "concerts-kpop:dismissed-notifications";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function freshDismissalsModule() {
  return await import("./dismissals");
}

describe("dismissals", () => {
  it("ne contient rien de lu au départ", async () => {
    const { getDismissals } = await freshDismissalsModule();
    expect(getDismissals()).toEqual([]);
  });

  it("dismiss ajoute une notification à la liste des lues", async () => {
    const { getDismissals, dismiss } = await freshDismissalsModule();

    dismiss("new:c1");

    expect(getDismissals()).toEqual(["new:c1"]);
  });

  it("dismiss appliqué deux fois ne duplique pas l'entrée", async () => {
    const { getDismissals, dismiss } = await freshDismissalsModule();

    dismiss("new:c1");
    dismiss("new:c1");

    expect(getDismissals()).toEqual(["new:c1"]);
  });

  it("dismissAll marque plusieurs notifications d'un coup", async () => {
    const { getDismissals, dismiss, dismissAll } = await freshDismissalsModule();

    dismiss("new:c1");
    dismissAll(["new:c1", "opening:c2", "favorite:c3"]);

    expect(getDismissals().sort()).toEqual(
      ["new:c1", "opening:c2", "favorite:c3"].sort(),
    );
  });

  it("retrouve les notifications déjà marquées comme lues au chargement", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["new:c1"]));

    const { getDismissals } = await freshDismissalsModule();

    expect(getDismissals()).toEqual(["new:c1"]);
  });
});
