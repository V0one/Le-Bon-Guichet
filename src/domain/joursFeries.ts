import donnees from '../data/jours-feries.json';

const calendriers: Record<string, { annees: number[]; dates: Record<string, string> }> = donnees.calendriers;

export function zoneCalendrier(codeInsee: string): string | null {
  if (/^(57|67|68)\d{3}$/.test(codeInsee)) return 'alsace-moselle';
  const territoires: Record<string, string> = {
    '971': 'guadeloupe', '972': 'martinique', '973': 'guyane', '974': 'la-reunion',
    '975': 'saint-pierre-et-miquelon', '976': 'mayotte', '977': 'saint-barthelemy',
    '978': 'saint-martin', '986': 'wallis-et-futuna', '987': 'polynesie-francaise', '988': 'nouvelle-caledonie',
  };
  if (/^\d{5}$/.test(codeInsee) && territoires[codeInsee.slice(0, 3)]) return territoires[codeInsee.slice(0, 3)];
  return /^(?:0[1-9]|[1-8]\d|9[0-5]|2[AB])\d{3}$/.test(codeInsee) ? 'metropole' : null;
}

// null = calendrier inconnu/périmé ; chaîne vide = aucun jour férié recensé.
export function jourFerie(dateLocale: string, zone: string | null): string | null {
  const calendrier = zone ? calendriers[zone] : undefined;
  if (!calendrier || !calendrier.annees.includes(Number(dateLocale.slice(0, 4)))) return null;
  return calendrier.dates[dateLocale] ?? '';
}
