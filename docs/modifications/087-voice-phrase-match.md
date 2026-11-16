# 087 - A word said inside a sentence counts, and what is heard is shown

- **Date:** 2026-11-16
- **Commit(s):** `fix(reading): accept the word inside a sentence and show what is being said`
- **Debt item:** none (reported by the user)

## What

- `judgeSpokenWord` looks at every word of what was said: the answer or one of its homophones anywhere in the sentence is correct. A longer word that only contains it ("catalog" for "cat") is not.
- Speech recognition now gives interim results: the text is shown while it is said. Only the final text is judged, so a half sentence never costs a heart nor flashes red.
- After a right answer the sentence stays shown for 2 seconds, then disappears.
- Errors of the speech service are shown instead of staying silent: service not allowed, no microphone, service unreachable. They stop the automatic restarts like a refused microphone.

## Why

The word had to be said alone: "I think it is cat" counted as wrong, and the screen kept "Listening..." until the end of the sentence.

## Limit

In the Electron app the speech service of the browser may be unreachable (it needs the online service of the browser). The message "Speech service unreachable" now says so instead of failing in silence. Not tested on a real microphone: the speech engine was replaced by a fake one in the browser.

## Proof

- Chromium with a fake speech engine: an interim "i think" is shown, then the final "I think it is sun" gives 12 damage and shows the sentence, with no red flash.
- 9 new tests (domain, hook, prompt, App). 552 tests pass.
