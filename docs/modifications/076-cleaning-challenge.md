# 076 - The Complete! button of the cleaning skill is a component

- **Date:** 2026-11-15
- **Commit(s):** `refactor(skillcard): move the cleaning button and its parent check into a component`
- **Debt item:** D27

## What

- `CleaningChallenge` in `src/components/skills/games/` shows the Complete! button and asks the parent for the code before it completes.
- `SkillCard` no longer holds the state of the parent check, nor its callback.

## Behaviour kept

Same button, same code, same result: the battle gets the right answer once the parent is verified. The check is a portal, so its place on the screen does not change.

## Proof

- 4 unit tests for `CleaningChallenge`, the cleaning flow tests pass unchanged.
- `SkillCard.jsx` goes from 325 to about 300 lines.
