// Régressions testées dans un vrai navigateur (Playwright + Chromium).
// Lancer : node --test
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');

const CLE = 'courses-livraison-v2';
const pageHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
const serveur = http.createServer((_, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(pageHtml); });
let navigateur;
let url;

before(async () => {
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${serveur.address().port}/`;
  navigateur = await chromium.launch();
});
after(async () => {
  await navigateur.close();
  serveur.close();
});

const pad = (n) => String(n).padStart(2, '0');
const aujourdhui = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// Ouvre l'appli dans un contexte neuf ; `donnees` (optionnel) est écrit dans le stockage avant le chargement.
async function ouvrir(donnees) {
  const ctx = await navigateur.newContext();
  if (donnees) await ctx.addInitScript(([cle, v]) => localStorage.setItem(cle, v), [CLE, JSON.stringify(donnees)]);
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(url);
  return { ctx, page, erreurs };
}

test('« Tout effacer » remet la liste des plateformes par défaut', async () => {
  const { ctx, page } = await ouvrir();
  await page.click('#onglets button[data-vue=reglages]');
  await page.fill('input[placeholder="Nouvelle plateforme"]', 'Stuart');
  await page.click('.ajout button');
  assert.ok((await page.locator('.tag').allTextContents()).some((t) => t.includes('Stuart')), 'Stuart doit être ajoutée');

  await page.click('button.danger');
  const tags = (await page.locator('.tag').allTextContents()).map((t) => t.replace('×', '').trim());
  assert.deepEqual(tags, ['Uber Eats', 'Deliveroo', 'Just Eat']);
  await ctx.close();
});

test('la barre d’objectif hebdomadaire ignore le filtre de plateforme', async () => {
  const jour = aujourdhui();
  const { ctx, page } = await ouvrir({
    courses: [
      { id: 'a', date: jour, km: 10, euros: 20, plateforme: 'Uber Eats', minutes: 0, note: '' },
      { id: 'b', date: jour, km: 5, euros: 10, plateforme: 'Deliveroo', minutes: 0, note: '' },
    ],
    reglages: { objectifSemaine: 100 },
  });
  const objectif = page.locator('.etiquette', { hasText: 'Objectif de la semaine' });
  assert.match(await objectif.textContent(), /: 30\D+sur 100/);

  await page.click('.puce:has-text("Uber Eats")');
  assert.match(await objectif.textContent(), /: 30\D+sur 100/, 'le filtre ne doit pas changer la progression vers l’objectif');
  await ctx.close();
});

test('réimporter un fichier sans identifiants n’ajoute pas de doublons', async () => {
  const { ctx, page } = await ouvrir();
  await page.click('#onglets button[data-vue=reglages]');
  const fichier = {
    name: 'courses.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      courses: [
        { date: '2026-10-30', km: 4, euros: 6 },
        { date: '2026-10-30', km: 4, euros: 6 }, // deux courses réellement identiques : les deux sont conservées
        { date: '2026-10-31', km: 2, euros: 3 },
      ],
    })),
  };
  const nombre = () => page.evaluate((c) => JSON.parse(localStorage.getItem(c)).courses.length, CLE);

  await page.setInputFiles('#fichier', fichier);
  await page.waitForFunction((c) => JSON.parse(localStorage.getItem(c) || '{"courses":[]}').courses.length > 0, CLE);
  assert.equal(await nombre(), 3);

  await page.setInputFiles('#fichier', fichier);
  await page.waitForTimeout(300);
  assert.equal(await nombre(), 3, 'le second import ne doit rien ajouter');
  await ctx.close();
});
