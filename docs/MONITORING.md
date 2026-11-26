# Monitoring

The game watches its own health to find bugs, crashes and slow moments, and to know when to suggest a bug report. Everything stays in the browser or in Electron: nothing is sent to any server. No profile name is recorded on purpose: the details of the key moments are filtered, and error messages are cleaned (see "Privacy"). This is a best-effort cleaning, not a guarantee, so look at an exported file before sharing it.

Code: `src/monitoring/`, `src/components/ErrorBoundary.jsx`, `src/components/drawers/HealthDrawer.jsx`. All texts shown to the player: `src/constants/monitoringTexts.js`.

## What is followed

Every observation is an event with an `id`, a time `at` (from `src/domain/clock.js`, so tests can replace it) and a `type`.

| Type | Fields | Comes from |
|---|---|---|
| `error` | `errorType`, `message`, `origin` (`window` or `promise`) | `window` `error` and `unhandledrejection` events |
| `crash` | `errorType`, `message`, `componentStack` | `ErrorBoundary` when React cannot render |
| `latency` | `name`, `durationMs`, `ok` | `measure(name, operation)`, and long tasks (`name: 'longtask'`) |
| `fps` | `average`, `min`, `samples` (seconds measured) | the frame sampler, only during a battle |
| `flow` | `name`, `detail` | key moments of the app |

Key moments (`flow`): `app-start`, `profile-loaded`, `battle-start`, `battle-end`, `speech-error`, `save-corrupted`, `mic-denied`, `drawer-open`. A `detail` keeps only the keys `skillId`, `outcome`, `reason`, `drawer`, `profileId`, `difficulty`. Their values must be numbers, booleans, or short identifiers (`/^[a-z0-9_-]{1,60}$/i`); `outcome`, `drawer` and `reason` must even be one of a fixed list (`FLOW_DETAIL_VALUES` in `events.js`). Any other key or value (a profile name for example) is dropped by `buildEvent`.

## Privacy

- Error messages are free text and can quote data (a `JSON.parse` message can quote a piece of a save). Before an `error` or `crash` message is stored, shown or exported, `sanitizeMessage` removes the text between single quotes, double quotes or back quotes, cuts the message at the first `...`, drops an unclosed quote and what follows, and keeps at most 200 characters. The crash screen shows the same cleaned message.
- A message that carries personal data without quotes would still be kept. Nothing checks for that: this is why the exported file should be read before it is shared.

Texts are cut (name 60 characters, message 200, component stack 500). The collector is a bounded buffer of 500 events: the oldest ones are dropped and counted (`dropped`).

## How it works

- `installMonitoring()` installs the sensors and records `app-start`. It returns an uninstall function, and a second call does nothing. `uninstallMonitoring()` removes everything.
- The frame sampler starts on the `battle-start` event and stops on `battle-end`: it is off outside a battle. It measures each second and records one `fps` event every 10 seconds and when it stops. A window longer than 3 seconds (hidden tab) is dropped.
- Long tasks use `PerformanceObserver` when the browser supports `longtask`; otherwise nothing happens. At most one long task per second is recorded, so that a game that lags does not push the crashes and `app-start` out of the 500 events.
- Nothing in the monitoring can break the game: `record` never throws (it returns `null` if the event cannot be built or stored), a listener that throws is ignored, the sensors catch their own failures, a sensor that cannot be installed is skipped, and uninstalling removes the others even if one removal fails. If a battle is running when the game goes away, a `battle-end` (`left`) is recorded so that the frame sampler stops.
- `measure(name, operation)` times a function or a promise and gives the result back: `measure('build-skills', () => buildSkills(saved))`. Give a fixed name, never a URL or a value that comes from the player.
- Everything is replaceable in tests: the clock (`setClock`), the collector (`createCollector({ capacity, clock })`), the window, the observer class and the frame functions (options of `installMonitoring`).

## How to read the summary

`summarize(events)` gives:

- `errors.byType`: number of errors by `errorType`.
- `crashes.total` and `crashes.last`; `crashRate`: crashes divided by the sessions started (`app-start` events, at least 1). The buffer lives for one session, so it is the number of crashes of this session.
- `latency[name]`: `count`, `failures`, `p50`, `p95`, `max` in milliseconds (nearest rank). The name `longtask` collects the tasks over 50 ms of the main thread.
- `fps`: `average` (weighted by seconds measured), `min` (lowest second) and `samples`; `null` without a battle.
- `flows`: number of each key moment.

The "App health" drawer shows this summary, a status, and a button to export a JSON file (`codewash-health-YYYY-MM-DD.json`: `schema`, `exportedAt`, `dropped`, `summary`, `events`).

## When the app suggests a ticket

`shouldSuggestTicket(summary)` is true when `ticketSuggestionReasons(summary)` finds at least one reason (thresholds in `DEFAULT_THRESHOLDS`, replaceable by a second argument):

| Reason | Threshold |
|---|---|
| `crash` | at least 1 crash |
| `repeated-error` | at least 3 errors of the same type |
| `slow-operation` | an operation measured at least 3 times with p95 of 5000 ms or more |
| `low-fps` | at least 10 seconds measured with an average under 15 frames per second |

## Wiring (done at the merge)

- `src/main.jsx`: call `installMonitoring()` before rendering, and wrap `<App />` in `<ErrorBoundary>`.
- `src/App.jsx`: a state for the drawer, its overlay, `<HealthDrawer isOpen onClose onReportProblem />`, a line in the Escape handler, and the key moments `profile-loaded`, `save-corrupted`, `mic-denied`, `drawer-open`.
- Menu: a "Health" button that opens the drawer.
- Bug Reporting: the ticket can attach `exportReportJson({ events: monitor.getEvents(), dropped: monitor.getDropped() })`, and the drawer button "Report a problem" (`onReportProblem`) opens the ticket drawer when `shouldSuggestTicket` is true. The summary holds no profile name, so it can be attached as is; the player should still see what is attached.

## What is not done

- Nothing is sent to a server. There is no backend, no analytics, no third-party service.
- Nothing is kept between sessions: the buffer is in memory and is empty at each start. A crash that reloads the page loses its events (only the exported file survives).
- The network is not followed by itself: only the operations wrapped in `measure` are timed (the game has almost no network call).
- The FPS is measured only in battles, and the long tasks only where the browser supports them (Chromium: yes, Electron: yes).
- A flood of errors (an error that repeats in a loop) can still push older events, `app-start` included, out of the buffer: only the long tasks are limited. The `dropped` count in the export tells how many were lost.
- Errors inside event handlers that React catches and rethrows are seen as `window` errors; errors caught by the app itself (`try/catch`) are not seen.

## Prometheus and Grafana

Question: would Prometheus with Grafana be a good idea here? Nothing was installed or added; this is an analysis.

What it would bring:

- Curves over time and across many players, alerts, and a shared dashboard for the team.
- A standard, well known format and tooling.

What it would require:

- Prometheus pulls metrics from a server (`/metrics`). The game runs in the browser or Electron and has no backend: there is nothing to pull from. It would need a gateway that the game pushes to (for example the Prometheus Pushgateway or a small exporter service), hosted somewhere, with its own address, security, uptime and maintenance. Grafana is a second service to host.
- Pushing from the game means network calls from a children's app, and a way to tell sessions apart.
- Prometheus is designed for server counters, not for one-shot summaries of thousands of short browser sessions: the metrics would need aggregation rules (no per-player labels).

Privacy:

- The rule of the project is that nothing leaves the device, and the players are children. Any push breaks it: it needs a consent screen, a legal basis (GDPR, and the extra rules for minors), a retention rule and a privacy text. Error messages can contain unexpected text. This is a product decision, not only a technical one.

Cost with 3 days left:

- Hosting and securing two services, an exporter, consent and legal text, and tests: more than the 3 days, with a high risk, for an app that has no server today. The integrated monitoring (summary, export, ticket suggestion) already answers the need of finding bugs.

Recommendation: later, not now. If the team gets a backend and a consent flow, the summary can already be exported in the Prometheus text format: `toPrometheusText(summary)` (`src/monitoring/prometheus.js`, pure and tested) gives `codewash_` metrics in snake_case, as `counter` and `gauge` (`codewash_errors_total{error_type="TypeError"}`, `codewash_crashes_total`, `codewash_operation_latency_ms{operation,quantile}`, `codewash_fps_average`, `codewash_flow_events_total{flow}`). It uses only error types, operation names and key moment names as labels, never messages or profile data. A future gateway would only have to receive this text.
