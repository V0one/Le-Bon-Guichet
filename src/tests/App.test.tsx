import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../App';

test('affiche l’accueil et la mention pédagogique', () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Le Bon Guichet' })).toBeInTheDocument();
  expect(screen.getByText(/ne constitue pas un service officiel/)).toBeInTheDocument();
});

test('une route inconnue propose un retour à l’accueil', () => {
  render(<MemoryRouter initialEntries={['/inconnue']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
});
