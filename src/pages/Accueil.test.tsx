import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import Accueil from './Accueil';

function reponse(resultats: unknown[]): Response {
  return {
    ok: true,
    json: async () => ({ total_count: resultats.length, results: resultats }),
  } as Response;
}

function differee<T>() {
  let resolve!: (valeur: T) => void;
  const promise = new Promise<T>((succes) => {
    resolve = succes;
  });
  return { promise, resolve };
}

async function avancer(ms = 300) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function saisir(valeur: string) {
  fireEvent.change(screen.getByLabelText(/Localisation/), { target: { value: valeur } });
}

const introduction = () => screen.queryByRole('heading', { name: /Que fait Le Bon Guichet/ });
const chargement = () => screen.queryByText(/Recherche en cours/);

const fetchInitial = globalThis.fetch;
let fetchMock: Mock;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn().mockResolvedValue(reponse([]));
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  globalThis.fetch = fetchInitial;
});

describe('US C3 : page d’accueil avant, pendant et après la recherche', () => {
  test('avant toute recherche, l’écran explique le service et la saisie attendue', () => {
    render(<Accueil />);
    expect(introduction()).toBeInTheDocument();
    expect(screen.getByText(/trouver la bonne administration/)).toBeInTheDocument();
    expect(screen.getByText(/savoir si le guichet est ouvert maintenant/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ce que vous devez saisir' })).toBeInTheDocument();
    expect(screen.getByText(/la commune ou le code postal/)).toBeInTheDocument();
    expect(chargement()).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('une localisation trop courte ne déclenche aucune requête ni aucun chargement', async () => {
    render(<Accueil />);
    saisir('A');
    await avancer(1000);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(chargement()).not.toBeInTheDocument();
    expect(introduction()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechercher' })).toBeDisabled();
  });

  test('aucun indicateur de chargement pendant l’attente qui précède la requête', async () => {
    render(<Accueil />);
    saisir('Amiens');
    await avancer(299);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(chargement()).not.toBeInTheDocument();
    expect(introduction()).toBeInTheDocument();
    await avancer(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('l’indicateur de chargement n’apparaît qu’une fois la requête lancée', async () => {
    const attente = differee<Response>();
    fetchMock.mockReturnValueOnce(attente.promise);
    render(<Accueil />);
    saisir('Amiens');
    await avancer(300);
    expect(chargement()).toBeInTheDocument();
    expect(introduction()).not.toBeInTheDocument();
    await act(async () => attente.resolve(reponse([])));
  });

  test('une recherche sans résultat affiche un écran vide distinct', async () => {
    render(<Accueil />);
    saisir('Zzzz');
    await avancer(300);
    expect(screen.getByRole('heading', { name: 'Aucun organisme trouvé' })).toBeInTheDocument();
    expect(screen.getByText(/« Zzzz » n’a renvoyé aucun guichet/)).toBeInTheDocument();
    expect(screen.getByText(/essayer le code postal/)).toBeInTheDocument();
    expect(introduction()).not.toBeInTheDocument();
    expect(chargement()).not.toBeInTheDocument();
  });

  test('effacer la recherche depuis l’écran vide ramène aux explications', async () => {
    render(<Accueil />);
    saisir('Zzzz');
    await avancer(300);
    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(introduction()).toBeInTheDocument();
    expect(screen.getByLabelText(/Localisation/)).toHaveValue('');
  });

  test('une requête en échec affiche un écran d’erreur distinct', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Hors ligne'));
    render(<Accueil />);
    saisir('Amiens');
    await avancer(300);
    expect(screen.getByRole('heading', { name: 'La recherche n’a pas abouti' })).toBeInTheDocument();
    expect(screen.getByText(/La recherche a échoué/)).toBeInTheDocument();
    expect(introduction()).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Aucun organisme trouvé' })).not.toBeInTheDocument();
  });

  test('le bouton Réessayer relance la même recherche, sans chargement immédiat', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Hors ligne'));
    render(<Accueil />);
    saisir('Amiens');
    await avancer(300);
    fetchMock.mockResolvedValueOnce(reponse([{ nom: 'Mairie - Amiens' }]));
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(chargement()).not.toBeInTheDocument();
    await avancer(300);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(fetchMock.mock.calls[0][0]);
    expect(screen.getByRole('heading', { name: '1 guichet trouvé' })).toBeInTheDocument();
  });
});
