# 130 - ShieldCI can generate the pipelines on the mirror

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none (mid-term: Continuous Quality)

## What

`.github/workflows/shieldci.yml` runs the ShieldCI action by hand on the private mirror, in dry-run by default, with the settings of CodeWash: Node, no Docker, Gitleaks and SAST (Semgrep). `docs/SHIELDCI.md` gives the steps: the fine-grained token to create and store as the secret `GH_TOKEN`, making `develop` the default branch of the mirror, running it, reading the result and opening the pull request.

## Why

The Epitech repository cannot run actions, and the team chose ShieldCI to generate the DevSecOps pipelines on a mirror. The action needs a personal access token because the built-in token cannot write to `.github/workflows/`.

## Limits

- The action was never run for this note: the settings come from its README and `action.yml`.
- It is pinned to the commit of v1.14.0, not to the moving `v1` tag, because it receives a token that can write to the repository.

## Proof

- The workflow file is valid YAML and Prettier accepts it.
- The inputs match the `action.yml` of ShieldCI v1.14.0 read on GitHub.
