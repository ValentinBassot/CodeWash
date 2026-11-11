# 041 - Old saves get a mob matching their difficulty

- **Date:** 2026-11-11
- **Commit(s):** `fix(persistence): rebuild missing mob health from the saved difficulty`
- **Debt item:** D44

## What

In `loadSkills`, the "mob health missing" check reads the saved skill (`data[key]`) instead of the skill already merged with the defaults.

## Why

The defaults (a 60 HP mob) were merged first, so the check always saw a number and never ran: a save from before mob health existed, at difficulty 2, got a 60 HP mob that died in two hits instead of a 180 HP one. The neighbouring checks (difficulty, badges, death state) have the same shape but no effect, because their default is already the right value.

## Proof

- The `KNOWN DEBT D44` test is replaced by tests of the expected behavior, seen failing first: an old difficulty-2 save gets 180 HP; a saved mob health is kept as it is.
- Whole suite passes.
