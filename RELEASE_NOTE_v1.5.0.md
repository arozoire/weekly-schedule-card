# v1.5.0 — Linear Quick Timer UI

The Quick Timer now uses wrapping mode buttons with icons and sliders with precise
numeric inputs instead of settings dropdowns. Controls follow the entity's available
modes and limits. Named climate fan speeds stay named; percentage fans respect their
speed steps. Presets, swing, effects and direction are under More options.

The real state is displayed separately. Editing remains local until Start; cancellation,
restore, schedule priority, profiles/groups and the existing server controller are preserved.
Off/Fan-only selections discard hidden temperature commands. Light brightness zero means
off, and choosing On again prepares a positive brightness.

Duration supports slider stops, configured presets, custom minutes and Until mode.
No extra Home Assistant configuration, package or token is needed for this UI update.
The existing lifecycle limitations documented in docs/quick-timer-v1.4.1-review.md still apply.
