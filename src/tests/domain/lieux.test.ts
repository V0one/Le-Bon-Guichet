import { normaliserLieux } from '../../domain/lieux';

test('un tableau vide en entrée donne un tableau vide en sortie', () => {
  const resultat = normaliserLieux({ features: [] });
  expect(resultat).toEqual([]);
});

test('un tableau avec des éléments en entrée donne un tableau normalisé en sortie', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '80021', label: 'Amiens', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([
    {
      id: '80021-Amiens',
      libelle: 'Amiens',
      codeInsee: '80021',
      codePostal: '80000',
      commune: 'Amiens',
      coordonnees: { longitude: 2.29, latitude: 49.89 }
    }
  ]);
});

test('une feature avec un citycode invalide est ignorée', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '800', label: 'Amiens', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([]);
});

test('sans geometry → coordonnees null, lieu conservé', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '80021', label: 'Amiens', postcode: '80000', city: 'Amiens' },
      }
    ]
  });
  expect(resultat).toEqual([
    {
      id: '80021-Amiens',
      libelle: 'Amiens',
      codeInsee: '80021',
      codePostal: '80000',
      commune: 'Amiens',
      coordonnees: null
    }
  ]);
});

test('longitude hors bornes → coordonnees null, lieu conservé', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '80021', label: 'Amiens', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [200, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([
    {
      id: '80021-Amiens',
      libelle: 'Amiens',
      codeInsee: '80021',
      codePostal: '80000',
      commune: 'Amiens',
      coordonnees: null
    }
  ]);
});

test('une feature invalide n\'empêche pas les suivantes d\'être traitées', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '800', label: 'Ignorée', postcode: '80000', city: 'Ignorée' },
        geometry: { coordinates: [2.29, 49.89] }
      },
      {
        properties: { citycode: '80021', label: 'Amiens', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([
    {
      id: '80021-Amiens',
      libelle: 'Amiens',
      codeInsee: '80021',
      codePostal: '80000',
      commune: 'Amiens',
      coordonnees: { longitude: 2.29, latitude: 49.89 }
    }
  ]);
});

test('une feature avec un label vide est ignorée', () => {
    const resultat = normaliserLieux({
    features: [
      {
        properties: { citycode: '80021', label: '     ', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([
  ]);
});

test('deux features avec le même id ne donnent qu\'un seul lieu', () => {
  const resultat = normaliserLieux({
    features: [
      {
        properties: { id : 'abc', citycode: '80021', label: 'Amiens', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      },
      {
        properties: { id : 'abc', citycode: '80021', label: 'Amiens Sud', postcode: '80000', city: 'Amiens' },
        geometry: { coordinates: [2.29, 49.89] }
      }
    ]
  });
  expect(resultat).toEqual([
    {
      id: 'abc',
      libelle: 'Amiens',
      codeInsee: '80021',
      codePostal: '80000',
      commune: 'Amiens',
      coordonnees: { longitude: 2.29, latitude: 49.89 }
    }
  ]);
});