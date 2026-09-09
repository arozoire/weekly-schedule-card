# Quick Timer v1.4.1 review

**v1.4.3 follow-up:** the user reported that live controls still acted immediately
after v1.4.2. The proxy/context approach below is historical and has been removed.
The Quick Timer now renders its own HTML draft controls and never instantiates
embedded HA cards. Browser interaction tests cover edit → Start → Cancel. The
architectural limitations below remain separate, unresolved work.

Reviewed published main commit `7066b9417b7c7dfb2d3286b0a09377604bb06986`
(tree `b5801b05fb003beb303ee15797447a7804c05810`). The local starting tree was
verified against GitHub, not inferred from the package version.

The release only partially implements the requested behavior. The targeted fixes
below are included in v1.4.2. After reviewing the remaining limitations, the
repository owner explicitly requested publishing this incremental update through
HACS. This does not resolve the architectural issues listed below.

## Confirmed defects repaired in v1.4.2

1. **Immediate device changes while editing (critical).** `_draftHassObject`
   intercepts `hass.callService`, but current native HA card features consume
   `hassApi` and `states` via Lit `context-request`. Those requests bubbled to HA's
   root provider and obtained real APIs/states. The native feature code calls
   `this._api.callService`, never the embedded card's proxy. Added a local context
   provider for API/state/connection contexts, subscriptions, and explicit routing
   for HTTP and WebSocket service calls. Unknown writes are rejected. Ordinary
   context values (translations, registries, formatters) still come from HA.
2. **Missing climate controls.** Default tiles offered HVAC and temperature, but
   no fan/preset/swing choices, and more-info was blocked. Added native supported
   mode features and a short editing hint. Apply now sends the explicitly edited
   commands; a fan-only selection does not also resend an old temperature/preset.
   The tile layout and timer panel remain.
3. **Wrong restored temperature.** Restore set temperature and then applied a
   preset. A preset can change temperature again. Preset now runs before explicit
   temperature/fan/swing values. Device-specific presets can still impose their
   own constraints and must be tested on the user's integration.
4. **Cancelled timer stuck after cleanup failure.** Cancel disabled the controller
   and retained the record, but GC ignored records where both resources existed.
   Added a persisted cleanup phase so removal is retried without repeating restore.
   A failure to disable the controller is no longer silently ignored.
5. **Same-slot re-entry ignored.** Event takeover compared against the initial slot
   index, ignoring off/on and idle-to-the-same-index transitions. It now compares
   the actual transition. The watchdog's restart limitations remain below.
6. **Other concrete errors.** Domain `toggle` was ignored; closing/opening a cover
   retained the old draft position; fan percentage zero became an on action.
   Corrected those drafts. Automation lookup no longer invents an entity ID from
   the config ID (HA derives it from the alias). DELETE errors are no longer
   treated as success merely because the entity is absent from `hass.states`.
   Start rejects an already-running local timer and non-finite durations.

## Remaining architectural limitations

- **Full self-deletion is not implemented.** The temporary Scheduler entity is
  removed server-side, but its disabled controller is deleted by the frontend.
  Closing the dashboard leaves the automation until a later card load. This does
  not meet an unconditional "delete the automation at expiry" requirement.
  Existing Weekly Schedule one-shot support has the same frontend cleanup pattern;
  it is not proof that an HA automation can delete its own configuration.
- **Start is not transactional.** `_startTimer` calls `scheduler.add` before
  controller creation/storage. The new current interval can execute immediately.
  If controller creation fails, or the browser disappears then, rollback is not
  guaranteed. If schedule discovery times out, `record.scheduleIds` can remain
  empty even though a late schedule exists. `run_action` also queues actions;
  accepting that service call is not proof every device action succeeded.
- **Priority is only partially enforced.** Profile/group lists correctly exclude
  temporary schedules. However, an already-active normal schedule's condition or
  extra automation can act while its `current_slot` remains unchanged: the timer
  controller neither suppresses that automation nor detects this as takeover.
  For cross-midnight start-only timers the temporary schedule may not expose an
  active interval, so existing normal auto-off guards can also interfere.
- **Restart is best-effort, not guaranteed.** A constant initial slot index cannot
  distinguish a new occurrence of the same slot if the transition was missed while
  HA was offline. Scheduler may reapply an interval on restart. Ordering that
  reapplication against the timer controller needs an integration test and a
  persistent occurrence/lifecycle design, not just a new index comparison.
- **Concurrent devices can race.** `_starting` is per card; shared timer storage is
  a read/modify/write compressed map without server-side locking. Two starts can
  create two controllers for one entity; different timers can overwrite each
  other's metadata. Cancellation also races with server takeover around a slot
  boundary; a late client restore can overwrite the winning schedule.
- **Snapshot coverage has limits.** Several off-state domains only restore power,
  not the remembered attributes modified during the run. Locks/covers in a
  moving/transitional state need explicit handling rather than binary fallback.

## Evidence and validation

Primary upstream sources inspected:

- [HA mode feature](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/card-features/hui-mode-select-card-feature-base.ts)
- [HA context identifiers](https://github.com/home-assistant/frontend/blob/dev/src/data/context/index.ts)
- [HA context subscription protocol](https://github.com/home-assistant/frontend/blob/dev/src/common/decorators/consume-context-entry.ts)
- [HA native tile](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/cards/hui-tile-card.ts)
- [Scheduler switch lifecycle and run_action](https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/switch.py)
- [Scheduler action queue](https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/actions.py)

Regression tests exercise context-based calls and live/draft subscription changes,
blocked writes, domain drafts, preset side effects, cleanup retry without a second
restore, lookup/delete errors and local overlapping starts. Existing profile
exclusion and timer tests are retained. These are Node tests with HA protocol
fixtures, not a browser connected to an actual Home Assistant instance. The
reported user's device behavior has not been tested directly. Generated HA Jinja
is inspected but not executed in an HA runtime here.

To complete the original requirements: resolve the startup/priority/concurrency
issues, implement autonomous resource cleanup, and validate native
controls plus expiry/cancel/takeover/restart on HA with the dashboard closed.
