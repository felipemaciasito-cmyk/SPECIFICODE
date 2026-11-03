# CLAUDE.md

Application web en français : `index.html` (un seul fichier, sans bibliothèque externe) pour noter les courses de livraison.

## Commandes

- Tests unitaires : `node --test tests/calculs.test.js`
- Un seul test : `node --test --test-name-pattern="lireNombre" tests/calculs.test.js`
- Test de persistance (Playwright + Chromium) : `node tests/persistance.e2e.js`

## Règles

- **Langue** : interface, commentaires et tests en français.
- **Pas de bibliothèque externe** : pas de `<script src>` ni d'import distant. Écris le code nécessaire toi-même.
- **Montants** : affiche-les au format français, comme `12,50 €` (voir `fmtEuros` dans `index.html`).
- **Clé localStorage** : `courses-livraison-v2` (constante `CLE`). Ne la change jamais. `-v1` et `-sauvegarde` sont à garder tels quels. Un test vérifie la valeur de `CLE`.
- **Calculs** : garde les fonctions entre `/* calculs:début */` et `/* calculs:fin */` pures (sans DOM) et garde les marqueurs.
- **Taux globaux** : €/km = total € ÷ total km, jamais la moyenne des ratios par course. Le net n'est calculé que si un coût au km est défini dans les réglages.
- **`protege/`** : ne modifie pas ce dossier (bloqué par hook). Si une modification y est nécessaire, demande d'abord à l'utilisateur.
- **Journal** : `JOURNAL.md` ne contient que les changements visibles, en français simple, dans un bloc daté par jour (skill `/journal`). Ne supprime aucune entrée ; pour corriger, ajoute une ligne.
- **Changement visible** : tout ce que l'utilisateur voit à l'écran ou dans les chiffres affichés (nouvel écran, bouton, libellé, total, format de montant, message, comportement). Ne sont pas visibles : refactorisation, tests, documentation, CLAUDE.md.
- **Relecture** : avant tout commit ou PR, lance le sous-agent `relecteur` (`.claude/agents/relecteur.md`).
