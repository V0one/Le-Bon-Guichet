import type { Lieu } from './types';

export function lireLieuRecherche(parametres: URLSearchParams): Lieu | null {
  const codeInsee = parametres.get('codeInsee') ?? '';
  if (!/^(?:\d{2}|2[AB])\d{3}$/.test(codeInsee)) return null;
  const libelle = parametres.get('commune') || parametres.get('lieu') || codeInsee;
  return { id: codeInsee, codeInsee, libelle, commune: libelle,
    codePostal: null, coordonnees: null };
}

export function ecrireRechercheUrl(type: string, saisie: string, lieu: Lieu | null) {
  const parametres = new URLSearchParams({ type, lieu: saisie.trim() });
  if (lieu) {
    parametres.set('codeInsee', lieu.codeInsee);
    parametres.set('commune', lieu.libelle);
  }
  return parametres;
}
