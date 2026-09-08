# v1.4.2 — Quick Timer draft controls and recovery fixes

This update repairs the v1.4.1 Quick Timer editor and several concrete lifecycle
errors. Install it through HACS as a normal card update; reload the dashboard/browser
resources afterwards. No YAML package, secret, or long-lived token is required.

## Fixes

- Native HA controls using Lit context now receive the local draft state/API.
  Editing settings before **Start timer** no longer uses the live HA API through
  that context path.
- Climate tiles include supported fan, preset and swing mode controls, with an
  editing hint. Apply sends the explicitly chosen commands; selecting fan-only
  does not also resend the old temperature/preset.
- Restore applies climate presets before the saved temperature so preset side
  effects do not overwrite the setpoint.
- Cancel cleanup failures are retried without restoring the entity a second time.
- Fixed domain toggles, cover open/close draft positions, fan zero percentage,
  same-slot event takeover, controller lookup and deletion error handling.
- Guard against overlapping starts in the same card and invalid durations.

## Known limitations — not resolved by this update

- Controller deletion still requires an open or subsequently reopened Quick Timer
  card. The server removes the temporary schedule and disables the controller.
- Startup is not transactional; closing the browser or an error during creation
  can leave incomplete resources.
- Existing schedule condition/extra automations, HA restarts and simultaneous
  actions from multiple devices still have priority/concurrency edge cases.
- Some device domains cannot restore every remembered attribute while off or
  reproduce a transitional state exactly.

The full review is in [docs/quick-timer-v1.4.1-review.md](https://github.com/arozoire/weekly-schedule-card/blob/v1.4.2/docs/quick-timer-v1.4.1-review.md).

Validation: four self-contained bundles built; Node Quick Timer regression tests
passed. This is not validation on the user's actual Home Assistant installation.
