# Weekly Schedule Card — next-session brief

> Working document for Codex, Claude, Astra, Sol, or another engineer starting
> without prior conversation context. Read the repository and current tests before
> changing behavior. This file describes planned work; it is not a release note.

## Repository and current baseline

- Repository: `arozoire/weekly-schedule-card`
- Current released baseline: `v1.5.2`
- Home Assistant target used in CI: `2026.9.2`
- Main cards:
  - `weekly-schedule-card`: editor and profile/group management
  - `weekly-schedule-view-card`: dashboard-oriented schedule view
  - `weekly-schedule-mini-card`
  - `quick-timer-card`
  - `weekly-serpentine-card`
- The four distributable bundles in `dist/` must remain self-contained and
  consistent with `src/`.
- No manual YAML helpers, tokens, or user-created support entities are allowed.
- Home Assistant helpers and generated automations are created by the card and
  require normal HA administrator permissions.

Version 1.5.2 prevents unreadable shared profile storage from being treated as a
new installation. It also provides an admin-only full reset with inventory export,
backup acknowledgement, an exact confirmation phrase, persisted retry inventory,
and ownership guards. The fix prevents future destructive fallback; it cannot
reconstruct profile membership already overwritten.

Relevant existing documents and tests:

- `docs/profile-storage-recovery.md`
- `docs/conditional-controller-review.md`
- `tests/profile-storage.test.mjs`
- `tests/reset-card.test.mjs`
- `tests/reset-browser.test.cjs`
- `tests/conditional-card.test.mjs`
- `tests/conditional-controller-ha.py`
- `tests/quick-timer-card.test.mjs`
- `.github/workflows/quick-timer-tests.yml`

## Objectives for the next development cycle

The work must be split into three independent changes:

1. simplify the full-reset confirmation phrase;
2. add a safe orphan-cleanup feature;
3. redesign the schedule-view card around a daily event timeline.

Do not combine all three into one implementation or release. Each change needs its
own reviewable branch/PR, tests, documentation, CI result, and explicit release
decision.

---

## Phase 0 — inspect and freeze the baseline

Before editing:

1. Fetch `main`, inspect the latest release and confirm the version.
2. Check `git status`; preserve unrelated user changes.
3. Read the files and tests listed above.
4. Run the current test suite and record the baseline.
5. Inventory all namespaces used by the project:
   - schedule tags and names;
   - generated automation IDs and descriptions;
   - runtime/helper IDs;
   - shared profile and Quick Timer storage helpers;
   - legacy per-user frontend storage.
6. Document which object types can be attributed to WSC with certainty.
7. Do not modify Scheduler entries, helpers, automations, devices, releases, or
   repository history during this inspection.

Acceptance: the baseline is reproducible and every deletion candidate used later
has a documented ownership rule.

---

## Phase 1 — change full-reset phrase to RESET

### Required behavior

Replace the exact phrase `CANCELLA TUTTO` with the exact, case-sensitive phrase
`RESET`.

Keep all existing protection layers:

- administrator-only access;
- read-only preview before mutation;
- inventory with exact counts and IDs;
- mandatory download request for the export;
- acknowledgement that the export was saved and a real HA backup exists;
- destructive button disabled until every condition is true;
- Enter must not confirm;
- Cancel, Escape, or backdrop must perform zero writes;
- stale inventory must be rejected;
- interrupted reset must retain the persisted plan and require explicit resume;
- reset must never send device target actions, final actions, or restores.

### Required updates

- reset constant and all UI text;
- English, Italian, and fallback translations;
- reset unit and Chromium tests;
- README and recovery document;
- release note only when a release is explicitly approved.

Acceptance: all existing reset safety tests still pass with `RESET`; old
`CANCELLA TUTTO` no longer unlocks deletion.

---

## Phase 2 — safe orphan cleanup

### Product definition

Add an administrator-only action named approximately **Clean unused WSC objects**.
This is garbage collection, not a second full reset. It must preserve all valid
profiles, groups, schedules, Quick Timers, and currently required controllers.

The operation must always run in two separate stages:

1. **Analyze** — read-only inventory and classification.
2. **Clean** — delete only the exact reviewed, unchanged, definitely-owned objects.

### Classification model

Every discovered object must be placed into exactly one class:

| Class | Meaning | Automatic deletion |
|---|---|---|
| Required | Referenced by current valid WSC/Quick Timer data | Never |
| Orphan, certain | WSC ownership is proven and no valid reference exists | Allowed after confirmation |
| Ambiguous | Looks related but ownership or reference is uncertain | Never |
| Infrastructure | Canonical shared storage/helper still required | Never |
| Unrelated | Does not belong to WSC | Never |

No prefix alone is sufficient proof of ownership.

### Candidate objects

Analyze at least:

- generated conditional, auto-off, one-shot, extras, notification, override, Quick
  Timer, and external-profile automations;
- conditional runtime helpers;
- obsolete external-profile helpers;
- expired Quick Timer schedules and controllers;
- auto-child schedules whose parent/reference no longer exists;
- surplus numbered storage chunks beyond the active metadata count;
- duplicate/renamed WSC helpers only when registry/configuration proves identity;
- links in metadata pointing to missing objects.

### Ownership requirements

An automation may be automatically classified as a certain WSC orphan only when:

- its ID matches a known WSC namespace;
- its configuration contains a recognized WSC generator description/version;
- it is absent from every live profile link and Quick Timer record;
- it is not required by the external profile controller;
- its configuration has not changed between preview and deletion.

A helper may be classified as certain only when its config/unique ID matches an
explicit WSC runtime namespace and it is not part of canonical readable storage.
Renamed or disabled entities must be resolved through the registry, not guessed.

A schedule may be classified as certain only when ownership is proven through
stored references plus WSC-generated tags/markers or Quick Timer metadata. Never
delete every `switch.schedule_*` entry. Unassigned normal Scheduler schedules are
protected.

### Cleanup transaction and failure behavior

1. Require HA state `RUNNING` and readable, schema-valid WSC and timer stores.
2. Refuse cleanup while full reset is pending or another cleanup is pending.
3. Build a fresh server-side inventory.
4. Display IDs, reasons, and the classification of every candidate.
5. Offer a diagnostic JSON export.
6. Require explicit confirmation. A phrase such as `PULISCI` can be considered,
   but must be approved during UX review.
7. Immediately before deletion, re-read metadata, registry and configurations.
8. Reject the operation if any candidate changed.
9. Persist a cleanup plan before the first deletion so interruption is resumable.
10. Stop certain orphan controllers with `stop_actions: true`.
11. Delete in dependency order: controllers, generated schedules, runtime helpers,
    then stale metadata links/chunks.
12. Do not invoke schedule end actions, restores, Quick Timer cancel behavior, or
    target-domain services.
13. Keep completed/failed results visible, including objects intentionally skipped.
14. On partial failure, do not broaden the inventory. Resume only the original,
    still-valid targets.

### Cleanup tests

Cover:

- every known automation/helper/schedule namespace;
- active, inactive, disabled, renamed and unavailable objects;
- foreign objects using similar names;
- valid references from all profiles, groups, conditional links, Quick Timers and
  external profile control;
- stale preview/config changes;
- concurrent profile or timer changes;
- failures at stop/delete/write stages and browser/HA restart;
- idempotency: a second cleanup finds nothing;
- zero target-device service calls;
- Chromium confirmation, export, cancellation and admin visibility.

Acceptance: only objects proven to be WSC-owned and unreferenced are removed.
Ambiguous items remain visible for manual review.

---

## Phase 3 — schedule-view product decisions

Do not begin visual implementation until these questions have explicit answers:

1. Does the view show only active profiles, the selected profile, or allow both
   through a filter?
2. Does it show only the selected group, all groups, or an aggregate with drill-down?
3. How are ungrouped entities represented?
4. What is the maximum readable number of entities on phone, tablet and wall panel?
5. Are empty periods shown, collapsed, or omitted?
6. How are overlapping profiles and groups labelled?
7. Is the default entry point Today, Agenda, or Week?
8. What details appear inline versus in a drawer/popup?
9. Does clicking an item edit it, inspect it, or offer both actions?
10. How are conditions, false-condition behavior, Quick Timer control, manual
    override and unavailable entities displayed?

These are product choices, not implementation details. Record the decision matrix
before mockups.

---

## Phase 4 — timeline data model

The view must start from the timeline of the day, not from one row per entity and
not from one proportional block per schedule.

### Segmentation algorithm

For a selected date and visible scope:

1. Resolve active occurrences, including weekday rules and overnight schedules.
2. Collect every relevant start and end timestamp.
3. Sort and deduplicate boundaries.
4. Create consecutive intervals between adjacent boundaries.
5. For each interval, compute the set of active occurrences and their effective
   actions/status.
6. Merge adjacent intervals only if their visible state and metadata are identical.
7. Decide separately whether empty intervals are displayed.
8. Keep short intervals readable; a five-minute occurrence must not disappear.

Given:

- Entity 1: 09:30–18:00
- Entity 2: 09:30–10:00
- Entity 2: 12:30–19:00
- Entity 3: 07:30–07:35

Relevant occupied intervals are:

- 07:30–07:35: Entity 3
- 09:30–10:00: Entity 1 + Entity 2
- 10:00–12:30: Entity 1
- 12:30–18:00: Entity 1 + Entity 2
- 18:00–19:00: Entity 2

The earlier value `07:30–07:30` is treated as a typo unless the user explicitly
confirms a zero-duration visual marker. The gap 07:35–09:30 is an unresolved UX
choice: display it as empty, collapse it, or omit it.

### Data correctness cases

Include:

- multiple actions inside one Scheduler entry;
- overlapping schedules for the same entity;
- selected versus active profiles;
- exclusive and shared profiles;
- groups and ungrouped entities;
- overnight ranges split at midnight;
- daylight-saving transitions;
- five-minute schedules;
- conditions true/false/unknown and hysteresis;
- end action versus no end action;
- Quick Timer suspension/resume;
- newer normal schedule takeover;
- manual override;
- disabled, completed and unavailable schedules.

The timeline view must be observational. Opening or rendering it must never command
an entity, migrate data, recreate controllers, or alter ownership.

---

## Phase 5 — mockups before code

Create separate mockups for:

1. **Today / Timeline** — primary mobile view.
2. **Agenda** — chronological cards grouped by day.
3. **Week** — compact overview with drill-down.
4. **Interval details** — entities/actions/status for one segment.
5. **Filters** — profile and group scope without consuming excessive space.
6. **Short-event treatment** — explicitly demonstrate a five-minute occurrence.
7. **Overlap and condition states** — active, blocked, overridden and timer-paused.

Use the real example above plus at least one overnight schedule and one conditional
schedule. Produce phone and tablet/wall variants. Static mockups come before code;
interactive prototypes follow only after visual review.

### Visual requirements

- modern but consistent with Home Assistant themes;
- readable in light and dark modes;
- no face/avatar metaphor;
- no permanent row per entity;
- schedule changes are the primary visual rhythm;
- exact start/end times remain visible;
- short events have a minimum visual affordance without falsifying duration;
- color is supplementary, never the only carrier of meaning;
- status icons need labels/tooltips and accessible names;
- dense details use progressive disclosure;
- keyboard and touch targets remain accessible.

Acceptance: the user approves one coherent system covering Today, Agenda, Week,
details and filters—not isolated attractive screens.

---

## Phase 6 — implementation

Only after mockup approval:

1. Extract a pure timeline/occurrence transformation module.
2. Add deterministic unit fixtures before UI integration.
3. Implement Today view.
4. Implement interval details.
5. Add filters and persist only harmless display preferences.
6. Implement Agenda.
7. Implement Week.
8. Add responsive and theme handling.
9. Integrate editing without duplicating scheduler/controller logic.
10. Rebuild all bundles.

Avoid embedding business logic in rendering methods. The pure data model must be
testable without a browser or Home Assistant.

---

## Phase 7 — validation and release gates

Required checks:

- current build/bundle checks;
- existing Quick Timer, conditional controller, profile-storage and reset tests;
- new cleanup unit/browser tests;
- new pure timeline fixtures;
- browser screenshots at agreed phone/tablet sizes;
- light/dark theme checks;
- keyboard navigation and accessible labels;
- no entity commands during read-only rendering;
- dist/source consistency;
- `git diff --check`;
- GitHub CI completely green.

Before merge, document remaining risks and obtain review. Do not merge, bump, tag,
publish a release, or update HACS until explicitly requested. Use separate semantic
versions for independently reviewed changes.

## Known project limits to retain in reviews

- No deterministic priority exists for two schedules starting at exactly the same
  instant.
- Conditional-controller crash recovery depends on the last persisted helper state.
- Multi-helper profile writes are not atomic across browsers.
- Reset/cleanup browser guards are not server-side locks.
- A complete physical test on a real Home Assistant + Scheduler installation is
  still required for release confidence.
- Existing normal schedules and Quick Timer priority rules must remain unchanged.

## Suggested next-session order

1. Implement and review the `RESET` phrase change.
2. Design the orphan-cleanup ownership matrix and test fixtures.
3. Implement cleanup as a separate PR.
4. Hold a product-decision session for view scope.
5. Ask Astra for the mockup system using the approved decisions and timeline fixture.
6. Review mockups before writing view code.
