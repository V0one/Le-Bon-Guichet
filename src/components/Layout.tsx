import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from '@codegouvfr/react-dsfr/Header';
import Footer from '@codegouvfr/react-dsfr/Footer';
import SkipLinks from '@codegouvfr/react-dsfr/SkipLinks';
import Notice from '@codegouvfr/react-dsfr/Notice';
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';

const MARQUE = <>République<br />Française</>;

export function Layout() {
  const { pathname } = useLocation();
  const contenu = useRef<HTMLElement>(null);
  const premierAffichage = useRef(true);

  /* US D1 : après une navigation, le focus repart du contenu et non de la fin du document. */
  useEffect(() => {
    if (premierAffichage.current) { premierAffichage.current = false; return; }
    contenu.current?.focus();
  }, [pathname]);

  return <>
    <SkipLinks links={[
      { anchor: '#content', label: 'Contenu' },
      { anchor: '#fr-footer', label: 'Pied de page' },
    ]} />
    <Header
      id="fr-header"
      brandTop={MARQUE}
      homeLinkProps={{ to: '/', title: 'Accueil - Le Bon Guichet' }}
      serviceTitle="Le Bon Guichet"
      serviceTagline="Trouver la bonne administration et ses coordonnées"
    />
    <Notice
      severity="info"
      title="Projet pédagogique"
      description="Ce site est une démonstration réalisée à des fins d’apprentissage : il ne constitue pas un service officiel de l’administration française."
      isClosable={false}
    />
    <main id="content" ref={contenu} tabIndex={-1} className="fr-container fr-py-4w">
      <Outlet />
    </main>
    <Footer
      id="fr-footer"
      brandTop={MARQUE}
      homeLinkProps={{ to: '/', title: 'Accueil - Le Bon Guichet' }}
      accessibility="partially compliant"
      contentDescription="Le Bon Guichet est un projet pédagogique s’appuyant sur l’API Annuaire de l’administration et la Géoplateforme."
      bottomItems={[headerFooterDisplayItem]}
    />
  </>;
}
