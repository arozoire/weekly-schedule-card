# v1.4.1 — Quick Timer temporary schedule

## No manual server setup

Remove any previously installed `wsc_quick_timer.yaml` package and the
`wsc_qt_authorization` secret if they are used only by Weekly Schedule Card.
Quick Timer no longer requires either one.

## Changes

- **Start** now creates an independent temporary Scheduler entity and executes its
  configured actions with `scheduler.run_action`.
- The existing card interface is unchanged: choose the entity settings and duration,
  then press **Start**.
- At expiry, a generated controller automation restores the complete captured state,
  removes the temporary schedule and disables itself. The card deletes that disabled
  automation immediately while open, or on its next load.
- **Cancel** restores immediately and removes both generated objects.
- A matching normal schedule entering a slot wins: Quick Timer ends without restoring.
- Temporary Quick Timer schedules are excluded from profiles, groups, profile switching,
  weekly views, duplication and Default-profile adoption.
- Home Assistant restart recovery and restore retries remain server-side.
