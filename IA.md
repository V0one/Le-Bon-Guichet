# Utilisation de l’IA — Le Bon Guichet

## Outil et périmètre

Ce document présente la déclaration collective du groupe : Lucas Mathieu, V0one (Enzo), Ahmet Balkaya et Vivien Marcuz. Il rassemble les usages de l’IA dans le projet ; les contributions individuelles sont précisées lorsqu’un exemple concerne un membre en particulier.

Codex, l’assistant de programmation d’OpenAI, a été utilisé dans le dépôt pour produire et modifier du code, expliquer les choix techniques, rechercher des erreurs, écrire et exécuter des tests et rédiger des documents. Cette déclaration s’appuie sur les échanges de travail, les déclarations du groupe et les modifications Git correspondantes.

| Usage                         | Exemples dans le projet                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exploration et explications   | Lecture du sujet et du cours, compréhension des formats des API et des données manquantes, analyse des critères des stories.                                                                               |
| Implémentation et intégration | Logique C1/C2, adaptation de la stack, intégration du parcours de recherche avec les contributions des autres membres, états d’affichage, restauration de la commune dans l’URL, horaires et jours fériés. |
| Tests et débogage             | Tests Vitest et Testing Library, scénarios Playwright dans Chrome, analyse des régressions après fusion, mesure et configuration de la couverture.                                                         |
| Documentation                 | README, synthèse des décisions techniques à partir de Git et rédaction du présent fichier.                                                                                                                 |

Les demandes humaines ont fixé le périmètre des stories, les contraintes du cours, le caractère minimal de l’interface et les corrections attendues. L’assistant a également réalisé des modifications substantielles du code ; son intervention ne s’est pas limitée à des explications. Les corrections et les tests présentés ci-dessous ont eux-mêmes bénéficié de cette assistance.

Les usages ci-dessus concernent le travail collectif et ne signifient pas que chaque membre a utilisé l’assistant pour chacune de ces tâches. Git permet de retrouver les changements et leurs auteurs ; les conditions d’utilisation de l’IA relèvent de la déclaration du groupe.

## Trois erreurs de l’assistant et leurs corrections

### 1. Une erreur HTML manquée pendant la revue du parcours

**Erreur :** l’assistant avait laissé passer une liste `<ul>` dans le contenu d’un `CallOut` DSFR. Ce composant enveloppe son contenu dans un paragraphe `<p>` : le résultat était une imbrication HTML invalide. L’erreur de l’assistant portait ici sur la revue et la validation de l’intégration ; le commit d’origine ne prouve pas que ce composant avait été généré dans cette conversation.

**Détection :** lors des essais dans Chrome, la console React signalait qu’un `<ul>` ne pouvait pas être descendant d’un `<p>`. Les tests déjà réussis ne suffisaient donc pas à valider l’absence d’erreur console.

**Correction :** le contenu a été remplacé par un paragraphe descriptif compatible avec `CallOut`. Le scénario navigateur vérifie également l’absence d’erreur console sur le parcours nominal.

**Preuve Git :** [614f1a0](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0), fichier `src/components/Introduction.tsx`.

```sh
git show 614f1a0 -- src/components/Introduction.tsx
```

### 2. Deux mises à jour concurrentes du type d’organisme

**Erreur :** dans l’intégration assistée de la recherche partageable, le changement de type modifiait à la fois l’état React et les paramètres d’URL. Un retour navigateur très rapide pouvait rétablir `type=mairie` dans l’URL tout en laissant « CAF » sélectionné dans le formulaire.

Avant, dans le gestionnaire de changement :

```tsx
setType(event.target.value);
if (lieu) setParametres(ecrireRechercheUrl(event.target.value, saisie, lieu));
```

**Correction :** pour une commune sélectionnée, le changement passe par l’URL, dont la synchronisation met ensuite à jour le formulaire. L’état local sert lorsque la commune n’est pas encore sélectionnée.

```tsx
if (lieu) setParametres(ecrireRechercheUrl(event.target.value, saisie, lieu));
else setType(event.target.value);
```

**Vérification :** le scénario Chrome change le type, revient immédiatement en arrière et attend que le formulaire affiche de nouveau « Mairie ».

**Preuves Git :** introduction dans [76747eb](https://github.com/V0one/Le-Bon-Guichet/commit/76747eb), correction dans [614f1a0](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0), fichier `src/pages/Recherche.tsx`.

```sh
git show 76747eb -- src/pages/Recherche.tsx
git show 614f1a0 -- src/pages/Recherche.tsx
```

### 3. Un test qui comparait les objets au lieu du comportement d’annulation

**Erreur :** le test assisté de pagination exigeait que le signal passé à `fetch` soit exactement le même objet que celui fourni par l’appelant :

```ts
expect(fetchMock.mock.calls[1][1].signal).toBe(controleur.signal);
```

Après l’ajout d’une expiration par Ahmet, `AbortSignal.any` combinait le signal de l’appelant et celui de la minuterie. L’annulation pouvait fonctionner correctement avec un nouvel objet signal ; l’assertion était devenue inadaptée. Cette incompatibilité n’avait pas été repérée avant la nouvelle exécution des tests.

**Correction :** vérifier que les signaux des appels sont initialement actifs puis deviennent tous annulés quand l’appelant annule :

```ts
const signaux = fetchMock.mock.calls.map(
  (appel) => appel[1].signal as AbortSignal,
);
expect(signaux.every((signal) => !signal.aborted)).toBe(true);
controleur.abort();
expect(signaux.every((signal) => signal.aborted)).toBe(true);
```

**Preuves Git :** ajout de l’expiration dans [9f2651f](https://github.com/V0one/Le-Bon-Guichet/commit/9f2651f), adaptation du test dans [614f1a0](https://github.com/V0one/Le-Bon-Guichet/commit/614f1a0), fichier `src/tests/api/annuaires.test.ts`.

```sh
git show 9f2651f -- src/api/recherche.ts
git show 614f1a0 -- src/tests/api/annuaires.test.ts
```

Ces trois cas sont distincts, même si leurs corrections ont été regroupées dans le même commit de validation navigateur et de tests.

## Exemple de code critique travaillé avec assistance

Dans `src/api/recherche.ts`, avant de publier une réponse :

```ts
if (versionRequete !== version || requete.signal.aborted) return;
controleur = undefined;
publier(prochainEtat);
```

Cette vérification intervient après l’attente de la réponse et de son décodage. Une nouvelle saisie incrémente la version et annule la requête précédente : une réponse obsolète ne peut donc plus remplacer les résultats actuels, même si son traitement finit tardivement. Le contrôle de version complète l’annulation du transport.

Cet extrait est issu du travail assisté sur C1, visible dans [dfe2bc6](https://github.com/V0one/Le-Bon-Guichet/commit/dfe2bc6). Il constitue un exemple à comprendre et à expliquer en soutenance ; il n’est pas déclaré comme écrit sans IA.

## Assistance pour l’interface et le DSFR

Le groupe a utilisé l’assistant pour comprendre l’installation et les contraintes du paquet officiel `@codegouvfr/react-dsfr`, puis intégrer les composants `Select`, `Input` et `Card`. Cette aide a porté sur la lecture de la documentation, l’écriture du JSX et les corrections lors de l’intégration, en respectant les styles et les tokens du DSFR.

```tsx
<Select
  label="Type d’organisme"
  nativeSelectProps={{
    value: type,
    onChange: (event) => {
      if (lieu) setParametres(ecrireRechercheUrl(event.target.value, saisie, lieu));
      else setType(event.target.value);
    },
  }}
>
  <option value="mairie">Mairie</option>
  <option value="caf">CAF</option>
  <option value="cpam">CPAM</option>
</Select>
```

## Partie écrite sans assistance

**Membre concerné :** Enzo.

**Fichier concerné :** `src/domain/types.ts`, interfaces `Coordonnees` et `Lieu`, introduites dans le commit [3cb0e4b](https://github.com/V0one/Le-Bon-Guichet/commit/3cb0e4b), signé V0one.

**Membre concerné :** Lucas.

**Fichier concerné :** `src/tests/domain/horaires.test.ts`, lignes 4 à 19 : définition des créneaux et tests d’ouverture, de pause et de fermeture, introduits dans le commit [76747eb](https://github.com/V0one/Le-Bon-Guichet/commit/76747eb), signé Lucas Mathieu.

**Membre concerné :** Ahmet Balkaya (nounoursjavoue)

**Fichier concerné :** `src/pages/Recherche.tsx`, lignes 23 à 67 : La recherche doit être stockée dans l’URL. Introduit dans le commit [ee842d6] (https://github.com/V0one/Le-Bon-Guichet/commit/ee842d6f158e4d6a530fbbc96f88a7b8dc8882d4)

```ts
export interface Coordonnees {
  longitude: number;
  latitude: number;
}

export interface Lieu {
  id: string;
  libelle: string;
  codeInsee: string;
  codePostal: string | null;
  commune: string;
  coordonnees: Coordonnees | null;
}
```

**Pourquoi ce choix :** définir manuellement le contrat métier a permis à V0one de sélectionner les informations nécessaires aux composants : identifiant, libellé, code INSEE, code postal, commune et coordonnées. Les valeurs `null` rendent explicite l’absence possible de certaines données. Ce modèle évite de faire dépendre les composants de la structure imbriquée du GeoJSON ; la normalisation réalise ensuite la conversion depuis la réponse de l’API.

```sh
git show 3cb0e4b:src/domain/types.ts
```

**Membre concerné :** Vivien

**Fichier concerné :** `src/tests/domain/lieux.test.ts`et en partie `src\domain\lieux.ts`