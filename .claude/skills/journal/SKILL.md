---
name: journal
description: Ajoute en haut de JOURNAL.md la date du jour et une ligne par changement visible fait pendant la session, en français simple.
disable-model-invocation: true
---

Mets à jour le fichier `JOURNAL.md` à la racine du projet.

1. Relève les changements visibles faits pendant cette session : fonctionnalités ajoutées, comportements modifiés, bugs corrigés, pages ou fichiers créés. Ignore les détails techniques internes qui ne se voient pas pour l'utilisateur.
2. Écris une ligne par changement, en français simple, phrases courtes, sans jargon inutile. Commence chaque ligne par un tiret (`- `).
3. Ajoute en haut du fichier (juste après le titre `# Journal` s'il existe, sinon tout en haut) un bloc :

```
## AAAA-MM-JJ

- ligne 1
- ligne 2
```

   La date est la date du jour. Ne supprime aucune entrée existante. Si le fichier n'existe pas, crée-le avec le titre `# Journal` puis le bloc.
4. Si aucun changement visible n'a été fait pendant la session, ajoute quand même le bloc avec une seule ligne : `- Aucun changement visible aujourd'hui.`
5. Ne fais aucun commit ni push sauf si l'utilisateur le demande.
6. Termine par une phrase courte confirmant ce qui a été ajouté.
