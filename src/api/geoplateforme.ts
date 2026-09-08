import { lireJson } from './recherche';
import { objet } from '../domain/organisme';

export function urlLieux(saisie: string): string | null {
  const q = saisie.trim();
  if (q.length < 2) return null;
  return `https://data.geopf.fr/geocodage/search/?${new URLSearchParams({ q, limit: '5' })}`;
}

export async function lireLieux(url: string, signal: AbortSignal) {
  const donnees = await lireJson(url, signal);
  if (!Array.isArray(objet(donnees).features)) throw new Error('Réponse de localisation invalide.');
  return donnees;
}

export function chercherLieux(saisie: string, signal: AbortSignal) {
  const url = urlLieux(saisie);
  return url ? lireLieux(url, signal) : Promise.resolve({ features: [] });
}
