import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Reflète le "@/*" de tsconfig.json, pour écrire les tests avec les
    // mêmes imports que le reste du site plutôt qu'en chemins relatifs.
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    // Les fichiers testés ici sont tous des fonctions pures (lib/) :
    // pas besoin d'un navigateur simulé, ce qui garde les tests rapides.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
