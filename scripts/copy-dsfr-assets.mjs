/**
 * Complète `copy-dsfr-to-public`, qui n'installe aucun asset sur Windows :
 * il compare des chemins POSIX issus des `url(...)` du CSS à des chemins
 * système en `\`, si bien qu'aucune police ni icône n'est copiée.
 *
 * On relit ici les feuilles DSFR déjà copiées dans `public/dsfr` et on copie
 * chaque asset qu'elles référencent, résolu relativement à la feuille.
 *
 * On y ajoute `early-color-scheme.js`, chargé par `index.html` avant le rendu
 * pour appliquer le thème sans flash.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const SOURCE = 'node_modules/@codegouvfr/react-dsfr/dsfr';
const CIBLE = 'public/dsfr';
const FEUILLES = ['dsfr.min.css', join('utility', 'icons', 'icons.min.css')];
const URL_CSS = /url\((?:"([^"]+)"|'([^']+)'|([^)"']+))\)/g;

let copies = 0;
let manquants = 0;

for (const feuille of FEUILLES) {
  const chemin = join(CIBLE, feuille);
  if (!existsSync(chemin)) throw new Error(`Feuille DSFR absente : ${chemin}`);

  for (const [, guillemets, apostrophes, nu] of readFileSync(chemin, 'utf8').matchAll(URL_CSS)) {
    const reference = (guillemets ?? apostrophes ?? nu).trim();
    if (reference.startsWith('data:') || /^[a-z]+:/i.test(reference)) continue;

    const asset = relative(resolve(CIBLE), resolve(dirname(chemin), reference.split('?')[0]));
    const source = join(SOURCE, asset);
    if (!existsSync(source)) { manquants += 1; continue; }

    const destination = join(CIBLE, asset);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    copies += 1;
  }
}

copyFileSync(
  'node_modules/@codegouvfr/react-dsfr/early-color-scheme.js',
  join(CIBLE, 'early-color-scheme.js')
);

console.log(`DSFR : ${copies} assets copiés dans ${CIBLE}${manquants ? ` (${manquants} introuvables)` : ''}`);
