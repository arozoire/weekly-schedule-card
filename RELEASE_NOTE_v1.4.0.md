# v1.4.0 — Quick Timer server-side lifecycle

> Superseded by v1.4.1. Do not install the package or create the token described
> below when using v1.4.1 or newer; the new temporary-schedule lifecycle needs neither.

## Important setup

Quick Timer now requires `packages/quick_timer.yaml`. Copy it to your Home Assistant
`/config/packages/` directory, add `wsc_qt_authorization` to `secrets.yaml`, then restart
Home Assistant. The complete steps are in the README.

## Changes

- Configure duration and entity action without changing the real entity; **Start** applies both.
- Every run uses a unique Home Assistant automation with an embedded state snapshot.
- Normal expiry restores the snapshot and deletes the temporary automation server-side.
- **Cancel** restores immediately and then deletes the automation.
- A matching weekly schedule that starts during the timer wins; the timer is deleted without restore.
- Home Assistant restart recovery and five-second retry after restore failures.
- Climate restore now includes HVAC, temperature/range, preset, fan and swing settings.
- Fixed attribute-only entity refreshes and removed-schedule refreshes in the weekly cards.
- Corrected README configuration keys, Scheduler examples, view-card wording and release workflow.
