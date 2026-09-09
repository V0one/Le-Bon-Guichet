import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const dossier = new URL('../artifacts/navigateur/', import.meta.url);
await mkdir(dossier, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true });
const compteRendu = { date: new Date().toISOString(), navigateur: browser.version(), base, tests: [] };
let urlFicheTest;
async function verifier(nom, essai, viewport = { width: 1280, height: 900 }) {
  const contexte = await browser.newContext({ viewport });
  const page = await contexte.newPage();
  page.setDefaultTimeout(20000);
  const erreurs = [], consoleErreurs = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  page.on('console', message => { if (message.type() === 'error') consoleErreurs.push(message.text()); });
  try {
    const detail = await essai(page, contexte);
    assert.deepEqual(erreurs, [], 'Exception JavaScript');
    // Les erreurs réseau provoquées sont attendues, les avertissements React ne le sont pas.
    assert(!consoleErreurs.some(message => /In HTML|cannot contain|Each child|hydration/i.test(message)), consoleErreurs.join('\n'));
    await page.screenshot({ path: new URL(`${compteRendu.tests.length + 1}.png`, dossier).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    compteRendu.tests.push({ nom, succes: true, detail, consoleErreurs });
    console.log(`OK ${nom}`);
  } catch (erreur) {
    compteRendu.tests.push({ nom, succes: false, erreur: erreur.message, consoleErreurs });
    console.error(`ECHEC ${nom}: ${erreur.message}`);
  } finally { await contexte.close(); }
}
const resultat = page => page.getByRole('region', { name: 'Résultats de la recherche' });
const organismes = page => page.getByRole('heading', { name: /\d+ organismes? trouv/ });
async function choisirAmiens(page) {
  await page.getByRole('textbox').fill('Amiens');
  await page.getByRole('button', { name: 'Amiens', exact: true }).click();
  await organismes(page).waitFor();
}
async function rectangle(page, selecteur) {
  return page.locator(selecteur).evaluate(element => {
    const r = element.getBoundingClientRect();
    return { y: r.y + window.scrollY, hauteur: r.height };
  });
}

try {
  await verifier('API réelles, recherche, fiche, URL partagée, rechargement et retour', async (page, contexte) => {
    const erreursConsole = [];
    page.on('console', message => { if (message.type() === 'error') erreursConsole.push(message.text()); });
    await page.goto(base);
    assert.equal(await page.getByRole('status').innerText(), '');
    await choisirAmiens(page);
    const urlRecherche = page.url();
    assert.equal(new URL(urlRecherche).searchParams.get('codeInsee'), '80021');
    const liens = await resultat(page).locator('.fr-card a').allTextContents();
    const partage = await contexte.newPage();
    await partage.goto(urlRecherche);
    await organismes(partage).waitFor();
    assert.deepEqual(await resultat(partage).locator('.fr-card a').allTextContents(), liens);
    await partage.reload();
    await organismes(partage).waitFor();
    assert.equal(await partage.getByRole('textbox').inputValue(), 'Amiens');
    await partage.close();
    await resultat(page).locator('.fr-card a').first().click();
    await page.getByRole('heading', { name: 'Horaires et ouverture' }).waitFor();
    urlFicheTest = page.url();
    const titre = await page.title();
    const fiche = await contexte.newPage();
    await fiche.goto(page.url());
    await fiche.getByRole('heading', { name: 'Horaires et ouverture' }).waitFor();
    assert.equal(await fiche.title(), titre);
    assert(await fiche.locator('.fr-callout').filter({ has: fiche.getByRole('heading', { name: 'Accessibilité physique' }) }).count());
    await fiche.close();
    await page.goBack();
    await organismes(page).waitFor();
    assert.equal(page.url(), urlRecherche);
    await page.getByRole('combobox').selectOption('caf');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('select')?.value === 'mairie');
    assert.equal(await page.getByRole('combobox').inputValue(), 'mairie');
    assert.deepEqual(erreursConsole, []);
    return { urlRecherche, titre, resultats: liens.length, erreursConsole };
  });

  await verifier('État vide réel et 404', async page => {
    await page.goto(base);
    await page.getByRole('textbox').fill('zzzzzz');
    await page.getByRole('heading', { name: 'Aucun lieu trouvé' }).waitFor();
    await page.getByRole('button', { name: 'Effacer la recherche' }).click();
    assert.equal(await page.getByRole('textbox').inputValue(), '');
    await page.goto(`${base}/organismes/identifiant-inexistant-test`);
    await page.getByRole('heading', { name: 'Page introuvable' }).waitFor();
  });

  await verifier('Réseau coupé, message utilisateur et réessai', async (page, contexte) => {
    await page.goto(base);
    await contexte.setOffline(true);
    await page.getByRole('textbox').fill('Amiens');
    await page.getByRole('heading', { name: 'La recherche n’a pas abouti' }).waitFor();
    assert.equal(await page.getByRole('status').innerText(), '');
    assert(!/TypeError|HTTP \d|stack trace/.test(await page.locator('main').innerText()));
    await contexte.setOffline(false);
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await page.getByRole('button', { name: 'Amiens', exact: true }).waitFor();
  });

  for (const largeur of [1280, 390]) {
    await verifier(`3G lente, annonce et stabilité de mise en page (${largeur}px)`, async (page, contexte) => {
      await page.goto(base);
      const cdp = await contexte.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 2000, downloadThroughput: 500 * 1024 / 8,
        uploadThroughput: 500 * 1024 / 8, connectionType: 'cellular3g',
      });
      const avant = await rectangle(page, '#fr-footer');
      await page.getByRole('textbox').fill('Amiens');
      await page.getByRole('status').filter({ hasText: 'Recherche en cours' }).waitFor();
      assert.equal(await page.getByRole('status').getAttribute('aria-live'), 'polite');
      assert.equal(await page.getByRole('status').evaluate(e => !!e.closest('[aria-busy="true"]')), false);
      const pendant = await rectangle(page, '#fr-footer');
      await page.getByRole('button', { name: 'Amiens', exact: true }).waitFor();
      const apres = await rectangle(page, '#fr-footer');
      assert(Math.abs(avant.y - pendant.y) <= 1 && Math.abs(avant.y - apres.y) <= 1, JSON.stringify({ avant, pendant, apres }));
      await page.getByRole('button', { name: 'Amiens', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'Recherche en cours' }).waitFor();
      const pendantAnnuaire = await rectangle(page, '#fr-footer');
      await organismes(page).waitFor();
      const apresAnnuaire = await rectangle(page, '#fr-footer');
      assert(Math.abs(pendantAnnuaire.y - apresAnnuaire.y) <= 1, JSON.stringify({ pendantAnnuaire, apresAnnuaire }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      return { avant, pendant, apres, pendantAnnuaire, apresAnnuaire };
    }, { width: largeur, height: 900 });
  }

  await verifier('Dix frappes, requêtes annulées et réponse retardée', async page => {
    const appels = [], annules = [];
    page.on('request', r => { if (r.url().includes('/geocodage/')) appels.push(r.url()); });
    page.on('requestfailed', r => { if (r.url().includes('/geocodage/')) annules.push(r.failure()?.errorText); });
    await page.goto(base);
    await page.getByRole('textbox').pressSequentially('abcdefghij', { delay: 30 });
    await page.getByRole('heading', { name: /Aucun lieu trouvé|Sélectionnez un lieu/ }).waitFor();
    assert.equal(appels.length, 1);
    // Retarde une vraie réponse Géoplateforme pour provoquer une concurrence contrôlée.
    let signaler;
    const anciennePartie = new Promise(resolve => { signaler = resolve; });
    await page.route('**/geocodage/**', async route => {
      if (new URL(route.request().url()).searchParams.get('q') !== 'Paris') return route.continue();
      signaler();
      try {
        const reponse = await route.fetch();
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ response: reponse });
      } catch { /* La requête abandonnée peut déjà être détruite par Chrome. */ }
    });
    await page.getByRole('textbox').fill('Paris');
    await anciennePartie;
    await page.getByRole('textbox').fill('Amiens');
    await page.getByRole('button', { name: 'Amiens', exact: true }).waitFor();
    await page.waitForTimeout(1800); // Dépasser le retard injecté pour vérifier la non-régression.
    assert.equal(await page.getByRole('button', { name: 'Paris', exact: true }).count(), 0);
    assert(annules.some(erreur => /ABORTED/.test(erreur)), JSON.stringify(annules));
    return { frappes: 10, appelsApresFrappes: 1, annules };
  });

  await verifier('Clavier, focus visible et thème clair/sombre', async page => {
    await page.goto(base);
    const arrets = [];
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab');
      const arret = await page.evaluate(() => {
        const e = document.activeElement, r = e.getBoundingClientRect();
        // Les cartes DSFR dessinent leur focus sur le pseudo-élément couvrant la carte.
        const styles = [getComputedStyle(e), getComputedStyle(e, '::before'), getComputedStyle(e, '::after')];
        const cible = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, r.x + r.width / 2)), Math.max(0, Math.min(innerHeight - 1, r.y + r.height / 2)));
        return { balise: e.tagName, texte: e.textContent?.trim().slice(0, 80), id: e.id,
          visible: r.width > 0 && r.height > 0, focus: styles.some(css => css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0),
          masque: !cible || !(e === cible || e.contains(cible)) };
      });
      if (arret.balise === 'BODY') break;
      assert(arret.visible && arret.focus && !arret.masque, JSON.stringify(arret));
      arrets.push(arret);
      if (arret.balise === 'INPUT' && await page.getByRole('textbox').evaluate(e => e === document.activeElement)) {
        await page.keyboard.type('Amiens');
        await page.getByRole('button', { name: 'Amiens', exact: true }).waitFor();
      }
      if (arret.texte === 'Amiens' && arret.balise === 'BUTTON') {
        await page.keyboard.press('Enter');
        await organismes(page).waitFor();
        assert(await resultat(page).evaluate(e => e === document.activeElement));
      }
      if (arret.texte?.startsWith('Mairie') && arret.balise === 'A') {
        await page.keyboard.press('Enter');
        await page.getByRole('heading', { name: 'Horaires et ouverture' }).waitFor();
        assert(await page.locator('main').evaluate(e => e === document.activeElement));
      }
    }
    await page.getByRole('button', { name: 'Paramètres d\'affichage' }).click();
    await page.getByRole('radio', { name: /sombre/i }).focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.documentElement.dataset.frTheme === 'dark');
    assert.equal(await page.locator('html').getAttribute('data-fr-theme'), 'dark');
    await page.screenshot({ path: new URL('theme-sombre.png', dossier).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true, animations: 'disabled' });
    await page.getByRole('radio', { name: /clair/i }).focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.documentElement.dataset.frTheme === 'light');
    assert.equal(await page.locator('html').getAttribute('data-fr-theme'), 'light');
    await page.keyboard.press('Escape');
    return { arrets };
  });

  await verifier('Ouverture de la fiche réelle : ouvert, ouvre à, fermé et jour férié', async page => {
    assert(urlFicheTest, 'Le parcours nominal doit fournir une URL de fiche réelle');
    await page.clock.setFixedTime(new Date('2026-09-07T10:00:00Z'));
    await page.goto(urlFicheTest);
    await page.getByRole('status').filter({ hasText: 'Ouvert actuellement' }).waitFor();
    await page.clock.setFixedTime(new Date('2026-09-07T05:00:00Z'));
    await page.getByRole('status').filter({ hasText: 'ouvre aujourd’hui à' }).waitFor();
    await page.clock.setFixedTime(new Date('2026-09-06T10:00:00Z'));
    await page.getByRole('status').filter({ hasText: 'Fermé aujourd’hui' }).waitFor();
    await page.clock.setFixedTime(new Date('2026-07-14T10:00:00Z'));
    await page.getByRole('status').filter({ hasText: 'Ouverture à confirmer : 14 juillet' }).waitFor();
    return { fiche: urlFicheTest, horlogeSimulee: true, donnees: 'Annuaire réel' };
  });
} finally {
  await writeFile(new URL('rapport.json', dossier), JSON.stringify(compteRendu, null, 2) + '\n');
  await browser.close();
}
if (compteRendu.tests.some(test => !test.succes)) process.exitCode = 1;
