import { normaliserOrganisme } from './organisme';

describe('US C2 : normalisation des données manquantes', () => {
  test.each([
    undefined,
    null,
    {},
    { nom: null, adresse: null },
    { nom: undefined, adresse: undefined },
    { nom: '', adresse: [] },
    { nom: '   ', adresse: {} },
  ])('ne lève pas d’exception pour des champs nuls ou absents : %p', (entree) => {
    expect(() => normaliserOrganisme(entree)).not.toThrow();
    expect(normaliserOrganisme(entree)).toEqual({
      nom: 'Nom non renseigné',
      adresse: 'Adresse non renseignée',
    });
  });

  test('une fiche sans adresse conserve son nom et fournit une mention explicite', () => {
    const fiche = normaliserOrganisme({ nom: 'Mairie - Amiens' });
    expect(fiche.nom).toBe('Mairie - Amiens');
    expect(fiche.adresse).toBe('Adresse non renseignée');
    expect(fiche.adresse).not.toContain('undefined');
    expect(fiche.adresse).not.toContain('null');
  });

  test.each([
    { numero_voie: 'Place de la Mairie', code_postal: null },
    [{ numero_voie: 'Place de la Mairie', nom_commune: undefined }],
    JSON.stringify([{ numero_voie: 'Place de la Mairie' }]),
  ])('conserve les informations présentes dans une adresse partielle : %p', (adresse) => {
    expect(normaliserOrganisme({ adresse }).adresse).toBe('Place de la Mairie');
  });

  test('formate une adresse complète issue du JSON de l’API', () => {
    const adresse = JSON.stringify([{
      complement1: ' Hôtel de ville ',
      complement2: 'Accueil',
      numero_voie: '1 rue de la Mairie',
      service_distribution: 'BP 12',
      code_postal: '01230',
      nom_commune: 'Village',
    }]);
    expect(normaliserOrganisme({ nom: ' Mairie ', adresse })).toEqual({
      nom: 'Mairie',
      adresse: 'Hôtel de ville, Accueil, 1 rue de la Mairie, BP 12, 01230 Village',
    });
  });

  test.each(['', 'JSON invalide', 'null', '[]', '[null, {}]', 42, [null, {}]])(
    'une adresse inexploitable donne la mention de remplacement : %p',
    (adresse) => {
      expect(normaliserOrganisme({ adresse }).adresse).toBe('Adresse non renseignée');
    }
  );

  test('ignore une entrée vide avant une adresse renseignée', () => {
    expect(normaliserOrganisme({
      adresse: [null, {}, { nom_commune: 'Amiens' }],
    }).adresse).toBe('Amiens');
  });
});
