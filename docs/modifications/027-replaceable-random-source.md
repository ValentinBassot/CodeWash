# 027 - Randomness through one replaceable source

- **Date:** 2026-11-09
- **Commit(s):** `refactor(domain): draw every random number from one replaceable source`
- **Debt item:** D16

## What

- `src/domain/random.js`: `random()`, `setRandomSource()`, `resetRandomSource()`, `createSeededRandom(seed)`.
- The 35 `Math.random()` calls of `App`, `PhantomEvent`, `SkillCard`, `gameUtils`, `mobDisplayUtils` and `soundManager` now call `random()`.
- ESLint forbids `Math.random` in `src/` outside this module and the tests.
- First architecture decision record: `docs/adr/0001-replaceable-random-source.md` explains why a replaceable source rather than a parameter everywhere.

## Why

Tests could not control randomness without stubbing a global, and coverage moved by about one point between runs (D16).

## Proof

- `src/domain/random.test.js`: 5 tests written first and seen failing (default source read at call time, replaced source, reset, same seed same sequence, values in [0, 1)).
- No behavior change: the whole suite passes (222 tests), including the tests that stub `Math.random`.
- A file using `Math.random` in `src/` now fails `npm run lint`.
