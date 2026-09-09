import { objet, texte } from './organisme';
import { jourFerie, zoneCalendrier } from './joursFeries';

export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
interface Creneau { debut: number; fin: number }
export interface Horaires {
  semaine: Creneau[][];
  notes: string[];
  qualite: 'absents' | 'exploitables' | 'a-confirmer';
  fuseau: string | null;
  zoneCalendrier: string | null;
}

function fuseauCommune(code: unknown): string | null {
  const insee = texte(code);
  if (!/^(?:\d{2}|2[AB])\d{3}$/.test(insee)) return null;
  const outremer: Record<string, string> = {
    '971': 'America/Guadeloupe', '972': 'America/Martinique', '973': 'America/Cayenne',
    '974': 'Indian/Reunion', '975': 'America/Miquelon', '976': 'Indian/Mayotte',
    '977': 'America/St_Barthelemy', '978': 'America/Marigot',
    '986': 'Pacific/Wallis', '988': 'Pacific/Noumea',
  };
  if (outremer[insee.slice(0, 3)]) return outremer[insee.slice(0, 3)];
  return /^(?:0[1-9]|[1-8]\d|9[0-5]|2[AB])\d{3}$/.test(insee) ? 'Europe/Paris' : null;
}

function secondes(valeur: unknown, fin = false): number | null {
  const heure = texte(valeur);
  if (fin && /^24:00(?::00)?$/.test(heure)) return 86400;
  const parties = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(heure);
  if (!parties) return null;
  const h = Number(parties[1]), m = Number(parties[2]), s = Number(parties[3] ?? 0);
  return h < 24 && m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}

export function normaliserHoraires(valeur: unknown, commentaire: unknown, codeInsee: unknown): Horaires {
  const semaine: Creneau[][] = JOURS.map(() => []);
  const notes = texte(commentaire) ? [texte(commentaire)] : [];
  let invalide = false;
  if (typeof valeur === 'string' && valeur.trim()) {
    try { valeur = JSON.parse(valeur); } catch { invalide = true; valeur = []; }
  }
  if (valeur == null || valeur === '') valeur = [];
  if (!Array.isArray(valeur)) { invalide = true; valeur = []; }
  for (const brut of valeur as unknown[]) {
    const plage = objet(brut);
    if (texte(plage.commentaire)) notes.push(texte(plage.commentaire));
    const debutJour = JOURS.findIndex(j => j.toLowerCase() === texte(plage.nom_jour_debut).toLowerCase());
    const finJour = JOURS.findIndex(j => j.toLowerCase() === texte(plage.nom_jour_fin).toLowerCase());
    if (debutJour < 0 || finJour < 0) { invalide = true; continue; }
    let trouve = false;
    for (const numero of [1, 2]) {
      const debutBrut = plage[`valeur_heure_debut_${numero}`];
      const finBrut = plage[`valeur_heure_fin_${numero}`];
      if ((debutBrut == null || debutBrut === '') && (finBrut == null || finBrut === '')) continue;
      const debut = secondes(debutBrut), fin = secondes(finBrut, true);
      if (debut === null || fin === null || debut === fin) { invalide = true; continue; }
      trouve = true;
      for (let i = 0; i <= (finJour - debutJour + 7) % 7; i++) {
        const jour = (debutJour + i) % 7;
        semaine[jour].push({ debut, fin: fin < debut ? 86400 : fin });
        if (fin < debut && fin > 0) semaine[(jour + 1) % 7].push({ debut: 0, fin });
      }
    }
    if (!trouve) invalide = true;
  }
  for (const creneaux of semaine) {
    creneaux.sort((a, b) => a.debut - b.debut);
    for (let i = 1; i < creneaux.length;) {
      if (creneaux[i].debut <= creneaux[i - 1].fin) {
        creneaux[i - 1].fin = Math.max(creneaux[i - 1].fin, creneaux[i].fin);
        creneaux.splice(i, 1);
      } else i++;
    }
  }
  if (invalide) notes.push('Certaines plages horaires sont incomplètes ou illisibles.');
  return { semaine, notes: [...new Set(notes)], fuseau: fuseauCommune(codeInsee), zoneCalendrier: zoneCalendrier(texte(codeInsee)),
    qualite: invalide || notes.length ? 'a-confirmer' : semaine.some(j => j.length) ? 'exploitables' : 'absents' };
}

export function afficherHeure(secondes: number): string {
  const h = Math.floor(secondes / 3600), m = Math.floor(secondes % 3600 / 60), s = secondes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s ? `:${String(s).padStart(2, '0')}` : ''}`;
}

export function calculerOuverture(horaires: Horaires, maintenant: Date): string {
  if (horaires.qualite === 'absents') return 'Ouverture indéterminée : horaires non renseignés.';
  if (horaires.qualite !== 'exploitables') return 'Ouverture à confirmer auprès du guichet.';
  if (!horaires.fuseau || !Number.isFinite(maintenant.getTime())) return 'Ouverture indéterminée : heure locale non disponible.';
  const parties = new Intl.DateTimeFormat('fr-FR', { timeZone: horaires.fuseau,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(maintenant);
  const lire = (type: string) => parties.find(p => p.type === type)?.value ?? '';
  const ferie = jourFerie(`${lire('year')}-${lire('month')}-${lire('day')}`, horaires.zoneCalendrier);
  if (ferie === null) return 'Ouverture à confirmer : calendrier des jours fériés indisponible pour cette date ou ce territoire.';
  if (ferie) return `Ouverture à confirmer : ${ferie}, jour férié ou particularité locale à vérifier auprès du guichet.`;
  const jour = JOURS.findIndex(j => j.toLowerCase() === lire('weekday'));
  const heure = Number(lire('hour')) * 3600 + Number(lire('minute')) * 60 + Number(lire('second'));
  if (horaires.semaine[jour]?.length === 0) return 'Fermé aujourd’hui selon les horaires habituels.';
  for (const plage of horaires.semaine[jour] ?? []) {
    if (heure >= plage.debut && heure < plage.fin) return `Ouvert actuellement — ferme à ${afficherHeure(plage.fin)}.`;
    if (heure < plage.debut) return `Fermé actuellement — ouvre aujourd’hui à ${afficherHeure(plage.debut)}.`;
  }
  return 'Fermé actuellement — les horaires d’accueil sont terminés pour aujourd’hui.';
}
