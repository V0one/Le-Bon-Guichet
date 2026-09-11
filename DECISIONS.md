# Décisions techniques — Le Bon Guichet

Ces six décisions décrivent les choix présents dans le projet au 10 septembre 2026 et leur évolution dans Git. Elles couvrent les contributions des quatre membres et les intégrations entre leurs travaux. Les alternatives expliquent les compromis techniques ; l’historique atteste les changements de code, pas les discussions de l’équipe.

## 1. Normaliser les données avant de les afficher

- **Problème :** les réponses peuvent contenir des champs nuls, des tableaux encodés en JSON ou des coordonnées invalides ; traiter ces cas dans chaque écran multiplierait les incohérences.
- **Option retenue :** regrouper les fonctions pures de normalisation dans `src/domain`, conserver des mentions explicites pour les informations absentes et tester leurs entrées limites avec Vitest, indépendamment de React. Références : [C2 — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/9c8bf21), [normalisation des lieux — V0one](https://github.com/V0one/Le-Bon-Guichet/commit/3cb0e4b), [tests des lieux — Vivien](https://github.com/V0one/Le-Bon-Guichet/commit/eb0ddb1).
- **Option écartée :** transmettre directement les objets bruts aux composants et répéter les vérifications dans le JSX, car un champ oublié pourrait casser une fiche et les règles seraient plus difficiles à tester.

## 2. Relier les API par le code INSEE et filtrer le type localement

- **Problème :** une saisie libre ou un code postal ne désigne pas forcément une commune unique, et filtrer une seule page de l’Annuaire peut donner une liste incomplète.
- **Option retenue :** faire sélectionner un lieu Géoplateforme, interroger l’Annuaire avec son code INSEE, charger les pages puis filtrer le type exact dans `pivot` et dédupliquer les identifiants ; une pagination incomplète produit une erreur. Références : [parcours initial — V0one](https://github.com/V0one/Le-Bon-Guichet/commit/3cb0e4b), [pagination et intégration A1/B1/C1/C2](https://github.com/V0one/Le-Bon-Guichet/commit/7d7cbea).
- **Option écartée :** rechercher uniquement sur le nom saisi ou afficher les 100 premiers organismes comme une liste complète ; le rapprochement serait ambigu et le total pourrait être faux. Charger la commune entière coûte davantage de données, mais permet ensuite de changer de type sans nouvel appel.

## 3. Mutualiser la temporisation, l’annulation et l’expiration des appels

- **Problème :** des frappes rapides multiplient les appels, une ancienne réponse peut arriver après la nouvelle et une API bloquée peut laisser le chargement actif.
- **Option retenue :** utiliser le même gestionnaire avec des instances indépendantes pour le géocodeur et l’Annuaire : temporisation de 300 ms, `AbortController`, contrôle de version et expiration HTTP de 15 secondes, puis message utilisateur et réessai. Références : [C1 — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/dfe2bc6), [expiration initiale — Ahmet](https://github.com/V0one/Le-Bon-Guichet/commit/9f2651f), [ajustement après essais en 3G lente — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0).
- **Option écartée :** compter uniquement sur la temporisation ou l’annulation, qui ne suffisent pas à empêcher la publication d’un décodage terminé tardivement ; le délai initial de 2 secondes a aussi été abandonné car trop court pour une connexion lente.

## 4. Conserver la recherche sélectionnée dans l’URL

- **Problème :** une recherche stockée seulement dans l’état React disparaît au rechargement ; conserver uniquement le texte ne permet pas de retrouver la commune effectivement choisie.
- **Option retenue :** enregistrer le type, la saisie, le code INSEE et le libellé de la commune dans les paramètres d’URL, les relire à la navigation et charger une fiche par son identifiant dans `/organismes/:id`. Références : [recherche dans l’URL — Ahmet](https://github.com/V0one/Le-Bon-Guichet/commit/ee842d6), [routes de fiches — V0one](https://github.com/V0one/Le-Bon-Guichet/commit/3cb0e4b), [restauration de la commune — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/76747eb).
- **Option écartée :** conserver uniquement un état local ou une sauvegarde `localStorage`, car le lien partagé ne transporterait pas ces informations ; l’URL conserve les critères, sans embarquer une copie des résultats susceptible de devenir périmée.

## 5. Centraliser le socle DSFR et gérer explicitement le focus

- **Problème :** les pages doivent conserver un socle identique, les polices et icônes doivent fonctionner sous Windows, et la disparition d’un bouton après une recherche peut faire perdre le focus.
- **Option retenue :** partager un `Layout` avec les composants DSFR officiels, compléter la copie de leurs assets au `postinstall`, puis rendre le focus au contenu, aux résultats ou au champ selon l’action ; vérifier ces comportements avec Testing Library et axe. Références : [écrans d’état — Vivien](https://github.com/V0one/Le-Bon-Guichet/commit/86d93f0), [socle et assets — Vivien](https://github.com/V0one/Le-Bon-Guichet/commit/70d1bbe), [clavier, tests et CI — Vivien](https://github.com/V0one/Le-Bon-Guichet/commit/8f06ecf).
- **Option écartée :** dupliquer le socle dans chaque page, copier manuellement les assets ou laisser uniquement le navigateur choisir le focus après remplacement du contenu ; ces solutions compliqueraient la maintenance et fragiliseraient le parcours au clavier.

## 6. Calculer les horaires habituels sans inventer les exceptions

- **Problème :** les horaires combinent plusieurs créneaux, des passages à minuit et des notes libres ; l’heure du navigateur ou un jour férié peuvent rendre une indication d’ouverture trompeuse.
- **Option retenue :** calculer l’ouverture dans une fonction pure recevant la date, avec le fuseau du guichet et un calendrier officiel embarqué et actualisable ; l’état est désormais calculé malgré les notes, affichées avec une invitation à les vérifier. Les jours fériés, calendriers périmés ou horaires inexploitables gardent une indication incertaine. Références de la mise en place initiale : [horaires et tests — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/76747eb), [jours fériés et validation navigateur — Lucas](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0).
- **Option écartée :** interpréter automatiquement les notes comme des règles certaines ou déduire une fermeture de tout jour férié ; une ouverture exceptionnelle reste possible. Le calendrier local évite aussi de rendre chaque fiche dépendante d’un troisième appel réseau, au prix d’une actualisation périodique.

## Repères dans les contributions

Les noms ci-dessous correspondent aux auteurs Git. Les références montrent les apports et leur intégration, sans attribuer les décisions collectives à une seule personne.

| Auteur Git | Apports retrouvés dans l’historique |
| --- | --- |
| V0one | Parcours type + lieu, appels API, normalisation des lieux et des types, routes et fiches ; intégration et évolution de la recherche ([3cb0e4b](https://github.com/V0one/Le-Bon-Guichet/commit/3cb0e4b), [d210c6c](https://github.com/V0one/Le-Bon-Guichet/commit/d210c6c)). |
| Ahmet Balkaya | Paramètres d’URL et restauration des critères ; expiration des appels lorsque le réseau ou l’API ne répond pas ([ee842d6](https://github.com/V0one/Le-Bon-Guichet/commit/ee842d6), [9f2651f](https://github.com/V0one/Le-Bon-Guichet/commit/9f2651f)). |
| vivien marcuz | État initial et composants d’état, socle DSFR et assets, gestion du focus, tests d’accessibilité, CI et tests de normalisation des lieux ([86d93f0](https://github.com/V0one/Le-Bon-Guichet/commit/86d93f0), [70d1bbe](https://github.com/V0one/Le-Bon-Guichet/commit/70d1bbe), [8f06ecf](https://github.com/V0one/Le-Bon-Guichet/commit/8f06ecf), [eb0ddb1](https://github.com/V0one/Le-Bon-Guichet/commit/eb0ddb1)). |
| Lucas Mathieu | C1/C2, migration du socle, états vide et chargement, intégrations, restauration de la commune, horaires, jours fériés, validation navigateur et couverture ([dfe2bc6](https://github.com/V0one/Le-Bon-Guichet/commit/dfe2bc6), [9c8bf21](https://github.com/V0one/Le-Bon-Guichet/commit/9c8bf21), [76747eb](https://github.com/V0one/Le-Bon-Guichet/commit/76747eb), [614f1a0](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0), [53334ac](https://github.com/V0one/Le-Bon-Guichet/commit/53334ac)). |
