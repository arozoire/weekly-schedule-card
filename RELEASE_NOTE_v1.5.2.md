# v1.5.2 — Profile storage protection and confirmed reset

This maintenance release prevents unreadable shared profile storage from being
mistaken for a new installation and overwritten with a Default profile.

## Changes

- Preserve existing profile data when helper states are missing, unavailable,
  malformed or read during Home Assistant startup; retry instead of replacing it.
- Validate server-side storage and legacy migration before creating Default.
- Preserve valid in-memory profile data during temporary read failures.
- Add an administrator-only reset in **Groups**, protected by an inventory export,
  Home Assistant backup acknowledgement, the exact phrase `CANCELLA TUTTO`, and
  an explicit destructive click.
- Stop generated controllers before reset deletion without sending end actions or
  device restores. Persist the inventory so an interrupted reset can be resumed.
- Preserve unassigned Scheduler entries, unrelated Home Assistant objects and
  dashboard configuration.
- Refresh Quick Timer state safely when reset maintenance ends.
- Add profile-storage, reset lifecycle and Chromium confirmation tests.

## Important

This update prevents the confirmed destructive fallback but cannot reconstruct
profile names or memberships that were already overwritten. Preserve and inspect
the WSC helper values and a pre-incident Home Assistant backup before using reset.

The reset export is diagnostic evidence, not a complete importable backup. Close
other dashboards before resetting; the browser guard is not a server-side lock.

Validation passed in GitHub Actions, including Chromium UI tests and the
conditional-controller runtime suite on Home Assistant 2026.9.2.
