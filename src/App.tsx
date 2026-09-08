import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import Accueil from './pages/Accueil';
import { FicheOrganisme } from './pages/FicheOrganisme';
import { NotFound } from './pages/NotFound';

export default function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Accueil />} />
      <Route path="/organismes/:id" element={<FicheOrganisme />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>;
}
