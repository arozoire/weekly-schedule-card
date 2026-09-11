# Conditional controller — review before release

This branch changes conditional schedules only. It is not yet a published HACS update.
Do not merge without a version bump and release notes after review.

## Accepted behavior

- Condition is checked before applying the scheduled target settings.
- False during the slot uses the explicit end action, if configured.
- Otherwise it restores the immutable pre-slot state. If false at the initial
  evaluation, no target write is necessary because that state is already present.
- At the end, an explicit end action runs. Without one, **no target command** runs.
- A newly active competing normal schedule takes over for the rest of the occurrence.
  A Quick Timer pauses the old controller until removal, then condition evaluation
  resumes if still in-slot. Neither fallback nor completion overrides a running timer.
- Plain schedules and Quick Timer code are unchanged.

## Implementation

`src/conditional-controller.js` builds HA script actions and the Scheduler marker.
The marker is a `logbook.log` action targeting the original entity. Its message
contains the original Scheduler actions as JSON. This retains entity association
for both old and new Quick Timer controllers. `effectiveSchedule` decodes it for
rendering, editing, groups/profiles and the standalone mini card. No new integration
or access token is used. Scheduler's `current_slot` transition wakes the controller;
the marker itself cannot turn on/off or reconfigure the target.

One controller owns start, source-condition changes, fallback and completion.
Source events do not snapshot again. An occurrence key is calculated from the
configured local slot start; overnight slots keep one key across midnight. The
Scheduler remains the authority on weekdays and whether the slot is active.

Persistence is per schedule: one hidden input_text record and (only without an
end action) eight 254-character snapshot chunks, each prefixed with `#`. The prefix
prevents HA's native template renderer converting string fragments into numbers
or dictionaries before `input_text.set_value`. Helpers are provisioned on save,
never at slot execution. The run record is invalidated before capture and marked
live only after every snapshot write succeeds. Maximum encoded snapshot is 2032
characters. Only supported restoration attributes are stored, not telemetry.
A pending marker precedes target writes; errors can be retried on later evaluations
or the minute recovery tick. This provides at-least-once service attempts, not an
atomic transaction with physical devices.

Restoration uses explicit per-domain services and ordering matching Quick Timer
(HVAC, preset, temperature/range, fan, swing; light power/color/brightness; fan
speed/mode/etc.). A real-HA test executes each domain. The browser-side Quick Timer
snapshot builder itself is not called at runtime: JavaScript cannot execute when
HA reaches a future slot with every dashboard closed.

Setup suspends the runtime record until helpers, controller, flags and related
objects have been configured. Migration freezes idle schedules, replaces their
Scheduler action, removes the old auto-off/extras/one-shot writers and restores
the enabled state. A persisted migration marker allows retry. Active legacy slots
are left alone until idle. No prior state is invented for an already-running slot.
The manual override flag retains its existing UI and reset-on-restart behavior.

Conditional one-shots remove their Scheduler entry after controller completion.
Browser cleanup then removes linked automations/helpers, as for other generated
objects. Helper IDs, snapshots and automation IDs are not shared by duplicated
conditional profiles; duplicates remain disabled until profile activation.

## Verification

- `npm run build`
- `node tests/quick-timer-card.test.mjs`
- `node tests/conditional-card.test.mjs`: plain/conditional create paths, validation,
  action metadata round-trip, helper allocation, profile cloning, removing conditions,
  deferred/idempotent legacy migration and Quick Timer entity association.
- `node tests/conditional-fixtures.mjs /tmp/wsc-conditional-fixtures.json`
- `python tests/conditional-controller-ha.py /tmp/wsc-conditional-fixtures.json`:
  real HA schema, templates and script evaluator, with simulated entity services.
  Checks initial false, true/false transitions, immutable baseline, no end writes
  both on/off, explicit end output, retry on restore/end failures, restart/re-entry,
  unavailable/oversized snapshot, takeover, manual override, overnight and all ten
  supported restore domains, controller-based hysteresis and Quick Timer pause/resume
  (including cross-midnight start-only timers). No physical Home Assistant instance is controlled.
- CI includes the existing Chromium Quick Timer test plus the conditional runtime
  test on HA 2026.9.1 / Python 3.14. Local compatibility checks also use HA 2024.3.3.

## Integration limits to review explicitly

- Physical device commands and snapshot persistence cannot be atomic. An abrupt
  power loss can lose recent restored-helper data; a graceful restart is the
  supported persistence path. Service success also does not prove physical arrival.
- Restore coverage follows the Quick Timer's existing limitations: off lights/fans
  restore power, not every dormant attribute; only exposed device capabilities can
  be restored. Unsupported/unknown states must not be replaced by invented values.
- Multiple truly simultaneous overlapping schedules are not assigned a new global
  priority scheme. Normal schedule priority and user configuration remain relevant.
  Queued actions already in flight can complete before a takeover event is handled.
- Runtime/schema tests use real HA code with mock services, not real Scheduler
  event delivery or physical devices. Validate one light and one climate in HA
  before release, including restart, profile activation and a competing Quick Timer.
- Automatic migration/cleanup requires opening the card as an administrator.
  Closing the dashboard never prevents condition evaluation or snapshot restoration.
