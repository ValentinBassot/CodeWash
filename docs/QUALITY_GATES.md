# Quality gates

A change reaches `develop` or `main` only if every gate below is green. The gates run in `.github/workflows/ci.yml` on every pull request and every push to `develop` and `main`. If a step fails, its job fails, and a failed job turns the pull request red.

CI runs on the mirror: https://github.com/ValentinBassot/CodeWash/actions

## The gates

| Gate | CI job and step | What fails it | Same check on your machine |
|---|---|---|---|
| Environment | `quality`, "Environment" | Node below 20 or npm below 10 | `npm run doctor` |
| Lint and static analysis | `quality`, "Lint and static analysis" | Any ESLint error | `npm run lint` |
| Format | `quality`, "Format check" | A file that Prettier would change | `npm run format:check` (fix with `npm run format`) |
| Tests | `quality`, "Tests and coverage gates" | A failing test | `npm test` |
| Coverage thresholds | `quality`, "Tests and coverage gates" | Coverage under a threshold of `vite.config.js` (global and per file) | `npm run test:coverage` |
| Coverage of the diff | `quality`, "Coverage of changed lines", pull requests only | Less than 100 % of the added lines or 80 % of the modified lines covered, in `src` and `scripts` (`scripts/diff-coverage.mjs`) | `npm run test:coverage`, then `npm run coverage:diff -- origin/develop` |
| Build | `quality`, "Build" | `vite build` fails | `npm run build` |
| SAST | `sast` | Semgrep finds a problem (`--error` makes any finding fail the job) | see below |

`windows-build` needs both `quality` and `sast`, and `release` needs `windows-build`: nothing is built for Windows or released while a gate is red.

## Coverage thresholds

They are in `vite.config.js`, under `test.coverage.thresholds`. Today: lines 90 %, statements 90 %, functions 85 %, branches 82 %, plus stricter values for some files (`achievementUtils.js`, `soundManager.js`, `gameData.jsx` and others). `npm run test:coverage` exits with an error when one is not met. The report is written to `coverage/` (open `coverage/index.html`).

The diff gate compares the branch with its base: `origin/develop` by default, or the base branch of the pull request in CI. Run `git fetch origin` first so that the base exists locally.

## SAST

The SAST job runs Semgrep OSS, installed with pip in the job (no account, no token, no secret):

```bash
pip install semgrep==1.187.0
semgrep scan --config p/javascript --config p/react --error --metrics=off
```

The rule packs `p/javascript` and `p/react` are downloaded from the public Semgrep registry at each run. Run the same two lines on Linux, macOS or WSL to reproduce the job. The scan covers the files tracked by git.

CodeQL was not chosen: it needs GitHub Advanced Security, which is not available on a private repository of a free plan, and the mirror is private.

Result on the day it was added (2026-11-26, Semgrep 1.187.0, run locally on the code of `develop`): 0 findings, 68 rules on 140 files.

When SAST fails, fix the code. Do not hide a finding: the project forbids comments in the code, so a `nosemgrep` comment is not an option.

## Make the gates block a merge (branch protection)

A red check only blocks a merge when branch protection requires it. On the mirror:

1. Open https://github.com/ValentinBassot/CodeWash/settings/branches.
2. Add a branch protection rule (or a ruleset) for `main`, then the same for `develop`.
3. Turn on "Require a pull request before merging".
4. Turn on "Require status checks to pass before merging" and "Require branches to be up to date before merging".
5. In the list of checks, add `quality` and `sast`. A check appears in the list only after it has run once in the last week, so open one pull request first.
6. Save.

GitHub may refuse this. Branch protection and rulesets are free for public repositories only. On a private repository, they need a paid plan (GitHub Pro, Team or Enterprise), so on a free plan the settings page shows an upgrade message instead of the rule form. This was not tried on the mirror from here: check the page above. If it is refused, there are three ways out:

- make the mirror public (the sources are not secret; check that nothing private is in the history first),
- take a paid plan for the repository,
- keep the rule by discipline: never merge a pull request whose checks are red. The checks still run and still show red or green, they just do not lock the merge button.

## When a gate fails

See "When the CI fails" in [RUNBOOK.md](RUNBOOK.md).
