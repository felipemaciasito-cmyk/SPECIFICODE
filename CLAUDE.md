# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

- Tests : `node --test` à lancer sans argument (`node --test tests/` échoue : le dossier est traité comme un fichier).
- Un seul test : `node --test --test-name-pattern="objectif" tests/regressions.test.js`.
- Persistance en vrai navigateur : `node tests/persistance.e2e.js` (script autonome, hors `node --test`).
- Playwright et Chromium sont préinstallés dans l'environnement cloud ; ne pas les réinstaller.

## Pièges

- `tests/calculs.test.js` extrait de `index.html` les blocs entre `/* calculs:début */` et `/* calculs:fin */` et les évalue dans `vm`. Ces blocs doivent rester purs (pas de `document`, `localStorage` ni `etat`). Une nouvelle fonction à tester doit être placée dans un bloc **et** ajoutée à la liste renvoyée dans le test.
- `tests/regressions.test.js` et `persistance.e2e.js` pilotent l'UI via des sélecteurs (`#onglets button[data-vue=…]`, `#fichier`, `.puce`, `.tag`, `button.danger`, `.ajout button`, `#btn-ajout`). Renommer ces éléments casse les tests.
