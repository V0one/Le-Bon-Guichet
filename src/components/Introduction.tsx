import { CallOut } from '@codegouvfr/react-dsfr/CallOut';

/** Longueur en dessous de laquelle aucune recherche n'est lancée. */
export const LONGUEUR_MINIMALE = 2;

/** US C3 : écran affiché avant toute recherche, sans aucun indicateur de chargement. */
export function Introduction() {
  return (
    <>
      <CallOut title="Que fait Le Bon Guichet ?" titleAs="h2" iconId="fr-icon-information-line">
        Le Bon Guichet vous aide à identifier l’administration compétente pour
        votre démarche et à la contacter. Recherchez une mairie, une CAF ou une
        CPAM par commune ou code postal, puis consultez ses coordonnées,
        ses horaires, son état d’ouverture et les informations d’accessibilité physique.
      </CallOut>

      <h2 className="fr-h4 fr-mt-4w">Ce que vous devez saisir</h2>
      <p>
        Indiquez <strong>la commune ou le code postal</strong> où vous cherchez
        un guichet, {LONGUEUR_MINIMALE} caractères au minimum. Exemples :{' '}
        <em>Amiens</em>, <em>80000</em>.
      </p>
      <p className="fr-text--sm">
        Choisissez un type d’organisme, puis saisissez un lieu. Sélectionnez
        une proposition pour rechercher les organismes de cette commune.
        Rien n’est envoyé tant que la localisation n’est pas renseignée.
      </p>
    </>
  );
}
