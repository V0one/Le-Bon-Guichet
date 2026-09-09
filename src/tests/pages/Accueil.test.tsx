import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { vi, type Mock } from 'vitest';
import Accueil from '../../pages/Accueil';

function reponse(donnees: unknown): Response {
  return { ok: true, json: async () => donnees } as Response;
}
const lieu = { features: [{ properties: { id: '80021', label: 'Amiens', citycode: '80021', city: 'Amiens' } }] };
const organisme = { id: 'mairie-amiens', nom: 'Mairie - Amiens', pivot: JSON.stringify([{ type_service_local: 'mairie' }]), adresse: null };
const annuaire = { total_count: 1, results: [organisme] };
function differee<T>() {
  let resolve!: (valeur: T) => void;
  const promise = new Promise<T>(succes => { resolve = succes; });
  return { promise, resolve };
}
async function avancer(ms = 300) { await act(async () => { vi.advanceTimersByTime(ms); }); }
function saisir(valeur: string) { fireEvent.change(screen.getByLabelText(/Localisation/), { target: { value: valeur } }); }
function afficher() { render(<MemoryRouter><Accueil /></MemoryRouter>); }

function NavigationTest() {
  const location = useLocation();
  const naviguer = useNavigate();
  return <>
    <output aria-label="URL de recherche">{location.search}</output>
    <button onClick={() => naviguer(-1)}>Retour navigateur</button>
  </>;
}

test('A3 : une URL partagée restaure la commune et charge directement ses organismes', async () => {
  render(<MemoryRouter initialEntries={['/?type=mairie&lieu=80000&codeInsee=80021&commune=Amiens']}>
    <Accueil /><NavigationTest />
  </MemoryRouter>);
  await avancer();
  expect(screen.getByLabelText(/Localisation/)).toHaveValue('80000');
  expect(screen.getByText('Commune sélectionnée : Amiens')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mairie - Amiens' })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toContain('api-lannuaire');
  fireEvent.change(screen.getByLabelText('Type d’organisme'), { target: { value: 'caf' } });
  expect(screen.getByLabelText('URL de recherche')).toHaveTextContent('type=caf');
  fireEvent.click(screen.getByRole('button', { name: 'Retour navigateur' }));
  expect(screen.getByRole('link', { name: 'Mairie - Amiens' })).toBeInTheDocument();
});

test('A3 : une sélection ajoute la commune à l’URL et une réinitialisation l’efface', async () => {
  render(<MemoryRouter><Accueil /><NavigationTest /></MemoryRouter>);
  await choisirLieu();
  expect(screen.getByLabelText('URL de recherche')).toHaveTextContent('codeInsee=80021&commune=Amiens');
  fireEvent.change(screen.getByLabelText('Type d’organisme'), { target: { value: 'caf' } });
  fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
  expect(screen.getByLabelText('URL de recherche')).toBeEmptyDOMElement();
  expect(screen.queryByText(/Commune sélectionnée/)).not.toBeInTheDocument();
});

test('A3 : un code INSEE invalide dans l’URL ne déclenche pas de requête Annuaire', async () => {
  render(<MemoryRouter initialEntries={['/?lieu=Amiens&codeInsee=invalide']}><Accueil /></MemoryRouter>);
  await avancer();
  expect(fetchMock.mock.calls[0][0]).toContain('geocodage');
});

test('la fusion conserve les critères de l’URL et leur restauration au retour navigateur', async () => {
  render(<MemoryRouter initialEntries={['/?type=caf&lieu=Paris']}>
    <Accueil /><NavigationTest />
  </MemoryRouter>);
  expect(screen.getByLabelText(/Localisation/)).toHaveValue('Paris');
  expect(screen.getByLabelText('Type d’organisme')).toHaveValue('caf');
  saisir('Amiens');
  fireEvent.change(screen.getByLabelText('Type d’organisme'), { target: { value: 'mairie' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }));
  expect(screen.getByLabelText('URL de recherche')).toHaveTextContent('type=mairie&lieu=Amiens');
  fireEvent.click(screen.getByRole('button', { name: 'Retour navigateur' }));
  expect(screen.getByLabelText(/Localisation/)).toHaveValue('Paris');
  expect(screen.getByLabelText('Type d’organisme')).toHaveValue('caf');
});

test('la réinitialisation efface les paramètres tout en rendant le focus à la saisie', async () => {
  fetchMock.mockResolvedValueOnce(reponse({ features: [] }));
  render(<MemoryRouter initialEntries={['/?type=mairie&lieu=zzzzzz']}>
    <Accueil /><NavigationTest />
  </MemoryRouter>);
  await avancer();
  fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
  expect(screen.getByLabelText('URL de recherche')).toBeEmptyDOMElement();
  expect(screen.getByLabelText(/Localisation/)).toHaveValue('');
  expect(screen.getByLabelText(/Localisation/)).toHaveFocus();
});
async function choisirLieu() {
  saisir('Amiens'); await avancer();
  fireEvent.click(screen.getByRole('button', { name: 'Amiens' })); await avancer();
}
const introduction = () => screen.queryByRole('heading', { name: /Que fait Le Bon Guichet/ });
const fetchInitial = globalThis.fetch;
let fetchMock: Mock;
beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(reponse(url.includes('geocodage') ? lieu : annuaire)));
  globalThis.fetch = fetchMock;
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); globalThis.fetch = fetchInitial; });

test('B1 : explique la recherche sans requête ni chargement initial', () => {
  afficher();
  expect(introduction()).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ce que vous devez saisir' })).toBeInTheDocument();
  expect(screen.queryByText(/Recherche en cours/)).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('une saisie trop courte ne lance pas de recherche', async () => {
  afficher(); saisir('A'); await avancer(1000);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Rechercher' })).toBeDisabled();
});
test('aucun chargement avant le départ de la requête', async () => {
  const attente = differee<Response>(); fetchMock.mockReturnValueOnce(attente.promise);
  afficher(); saisir('Amiens'); await avancer(299);
  expect(screen.queryByText(/Recherche en cours/)).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
  await avancer(1);
  expect(screen.getByText(/Recherche en cours/)).toBeInTheDocument();
  await act(async () => attente.resolve(reponse(lieu)));
});
test('B4 : zzzzzz affiche un résultat vide explicite, distinct de l’état initial et de l’erreur', async () => {
  fetchMock.mockResolvedValueOnce(reponse({ features: [] }));
  afficher(); saisir('zzzzzz'); await avancer();
  expect(screen.getByRole('heading', { name: 'Aucun lieu trouvé' })).toBeInTheDocument();
  expect(screen.getByText('Aucun lieu ne correspond à « zzzzzz ».')).toBeInTheDocument();
  expect(screen.getByText(/vérifier l’orthographe/)).toBeInTheDocument();
  expect(screen.getByText(/élargir la recherche/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'La recherche n’a pas abouti' })).not.toBeInTheDocument();
  expect(screen.queryByText(/Recherche en cours/)).not.toBeInTheDocument();
  expect(introduction()).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
  expect(introduction()).toBeInTheDocument();
  expect(screen.getByLabelText(/Localisation/)).toHaveValue('');
  expect(screen.queryByRole('heading', { name: 'Aucun lieu trouvé' })).not.toBeInTheDocument();
});
test('une erreur est distincte et peut être relancée', async () => {
  fetchMock.mockRejectedValueOnce(new Error('Hors ligne'));
  afficher(); saisir('Amiens'); await avancer();
  expect(screen.getByRole('heading', { name: 'La recherche n’a pas abouti' })).toBeInTheDocument();
  expect(introduction()).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' })); await avancer();
  expect(screen.getByRole('button', { name: 'Amiens' })).toBeInTheDocument();
});
test('A1 et C2 : sélectionne un lieu, interroge la commune et affiche une carte DSFR sans adresse', async () => {
  afficher(); await choisirLieu();
  expect(fetchMock.mock.calls[1][0]).toContain('api-lannuaire.service-public.gouv.fr');
  expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('where')).toBe('code_insee_commune="80021"');
  expect(screen.getByRole('heading', { name: '1 organisme trouvé' })).toBeInTheDocument();
  expect(screen.getByText('Adresse non renseignée')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mairie - Amiens' })).toHaveAttribute('href', '/organismes/mairie-amiens');
  expect(screen.getByRole('link', { name: 'Mairie - Amiens' }).closest('.fr-card')).not.toBeNull();
});
test('changer le type filtre les résultats déjà chargés sans garder ceux de l’ancien type', async () => {
  afficher(); await choisirLieu();
  fireEvent.change(screen.getByLabelText('Type d’organisme'), { target: { value: 'caf' } });
  expect(screen.getByRole('heading', { name: 'Aucun organisme trouvé' })).toBeInTheDocument();
  expect(screen.queryByText('Mairie - Amiens')).not.toBeInTheDocument();
  expect(screen.getByText(/Aucun organisme du type sélectionné/)).toBeInTheDocument();
  expect(screen.getByText(/choisir un autre type d’organisme/)).toBeInTheDocument();
  expect(introduction()).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'La recherche n’a pas abouti' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Type d’organisme'), { target: { value: 'mairie' } });
  expect(screen.getByRole('heading', { name: '1 organisme trouvé' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Aucun organisme trouvé' })).not.toBeInTheDocument();
});

test('B2 : la région d’annonce existe avant la requête et annonce le chargement hors de la zone occupée', async () => {
  const attente = differee<Response>();
  fetchMock.mockReturnValueOnce(attente.promise);
  afficher();
  const annonce = screen.getByRole('status');
  expect(annonce).toBeEmptyDOMElement();
  expect(annonce).toHaveAttribute('aria-live', 'polite');
  expect(annonce).toHaveAttribute('aria-atomic', 'true');
  saisir('Amiens'); await avancer();
  expect(screen.getByRole('status')).toBe(annonce);
  expect(annonce).toHaveTextContent('Recherche en cours');
  expect(annonce.closest('[aria-busy="true"]')).toBeNull();
  await act(async () => attente.resolve(reponse(lieu)));
  expect(screen.getByRole('status')).toBe(annonce);
  expect(annonce).toBeEmptyDOMElement();
});

test('B2 : la recherche Annuaire annonce aussi son chargement dès son départ', async () => {
  const attente = differee<Response>();
  fetchMock.mockResolvedValueOnce(reponse(lieu)).mockReturnValueOnce(attente.promise);
  afficher(); await choisirLieu();
  expect(screen.getByRole('status')).toHaveTextContent('Recherche en cours');
  await act(async () => attente.resolve(reponse(annuaire)));
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  expect(screen.getByRole('heading', { name: '1 organisme trouvé' })).toBeInTheDocument();
});

test('B4 : corriger la saisie après un résultat vide permet de poursuivre la recherche', async () => {
  fetchMock.mockResolvedValueOnce(reponse({ features: [] }));
  afficher(); saisir('zzzzzz'); await avancer();
  saisir('Amiens'); await avancer();
  expect(screen.getByRole('button', { name: 'Amiens' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Aucun lieu trouvé' })).not.toBeInTheDocument();
});

test('B4 : une commune sans organisme affiche les conseils et permet de réinitialiser', async () => {
  fetchMock.mockResolvedValueOnce(reponse(lieu)).mockResolvedValueOnce(reponse({ total_count: 0, results: [] }));
  afficher(); await choisirLieu();
  expect(screen.getByRole('heading', { name: 'Aucun organisme trouvé' })).toBeInTheDocument();
  expect(screen.getByText(/Aucun organisme du type sélectionné n’a été trouvé à « Amiens »/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
  expect(introduction()).toBeInTheDocument();
  expect(screen.queryByText(/Commune sélectionnée/)).not.toBeInTheDocument();
});
test('C1 : dix frappes rapides ne déclenchent qu’un appel', async () => {
  afficher();
  for (let i = 1; i <= 10; i++) { saisir('abcdefghij'.slice(0, i)); await avancer(20); }
  expect(fetchMock).not.toHaveBeenCalled(); await avancer();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('C1 : une réponse de lieux obsolète ne remplace pas les propositions récentes', async () => {
  const ancienne = differee<Response>(); fetchMock.mockReturnValueOnce(ancienne.promise);
  afficher(); saisir('Paris'); await avancer();
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  saisir('Amiens'); expect(signal.aborted).toBe(true); await avancer();
  await act(async () => ancienne.resolve(reponse({ features: [{ properties: { id: '75056', citycode: '75056', label: 'Paris' } }] })));
  expect(screen.getByRole('button', { name: 'Amiens' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Paris' })).not.toBeInTheDocument();
});
test('C1 : modifier le lieu annule aussi l’Annuaire et ignore son résultat tardif', async () => {
  const ancienne = differee<Response>();
  fetchMock.mockResolvedValueOnce(reponse(lieu)).mockReturnValueOnce(ancienne.promise);
  afficher(); await choisirLieu();
  const signal = fetchMock.mock.calls[1][1].signal as AbortSignal;
  saisir('Lille'); expect(signal.aborted).toBe(true);
  await act(async () => ancienne.resolve(reponse(annuaire)));
  expect(screen.queryByText('Mairie - Amiens')).not.toBeInTheDocument();
});
test('une réponse invalide est une erreur, pas un résultat vide', async () => {
  fetchMock.mockResolvedValueOnce(reponse({ inattendu: true }));
  afficher(); saisir('Amiens'); await avancer();
  expect(screen.getByRole('heading', { name: 'La recherche n’a pas abouti' })).toBeInTheDocument();
});
