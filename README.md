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

Pour essayer le parcours dans le navigateur :

1. Ouvrir l’accueil : les explications sont visibles et aucune recherche ne démarre.
2. Choisir un type (Mairie, CAF ou CPAM), saisir `Amiens` et sélectionner la proposition `Amiens`.
3. Consulter les résultats puis ouvrir une fiche. Les données proviennent des API Géoplateforme et Annuaire.
4. Dans l’onglet Réseau, ralentir la connexion et changer la saisie pendant une requête : l’appel précédent est annulé et ses résultats ne doivent pas réapparaître.
5. Essayer `zzzzzz` pour l’état sans lieu trouvé ; couper le réseau puis relancer pour l’état d’erreur.

Les composants utilisent uniquement les styles fournis par le DSFR. La fiche affiche les coordonnées ; le calcul des horaires reste à réaliser. La recherche porte sur les organismes implantés dans la commune choisie.

```sh
npm test
```

Pour exécuter les tests une seule fois :

```sh
npm run test:run
```

Les fichiers de test sont regroupés dans `src/tests`, en miroir de l’arborescence
de `src`.

## Intégration continue

`.github/workflows/CI.yml` exécute `npm ci` puis `npm run test:run` sur Node 24,
à chaque pull request visant `main` et à chaque commit poussé sur `main`.

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

## Accessibilité au clavier

Tout le service s’utilise à la tabulation seule, sans souris.

| Point | Mise en œuvre |
| --- | --- |
| ordre de tabulation | sauts de contenu, en-tête, formulaire (type, localisation, bouton), résultats, pied de page — aucun `tabindex` positif |
| commandes | uniquement des éléments natifs (`select`, `input`, `button`, `a`) ; aucun comportement réservé à la souris |
| focus visible | anneau `2px solid #0a76f6` avec `outline-offset: 2px` fourni par le DSFR sur `a`, `button`, `input`, `select` et `[tabindex]` en `:focus-visible` ; aucune règle du projet ne le supprime |
| focus jamais masqué | aucun composant utilisé (`fr-header`, `fr-notice`, `fr-footer`, `fr-container`) n’est en `position: fixed` ni `sticky` — seule la modale d’affichage l’est, et le DSFR y piège le focus et le rend à son déclencheur. Les deux sauts de contenu sont les premiers éléments tabulables |
| focus jamais perdu | choisir un lieu ou réessayer déplace le focus sur la région de résultats, effacer la recherche le rend au champ Localisation, et changer de page le replace au début du contenu |

Les onze tests de `src/tests/accessibilite.test.tsx` vérifient ces points, dont deux
analyses `axe-core` (accueil et liste de résultats). Deux réserves : jsdom n’a pas
de moteur de rendu, donc ni le contraste, ni le tracé de l’anneau de focus, ni le
recouvrement d’un élément par un autre n’y sont mesurables. Ces trois points sont
vérifiés par lecture du CSS du DSFR et resteraient à confirmer dans un navigateur
réel (Playwright ou axe DevTools).

## Technologies

React 19, TypeScript strict, Vite, React Router v7, `@codegouvfr/react-dsfr`, Vitest, Testing Library et `vitest-axe`.
