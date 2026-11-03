# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A small French-language web app (`index.html`) for logging delivery rides ("courses de livraison"): distance, earnings, duration, platform, and cost per km. The UI text, comments and tests are in French; keep that convention. `README.md` is a one-line description of the repo as a Claude Code learning lab.

## Commands

No `package.json`, no build step, no linter.

- Unit tests (pure calculation functions): `node --test tests/calculs.test.js`
- One test by name: `node --test --test-name-pattern="lireNombre" tests/calculs.test.js`
- Browser persistence tests: `node tests/persistance.e2e.js` (uses `require('playwright')` and a Chromium; not run while writing this file, so check it works before relying on it)
- Open the app: open `index.html` directly in a browser. There is no server.

## Architecture

Everything lives in `index.html`: inline `<style>`, markup, and one `<script>` block. There are no external dependencies.

- **Pure calculation functions are shared with the tests.** The functions `nettoyer`, `totaux`, `lireNombre`, `iso`, `lireDate`, `ajouterJours`, `debutSemaine` sit between `/* calculs:début */` and `/* calculs:fin */` markers (three blocks, around lines 818, 947 and 978). `tests/calculs.test.js` extracts these blocks with a regex and evaluates them in a `vm` context. Keep the markers intact and keep these functions free of DOM access, or the tests break.
- **State and persistence.** The app state is `etat` (`courses`, `reglages`, `vue`). It is stored in `localStorage` under `courses-livraison-v2`. Data from the first version (`courses-livraison-v1`) is migrated on load. Corrupt JSON is copied to `courses-livraison-v2-sauvegarde` and a toast is shown, and the app starts clean. Invalid entries are dropped from the display but kept in that backup. A failed write shows a "Non enregistré" banner (`#bandeau`). Changes made in one tab appear in the others.
- **Rendering.** There is no framework. Views are functions (`vueCourses`, `vueStats`, `vueOutils`, `vueReglages`) that return DOM built by the small `h()`/`s()` helpers. `rendu()` swaps the current view into `#app` and updates the tab buttons in `#onglets`. Navigation goes through `allerA(vue)`, and state changes are followed by a re-render.
- **Dates** are handled as local-date ISO strings (`YYYY-MM-DD`) and validated with `dateExiste`. Weeks start on Monday (`debutSemaine`). Impossible dates are rejected, not rolled over.
- **Money and numbers.** `lireNombre` accepts a comma or a dot as decimal separator and rejects negatives, exponents and `Infinity`. Rates are global: €/km = total € ÷ total km, not an average of per-ride ratios. Net earnings are only computed when a cost per km is set in the settings.
- **Theme.** Light/dark is applied by `appliquerTheme()` / `themeEffectif()`.
- **Dialogs.** Ride add/edit uses a dialog (`ouvrirCourse`, `fermerDialogue`, with a live preview in `majApercu`).

## Repo-specific rules

- `protege/` is write-protected by a `PreToolUse` hook in `.claude/settings.json`. Edits there are blocked. Do not try to work around it.
- `.claude/settings.json` runs `npx --no-install prettier --write` on every file edited with Edit/Write/MultiEdit. There is no Prettier in the repo, so this is a silent no-op unless it is installed globally.
- `JOURNAL.md` is the user-facing change log, written in plain French with one dated block per day. The `/journal` skill (`.claude/skills/journal/SKILL.md`) updates it. Only write visible changes there, and never remove existing entries. Its entries also describe app behaviour (for example, bold totals), so keep the app and the journal consistent.
- `.claude/agents/relecteur.md` is a French-language review subagent that reports only bugs that change an observable result. Use it before commits or PRs when asked.
