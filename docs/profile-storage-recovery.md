# Profiles collapsing into Default after a restart

## Confirmed defect, unconfirmed incident trigger

The user reported all schedules appearing under one profile after upgrading to
Home Assistant 2026.9.2. No live HA instance, helper export or backup was available
during this investigation, so the state of the user's original data is unknown.

The previous implementation had a reproducible destructive fallback:

1. `_sharedGet()` returned `null` for both absent and unreadable shared storage.
2. `_wsGet()` interpreted either case as first installation and returned legacy
   per-user data or an empty store.
3. `_ensureDefaultProfile()` adopted every ordinary Scheduler entry into Default
   and persisted that replacement, including deleting surplus storage chunks.
4. The initial load error handler could also create and persist Default.

A missing chunk, unknown/unavailable helper, stale browser snapshot or failed
legacy read can therefore explain the symptom without Scheduler losing schedules.
This is a confirmed card bug, not proof that HA 2026.9.2 caused this particular loss.
The `input_text/__init__.py` sources in HA 2026.9.1 and 2026.9.2 are identical.

## Fix

- Distinguish unreadable existing storage from confirmed first installation.
- Read a fresh server state snapshot if the browser cannot decode the store.
- Before initializing or migrating, require HA to be RUNNING, query configured
  input_text helpers (including those without states), and recheck server states.
- Existing WSC store/profile helpers with unreadable storage block bootstrap.
- Do not treat a failed or malformed legacy API response as an empty installation.
- Validate chunk metadata, unavailable states and the decoded profile structure.
- Show a translated loading-error notice and retry every five seconds while the
  card is connected. Do not create Default, migrate controllers or run cleanup on
  a failed load. Release retry timers when disconnected.
- Await initial persistence before provisioning external profile-control helpers.
- Guard profile writes against unreadable existing storage and provision using
  the server snapshot to avoid duplicate helpers from stale browser states.
- Preserve valid in-memory data during unreadable refreshes and defer orphan
  cleanup in that case. Mini card retries and refreshes instead of caching empty data.

The storage format is unchanged. Existing profiles, groups and schedule links are
retained. New installations and groups-only legacy migration remain supported.

## Recovering already affected installations

Do not reset, recreate profiles or delete storage helpers before preserving evidence.
The fix prevents the fallback; it cannot reconstruct names, group membership and
controller links that have already been overwritten.

Obtain a read-only export in Developer Tools > Template:

```jinja
{% set ns = namespace(items=[]) %}
{% for s in states.input_text if s.entity_id.startswith('input_text.wsc_store_') %}
  {% set ns.items = ns.items + [{'entity_id': s.entity_id, 'state': s.state}] %}
{% endfor %}
{{ ns.items | to_json }}
```

This contains card metadata, including entity/profile names; it requires no token.
Also record whether the remaining profile is named Default, whether WSC Store
helpers appear disabled/renamed in Settings > Helpers, and whether a pre-update
backup exists. Preserve that backup before any restore action.

- If the export still decodes to multiple profiles, the issue is display/loading;
  the fixed card can read the retained data without recreating schedules.
- If helpers are configured but disabled, renamed or not restored, resolve that
  specific problem after saving the export/configuration.
- If the export contains only Default or is corrupt, compare a backup from before
  the incident. The compressed helper values may exist in `core.restore_state`;
  old per-user frontend data or another already-open browser may provide a partial
  older copy. Inspect before using any candidate; never silently merge or replace.
- Scheduler entries alone do not reliably encode original profile/group membership.

Recovery must be an explicit, reviewed operation. No reset or restore was performed
on the user's Home Assistant during this change.

## Limits and validation

Tests exercise the shipped main bundle: missing chunks, unavailable/corrupt data,
invalid schemas, stale browser snapshots, disabled/renamed helpers, failed APIs,
HA startup, legacy migration, first save, subsequent saves, retry recovery, bootstrap
ordering, mini-card refresh, and no device commands or cleanup on failed reads.
Existing Quick Timer and conditional-card tests are retained. The CI controller
runtime target is updated to HA 2026.9.2.

This is not a redesign of persistence: multi-helper writes remain non-atomic,
simultaneous writers across browsers can still conflict, and an interrupted write
can require explicit recovery if helpers remain corrupt. The guard intentionally
blocks overwriting such data. No automatic restore from possibly stale backups.

## Explicit reset

The editing card exposes an admin-only **Groups → Maintenance → RESET** button at
the bottom of Groups. It is separate from profile actions and storage error notices.

1. Build a read-only inventory with exact IDs/counts: profiles, groups, owned
   schedules, linked generated automations/helpers, and any running Quick Timers.
2. Download an inventory export containing profile metadata, schedule states,
   generated automation configurations, helper configurations and timer data.
   This is diagnostic evidence, not an automatically importable HA backup.
3. Require requesting the report, acknowledging a separate WSC or HA backup,
   typing exactly `RESET`, and clicking the destructive button. Enter in
   the text field does not confirm. Cancel/Escape leave everything untouched.
4. Stop owned controllers first, without target restore/end actions; then delete
   inventoried owned objects. Report failures and retain enough inventory for retry.
5. Persist a pending inventory before deletion; block normal operations while it
   is pending, including timer cleanup. Resume requires the same confirmation.
   Detect changes to metadata and inventoried configurations before starting.
6. Initialize a clean Default only after all required deletions succeed. Clear
   this user's legacy data and retain valid empty canonical stores, preventing
   other users' old data from being migrated again. Reuse storage helpers; delete
   runtime helpers. A `resetAt` marker prevents subsequent adoption/deactivation
   of excluded schedules. Normal new schedules remain assignable to profiles.

Never delete all `switch.schedule_*` just because they share Scheduler's prefix.
If profile ownership is lost, unidentified schedules require individual review.
Unrelated HA automations, entities, integrations and dashboards stay out of scope.
The reset must not be used as an automatic recovery path for this incident.

Unit tests cover ownership, renamed automations, stale previews, the phrase gate,
controller stop/delete ordering, no target services, helper cache invalidation,
foreign-object preservation and resume after failures at each deletion stage.
Chromium tests exercise the real dialog's export, phrase/backup gates and cancellation.

Close all other dashboards before resetting: this is not a cross-client transaction
or a server-side lock. Already-running operations and older card versions cannot
be reliably stopped by a browser guard. An interrupted multi-helper write itself
can still require manual recovery; automatic retry only works with readable stored
inventory. No physical full reset on a real HA/Scheduler installation was performed.
