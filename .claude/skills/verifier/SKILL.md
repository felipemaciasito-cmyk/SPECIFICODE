---
name: verifier
description: À utiliser après toute modification du code de l'appli (index.html, fonctions de calcul, tests). Lance les tests unitaires (node --test), vérifie le diff par rapport à main pour qu'aucun test n'ait été supprimé ni assoupli, puis conclut RÉUSSI ou ÉCHEC.
---

Vérifie le code de l'appli en suivant ces étapes, dans l'ordre.

1. **Lancer les tests.** Depuis la racine du dépôt, exécute `.claude/skills/verifier/verifier.sh` et garde la sortie complète ainsi que le code de sortie.

2. **Lire le diff par rapport à main.** Exécute `git diff main` (si `main` n'existe pas en local, utilise `origin/main`) et lis-le en entier, en particulier les changements de `tests/`.

3. **Vérifier que les tests n'ont été ni supprimés ni assouplis.** Cherche dans le diff :
   - un `test(` retiré, ou un nombre de tests qui baisse (`grep -c "^test(" tests/*.js` sur main et sur la branche) ;
   - une assertion retirée ou remplacée par une version plus faible (`assert.equal` devenu `assert.ok`, valeur attendue modifiée pour coller au nouveau résultat, boucle ou condition qui ne teste plus rien) ;
   - un `.skip`, `.only`, `todo` ou `return` ajouté au début d'un test.
     Un test ajouté ou un test renforcé est acceptable. Si tu ne peux pas trancher, dis-le.

4. **Conclure.** Termine par une seule ligne :
   - `RÉUSSI` si le code de sortie est 0 et qu'aucun test n'a été supprimé ni assoupli ;
   - `ÉCHEC` dans les autres cas, avec la raison (test en échec, test supprimé ou assoupli, etc.).
     Donne la sortie complète des tests dans ta réponse, sans la résumer.
