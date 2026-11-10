# 037 - Subtractions never have a negative answer

- **Date:** 2026-11-10
- **Commit(s):** `fix(math): never ask a subtraction with a negative answer`
- **Debt item:** D20

## What

In `generateMathProblem`, when the first number of a subtraction is 0, the second one is 0 too (`0 - 0 = ?`). Otherwise nothing changes: the second number is still drawn between 1 and the first.

## Why

From difficulty 3, numbers start at 0. With a first number of 0, the second was always 1, so the game asked `0 - 1 = ?` and expected `-1`, an answer a child at that level is not taught and that the number input can hardly accept. The original comment claimed the second number was "always less than or equal" to the first, which was false exactly in that case.

## Proof

- The `KNOWN DEBT D20` test is replaced by tests of the expected behavior, seen failing first: `0 - 0 = ?` with answer `0`; a positive number still loses at least 1; 2,000 problems of each difficulty from 3 to 5 have no negative answer (this one also failed before the fix, so the bug did happen in play).
- Whole suite passes.
