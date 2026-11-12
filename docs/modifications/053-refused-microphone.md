# 053 - A refused microphone no longer restarts in a loop

- **Date:** 2026-11-12
- **Commit(s):** `fix(reading): stop restarting speech recognition when the microphone is refused`
- **Debt item:** D57 (found by opening the reading game in the real app)

## What

- When speech recognition reports `not-allowed`, `App` remembers it and does not restart the session when it ends.
- The card keeps showing "Mic permission denied". Pressing the microphone button tries again.

## Why

During a reading battle, a session that ends is restarted after 100 ms, so that listening never stops. With a refused microphone the session ends at once, so it was restarted about ten times per second for the whole battle, and the message was replaced before the player could read it.

## Found on the way

At phone width (390 px) the top buttons cover the title and the skill buttons are off screen (D56, P3: the game targets tablets and desktops).

## Proof

- 2 App tests written first and seen failing: no restart after a refusal, and the microphone button tries again.
- In the real game with a refused microphone: about 15 errors in 1.5 seconds before the fix, 1 error in 3 seconds after it, and the message stays.
- Whole suite passes.
