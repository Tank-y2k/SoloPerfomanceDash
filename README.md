# Queue Performance Dashboard

A private, browser-based dashboard for planning a workday across queues, recording application outcomes, comparing completed work with the plan, and exporting the day's completion history. The application is a single self-contained HTML file: it has no build step, package manager, server-side component, or external runtime dependency.

## Contents

- [`queue-performance-dashboard.html`](queue-performance-dashboard.html) — the portable dashboard application, including its in-app user guide.
- [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md) — definitions of persisted state, record shapes, CSV fields, constants, and calculated values.

## Quick start

### Open as a local file

Open `queue-performance-dashboard.html` in a modern browser. All core planning and tracking features work from a local `file://` URL.

No installation or compilation is required.

## Typical workflow

1. Open **Menu → Queue Settings** and confirm each productive queue's department and apps-per-hour rate.
2. Open **Menu → Schedule** to build the day manually, or use **Menu → Import Schedule** to paste and preview a copied scheduling-system day before replacing the plan. Each activity lasts until the next activity begins; the final activity ends with the shift.
3. During a productive scheduled segment, select **Approve**, **Decline**, **Resub**, **ORE**, or **Other** to record its outcome.
4. Use **Day Details** under **Day actions** to review totals and performance.
5. Choose **Export CSV** before **Reset Day** when you need an external record.

Open **Menu → Help** for the complete user guide without leaving the dashboard.

Forgot to record an application at the right moment? Open **Menu → Completed Apps** and edit its completion time. The dashboard selects the productive queue scheduled at the corrected time automatically, and the adjacent task/queue dropdown provides a manual override. If an outcome button is pressed during a non-productive activity, the dashboard instead asks for the completion’s department, task/queue, and time.

## Data and privacy

The dashboard stores its state as JSON in browser `localStorage` under `queuePerformanceDashboard.v2`. Data stays in the browser profile and origin where it was entered; the application does not transmit it. A `file://` copy and a localhost-served copy may use different browser storage areas, as can different browsers or browser profiles.

Clearing site data, using private browsing, moving to another browser/profile, or browser storage policies may remove or isolate the saved state. Export completion history regularly if it must be retained elsewhere.

## Targets and timing

For each productive schedule segment, the dashboard calculates the raw target as:

```text
(segment duration in seconds / 3600) × queue apps-per-hour rate
```

A positive raw target is rounded **up** to the next whole application. A user can reduce that rounded segment target by one (never below zero) from the day timeline. Target slots are distributed evenly through the segment. Like a runner’s or drummer’s pacing track, the timer continuously counts to the next scheduled beat and then moves on to the following one; missed beats do not accumulate.

The scheduled-app list retains earlier targets. Completed targets show their actual completion time, while incomplete targets show their ETC. It positions an active non-productive activity at the top, then advances to the next incomplete target when that activity ends. During productive time, the view advances only when an application is submitted, including when it is completed ahead of its ETC. After browsing the history manually, use the target icon beside **Scheduled apps** to jump back to the current item.

Queues with a rate of zero are non-productive and create no target slots. Built-in **Non-productive**, **Off queue**, and **Team Briefings** activities are locked and always have a zero rate.

The live tracker also reports current-department and current-segment apps/hour and efficiency. Department performance is isolated, so work recorded in AA/PCA does not alter BCA efficiency (or vice versa). Efficiency compares recorded completions with the unrounded target earned over relevant productive time elapsed so far, so it updates continuously rather than waiting for a whole target slot.

**Menu → Day Details** shows the recalculated plan for the whole day, each department, each queue, and each productive segment. It includes expected whole apps, recalculated apps/hour, completed apps, productive time, predicted efficiency, current apps/hour, and current efficiency. Current values use only productive time elapsed and completions recorded so far in that row's scope. Predicted efficiency compares the rounded, optionally modified target with the raw queue-rate expectation; rounding normally places it above 100%, while a manual reduction can take it below 100%.

## Departments

Productive queues belong to a department. The built-in departments are **BCA** and **PCA**; existing productive queues migrate to BCA except a queue named **AA**, which migrates to PCA. Zero-rate activities remain unassigned. Departments can be added, renamed, and—when they have no queues—deleted in **Queue Settings**.

## Notifications

Scheduled reminders appear as in-page toasts and require the dashboard tab to remain open. Sound can be enabled separately. The Final App splash appears when the final target window begins, so its lead time follows the segment’s app cadence. Separately, optional escalating music plays during the final 30 seconds of every segment, including non-productive activities. The app cannot remind you after the tab is closed.

## CSV export

**Menu → Export CSV** downloads `queue-history-YYYY-MM-DD.csv`. It includes one row per completion with its scheduled queue, outcome, recorded timestamp, planned queue, and planned segment. See the [CSV section of the data dictionary](DATA_DICTIONARY.md#csv-export-fields) for exact column definitions.

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
