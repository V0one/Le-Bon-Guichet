# Le Bon Guichet — Sujet C

Application de recherche d’administrations par type et par lieu. Les fonctionnalités sont en cours de développement.

## Page d’accueil

L’accueil présente le service, explique la saisie attendue — une commune ou un
code postal, 2 caractères au minimum — et lance la recherche seul, 300 ms après
la dernière frappe. Chaque état a son propre écran :

| État | Écran affiché |
| --- | --- |
| avant toute recherche, et pendant l’attente qui précède la requête | présentation du service et explication de la saisie, **sans aucun indicateur de chargement** |
| requête en cours | indicateur « Recherche en cours… », affiché seulement une fois la requête partie |
| réponse sans résultat | écran dédié « Aucun organisme trouvé » avec des pistes de correction |
| échec réseau, HTTP ou JSON | écran d’erreur dédié avec un bouton « Réessayer » |

Aucune requête n’est envoyée tant que la localisation est trop courte. L’affichage
des fiches (horaires, coordonnées, accessibilité) reste à venir.

## Installation

Node.js 22.12 ou supérieur est nécessaire (Node.js 24 conseillé).

```sh
npm ci
```

## Lancement

```sh
npm run dev
```

Ouvrir l’adresse affichée dans le terminal, par défaut http://localhost:5173. `npm start` lance également Vite.

## Tests

```sh
npm test
```

Pour exécuter les tests une seule fois :

```sh
npm run test:run
```

## Compilation

```sh
npm run build
```

TypeScript est vérifié avant la compilation. Les fichiers de production sont générés dans `dist`.

Pour prévisualiser la compilation :

```sh
npm run preview
```

L’hébergement doit renvoyer `index.html` pour les routes applicatives afin de permettre leur ouverture directe avec React Router.

## Technologies

React 19, TypeScript strict, Vite, React Router v7, `@codegouvfr/react-dsfr`, Vitest et Testing Library.
