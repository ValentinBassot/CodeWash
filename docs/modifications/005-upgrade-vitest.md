# 005 - Upgrade Vitest to 5.1.0

- **Date:** 2026-11-06
- **Commit(s):** `build: upgrade vitest to 5.1.0`
- **Debt item:** D10

## What

Vitest 3.2.4 → 5.1.0 (dev dependency only).

## Why

Vitest 3.2.4, added in 002, brought 2 critical vulnerabilities (`tinypool`, and the Vitest UI server): `npm audit` went from 31 to 34.

## Proof

`npm audit` (npm 10): 34 → 31, the same as the project received. `npm test`: 10 tests pass.
