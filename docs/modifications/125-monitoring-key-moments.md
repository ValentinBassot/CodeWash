# 125 - The battle and the speech hooks record key moments

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none

## What

- `useBattleSession`: `battle-start` (with the skill), `battle-end` with the outcome `left`, `death` or `completed` (memory game).
- `useVoiceListener`: `speech-error` with the reason for each real speech error (silences are not recorded), and `mic-denied` for `not-allowed`.
- One call per place. The behaviour of the hooks does not change.

## Why

The battle start and end drive the frame sampler, and the speech errors are the most frequent real-world failures of the game.

## Proof

- New `useBattleSession.test.jsx` (5 tests) and 3 tests in `useVoiceListener.test.js`. The existing tests pass.
- `useBattleSession` records `battle-end` (`left`) when it goes away during a battle, so the frame loop stops. Nothing is recorded outside a battle, also under StrictMode.
