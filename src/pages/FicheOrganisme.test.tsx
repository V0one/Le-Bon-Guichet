import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { FicheOrganisme } from './FicheOrganisme';

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
