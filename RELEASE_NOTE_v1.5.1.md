# v1.5.1 — Conditional Schedule Controller

Conditional schedules are now controlled by Home Assistant before any command is sent
to the target entity. A true condition applies the scheduled action. A false condition
applies the configured end action, or restores the immutable state captured at the start
of the slot when no end action exists. If the condition is already false at slot start,
the entity is left untouched until a transition requires action.

At the end of a slot, an end action is applied only when configured and when no newer
controller has taken ownership. Without an end action, the current entity state is left
unchanged. Newer normal schedules take priority; Quick Timer temporarily suspends the
conditional controller, which re-evaluates the condition after the timer ends if the slot
is still active.

Snapshots and controller state are persisted in helpers created automatically by the card,
with no manual YAML, token, or helper setup. Existing groups, profiles, manual override,
hysteresis, duplication, and schedule migration remain supported.

The controller is covered by browser/card tests and runtime tests against Home Assistant,
including snapshot restore, retries, restart recovery, unavailable entities, takeover,
Quick Timer pause/resume, overnight slots, hysteresis, and supported entity domains.
