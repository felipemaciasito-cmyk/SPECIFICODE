#!/usr/bin/env bash
# Lance la suite de tests unitaires (node --test) depuis la racine du dépôt.
# Le code de sortie de node est transmis tel quel (0 = tous les tests passent).
cd "$(dirname "$0")/../../.." || exit 1
exec node --test
