import { useEffect, useState } from 'react';
import Table from '@codegouvfr/react-dsfr/Table';
import { afficherHeure, calculerOuverture, JOURS, type Horaires } from '../domain/horaires';

export function HorairesOrganisme({ horaires }: { horaires: Horaires }) {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const actualiser = () => setMaintenant(new Date());
    const intervalle = window.setInterval(actualiser, 1000);
    window.addEventListener('focus', actualiser);
    return () => {
      window.clearInterval(intervalle);
      window.removeEventListener('focus', actualiser);
    };
  }, []);
  return <section aria-labelledby="horaires-titre">
    <h2 id="horaires-titre">Horaires et ouverture</h2>
    <p role="status">{calculerOuverture(horaires, maintenant)}</p>
    {horaires.qualite === 'absents' ? <p>Horaires non renseignés.</p> : <>
      <Table caption="Horaires habituels du guichet" headers={['Jour', 'Horaires']}
        data={JOURS.map((jour, index) => [jour, horaires.semaine[index].length
          ? horaires.semaine[index].map(p => `${afficherHeure(p.debut)} – ${afficherHeure(p.fin)}`).join(' / ')
          : 'Aucune plage renseignée'])} />
      <p>Heures locales du guichet, hors jours fériés et fermetures exceptionnelles.</p>
    </>}
    {horaires.notes.map(note => <p key={note}>{note}</p>)}
  </section>;
}
