import { useEffect } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';

export function NotFound() {
  useEffect(() => { document.title = 'Page introuvable - Le Bon Guichet'; }, []);
  return <>
    <h1>Page introuvable</h1>
    <p>La page que vous cherchez n’existe pas ou a été déplacée.</p>
    <Button linkProps={{ to: '/' }}>Retour à l’accueil</Button>
  </>;
}
