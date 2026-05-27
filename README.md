# weekly-schedule-card

Visual weekly schedule card for Home Assistant with drag-and-drop time slots and color-coded presets.

## Two cards

This repository ships two Lovelace custom cards from the same codebase:

### `weekly-schedule-card` (editing)
The full-featured card for creating and managing schedules, profiles and groups.

- 7-column weekly grid view
- Create / edit / delete schedules via drag-and-drop popup
- Manage profiles (create, rename, duplicate, delete, exclusive activation)
- Group entities (with shared color and entity picker)
- Auto-off / auto-on (1-min child schedule)
- Conditions on schedule activation (generates HA automations)
- Notifications when a schedule fires
- Includes the `weekly-schedule-mini-card` for "currently active" status

### `weekly-schedule-view-card` (visualization)
Read-only by default, optimized for dashboards and wall displays.

- Three views: `focus` (vertical timeline, default), `compact` (collapsible days),
  `rows` (horizontal Gantt per day)
- Toggle view via header button (cycle focus → compact → rows → focus)
- Read profiles list with one-click activate / deactivate
- Click on a schedule block → opens the **same edit popup** as the editing card
- Click on empty area → opens create popup
- Hover tooltip with schedule details
- Live "time-now" line
- No profile creation / no group management

## Installation

### Via HACS
HACS will install `dist/weekly-schedule-card.js` automatically.

### Add the view-card as second resource
HACS currently supports only one bundle per repo, so you have to add the
view-card manually as a Lovelace resource:

1. Go to **Settings → Dashboards → Resources** (or your `configuration.yaml` /
   `lovelace.yaml` resources section).
2. Add a new resource of type `module` pointing to:
   ```
   /hacsfiles/weekly-schedule-card/weekly-schedule-view-card.js
   ```
3. Refresh.

After that you can use both card types in Lovelace:

```yaml
type: custom:weekly-schedule-card        # editing card
# or
type: custom:weekly-schedule-view-card   # view-only card
```

## Configuration

Same YAML schema for both cards (the view card simply ignores editing-specific options):

```yaml
type: custom:weekly-schedule-card
title: "Weekly Schedule"          # optional
language: it                      # optional, auto-detect from HA otherwise
time_step: 15                     # optional, minutes snap
entities:                         # configurable from UI as well
  - entity: climate.bedroom
    name: "Bedroom"
    color: "#F44336"
temperature:
  min: 5
  max: 80
  slider_max: 35
notifications:
  service: notify.mobile_app_phone
```

## Quick test in HA

Minimal setup (no HACS needed for local testing):

1. **Copy bundles** to your HA config:
   ```
   dist/weekly-schedule-card.js       → /config/www/weekly-schedule-card.js
   dist/weekly-schedule-view-card.js  → /config/www/weekly-schedule-view-card.js
   ```
   (or use `npm run deploy` if `/config/www/` is mounted locally)

2. **Register both resources** in HA → Settings → Dashboards → Resources (or YAML):
   ```yaml
   resources:
     - url: /local/weekly-schedule-card.js
       type: module
     - url: /local/weekly-schedule-view-card.js
       type: module
   ```

3. **Hard refresh** the browser (Ctrl/Cmd + Shift + R) to bust the cache.

4. **Minimal dashboard card** (editing version):
   ```yaml
   type: custom:weekly-schedule-card
   title: Test schedule
   entities:
     - entity: switch.test_switch
       name: Test
       color: "#03A9F4"
   ```

5. **Same entities, visualization version**:
   ```yaml
   type: custom:weekly-schedule-view-card
   title: Test schedule view
   entities:
     - entity: switch.test_switch
       name: Test
       color: "#03A9F4"
   ```

### Smoke-test checklist
- [ ] Editing card mostra la griglia 7 colonne
- [ ] Click su una cella vuota apre il popup di creazione schedule
- [ ] Crea uno schedule (giorni + slot orario) → appare un blocco colorato
- [ ] Click sul blocco apre il popup di modifica
- [ ] View card mostra la stessa schedule in vista `focus`
- [ ] Toggle vista nella view card cicla `focus → compact → rows`
- [ ] Hover su blocco → tooltip
- [ ] Click vuoto nella view card → popup di creazione (stesso della editing card)
- [ ] Status bar view card mostra "Stai visualizzando: default ● Attivo"

### Troubleshooting
- **Card non appare / errore custom element**: controlla che entrambe le risorse siano registrate e fai hard refresh.
- **Schedule non si vedono**: verifica che il [Scheduler Component](https://github.com/nielsfaber/scheduler-component) sia installato (richiesto).
- **Popup non si apre nella view card**: controlla la console per errori — il popup è ereditato dalla editing card, deve avere `_openEditPopup` definito (lo ha via `extends WeeklyScheduleBase`).

## Development

```bash
npm install
npm run build      # one-shot build into dist/
npm run watch      # watch mode
npm run deploy     # build + copy dist/*.js to /config/www/ (local HA dev)
```
