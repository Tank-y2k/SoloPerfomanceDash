# Data Dictionary

This document catalogues the Queue Performance Dashboard's persisted data, record types, exported fields, fixed constants, input values, and important derived values. Types use JavaScript terminology. Timestamps are ISO 8601 strings unless otherwise noted.

## Storage

| Item | Definition |
|---|---|
| Storage mechanism | Browser `localStorage` |
| Storage key | `queuePerformanceDashboard.v2` |
| Stored format | JSON object matching the state schema below |
| Scope | Browser profile plus origin/path security context; data is not sent to a server |
| Save behavior | State is saved after full renders and selected setting changes |
| Date basis | The browser's local calendar date and local time zone |

## Top-level state

| Variable | Type | Default | Meaning |
|---|---|---:|---|
| `departments` | `Department[]` | BCA and PCA | Manageable department definitions used to group productive queues. |
| `queues` | `Queue[]` | Built-in and five productive queues | Available productive queues and non-productive activities. |
| `shiftStart` | `string` (`HH:MM`) | `11:00` | Inclusive start of the planned shift. |
| `shiftEnd` | `string` (`HH:MM`) | `19:30` | End of the planned shift and end of the last segment. Must follow `shiftStart`. |
| `segments` | `Segment[]` | Team briefing at `11:00` | Today's planned activities. |
| `completions` | `Completion[]` | `[]` | Applications recorded during the current day. |
| `activityLog` | `ActivityEntry[]` | `[]` | Human-readable audit events for plan, setting, completion, snapshot, and export actions. |
| `startingSnapshot` | `Snapshot \| null` | `null` | Saved start-of-day plan used by End Day Review. |
| `timerStartedAt` | `string \| null` | `null` | Compatibility/tracking field reset on a new day; current timer rendering derives from target slots. |
| `timerQueueId` | `string \| null` | `null` | Compatibility/tracking queue field reset on a new day. |
| `notificationsEnabled` | `boolean` | `false` | Whether scheduled target reminders are checked each second. |
| `notificationSound` | `boolean` | `true` | Whether reminder/test notifications also play a generated sound. |
| `lastNotifiedSlot` | `string \| null` | `null` | Deduplication key for the most recently announced target slot. |
| `lastFinalRoundSegment` | `string \| null` | `null` | Date-and-segment key used to show the final-target overlay once per segment. |
| `dayDate` | `string` (`YYYY-MM-DD`) | Current local date | Day associated with live state; used to detect a date rollover. |

`loadState()` overlays stored top-level values on the current defaults and supplies missing arrays/notification fields for older saved data. Older productive queues are assigned during loading: AA goes to PCA and all others go to BCA; zero-rate activities remain unassigned.

## Record shapes

### `Department`

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `id` | UUID string | Yes | Stable identifier referenced by queues. |
| `name` | string | Yes | Unique, case-insensitive display name. |
| `locked` | boolean | No | Prevents deletion of built-in BCA and PCA; they can still be renamed. |


### `Queue`

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `id` | UUID string | Yes | Stable identifier referenced by segments, completions, and snapshots. |
| `name` | string | Yes | Display name. Name matching for built-ins is case-insensitive during migration/repair. |
| `rate` | number | Yes | Expected applications per hour. Zero marks an activity as non-productive. |
| `color` | CSS colour string | Yes | Colour used in schedule/timeline displays. The UI initially supplies a hex value. |
| `locked` | boolean | No | When true, the built-in name/rate cannot be changed and the queue cannot be deleted; colour remains editable. |
| `departmentId` | UUID string or `null` | Yes | Department for a productive queue; `null` for a zero-rate activity. |

Built-in locked queues are **Non-productive** (`#71717a`), **Off queue** (`#f59e0b`), and **Team briefing** (`#0ea5e9`), all with rate `0`. Default productive queues and rates are Startup `2.29`, Established `2.29`, Resubmissions `2.63`, Sole Trader `2.71`, and Sole Trader Resubmissions `2.75` apps/hour.

### `Segment`

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `id` | UUID string | Yes | Segment identifier. |
| `queueId` | UUID string | Yes | Queue/activity assigned to the segment. |
| `start` | string (`HH:MM`) | Yes | Segment start. It ends at the next segment start or `shiftEnd`. |
| `targetAdjustment` | `0 \| -1` | No | Manual reduction of the rounded segment target by one; absent behaves as `0`. |

Segments must start within the shift and cannot have duplicate start times. Their array is sorted by start time after editing.

### `Completion`

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `id` | UUID string | Yes | Completion record identifier. |
| `at` | ISO timestamp | Yes | Time the outcome button was selected. |
| `queueId` | UUID string | Yes | Productive queue in the active planned segment. |
| `segmentId` | UUID string or `null` | Yes | Planned segment active at recording time, if any. |
| `outcome` | enum string | Yes | `Approve`, `Decline`, `Resub`, `ORE`, or `Other`. |

### `ActivityEntry`

| Field | Type | Meaning |
|---|---|---|
| `id` | UUID string | Log entry identifier. |
| `at` | ISO timestamp | Event time. |
| `type` | string | Event category such as `settings`, `plan`, `complete`, `snapshot`, or `export`. |
| `text` | string | Human-readable event description. |


### `Snapshot`

| Field | Type | Meaning |
|---|---|---|
| `at` | ISO timestamp | Snapshot time. |
| `queues` | `Queue[]` | Deep copy of queues at snapshot time. |
| `segments` | `Segment[]` | Deep copy of the plan at snapshot time. |
| `shiftStart` | `HH:MM` string | Saved shift start. |
| `shiftEnd` | `HH:MM` string | Saved shift end. |
| `expectedFullDay` | number | Sum of saved segment targets. |


## User inputs and settings

| UI value | Type/constraint | Effect |
|---|---|---|
| Queue name | Non-empty string | Creates or renames a queue. |
| Apps per hour | Number `>= 0`, step `0.1` on creation | Drives targets; zero is non-productive. |
| Queue colour | Browser colour value / prompted CSS colour | Controls queue presentation. |
| Queue department | Existing department ID | Required for productive queues; omitted for zero-rate activities. |
| Department name | Unique non-empty string | Creates or renames a department. A department must have no queues before deletion. |
| Shift starts / ends | `HH:MM` | Bounds the schedule; end must be later. |
| Segment queue | Existing queue ID | Assigns work/activity to the segment. |
| Segment start | `HH:MM` within shift | Defines this segment's start and the prior segment's end. |
| Completion queue | Productive queue ID | Taken from the active planned segment. |
| Edited completion time | Local `HH:MM` | Replaces the completion timestamp's local time and automatically resolves its productive scheduled segment and queue. |
| Edited completion queue | Productive queue ID | Overrides the recorded queue; the scheduled segment is retained only when it uses that queue. |
| Outcome | One of `Approve`, `Decline`, `Resub`, `ORE`, or `Other` | Button-selected classification exported with completion history. |
| Scheduled reminders | Boolean | Enables due-slot reminder checks while open. |
| Notification sound | Boolean | Enables generated audio alongside reminders. |

## Fixed application constants

| Constant | Value | Purpose |
|---|---|---|
| `STORAGE_KEY` | `queuePerformanceDashboard.v2` | Local-storage namespace. |
| `NON_PRODUCTIVE_NAME` | `Non-productive` | Built-in activity identity. |
| `OFF_QUEUE_NAME` | `Off queue` | Built-in activity identity. |
| `TEAM_BRIEFING_NAME` | `Team briefing` | Built-in activity identity. |
| `BASE_TITLE` | `Queue Performance Dashboard` | Base browser-tab title. |
| `DEFAULT_SHIFT_START` | `11:00` | Shift start after reset. |
| `DEFAULT_SHIFT_END` | `19:30` | Shift end after reset. |
| `TEAM_BRIEFING_MINUTES` | `15` | Default spacing after a briefing when adding the next activity. |

## Derived values

| Value | Definition |
|---|---|
| Productive queue | A queue whose numeric `rate` is greater than zero. |
| Segment end | Next chronological segment start, otherwise shift end. |
| Segment duration | `max(0, segment end − segment start)` minutes. |
| Raw expected apps | `(segment duration seconds / 3600) × rate`. |
| Rounded expected apps | Ceiling of a positive raw expectation; otherwise zero. |
| Expected apps | `max(0, rounded expected apps + targetAdjustment)`. |
| Seconds per app | Segment duration seconds divided by expected apps; zero when there is no target. |
| Scheduled target slot | Segment start plus `secondsPerApp × appNumber`, for each whole app target. |
| Expected full day | Sum of each segment's expected apps. |
| Productive planned time | Sum of segment durations whose queue rate is positive. |
| Non-productive planned time | Sum of segment durations whose queue rate is zero. |
| Current segment | Segment containing the browser's current local time. |
| Active queue | Queue in the planned current segment. |
| Completed in segment | Count of completions whose `segmentId` equals that segment ID. |
| Elapsed productive hours | Productive duration elapsed so far, capped at segment bounds; calculated for the day or current segment. |
| Running expected apps | Sum of elapsed productive hours multiplied by each relevant queue rate. |
| Running apps/hour | Relevant completions at or before the current time divided by elapsed productive hours. The live day metric is restricted to the active queue's department; manually reassigned entries are attributed by their recorded queue. |
| Running efficiency | Relevant completions at or before the current time divided by running expected apps, multiplied by 100. The live day metric is restricted to the active queue's department. |
| Predicted efficiency | Recalculated whole-app target divided by the raw unrounded expectation, multiplied by 100. Available for the whole day and grouped by department, queue, and segment in Day Details. |
| Expected apps/hour | Recalculated whole-app target divided by productive scheduled hours for the selected Day Details scope. |
| Day Details current apps/hour | Completions recorded at or before the current time divided by elapsed productive hours in the selected whole-day, department, queue, or segment scope. |
| Day Details current efficiency | Completions recorded at or before the current time divided by the raw queue-rate expectation earned over elapsed productive time in the selected scope, multiplied by 100. |
| Current variance | Total completions minus current expected full-day total. |
| Timer ETC | Local clock time of the next scheduled target slot. |
| Timer Target | Current target ordinal and segment total, e.g. `2 / 5`. |
| Timer progress | Remaining seconds divided by seconds per app, clamped for display. |
| Notification slot key | Local date, segment ID, and due-slot ISO timestamp, joined with `|`. |

## CSV export fields

The file is named `queue-history-YYYY-MM-DD.csv`. Every value is quoted and embedded quotes are doubled.

| Column | Source | Meaning |
|---|---|---|
| `queue` | Name resolved from `Completion.queueId` | Queue selected when recorded. |
| `outcome` | `Completion.outcome` | Selected completion outcome. |
| `recorded_at` | `Completion.at` | ISO timestamp of completion. |
| `planned_queue` | Queue resolved via `Completion.segmentId` | Queue assigned to the contemporaneous planned segment, or blank. |
| `planned_segment` | Resolved segment bounds | `HH:MM-HH:MM`, or blank if no segment matched. |

## Reset and rollover behavior

**Reset Day** restores default shift bounds and a team-briefing segment; clears current completions, logs, snapshot, timer compatibility fields, and notification deduplication fields; retains queue definitions and notification preferences; and updates `dayDate`.

When the local calendar date changes while the page is open, the dashboard offers to export and reset, reset without export, or skip. Skipping changes `dayDate` to today and opens the schedule without clearing existing live data.
