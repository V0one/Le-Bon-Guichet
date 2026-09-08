import { Outlet } from 'react-router';
import Header from '@codegouvfr/react-dsfr/Header';
import Footer from '@codegouvfr/react-dsfr/Footer';
import SkipLinks from '@codegouvfr/react-dsfr/SkipLinks';
import Alert from '@codegouvfr/react-dsfr/Alert';
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';

export function Layout() {
  return <>
    <SkipLinks links={[{ anchor: '#content', label: 'Contenu' }]} />
    <Alert severity="info" small description="Projet pédagogique, ne constitue pas un service officiel" />
    <Header brandTop={<>République<br />Française</>} homeLinkProps={{ to: '/', title: 'Accueil - Le Bon Guichet' }} serviceTitle="Le Bon Guichet" />
    <main id="content" tabIndex={-1} className="fr-container fr-py-4w"><Outlet /></main>
    <Footer accessibility="non compliant" bottomItems={[headerFooterDisplayItem]} />
  </>;
}
