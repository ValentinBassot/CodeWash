# 077 - The inside of a battle card is a component

- **Date:** 2026-11-15
- **Commit(s):** `refactor(skillcard): move the inside of a battle card into BattleBody`
- **Debt item:** D27

## What

- `BattleBody` in `src/components/skills/card/` chooses what the battle shows: the memory game, the patterns game, a typed answer, the microphone or the cleaning button, then the experience bar.
- The memory pairs and grid are read there from the difficulty.
- `SkillCard` only builds the frame of the card: picture, name, level, life bar, border, and the choice between waiting and battling.

## Behaviour kept

Same screens for the six skills. The App tests of each skill pass unchanged.

## Proof

- 7 unit tests for `BattleBody`.
- `SkillCard.jsx` goes from 1066 lines at the start to about 250.
