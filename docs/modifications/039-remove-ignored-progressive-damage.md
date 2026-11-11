# 039 - Remove the progressive damage the patterns game never applied

- **Date:** 2026-11-11
- **Commit(s):** `refactor(patterns): remove the progressive damage that was never applied`
- **Debt item:** D24

## What

`SkillCard` no longer computes `round × 1.5` and no longer passes it to `onMathSubmit`; a won round reports a plain win, as every other mini-game does. `App` behaves exactly as before.

## Why: removing rather than applying it

`App` always ignored this second argument, so the patterns game has always dealt the damage of the difficulty (12 at difficulty 1, 36 at difficulty 2...). Applying the "progressive" damage instead would have broken the game:
- it is an absolute number (2, 3, 5, 6, 8...), not scaled by difficulty: a difficulty-1 mob (60 HP) would need about 9 rounds instead of 5, and a difficulty-7 mob (43,740 HP) could not be beaten;
- the XP of a battle is split on the assumption of the standard damage per hit.

The code was therefore dead and misleading. If progressive damage is wanted later, it is a game-design change that has to scale with the difficulty and with the XP split, not a bug fix.

## Proof

- The `KNOWN DEBT D24` test becomes a plain test of the kept behavior (12 damage per round at difficulty 1), and a new test pins 36 damage on a 180 HP mob at difficulty 2.
- No behavior change: whole suite passes.
