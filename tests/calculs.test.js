// Tests des fonctions pures de index.html (blocs entre /* calculs:début */ et /* calculs:fin */).
// Lancer : node --test
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blocs = [...html.matchAll(/\/\* calculs:début \*\/([\s\S]*?)\/\* calculs:fin \*\//g)].map((m) => m[1]);
assert.ok(blocs.length >= 3, 'blocs calculs introuvables dans index.html');

const { nettoyer, totaux, lireNombre, iso, lireDate, ajouterJours, debutSemaine } = vm.runInNewContext(
  `${blocs.join('\n')}\n({ nettoyer, totaux, lireNombre, iso, lireDate, ajouterJours, debutSemaine })`
);

// Les objets créés dans vm ont un autre prototype : on compare leur forme JSON.
const json = (v) => JSON.parse(JSON.stringify(v));
const proche = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('totaux : liste vide', () => {
  const t = totaux([]);
  assert.deepEqual(json(t), { n: 0, km: 0, euros: 0, parKm: null, parCourse: null, parHeure: null, net: null });
});

test('totaux : €/km global = total € / total km (pas la moyenne des ratios)', () => {
  const t = totaux([{ km: 4.2, euros: 6.5, minutes: 0 }, { km: 10, euros: 12, minutes: 0 }]);
  proche(t.km, 14.2);
  proche(t.euros, 18.5);
  proche(t.parKm, 18.5 / 14.2);
  proche(t.parCourse, 9.25);
});

test('totaux : net seulement si un coût au km est donné', () => {
  const l = [{ km: 10, euros: 12, minutes: 0 }];
  assert.equal(totaux(l).net, null);
  proche(totaux(l, 0.1).net, 11);
});

test('totaux : €/h calculé uniquement sur les courses avec durée', () => {
  const t = totaux([{ km: 4, euros: 6, minutes: 30 }, { km: 2, euros: 100, minutes: 0 }]);
  proche(t.parHeure, 12);
  proche(t.euros, 106);
});

test('lireNombre : virgule et point acceptés', () => {
  assert.equal(lireNombre('4,2'), 4.2);
  assert.equal(lireNombre('4.2'), 4.2);
  assert.equal(lireNombre(' 7 '), 7);
});

test('lireNombre : valeurs invalides renvoient null', () => {
  for (const v of ['', 'abc', '-3', '1,2,3', '3.', '1e3']) assert.equal(lireNombre(v), null, `« ${v} »`);
});

test('lireNombre : montant vide, espaces seuls et virgule seule sont invalides', () => {
  for (const v of ['', '   ', ',', '.', ',5', '5,']) assert.equal(lireNombre(v), null, `« ${v} »`);
});

test('lireNombre : zéro est un nombre valide (le contrôle > 0 est fait ailleurs)', () => {
  assert.equal(lireNombre('0'), 0);
  assert.equal(lireNombre('0,00'), 0);
});

test('lireNombre : négatif et notation scientifique rejetés', () => {
  for (const v of ['-0', '-0,5', '+3', '1e-3', 'Infinity']) assert.equal(lireNombre(v), null, `« ${v} »`);
});

test('nettoyer : distance à 0 et négative écartées', () => {
  const r = nettoyer([
    { date: '2026-10-31', km: 0, euros: 5 },
    { date: '2026-10-31', km: -2, euros: 5 },
    { date: '2026-10-31', km: NaN, euros: 5 },
    { date: '2026-10-31', km: Infinity, euros: 5 },
  ]);
  assert.equal(r.length, 0);
});

test('nettoyer : montant à 0 accepté, montant négatif ou absent écarté', () => {
  assert.equal(nettoyer([{ date: '2026-10-31', km: 3, euros: 0 }]).length, 1);
  assert.equal(nettoyer([{ date: '2026-10-31', km: 3, euros: -0.01 }]).length, 0);
  assert.equal(nettoyer([{ date: '2026-10-31', km: 3 }]).length, 0);
  assert.equal(nettoyer([{ date: '2026-10-31', km: 3, euros: null }]).length, 0);
});

test('nettoyer : dates impossibles écartées (pas de débordement silencieux)', () => {
  for (const d of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-10-32', '2026-02-29']) {
    assert.equal(nettoyer([{ date: d, km: 3, euros: 5 }]).length, 0, d);
  }
  assert.equal(nettoyer([{ date: '2028-02-29', km: 3, euros: 5 }]).length, 1, 'année bissextile valide');
});

test('nettoyer : durée négative, NaN ou absente donnent 0 minute', () => {
  for (const minutes of [-5, NaN, undefined, '30']) {
    assert.equal(nettoyer([{ date: '2026-10-31', km: 3, euros: 5, minutes }])[0].minutes, 0, String(minutes));
  }
});

test('totaux : course à 0 km ne fait pas diviser par zéro', () => {
  const t = totaux([{ km: 0, euros: 5, minutes: 0 }]);
  assert.equal(t.parKm, null);
  proche(t.parCourse, 5);
  assert.equal(t.net, null);
  const u = totaux([{ km: 0, euros: 5, minutes: 0 }], 0.2);
  proche(u.net, 5);
});

test('totaux : montant à 0 donne 0 € / km, pas null', () => {
  const t = totaux([{ km: 4, euros: 0, minutes: 0 }]);
  assert.equal(t.parKm, 0);
  assert.equal(t.parCourse, 0);
});

test('nettoyer : écarte les entrées invalides et complète les champs', () => {
  const brut = [
    { id: 'a', date: '2026-10-31', km: 3, euros: 5 },
    { date: '2026-10-31', km: 0, euros: 5 },
    { date: '31/10/2026', km: 3, euros: 5 },
    { date: '2026-10-31', km: 3, euros: -1 },
    { date: '2026-10-31', km: '3', euros: 5 },
    null,
  ];
  const r = nettoyer(brut);
  assert.equal(r.length, 1);
  assert.deepEqual(json(r[0]), { id: 'a', date: '2026-10-31', km: 3, euros: 5, plateforme: '', minutes: 0, note: '' });
  assert.deepEqual(json(nettoyer('pas une liste')), []);
});

test('dates : lundi comme début de semaine, passage de mois', () => {
  assert.equal(iso(debutSemaine(lireDate('2026-10-31'))), '2026-10-26'); // samedi
  assert.equal(iso(debutSemaine(lireDate('2026-11-01'))), '2026-10-26'); // dimanche
  assert.equal(iso(debutSemaine(lireDate('2026-10-26'))), '2026-10-26'); // lundi
  assert.equal(iso(ajouterJours(lireDate('2026-10-31'), 1)), '2026-11-01');
});
