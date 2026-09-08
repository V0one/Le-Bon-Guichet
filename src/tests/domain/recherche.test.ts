import { normaliserLieux } from '../../domain/lieux';
import { filtrerOrganismesParType, lirePageAnnuaire, normaliserFiche } from '../../domain/recherche';

test('les lieux partiels ou nuls ne font pas planter la normalisation', () => {
  expect(normaliserLieux(null)).toEqual([]);
  expect(normaliserLieux({ features: [null, {}, { properties: null }] })).toEqual([]);
});
test('normalise un lieu utilisable, sans inventer de coordonnées', () => {
  const feature = { properties: { label: 'Amiens', citycode: '80021' }, geometry: { coordinates: ['', null] } };
  const lieux = normaliserLieux({ features: [feature, feature] });
  expect(lieux).toHaveLength(1);
  expect(lieux[0].codeInsee).toBe('80021');
  expect(lieux[0].coordonnees).toBeNull();
});
test('filtre le pivot exact, ignore les données incomplètes et déduplique', () => {
  const mairie = { id: '1', nom: 'Mairie', pivot: '[{"type_service_local":"mairie"}]' };
  const resultats = filtrerOrganismesParType([null, {}, mairie, mairie,
    { id: '2', pivot: 'invalide' }, { id: '3', pivot: '[null]' },
    { id: '4', pivot: [{ type_service_local: 'caf' }] }], 'mairie');
  expect(resultats).toHaveLength(1);
  expect(resultats[0].adresse).toBe('Adresse non renseignée');
});
test('la fiche conserve les valeurs de remplacement C2', () => {
  const fiche = normaliserFiche({ id: '1', adresse: null, telephone: '[null,{}]', adresse_courriel: null });
  expect(fiche.adresse).toBe('Adresse non renseignée');
  expect(fiche.telephones).toEqual([]);
  expect(fiche.courriel).toBe('');
});
test('une enveloppe invalide ne devient pas un succès vide', () => {
  expect(() => lirePageAnnuaire(null)).toThrow();
  expect(() => lirePageAnnuaire({ results: [], total_count: -1 })).toThrow();
  expect(lirePageAnnuaire({ results: [], total_count: 0 }).results).toEqual([]);
});
