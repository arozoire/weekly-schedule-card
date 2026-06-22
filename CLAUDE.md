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

## ⚠️ Schedule = MONO-ENTITÀ (invariante)
Ogni `switch.schedule_*` creato da WSC controlla **UNA sola entità** (`ps.entityId`):
`_buildScheduleActions(ps)` costruisce tutte le azioni su un singolo `eid`, e
`_getSchedules(entityId)` filtra per singola entità. Il multi-entità esiste **solo**
a livello di **profili/gruppi**, MAI nel singolo schedule. (Lo Scheduler Component
supporterebbe più entità per timeslot, ma WSC non lo usa.)

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

## Condizioni (event-driven + isteresi — WIP, da testare in HA)
Non supportate da Scheduler Component → automazione HA generata (`wsc_cond_*`).
**EVENT-DRIVEN** (niente più `time_pattern`/polling): trigger su inizio/fine slot
(`current_slot`) + cambio **stato E attributo** delle entità-condizione → gira solo quando serve.
- Condition top-level (no-override): `state != 'off'` + `current_slot != None` (in-slot).
- Action: `_buildScheduleActions` se condizioni soddisfatte, `_buildStopActions` se no.
- **Isteresi (banda morta)**: per condizioni numeriche, `c.hysteresis` (assoluta) o default
  **5% del valore**; 0 = soglia secca. `_buildHACondition(c, activeExpr)` genera una
  `condition: template` *stateful*: la soglia dipende se l'azione attiva è già applicata
  (`_hysteresisActiveExpr(ps)`: `is_state(target,on/off)` per switch/light/fan, `temperature ==`
  per climate; null per cover/altro → niente isteresi). Es. `<60` banda 3 → bagna sotto 57, ferma sopra 63.
- `condInterval` resta nello storage (legacy, non più usato per i trigger); dropdown UI rimosso.
- UI: campo `± tolleranza` (`.cond-hyst`) accanto al valore solo per condizioni numeriche.

## Manual override (v1.1.0) — solo schedule CON condizioni
Toggle per-schedule "Consenti override manuale" (`link.overrideEnabled`), visibile nella
sezione condizioni del popup (abilitato solo se ≥1 condizione). Mono-entità → per-entità.
Idea: se l'utente cambia a mano l'entità durante uno slot, lo schedule smette di ri-applicare
il suo valore (direzione ATTIVA) fino al prossimo slot; la direzione SAFETY (condizione falsa
→ spegni/stop) resta sempre attiva. Schedule SENZA condizioni: niente (lo Scheduler tiene già
l'override nativamente — esegue l'azione solo alla transizione, non mid-slot).

**Flag = automazione-segnaposto** (NO input_boolean): `wsc_ovrflag_<slug>`
(`_syncOverrideFlag`, storage `link.overrideFlagAutoId`), trigger `{{ false }}` (non scatta mai),
`initial_state:true` → **override azzerato a ogni riavvio HA** (lo Scheduler ri-applica lo slot
al boot, inutile combatterlo). Stato `'on'` = nessun override · `'off'` = override attivo.
Letto in Jinja con `states('automation.wsc_ovrflag_<slug>') != 'off'` (unknown/mancante = no-override, fail-safe).

**`_syncConditionAutomation` con `overrideOn`** (= `ps.overrideEnabled && activeActions`):
trigger con `id` (`slot` = current_slot/turn_on, `eval` = time_pattern+entità cond,
`manual` = entità target), top-level condition rilassata (solo `state != 'off'`; in-slot per ramo),
`mode: queued`. Action `choose`:
- ramo **manual+detect** (v1.2.1 VALUE-BASED): in-slot + **condizione soddisfatta** (`condMetPlain`,
  versione senza isteresi) + `parent_id is none AND not(matchExpr)` + flag non già off → `automation.turn_off`
  flag. `matchExpr` = `_activeValueMatchExpr(ps)` (TRUE se l'entità è già al valore attivo: on/off,
  climate temp/hvac, cover pos/stato — dimensioni ESATTE). Override = cambio root-context (UI **o**
  fisico) verso un valore ≠ attivo; l'apply dello Scheduler porta al valore attivo → escluso (NIENTE
  falso positivo). Se `matchExpr` è null (cover stop/dominio esotico) → fallback solo-UI:
  `parent_id is none AND user_id is not none`. **Rimossa la racy guardia 5s su `last_changed`.**
- ramo **manual no-op**: ogni altro trigger `manual` (cambio "macchina": nostro o scheduler) → `[]`
  (evita il fall-through al re-apply del default).
- ramo **slot**: `automation.turn_on` flag (reset) + se in-slot → met→active / not-met→inactive.
- **default (eval)**: se in-slot → SAFETY (not-met→inactive) sempre; ATTIVA (met & flag!=off) solo senza override.

**UI/cleanup**: riga "Flag override" in `_linkedObjectsHtml` (badge attivo/nessuno + pulsante
**Annulla override** = `automation.turn_on` flag + `automation.trigger` cond). DELETE del flag in
`_deleteSchedule`/`_deleteProfile`/`_cleanupOrphanAutomations`. i18n blocco `override` + `linked.override_flag`.

**⚠️ entity_id da ALIAS, non da object_id (fix v1.1.1)**: HA deriva l'`entity_id` di
un'automazione dallo slug dell'**alias**, NON dall'object_id con cui la si crea via config API.
Alias `WSC Override flag - <eid>` → entity `automation.wsc_override_flag_<eid con . → _>`.
`_overrideFlagEntityId` DEVE restituire questo (non `wsc_ovrflag_<slug>`), altrimenti
template/turn_off puntano a un'entità inesistente e l'override non scatta mai. Stesso motivo:
"Annulla override" risolve l'automazione condizioni via `attributes.id` a runtime, non costruendo
`automation.<id>`. (`initial_state:true` + trigger `{{ false }}` + `action:[]` accettati: OK.)

**✅ RISOLTO (v1.2.1)**: l'apply dello Scheduler a inizio slot è un contesto ROOT (`parent_id is None`,
identico a un cambio manuale) e la guardia 5s era racy (`last_changed` non cambia su slot back-to-back;
race `slot`=flag-on vs falso `manual`=flag-off in `mode: queued`) → su alcuni schedule il flag restava
`off` e con condizione poi vera l'ATTIVA non ripartiva. Fix: rilevamento **value-based** (sopra) — niente
più `parent_id`+5s da soli. Limiti: override fine su brightness/color/speed NON rilevato; cover stop /
domini esotici → detect solo da UI (`user_id`); cover position con tolleranza ±2 + guardia opening/closing.

## Profili storage — CONDIVISO tra utenti (input_text globali, v1.1.8)
Persistenza in helper **`input_text` GLOBALI** (stati condivisi tra TUTTI gli utenti HA,
persistenti al riavvio), NON più `frontend/set_user_data` per-utente (era il bug "su un
secondo account/iPhone non compaiono gruppi/schedule"). Dato il limite 255 char/helper:
`JSON → compressToBase64 (src/lz-string.js) → split in chunk ≤255` → `input_text.wsc_store_0..N-1`,
con `input_text.wsc_store_meta` = N (conteggio chunk). Chiave quick-timer: prefisso `wsc_qt_store`.
- API **statica** su `WeeklyScheduleBase` (così la usa anche la mini-card che non estende la base):
  `_sharedGet(hass,key)` / `_sharedSet(hass,key,data)` + `_storePrefix`/`_chunkEntity`/`_metaEntity`/
  `_isAdmin` + `_createInputText`/`_deleteInputText`/`_setInputText` (set_value con retry).
- `_wsGet()`: legge lo store condiviso; se vuoto **migra una-tantum** dal vecchio `frontend/get_user_data`
  (`_userDataGet`, tenuto solo per questo) → `_sharedSet` (solo se admin). `_wsSetNow()` → `_sharedSet`.
  `_wsSet`/`_withTx`/batching INVARIATI (cambia solo la persistenza reale).
- **Sync cross-device/utente**: `set hass` rifà il fetch quando cambia lo stato di un
  `input_text.wsc_store_*` (un altro device ha scritto). Miglioria gratuita vs user_data.
- **Ruoli**: admin legge+scrive+crea/elimina helper+migra; non-admin **legge** sempre e può
  scrivere via `input_text.set_value` finché non servono nuovi chunk (creazione helper = solo admin).
- **Mid-write fail-safe**: i chunk si scrivono prima del meta; un lettore che becca lo stato
  intermedio fallisce il decompress → `_sharedGet` ritorna null → fallback, si auto-corregge al
  prossimo update. Nessun lock (rischio basso con pochi utenti).
Schema reale (invariato — è il payload serializzato):
```javascript
{
  groups: [],                 // legacy: migrato dentro profiles[].groups da _ensureDefaultProfile
  profiles: [{
    id, name, exclusive, groups: [{ id, name, color, entities[] }],
    schedules: ['switch.schedule_XXX'],   // mono-entità ciascuno
    scheduleLinks: [{
      id: 'switch.schedule_XXX',          // chiave = entity_id dello schedule
      // condizioni
      conditions: [{ entity, attribute?, operator, value }], condCombinator: 'and'|'or', condInterval,
      condAutoId,                         // automation.wsc_cond_*
      // override manuale
      overrideEnabled, overrideFlagAutoId,
      // extras (preset/fan/swing/hvac)
      extras, extrasAutoId,
      // notifiche
      notifyService, notifyMessage, notifyMessageEnd, notifyTrigger, notifyAutoId,
      // azione di fine slot
      autoOffAutoId, stopAction, stopValue,
      autoChildId                         // LEGACY (vecchio child auto-off, rimosso al salvataggio)
    }]
  }],
  activeProfiles: ['profile_id']
}
```
Regola esclusività: profili con entità in comune → esclusivi tra loro.

## Storage transazionale (batching scritture)
Per evitare N scritture+eventi per una singola operazione utente:
- `_wsSet(data)` aggiorna `_storageData` + invalida la render-cache; se è dentro una transazione
  (`_txDepth>0`) marca solo `_txDirty` e rinvia, altrimenti scrive subito via `_wsSetNow`.
- `_wsSetNow(data)`: scrittura reale (`set_user_data`) + evento `wsc-storage-changed`.
- `_withTx(async fn)`: conta la profondità (nesting sicuro); a fine transazione UNA sola
  `_wsSetNow` sullo stato raggiunto (best-effort anche se `fn` lancia).
- Avvolte in `_withTx`: `_saveSchedule`, `_deleteSchedule`, `_deleteProfile`, `_activateProfile`,
  `_duplicateProfile`, `_cancelNewProfile`, `_cleanupOrphanAutomations`. Le `_wsSet` FUORI
  transazione restano scritture immediate (rename profilo, gruppi, `_ensureDefaultProfile`, ecc.).

## Quick Timer Card (`custom:quick-timer-card`, v1.2.1)
Card a entità singola (`src/quick-timer-card.js`, `extends WeeklyScheduleBase`) in **UN'unica
`ha-card` senza divisori** (`.qt-card` → `.qt-when` scelta durata in alto, `.qt-native` card HA
incorporata al centro, `.qt-foot` Avvia/countdown in fondo).
- **"Il controllo arma il timer"** (v1.2.1, ridisegno): NIENTE più UI di selezione valore. Il
  valore (on/off, temp, %, colore) lo imposta l'utente col **controllo nativo** (set reale
  sull'entità); il pannello sceglie solo per **quanto** tenerlo. Avvia NON applica azioni: crea
  solo l'automazione di ripristino. Rimossi `_targetHtml`/`_onoffHtml`/`_readTarget`/`_targetLabel`.
- **Card nativa configurabile** (v1.2.1): `_buildNativeCardConfig()` — blocco YAML `card:` con
  config completa di qualsiasi card HA (es. `type: thermostat`), default = tile auto per dominio
  (retrocompat `tile:`). `entity` di default = `config.entity`. Chrome della card incorporata
  neutralizzata via CSS vars ereditate (`--ha-card-box-shadow/border-width/border-radius/background`).
- **Baseline di ripristino** (v1.2.1): per tornare allo stato PRIMA della modifica, `_trackBaseline()`
  (in `set hass`) tiene `_settledRestore` = restore dell'ultimo stato **stabile**; durante una
  raffica di modifiche NON aggiorna (firma = `JSON.stringify(_buildRestoreActions)`), allo scadere
  del debounce `_BASELINE_SETTLE_MS` (30s) il nuovo stato diventa baseline; congelato a timer attivo.
  ⚠️ se modifichi e aspetti >30s prima di Avviare, il baseline avanza (ripristino = no-op).
- **NIENTE scene**: ripristino con azioni esplicite `_buildRestoreActions(eid)` (legge `hass.states`
  per dominio) cucite in un'automazione **transitoria** `qt_timer_<slug>` (delay + guardia + restore).
- **Overlap "vince l'ultimo attivato"**: guardia template nell'automazione → salta il revert se uno
  `switch.schedule_*` è entrato in slot DOPO l'avvio (`last_changed > now()-durata`).
- **Auto-pulizia**: automazione eliminata ~30s dopo `endTs` (buffer) o subito all'Annulla; GC su
  load (`_cleanupFinishedTimers`). A riposo nessun artefatto.
- **Storage condiviso**: timer attivi in `_sharedSet('quick_timer_card', {timers})` (prefisso helper
  `wsc_qt_store`) → countdown/annulla cross-device. `set hass` refetch su cambio `input_text.wsc_qt_store_*`.
- "Annulla" = **ripristina subito** (replay delle `restore` salvate nel record). Durata **o** Fine alle.
- **Config solo YAML** (nessun `getConfigElement`). Opzioni: `entity` (obbl.), `card` (config card
  nativa), `name`, `presets` (array minuti), `default_minutes`, `language`.
- Override `setConfig`/`set hass`/`render`/`connected/disconnectedCallback` (NON usa schedule/profili).
  Riusa `_detectDomain`,`_entityCaps`,`_buildRestoreActions`,`_recreateAutomation`,`_setStyles`,`t`,`_esc`.
  LOCALES: blocco `qtimer.*` (en/it/fr) in base-card.
- Limiti: ripristino esplicito best-effort su attributi esotici (effetti/transizioni); `delay` non
  sopravvive a riavvio HA a metà timer; `loadCardHelpers` richiede Lovelace standard.

## Popup domini
```
climate → temperature (slider 5-80°C, input manuale fino 100°C)
          hvac_mode, preset_mode, fan_mode, swing_mode (opzionali)
light   → on/off + brightness slider opzionale
switch  → on/off
```
Toggle on/off in popup chiama `switch.turn_on/off` immediatamente.
Save chiama `scheduler.edit` con azioni aggiornate.

## Viste disponibili (weekly-schedule-card — editing)
```
columns  → griglia 7 colonne, editing principale (default)
rows     → righe per giorno (gantt)
```
Toggle ciclico: **columns ↔ rows** (solo queste due). I builder `_buildCompactView` /
`_buildFocusView` esistono in base-card ma sono usati SOLO dalla view-card.

## Viste disponibili (weekly-schedule-view-card — sola lettura)
```
focus    → giorno espanso + colonne slim (default)
compact  → giorni collassabili
```
Toggle ciclico **focus ↔ compact** (solo queste due; `_cycleLayout`/`setConfig` le
limitano). Nessun editing, nessun profilo, nessun gruppo. Click blocco → more-info switch.schedule_*.

## I18n
Lingue: en, it, fr.
Rilevamento: config.language → hass.language → navigator.language → 'en'.
Stringhe **inline** nell'oggetto `LOCALES` (en/it/fr) in `src/base-card.js` (NON in file
`src/locales/*.json`). Accesso via `t(key)`; `t(key, vars)` interpola i placeholder `{nome}`
(es. `t('notify.from_to', {start:'08:00', end:'22:00'})`). Le stringhe dei messaggi notifica e
del nome di default sono nei blocchi `notify.*` e `sched_name.*`.

## Bug noti / limitazioni
- Scheduler Component non supporta `conditions` nei timeslots
- Scheduler Component non supporta `stop_action` nei timeslots
- Storage condiviso: niente lock di concorrenza (2 admin che scrivono insieme → glitch breve
  fail-safe, si auto-corregge); creazione/eliminazione helper `input_text` richiede admin;
  gli helper `input_text.wsc_store_*` compaiono in Impostazioni → Helper.

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
2. ~~Rivalutazione condizioni periodica (time_pattern ogni N min)~~ ✅ FATTO (`_syncConditionAutomation` con `condInterval` default 15 + dropdown UI + i18n `recheck`)
3. ~~Dividere in due card~~ ✅ FATTO
4. ~~Eliminare viste focus/compact/rows da editing card~~ ✅ FATTO (editing card già limitata a `columns`/`rows`; `_buildFocus/CompactView` restano per la view-card; rimossi 2 selettori morti `.compact-blk,.focus-blk` dai `closest()` della editing card)
5. ~~Notifica default pre-compilata con info schedule~~ ✅ FATTO
6. ~~README documentazione completa~~ ✅ FATTO (2026-06-08: allineato all'architettura attuale — layout editing 2 / view 2, auto-off come automazione `wsc_autooff_*`, notifiche server-side `wsc_notify_*`, intervallo cond default 15, immagini ricollocate per card, pannello Linked objects)
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
2026-06-22 Rome (v1.2.1 conditional-override fix) — fixed: conditional schedules whose condition is
FALSE at slot start got the override flag stuck `off`, so when the condition later became true the
ACTIVE action never re-applied. Root cause: the Scheduler's own slot-start apply is a ROOT context
(`parent_id is None`, looks manual) and the 5s `last_changed` guard was racy (stale on back-to-back
slots; `slot`=flag-on vs false `manual`=flag-off race under `mode: queued`). Fix = **value-based**
override detection: new `_activeValueMatchExpr(ps)` (TRUE when the entity already holds the active
value — exact dims only: on/off, climate temp/hvac, cover pos/state); detect branch now uses
`parent_id is none AND not(matchExpr)` + condition-met (plain, no hysteresis), 5s guard removed.
Catches UI **and** physical changes; the Scheduler apply (value==active) is excluded. Fallback to
`user_id is not none` when no comparable value (cover stop / exotic domain). Limits: fine brightness/
color/speed override not detected; cover position ±2 tolerance + moving guard. Build OK, `check` green.
2026-06-22 Rome (v1.2.1 quick-timer redesign) — quick-timer-card rebuilt per user feedback:
(1) **"control arms the timer"** — removed the value-selection UI; the user sets the value via the
embedded native control (real set), the panel only picks the duration. Start no longer applies any
action, it just creates the restore automation. New `_trackBaseline()` keeps `_settledRestore` =
last *stable* state (debounce `_BASELINE_SETTLE_MS=30s`, frozen while a timer is active) so the
restore targets the pre-edit state; `_heldLabel(eid)` for the active label. Dropped
`_targetHtml/_onoffHtml/_readTarget/_targetLabel`. (2) **single seamless `ha-card`** (no divider):
`.qt-when` (duration, top) → `.qt-native` (native card, middle) → `.qt-foot` (Start/countdown,
bottom); embedded card chrome neutralized via inherited `--ha-card-*` CSS vars. (3) **YAML-only
config** (no editor) — documented options. (4) **configurable native card**: `_buildTileConfig` →
`_buildNativeCardConfig` supporting a YAML `card:` block (any HA card, e.g. `type: thermostat`),
default auto-tile (back-compat `tile:`). Build OK (3 IIFE bundles), `check` green. To validate in
HA: no spontaneous revert on direct control; hold+restore; cancel-now; `card:` override; tune 30s.
2026-06-20 16:30 Rome (v1.2.0 quick-timer card) — **NEW `custom:quick-timer-card`**
(`src/quick-timer-card.js`, 3rd rollup entry → `dist/quick-timer-card.js`). Single-entity card:
native HA `tile` embedded via `loadCardHelpers` for direct control + a **Timer** panel that holds a
temporary value for a duration/until-time then restores the prior state. **No scenes** — restore is
explicit (`_buildRestoreActions`, reads `hass.states` per domain) baked into a **transient**
automation `qt_timer_<slug>` (delay + guard + restore), auto-deleted ~30s after end / on cancel
(`_cleanupFinishedTimers`) → nothing left at rest. **Overlap "most recent wins"**: guard template
skips the revert if a `switch.schedule_*` entered its slot AFTER the timer started
(`last_changed > now()-duration`). Active timers stored in **shared** `quick_timer_card`
(`wsc_qt_store` prefix) → cross-device countdown/cancel; "Cancel" = restore now. LOCALES `qtimer.*`
(en/it/fr). `check` script now covers the 3rd bundle; `deploy.js` already copies all `dist/*.js`.
2026-06-20 14:45 Rome (v1.1.8 shared storage) — **fix: profiles/groups now SHARED across HA users**
(was per-user `frontend/set_user_data` → invisible on a 2nd account/iPhone). Storage moved to GLOBAL
`input_text` helpers: `JSON → compressToBase64 (new vendored `src/lz-string.js`, MIT) → ≤255-char
chunks` in `input_text.wsc_store_0..N` + `input_text.wsc_store_meta` (chunk count). New STATIC API on
`WeeklyScheduleBase` (`_sharedGet/_sharedSet/_createInputText/_deleteInputText/_setInputText/_isAdmin`,
prefix `wsc_qt_store` reserved for the upcoming quick-timer card) so the mini-card (doesn't extend base)
can read it too. `_wsGet` auto-migrates old per-user data once (admin only); `_wsSetNow → _sharedSet`;
`_wsSet`/`_withTx` batching unchanged. Bonus: `set hass` refetches on `input_text.wsc_store_*` state
change → live cross-device sync. Roles: admin creates/deletes helpers + migrates; non-admin reads always
and can `set_value` until new chunks are needed. Mid-write is fail-safe (chunks before meta → reader gets
null → fallback). Next: quick-timer card (also shared via `wsc_qt_store`).
2026-06-18 11:10 Rome (v1.1.7) — release del batch: README allineato; set-position azione di fine slot invertito+gradiente come quello principale; **condizioni event-driven** (rimosso `time_pattern`, trigger su stato+attributo) + **isteresi/banda morta** (campo `± tolleranza`, default 5% del valore, `_buildHACondition(c, activeExpr)` template stateful). Override invariato (fragilità slot-start pre-esistente, da validare con traccia). condInterval resta nello storage (legacy).
2026-06-11 17:29 Rome (v1.1.6 UI + autocomplete) — editing card: grigio colonne vuote più marcato (mix divider+secondary-text), chip profilo forzata a blu primario (non più colore profilo rosso), barra verde attivo affusolata (ellisse `border-radius:50%`). Popup cover "Set position": slider invertito (destra=chiude di più, `value=100-position`, label Aperto↔Chiuso scambiate) + gradiente monocromatico chiaro→scuro (via nero/giallo). Condizioni: autocomplete entità con dropdown custom (`.cond-ent-wrap`/`.cond-ent-dd`, `pointerdown`) al posto del `<datalist>` nativo che non funziona su mobile/app HA.
2026-06-11 14:21 Rome (v1.1.5 UI editing card) — rimossa la status bar "Viewing: … Active"; profilo attivo indicato da una barra verde sotto la chip (`.profile-chip.active-op::after`), rimosso il pallino verde (chip-act-dot). Vista colonne gruppi: piccolo gap fisso (4px) tra le sub-colonne delle entità (calc su left/width), rimosso il sub-divider.
2026-06-11 14:00 Rome (v1.1.4 UI polish) — view card: rimossa icona dominio dai blocchi focus/compact (il "riquadro bianco"); chip profilo attivo in blu primario (non più il colore rosso del profilo) + scritta più piccola; editing card: rimosso lucchetto dalla chip + font ridotto; fix i18n `layout.focus`/`layout.compact` (mostrava la chiave grezza) con nuovo blocco LOCALES `layout`.
2026-06-11 13:42 Rome (WIP vista colonne) — blocchi colonne: rimosse etichette e icone-indicatore (illeggibili in colonne strette + "quadratino bianco" = `mdi:stop`); colori smorzati (opacità blocchi .88→.72, attivi 1→.9, pulse ridotto a bordo interno + glow leggero). Dettagli su tooltip/vista righe. Branch `fix/columns-visual`, in iterazione su screenshot (restano: fine-tuning colori + chip profilo).
2026-06-11 08:56 Rome (UX cover) — azione tenda: posizione come 4° radio (open/close/stop/position, mutuamente esclusivi; rimosso `enablePosition`, `coverAction` unica fonte). Slider posizione con etichette Chiuso/Aperto e track a gradiente nero→giallo sole (chiuso 0% → aperto 100%). Semantica HA invariata (`set_cover_position`).
2026-06-11 08:35 Rome (refactor storage/i18n/a11y) — storage transazionale (`_withTx`/`_wsSetNow`/`_wsSet` differito): 1 sola scrittura+evento per operazione utente (save/delete/activate/duplicate/cancel/cleanup); i18n: stringhe di `_buildDefaultNotifyMessage`/`_buildDefaultScheduleName` spostate in LOCALES (`notify.*`/`sched_name.*`) con `t(key, vars)` interpolato (output verificato byte-identico nelle 3 lingue); CLAUDE.md aggiornato (storage reale via get/set_user_data, i18n inline, viste); a11y tastiera (role/tabindex/keydown Enter-Spazio condiviso, aria-pressed/expanded, `:focus-visible`). Mono-entità invariato.
2026-06-10 10:54 Rome (perf/security) — fix listener tooltip duplicati (bind once, no memory leak), mini card con debounce+diff (_scheduleMiniRender/_miniHassChanged), escaping HTML sistematico anti-XSS (`_esc`/`_escAttr` statici+istanza in base; mini card via `WeeklyScheduleBase._esc`), memoizzazione per-render (`_getRenderCache` token-based: `schedulesByEntity`+`linksById`, invalidata in `_wsSet`). Mono-entità invariato.
2026-06-10 09:59 Rome (v1.1.2) — UI/build quick wins: contrasto testo blocchi (luminanza→nero/bianco), minificazione terser + check robusto, deploy cross-platform (scripts/deploy.js), prefers-reduced-motion, emoji→ha-icon mdi, badge dark-mode (var --success/--error-color), leggibilità etichette (font-size/tabular-nums/soglia label colonne)
2026-06-08 Rome (v1.1.1) — fix override: entity_id automazione-flag da alias slugificato (non object_id)

## Fix stato 'triggered' dello switch schedule (2026-06-05, v1.0.8)
- Scoperta dalla traccia: lo `switch.schedule_*` ha stato `on` (abilitato, fuori slot),
  **`triggered`** (abilitato, dentro slot attivo), `off` (disabilitato).
- Tutte le condizioni usavano `state == 'on'` → fallivano dentro lo slot (stato `triggered`):
  notifica INIZIO non scattava, cond/extras mai dentro slot, guardia auto-off non
  rilevava schedule attivi (`triggered`).
- Fix: "abilitato" ora è **`state != 'off'`** (copre on+triggered+completed); "in slot"
  resta `current_slot != None`. Corretti: condizioni di notify/cond/extras/auto-off,
  guardia Jinja race auto-off (`s.state != 'off'`), e `_activateProfile` (`s.state !== 'off'`).

## Fix notifica inizio slot (2026-06-04, v1.0.7)

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