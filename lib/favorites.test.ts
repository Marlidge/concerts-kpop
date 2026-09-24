/**
 * @vitest-environment jsdom
 *
 * Tests de l'ajout aux favoris (votre §16, §28).
 *
 * Ce fichier a besoin d'un navigateur simulé (localStorage), donc d'un
 * environnement différent du reste de lib/ (voir vitest.config.ts,
 * qui utilise "node" par défaut) — d'où l'annotation ci-dessus,
 * propre à ce fichier.
 *
 * lib/favorites.ts garde son état dans une variable de module (le
 * "cache" décrit dans ses commentaires) : un test qui appellerait
 * toggleFavorite() laisserait donc cette valeur visible au test
 * suivant. resetModules() + une réimportation dynamique à chaque test
 * repartent d'un module tout neuf à chaque fois, comme au premier
 * chargement de la page.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "concerts-kpop:favorites";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function freshFavoritesModule() {
  return await import("./favorites");
}

describe("favorites", () => {
  it("ne contient aucun favori au départ", async () => {
    const { getFavorites } = await freshFavoritesModule();
    expect(getFavorites()).toEqual([]);
  });

  it("toggleFavorite ajoute un artiste absent des favoris", async () => {
    const { getFavorites, toggleFavorite } = await freshFavoritesModule();

    toggleFavorite("a1");

    expect(getFavorites()).toEqual(["a1"]);
  });

  it("toggleFavorite retire un artiste déjà favori", async () => {
    const { getFavorites, toggleFavorite } = await freshFavoritesModule();

    toggleFavorite("a1");
    toggleFavorite("a1");

    expect(getFavorites()).toEqual([]);
  });

  it("le favori est bien écrit dans localStorage, pas seulement en mémoire", async () => {
    const { toggleFavorite } = await freshFavoritesModule();

    toggleFavorite("a1");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual(["a1"]);
  });

  it("retrouve les favoris déjà enregistrés au chargement", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["a1", "a2"]));

    const { getFavorites } = await freshFavoritesModule();

    expect(getFavorites()).toEqual(["a1", "a2"]);
  });

  it("une valeur corrompue en localStorage ne fait pas planter la lecture", async () => {
    // Votre §23 : le stockage a pu être modifié à la main, ou corrompu.
    localStorage.setItem(STORAGE_KEY, "{ceci n'est pas du JSON valide");

    const { getFavorites } = await freshFavoritesModule();

    expect(getFavorites()).toEqual([]);
  });

  it("ignore les entrées qui ne sont pas des identifiants texte", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["a1", 42, null, { id: "a3" }, "a2"]),
    );

    const { getFavorites } = await freshFavoritesModule();

    expect(getFavorites()).toEqual(["a1", "a2"]);
  });

  it("getFavoritesOnServer renvoie toujours un tableau vide", async () => {
    const { toggleFavorite, getFavoritesOnServer } = await freshFavoritesModule();

    toggleFavorite("a1");

    // Le serveur n'a pas accès au navigateur : il ne doit jamais voir
    // les favoris, même après qu'ils ont été modifiés côté client.
    expect(getFavoritesOnServer()).toEqual([]);
  });
});
