# 001 - Remove AppleDouble files, add .gitignore

- **Date:** 2026-11-05
- **Commit(s):** `285877a`
- **Debt item:** AppleDouble `._*` files tracked in git; no `.gitignore`

## What

Deleted the 374 `._*` files and added a `.gitignore` (dependencies, build outputs, coverage, OS junk, `._*`).

## Why

The `._*` files are macOS metadata, not code. ESLint tried to parse them and reported 28 errors that hid the real lint status. Without a `.gitignore`, `node_modules/`, `dist/` and `release/` could be committed.

## Proof

`npx eslint .`: 28 errors before, 0 after. `npm run build` still passes.
