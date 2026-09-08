/** US C3 : affiché uniquement une fois la requête réellement partie. */
export function Chargement() {
  return (
    <p role="status" className="fr-mb-0">
      <span className="lbg-spinner fr-mr-1w" aria-hidden="true" />
      Recherche en cours…
    </p>
  );
}
