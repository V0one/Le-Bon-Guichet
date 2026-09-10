# Le Bon Guichet — Sujet C

Projet pédagogique React : trouver une mairie, une CAF ou une CPAM implantée dans une commune, consulter ses coordonnées, ses horaires et ses informations d’accessibilité physique. Ce site ne constitue pas un service officiel.

## Installation et lancement

Prérequis : Node.js 22.12 ou supérieur, npm. Node.js 24 est utilisé en CI.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite, généralement http://localhost:5173. `npm start` lance également Vite.

```sh
npm run build
npm run preview
```

Le build vérifie TypeScript puis génère `dist`. L’hébergement doit rediriger les routes applicatives vers `index.html` pour permettre l’ouverture directe des fiches et des recherches partagées.

## Parcours et fonctionnalités

1. Choisir Mairie, CAF ou CPAM et saisir une commune ou un code postal (2 caractères minimum).
2. Sélectionner une proposition du géocodeur pour charger les organismes de cette commune.
3. Consulter la liste de cartes DSFR, précédée du nombre de résultats, puis ouvrir une fiche.
4. Copier l’URL de recherche pour partager le type, la saisie et la commune sélectionnée. Un rechargement restaure la recherche ; le bouton Retour restaure les critères précédents.

La fiche affiche le nom, l’adresse, les téléphones, le courriel, les horaires hebdomadaires, l’état d’ouverture et un encadré d’accessibilité physique. Un lien mène à la fiche officielle lorsqu’il est fourni. Les champs absents ont une mention explicite. Les identifiants inexistants affichent une page 404 ; le titre du navigateur suit la navigation.

| État | Comportement |
| --- | --- |
| Initial | Explication du service, sans indicateur de chargement. |
| Chargement | Annonce `aria-live` dès le départ de la requête ; région de résultats de hauteur stable et défilable. |
| Succès | Nombre d’organismes puis cartes DSFR. |
| Vide | Message explicite, conseils pour corriger ou élargir et bouton d’effacement. |
| Erreur | Message utilisateur sans trace technique ni code HTTP, bouton Réessayer. |

La saisie est temporisée de 300 ms. Toute nouvelle saisie annule la requête précédente ; un compteur de version empêche une réponse obsolète d’écraser les résultats récents. Chaque appel HTTP expire après 15 secondes, y compris pendant le décodage JSON. Le géocodeur et l’Annuaire ont des recherches indépendantes.

## Architecture

| Dossier | Responsabilité |
| --- | --- |
| `src/api` | URLs, appels HTTP, annulation, temporisation, expiration et pagination Annuaire. |
| `src/domain` | Fonctions pures : normalisation des données, filtrage, critères d’URL, horaires et jours fériés. Aucun appel réseau. |
| `src/data` | Copie versionnée du calendrier officiel des jours fériés. |
| `src/hooks` | Liaison entre les recherches asynchrones et l’état React. |
| `src/pages` | Recherche, fiche organisme et page 404. |
| `src/components` | Socle DSFR et composants d’affichage des différents états. |
| `src/tests` | Tests Vitest et Testing Library en miroir du code. |
| `scripts` | Copie des assets DSFR, actualisation du calendrier et validation navigateur. |

Stack : React 19, TypeScript strict, Vite, React Router v7, `@codegouvfr/react-dsfr`, Vitest et Testing Library. Playwright sert uniquement aux essais dans Chrome ; il n’est pas chargé par l’application.

Header, Footer, SkipLinks et réglage clair/sombre viennent du paquet DSFR officiel. Le bandeau pédagogique apparaît sur toutes les pages. Le CSS local réserve la hauteur des résultats et de l’annonce de chargement, sans couleur en dur ni surcharge des tokens DSFR.

## Sources et formats

| Source | Utilisation et traitement |
| --- | --- |
| [Géoplateforme](https://data.geopf.fr/geocodage/search/) | Réponse GeoJSON `features` : libellé, code INSEE et éventuelles coordonnées. Les propositions sans code INSEE exploitable sont ignorées. |
| [Annuaire de l’administration](https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records) | Enveloppe `results` / `total_count`. Recherche par `code_insee_commune`, fiche par `id`. Les champs `adresse`, `telephone`, `pivot` et `plage_ouverture` peuvent être des tableaux encodés en JSON ; ils sont normalisés avant affichage. |
| [Calendrier officiel Etalab](https://calendrier.api.gouv.fr/jours-feries/) | Dates ISO et noms des jours fériés par zone, sous Licence Ouverte 2.0. Copie locale : aucun troisième appel API dans le parcours utilisateur. |

L’Annuaire est paginé avant le filtrage local sur le type exact de `pivot`. Les identifiants sont dédupliqués. Une page manquante produit une erreur plutôt qu’une liste faussement complète ; une garde limite la lecture à 10 000 enregistrements.

## Calcul de l’ouverture et limites

Le calcul reçoit explicitement la date courante et utilise le fuseau du guichet, pas celui du navigateur. Il traite les plages sur plusieurs jours, les deux créneaux quotidiens de l’API, les pauses, les chevauchements, les passages à minuit et l’heure d’été/hiver. Le début d’un créneau est inclus, sa fin est exclue.

- Pendant une plage : « Ouvert actuellement », avec l’heure de fermeture.
- Avant une plage restante : « Fermé actuellement — ouvre aujourd’hui à… ».
- Sans plage ce jour : « Fermé aujourd’hui selon les horaires habituels ».
- Après la dernière plage : accueil terminé pour aujourd’hui.
- Horaires absents, malformés ou fuseau inconnu : ouverture indéterminée ou à confirmer.
- Horaires exploitables accompagnés de notes : état calculé normalement, avec « Selon les horaires habituels ; vérifiez les notes ci-dessous » et un encadré contenant les notes.
- Jour férié national/local ou calendrier hors période connue : ouverture à confirmer, sans affirmer une fermeture ou une ouverture.

Les notes horaires et les informations complémentaires de l’organisme sont affichées. Leur texte libre n’est pas interprété automatiquement : un rendez-vous, une exception ou une restriction peut changer l’accueil. Une fermeture exceptionnelle non publiée dans l’Annuaire ne peut pas être déduite. L’indicateur décrit donc les horaires habituels, pas une présence certifiée en temps réel. Il est actualisé chaque seconde et au retour sur l’onglet.

Le calendrier embarqué couvre 2025 à 2031, pour les 13 zones officielles. Alsace-Moselle utilise une confirmation prudente pour ses particularités locales. Le fuseau des territoires à plusieurs fuseaux, notamment la Polynésie, n’est pas deviné. La date d’actualisation, la source et les années disponibles sont conservées dans `src/data/jours-feries.json`.

```sh
npm run calendrier:actualiser
```

Cette commande télécharge les calendriers officiels, vérifie leur forme et conserve les années à partir de l’année précédente. Après actualisation, vérifier les tests et versionner le JSON. Une année non couverte ne devient jamais implicitement une année sans jours fériés.

La recherche porte sur l’implantation dans la commune choisie, sans calcul de distance ni garantie de compétence territoriale pour l’usager. Les coordonnées et l’accessibilité dépendent de ce que publie l’Annuaire ; aucune information absente n’est inventée. L’accessibilité téléphonique ne prouve pas l’accessibilité physique du bâtiment.

## Tests automatisés

```sh
npm test
npm run test:run
npm run build
```

Les tests vérifient notamment les données nulles, les horaires et leurs limites, les jours fériés locaux, les réponses obsolètes, l’annulation, l’expiration, les états des pages, les URL partagées et la gestion du focus. Des analyses axe-core couvrent l’accueil, les résultats et la fiche. Les tests jsdom ne mesurent pas le rendu visuel ni le contraste.

La CI `.github/workflows/CI.yml` exécute `npm ci`, les tests et le build sur Node 24, pour les PR et les pushes vers `main`. Elle ne lance pas encore la mesure de couverture et ne publie pas son rapport.

## Couverture des tests

Après installation des dépendances avec `npm ci` :

```sh
npm run test:coverage
```

La commande exécute les tests avec le fournisseur V8 et génère :

- `coverage/index.html` : rapport HTML à ouvrir dans un navigateur, avec le détail par fichier ;
- `coverage/coverage-summary.json` : résultats exploitables automatiquement ;
- un résumé dans le terminal.

La configuration inclut tous les fichiers TypeScript applicatifs de `src`, même non exécutés par les tests. Seuls les tests, `src/setupTests.ts` et les déclarations `*.d.ts` sont exclus. Les tests navigateur ne contribuent pas à cette mesure Vitest.

La commande échoue si les tests échouent ou si la couverture descend sous **60 % des lignes globalement**, ou sous **90 % des lignes et des branches pour l’ensemble de `src/domain`**. Les seuils métier portent sur le dossier agrégé, pas sur chaque fichier pris séparément.

Mesure du 10 septembre 2026 : **113 tests réussis**.

| Périmètre | Lignes | Branches | Seuil demandé |
| --- | --- | --- | --- |
| `src/domain` | 100 % (132/132) | 93,06 % (161/173) | 90 % lignes et branches |
| Global `src` | 97,16 % (309/318) | 92,83 % (298/321) | 60 % lignes |

Le rapport est généré localement pour consultation. Le dossier `coverage` reste ignoré par Git ; le rapport n’est pas encore versionné ni publié par la CI.

## Validation dans Chrome

Avec Chrome installé et Vite lancé dans un autre terminal :

```sh
npm run test:browser
```

Si Vite utilise une autre adresse, préciser `TEST_BASE_URL`. Exemple PowerShell :

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:5174'
npm run test:browser
```

Le script ouvre une session Chrome isolée sans interface, utilise les API réelles et produit `artifacts/navigateur/rapport.json` et des captures PNG. Les artifacts locaux ne sont pas versionnés. Les scénarios comprennent les URL directes et partagées, le retour navigateur, l’état vide, la coupure réseau et le réessai, la 3G lente sur ordinateur et mobile, l’annulation, une réponse volontairement retardée, le clavier et les thèmes.

Les erreurs réseau des scénarios de panne sont attendues dans la console développeur ; elles ne doivent pas apparaître à l’usager. Les tests échouent sur une exception JavaScript ou un avertissement React de structure HTML. Le parcours nominal exige une console sans erreur.

Un test navigateur automatisé ne remplace pas une écoute avec un lecteur d’écran. La soutenance doit encore démontrer les scénarios demandés sur son poste et son réseau.

Dernière validation navigateur : le 9 septembre 2026, 8 scénarios réussis dans Chrome 152 avec les API réelles. Le pied de page conserve exactement sa position entre chargement et résultats, aux largeurs 1280 et 390 pixels. Le parcours nominal ne produit aucune erreur console. Les états horaires ont aussi été vérifiés sur une fiche réelle avec une horloge simulée. La mesure Vitest plus récente figure dans la section couverture ci-dessus.
