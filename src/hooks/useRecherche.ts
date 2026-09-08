import { useCallback, useEffect, useRef, useState } from 'react';
import { creerRecherche, type EtatRecherche } from '../api/recherche';

type Recherche = ReturnType<typeof creerRecherche>;

/**
 * Relie la recherche débattue (US C1) à React : une instance par composant,
 * relancée à chaque changement d'URL et annulée au démontage.
 */
export function useRecherche(url: string | null) {
  const [etat, setEtat] = useState<EtatRecherche>({ statut: 'initial' });

  const instance = useRef<Recherche | null>(null);
  instance.current ??= creerRecherche(setEtat);
  const recherche = instance.current;

  // Permet de relancer la dernière URL sans redéclencher l'effet.
  const derniereUrl = useRef(url);
  derniereUrl.current = url;

  useEffect(() => {
    recherche.rechercher(url);
  }, [recherche, url]);

  useEffect(() => () => recherche.annuler(), [recherche]);

  const relancer = useCallback(
    () => recherche.rechercher(derniereUrl.current),
    [recherche]
  );

  return { etat, relancer };
}
