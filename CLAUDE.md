# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Petite appli de suivi des courses de livraison (gains, km, €/km, objectif hebdomadaire, stats), en français. Le README ne contient qu'une ligne : c'est un labo pour apprendre Claude Code.

L'appli entière est **un seul fichier `index.html`** (HTML + CSS + JS inline, sans build, sans dépendances, sans `package.json`). Les données vivent uniquement dans le `localStorage` du navigateur.

## Commandes

- Tests unitaires + régressions : `node --test` (à lancer sans argument ; `node --test tests/` échoue car il traite le dossier comme un fichier).
- Un seul fichier : `node --test tests/calculs.test.js` ; un seul test : `node --test --test-name-pattern="objectif" tests/regressions.test.js`.
- Persistance en vrai navigateur : `node tests/persistance.e2e.js` (script autonome, hors `node --test`).
- Pas de lint ni de build. Pour voir l'appli, ouvrir `index.html` dans un navigateur.

Playwright et Chromium sont préinstallés dans l'environnement cloud (`require('playwright')` fonctionne) ; ne pas les réinstaller.

## Architecture

- **Tests par extraction** : `tests/calculs.test.js` ne charge pas de module. Il lit `index.html`, extrait les blocs entre `/* calculs:début */` et `/* calculs:fin */`, puis les évalue dans `vm.runInNewContext`. Ces blocs doivent donc rester des fonctions pures, sans accès à `document`, `localStorage` ni à `etat`. Si on ajoute une fonction pure à tester, la placer dans un de ces blocs **et** l'ajouter à la liste renvoyée à la fin de l'évaluation dans le test.
- **État et rendu** : un objet global `etat` (courses, réglages, vue courante, période, filtre…). Toute modification passe par `sauver()` (écrit dans `localStorage`) puis `rendu()`, qui reconstruit la vue entière (`vueCourses`, `vueStats`, `vueOutils`, `vueReglages`) avec l'aide `h()` (DOM) et `s()` (SVG). Il n'y a pas de framework.
- **Persistance** (`charger` / `sauver`) : clé `courses-livraison-v2`, avec migration depuis `-v1`. Un JSON illisible ou des courses invalides sont copiés dans `courses-livraison-v2-sauvegarde` avant qu'une sauvegarde ne les écrase, et une alerte s'affiche. L'évènement `storage` recharge l'état quand un autre onglet modifie les données.
- **Import** : fusion par `id` (`nettoyer` filtre les entrées invalides). Sans `id`, il est déduit du contenu pour que réimporter le même fichier ne crée pas de doublons.

## Pièges

- `PAR_DEFAUT.plateformes` est un tableau : toujours le copier (`defauts()` dans `charger`, spread explicite dans `toutEffacer`), sinon ajouter une plateforme modifie les valeurs par défaut.
- L'objectif de la semaine se calcule sur toutes les plateformes ; le filtre de plateforme ne concerne que la liste affichée.
- `tests/regressions.test.js` et `persistance.e2e.js` pilotent l'UI via des sélecteurs (`#onglets button[data-vue=…]`, `#fichier`, `.puce`, `.tag`, `button.danger`, `.ajout button`, `#btn-ajout`). Renommer ces éléments casse les tests.
