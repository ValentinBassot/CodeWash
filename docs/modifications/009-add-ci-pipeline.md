# 009 - CI pipeline and coverage gates

- **Date:** 2026-11-07
- **Commit(s):** `ci: add quality pipeline and coverage gates`
- **Debt item:** D01, D06

## What

- `.github/workflows/ci.yml`, on every pull request and push to `develop` and `main`: environment check, lint (ESLint, the static analysis), format check, tests with coverage gates, build, then the Windows `.exe`. A release is published only on a push to `main`.
- Coverage thresholds in `vite.config.js`: global floors at today's level (16 % of lines), and per-file thresholds for the files already covered (`achievementUtils.js` 100 %, `achievements.js` 100 %, `gameUtils.js` 80 %).
- `build-exe.yml` removed: its Windows build and release moved into the new pipeline.

## Why

The subject requires a CI on every pull request with build, tests, lint, format check, coverage report, static analysis and gates that block the merge. The old workflow published a release on every push to `main` without running a single test (it had already created the `v1` tag on `init`). The global floors are a ratchet: they only go up as tests are added, so coverage can never drop unnoticed.

## Proof

- `npm run test:coverage` exits 0 today, and exits 1 with "does not meet global threshold" when the lines threshold is raised to 99 %.
- The workflow file is valid YAML and the coverage summary script was run locally on real numbers.
- Not run on GitHub yet: the commits are still local.
