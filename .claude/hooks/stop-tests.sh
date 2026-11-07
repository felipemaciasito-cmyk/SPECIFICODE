#!/usr/bin/env bash
# Hook Stop : lance les tests unitaires avant que Claude ne s'arrête.
# Si les tests échouent, sort avec le code 2 et renvoie la fin de la sortie
# sur stderr, pour que Claude continue et corrige.
# Si stop_hook_active vaut true (Claude continue déjà à cause de ce hook),
# on laisse s'arrêter pour éviter une boucle infinie.

entree=$(cat)
if [ "$(printf '%s' "$entree" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

sortie=$(node --test 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "Les tests échouent (node --test). Fin de la sortie :"
    printf '%s\n' "$sortie" | tail -n 40
  } >&2
  exit 2
fi
exit 0
