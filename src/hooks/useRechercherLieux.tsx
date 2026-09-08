import { useRecherche } from './useRecherche';
import { lireLieux, urlLieux } from '../api/geoplateforme';

export function useRechercheLieu(saisie: string) {
  return useRecherche(urlLieux(saisie), lireLieux);
}
