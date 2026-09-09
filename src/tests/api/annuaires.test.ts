import { vi } from 'vitest';
import { lireAnnuaire, urlOrganismes } from '../../api/annuaires';

const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });
function page(results: unknown[], total_count: number) {
  return { ok: true, json: async () => ({ results, total_count }) } as Response;
}
test('charge toutes les pages de la commune avec le même signal', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(page([{ id: '1' }], 2)).mockResolvedValueOnce(page([{ id: '2' }], 2));
  globalThis.fetch = fetchMock;
  const controleur = new AbortController();
  const resultats = await lireAnnuaire(urlOrganismes('80021'), controleur.signal);
  expect(resultats.results).toHaveLength(2);
  expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('offset')).toBe('1');
  const signaux = fetchMock.mock.calls.map(appel => appel[1].signal as AbortSignal);
  expect(signaux.every(signal => !signal.aborted)).toBe(true);
  controleur.abort();
  expect(signaux.every(signal => signal.aborted)).toBe(true);
});
test('une page manquante ne publie pas un total incomplet', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(page([], 2));
  await expect(lireAnnuaire(urlOrganismes('80021'), new AbortController().signal)).rejects.toThrow();
});
test('aucun nouvel appel après annulation entre deux pages', async () => {
  const controleur = new AbortController();
  const fetchMock = vi.fn().mockImplementation(async () => {
    controleur.abort(); return page([{ id: '1' }], 2);
  });
  globalThis.fetch = fetchMock;
  await expect(lireAnnuaire(urlOrganismes('80021'), controleur.signal)).rejects.toThrow();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('un code de commune invalide est refusé avant une requête', () => {
  expect(() => urlOrganismes('" OR true')).toThrow();
});
