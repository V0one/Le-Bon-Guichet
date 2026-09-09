import { mkdir, writeFile } from 'node:fs/promises';

// Données Etalab, Licence Ouverte 2.0. Aucun appel à cette API dans le navigateur.
const source = 'https://calendrier.api.gouv.fr/jours-feries/';
const zones = ['metropole', 'alsace-moselle', 'guadeloupe', 'guyane', 'la-reunion',
  'martinique', 'mayotte', 'nouvelle-caledonie', 'polynesie-francaise',
  'saint-barthelemy', 'saint-martin', 'saint-pierre-et-miquelon', 'wallis-et-futuna'];
const calendriers = Object.fromEntries(await Promise.all(zones.map(async zone => {
  const reponse = await fetch(`${source}${zone}.json`);
  if (!reponse.ok) throw new Error(`Calendrier indisponible : ${zone}`);
  const dates = await reponse.json();
  if (!dates || Array.isArray(dates) || typeof dates !== 'object'
    || !Object.entries(dates).every(([date, nom]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof nom === 'string')) {
    throw new Error(`Calendrier invalide : ${zone}`);
  }
  const anneeCourante = new Date().getUTCFullYear();
  const triees = Object.fromEntries(Object.entries(dates)
    .filter(([date]) => Number(date.slice(0, 4)) >= anneeCourante - 1)
    .sort(([a], [b]) => a.localeCompare(b)));
  const annees = [...new Set(Object.keys(triees).map(date => Number(date.slice(0, 4))))];
  if (!annees.includes(new Date().getUTCFullYear())) throw new Error(`Calendrier périmé : ${zone}`);
  return [zone, { annees, dates: triees }];
})));
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/jours-feries.json', import.meta.url),
  JSON.stringify({ source, licence: 'Licence Ouverte 2.0', actualiseLe: new Date().toISOString().slice(0, 10), calendriers }, null, 2) + '\n');
