# Runbook

How to run, build, test and repair Level Up RPG (CodeWash). Every command below is a script of `package.json` or a file of this repository.

## Requirements

- Node 20 or newer and npm 10 or newer (Node 22 LTS is recommended, see `.nvmrc`).
- Git.

`npm run doctor` checks the versions and warns about `ELECTRON_RUN_AS_NODE`. `npm ci` installs the exact locked dependencies.

```bash
npm run doctor
npm ci
```

Optional settings go in `.env`, created with `cp .env.example .env` (see the Configuration section of the [README](../README.md)).

## Run

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload on http://localhost:5173, to open in a browser |
| `npm start` | Builds, then opens the desktop app (Electron) |
| `npm run start:windows` | From WSL only: builds, then opens a Windows Electron window instead of the WSLg one. The Windows Electron is downloaded once into `%LOCALAPPDATA%\CodeWash` |
| `npm run start:native` | Builds, then picks the best way to open the game: a Chrome or Edge application window if one is installed, else the Windows Electron from WSL, else Electron |
| `npm run start:browser` | Builds, serves `dist` on http://localhost:4173 and opens it in a Chrome or Edge application window. When the window closes, the server stops |

Voice recognition works only in Chrome or Edge: use `npm run start:browser` or `npm run start:native` to play the Reading game with the voice. In Electron the player types the word instead.

## Build

| Command | Result |
|---|---|
| `npm run build` | The web bundle in `dist/` |
| `npm run electron:build` | The Windows portable `release/LevelUpRPG-Portable.exe`. Run it on Windows; CI builds it too (job `windows-build`) and uploads it as an artifact |

## Test

| Command | What it does |
|---|---|
| `npm test` | Runs every test once (Vitest) |
| `npm run test:watch` | Re-runs the tests when a file changes |
| `npm run test:coverage` | Runs the tests with the coverage thresholds of `vite.config.js`; the report is in `coverage/` |
| `npm run coverage:diff -- origin/develop` | Checks the coverage of the lines changed against a base branch (run `npm run test:coverage` first) |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier check (`npm run format` rewrites the files) |

The list of gates is in [QUALITY_GATES.md](QUALITY_GATES.md).

## Troubleshooting

### The microphone is blocked

- The Electron app allows the microphone itself, so a refusal comes from the system. At start it opens the system privacy page by itself on Windows and macOS (`electron/microphoneSettings.cjs`), and the game shows a notice. Allow the microphone, then reopen the game.
- Windows: Settings, Privacy and security, Microphone. Turn on "Microphone access" and "Let desktop apps access your microphone".
- macOS: System Settings, Privacy and Security, Microphone. Turn on the game (Electron).
- `npm start` under WSL runs inside WSL, which usually has no microphone. Use `npm run start:windows` or `npm run start:browser`.
- In a Chrome or Edge window (`start:browser`), the browser asks the first time. If it was refused, allow the microphone for `localhost:4173` in the browser's site permissions.

### The voice fails in Electron with the error `network`

The speech recognition of Chromium sends the sound to a Google service that needs a key, which Electron does not have. The microphone works, the service does not. Use `npm run start:browser`, or `npm run start:native` (it opens Chrome or Edge when it finds one). In Electron, type the word in the box under the microphone button. Details: [note 096](modifications/096-start-in-browser.md) and the debt item D67 in [DEBT.md](DEBT.md).

### "No Chrome or Edge found"

`start:browser` needs Chrome or Edge: it looks through `/mnt/c` from WSL, in the Program Files folders on Windows, in `/Applications` on macOS and in the PATH on Linux (`google-chrome`, `chromium` or `microsoft-edge`). Install one of them, or use `npm start`.

### Port 4173 is busy

The command prints `Cannot serve the game on port 4173: ...`. Another copy of the game is probably still open: close its window, which stops its server. Otherwise find what holds the port: `lsof -i :4173` on Linux or macOS, `netstat -ano | findstr :4173` on Windows. The port is fixed on purpose, so that the saves of the browser window stay under one address.

### `ELECTRON_RUN_AS_NODE` is set (VS Code terminals)

Electron then runs as plain Node and crashes with `Cannot read properties of undefined (reading 'whenReady')`. `npm start`, `npm run start:windows` and `npm run start:native` clear the variable for Electron. `npm run doctor` warns when it is set. To clear it in the terminal: `unset ELECTRON_RUN_AS_NODE`.

### `npm ci` says there is no package-lock.json

npm older than 10 cannot read the `npm:rolldown-vite` alias of the lockfile. Use the npm of Node 22 (`nvm use`) or `npm install -g npm@10`. See [LAUNCH.md](LAUNCH.md).

### A save is corrupted

When the save of a profile cannot be read, the game copies the raw text into `heroSkills_v23_p<N>_corrupted` (N is the profile, 1 to 3), starts a new game for that profile and shows a notice (note 078). The normal save of the profile is `heroSkills_v23_p<N>`. Both live in the `localStorage` of the window that ran the game. A second corruption of the same profile replaces the first backup, so repair it before playing on.

## Restore a save

The saves are in the `localStorage` of the game window, so restore them from its developer tools console. Open it with F12 (or Ctrl+Shift+I) in `npm start`, `start:windows` and the Chrome or Edge window of `start:browser`. The packaged `.exe` blocks these shortcuts. Replace `1` by the profile number.

1. Read the backup: `copy(localStorage.getItem('heroSkills_v23_p1_corrupted'))` copies it to the clipboard.
2. Paste it into a text editor and repair the JSON by hand (a missing bracket or a cut end is the usual cause). `JSON.parse` must accept it.
3. Write it back: `localStorage.setItem('heroSkills_v23_p1', '<the repaired JSON>')`, then close and reopen the game.

The backup is the text that failed to load: writing it back without repairing it gives the same notice again. To keep a copy of everything before trying, close the game and copy the browser profile folder of `start:browser`: `%LOCALAPPDATA%\CodeWash\browser` on Windows and WSL, `~/.codewash/browser` on macOS and Linux (`profileDirectory` in `scripts/run-browser.mjs`).

## When the CI fails

CI runs on the mirror: https://github.com/ValentinBassot/CodeWash/actions

1. Open the red run, then the red job (`quality` or `sast`) and the red step. The step name tells which gate failed.
2. Reproduce it on your machine with the command of [QUALITY_GATES.md](QUALITY_GATES.md).
3. Fix the cause, then push again. The jobs run again by themselves.

| Red step | Usual cause | Fix |
|---|---|---|
| Environment | Node or npm too old | `nvm use`, see above |
| Lint and static analysis | An ESLint error | `npm run lint`, fix what it names |
| Format check | A file is not formatted | `npm run format`, then commit |
| Tests and coverage gates | A failing test, or a coverage threshold | `npm run test:coverage`; the table shows the files under their threshold |
| Coverage of changed lines | New lines without a test | `npm run test:coverage` then `npm run coverage:diff -- origin/develop`; it lists each `file:line` not covered; add the test |
| Build | `vite build` fails | `npm run build` |
| SAST (`sast` job) | Semgrep found a problem | Run the Semgrep command of QUALITY_GATES.md; fix the code it points to |
| `windows-build` | The portable `.exe` does not build | Read the log of the job; reproduce with `npm run electron:build` on Windows |

The Actions page also has "Re-run failed jobs", useful when the failure came from the network (a download or the Semgrep registry) and not from the code.
