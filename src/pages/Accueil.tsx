import { useMemo, useState } from 'react';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Chargement } from '../components/Chargement';
import { EtatErreur } from '../components/EtatErreur';
import { EtatVide } from '../components/EtatVide';
import { Introduction, LONGUEUR_MINIMALE } from '../components/Introduction';
import { useRecherche } from '../hooks/useRecherche';

/** Jeu de données « Annuaire de l'administration » publié sur data.gouv.fr. */
const URL_ANNUAIRE =
  'https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records';

/**
 * Renvoie null tant que la saisie ne permet pas de chercher : aucune requête
 * ne part alors, et aucun indicateur de chargement n'est affiché.
 */
function construireUrl(saisie: string): string | null {
  const lieu = saisie.trim();
  if (lieu.length < LONGUEUR_MINIMALE) return null;

  const echappe = lieu.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const parametres = new URLSearchParams({
    where: `search(adresse, "${echappe}")`,
    limit: '20',
  });
  return `${URL_ANNUAIRE}?${parametres}`;
}

function nombreDeResultats(donnees: unknown): number {
  const resultats = (donnees as { results?: unknown } | null)?.results;
  return Array.isArray(resultats) ? resultats.length : 0;
}

export default function Accueil() {
  const [localisation, setLocalisation] = useState('');
  const url = useMemo(() => construireUrl(localisation), [localisation]);
  const { etat, relancer } = useRecherche(url);

  function afficherEtat() {
    switch (etat.statut) {
      case 'chargement':
        return <Chargement />;
      case 'erreur':
        return <EtatErreur message={etat.message} onReessayer={relancer} />;
      case 'succes': {
        const total = nombreDeResultats(etat.donnees);
        return total === 0 ? (
          <EtatVide localisation={localisation.trim()} onReinitialiser={() => setLocalisation('')} />
        ) : (
          <>
            <h2 className="fr-h4">
              {total} guichet{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            </h2>
            <p>L’affichage des fiches fait l’objet des prochaines évolutions.</p>
          </>
        );
      }
      // « initial » et « attente » : explications, et aucun indicateur de
      // chargement tant que la requête n'est pas partie.
      default:
        return <Introduction />;
    }
  }

  return (
    <>
      <h1 className="fr-mt-4w">Le Bon Guichet</h1>
      <p className="fr-text--lead">
        Trouvez l’administration compétente près de chez vous, ses coordonnées,
        ses horaires et son accessibilité.
      </p>

      <form
        onSubmit={(evenement) => {
          evenement.preventDefault();
          relancer();
        }}
      >
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-12 fr-col-md-8">
            <Input
              label="Localisation"
              hintText={`Commune ou code postal, ${LONGUEUR_MINIMALE} caractères minimum. Exemple : Amiens ou 80000.`}
              nativeInputProps={{
                value: localisation,
                onChange: (evenement) => setLocalisation(evenement.target.value),
                autoComplete: 'address-level2',
                name: 'localisation',
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-mb-2w">
            <Button type="submit" disabled={url === null}>
              Rechercher
            </Button>
          </div>
        </div>
      </form>

      <section className="fr-mt-4w" aria-live="polite" aria-busy={etat.statut === 'chargement'}>
        {afficherEtat()}
      </section>
    </>
  );
}
