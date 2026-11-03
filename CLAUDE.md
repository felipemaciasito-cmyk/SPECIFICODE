# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Petite application web en français (`index.html`) pour noter les courses de livraison. L'interface, les commentaires et les tests sont en français : garde cette convention.

Chaque montant s'affiche avec une virgule comme séparateur décimal, suivie du symbole €, par exemple `12,50 €`. Exception : l'objectif hebdomadaire s'affiche arrondi à l'euro entier, par exemple `150 €`.

## Commandes

Il n'y a ni `package.json`, ni étape de build, ni linter.

- Tests unitaires (fonctions de calcul) : `node --test tests/calculs.test.js`
- Un seul test, par son nom : `node --test --test-name-pattern="lireNombre" tests/calculs.test.js`
- Tests de persistance dans un vrai navigateur : `node tests/persistance.e2e.js` (utilise Playwright et Chromium). Ce test n'a pas été exécuté lors de la rédaction de ce fichier ; vérifie qu'il passe avant de t'y fier.

## Architecture

- **Les fonctions de calcul sont partagées avec les tests.** Les fonctions situées entre les marqueurs `/* calculs:début */` et `/* calculs:fin */` dans `index.html` sont extraites par une expression régulière dans `tests/calculs.test.js`, puis évaluées dans un contexte `vm`. Garde les marqueurs en place, et garde ces fonctions sans accès au DOM, sinon les tests cassent.
- **Les taux sont globaux.** Le €/km est le total en € divisé par le total en km, et non la moyenne des ratios par course. Le net n'est calculé que si un coût au km est défini dans les réglages. Ne « corrige » pas ce calcul en moyenne des ratios.

## Règles propres au dépôt

- Le dossier `protege/` est bloqué en écriture par un hook `PreToolUse` dans `.claude/settings.json`. Ne contourne pas ce blocage.
- Le hook `PostToolUse` lance `npx --no-install prettier --write` après chaque édition. Prettier n'est pas installé dans le dépôt, donc le hook ne fait rien à moins qu'il ne soit installé globalement.
- `JOURNAL.md` est le journal des changements visibles, en français simple, avec un bloc daté par jour. Le skill `/journal` (`.claude/skills/journal/SKILL.md`) le met à jour. N'y ajoute que des changements visibles, et ne supprime jamais une entrée existante. Certaines entrées décrivent un comportement de l'app (par exemple, les totaux en gras) : garde l'app et le journal cohérents.
- `.claude/agents/relecteur.md` est un sous-agent de relecture en français, qui ne signale que les bugs qui changent un résultat observable. Utilise-le avant un commit ou une PR, quand on te le demande.
