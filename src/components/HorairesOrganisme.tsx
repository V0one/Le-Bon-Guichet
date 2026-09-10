import { useEffect, useState } from 'react';
import Table from '@codegouvfr/react-dsfr/Table';
import { afficherHeure, calculerOuverture, JOURS, type Horaires } from '../domain/horaires';

export function HorairesOrganisme({ horaires }: { horaires: Horaires }) {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const actualiser = () => setMaintenant(new Date());
    const intervalle = window.setInterval(actualiser, 1000);
    window.addEventListener('focus', actualiser);
    document.addEventListener('visibilitychange', actualiser);
    return () => {
      window.clearInterval(intervalle);
      window.removeEventListener('focus', actualiser);
      document.removeEventListener('visibilitychange', actualiser);
    };
  }, []);
  return <section aria-labelledby="horaires-titre">
    <h2 id="horaires-titre">Horaires et ouverture</h2>
    <p role="status">
      {calculerOuverture(horaires, maintenant)}
      {horaires.notes.length > 0 && ' Selon les horaires habituels ; vérifiez les notes ci-dessous.'}
    </p>
    {horaires.notes.length > 0 && <div className="fr-callout">
      <h3 className="fr-callout__title">Notes à vérifier</h3>
      <ul>{horaires.notes.map(note => <li key={note}>{note}</li>)}</ul>
    </div>}
    {horaires.qualite === 'absents' ? <p>Horaires non renseignés.</p> : <>
      <Table caption="Horaires habituels du guichet" headers={['Jour', 'Horaires']}
        data={JOURS.map((jour, index) => [jour, horaires.semaine[index].length
          ? horaires.semaine[index].map(p => `${afficherHeure(p.debut)} – ${afficherHeure(p.fin)}`).join(' / ')
          : 'Aucune plage renseignée'])} />
      <p>Heures locales du guichet. Les notes peuvent préciser des conditions ou exceptions aux horaires affichés.
        Une fermeture exceptionnelle non publiée peut modifier ces horaires habituels.</p>
    </>}
  </section>;
}
