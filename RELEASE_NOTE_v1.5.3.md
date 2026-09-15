# v1.5.3 — Maintenance, portable backup and safe restore

This release adds an administrator-only **Groups → Maintenance** area for
portable configuration backups, safe restore, conservative orphan cleanup and
the existing full reset.

## Changes

- Download a versioned WSC JSON backup containing profiles, groups, complete
  linked Scheduler configurations, generated WSC automations and conditional
  runtime helper data.
- Restore only into an empty WSC configuration. Schedules are created with a
  future quarantine date, switched off, remapped to their new Scheduler IDs and
  left inactive until a profile is explicitly activated.
- Reset conditional occurrence metadata during restore instead of reusing stale
  snapshots from an old occurrence.
- Add a read-only orphan preview and delete only unreferenced WSC schedules,
  automations and helpers whose ownership is unambiguous.
- Protect objects referenced by retained or ambiguous WSC automations and reject
  cleanup when a candidate changes after the preview.
- Replace the old destructive reset phrase with the exact word `RESET`.
- Recognize and safely regenerate the standard external profile-control helpers
  and automation during restore.

## Safety and limitations

- Backup and cleanup previews are read-only.
- Restore, cleanup and reset do not call target-device domains.
- Restored profiles are inactive and restored schedules remain off.
- Running Quick Timers, device states and dashboard YAML are not included in the
  portable backup.
- Scheduler entity IDs change during restore and all WSC references are remapped.
- Import only trusted JSON backups; the imported schedules become executable
  configuration when a profile is later activated.
- Restore rollback is best-effort if Home Assistant becomes unavailable during
  the operation.

Validation passed in GitHub Actions, including Chromium UI tests and the
conditional-controller runtime suite on Home Assistant 2026.9.2.
