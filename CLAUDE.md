Ecco il CLAUDE.md riscritto per minimizzare i token e massimizzare l'efficienza:

```markdown
# Weekly Schedule Card — Project Context

## Stack
Vanilla JS custom element, **build con Rollup** (IIFE bundle).
`src/*.js` → `npm run build` → `dist/*.js` (2 file IIFE auto-contenuti).
Deploy: copiare `dist/weekly-schedule-card.js` + `dist/weekly-schedule-view-card.js` in HA `/config/www/`.
**NON** copiare `base-card.js` in dist: viene inglobato nel bundle dal rollup.

## Workflow obbligatorio
1. Analizza modifiche necessarie → scrivi piano in `CHANGES.md`
2. Aspetta approvazione
3. Applica SOLO con `str_replace` (mai riscrivere file intero)
4. Elimina `CHANGES.md`
5. `npm run build` (genera IIFE bundle in dist/). MAI `cp src/ dist/` — i sorgenti hanno `import` ES module che HA non risolve senza bundle.

## File struttura
```
src/
  base-card.js                   # classe condivisa, import-ata da entrambe le card
  weekly-schedule-card.js        # card principale con editing (extends base)
  weekly-schedule-view-card.js   # card solo visualizzazione (extends base)
rollup.config.js                 # 2 entry IIFE
dist/
  weekly-schedule-card.js        # IIFE bundle (base + card)
  weekly-schedule-view-card.js   # IIFE bundle (base + view-card)
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

## Auto-off / azione di fine slot (v1.0.6: automazione, NON più child schedule)
Automazione HA `wsc_autooff_<eid>` (`_syncAutoOffAutomation`, storage `link.autoOffAutoId`):
- trigger template `state_attr(eid,'current_slot') is none` (fine slot), condition schedule `state:on`.
- action: `delay 3s` → `condition template` guardia "vince il prossimo schedule" (salta se
  un altro schedule WSC controlla la stessa entità ora) → azioni di fine (`_buildStopActions`).
- Azione di fine ricca per dominio: `ps.stopAction` (tipo) + `ps.stopValue` (valore), storage
  `link.stopAction`/`link.stopValue`. Tipi: turn_on/off, set_temperature, set_hvac/preset/fan/swing_mode,
  set_brightness, set_color (rgb), set_color_temp, set_speed (fan %), set_position/open/close/stop (cover).
- Migrazione: i vecchi child (`autoChildId`, tag `parent:`) vengono rimossi al salvataggio.
  Rimossi `_syncAutoChild`/`_findChildByParentTag`/`_saveAutoChildId`.

## Editor azioni per dominio (v1.0.6)
`_actionFieldsForEntity` non c'è: la logica è in `domainSection` (climate/light/fan/cover/switch) +
`_entityCaps(eid)` (capacità reali: supported_color_modes, percentage, current_position, *_modes).
Azione PRINCIPALE per dominio: climate (temp/hvac/preset/fan/swing), light (on/off + brightness +
**colore rgb** se supportato), fan (on/off + **velocità %**), cover (**apri/chiudi/ferma + posizione %**),
switch (on/off). Builder unico `_buildScheduleActions`. Colore via `_colorPickerHTML` (palette → rgb).

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

8. ~~Logica automazione condizioni → entità target~~ ✅ FATTO (activeActions/inactiveActions tramite `_buildScheduleActions`/`_buildStopActions`, trigger state change su entità condizione, schedule switch resta on)


## Storico ottimizzazioni (sessione 2026-05-28)

### Alta priorità — FATTO
1. **Eliminato `src/core/`** — refactor abbandonato mai importato (5 file, ~140 linee dead code).
2. **Rimosso `LOCALES` + `PALETTE` duplicati** da `src/weekly-schedule-card.js` (~30 linee). Erano già fuori-sync con quelli di `base-card.js` e tree-shaked dal bundle. Eliminato il rischio di drift.
3. **Rimossi 2 `console.log` di debug** in `base-card.js` (`notify check` riga 539, `_syncConditionAutomation` riga 873). Mantenuti `console.error`/`warn` e il log informativo di boot del cleanup orfani.

### Media priorità — FATTO
4. **Estratto `_groupSharedStyles()`** in `base-card.js`: ~30 regole CSS condivise tra `_renderGroupsView` e `_renderGroupEditView`. Bundle -3.3KB per file dopo deduplica.
5. **Sostituiti `alert/confirm/prompt`** con dialog `<dialog>` in shadow DOM (15 occorrenze). Nuovi helper async in `base-card.js`: `_alert`, `_confirm`, `_prompt`, `_openModal`, `_modalStyles`. Aggiunta chiave locale `popup.ok` (en/it/fr). Gestione `Esc`/`Enter`/focus/click-out.
6. **Style persistente fuori da `innerHTML`**: introdotti `_setStyles(key, css)` e `_ensureRoot()` in `WeeklyScheduleBase`. I `render()` ora scrivono in un `<div class="wsc-root">` mentre lo `<style>` resta fratello persistente nello shadowRoot. CSS estratti in getter (`_mainStyles()`, `_tooltipStyles()`, `_groupSharedStyles()`). Niente più re-parse CSS ad ogni render. Tutti i `this.shadowRoot.querySelector*` nei 4 render sono ora `root.querySelector*` (i tooltip e popup `<dialog>` restano sullo shadowRoot e sopravvivono al render).

### Bassa priorità — SKIP (rischio/beneficio non vale)

**Piano valutato ma non implementato.** Decisione: rivalutare in futuro se emerge un caso d'uso che lo giustifica.

- **(7) Spezzare `base-card.js` (2983 linee) in moduli** — estraendo `LOCALES` → `locales.js`, `PALETTE` → `palette.js`, funzioni utility pure (`parseTime`, `minutesToTime`, `getDayIndex`, ecc.) → `time-utils.js`. **Skip**: -150 linee in `base-card.js` non giustificano il rischio di rompere import/binding `this`. Bundle non cambia (Rollup li ribundla comunque). I metodi sono già navigabili tramite i commenti `// ── Sezione ──`.

- **(8) ESLint minimale** (`eslint.config.js` flat config, regole conservative `no-unused-vars`, `no-undef`, `prefer-const`, `no-var`, `eqeqeq` smart, script `npm run lint`). **Skip**: niente bug attivi che un linter avrebbe colto; aggiungere dipendenza + lavoro di triage warning senza un payoff concreto.

- **(9) Render granulare del popup** — invece di buttare via `<dialog>` e ricrearlo ad ogni click di chip/giorno/condizione, aggiornare solo le sezioni interessate (cond-section, notif-section, domain-section). **Skip**: popup ha 800+ linee di interazioni concatenate, rischio medio-alto di regressioni. Il flusso attuale funziona; `_refreshNotifyDefault` e `_refreshNameDefault` già coprono i casi visibili (focus su `.name-input`). Da rivalutare solo se emerge un bug reale di UX (es. focus perso su `cond-val` al cambio entity).

**Quando riconsiderare**: se il file `base-card.js` supera ~4000 linee, o se viene segnalato un bug di focus/scroll nel popup, o se si vuole introdurre testing automatico (a quel punto ESLint diventa utile).


## Last modified
always update last modified date with day an hour Rome utc
2026-06-04 Rome (v1.0.7)

## Fix notifica inizio slot (2026-06-04, v1.0.7)
- La notifica "inizio" non scattava ("fine" sì): i 2 trigger template inversi
  (`slot_start`/`slot_end`) soffrivano dell'arming iniziale. Sostituiti in
  `_syncNotifyAutomation` con **un solo** trigger `state` su attributo `current_slot`
  + `choose` con template `from/to` e filtro `| default(none)` (gestisce attributo
  assente o null). Scatta a ogni cambio → simmetrico inizio/fine.

## Fix notifica automazione + delete-then-recreate (2026-06-04, v1.0.5)
- **Notifica non scattava**: i template usavano `trigger.from_state.attributes.current_slot is none`;
  se lo Scheduler omette l'attributo quando idle → in Jinja è *undefined* e `undefined is none`=False.
  Fix: `_syncNotifyAutomation` usa due **template trigger** con `id` basati su
  `state_attr(eid,'current_slot') is not none / is none` (None per assente o null),
  condition schedule `state:on`, action `choose` per `trigger.id` (start/end).
- **Delete-then-recreate**: nuovo helper `_recreateAutomation(targetId, config)` (DELETE best-effort + POST),
  usato da cond/extras/notify → ogni salvataggio riscrive un'automazione pulita.
- cond e notify restano 2 automazioni separate (`wsc_cond_*` / `wsc_notify_*`).

## Notifiche server-side + pannello "Oggetti collegati" (2026-06-04)
- **Notifiche ora sono automazioni HA** (`_syncNotifyAutomation`, id `wsc_notify_<eid>`):
  funzionano anche con dashboard/HA chiusi. Trigger su `current_slot`, `choose`
  inizio/fine (template su transizione none↔valore) secondo `notifyTrigger`,
  azione `notify.xxx`. Storage: `link.notifyAutoId`.
  - Rimosso l'invio in-browser `_checkNotifyTriggers` (era il vecchio limite).
  - Pulizia integrata in `_deleteSchedule`/`_deleteProfile`/`_cleanupOrphanAutomations`.
- **Pannello "🔧 Oggetti collegati"** in fondo al popup (solo edit): figlio auto-off +
  automazioni cond/extra/notify, con badge stato (`on`/`off`/`mancante`) e azioni
  **Apri** (`hass-more-info`) / **Modifica YAML** (`/config/automation/edit/<id>`).
  Helper `_linkedObjectsHtml`/`_linkRow`. i18n: blocco `linked` (en/it/fr).
- **Restyle chip profilo** (editing card): più piccole (h24), accento barra a sinistra
  + tinta a gradiente `--pchip-color`, stati viewed/active più saturi.
- **Fix dropdown chip** (editing card): `.chip-dropdown` `position:fixed` + posizione
  via JS (`getBoundingClientRect`) per uscire dall'overflow di `.hdr-row2`.

## Fix delete-profile orphans (2026-06-03)
- `_deleteProfile` ora pulisce per ogni `scheduleLink`: `condAutoId`/`extrasAutoId` (DELETE automation) + `autoChildId` (`scheduler.remove`) prima dei parent. Prima lasciava orfani figli auto-off e automazioni.
- `_cleanupOrphanAutomations` potenziato: (a) elimina anche `autoChildId` quando il parent è orfano; (b) aggiunta scansione per tag `parent:<eid>` che rimuove i figli auto-off il cui parent non è più in `hass.states` (cattura orfani da profili interi cancellati, non più tracciati in storage).

## Fix auto-off (2026-06-02)
- **Root cause sintomo B** ("non si spegne quando dovrebbe"): `_activateProfile` (esclusivo) faceva `switch.turn_off` su tutti gli `switch.schedule_*` non in `pr.schedules`. I child auto-off vivono in `pr.scheduleLinks[].autoChildId` → venivano spenti dallo switch profilo e mai riaccesi. Fix: includere `autoChildId` nel set `profSched` e fare `switch.turn_on` su `link.autoChildId` di questo profilo dopo i parent.
- **Fix #6 collaterale**: `_syncAutoChild` create branch usava `_waitForNewSchedule` by-diff (3s) → race con HA lento o create concorrenti → child orfani non tracciati → duplicati al successivo edit. Sostituito con nuovo helper `_findChildByParentTag(parentEid)` che cerca per tag univoco `parent:<eid>` (12 tentativi × 500ms = 6s).