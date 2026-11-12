# 051 - The browser tab shows the name of the game

- **Date:** 2026-11-12
- **Commit(s):** `fix(ui): title the page with the name of the game`
- **Debt item:** D55

## What

`index.html`: the title goes from `eliott-rpg-game` to `Level Up RPG`, the product name already used by the desktop build (`package.json`, `productName`).

## Why

The tab, the bookmarks and the browser history showed the technical package name.

## Proof

Checked in the running game: `document.title` is `Level Up RPG`.
