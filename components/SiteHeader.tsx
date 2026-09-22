"use client";

/**
 * Barre de navigation (votre §12).
 *
 * Composant client uniquement pour usePathname, qui permet de mettre en
 * valeur la page en cours. Les autres entrées (Mes artistes, Calendrier,
 * Villes, Statistiques…) viendront au fil des étapes.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/concerts", label: "Concerts" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/mes-artistes", label: "Mes artistes" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
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

        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
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
      </div>
    </header>
  );
}
