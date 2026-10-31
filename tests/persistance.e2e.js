// Vérifie la persistance dans un vrai navigateur (Playwright + Chromium).
// Lancer : node tests/persistance.e2e.js
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const CLE = 'courses-livraison-v2';
const page_html = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
const serveur = http.createServer((_, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(page_html); });

async function ajouter(p, km, eur) {
  await p.click('#btn-ajout');
  await p.fill('#f-km', km);
  await p.fill('#f-eur', eur);
  await p.click('#f button[type=submit]');
}
const lire = (p) => p.evaluate((c) => JSON.parse(localStorage.getItem(c)), CLE);
let ok = 0;
const etape = (nom) => { ok++; console.log(`  ok   ${nom}`); };

(async () => {
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${serveur.address().port}/`;
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'courses-profil-'));
  const erreurs = [];
  const ouvrir = async () => {
    const ctx = await chromium.launchPersistentContext(profil, { viewport: { width: 1024, height: 768 } });
    const p = ctx.pages()[0] || await ctx.newPage();
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.goto(url);
    return { ctx, p };
  };

  // 1. Persistance après fermeture complète du navigateur
  let { ctx, p } = await ouvrir();
  await ajouter(p, '4,2', '6,50');
  await ajouter(p, '10', '12');
  assert.equal((await lire(p)).courses.length, 2);
  await ctx.close();
  ({ ctx, p } = await ouvrir());
  assert.equal((await lire(p)).courses.length, 2);
  assert.match(await p.textContent('.gros'), /18,50/);
  etape('2 courses et total 18,50 € conservés après fermeture complète du navigateur');

  // 2. Deux onglets : la modification de l'un apparaît dans l'autre
  const p2 = await ctx.newPage();
  await p2.goto(url);
  await ajouter(p2, '5', '5');
  await p.waitForFunction(() => document.querySelector('.gros').textContent.includes('23,50'));
  etape('une course ajoutée dans un onglet apparaît dans l’autre (23,50 €)');

  // 3. Données corrompues : copie de secours + démarrage propre
  await p2.close();
  await p.evaluate((c) => localStorage.setItem(c, '{pas du json'), CLE);
  await p.reload();
  assert.equal(await p.evaluate(() => localStorage.getItem('courses-livraison-v2-sauvegarde')), '{pas du json');
  assert.match(await p.textContent('#toast'), /illisibles/);
  etape('JSON corrompu : copie conservée dans …-sauvegarde, alerte affichée, appli démarrée');

  // 4. Courses invalides écartées mais conservées
  await p.evaluate((c) => localStorage.setItem(c, JSON.stringify({ courses: [
    { id: 'ok', date: '2026-10-31', km: 3, euros: 5 }, { id: 'ko', date: 'x', km: 0, euros: 5 }], reglages: {} })), CLE);
  await p.reload();
  assert.match(await p.evaluate(() => localStorage.getItem('courses-livraison-v2-sauvegarde')), /"ko"/);
  etape('course invalide écartée de l’affichage mais conservée dans la copie de secours');

  // 5. Migration depuis la v1
  await p.evaluate((c) => { localStorage.removeItem(c); localStorage.setItem('courses-livraison-v1',
    JSON.stringify([{ id: 1, date: '2026-10-30', km: 2, euros: 3 }])); }, CLE);
  await p.reload();
  assert.match(await p.textContent('#liste, #app'), /2 km/);
  etape('migration des données de la première version');

  // 5b. Saisies invalides dans le formulaire : message d'erreur, rien d'enregistré
  const nombre = async () => ((await lire(p)) || { courses: [] }).courses.length;
  const avant = await nombre();
  const saisies = [['5', ''], ['0', '5'], ['-2', '5'], ['', '']];
  for (const [km, eur] of saisies) {
    await p.click('#btn-ajout');
    await p.fill('#f-km', km);
    await p.fill('#f-eur', eur);
    await p.click('#f button[type=submit]');
    assert.notEqual(await p.textContent('#f-err'), '', `« ${km} / ${eur} » doit afficher une erreur`);
    await p.keyboard.press('Escape');
  }
  assert.equal(await nombre(), avant);
  etape('montant vide, distance 0 ou négative : erreur affichée, aucune course ajoutée');

  // 6. Échec d'écriture : bandeau visible
  await p.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await ajouter(p, '1', '1');
  assert.equal(await p.isVisible('#bandeau'), true);
  etape('échec d’écriture : bandeau « Non enregistré » affiché');

  assert.deepEqual(erreurs, []);
  await ctx.close();
  serveur.close();
  console.log(`${ok} vérifications réussies, aucune erreur JavaScript`);
})().catch((e) => { console.error(e); process.exit(1); });
