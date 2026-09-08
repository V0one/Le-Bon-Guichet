import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { axe } from 'vitest-axe';
import * as matchersAxe from 'vitest-axe/matchers';
import { expect, vi, type Mock } from 'vitest';
import App from '../App';

expect.extend(matchersAxe);

/* Le contraste ne se vérifie pas sous jsdom : aucune couleur n'y est calculée. */
const REGLES = { rules: { 'color-contrast': { enabled: false } } };

function reponse(donnees: unknown): Response {
  return { ok: true, json: async () => donnees } as Response;
}
const lieu = { features: [{ properties: { id: '80021', label: 'Amiens', citycode: '80021', city: 'Amiens' } }] };
const organisme = { id: 'mairie-amiens', nom: 'Mairie - Amiens', pivot: JSON.stringify([{ type_service_local: 'mairie' }]), adresse: null };
const annuaire = { total_count: 1, results: [organisme] };

function afficher(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
}
async function avancer(ms = 300) { await act(async () => { vi.advanceTimersByTime(ms); }); }
function saisir(valeur: string) {
  fireEvent.change(screen.getByLabelText(/Localisation/), { target: { value: valeur } });
}
/** axe s'appuie sur de vraies temporisations : les horloges simulées le bloqueraient. */
async function verifier(element: Element) {
  vi.useRealTimers();
  expect(await axe(element, REGLES)).toHaveNoViolations();
}

const regionResultats = () => screen.getByRole('region', { name: 'Résultats de la recherche' });

const fetchInitial = globalThis.fetch;
let fetchMock: Mock;
beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn().mockImplementation((url: string) =>
    Promise.resolve(reponse(url.includes('geocodage') ? lieu : annuaire)));
  globalThis.fetch = fetchMock;
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); globalThis.fetch = fetchInitial; });

test('D1 : l’accueil ne présente aucune violation détectée par axe', async () => {
  const { container } = afficher();
  await verifier(container);
}, 30000);

test('D1 : la liste des résultats ne présente aucune violation détectée par axe', async () => {
  const { container } = afficher();
  saisir('Amiens'); await avancer();
  fireEvent.click(screen.getByRole('button', { name: 'Amiens' })); await avancer();
  expect(screen.getByRole('heading', { name: /organisme trouvé/ })).toBeInTheDocument();
  await verifier(container);
}, 30000);

test('D1 : la fiche d’un organisme ne présente aucune violation détectée par axe', async () => {
  const { container } = afficher('/organismes/mairie-amiens');
  await avancer();
  expect(screen.getByRole('heading', { level: 1, name: 'Mairie - Amiens' })).toBeInTheDocument();
  await verifier(container);
}, 30000);

test('D1 : la tabulation seule atteint les sauts puis le formulaire, sans piège', () => {
  afficher();
  saisir('Am');
  const arrets: Element[] = [];
  for (let rang = 0; rang < 8; rang += 1) {
    userEvent.tab();
    arrets.push(document.activeElement!);
  }
  expect(arrets[0]).toBe(screen.getByRole('link', { name: 'Contenu' }));
  expect(arrets[1]).toBe(screen.getByRole('link', { name: 'Pied de page' }));

  const formulaire = [
    screen.getByLabelText(/Type d’organisme/),
    screen.getByLabelText(/Localisation/),
    screen.getByRole('button', { name: 'Rechercher' }),
  ].map(commande => arrets.indexOf(commande));
  expect(formulaire[0]).toBeGreaterThan(1);
  expect(formulaire[1]).toBe(formulaire[0] + 1);
  expect(formulaire[2]).toBe(formulaire[1] + 1);

  /* Un arrêt visité deux fois signalerait un piège au clavier. */
  expect(new Set(arrets).size).toBe(arrets.length);
});

test('D1 : aucun élément interactif n’est retiré de l’ordre de tabulation', () => {
  const { container } = afficher();
  const selecteur = 'a[href], button:not([disabled]), select, input';
  const interactifs = [...container.querySelectorAll(selecteur)]
    .filter(element => !element.closest('[aria-hidden="true"], .fr-hidden'));
  expect(interactifs.length).toBeGreaterThan(0);
  for (const element of interactifs) {
    expect(element).not.toHaveAttribute('tabindex', '-1');
  }
});

test('D1 : sélectionner un lieu au clavier ne fait pas perdre le focus', async () => {
  afficher();
  saisir('Amiens'); await avancer();
  const proposition = screen.getByRole('button', { name: 'Amiens' });
  proposition.focus();
  fireEvent.click(proposition); await avancer();
  expect(document.activeElement).toBe(regionResultats());
});

test('D1 : effacer la recherche rend le focus au champ Localisation', async () => {
  fetchMock.mockImplementation(() => Promise.resolve(reponse({ features: [] })));
  afficher();
  saisir('zzzzzz'); await avancer();
  const effacer = screen.getByRole('button', { name: 'Effacer la recherche' });
  effacer.focus();
  await act(async () => { fireEvent.click(effacer); });
  expect(document.activeElement).toBe(screen.getByLabelText(/Localisation/));
});

test('D1 : réessayer après une erreur rend le focus à la région de résultats', async () => {
  fetchMock.mockRejectedValueOnce(new Error('réseau'));
  afficher();
  saisir('Amiens'); await avancer();
  const reessayer = screen.getByRole('button', { name: /Réessayer/ });
  reessayer.focus();
  fireEvent.click(reessayer); await avancer();
  expect(document.activeElement).toBe(regionResultats());
});

test('D1 : ouvrir une fiche replace le focus au début du contenu', async () => {
  afficher();
  saisir('Amiens'); await avancer();
  fireEvent.click(screen.getByRole('button', { name: 'Amiens' })); await avancer();
  const fiche = screen.getByRole('link', { name: /Mairie - Amiens/ });
  await act(async () => { fireEvent.click(fiche); });
  await avancer();
  expect(document.activeElement).toBe(document.getElementById('content'));
});

test('D1 : toute commande est un élément natif, donc actionnable au clavier', () => {
  const { container } = afficher();
  saisir('Am');
  for (const bouton of screen.getAllByRole('button')) {
    expect(bouton.tagName).toBe('BUTTON');
  }
  for (const lien of screen.getAllByRole('link')) {
    expect(lien.tagName).toBe('A');
    expect(lien).toHaveAttribute('href');
  }
  /* Un rôle interactif porté par une balise inerte exigerait la souris. */
  expect(container.querySelectorAll(
    'div[role=button], span[role=button], div[role=link], span[role=link], [onclick]',
  )).toHaveLength(0);
});

test('D1 : chaque saut de focus vise une cible existante et focalisable', () => {
  afficher();
  const sauts = screen.getAllByRole('link', { name: /Contenu|Pied de page/ });
  expect(sauts).toHaveLength(2);
  for (const saut of sauts) {
    const ancre = saut.getAttribute('href') ?? '';
    expect(ancre.startsWith('#')).toBe(true);
    expect(document.querySelector(ancre)).not.toBeNull();
  }
  expect(document.getElementById('content')).toHaveAttribute('tabindex', '-1');
});
