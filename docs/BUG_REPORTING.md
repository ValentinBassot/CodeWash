# Bug reporting

The bug button (bottom right of the game) opens the bug report drawer. A player describes the problem, attaches what helps, and the game opens a GitHub issue for the team. Tickets are kept on the device so a report is never lost, even offline.

## What a report holds

| Part | Where it comes from | How it travels |
|---|---|---|
| Title, description, category | The form | In the issue |
| Contact of the reporter (optional) | The form | In the e-mail (one line at the end of the body) and the downloaded report only, never in the public issue |
| Date, app version, runtime (browser or Electron), language, window size | The game | In the issue |
| Error log | `src/io/errorLog.js`: the last 100 errors of the page (window errors, unhandled promise rejections, `console.error`) with date, message and stack | The last 20 go in the issue, cleaned (see below) and fewer if the link is too long. All of them, raw, in the downloaded report |
| Save summary | Number of profiles with a save, themes, unreadable saves. No profile name, level or win count | In the issue |
| Screenshot | Screen capture (`getDisplayMedia`, stopped after 10 seconds if no image comes) or an image chosen from the files | In the downloaded report only. GitHub cannot receive a file through a link: drag the image into the issue by hand, after checking that it shows nothing private (the issue is public) |
| Game files | The save of the three profiles as a JSON file (button "Download the game file") | Never sent for the player: downloaded, then added by hand. It holds profile names and complete saves: check it before adding it to a public issue. The full report holds it too |

## Privacy

- The public issue never holds the e-mail of the reporter, the profile names, the levels or the win counts.
- The error log is cleaned before it goes in the issue or in the e-mail, on a best-effort basis: text between quotes (single, double, backtick) is replaced by `[removed]` (a JSON error quotes a piece of the save), the text after the first `...` is cut, absolute paths (`file:///C:/Users/<name>/...`, `/home/<name>/...`, `http://host/...`) are reduced to the file name, and each line is limited to 200 characters. Do not rely on it for secrets: a message can still hold personal text without quotes. The downloaded report keeps the raw log.
- **The full report is private.** It holds the profile names, the complete saves, the e-mail of the reporter and the screenshot. The drawer says so next to the button and the file says so in its `privacy` field. Send it to the team only, never attach it to a public issue.

## How it works

1. The player fills the form and presses "Create the GitHub issue".
2. The ticket is saved on the device (`bugTickets_v1`, the last 20 tickets) with the state "Not sent yet".
3. Two ways to create the issue, chosen by the presence of a token:
    - No token (default): the game opens `https://github.com/<repo>/issues/new?title=...&body=...` in the browser. The player presses "Submit new issue" there. The ticket becomes "GitHub page opened". The link of the issue is not known to the game: the player can paste it in the ticket (the number is checked against the repository).
    - Token saved in the drawer ("Advanced"): the game calls `POST /repos/<repo>/issues` itself. The ticket becomes "Issue created" and keeps the link and the number.
4. Failures (no network, token refused, repository not found, rate limit...) show a clear message and keep the ticket. "Send again" in the ticket list retries.
5. Offline (`navigator.onLine` is false): nothing is sent, the ticket stays "Not sent yet".

Fallbacks that need no GitHub account:

- "Send by e-mail" opens a `mailto:` to the configured contact with the report in the body (kept short for mail programs).
- "Download the full report" saves one JSON file with the ticket, the whole error log, the Markdown of the issue, the screenshot and the game file. Send it by any channel.

## Configuration

Both values are read at build time from `.env` (see `.env.example`), validated in `src/config.js`. A wrong value stops the game with a clear message.

```
VITE_BUG_REPORT_EMAIL=support@example.com
VITE_BUG_REPORT_REPO=ValentinBassot/CodeWash
```

- `VITE_BUG_REPORT_EMAIL`: the contact shown in the drawer and used by "Send by e-mail". Empty: no contact shown, no e-mail button.
- `VITE_BUG_REPORT_REPO`: `owner/name` (letters, digits, `_`, `.`, `-`; `.` and `..` alone are refused) of the repository that receives the issues. Empty: the drawer says no repository is configured and the issue button is disabled (the download still works).

**Never put a token in a `VITE_` variable or in the repository.** Everything `VITE_` ends up in the public bundle. The optional token is pasted by the player in the drawer and stays in the local storage of that device (`bugReportGithubToken_v1`). It is never in the build, never in a ticket, never in the error log, never in a test.

### Token (optional)

Create a fine-grained personal access token on GitHub, limited to the one repository, with the permission "Issues: Read and write" and nothing else. Paste it in "Advanced: create issues from the game". Remove it from the same place. Anyone who can use the device can read the local storage: use a token that can only write issues, and revoke it on GitHub when it is no longer needed.

## Test the reception, step by step

1. Put the repository in `.env`: `VITE_BUG_REPORT_REPO=<owner>/<name>` (a repository where you can create issues), then `npm run dev` (or `npm start`).
2. Click the bug button, fill a title and a description, choose a category.
3. Press "Create the GitHub issue". GitHub opens with the form filled in.
4. Press "Submit new issue" on GitHub. The issue appears in the Issues tab of the repository: the title is the one typed, the body holds the description, the details, the save summary and the error log.
5. Note the number of the issue (`#12` in the title on GitHub and in its address). Back in the drawer, the ticket is "GitHub page opened": paste the address of the issue in the ticket and press "Save the link". The ticket now shows "Issue #12" with a link.
6. To see errors in the log: open the browser console and run `setTimeout(() => { throw new Error('test error') })`, then create another ticket. The issue lists `window: test error`.
7. With a token: paste it in "Advanced", create a ticket. No GitHub page opens, the message says "The issue #N was created." and the ticket shows the link.
8. Offline: turn the network off in the developer tools, press create. The message says you are offline and the ticket stays "Not sent yet". Turn the network on and press "Send again".
9. E-mail: set `VITE_BUG_REPORT_EMAIL`, press "Send by e-mail": the mail program opens with the report.

## Limits

- No automatic attachment: a link cannot carry a file. Screenshots and the game file are downloaded or kept in the full report, and added by hand.
- Link length: GitHub accepts about 8,000 characters in an address. The game keeps the link under 7,000: it drops the oldest errors first, then cuts the description (on whole characters, never in the middle of an emoji), and says it in the issue ("The log was cut...") and in the drawer. The downloaded report is never cut. If a link cannot be built or opened, the drawer says so and keeps the ticket.
- With the link, the issue is created by the player's own GitHub account, so the player needs one. With a token, the issue is created by the owner of the token.
- Without a token the game cannot know the number of the issue: the player pastes the link.
- In the Electron app, the screen capture may be refused by the system or by Electron (it needs a handler in the main process, not done here): the drawer then asks to choose an image file. Links open in a new Electron window, not in the default browser.
- The real GitHub API was not called by the tests: they use a replaceable transport (`src/io/github.js`). Do the step-by-step test above once with a real repository.
- All the texts of the drawer are in `src/constants/bugReportTexts.js`, in English, ready to be translated. The headings of the issue are in the same file (`ISSUE_TEXTS`).

## Where is the code

| File | Role |
|---|---|
| `src/io/errorLog.js` | Circular buffer of errors, installed by `App` at start |
| `src/domain/ticket.js` | Validation, ticket, issue Markdown, links that fit, report and save file |
| `src/io/github.js` | `createIssue` with a replaceable transport |
| `src/io/screenshot.js`, `src/io/download.js`, `src/io/environment.js` | Capture, file download, environment and links, each replaceable in tests |
| `src/persistence/profileStorage.js` | Keys `bugTickets_v1` and `bugReportGithubToken_v1`, tickets, token, save files |
| `src/components/drawers/BugReportDrawer.jsx` | The drawer (form, attachments, tickets, token) |
