# 097 - A security scan in the CI and the list of quality gates

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none (lost point of the mid-term: "No SAST available")

## What

- `.github/workflows/ci.yml` has a new job `sast`: it installs Semgrep OSS 1.187.0 with pip and runs `semgrep scan --config p/javascript --config p/react --error --metrics=off`. Any finding fails the job. No secret and no token.
- `windows-build` now needs `quality` and `sast`, so nothing is built or released while the scan is red.
- The workflow gets `permissions: contents: read` at the top; only `release` asks for more.
- `docs/QUALITY_GATES.md` lists every gate, the command that reproduces it locally, and how to require the checks `quality` and `sast` with branch protection on the mirror.

## Why

- The mid-term report said "No SAST available". CodeQL is not an option: it needs GitHub Advanced Security, which a private repository on a free plan does not have, and the mirror is private. Semgrep OSS runs anywhere with no account.
- The gates already failed the job on a failing test, lint, format, coverage threshold or coverage of the diff (each is a step of one job, with no `continue-on-error`). They were not written down, and nothing said how to make them block a merge.

## Limits

- The workflow was not run on GitHub from here. Semgrep 1.187.0 was run locally with the same command: 0 findings, 68 rules on 140 files.
- Branch protection on a private repository needs a paid plan, so it may be refused on the mirror (see the document). Without it, a red check does not lock the merge button.
- The registry rule packs are downloaded at each run: a registry outage turns the job red without a finding (re-run it).

## Proof

- `semgrep scan --config p/javascript --config p/react --error --metrics=off` on this branch: "Ran 68 rules on 140 files: 0 findings".
- `npx prettier --check .` accepts the workflow.
