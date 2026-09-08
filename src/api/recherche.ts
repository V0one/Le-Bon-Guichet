export type EtatRecherche =
  | { statut: 'initial' }
  | { statut: 'attente'; url: string }
  | { statut: 'chargement'; url: string }
  | { statut: 'succes'; url: string; donnees: unknown }
  | { statut: 'erreur'; url: string; message: string };

/** Logique sans React : une instance par recherche indépendante. */
export function creerRecherche(
  notifier: (etat: EtatRecherche) => void = () => {},
  delaiMs = 300
) {
  if (!Number.isFinite(delaiMs) || delaiMs < 0) {
    throw new Error('Le délai doit être un nombre positif ou nul.');
  }

  let etat: EtatRecherche = { statut: 'initial' };
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  let controleur: AbortController | undefined;
  let version = 0;

  function publier(prochainEtat: EtatRecherche) {
    etat = prochainEtat;
    notifier(etat);
  }

  function interrompre() {
    // Invalider aussi les réponses dont le transport ignore l'annulation.
    version += 1;
    clearTimeout(minuterie);
    minuterie = undefined;
    controleur?.abort();
    controleur = undefined;
  }

  function annuler() {
    interrompre();
    publier({ statut: 'initial' });
  }

  function rechercher(url: string | null) {
    // Annuler dès la nouvelle saisie, sans attendre la fin du debounce.
    interrompre();
    const cible = url?.trim();
    if (!cible) {
      publier({ statut: 'initial' });
      return;
    }

    const versionRequete = version;
    publier({ statut: 'attente', url: cible });

    minuterie = setTimeout(async () => {
      minuterie = undefined;
      const requete = new AbortController();
      controleur = requete;
      publier({ statut: 'chargement', url: cible });

      let prochainEtat: EtatRecherche;
      try {
        const reponse = await fetch(cible, { signal: requete.signal });
        if (!reponse.ok) {
          throw new Error('Échec de la requête HTTP.');
        }
        const donnees: unknown = await reponse.json();
        prochainEtat = { statut: 'succes', url: cible, donnees };
      } catch {
        prochainEtat = {
          statut: 'erreur',
          url: cible,
          message: 'La recherche a échoué. Veuillez réessayer.',
        };
      }

      // Vérifier après json() également : le décodage peut finir tardivement.
      if (versionRequete !== version || requete.signal.aborted) return;
      controleur = undefined;
      publier(prochainEtat);
    }, delaiMs);
  }

  return { rechercher, annuler, getEtat: () => etat };
}
