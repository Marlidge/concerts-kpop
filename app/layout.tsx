import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { getAllArtists, getUpcomingConcerts } from "@/lib/data";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SiteHeader concerts={concerts} artists={artists} />
        {children}
      </body>
    </html>
  );
}
