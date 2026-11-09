# 023 - Remove an unreachable branch in PixelHeart

- **Date:** 2026-11-09
- **Commit(s):** `refactor: remove unreachable default color in PixelHeart`
- **Debt item:** D13 (dead code)

## What

Removed `default: return 'transparent'` from `getColor` in `src/components/ui/PixelHeart.jsx`.

## Why

Empty cells (`0`) are skipped before `getColor` is called, and the four other values each have their own `case`: the default could never run. It showed up as the only uncovered line of the diff that no test could reach honestly.

## Proof

The hearts are drawn in every test that mounts the App: 199 tests pass, lint clean.
