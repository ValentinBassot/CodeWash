# Level Up RPG (CodeWash)

An educational RPG for kids, built with React 19 + Vite (rolldown-vite) and packaged as a Windows portable `.exe` with Electron.
The player levels up six skills (Reading, Math, Writing, Cleaning, Memory, Patterns) through mini-games, unlocks achievements and switches between visual themes.

This repository is the CodeWash project (Epitech B-ING-300): the code was delivered "vibe-coded" in commit `init`. Every later commit stabilises and cleans it.

## Quick start

Prerequisites: **Node.js ≥ 20 with npm ≥ 10** (Node 22 LTS recommended, see `.nvmrc`) and Git.

```bash
git clone git@github.com:EpitechBachelorPromo2028/B-ING-300-LYN-3-1-codewash-5.git
cd B-ING-300-LYN-3-1-codewash-5
npm run doctor   # checks Node/npm versions and environment traps
npm ci           # installs the exact locked dependencies
npm start        # builds the game and opens it in an Electron window
```

Works on Windows, Linux (including WSL2 with WSLg) and macOS.

## Configuration

Settings live in a `.env` file at the project root, which is not committed. Create it from the template:

```bash
cp .env.example .env
```

| Variable | Used for | Format | Default |
|---|---|---|---|
| `VITE_BUG_REPORT_EMAIL` | Contact that receives bug reports | e-mail address | none |
| `VITE_TRIVIA_API_URL` | Question source of the trivia game | `http(s)://` URL | none |

Every variable is optional. Values are read once at startup by `src/config.js`, which rejects a malformed value with an error naming the variable. Vite copies them into the bundle at build time: rebuild (`npm run build`, `npm start`) after changing `.env`. Only variables starting with `VITE_` reach the game, and they are visible in the built files, so never put a secret there.

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Checks the environment and prints a fix for each problem found |
| `npm run dev` | Starts the game in the browser with hot reload (http://localhost:5173) |
| `npm start` | Builds, then launches the desktop (Electron) version |
| `npm run start:windows` | From WSL, builds then opens the game in a native Windows window instead of WSLg |
| `npm run start:native` | Builds then opens the game natively wherever you are: a Windows window from WSL, the desktop app on macOS, Linux and Windows |
| `npm test` | Runs the test suite once (Vitest) |
| `npm run test:watch` | Re-runs the tests on every file change |
| `npm run test:coverage` | Runs the tests and writes the coverage report to `coverage/` |
| `npm run lint` | Runs ESLint |
| `npm run format` | Formats every file with Prettier |
| `npm run format:check` | Fails if a file is not formatted (used by CI) |
| `npm run build` | Builds the web bundle into `dist/` |
| `npm run electron:build` | Builds the Windows portable `.exe` into `release/` (run it on Windows, or let CI do it) |

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `develop` and `main`:

1. **quality** (Linux): `npm ci`, `npm run doctor`, `npm run lint`, `npm run format:check`, `npm run test:coverage` (fails if coverage drops below the thresholds in `vite.config.js`), `npm run build`. The coverage table is shown in the run summary and the full report is uploaded as an artifact.
2. **windows-build**: builds `LevelUpRPG-Portable.exe` and uploads it as an artifact.
3. **release**: only on a push to `main`, publishes the `.exe` as a GitHub release.

No merge on red: a failing step blocks the pull request.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm ci` says *"can only install with an existing package-lock.json"* even though it exists | npm < 10 cannot parse the `npm:rolldown-vite` alias in the lockfile | Use Node 22's npm (`nvm use`) or `npm install -g npm@10` |
| `TypeError: Cannot read properties of undefined (reading 'whenReady')` | `ELECTRON_RUN_AS_NODE=1` is set (VS Code terminals set it) | Use `npm start`, which clears it, or `unset ELECTRON_RUN_AS_NODE` |
| The Reading game does not hear you | It uses the Web Speech API (`webkitSpeechRecognition`): it needs a Chromium-based runtime and microphone permission | Use `npm run dev` in Chrome/Edge, see [docs/MICROPHONE_FEATURE.md](docs/MICROPHONE_FEATURE.md) |

The full story of how the project was first launched is in [docs/LAUNCH.md](docs/LAUNCH.md).

## Project layout

```
electron/main.cjs     Electron entry point (loads dist/index.html)
scripts/              Tooling: environment doctor, Electron launcher
src/App.jsx           Main component (state, persistence, navigation)
src/components/       UI: drawers, modals, profile, skill cards (mini-games)
src/constants/        Game data, achievements, asset paths, themes
src/utils/            Game logic helpers, achievements, sound manager
public/assets/        Images and sounds, grouped by type and theme
docs/                 Project documentation
```

## Documentation

- [docs/DEBT.md](docs/DEBT.md): technical debt register (map, metrics, items, risk matrix, plan)
- [docs/modifications/](docs/modifications/README.md): one short note per change (what, why, proof)
- [docs/adr/](docs/adr/README.md): architecture decision records (why the design is the way it is)
- [docs/LAUNCH.md](docs/LAUNCH.md): first-launch log, the problems found and how they were fixed
- [docs/MICROPHONE_FEATURE.md](docs/MICROPHONE_FEATURE.md): how voice recognition works in the Reading game
