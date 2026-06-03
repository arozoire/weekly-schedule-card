# Weekly Schedule Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![ha](https://img.shields.io/badge/Home%20Assistant-2024.x+-41BDF5.svg)

<a href="https://www.buymeacoffee.com/arozoire" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40">
</a>

A visual weekly schedule card for Home Assistant — drag-and-drop time slots,
color-coded profiles, multi-entity groups, conditions and notifications,
all on top of the [Scheduler Component](https://github.com/nielsfaber/scheduler-component).

<p align="center">
  <img src="docs/images/01-compact.png" alt="Weekly Schedule Card — compact view" width="520">
</p>

---

## Highlights

- **Two cards from one codebase** — full editor + read-only dashboard view
- **Four editing layouts**: `columns`, `rows`, `compact`, `focus`
- **Profiles** with one-click activation and automatic exclusivity rules
- **Entity groups** with shared color and bulk management
- **Auto-off / auto-on** via paired 1-minute child schedules
- **Conditions** that compile to a generated HA automation (since the
  Scheduler Component does not support `conditions` natively)
- **Notifications** when a schedule fires (with smart default message)
- **Climate, light, switch** domains with per-domain popup controls
- **i18n**: English, Italian, French (auto-detect from HA locale)

---

## The two cards

This repository ships **two** Lovelace custom elements built from the same source.

### `weekly-schedule-card` — editing

The full-featured card for creating and managing schedules.

- 4 layouts: `columns` (7-column grid), `rows` (per-day timelines),
  `compact` (mobile, collapsible days), `focus` (one day expanded with
  per-entity lanes)
- Click an empty cell → create-schedule popup
- Click a block → edit-schedule popup
- Drag to resize time slots, snap configurable via `time_step`
- Profile creation / rename / duplicate / delete / exclusive activation
- Group entities (shared color, entity picker)
- Inline conditions and notifications per schedule

<p align="center">
  <img src="docs/images/03-focus.png" alt="Editing card — focus layout" width="520">
</p>

<p align="center">
  <img src="docs/images/07-schedule.png" alt="Create / edit schedule popup" width="420"><br>
  <sub><b>Create / edit schedule popup</b></sub>
</p>

### `weekly-schedule-view-card` — visualization

Read-only by default, optimized for dashboards and wall displays.

- 3 layouts: `focus` (default), `compact`, `rows`
- Toggle layout with the header button (cycles `focus → compact → rows`)
- Read profile chips with one-click activate / deactivate
- Click a block → opens **the same edit popup** as the editing card
- Hover for tooltip with schedule details
- Live "time-now" line
- No profile creation, no group management

<table>
  <tr>
    <td align="center">
      <img src="docs/images/02-column.png" alt="View card — vertical timeline columns" width="380"><br>
      <sub><b>Vertical timeline</b></sub>
    </td>
    <td align="center">
      <img src="docs/images/04-rows.png" alt="View card — rows layout" width="380"><br>
      <sub><b>Per-day rows</b></sub>
    </td>
  </tr>
</table>

### `weekly-schedule-mini-card` — currently active

A compact status card bundled with the editing card. Shows what's running
right now, grouped by parent entity, with live attribute values.

<p align="center">
  <img src="docs/images/05-mini.png" alt="Mini card — active schedules" width="480">
</p>

---

## Installation

### Via HACS (recommended)

1. Add this repository as a **Custom Repository** in HACS → Frontend.
2. Install. HACS will deploy the editing bundle automatically.
3. The view card is shipped in the same repo but as a **second bundle**.
   HACS currently exposes only one resource per repo, so add the view card
   as an extra Lovelace resource (see below).

### Manual

Copy both bundles from `dist/` into your HA config:

```
dist/weekly-schedule-card.js       →  /config/www/weekly-schedule-card.js
dist/weekly-schedule-view-card.js  →  /config/www/weekly-schedule-view-card.js
```

### Register both resources

Go to **Settings → Dashboards → Resources** (or your `lovelace.yaml`):

```yaml
resources:
  - url: /hacsfiles/weekly-schedule-card/weekly-schedule-card.js
    type: module
  - url: /hacsfiles/weekly-schedule-card/weekly-schedule-view-card.js
    type: module
```

For local `/config/www/` deployments use `/local/...` instead of `/hacsfiles/...`.

Hard-refresh the browser (Ctrl/Cmd + Shift + R) after registering.

---

## Configuration

Both cards share the same YAML schema; the view card silently ignores
editing-only fields.

```yaml
type: custom:weekly-schedule-card        # or weekly-schedule-view-card
title: "Weekly Schedule"                 # optional
language: it                             # optional, auto-detected from HA
default_view: columns                    # optional
time_step: 15                            # optional, minutes snap
entities:                                # also configurable from the UI
  - entity: climate.bedroom
    name: "Bedroom"
    color: "#F44336"
  - entity: switch.irrigation
    name: "Garden"
    color: "#4CAF50"
temperature:
  min: 5
  max: 80
  slider_max: 35
notifications:
  service: notify.mobile_app_phone
```

### Options

| Field                  | Type            | Default       | Notes |
|------------------------|-----------------|---------------|-------|
| `title`                | string          | _(none)_      | Header title |
| `language`             | `en` / `it` / `fr` | auto       | Falls back to HA locale, then browser |
| `default_view`         | `columns` / `rows` / `compact` / `focus` | `columns` | Initial layout (editing card) |
| `time_step`            | integer (min)   | `15`          | Snap interval for drag |
| `entities[]`           | list            | `[]`          | Can also be edited from the card UI |
| `entities[].entity`    | entity_id       | _required_    | Climate / light / switch |
| `entities[].name`      | string          | entity name   | Override label |
| `entities[].color`     | hex             | from palette  | Block color |
| `temperature.min`      | number          | `5`           | Slider lower bound (°C) |
| `temperature.max`      | number          | `80`          | Manual input upper bound (°C) |
| `temperature.slider_max` | number        | `35`          | Slider upper bound (°C) |
| `notifications.service`| service id      | _(none)_      | Pre-fills notify service in the popup |

---

## Data model — what lives where

This is the most common source of confusion. The card YAML is **presentation
only**. Schedules themselves are not in the YAML — they are first-class HA
entities owned by the [Scheduler Component](https://github.com/nielsfaber/scheduler-component).

| Layer | Owner | Storage | What it holds |
|-------|-------|---------|---------------|
| Presentation | this card | Lovelace YAML | Which entities to render, colors, layout, language, popup defaults |
| Schedules | Scheduler Component | `switch.schedule_*` entities | `weekdays`, `timeslots`, `entities`, `actions`, `current_slot` |
| Profiles & groups | this card | `input_text.weekly_schedule_profiles_N` | JSON, chunked at 255 chars/helper, auto-rotated (N = 0, 1, 2, …) |
| Conditions | this card | `automation.wsc_*` (generated) | One HA automation per conditional schedule, lifecycle-bound to it |
| Auto-off / auto-on | this card | `switch.schedule_*` (child, tagged) | 1-minute child schedule, `tags: ['weekly_schedule_auto', 'parent:switch.schedule_XXX']` |

**Implication for users**: deleting a `switch.schedule_*` entity from HA
removes the schedule globally — the card just reflects HA state.
Conversely, schedules created from anywhere (UI, service call, another
integration) appear in the card automatically as long as their target
`entity_id` is in the card's `entities` list.

---

## Where schedules live (and how to create one without the UI)

Schedules are stored as `switch.schedule_*` entities by the Scheduler
Component. The card calls `hass.callService('scheduler', 'add'|'edit'|'remove', ...)`
under the hood — you can call the same services yourself from
**Developer Tools → Services**, scripts, or automations.

### Create a schedule

```yaml
service: scheduler.add
data:
  entity_id: climate.bedroom
  weekdays: [mon, tue, wed, thu, fri]
  timeslots:
    - start: "08:00:00"
      stop: "22:00:00"
      actions:
        - service: climate.set_temperature
          entity_id: climate.bedroom
          service_data:
            temperature: 21
```

### Edit a schedule

```yaml
service: scheduler.edit
data:
  entity_id: switch.schedule_abc123     # existing schedule
  weekdays: [sat, sun]
  timeslots: [...]                       # new slots replace old ones
```

### Remove a schedule

```yaml
service: scheduler.remove
data:
  entity_id: switch.schedule_abc123
```

### Fields the Scheduler Component does NOT accept

These belong inside `timeslots[]` but **will be rejected** if you try to
include them — this card works around the limitation:

| Missing feature | Workaround built into this card |
|-----------------|---------------------------------|
| `conditions` per slot | Generates an HA automation (`automation.wsc_*`) that gates the schedule's actions |
| `stop_action` per slot | Creates a paired 1-minute child schedule tagged `weekly_schedule_auto` |

See [Conditions & Notifications](#conditions--notifications) and
[Auto-off / Auto-on](#auto-off--auto-on) for the full mechanism.

---

## Domain support

| Domain | Popup controls | Action service |
|--------|----------------|----------------|
| `climate` | temperature slider (5–80 °C, manual input up to 100 °C), `hvac_mode`, `preset_mode`, `fan_mode`, `swing_mode` (optional) | `climate.set_temperature` (+ mode services if set) |
| `light`   | on/off + optional `brightness` slider | `light.turn_on` (with `brightness_pct`) / `light.turn_off` |
| `switch`  | on/off toggle | `switch.turn_on` / `switch.turn_off` |
| _other_   | recognized as `unknown`; basic on/off only | `homeassistant.turn_on` / `turn_off` |

The popup adapts at render time via `_detectDomain(entity_id)`. The
toggle in the popup also calls `switch.turn_on/off` immediately for
preview, and saves the final action set via `scheduler.edit`.

### Examples by domain

**Climate** (heating 18 °C on weekdays, 21 °C on weekends):

```yaml
service: scheduler.add
data:
  entity_id: climate.bedroom
  weekdays: [mon, tue, wed, thu, fri]
  timeslots:
    - start: "07:00:00"
      stop: "23:00:00"
      actions:
        - service: climate.set_temperature
          entity_id: climate.bedroom
          service_data: { temperature: 18 }
```

**Light** (evening dim):

```yaml
service: scheduler.add
data:
  entity_id: light.living_room
  weekdays: [mon, tue, wed, thu, fri, sat, sun]
  timeslots:
    - start: "20:00:00"
      stop: "23:30:00"
      actions:
        - service: light.turn_on
          entity_id: light.living_room
          service_data: { brightness_pct: 40 }
```

**Switch** (irrigation 06:00–06:15):

```yaml
service: scheduler.add
data:
  entity_id: switch.irrigation
  weekdays: [mon, wed, fri]
  timeslots:
    - start: "06:00:00"
      stop: "06:15:00"
      actions:
        - service: switch.turn_on
          entity_id: switch.irrigation
```

---

## Quick start

Smallest possible setup (after installing the resources):

```yaml
type: custom:weekly-schedule-card
title: Test schedule
entities:
  - entity: switch.test_switch
    name: Test
    color: "#03A9F4"
```

Same entities, view-only:

```yaml
type: custom:weekly-schedule-view-card
title: Test schedule view
entities:
  - entity: switch.test_switch
    name: Test
    color: "#03A9F4"
```

### Smoke-test checklist

EN:

- [ ] Editing card renders the 7-column grid
- [ ] Click on an empty cell opens the create-schedule popup
- [ ] Create a schedule (days + slots) → colored block appears
- [ ] Click on the block opens the edit popup
- [ ] View card shows the same schedule in `focus` layout
- [ ] Layout toggle on the view card cycles `focus → compact → rows`
- [ ] Hover on a block → tooltip
- [ ] Empty click on the view card → create popup (shared with editing card)
- [ ] View card status bar shows `Viewing: default · Active`

IT:

- [ ] La editing card mostra la griglia 7 colonne
- [ ] Click su una cella vuota apre il popup di creazione schedule
- [ ] Crea uno schedule (giorni + slot orario) → appare un blocco colorato
- [ ] Click sul blocco apre il popup di modifica
- [ ] View card mostra la stessa schedule in vista `focus`
- [ ] Toggle vista nella view card cicla `focus → compact → rows`
- [ ] Hover su blocco → tooltip
- [ ] Click vuoto nella view card → popup di creazione (stesso della editing card)
- [ ] Status bar view card mostra `Viewing: default · Active`

---

## Profiles & Groups

**Profiles** are named bundles of schedules — think "Summer", "Winter",
"Holiday". Activating a profile enables its schedules; deactivating disables
them. Profiles that share at least one entity become **mutually exclusive**:
activating one auto-deactivates the conflicting ones, so you cannot end up
with two competing setpoints on the same climate.

Profiles are persisted in chunked `input_text.weekly_schedule_profiles_N`
helpers (255 char per chunk, auto-rotated). Practical limit ~10 profiles.

**Groups** bundle entities together inside a profile. They share a color and
appear as a single chip in the toolbar. Useful for "all thermostats" or
"all irrigation valves".

<p align="center">
  <img src="docs/images/06-group.png" alt="Group management and creation" width="380"><br>
  <sub><b>Group management &amp; creation</b></sub>
</p>

Both profiles and groups are managed from the **editing card only** —
the view card lets users *activate* profiles but not create or rename them.

---

## Conditions & Notifications

### Conditions

The Scheduler Component does **not** support `conditions` on timeslots, so
this card emits a dedicated HA automation per conditional schedule. The
automation is created / updated / deleted in lockstep with the schedule.

Mechanism:

- **Trigger**: state change on the condition entity + `time_pattern` every
  N minutes (configurable, default 5)
- **Condition**: `current_slot != null` on the parent schedule switch +
  user-defined conditions (operator + value)
- **Action**: `turn_off` the schedule's target entities if conditions fail,
  `turn_on` if they pass

The schedule switch itself stays `on` — only the downstream actions are
gated. The popup UI adapts to the selected condition entity (numeric slider
for sensors, dropdown for selects, etc.).

### Notifications

Optionally fire a notification when a schedule's slot becomes active. The
message defaults to a pre-filled summary (entity, time window, target
state) which you can customize per schedule.

> ⚠️ Notifications fire from the dashboard client — they only work while a
> Home Assistant tab is open. For 24/7 delivery, build a regular HA
> automation instead.

### Auto-off / Auto-on

Each schedule can spawn a paired **child schedule** (duration 1 min, tagged
`weekly_schedule_auto` + `parent:switch.schedule_XXX`) to turn the entity
off (or on) when the parent slot ends. Children are filtered from the grid,
follow the parent on updates, and are deleted when the parent is removed.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Card not rendering / `custom element doesn't exist` | Both resources registered? Hard refresh? |
| No schedules visible | Install [Scheduler Component](https://github.com/nielsfaber/scheduler-component) (required) |
| Popup doesn't open on view card | Check console — `_openEditPopup` must be inherited from the editing bundle |
| Conditions don't trigger | Check the generated `automation.wsc_*` — it must be enabled |
| Notifications never fire | Dashboard must be open; this is by design |

---

## Development

```bash
npm install
npm run build      # one-shot bundle into dist/
npm run watch      # watch mode
npm run deploy     # build + copy dist/*.js to /config/www/
```

The two bundles are built by Rollup as self-contained IIFEs that inline
`src/base-card.js`. Do **not** copy `src/*.js` directly to HA — the
sources use ES module `import`s that the browser will not resolve without
the bundler. Always deploy from `dist/`.

Source layout:

```
src/
  base-card.js                   # shared class, imported by both cards
  weekly-schedule-card.js        # editing card (extends base)
  weekly-schedule-view-card.js   # view-only card (extends base)
  locales/{en,it,fr}.json        # translations
rollup.config.js                 # two IIFE entries
dist/
  weekly-schedule-card.js        # bundled editing card
  weekly-schedule-view-card.js   # bundled view card
```

---

## Credits

- Built on top of [Scheduler Component](https://github.com/nielsfaber/scheduler-component) by [@nielsfaber](https://github.com/nielsfaber).
- UI conventions and CSS variables follow Home Assistant's design tokens.

## License

MIT
