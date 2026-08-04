# Profile model roadmap

This note captures the intended future behavior for parallel profiles. It is not yet implemented.

## Profile types

### Exclusive profile
- Only one exclusive profile can be active at any moment.
- Activating an exclusive profile deactivates every other active profile.
- Schedule creation/editing should not show schedules from unrelated exclusive profiles in the time-slot guide.

### Parent profile
- Only one parent profile can be active at any moment.
- Activating a parent profile deactivates other parents and unrelated profiles.
- When a parent is active, its child profile may also be active.
- If a parent schedule conflicts with a child schedule on the same entity and overlapping time range, the parent wins.
- A parent/child conflict is resolved by disabling the whole conflicting child schedule.

### Child profile
- A child profile belongs to exactly one parent profile.
- A parent can have at most one child profile.
- A child can be active or inactive independently while its parent is active.
- A child cannot be active without its parent.
- If the parent is deactivated, the child is also deactivated.
- Creating a child profile must ask which parent profile is its parent.

## Time-slot guide behavior

- When editing or creating a schedule in an exclusive profile, the time-slot guide should show only schedules from that same profile.
- It should not show schedules from other exclusive profiles, such as showing summer schedules while editing winter.
- Cross-profile time-slot guide visibility should be kept only for a related parent/child pair.

## Current interim behavior

Until the parent/child model is implemented, overlap checks and time-slot guide blocks are scoped to the currently selected profile.
This allows schedules in different profiles to overlap without blocking creation, while still preventing overlaps inside the same profile.
