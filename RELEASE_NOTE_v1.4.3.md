# v1.4.3 — Local Quick Timer settings, applied only at Start

The user reported that v1.4.2 still changed the real entity while editing.
This release removes embedded HA controls and the proxy/context workaround.

- Select duration and settings using the Quick Timer's own HTML controls.
- Editing changes only the local draft. **Start timer** snapshots the real state
  and applies the chosen actions.
- Climate mode, temperature, fan, preset and swing controls use device capabilities.
  Light, fan, cover/valve, lock, humidifier, water heater and switch controls remain.
- During a timer the settings are read-only. **Cancel** restores the original state.
- Legacy `card:` / `tile:` configurations no longer load custom/native HA cards or
  actions. Their `name` remains a title fallback; other embedded-card options are ignored.
- Tests exercise actual browser inputs and clicks with spies on HA write methods,
  including Start, Cancel, state changes during editing, and legacy configurations.

Update through HACS and reload dashboard resources. The editor should now show
“Settings during the timer” (or the translated label), with local input/select
fields. No YAML package, token or secret is needed.

This fixes the editor boundary. Previously documented startup, multi-device,
schedule-interference and controller-self-deletion limitations remain unchanged:
[full review](https://github.com/arozoire/weekly-schedule-card/blob/v1.4.3/docs/quick-timer-v1.4.1-review.md).
