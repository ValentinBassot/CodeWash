# 068 - The typed answer of the math and writing games is one component

- **Date:** 2026-11-13
- **Commit(s):** `refactor(math-writing): share one typed-answer component between the math and writing games`
- **Debt item:** D27 (third step)

## What

- `src/domain/answers.js`: `withoutSpaces`, `normalizeNumber` (digits and minus sign), `normalizeSpelling` (capitals, no spaces).
- `src/components/skills/games/TypedAnswer.jsx`: the hidden input and the boxes of the answer, for `kind="math"` or `kind="writing"`. It checks the answer as it is typed, reports a right answer with `onRight`, a wrong one of the right length with `onWrong`, shakes and locks for half a second, then starts again and gives the focus back.
- `SkillCard` renders it for both games and loses three states, one ref and one effect. It goes from 761 to 651 lines (1066 at the start).
- It empties itself when the challenge changes, without an effect.

## Why

The two games had a copy of the same 40 lines of input handling, differing only in how the typed text is cleaned, what the expected answer is and how the boxes are drawn.

## Proof

- The existing tests pass without any change, the math and writing battles included.
- 3 unit tests for the cleaning functions, 13 for the component alone.
