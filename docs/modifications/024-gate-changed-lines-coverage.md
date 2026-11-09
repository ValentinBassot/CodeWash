# 024 - Coverage gate on changed lines

- **Date:** 2026-11-09
- **Commit(s):** `ci: gate the coverage of changed lines`
- **Debt item:** D01 (task "Gate de couverture sur le diff")

## What

- `scripts/diff-coverage.mjs` (`npm run coverage:diff -- <base>`, default `origin/develop`): compares `git diff --unified=0 <base>...HEAD` with `coverage/lcov.info`. In each hunk, new lines replacing removed lines are "modified", the extra ones are "added". Only executable lines count. Fails below 100 % of added lines or 80 % of modified lines, and lists the uncovered lines.
- CI: on every pull request, after the tests, against the base branch of the pull request (`fetch-depth: 0` so the base is available).

## Why

The subject requires every added line to be covered and at least 80 % of modified lines. Global thresholds cannot check that: a pull request could add untested code to a well-covered file.

## Proof

- `scripts/diff-coverage.test.mjs`: 10 tests (lcov parsing, added versus modified, deleted and non-source files, uncovered list, thresholds, nothing changed, the printed report, the command line with a missing lcov file, the base from the command line then `DIFF_BASE`), the first 7 written before the script and seen failing first.
- The command line takes its arguments, environment, lcov path and output as parameters, so it is tested for real instead of being left out: the script passes its own gate.
- On this branch against `origin/develop`: added lines 221/221 (100 %), modified lines 234/271 (86 %). The first run found 26 uncovered added lines: lines split by the Prettier reformat, covered since by 022, and one unreachable line removed by 023.
