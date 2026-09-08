import { Button } from '@codegouvfr/react-dsfr/Button';

interface Props {
  localisation: string;
  onReinitialiser: () => void;
}

/** US C3 : écran distinct lorsqu'une recherche aboutit sans aucun résultat. */
export function EtatVide({ localisation, onReinitialiser }: Props) {
  return (
    <>
      <h2 className="fr-h4">Aucun organisme trouvé</h2>
      <p>La recherche « {localisation} » n’a renvoyé aucun guichet.</p>
      <p className="fr-mb-1w">Vous pouvez :</p>
      <ul>
        <li>vérifier l’orthographe de la commune ;</li>
        <li>essayer le code postal à la place du nom de la commune ;</li>
        <li>essayer une commune voisine ou la préfecture du département.</li>
      </ul>
      <Button priority="secondary" onClick={onReinitialiser}>
        Effacer la recherche
      </Button>
    </>
  );
}
