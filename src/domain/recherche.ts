import { normaliserHoraires } from './horaires';
import { normaliserOrganisme, objet, texte } from './organisme';

export function tableauJson(valeur: unknown): unknown[] {
  if (typeof valeur === 'string') {
    try { valeur = JSON.parse(valeur); } catch { return []; }
  }
  return Array.isArray(valeur) ? valeur : [];
}

export function filtrerOrganismesParType(resultats: unknown[], type: string) {
  const ids = new Set<string>();
  return resultats.filter(entree => {
    const organisme = objet(entree);
    const id = texte(organisme.id);
    const correspond = tableauJson(organisme.pivot).some(pivot => objet(pivot).type_service_local === type);
    if (!id || ids.has(id) || !correspond) return false;
    ids.add(id);
    return true;
  }).map(normaliserFiche);
}

export function normaliserFiche(brut: unknown) {
  const organisme = objet(brut);
  return {
    ...normaliserOrganisme(brut),
    id: texte(organisme.id),
    horaires: normaliserHoraires(organisme.plage_ouverture,
      [texte(organisme.commentaire_plage_ouverture), texte(organisme.information_complementaire)].filter(Boolean).join(' '),
      organisme.code_insee_commune),
    accessibilite: tableauJson(organisme.adresse).map(entree => {
      const adresse = objet(entree);
      return {
        type: texte(adresse.type_adresse),
        libelle: [texte(adresse.numero_voie), texte(adresse.nom_commune)].filter(Boolean).join(', '),
        description: texte(adresse.accessibilite),
        note: texte(adresse.note_accessibilite),
      };
    }).filter(adresse => adresse.description || adresse.note),
    telephones: tableauJson(organisme.telephone).map(tel => texte(objet(tel).valeur)).filter(Boolean),
    courriel: texte(organisme.adresse_courriel),
    source: /^https?:\/\//.test(texte(organisme.url_service_public)) ? texte(organisme.url_service_public) : '',
  };
}

export function lirePageAnnuaire(brut: unknown) {
  const page = objet(brut);
  if (!Array.isArray(page.results) || typeof page.total_count !== 'number'
    || !Number.isInteger(page.total_count) || page.total_count < 0) {
    throw new Error('Réponse Annuaire invalide.');
  }
  return { results: page.results as unknown[], total_count: page.total_count };
}
