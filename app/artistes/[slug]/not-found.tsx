import Link from "next/link";

/**
 * Affichée quand notFound() est appelé dans la page artiste, c'est-à-dire
 * quand l'URL contient un slug qui ne correspond à personne.
 *
 * Votre §23 : une adresse erronée doit donner un message compréhensible,
 * pas une page d'erreur technique.
 */
export default function ArtistNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Cet artiste n&apos;est pas dans la base
      </h1>
      <p className="mt-3 text-subtle">
        Il n&apos;a peut-être pas encore été ajouté, ou le lien est erroné.
      </p>
      <Link
        href="/concerts"
        className="mt-8 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
      >
        Parcourir les concerts
      </Link>
    </main>
  );
}
