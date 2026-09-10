import { calculerOuverture, normaliserHoraires } from '../../domain/horaires';
import { normaliserFiche } from '../../domain/recherche';

const plage = { nom_jour_debut: 'Lundi', nom_jour_fin: 'Vendredi',
  valeur_heure_debut_1: '09:00:00', valeur_heure_fin_1: '12:00:00',
  valeur_heure_debut_2: '14:00:00', valeur_heure_fin_2: '17:00:00' };
const horaires = normaliserHoraires(JSON.stringify([plage]), '', '80021');

test.each([
  ['2026-09-07T06:59:59Z', 'ouvre aujourd’hui à 09:00'],
  ['2026-09-07T07:00:00Z', 'Ouvert actuellement'],
  ['2026-09-07T10:00:00Z', 'ouvre aujourd’hui à 14:00'],
  ['2026-09-07T12:00:00Z', 'ferme à 17:00'],
  ['2026-09-07T15:00:00Z', 'Fermé actuellement'],
  ['2026-09-06T10:00:00Z', 'Fermé aujourd’hui'],
  ['2026-01-05T08:00:00Z', 'Ouvert actuellement'],
])('calcule les limites, la pause et l’heure locale : %s', (date, attendu) => {
  expect(calculerOuverture(horaires, new Date(date))).toContain(attendu);
});

test.each([null, undefined, {}, 'invalide', [null], [{ ...plage, valeur_heure_fin_1: null }]].map(valeur => ({ valeur })))(
  'les horaires absents ou malformés ne produisent pas une ouverture certaine : $valeur', ({ valeur }) => {
    const resultat = normaliserHoraires(valeur, '', '80021');
    expect(calculerOuverture(resultat, new Date('2026-09-07T08:00:00Z'))).not.toMatch(/^(Ouvert|Fermé) actuellement/);
  });

test.each([
  ['2026-09-07T08:00:00Z', 'Ouvert actuellement'],
  ['2026-09-07T10:00:00Z', 'ouvre aujourd’hui à 14:00'],
  ['2026-09-06T10:00:00Z', 'Fermé aujourd’hui'],
])('une note conserve le calcul des horaires habituels : %s', (date, attendu) => {
  const resultat = normaliserHoraires([plage], 'Accueil sur rendez-vous.', '80021');
  expect(resultat.notes).toContain('Accueil sur rendez-vous.');
  expect(calculerOuverture(resultat, new Date(date))).toContain(attendu);
});

test.each([null, [{ ...plage, valeur_heure_fin_1: null }]].map(valeur => ({ valeur })))(
  'des notes ne rendent pas exploitables des horaires absents ou incomplets : $valeur', ({ valeur }) => {
    const resultat = normaliserHoraires(valeur, 'Accueil sur rendez-vous.', '80021');
    expect(resultat.qualite).not.toBe('exploitables');
    expect(calculerOuverture(resultat, new Date('2026-09-07T08:00:00Z'))).not.toContain('Ouvert actuellement');
  });

test('utilise le fuseau ultramarin et ne devine pas celui des territoires à plusieurs fuseaux', () => {
  expect(calculerOuverture(normaliserHoraires([plage], '', '97411'), new Date('2026-09-07T05:00:00Z'))).toContain('Ouvert');
  expect(calculerOuverture(normaliserHoraires([plage], '', '98735'), new Date())).toContain('indéterminée');
});

test('une plage traversant minuit se poursuit le lendemain, y compris le lundi', () => {
  const nuit = normaliserHoraires([{ nom_jour_debut: 'Dimanche', nom_jour_fin: 'Dimanche',
    valeur_heure_debut_1: '22:00', valeur_heure_fin_1: '02:00' }], '', '80021');
  expect(calculerOuverture(nuit, new Date('2026-09-06T23:00:00Z'))).toContain('ferme à 02:00');
  expect(calculerOuverture(nuit, new Date('2026-09-07T00:00:00Z'))).toContain('Fermé');
});

test('fusionne les plages qui se chevauchent sans annoncer une fermeture prématurée', () => {
  const continu = normaliserHoraires([{ ...plage, valeur_heure_debut_2: '11:00' }], '', '80021');
  expect(calculerOuverture(continu, new Date('2026-09-07T08:00:00Z'))).toContain('ferme à 17:00');
});

test('normalise les informations d’accessibilité et les notes générales de l’API', () => {
  const fiche = normaliserFiche({ code_insee_commune: '80021', plage_ouverture: [plage],
    information_complementaire: 'Sur rendez-vous.', adresse: JSON.stringify([null, {
      type_adresse: 'Adresse', accessibilite: 'Accessible', note_accessibilite: 'Entrée latérale.',
    }]) });
  expect(fiche.accessibilite[0].note).toBe('Entrée latérale.');
  expect(fiche.horaires.qualite).toBe('exploitables');
  expect(fiche.horaires.notes).toContain('Sur rendez-vous.');
  expect(normaliserFiche(null).accessibilite).toEqual([]);
});

test.each([
  ['80021', '2026-07-14T08:00:00Z', '14 juillet'],
  ['67482', '2026-04-03T08:00:00Z', 'Vendredi saint'],
  ['97105', '2026-05-27T14:00:00Z', 'Abolition'],
  ['97411', '2026-12-19T22:00:00Z', 'Abolition'],
])('ne prétend pas être ouvert un jour férié local : %s %s', (code, date, nom) => {
  const resultat = calculerOuverture(normaliserHoraires([plage], '', code), new Date(date));
  expect(resultat).toContain('à confirmer');
  expect(resultat.toLowerCase()).toContain(nom.toLowerCase());
});

test('un calendrier périmé ne permet pas d’affirmer une ouverture', () => {
  expect(calculerOuverture(horaires, new Date('2100-09-06T08:00:00Z'))).toContain('calendrier des jours fériés indisponible');
});

test('le vendredi saint alsacien ne bloque pas un guichet en dehors de cette zone', () => {
  expect(calculerOuverture(horaires, new Date('2026-04-03T08:00:00Z'))).toContain('Ouvert actuellement');
});
