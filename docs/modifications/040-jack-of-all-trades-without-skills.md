# 040 - "Jack of All Trades" without any skill has no tier

- **Date:** 2026-11-11
- **Commit(s):** `fix(achievements): give no tier to Jack of All Trades without skills`
- **Debt item:** D25 (adds D48)

## What

`achievements.js`: the lowest skill level is computed once (`lowestSkillLevel`) and is 0 when there is no skill. `getProgress` and `getProgressText` of "Jack of All Trades" both use it.

## Why

`Math.min()` of an empty list is `Infinity`, so with no skill the achievement reached its top tier (Mythic) and its text read "level Infinity+". The same computation was also written twice.

## Found on the way

The text "X/6 skills at level N+" counts the skills at or above the lowest level, which is always every skill, so it always says 6/6. The intended meaning is not clear (maybe the skills that reached the next tier?), so it is recorded as D48 for a decision instead of being guessed.

## Proof

- The `KNOWN DEBT D25` test is replaced by a test of the expected behavior, seen failing first: no tier, not unlocked, text "0/6 skills at level 0+".
- Whole suite passes; `achievements.js` keeps its 100 % line threshold.
