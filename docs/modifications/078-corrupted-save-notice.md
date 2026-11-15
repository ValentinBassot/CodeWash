# 078 - A corrupted save is no longer replaced in silence

- **Date:** 2026-11-15
- **Commit(s):** `fix(persistence): keep a backup of a corrupted save and tell the player`
- **Debt item:** D28

## What

- When the save of a profile cannot be read, the raw text is first copied to `heroSkills_v23_p<N>_corrupted`, then a new game starts, as before.
- `loadProfile` flags the result with `problem: 'corrupted'` and logs an error instead of a warning.
- `useProfiles` gives `saveProblem` and `dismissSaveProblem`, for the opening profile and for a profile switched to.
- `SaveProblemNotice` shows an alert with an OK button.

## Why

The new game was saved over the old one at once, so a bug or a bad write destroyed a child's progress without a word.

## Behaviour kept

Readable saves load as before. A new player sees no notice.

## Proof

- The two tests that froze the silent behaviour (KNOWN DEBT D28) now check the backup, the error and the notice.
- 7 new tests, 527 in total.
