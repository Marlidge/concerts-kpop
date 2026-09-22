/**
 * DONNÉES FICTIVES — aucune de ces dates n'est réelle.
 *
 * Ce fichier sert uniquement à construire l'interface avant de brancher
 * les vraies sources (étape 14). Les artistes existent, mais les concerts
 * sont inventés, et les liens pointent vers example.com, le domaine
 * réservé aux exemples : impossible de les confondre avec une vraie
 * billetterie.
 *
 * Les cas sont volontairement variés (heure absente, prix inconnu,
 * complet, annulé, billetterie pas encore ouverte, concert passé) pour
 * que l'affichage soit confronté dès maintenant aux données incomplètes
 * qu'enverront les vraies APIs.
 */

import type { Artist, Concert } from "./types";

export const artists: Artist[] = [
  {
    id: "a1",
    slug: "twice",
    name: "TWICE",
    country: "KR",
    genre: "kpop",
    subGenre: "idol",
    isFavorite: true,
  },
  {
    id: "a2",
    slug: "stray-kids",
    name: "Stray Kids",
    country: "KR",
    genre: "kpop",
    subGenre: "idol",
    isFavorite: true,
  },
  {
    id: "a3",
    slug: "le-sserafim",
    name: "LE SSERAFIM",
    country: "KR",
    genre: "kpop",
    subGenre: "idol",
    isFavorite: false,
  },
  {
    id: "a4",
    slug: "babymetal",
    name: "BABYMETAL",
    country: "JP",
    genre: "jpop",
    subGenre: "kawaii metal",
    isFavorite: false,
  },
  {
    id: "a5",
    slug: "one-ok-rock",
    name: "ONE OK ROCK",
    country: "JP",
    genre: "jpop",
    subGenre: "j-rock",
    isFavorite: true,
  },
  {
    id: "a6",
    slug: "aimer",
    name: "Aimer",
    country: "JP",
    genre: "jpop",
    subGenre: "ballad",
    isFavorite: false,
  },
];

const UPDATED_AT = "2026-09-22T06:00:00Z";

export const concerts: Concert[] = [
  // --- Cas standard : tout est renseigné, billetterie ouverte ---
  {
    id: "c1",
    artistId: "a1",
    title: "TWICE — TEN Tour",
    date: "2026-10-17",
    time: "20:00",
    city: "Paris",
    region: "Île-de-France",
    venue: "Paris La Défense Arena",
    address: "99 Jardins de l'Arche, 92000 Nanterre",
    genre: "kpop",
    ticketStatus: "on_sale",
    priceMin: 59,
    priceMax: 189,
    officialUrl: "https://example.com/billetterie/twice-paris",
    source: "mock",
    sourceId: "mock-c1",
    updatedAt: UPDATED_AT,
  },

  // --- Billetterie pas encore ouverte : la date d'ouverture compte ---
  {
    id: "c2",
    artistId: "a2",
    title: "Stray Kids — dominATE World Tour",
    date: "2027-02-20",
    time: "19:30",
    city: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    venue: "LDLC Arena",
    genre: "kpop",
    ticketStatus: "upcoming",
    ticketsOpenAt: "2026-10-03T10:00",
    officialUrl: "https://example.com/billetterie/stray-kids-lyon",
    source: "mock",
    sourceId: "mock-c2",
    updatedAt: UPDATED_AT,
  },

  // --- Complet : le bouton de billetterie devra le refléter ---
  {
    id: "c3",
    artistId: "a5",
    title: "ONE OK ROCK — Detox Tour",
    date: "2026-11-08",
    time: "20:00",
    city: "Toulouse",
    region: "Occitanie",
    venue: "Zénith de Toulouse",
    address: "11 Avenue Raymond Badiou, 31300 Toulouse",
    genre: "jpop",
    ticketStatus: "sold_out",
    priceMin: 45,
    priceMax: 75,
    officialUrl: "https://example.com/billetterie/one-ok-rock-toulouse",
    source: "mock",
    sourceId: "mock-c3",
    updatedAt: UPDATED_AT,
  },

  // --- Ni heure ni prix : le cas le plus fréquent avec les vraies APIs ---
  {
    id: "c4",
    artistId: "a4",
    title: "BABYMETAL — World Tour 2026",
    date: "2026-12-05",
    city: "Lille",
    region: "Hauts-de-France",
    venue: "Zénith de Lille",
    genre: "jpop",
    ticketStatus: "on_sale",
    officialUrl: "https://example.com/billetterie/babymetal-lille",
    source: "mock",
    sourceId: "mock-c4",
    updatedAt: UPDATED_AT,
  },

  // --- Aucun lien de billetterie : la carte devra s'en passer ---
  {
    id: "c5",
    artistId: "a6",
    title: "Aimer — Live in Europe",
    date: "2027-03-14",
    time: "20:30",
    city: "Paris",
    region: "Île-de-France",
    venue: "Le Trianon",
    address: "80 Boulevard de Rochechouart, 75018 Paris",
    genre: "jpop",
    ticketStatus: "unknown",
    source: "mock",
    sourceId: "mock-c5",
    updatedAt: UPDATED_AT,
  },

  // --- Même artiste, autre ville : vérifie qu'on ne mélange pas les cartes ---
  {
    id: "c6",
    artistId: "a1",
    title: "TWICE — TEN Tour",
    date: "2026-10-20",
    time: "20:00",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    venue: "Arkéa Arena",
    genre: "kpop",
    ticketStatus: "on_sale",
    priceMin: 59,
    priceMax: 175,
    officialUrl: "https://example.com/billetterie/twice-bordeaux",
    source: "mock",
    sourceId: "mock-c6",
    updatedAt: UPDATED_AT,
  },

  {
    id: "c7",
    artistId: "a3",
    title: "LE SSERAFIM — EASY Crown Tour",
    date: "2027-01-24",
    time: "19:00",
    city: "Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    venue: "Le Dôme",
    genre: "kpop",
    ticketStatus: "on_sale",
    priceMin: 49,
    priceMax: 129,
    officialUrl: "https://example.com/billetterie/le-sserafim-marseille",
    source: "mock",
    sourceId: "mock-c7",
    updatedAt: UPDATED_AT,
  },

  // --- Annulé : ne doit pas disparaître, mais être clairement signalé ---
  {
    id: "c8",
    artistId: "a2",
    title: "Stray Kids — dominATE World Tour",
    date: "2026-11-29",
    time: "20:00",
    city: "Strasbourg",
    region: "Grand Est",
    venue: "Zénith de Strasbourg",
    genre: "kpop",
    ticketStatus: "cancelled",
    officialUrl: "https://example.com/billetterie/stray-kids-strasbourg",
    source: "mock",
    sourceId: "mock-c8",
    updatedAt: UPDATED_AT,
  },

  {
    id: "c9",
    artistId: "a4",
    title: "BABYMETAL — World Tour 2026",
    date: "2026-12-09",
    time: "19:30",
    city: "Nantes",
    region: "Pays de la Loire",
    venue: "Zénith Nantes Métropole",
    genre: "jpop",
    ticketStatus: "on_sale",
    priceMin: 42,
    officialUrl: "https://example.com/billetterie/babymetal-nantes",
    source: "mock",
    sourceId: "mock-c9",
    updatedAt: UPDATED_AT,
  },

  // --- Petite salle, prix unique : teste l'affichage d'un seul prix ---
  {
    id: "c10",
    artistId: "a6",
    title: "Aimer — Live in Europe",
    date: "2027-03-18",
    time: "20:00",
    city: "Toulouse",
    region: "Occitanie",
    venue: "Le Bikini",
    genre: "jpop",
    ticketStatus: "upcoming",
    ticketsOpenAt: "2026-11-15T10:00",
    priceMin: 38,
    priceMax: 38,
    officialUrl: "https://example.com/billetterie/aimer-toulouse",
    source: "mock",
    sourceId: "mock-c10",
    updatedAt: UPDATED_AT,
  },

  // --- Concerts passés : utiles pour la page artiste (§15) et les stats ---
  {
    id: "c11",
    artistId: "a5",
    title: "ONE OK ROCK — Luxury Disease Tour",
    date: "2026-03-11",
    time: "20:00",
    city: "Paris",
    region: "Île-de-France",
    venue: "Zénith Paris — La Villette",
    genre: "jpop",
    ticketStatus: "sold_out",
    priceMin: 45,
    priceMax: 69,
    officialUrl: "https://example.com/billetterie/one-ok-rock-paris-2026",
    source: "mock",
    sourceId: "mock-c11",
    updatedAt: UPDATED_AT,
  },

  {
    id: "c12",
    artistId: "a3",
    title: "LE SSERAFIM — FEARNADA",
    date: "2026-05-30",
    time: "19:00",
    city: "Paris",
    region: "Île-de-France",
    venue: "Accor Arena",
    genre: "kpop",
    ticketStatus: "sold_out",
    priceMin: 55,
    priceMax: 145,
    officialUrl: "https://example.com/billetterie/le-sserafim-paris-2026",
    source: "mock",
    sourceId: "mock-c12",
    updatedAt: UPDATED_AT,
  },
];
