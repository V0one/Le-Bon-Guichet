export interface OrganismeNormalise {
  nom: string;
  adresse: string;
}

function objet(valeur: unknown): Record<string, unknown> {
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    return {};
  }
  return valeur as Record<string, unknown>;
}

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur.trim() : '';
}

function normaliserAdresse(valeur: unknown): string {
  // L'Annuaire peut renvoyer le tableau d'adresses encodé en JSON.
  if (typeof valeur === 'string') {
    try {
      valeur = JSON.parse(valeur);
    } catch {
      return 'Adresse non renseignée';
    }
  }

  const adresses = Array.isArray(valeur) ? valeur : [valeur];
  for (const entree of adresses) {
    const adresse = objet(entree);
    const lignes = [
      texte(adresse.complement1),
      texte(adresse.complement2),
      texte(adresse.numero_voie),
      texte(adresse.service_distribution),
      [texte(adresse.code_postal), texte(adresse.nom_commune)]
        .filter(Boolean).join(' '),
    ].filter(Boolean);

    if (lignes.length > 0) return lignes.join(', ');
  }
  return 'Adresse non renseignée';
}

/** US C2 : valeurs affichables pour le nom et l'adresse, même si les champs manquent. */
export function normaliserOrganisme(valeur: unknown): OrganismeNormalise {
  const organisme = objet(valeur);
  return {
    nom: texte(organisme.nom) || 'Nom non renseigné',
    adresse: normaliserAdresse(organisme.adresse),
  };
}
