# 072 - The hit flash of a mob lives in a hook

- **Date:** 2026-11-13
- **Commit(s):** `refactor(skillcard): move the hit flash into a hook and drop the lint exception`
- **Debt items:** D64 (done), D27 (seventh step)

## What

- `src/hooks/useHitFlash.js`: tells whether a mob was just hit, from the number of damage numbers on screen. It lasts 400 ms.
- The rise of the count is noticed while drawing, no effect copies a prop into a state any more. An effect only ends the flash with a timer.
- The exception `react-hooks/set-state-in-effect: off` for `SkillCard.jsx` is removed from `eslint.config.js`. The rule now applies to the whole project.

## Behaviour changes

- A second hit within 400 ms restarts the 400 ms. Before, the timer of the first hit ended the flash early.
- The timer is cleared when the card goes away.

## Proof

- 5 tests for the hook, the existing tests pass, lint is clean without the exception.
