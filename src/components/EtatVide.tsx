import { Button } from '@codegouvfr/react-dsfr/Button';

interface Props {
  localisation: string;
  nature?: 'lieu' | 'organisme';
  onReinitialiser: () => void;
}

/** US B4 : résultat vide explicite, avec des actions pour poursuivre la recherche. */
export function EtatVide({ localisation, nature = 'organisme', onReinitialiser }: Props) {
  return (
    <>
      <h2 className="fr-h4">{nature === 'lieu' ? 'Aucun lieu trouvé' : 'Aucun organisme trouvé'}</h2>
      <p>{nature === 'lieu'
        ? `Aucun lieu ne correspond à « ${localisation} ».`
        : `Aucun organisme du type sélectionné n’a été trouvé à « ${localisation} ».`}</p>
      <p className="fr-mb-1w">Vous pouvez :</p>
      <ul>
        <li>vérifier l’orthographe de la commune ;</li>
        <li>essayer le code postal à la place du nom de la commune ;</li>
        <li>élargir la recherche à une commune voisine ;</li>
        {nature === 'organisme' && <li>choisir un autre type d’organisme.</li>}
      </ul>
      <Button priority="secondary" onClick={onReinitialiser}>
        Effacer la recherche
      </Button>
    </>
  );
}
