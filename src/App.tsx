import { Link, Route, Routes } from 'react-router';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Accueil from './pages/Accueil';

function App() {
  return (
    <main className="fr-container fr-py-4w">
      <Alert
        severity="info"
        small
        description="Projet pédagogique, ne constitue pas un service officiel"
      />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="*" element={
          <>
            <h1 className="fr-mt-4w">Page introuvable</h1>
            <Link to="/">Retour à l’accueil</Link>
          </>
        } />
      </Routes>
    </main>
  );
}

export default App;
