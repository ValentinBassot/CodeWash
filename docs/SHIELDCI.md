# ShieldCI on the mirror

[ShieldCI](https://github.com/Richonn/ShieldCI) is a GitHub Action that detects the stack of a repository, generates hardened DevSecOps workflows (lint, tests, Gitleaks for secrets, SAST, Scorecard) and opens a pull request with them. The Epitech repository cannot run actions (organization billing), so it runs on the private mirror `ValentinBassot/CodeWash`.

The workflow is `.github/workflows/shieldci.yml`. It runs only by hand (`workflow_dispatch`), pinned to the commit of ShieldCI `v1.14.0` (`ab5388255e0c2f860312ccc1b0ea8d9a025aafe9`) because the action receives a token that can write to the repository: update the pin on purpose, after reading the release, never to a moving tag.

Settings chosen for CodeWash: `language: node`, no Docker and no Kubernetes (the game ships as a web build and an Electron app, not as an image), Trivy off because there is no image to scan, Gitleaks on, SAST on with `sast-tool: semgrep` because CodeQL needs GitHub Advanced Security on a private repository.

## Create the token

ShieldCI writes files under `.github/workflows/`, which the built-in `GITHUB_TOKEN` is not allowed to do. It needs a personal access token (PAT) stored as the secret `GH_TOKEN` of the mirror.

1. On GitHub, open Settings of your account, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.
2. Name: `shieldci-codewash`. Expiration: 7 days (the shortest that covers the work, renew if needed).
3. Resource owner: your account. Repository access: Only select repositories, then `ValentinBassot/CodeWash`. Nothing else.
4. Repository permissions: Contents Read and write, Pull requests Read and write, Workflows Read and write. Metadata Read-only is added automatically. Leave everything else on No access.
5. Generate the token and copy it once. Never paste it in a chat, a commit, an issue or a file of the project.
6. Store it as the secret, from a terminal, without the token appearing in the command: `gh secret set GH_TOKEN -R ValentinBassot/CodeWash` then paste the token at the prompt. Or in the browser: the mirror, Settings, Secrets and variables, Actions, New repository secret, name `GH_TOKEN`.
7. A classic token also works: scopes `repo` and `workflow`. It is wider (every repository of the account), so prefer the fine-grained one.

When the work is done, delete the token (Settings, Developer settings) and the secret.

## Run it

1. The workflow file must be on the default branch of the mirror for GitHub to list it. The mirror default branch is `main`, which only holds the first commit: make `develop` the default branch with `gh repo edit ValentinBassot/CodeWash --default-branch develop`.
2. Push the branch holding this file to the mirror and merge it into `develop` there.
3. Open the Actions tab, choose ShieldCI, Run workflow, keep `dry-run` ticked. The generated files appear in the job summary and nothing is written to the repository.
4. Read them against the hand-written `.github/workflows/ci.yml`: keep ShieldCI Gitleaks and Scorecard if they add something, drop what duplicates the existing jobs.
5. To let ShieldCI open the pull request, run it again with `dry-run` unticked. It creates the branch `shieldci/generated-workflows` and a pull request titled `[ShieldCI] Add CI/CD DevSecOps pipeline`. Review it like any pull request before merging.

## Limits

- A missing or expired `GH_TOKEN` makes the job fail at the start.
- The action was not run for this note: the settings come from its README and `action.yml`, not from a run.
- Pull requests opened by the token do not trigger other workflows of the repository.
