# 006 - Prettier formatter and format check

- **Date:** 2026-11-06
- **Commit(s):** `build: add prettier and format scripts`, `style: format the codebase with prettier`
- **Debt item:** D08 (adds D43)

## What

- Prettier 3.9.10 with `.prettierrc.json` (4 spaces, single quotes, semicolons, 120 columns; 2 spaces for JSON and YAML) and `.prettierignore`.
- `npm run format` and `npm run format:check`.
- Every file formatted once, in a commit of its own.
- Two `eslint-disable-next-line` directives moved back onto the line they silence (Prettier had split it).

## Why

The subject requires a format check in CI and there was no formatter. Indentation, quotes and semicolons differed from file to file. Formatting everything in one commit keeps later diffs readable. JSON stays at 2 spaces because npm rewrites `package.json` that way.

## Proof

- `npm run format:check` passes, also after `npm install`.
- Production bundle compared before and after (pretty-printed, `diff`): it differs in 2 places out of 20 165 lines. In both, a JSX text ending in a space became the text plus `{' '}`, and React renders the same string.
- `npm run lint`: 0 errors. `npm test`: 10 tests pass.
