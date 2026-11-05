# First launch log

How we got the delivered project (commit `init`) running, what broke and how it was fixed.
Environment used: Windows 11 + WSL2 (Ubuntu), Node 22.22.1, system npm 9.2.0 (Debian package), VS Code.

## 1. What the project is

| Question | Answer, and where we found it |
|---|---|
| Language / stack | JavaScript (JSX), React 19, Tailwind 4, bundled by Vite (`package.json`) |
| Bundler | `vite` is overridden by `npm:rolldown-vite@7.2.5` (`package.json` → `overrides`) |
| Desktop shell | Electron 39; entry `electron/main.cjs` loads `dist/index.html` |
| Target | Windows portable `.exe` via electron-builder (`package.json` → `build.win`) |
| Existing CI | `.github/workflows/build-exe.yml`: builds the `.exe` on Windows and creates a GitHub release on every push to `main` |
| Tests | None |
| Persistence | Browser `localStorage` (`src/App.jsx`, `src/components/PhantomEvent.jsx`) |

## 2. Problems met, in order

### P1: `npm ci` claims there is no lockfile

```
npm ERR! The `npm ci` command can only install with an existing package-lock.json
```

`package-lock.json` exists and has `lockfileVersion: 3`. With `--loglevel verbose`, the real error appears:
`TypeError: Invalid comparator: npm:rolldown-vite@7.2.5`.
npm 9.2 cannot parse the alias used in `overrides`, and it hides that behind a generic message.
npm 10.9.2 installs the same lockfile without errors (550 packages).

**Fix:** require npm ≥ 10 (`engines` in `package.json`, `.nvmrc` = 22) and detect it with `npm run doctor`.

### P2: Electron crashes on start

```
TypeError: Cannot read properties of undefined (reading 'whenReady')
    at electron/main.cjs:40
```

VS Code terminals export `ELECTRON_RUN_AS_NODE=1`. With it, the Electron binary runs as plain Node, so `require('electron').app` is `undefined`.
With the variable unset, the window opens and stays open.

**Fix:** `npm start` goes through `scripts/run-electron.mjs`, which starts Electron without that variable. `npm run doctor` warns about it.

### P3: 28 lint errors in files that are not code

The archive contained 374 macOS AppleDouble files (`._*`), created when the project was copied from a Mac to a non-Apple volume. ESLint tried to parse them.
Once they were removed, `npm run lint` reports 0 errors on the real code.

**Fix:** files deleted, `._*` added to the new `.gitignore`.

### P4: no `.gitignore`

`node_modules/`, `dist/` and `release/` could have been committed. **Fix:** `.gitignore` added.

## 3. Checks that pass after the fixes

| Check | Result |
|---|---|
| `npm run doctor` | Flags npm 9.2 and `ELECTRON_RUN_AS_NODE` on the machine above |
| `npm ci` (npm 10.9.2) | 550 packages in about 20 s |
| `npm run build` | `dist/` produced in about 1.5 s (JS 363 kB, 103 kB gzip) |
| `npm run dev` | Server answers on port 5173 |
| `npm start` | Electron window opens from a VS Code terminal |
| `npm run lint` | 0 errors |
| `npm test` | 10 tests pass |

## 4. Noticed, not fixed yet (goes to the debt register)

- `npm audit`: 31 known vulnerabilities in dependencies (1 critical, 20 high).
- `public/assets` weighs 243 MB and is shipped inside the `.exe`.
- The existing CI publishes a release on each push to `main` and runs no tests or lint.
- The package is still named `eliott-rpg-game` and the HTML title is `eliott-rpg-game`.
- `MenuDrawer_old.jsx` looks like dead code next to `MenuDrawer.jsx`.
- The bug report button opens a modal that only says "Whoa... That sucks...".
- Not verified yet: whether `webkitSpeechRecognition` works inside the packaged Electron app.
