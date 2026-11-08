# 015 - Characterization tests of the writing battles

- **Date:** 2026-11-08
- **Commit(s):** `test: share game helpers between battle tests`, `test: characterize writing battles`
- **Debt item:** D01 (pins D23)

## What

- `src/test/game.jsx`: helpers shared by the battle tests (mount a game from an edited save, read the save, press a card button, type, advance the simulated clock). `App.battle.test.jsx` now uses them.
- `src/App.writing.test.jsx`: 5 tests playing the writing game through the interface: the picture and one box per letter, a correct word (12 damage, 20 XP), lower case and spaces accepted, five words defeat the mob, and D23.
- Coverage floors raised to 67 % of lines.

## Why

Writing is one of the six mini-games living in `SkillCard` (D27). D23 is now a fact: a wrong word plays the mismatch sound but never calls the damage handler, so ten wrong words do not kill the player, while ten wrong math answers do. The test finds the expected word from the picture shown in the challenge, the way a player does.

## Proof

- `npm run test:coverage`: 147 tests pass, global coverage 68.6 % of lines, writing tests stable over 3 runs.
- Mutation check by hand: making a wrong word cost a heart breaks the D23 test; removing the upper-case conversion breaks the lower-case test.
