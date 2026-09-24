/**
 * Tests du centre de notifications (votre §20, §28).
 *
 * Les dates sont calculées par rapport à "maintenant" (comme le
 * concert de démonstration ajouté à l'étape 18) plutôt qu'écrites en
 * dur : un test qui dépend d'une date fixe finit par échouer tout seul
 * le jour où cette date devient "hier".
 */

import { describe, expect, it } from "vitest";

import { getNotifications } from "./notifications";
import type { Artist, Concert } from "./types";

const artists: Artist[] = [
  { id: "a1", slug: "twice", name: "TWICE", country: "KR", genre: "kpop" },
];

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function makeConcert(overrides: Partial<Concert> = {}): Concert {
  return {
    id: "c1",
    artistId: "a1",
    title: "TWICE — TEN Tour",
    date: "2027-10-17",
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

describe("getNotifications", () => {
  it("signale un concert découvert récemment", () => {
    const concert = makeConcert({ firstSeenAt: hoursFromNow(-24) });

    const notifications = getNotifications([concert], artists, []);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].kind).toBe("new_concert");
  });

  it("ignore un concert découvert il y a plus de 7 jours", () => {
    const concert = makeConcert({ firstSeenAt: hoursFromNow(-24 * 10) });

    expect(getNotifications([concert], artists, [])).toHaveLength(0);
  });

  it("un concert récent d'un artiste favori donne la version 'favori', pas les deux", () => {
    const concert = makeConcert({
      artistId: "a1",
      firstSeenAt: hoursFromNow(-24),
    });

    const notifications = getNotifications([concert], artists, ["a1"]);

    // Une seule notification, pas une "nouveau concert" ET une
    // "favori" pour le même événement.
    expect(notifications).toHaveLength(1);
    expect(notifications[0].kind).toBe("favorite_artist");
  });

  it("signale une billetterie qui ouvre dans les 48h", () => {
    const concert = makeConcert({
      ticketStatus: "upcoming",
      ticketsOpenAt: hoursFromNow(12),
    });

    const notifications = getNotifications([concert], artists, []);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].kind).toBe("tickets_opening_soon");
  });

  it("ignore une billetterie qui ouvre dans plus de 48h", () => {
    const concert = makeConcert({
      ticketStatus: "upcoming",
      ticketsOpenAt: hoursFromNow(72),
    });

    expect(getNotifications([concert], artists, [])).toHaveLength(0);
  });

  it("ignore une billetterie déjà ouverte depuis peu", () => {
    // "upcoming" veut dire "pas encore ouverte" : si l'heure est
    // passée, le statut réel ne serait plus "upcoming" — mais on
    // vérifie que la fonction ne signale pas une ouverture négative.
    const concert = makeConcert({
      ticketStatus: "upcoming",
      ticketsOpenAt: hoursFromNow(-1),
    });

    expect(getNotifications([concert], artists, [])).toHaveLength(0);
  });

  it("un concert annulé ne génère jamais de notification", () => {
    const concert = makeConcert({
      ticketStatus: "cancelled",
      firstSeenAt: hoursFromNow(-24),
    });

    expect(getNotifications([concert], artists, [])).toHaveLength(0);
  });

  it("un même concert peut cumuler 'nouveau' et 'billetterie bientôt ouverte'", () => {
    const concert = makeConcert({
      firstSeenAt: hoursFromNow(-24),
      ticketStatus: "upcoming",
      ticketsOpenAt: hoursFromNow(12),
    });

    const notifications = getNotifications([concert], artists, []);

    expect(notifications.map((n) => n.kind).sort()).toEqual(
      ["new_concert", "tickets_opening_soon"].sort(),
    );
  });
});
