# 047 - Every read and write of the save goes through the persistence module

- **Date:** 2026-11-11
- **Commit(s):** `refactor(persistence): read and write the save through profileStorage only`
- **Debt item:** D15

## What

- `src/persistence/profileStorage.js` gains `readBorder`, `writeBorder`, `readProfileNames`, `readParentStatus`, `writeProfileSave`, `writeProfiles`, `resetProfile`, `readPhantomLastSpawn`, `writePhantomLastSpawn`, and `browserStorage` (the browser's `localStorage`).
- `App.jsx` and `PhantomEvent.jsx` call these functions and no longer touch `localStorage` or the key names.
- ESLint forbids `localStorage` outside `profileStorage.js` and the tests.

## Why

The save was read and written in about 20 places of `App` and `PhantomEvent`, each one knowing the key names and the JSON format. Every function takes the storage as its first argument, so it is tested with a plain in-memory object, without a browser.

## Proof

- 8 unit tests for the new functions, on an in-memory storage.
- The App tests on the save format, the profile switch and the reset pass unchanged: the saved keys and values are the same.
- Whole suite passes.
