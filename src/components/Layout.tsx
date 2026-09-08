import { Outlet } from "react-router-dom";
// Remplace ces imports par les vrais composants DSFR si tu les as déjà configurés
import Header from "@codegouvfr/react-dsfr/Header";
import Footer from "@codegouvfr/react-dsfr/Footer";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";

export function Layout() {
  return (
    <>
      <SkipLinks links={[{ anchor: "#content", label: "Contenu" }]} />

      {/* BANDEAU OBLIGATOIRE POUR ÉVITER LE MALUS DE -5 PTS*/}
      <div className="fr-notice fr-notice--info">
        <div className="fr-container">
          <div className="fr-notice__body">
            <p className="fr-notice__title">
              Projet pédagogique, ne constitue pas un service officiel
            </p>
          </div>
        </div>
      </div>

      <Header
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        homeLinkProps={{ href: "/", title: "Accueil - Le Bon Guichet" }}
        serviceTitle="Le Bon Guichet"
      />

      <main id="content" role="main">
        {/* L'Outlet de React Router va injecter le composant de la page active ici */}
        <Outlet />
      </main>

      <Footer accessibility="non compliant" />
    </>
  );
}
