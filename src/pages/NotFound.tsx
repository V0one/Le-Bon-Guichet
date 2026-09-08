import Button from "@codegouvfr/react-dsfr/Button";

export function NotFound() {
  return (
    <div className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8">
          <h1 className="fr-h1">Page introuvable</h1>
          <p className="fr-text--lead">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          {/* Utilisation du composant Button du DSFR pour faire un lien de retour */}
          <Button linkProps={{ href: "/" }}>Retour à l'accueil</Button>
        </div>
      </div>
    </div>
  );
}
