import { lireJson } from './recherche';
import { lirePageAnnuaire } from '../domain/recherche';

const BASE = 'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records';

export function urlOrganismes(codeInsee: string): string {
  if (!/^[0-9AB]{5}$/.test(codeInsee)) throw new Error('Code INSEE invalide.');
  const params = new URLSearchParams({ where: `code_insee_commune="${codeInsee}"`, limit: '100', offset: '0', order_by: 'id' });
  return `${BASE}?${params}`;
}

export function urlFiche(id: string): string | null {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  return `${BASE}?${new URLSearchParams({ where: `id="${id}"`, limit: '1' })}`;
}

export async function lireAnnuaire(url: string, signal: AbortSignal) {
  const resultats: unknown[] = [];
  const prochaine = new URL(url);
  let offset = 0;
  // Charger toutes les pages avant le filtre local, sinon le total serait trompeur.
  while (offset < 10000) {
    if (signal.aborted) throw new DOMException('Annulé', 'AbortError');
    prochaine.searchParams.set('offset', String(offset));
    const page = lirePageAnnuaire(await lireJson(prochaine.toString(), signal));
    resultats.push(...page.results);
    if (resultats.length >= page.total_count) return { results: resultats, total_count: page.total_count };
    if (page.results.length === 0 || prochaine.searchParams.get('limit') === '1') {
      throw new Error('Réponse Annuaire incomplète.');
    }
    offset += page.results.length;
  }
  throw new Error('Trop de résultats pour cette recherche.');
}

export function chercherOrganismesParCommune(codeInsee: string, signal: AbortSignal) {
  return lireAnnuaire(urlOrganismes(codeInsee), signal);
}
