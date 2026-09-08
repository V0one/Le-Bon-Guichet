/** US B2 : région d'annonce conservée avant, pendant et après la requête. */
export function Chargement({ actif = true }: { actif?: boolean }) {
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="fr-mb-0">
      {actif ? 'Recherche en cours…' : ''}
    </p>
  );
}
