# 036 - The microphone restarts when the browser ends the session

- **Date:** 2026-11-10
- **Commit(s):** `fix(reading): restart listening when the browser ends the session`
- **Debt item:** D31

## What

- `App` keeps the skill being fought in a ref (`battlingSkillIdRef`), updated on every change.
- When a recognition session ends, `onend` reads that ref instead of the value captured when the battle started, and only restarts if the session that ended is still the current one.

## Why

Browsers stop speech recognition after a silence. `onend` read `battlingSkillId` from the render where the battle started, when it was still `null`, so it never restarted; the recognition also stayed referenced, so the microphone button only logged "Already initialized". A child had to leave the battle and come back to be heard again. The original comment even called the stale read intentional.

The identity check matters: without it, turning the microphone off on purpose during a battle would restart it 100 ms later.

## Proof

- The `KNOWN DEBT D31` test is replaced by tests of the expected behavior: after the browser ends the session, listening starts again; a word read aloud after the restart still counts; the button starts listening again after a manual stop. The first one failed before the fix.
- The "button stops listening" test now also checks that nothing restarts 500 ms later.
- Mutation check by hand: removing the identity check breaks the stop test; going back to the captured value breaks the restart test.
- Whole suite passes twice in a row (249 tests).

## Found on the way

Under parallel coverage, the slowest App test went over the 20 s timeout. The same test takes as long on the commit before phase 2, so it is not a regression: tests that mount the whole App are slow (4 to 8 s each). The timeout is raised to 30 s and the issue is recorded as D47, to be fixed in phase 3 when `App` is split into smaller, testable parts.
