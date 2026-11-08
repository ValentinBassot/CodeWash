# 014 - .env configuration

- **Date:** 2026-11-08
- **Commit(s):** `feat(config): read settings from .env`
- **Debt item:** protocol step "inject clock/config" (task "Directed jet")

## What

- `.env.example` (committed) lists the settings; `.env`, `.env.local` and `.env.*.local` are ignored by git.
- `src/config.js`: `parseConfig(env)` reads `VITE_BUG_REPORT_EMAIL` and `VITE_TRIVIA_API_URL` once, trims them, treats empty values as not set, and throws an error naming the variable when a value is malformed. `config` is the parsed result for the running game.
- README section "Configuration".

## Why

The subject asks to inject the configuration instead of hard-coding it, and two missions need a setting: the bug report contact (Bug Reporting) and the trivia API (New game). Parsing at the boundary, in one place, means the rest of the code can trust the values. Only those two variables exist because nothing else is configurable yet; nothing reads them until a mission uses them.

## Proof

- `src/config.test.js`: 6 tests (empty, valid values, trimming, bad e-mail, bad URL, empty values), written before the module and seen failing first.
- `git check-ignore .env` matches the new rule; `.env.example` is not ignored.
