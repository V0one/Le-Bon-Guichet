import { objet, texte } from './organisme';
import type { Lieu } from './types';

export function normaliserLieux(donneesBrutes: unknown): Lieu[] {
  const features = objet(donneesBrutes).features;
  if (!Array.isArray(features)) return [];
  const lieux: Lieu[] = [];
  for (const feature of features) {
    const proprietes = objet(objet(feature).properties);
    const codeInsee = texte(proprietes.citycode);
    const libelle = texte(proprietes.label);
    if (!/^[0-9AB]{5}$/.test(codeInsee) || !libelle) continue;
    const position = objet(objet(feature).geometry).coordinates;
    const coordonnees = Array.isArray(position)
      && typeof position[0] === 'number' && Number.isFinite(position[0]) && Math.abs(position[0]) <= 180
      && typeof position[1] === 'number' && Number.isFinite(position[1]) && Math.abs(position[1]) <= 90
      ? { longitude: position[0], latitude: position[1] } : null;
    const id = texte(proprietes.id) || `${codeInsee}-${libelle}`;
    if (lieux.some(lieu => lieu.id === id)) continue;
    lieux.push({ id, libelle, codeInsee, codePostal: texte(proprietes.postcode) || null,
      commune: texte(proprietes.city), coordonnees });
  }
  return lieux;
}
