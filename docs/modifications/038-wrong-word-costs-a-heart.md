# 038 - A wrong word costs a heart in the writing game

- **Date:** 2026-11-10
- **Commit(s):** `fix(writing): make a wrong word cost a heart like a wrong answer`
- **Debt item:** D23

## What

When the spelled word is complete and wrong, the writing game now reports it to `App` (`onMathSubmit('WRONG')`), like the math game does.

## Why

A wrong word only shook the boxes: it never cost a heart and never healed a boss, while a wrong answer does both in math and reading. A child could type random letters forever without consequence, which defeats the purpose of the exercise and made writing the only mini-game without a risk of losing.

## Proof

- The `KNOWN DEBT D23` test is replaced by tests of the expected behavior, seen failing first: nine wrong words leave the player alive, the tenth kills them; against a boss (level 20), a wrong word heals the boss back to full instead.
- Whole suite passes.
