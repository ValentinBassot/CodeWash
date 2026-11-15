# 075 - The battle session lives in a hook

- **Date:** 2026-11-15
- **Commit(s):** `refactor(battle): move the battle session out of App into a hook`
- **Debt item:** D26

## What

- `useBattleSession` in `src/hooks/useBattleSession.js` owns the battle state: player lives, current skill, challenge, damage numbers, loot box, death and level-restored overlays, boss healing.
- It also owns the actions: start and end of a battle, a right answer, a wrong answer, the phantom bonus and the voice listener.
- `App` only reads what it shows and passes the actions to the cards.
- The effect of a right answer is split into `handleSuccessHit` (rules and states) and `showHitFeedback` (damage number and sounds).

## Behaviour kept

Same rules, sounds, timings and states. The existing App tests (battle, reading, memory, patterns, phantom, flows) pass unchanged.

## Proof

- `App.jsx` goes from 882 to about 670 lines.
- 508 tests pass, lint and format are clean.
