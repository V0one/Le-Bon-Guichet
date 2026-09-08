import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Recherche } from "./pages/Recherche";
import { FicheOrganisme } from "./pages/FicheOrganisme";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La route parente applique le Layout (Header, Footer, Bandeau) à toutes les pages */}
        <Route element={<Layout />}>
          {/* L'écran d'accueil avec le champ de recherche[cite: 1] */}
          <Route path="/" element={<Recherche />} />

          {/* La route pour afficher une fiche spécifique avec son ID[cite: 1] */}
          <Route path="/organismes/:id" element={<FicheOrganisme />} />

          {/* Route catch-all pour gérer la page 404 obligatoire[cite: 2] */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
