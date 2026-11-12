# 049 - A victory and a death count once in development

- **Date:** 2026-11-12
- **Commit(s):** `fix(battle): count a victory and a death once under StrictMode`
- **Debt item:** D52 (found by playing the game with `npm run dev`)

## What

- `handleSuccessHit` computes the result of the hit first, then updates the skills, the stats and the hearts, then plays the sounds. The state updates no longer contain side effects.
- It reads the current skills, stats and hearts through a ref, because the speech recognition calls an older copy of the function.

## Why

The stats, the sounds and the timers were triggered from inside `setSkills` and `setPlayerHealth` updates. React runs such updates twice in development (`StrictMode`) to reveal exactly this mistake. Playing one math battle in the real game showed it: one defeated mob counted as two, and a death counted twice and cost two levels. The production build was not affected, but every developer saw wrong numbers.

## Proof

- 2 App tests under `StrictMode` written first and seen failing (2 victories and 2 deaths counted), now passing.
- Played again in the real game: one defeated mob adds exactly one.
- Whole suite passes, including the reading tests that caught a stale state in a first version of the fix.
