#!/usr/bin/env bash
# Hook SessionStart (matcher « compact ») : après une compaction du contexte,
# rappelle à Claude la liste des fichiers modifiés par rapport à main
# (commits de la branche, changements non commités et fichiers non suivis).

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

base_ref=main
git rev-parse --verify --quiet "$base_ref" >/dev/null || base_ref=origin/main
base=$(git merge-base "$base_ref" HEAD 2>/dev/null) || {
  echo "Impossible de comparer avec main (branche introuvable)."
  exit 0
}

fichiers=$( { git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u)

if [ -z "$fichiers" ]; then
  echo "Aucun fichier modifié par rapport à main."
else
  echo "Fichiers modifiés par rapport à main :"
  printf '%s\n' "$fichiers" | sed 's/^/- /'
fi
exit 0
