import { useCallback, useEffect, useMemo, useState } from 'react';
import { creerRecherche, lireJson, type EtatRecherche, type ExecuterRecherche } from '../api/recherche';

export function useRecherche(url: string | null, executer: ExecuterRecherche = lireJson) {
  const [etat, setEtat] = useState<EtatRecherche>({ statut: 'initial' });
  const recherche = useMemo(() => creerRecherche(setEtat, 300, executer), [executer]);

  useEffect(() => {
    recherche.rechercher(url);
    return () => recherche.annuler();
  }, [recherche, url]);

  const relancer = useCallback(() => recherche.rechercher(url), [recherche, url]);
  // Ne jamais rendre les données des anciens critères, même avant le nettoyage de l'effet.
  const etatActuel: EtatRecherche = etat.statut !== 'initial' && etat.url !== url
    ? { statut: 'initial' } : etat;
  return { etat: etatActuel, relancer, annuler: recherche.annuler };
}
