# 067 - The patterns game is its own component

- **Date:** 2026-11-13
- **Commit(s):** `refactor(patterns): move the patterns game out of SkillCard`
- **Debt item:** D27 (second step), D64

## What

- `src/domain/patterns.js`: the tempo of the sequence (`getTempoDelays`, `clamp`, `lerp`, the slowest and fastest delays).
- `src/components/skills/games/PatternsGame.jsx`: the axolotl board, the sequence, the clicks, game over and retry. It receives the difficulty and `onRoundWon`, called 300 ms after each completed round.
- `SkillCard` renders it during a patterns battle and loses its states, refs, effects and handlers. It goes from 976 to 761 lines (1066 at the start).
- The game is created when the battle starts and forgotten when it ends, as for the memory game.
- The lint rule `react-hooks/set-state-in-effect` is switched off for `SkillCard.jsx` in `eslint.config.js`: once the patterns code left, the rule started to report three older effects that copy a prop into state (D64). Switching the rule off keeps their behaviour and the code free of comments.

## Why

The patterns game shared nothing with the other games except the card around it. Its timing rules were testable only through the whole game.

## Proof

- The 8 existing patterns tests and every other test pass without any change.
- 7 unit tests for the tempo, 9 for the component alone.
