# 056 - A word heard with a space around it still counts

- **Date:** 2026-11-12
- **Commit(s):** `fix(reading): ignore the spaces around a heard word`
- **Debt item:** D59 (found while testing the voice hook)

## What

`normalizeSpeech` removes the spaces at both ends of what was heard, after removing the punctuation. Inner spaces stay (`I LOVE MOM`).

## Why

The heard text was compared to the word as it came. With a space before or after it, the right word was judged wrong and cost a heart. In a continuous session, browsers commonly return the results after the first one with a leading space, so this could hit every word but the first.

## Not verified

This machine has no microphone: the leading space was not observed in a real session here. The fix is safe either way, since a word never starts or ends with a space.

## Proof

- 2 tests written first and seen failing: one for `normalizeSpeech`, one App test where the right word heard with a leading space deals damage and costs nothing.
- Whole suite passes.
