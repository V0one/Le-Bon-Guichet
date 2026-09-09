import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { FicheOrganisme } from '../../pages/FicheOrganisme';

const original = globalThis.fetch;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); globalThis.fetch = original; });
function afficher() {
  render(<MemoryRouter initialEntries={['/organismes/123']}><Routes>
    <Route path="/organismes/:id" element={<FicheOrganisme />} />
  </Routes></MemoryRouter>);
}
test('C2 : la fiche affiche la mention explicite pour une adresse absente', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ total_count: 1, results: [{ id: '123', nom: 'Mairie', adresse: null }] }) });
  afficher(); await act(async () => { vi.advanceTimersByTime(300); });
  expect(screen.getByRole('heading', { name: 'Mairie' })).toBeInTheDocument();
  expect(screen.getByText('Adresse non renseignée')).toBeInTheDocument();
  expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
});
test('un identifiant inexistant affiche la page introuvable', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ total_count: 0, results: [] }) });
  afficher(); await act(async () => { vi.advanceTimersByTime(300); });
  expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
});

test('la fiche affiche les horaires et l’accessibilité, puis actualise l’ouverture sans recharger', async () => {
  vi.setSystemTime(new Date('2026-09-07T09:59:59Z'));
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ total_count: 1, results: [{
    id: '123', nom: 'Mairie', code_insee_commune: '80021',
    plage_ouverture: JSON.stringify([{ nom_jour_debut: 'Lundi', nom_jour_fin: 'Vendredi',
      valeur_heure_debut_1: '09:00:00', valeur_heure_fin_1: '12:00:00' }]),
    adresse: JSON.stringify([{ accessibilite: 'Accessible', note_accessibilite: 'Rampe à l’entrée.' }]),
  }] }) });
  afficher(); await act(async () => { vi.advanceTimersByTime(300); });
  expect(screen.getByRole('table', { name: 'Horaires habituels du guichet' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Ouvert actuellement');
  expect(screen.getByText('Rampe à l’entrée.')).toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(1000); });
  expect(screen.getByRole('status')).toHaveTextContent('Fermé actuellement');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
});
