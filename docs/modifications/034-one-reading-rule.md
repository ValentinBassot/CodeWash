# 034 - One rule to judge a spoken word

- **Date:** 2026-11-10
- **Commit(s):** `refactor(domain): judge spoken words in one place`
- **Debt item:** D46 (found while preparing D19)

## What

- `src/domain/reading.js`: `normalizeSpeech(transcript)` (upper case, punctuation removed) and `judgeSpokenWord(spoken, answer)`, which returns `correct` (the word or one of its homophones), `wrong` (another word of 2 letters or more) or `noise`.
- `App` (damage after speech recognition) and `SkillCard` (red shake on a wrong word) both use it; `MIN_SPOKEN_TEXT_LENGTH` is no longer defined twice.

## Why

The same rule was written twice. If one copy changed without the other, the card could shake as wrong while the game counted a hit, or the reverse. Found while reading the speech code for D19, added to the register as D46.

## Proof

- `src/domain/reading.test.js`: 6 tests written first and seen failing (punctuation, case, spaces and digits kept, exact word, homophones including single letters and digits, wrong word, noise).
- The reading battle tests (016) pass unchanged, and the whole suite passes.
