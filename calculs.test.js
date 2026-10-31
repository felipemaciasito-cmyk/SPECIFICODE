const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { lireNombre, iso, lireDate, debutSemaine, nettoyer, totaux } = require('./calculs.js');

// Comparaison à tolérance près, pour les divisions en virgule flottante.
const proche = (attendu, obtenu) => assert.ok(Math.abs(attendu - obtenu) < 1e-9, `attendu ${attendu}, obtenu ${obtenu}`);

describe('totaux', () => {
  test('liste vide : aucun total, aucun ratio', () => {
    assert.deepEqual(totaux([], 0), { n: 0, km: 0, euros: 0, parKm: null, parCourse: null, parHeure: null, net: null });
  });

  test('somme des courses, €/km et €/course', () => {
    const t = totaux([
      { km: 4, euros: 8, minutes: 20 },
      { km: 6, euros: 12, minutes: 0 },
    ], 0);
    assert.equal(t.n, 2);
    assert.equal(t.km, 10);
    assert.equal(t.euros, 20);
    proche(2, t.parKm);
    proche(10, t.parCourse);
  });

  test('€/heure ne compte que les courses chronométrées', () => {
    const t = totaux([
      { km: 5, euros: 10, minutes: 30 },
      { km: 5, euros: 30, minutes: 0 },
    ], 0);
    // 10 € pour 30 min, la course sans durée n'entre pas dans le calcul
    proche(20, t.parHeure);
    // mais elle compte dans les totaux d'argent
    proche(4, t.parKm);
  });

  test('€/heure vaut null si aucune course n’a de durée', () => {
    const t = totaux([{ km: 5, euros: 10, minutes: 0 }], 0);
    assert.equal(t.parHeure, null);
  });

  test('€/km vaut null si la distance totale est nulle', () => {
    const t = totaux([{ km: 0, euros: 5, minutes: 0 }], 0);
    assert.equal(t.parKm, null);
  });

  test('net nul sans coût au km, calculé avec un coût au km', () => {
    const liste = [{ km: 10, euros: 20, minutes: 0 }];
    assert.equal(totaux(liste, 0).net, null);
    assert.equal(totaux(liste, undefined).net, null);
    proche(18.8, totaux(liste, 0.12).net);
  });

  test('ne modifie pas la liste reçue', () => {
    const liste = [{ km: 4, euros: 8, minutes: 20 }];
    const copie = JSON.stringify(liste);
    totaux(liste, 0.1);
    assert.equal(JSON.stringify(liste), copie);
  });
});

describe('lireNombre', () => {
  test('accepte la virgule et le point décimal', () => {
    assert.equal(lireNombre('4,2'), 4.2);
    assert.equal(lireNombre('4.2'), 4.2);
    assert.equal(lireNombre(' 3 '), 3);
  });

  test('renvoie null pour une saisie invalide', () => {
    assert.equal(lireNombre('abc'), null);
    assert.equal(lireNombre(''), null);
    assert.equal(lireNombre('-1'), null);
  });
});

describe('nettoyer', () => {
  test('rejette les entrées invalides et garde les valides', () => {
    const propre = nettoyer([
      { id: 'a', date: '2026-10-30', km: 3, euros: 5 },
      { date: 'pas-une-date', km: 3, euros: 5 },
      { date: '2026-10-30', km: 0, euros: 5 },
      { date: '2026-10-30', km: 3, euros: -1 },
      null,
    ]);
    assert.equal(propre.length, 1);
    assert.equal(propre[0].id, 'a');
  });

  test('valeurs par défaut pour les champs optionnels', () => {
    const [c] = nettoyer([{ id: 'a', date: '2026-10-30', km: 3, euros: 5 }]);
    assert.deepEqual(
      { plateforme: c.plateforme, minutes: c.minutes, note: c.note },
      { plateforme: '', minutes: 0, note: '' },
    );
  });

  test('une entrée qui n’est pas un tableau donne une liste vide', () => {
    assert.deepEqual(nettoyer({ courses: [] }), []);
    assert.deepEqual(nettoyer(undefined), []);
  });
});

describe('debutSemaine', () => {
  test('un dimanche renvoie le lundi précédent', () => {
    const dimanche = lireDate('2026-10-25');
    assert.equal(dimanche.getDay(), 0, 'la date de test doit être un dimanche');
    assert.equal(iso(debutSemaine(dimanche)), '2026-10-19');
  });

  test('un lundi renvoie lui-même', () => {
    const lundi = lireDate('2026-10-26');
    assert.equal(lundi.getDay(), 1, 'la date de test doit être un lundi');
    assert.equal(iso(debutSemaine(lundi)), '2026-10-26');
  });
});
