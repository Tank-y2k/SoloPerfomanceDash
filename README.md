# Queue Performance Dashboard

A private, browser-based dashboard for planning a workday across queues, tracking completed applications, comparing actual work with the plan, and exporting the day's completion history. The application is a single self-contained HTML file: it has no build step, package manager, server-side component, or external runtime dependency.

## Contents

- [`queue-performance-dashboard.html`](queue-performance-dashboard.html) — the dashboard application.
- [`help.html`](help.html) — user guide covering the timer, completions, schedule, settings, reminders, reviews, archives, and resets.
- [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md) — definitions of persisted state, record shapes, CSV fields, constants, and calculated values.

## Quick start

### Open as a local file

Open `queue-performance-dashboard.html` in a modern browser. All core planning and tracking features work from a local `file://` URL.

No installation or compilation is required.

## Typical workflow

1. Open **Menu → Queue Settings** and confirm or update each productive queue's apps-per-hour rate.
2. Open **Menu → Schedule**, set the shift bounds, and add activities. Each activity lasts until the next activity begins; the final activity ends with the shift.
3. Select a productive queue on the main screen when work changes. This records the live queue independently of the planned schedule.
4. Enter an application UID, select an outcome, and choose **App Completed**.
5. Optionally choose **Save Current Plan** near the start of the day so the end-day review can compare the original and current plans.
6. Use **End Day Review** to review totals and adherence, then **Export CSV** before **Reset Day**.

See the [complete user guide](help.html) for every feature and setting.

## Data and privacy

The dashboard stores its state as JSON in browser `localStorage` under `queuePerformanceDashboard.v2`. Data stays in the browser profile and origin where it was entered; the application does not transmit it. A `file://` copy and a localhost-served copy may use different browser storage areas, as can different browsers or browser profiles.

Clearing site data, using private browsing, moving to another browser/profile, or browser storage policies may remove or isolate the saved state. Export completion history regularly if it must be retained elsewhere. Resetting a day creates an in-browser archive, but that archive is stored in the same local state and is not a backup.

The completion UID may be operationally sensitive. Follow your organisation's policies for entering, exporting, sharing, and retaining identifiers.

## Targets and timing

For each productive schedule segment, the dashboard calculates the raw target as:

```text
(segment duration in seconds / 3600) × queue apps-per-hour rate
```

A positive raw target is rounded **up** to the next whole application. A user can reduce that rounded segment target by one (never below zero) from the day timeline. Target slots are distributed evenly through the segment. Like a runner’s or drummer’s pacing track, the timer continuously counts to the next scheduled beat and then moves on to the following one; missed beats do not accumulate.

Queues with a rate of zero are non-productive and create no target slots. Built-in **Non-productive**, **Off queue**, and **Team briefing** activities are locked and always have a zero rate.

## Notifications

Scheduled reminders appear as in-page toasts and require the dashboard tab to remain open. Sound can be enabled separately. The app cannot remind you after the tab is closed.

## CSV export

**Menu → Export CSV** downloads `queue-history-YYYY-MM-DD.csv`. It includes one row per completion and the UID, selected queue, outcome, recorded timestamp, time that live queue tracking began, planned queue, and planned segment. See the [CSV section of the data dictionary](DATA_DICTIONARY.md#csv-export-fields) for exact column definitions.

## Browser compatibility

Use a current desktop browser with support for HTML dialogs, `crypto.randomUUID`, `structuredClone`, `localStorage`, and modern JavaScript. Web Audio behavior varies by browser. JavaScript and local storage must be enabled.

## Development and validation

There is no generated output: edit the HTML files directly. A lightweight local validation pass can be run with Python:

```bash
python3 -m http.server 8000
```

Then exercise the workflow in a browser. When changing the state schema, preserve backward compatibility in `loadState()` and update `DATA_DICTIONARY.md`. When renaming the storage key, existing users will start with a separate empty data set unless migration logic is supplied.

## Troubleshooting

- **My previous data is missing:** open the same file/origin in the same browser profile used previously. Local-file and localhost storage can differ.
- **Notifications do not appear:** keep the tab open, enable scheduled reminders, and use **Send test toast** to verify in-page reminders.
- **The timer has no target:** confirm the current time is inside a productive scheduled segment with a positive queue rate and a remaining target slot.
- **A queue cannot be deleted:** built-in queues are locked; another queue also cannot be deleted while a current schedule segment uses it.
- **The schedule will not close:** shift end must be after shift start, every activity must begin within the shift, and activities cannot share a start time.
- **CSV export reports no history:** record at least one completion first.
