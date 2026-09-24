import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { getAllArtists, getUpcomingConcerts } from "@/lib/data";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Concerts K-pop & J-pop en France",
  description:
    "Trouvez les concerts K-pop et J-pop partout en France, suivez vos artistes préférés et ne manquez plus une ouverture de billetterie.",
};

export const viewport: Viewport = {
  // Indique au navigateur que le site gère les deux modes : les éléments
  // natifs (barres de défilement, champs de formulaire) suivront le thème.
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Chargé une fois ici (composant serveur) plutôt que dans chaque
  // page : la cloche de notifications a besoin des mêmes données sur
  // tout le site, elle vit dans l'en-tête commun à toutes les pages.
  const concerts = getUpcomingConcerts();
  const artists = getAllArtists();

  return (
    <html
      lang="fr"
      // Le script ci-dessous pose data-theme sur cette balise avant
      // que React ne prenne le relais. Sans suppressHydrationWarning
      // ICI (pas sur le script : c'est <html> que l'attribut modifie),
      // React comparerait le HTML reçu du serveur — qui ne connaît pas
      // votre choix de thème, stocké dans le navigateur — à ce que le
      // script vient de poser, verrait une différence, et le
      // signalerait comme une erreur alors que c'est voulu.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Balise <script> ordinaire plutôt que le composant Script de
            Next.js : ce dernier ("beforeInteractive") provoquait une
            erreur d'hydratation dans cette version (React 19 +
            Turbopack) au lieu d'être simplement déplacé dans <head>
            comme sa documentation le promet. Une balise native, placée
            en tout premier dans <body>, obtient le même résultat :
            elle s'exécute pendant que le navigateur lit encore la
            page, avant tout affichage — sans dépendre de ce mécanisme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <SiteHeader concerts={concerts} artists={artists} />
        {children}
      </body>
    </html>
  );
}
