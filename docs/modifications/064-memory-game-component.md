# 064 - The memory game is its own component

- **Date:** 2026-11-12
- **Commit(s):** `refactor(memory): move the memory game out of SkillCard`
- **Debt item:** D27 (first step)

## What

- `src/domain/memory.js`: `dealMemoryCards(faces, pairs)` picks the pairs and shuffles the cards.
- `src/components/skills/games/MemoryGame.jsx`: the cards, the flips, the pair check and the win. It receives the number of pairs, the grid width, the card back and `onWin`.
- `SkillCard` renders it during a memory battle. It loses five states, one ref, one effect and one handler: 1066 to 972 lines.
- The game is dealt when the component appears and forgotten when it leaves, so the code that reset it by hand at the end of a battle is gone.

## Why

`SkillCard` holds every mini-game in one function. The memory game shared nothing with the others except the card around it.

## Found on the way

Nothing counts a memory game finished without a mismatch, so the "Perfectionist" achievement can never be unlocked (D62).

## Proof

- The existing tests pass without any change, the 6 memory tests of the whole game included.
- 2 unit tests for the deal, 5 for the component alone.
