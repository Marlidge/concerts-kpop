/**
 * Tests de la mise en forme (votre §28).
 *
 * Rien d'exotique ici : chaque fonction reçoit une entrée, on vérifie
 * la sortie. L'intérêt est surtout dans les cas limites — heure
 * absente, prix manquant — qui sont justement ceux que les vraies
 * sources produisent le plus souvent (voir l'étape 15 du pipeline).
 */

import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatOpening,
  formatPrice,
  formatTime,
  isRecent,
} from "./format";

describe("formatDate", () => {
  it("formate une date au format français", () => {
    // "2026-10-17" est un samedi.
    expect(formatDate("2026-10-17")).toBe("sam. 17 oct. 2026");
  });

  it("ne se trompe pas de jour à cause du fuseau horaire", () => {
    // Le piège classique : new Date("2026-01-01") interprété en UTC
    // peut reculer au 31 décembre selon le fuseau du poste. Le 1er
    // doit rester le 1er.
    expect(formatDate("2026-01-01")).toContain("1 janv.");
  });
});

describe("formatTime", () => {
  it("remplace le double-point par un h", () => {
    expect(formatTime("20:00")).toBe("20h00");
  });

  it("renvoie null quand l'heure n'est pas connue", () => {
    expect(formatTime(undefined)).toBeNull();
  });
});

describe("formatPrice", () => {
  it("affiche une fourchette quand min et max diffèrent", () => {
    expect(formatPrice(45, 90)).toBe("45 € – 90 €");
  });

  it("n'affiche qu'un seul prix quand min et max sont égaux", () => {
    // Le cas "Aimer — Le Bikini" des données fictives (étape 6) :
    // afficher "38 € – 38 €" serait maladroit.
    expect(formatPrice(38, 38)).toBe("38 €");
  });

  it("indique un minimum seul quand le maximum est inconnu", () => {
    expect(formatPrice(42, undefined)).toBe("à partir de 42 €");
  });

  it("indique un maximum seul quand le minimum est inconnu", () => {
    expect(formatPrice(undefined, 90)).toBe("jusqu'à 90 €");
  });

  it("renvoie null quand aucun prix n'est connu", () => {
    // Le cas le plus courant avec les vraies données (étape 15 :
    // aucun des 3 concerts Ticketmaster trouvés n'avait de prix).
    expect(formatPrice(undefined, undefined)).toBeNull();
  });
});

describe("formatOpening", () => {
  it("formate une date et une heure d'ouverture", () => {
    expect(formatOpening("2026-10-03T10:00")).toBe("3 oct. à 10h00");
  });

  it("renvoie null sans date d'ouverture", () => {
    expect(formatOpening(undefined)).toBeNull();
  });
});

describe("isRecent", () => {
  it("est vrai pour une date d'il y a 2 jours", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(isRecent(twoDaysAgo.toISOString())).toBe(true);
  });

  it("est faux pour une date d'il y a 30 jours", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(isRecent(thirtyDaysAgo.toISOString())).toBe(false);
  });

  it("est faux sans date", () => {
    expect(isRecent(undefined)).toBe(false);
  });

  it("ne plante pas sur une date invalide", () => {
    // Une source peut envoyer une date mal formée (votre §23) : la
    // fonction doit répondre "non", jamais lever une exception.
    expect(isRecent("pas-une-date")).toBe(false);
  });
});
