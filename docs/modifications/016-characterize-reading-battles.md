# 016 - Characterization tests of the reading battles

- **Date:** 2026-11-08
- **Commit(s):** `test: characterize reading battles and the microphone`
- **Debt item:** D01 (pins D31)

## What

`src/App.reading.test.jsx`: 8 tests with a fake `webkitSpeechRecognition` that can hear a sentence or end on its own, like the browser does after a silence:
- without speech recognition: a 3-letter word is shown and the microphone says it is not available;
- listening starts in English as soon as the battle starts;
- the word read aloud deals 12 damage, whatever the case and punctuation; five words defeat the mob;
- a wrong word costs a heart (ten kill the player), a single letter is ignored as noise;
- the microphone button stops listening.

Coverage floors raised to 70 % of lines.

## Why

Reading depends on the microphone, an I/O hard-wired in `App` (D19) and the slowest part of the game (D39). D31 is now a fact: when the browser ends the session, `onend` reads `battlingSkillId` from the render where the battle started, when it was still `null`, so listening never restarts; `recognitionRef` stays set, so pressing the button only logs "Already initialized" and does nothing.

## Proof

- `npm run test:coverage`: 155 tests pass, global coverage 71.6 % of lines, reading tests stable over 2 runs.
- Mutation check by hand: 4 changes (noise threshold, forced restart, no `stop()`, other language) all make a test fail. Two tests were tightened first: the noise test no longer hides behind ten wrong words, the stop test checks that `stop()` was called.
