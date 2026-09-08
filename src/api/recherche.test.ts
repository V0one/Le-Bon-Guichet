import { creerRecherche } from './recherche';

function differee<T>() {
  let resolve!: (valeur: T) => void;
  let reject!: (raison: Error) => void;
  const promise = new Promise<T>((succes, erreur) => {
    resolve = succes;
    reject = erreur;
  });
  return { promise, resolve, reject };
}

function reponse(donnees: unknown, ok = true): Response {
  return { ok, json: async () => donnees } as Response;
}

async function terminerPromesses() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const fetchInitial = global.fetch;
let fetchMock: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.fn().mockResolvedValue(reponse([]));
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  global.fetch = fetchInitial;
});

test('dix caractères rapides déclenchent une seule requête après la dernière frappe', async () => {
  const recherche = creerRecherche();
  const saisie = 'abcdefghij';
  for (let i = 1; i <= saisie.length; i += 1) {
    recherche.rechercher(`/search?q=${saisie.slice(0, i)}`);
    jest.advanceTimersByTime(20);
  }
  expect(fetchMock).toHaveBeenCalledTimes(0);
  jest.advanceTimersByTime(279);
  expect(fetchMock).toHaveBeenCalledTimes(0);
  jest.advanceTimersByTime(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('/search?q=abcdefghij');
  await terminerPromesses();
  expect(recherche.getEtat().statut).toBe('succes');
});

test('annule le signal de la requête en cours dès la nouvelle saisie', async () => {
  fetchMock.mockImplementation((_url: string, options: RequestInit) =>
    new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        reject(new DOMException('Requête annulée', 'AbortError'));
      });
    })
  );
  const recherche = creerRecherche();
  recherche.rechercher('/ancienne');
  jest.advanceTimersByTime(300);
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  recherche.rechercher('/nouvelle');
  expect(signal.aborted).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual({ statut: 'attente', url: '/nouvelle' });
});

test('une ancienne réponse ignorante de l’annulation ne remplace pas la plus récente', async () => {
  const ancienne = differee<Response>();
  const notifier = jest.fn();
  fetchMock.mockReturnValueOnce(ancienne.promise);
  fetchMock.mockResolvedValueOnce(reponse(['nouveau']));
  const recherche = creerRecherche(notifier);
  recherche.rechercher('/ancienne');
  jest.advanceTimersByTime(300);
  recherche.rechercher('/nouvelle');
  jest.advanceTimersByTime(300);
  await terminerPromesses();
  const etatRecent = recherche.getEtat();
  expect(etatRecent).toEqual({ statut: 'succes', url: '/nouvelle', donnees: ['nouveau'] });
  notifier.mockClear();
  ancienne.resolve(reponse(['ancien']));
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual(etatRecent);
  expect(notifier).not.toHaveBeenCalled();
});

test('ignore aussi un décodage JSON ancien terminé pendant le nouveau debounce', async () => {
  const json = differee<unknown>();
  fetchMock.mockResolvedValueOnce({ ok: true, json: () => json.promise });
  const recherche = creerRecherche();
  recherche.rechercher('/ancienne');
  jest.advanceTimersByTime(300);
  await terminerPromesses();
  recherche.rechercher('/nouvelle');
  json.resolve(['ancien']);
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual({ statut: 'attente', url: '/nouvelle' });
});

test('une erreur tardive ne remplace pas les résultats récents', async () => {
  const ancienne = differee<Response>();
  fetchMock.mockReturnValueOnce(ancienne.promise);
  const recherche = creerRecherche();
  recherche.rechercher('/ancienne');
  jest.advanceTimersByTime(300);
  recherche.rechercher('/nouvelle');
  jest.advanceTimersByTime(300);
  await terminerPromesses();
  ancienne.reject(new Error('Ancienne erreur réseau'));
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual({ statut: 'succes', url: '/nouvelle', donnees: [] });
});

test.each([null, '', '   '])('vider la saisie (%s) supprime une recherche planifiée', (valeur) => {
  const recherche = creerRecherche();
  recherche.rechercher('/recherche');
  recherche.rechercher(valeur);
  jest.advanceTimersByTime(1000);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(recherche.getEtat()).toEqual({ statut: 'initial' });
});

test('annuler pendant une requête empêche sa publication et permet une nouvelle recherche', async () => {
  const attente = differee<Response>();
  fetchMock.mockReturnValueOnce(attente.promise);
  const recherche = creerRecherche();
  recherche.rechercher('/recherche');
  jest.advanceTimersByTime(300);
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  recherche.annuler();
  recherche.annuler();
  expect(signal.aborted).toBe(true);
  attente.resolve(reponse(['abandonné']));
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual({ statut: 'initial' });
  recherche.rechercher('/autre');
  jest.advanceTimersByTime(300);
  await terminerPromesses();
  expect(recherche.getEtat().statut).toBe('succes');
});

test('annuler supprime aussi la minuterie avant tout appel réseau', () => {
  const recherche = creerRecherche();
  recherche.rechercher('/recherche');
  recherche.annuler();
  jest.advanceTimersByTime(300);
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each(['reseau', 'http', 'json'])('une erreur actuelle (%s) termine le chargement', async (cas) => {
  if (cas === 'reseau') fetchMock.mockRejectedValueOnce(new Error('Hors ligne'));
  if (cas === 'http') fetchMock.mockResolvedValueOnce(reponse(null, false));
  if (cas === 'json') {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => { throw new Error('JSON invalide'); } });
  }
  const recherche = creerRecherche();
  recherche.rechercher('/recherche');
  jest.advanceTimersByTime(300);
  expect(recherche.getEtat().statut).toBe('chargement');
  await terminerPromesses();
  expect(recherche.getEtat()).toEqual({
    statut: 'erreur', url: '/recherche', message: 'La recherche a échoué. Veuillez réessayer.',
  });
});

test('deux instances ne s’annulent pas mutuellement', async () => {
  const premiere = creerRecherche();
  const seconde = creerRecherche();
  premiere.rechercher('/premiere');
  seconde.rechercher('/seconde');
  jest.advanceTimersByTime(300);
  premiere.annuler();
  expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
  await terminerPromesses();
  expect(seconde.getEtat().statut).toBe('succes');
});

test('le délai est configurable et les valeurs invalides sont refusées', () => {
  const recherche = creerRecherche(undefined, 500);
  recherche.rechercher('/recherche');
  jest.advanceTimersByTime(499);
  expect(fetchMock).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(() => creerRecherche(undefined, -1)).toThrow();
  expect(() => creerRecherche(undefined, NaN)).toThrow();
  expect(() => creerRecherche(undefined, Infinity)).toThrow();
});
