# Le Bon Guichet — Sujet C

Application de recherche d’administrations par type et par lieu. Les fonctionnalités sont en cours de développement.

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
