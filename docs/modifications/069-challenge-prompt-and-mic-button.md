# 069 - The challenge box and the microphone button are components

- **Date:** 2026-11-13
- **Commit(s):** `refactor(reading): move the challenge box and the microphone button out of SkillCard`
- **Debt item:** D27 (fourth step)

## What

- `src/components/skills/games/ChallengePrompt.jsx`: the box above the answer. It shows the pictures of a writing challenge, or the word or question of the others, and for reading the text of the microphone and the red flash when a wrong word is heard.
- `src/components/skills/games/MicButton.jsx`: the "Tap to Speak" button of the reading game.
- `SkillCard` renders them and loses a state, two refs and an effect. It goes from 651 to 568 lines (1066 at the start).
- The red flash no longer needs an effect that copies the heard text into a state: it is decided while the box is drawn, and a timer ends it.
- `readingWordRef` was assigned and never read: it is gone.

## Why

The reading game was spread over three places of `SkillCard`: the effect that judged what was heard, the word box and the button.

## Behaviour kept on purpose

A wrong word heard twice in a row, with only the "Listening..." text between the two, flashes once. The old code remembered the last judged word the same way, and a test now pins it.

## Proof

- The existing tests pass without any change, the 15 reading tests included.
- 11 unit tests for the box, 3 for the button.
