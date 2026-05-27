Ecco il CLAUDE.md riscritto per minimizzare i token e massimizzare l'efficienza:

```markdown
# Weekly Schedule Card — Project Context

## Stack
Vanilla JS custom element, no build step.
`src/weekly-schedule-card.js` → `cp src/ dist/` dopo ogni modifica.
Deploy: copiare `dist/` in HA `/config/www/`.

## Workflow obbligatorio
1. Analizza modifiche necessarie → scrivi piano in `CHANGES.md`
2. Aspetta approvazione
3. Applica SOLO con `str_replace` (mai riscrivere file intero)
4. Elimina `CHANGES.md`
5. `cp src/weekly-schedule-card.js dist/weekly-schedule-card.js`

## File struttura
```
src/
  weekly-schedule-card.js        # card principale con editing
  weekly-schedule-view-card.js   # card solo visualizzazione (WIP)
dist/
  weekly-schedule-card.js        # copia di src/
  weekly-schedule-view-card.js   # copia di src/
```

## Architettura core
```
_entities[]          → lista entità normalizzata (sempre array)
_activeTab           → indice _entities, persiste in localStorage
_popupState          → stato popup; null = chiuso
_profilesMode        → true = render() soppresso, profili gestiscono DOM
_layout              → 'columns'|'rows'|'compact'|'focus', localStorage
_focusDay            → indice giorno espanso in vista focus (0=lun)

_getSchedules(entityId)     → filtra switch.schedule_* per entità
_detectDomain(entityId)     → 'climate'|'light'|'switch'|'unknown'
_scheduleToColor(index)     → colore da palette per indice schedule
_getDayIndex(weekday)       → stringa → indice 0-6 (0=lun, 6=dom)
_parseTime(str)             → "HH:MM:SS" → minuti totali
```

## Convenzioni CSS critiche
- Blocchi: `background-color` inline + `background-image` da classe CSS
  → permette overlay pattern `.off` senza conflitti
- `.block.off` → stripes diagonali sottili + opacity 0.5
- `.block.active-now` → pulse glow animation
- Sempre CSS variables HA per colori: `var(--primary-color)` ecc.

## Scheduler Component API
```javascript
// Lettura
hass.states['switch.schedule_XXX'].attributes
// → { weekdays, timeslots, entities, actions, current_slot }

// Scrittura
hass.callService('scheduler', 'add', { entity_id, weekdays, timeslots })
hass.callService('scheduler', 'edit', { entity_id, weekdays, timeslots })
hass.callService('scheduler', 'remove', { entity_id })

// IMPORTANTE: timeslots NON supporta 'conditions' o 'stop_action'
// Usare automazioni HA separate per condizioni
// Usare schedule figlio (1 min, tagged) per auto-off
```

## Auto-off/auto-on
Schedule figlio separato, durata 1 min, tagged:
```javascript
tags: ['weekly_schedule_auto', 'parent:switch.schedule_XXX']
```
- Invisibile nella griglia (filtrato per tag)
- Eliminato automaticamente se eliminato il parent
- Aggiornato se cambia orario fine del parent

## Condizioni
Non supportate da Scheduler Component → automazione HA generata:
```javascript
// Trigger: state change + time_pattern ogni N min
// Condition: current_slot !== null + condizioni utente
// Action: turn_off se condizioni non soddisfatte, turn_on se soddisfatte
// Storage: { scheduleId, automationId, conditions, interval }
```

## Profili storage
JSON in chunk 255 char su `input_text.weekly_schedule_profiles_N`.
```javascript
{
  profiles: [{
    id, name, exclusive, active,
    groups: [{ id, name, color, entities[] }],
    schedules: ['switch.schedule_XXX'],
    conditionAutomations: { 'switch.schedule_XXX': 'automation.wsc_XXX' }
  }],
  activeProfiles: ['profile_id']
}
```
Regola esclusività: profili con entità in comune → esclusivi tra loro.

## Popup domini
```
climate → temperature (slider 5-80°C, input manuale fino 100°C)
          hvac_mode, preset_mode, fan_mode, swing_mode (opzionali)
light   → on/off + brightness slider opzionale
switch  → on/off
```
Toggle on/off in popup chiama `switch.turn_on/off` immediatamente.
Save chiama `scheduler.edit` con azioni aggiornate.

## Viste disponibili (weekly-schedule-card)
```
columns  → griglia 7 colonne, editing principale
rows     → righe per giorno
compact  → giorni collassabili, mobile-first
focus    → giorno espanso + colonne slim, corsie per entità multiple
```
Toggle ciclico: columns → rows → compact → focus → columns

## Viste disponibili (weekly-schedule-view-card)
```
focus    → solo visualizzazione, default
compact  → giorni collassabili
rows     → righe per giorno
```
Nessun editing, nessun profilo, nessun gruppo.
Click blocco → more-info switch.schedule_*.

## I18n
Lingue: en, it, fr.
Rilevamento: config.language → hass.language → navigator.language → 'en'.
File: `src/locales/en.json`, `it.json`, `fr.json`.

## Bug noti / limitazioni
- Scheduler Component non supporta `conditions` nei timeslots
- Scheduler Component non supporta `stop_action` nei timeslots
- Notifiche funzionano solo con dashboard aperta (no automazioni server-side)
- Profili: limite pratico ~10 profili per vincolo 255 char input_text

## Config YAML completa
```yaml
type: custom:weekly-schedule-card
title: "Weekly Schedule"        # opzionale
language: "it"                  # opzionale, auto-detect
default_view: "columns"         # opzionale
time_step: 15                   # opzionale, snap minuti
entities:                       # opzionale, configurabile da UI
  - entity: climate.ma_piece
    name: "Camera"
    color: "#F44336"
temperature:
  min: 5
  max: 80
  slider_max: 35
notifications:
  service: notify.mobile_app_telefono
```

## Da fare (prossime sessioni)
1. ~~Fix condizioni (errore extra keys) → automazioni HA~~ ✅ FATTO
2. Rivalutazione condizioni periodica (time_pattern ogni N min) — già parte di _syncConditionAutomation
3. ~~Dividere in due card~~ ✅ FATTO
4. Eliminare viste focus/compact/rows da editing card (dead reachable code, ora innocue)
5. ~~Notifica default pre-compilata con info schedule~~ ✅ FATTO
6. README documentazione completa (parziale, sezione Two cards aggiunta)
7. ~~UI condizioni adattiva all'entità selezionata~~ ✅ FATTO (helper `_getCondFieldSpec` + dispatcher condBodyHtml + listener re-render su entity/attribute change)



## Last modified
always update last modified date with day an hour Rome utc
2026-05-27 14:03 Rome