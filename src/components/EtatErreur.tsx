import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';

interface Props {
  message: string;
  onReessayer: () => void;
}

/** US C3 : écran distinct lorsque la requête échoue (réseau, HTTP ou réponse illisible). */
export function EtatErreur({ message, onReessayer }: Props) {
  return (
    <>
      <Alert
        severity="error"
        as="h2"
        title="La recherche n’a pas abouti"
        description={`${message} Vos critères de recherche sont conservés.`}
      />
      <p className="fr-mt-2w">
        Le service de l’Annuaire de l’administration est peut-être indisponible
        ou votre connexion a été interrompue.
      </p>
      <Button onClick={onReessayer} iconId="fr-icon-refresh-line">
        Réessayer
      </Button>
    </>
  );
}
