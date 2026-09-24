"use client";

/**
 * Barre de navigation (votre §12).
 *
 * Deux présentations du même menu : une rangée de liens sur grand
 * écran, un panneau dépliant sur téléphone. Six liens tenaient déjà
 * mal sur 375px de large (constaté à l'étape 18) — plutôt que de les
 * rétrécir encore, ils changent de forme sous le point de rupture "sm".
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Artist, Concert } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/concerts", label: "Concerts" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/villes", label: "Villes" },
  { href: "/statistiques", label: "Statistiques" },
  { href: "/mes-artistes", label: "Mes artistes" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="size-[18px]"
    >
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

type Props = {
  // Sert uniquement au calcul du nombre de notifications non lues
  // (voir NotificationBell) : la cloche remplace ici un 7e lien
  // textuel, l'en-tête étant déjà chargé.
  concerts: Concert[];
  artists: Artist[];
};

export function SiteHeader({ concerts, artists }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Un changement de page ferme le panneau mobile s'il était ouvert :
  // sans ça, cliquer un lien laisserait le menu affiché par-dessus la
  // nouvelle page. Ajusté PENDANT le rendu plutôt que dans un effet
  // (le remède que React documente pour "adapter un état quand une
  // prop change") : pas de rendu supplémentaire après coup, et la
  // même règle qui a déjà corrigé les favoris et les notifications
  // continue de s'appliquer, cette fois en signalant l'inverse — un
  // effet là où il n'en fallait pas.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-semibold tracking-tight sm:text-sm"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-primary"
          />
          Concerts K-pop &amp; J-pop
        </Link>

        <div className="flex items-center gap-1">
          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 sm:flex"
          >
            {LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-subtle hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 border-l border-border pl-1.5 sm:pl-1">
            <ThemeToggle />
            <NotificationBell concerts={concerts} artists={artists} />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-muted hover:text-foreground sm:hidden"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Navigation principale (mobile)"
          className="border-t border-border px-6 py-3 sm:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary-soft text-primary"
                        : "text-subtle hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
