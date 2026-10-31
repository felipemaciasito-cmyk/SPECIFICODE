/* Fonctions pures : aucun accès au DOM ni à l’état de l’appli. */

// Accepte « 4,2 » comme « 4.2 ». Renvoie null si ce n’est pas un nombre valide.
function lireNombre(texte) {
  const t = texte.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function lireDate(t) {
  const [a, m, j] = t.split('-').map(Number);
  return new Date(a, m - 1, j);
}

function ajouterJours(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function debutSemaine(d) {
  return ajouterJours(d, -((d.getDay() + 6) % 7));
}

function nettoyer(liste) {
  if (!Array.isArray(liste)) return [];
  return liste
    .filter((c) => c && /^\d{4}-\d{2}-\d{2}$/.test(c.date) && Number.isFinite(c.km) && c.km > 0 && Number.isFinite(c.euros) && c.euros >= 0)
    .map((c) => ({
      id: String(c.id ?? Date.now() + Math.random()),
      date: c.date,
      km: c.km,
      euros: c.euros,
      plateforme: typeof c.plateforme === 'string' ? c.plateforme : '',
      minutes: Number.isFinite(c.minutes) && c.minutes > 0 ? c.minutes : 0,
      note: typeof c.note === 'string' ? c.note : '',
    }));
}

// coutKm : coût au kilomètre des réglages (0 = pas de calcul de net).
function totaux(liste, coutKm) {
  const n = liste.length;
  const km = liste.reduce((a, c) => a + c.km, 0);
  const euros = liste.reduce((a, c) => a + c.euros, 0);
  const chrono = liste.filter((c) => c.minutes > 0);
  const minutes = chrono.reduce((a, c) => a + c.minutes, 0);
  const eurosChrono = chrono.reduce((a, c) => a + c.euros, 0);
  return {
    n, km, euros,
    parKm: km > 0 ? euros / km : null,
    parCourse: n ? euros / n : null,
    parHeure: minutes > 0 ? eurosChrono / (minutes / 60) : null,
    net: coutKm > 0 ? euros - km * coutKm : null,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { lireNombre, pad, iso, lireDate, ajouterJours, debutSemaine, nettoyer, totaux };
}
