# 103 - The game can create a GitHub issue

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): create the GitHub issue from the game`
- **Debt item:** D37

## What

- `src/io/github.js`: `createIssue` calls `POST /repos/{repo}/issues` with the token, behind a replaceable transport, and returns `ok` with the number and link, or a reason (network, unauthorized, forbidden, notFound, issuesDisabled, invalid, rateLimited, failed).
- Without a token, the drawer opens the prefilled new issue page instead (`openExternal`, in `src/io/environment.js`).
- `VITE_BUG_REPORT_REPO` (`owner/name`) is validated in `src/config.js` and listed in `.env.example`.

## Why

The team does not know if the repository will accept an API token: both ways exist, the link is the default.

## Proof

`src/io/github.test.js` (13 tests), `src/io/environment.test.js` (8), `src/config.test.js` (1 new test, 2 extended). The real GitHub API was not called.
