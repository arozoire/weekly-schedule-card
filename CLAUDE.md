Ecco il CLAUDE.md riscritto per minimizzare i token e massimizzare l'efficienza:

```markdown
# Weekly Schedule Card — Project Context

## Stack
Vanilla JS custom element, **build con Rollup** (IIFE bundle).
`src/*.js` → `npm run build` → `dist/*.js` (4 file IIFE auto-contenuti).
Deploy: copiare `dist/weekly-schedule-card.js` + `dist/weekly-schedule-view-card.js` + `dist/quick-timer-card.js` + `dist/weekly-serpentine-card.js` in HA `/config/www/`.
Il bundle principale (`weekly-schedule-card.js`) include già la view card, la mini card, la quick-timer-card **e la weekly-serpentine-card** (via import in `src/weekly-schedule-card.js`) — HACS fornisce tutte e 5 le card con un solo file.
**NON** copiare `base-card.js` in dist: viene inglobato nel bundle dal rollup.

## Workflow obbligatorio
1. Analizza modifiche necessarie → scrivi piano in `CHANGES.md`
2. Aspetta approvazione
3. Applica SOLO con `str_replace` (mai riscrivere file intero)
4. Elimina `CHANGES.md`
5. `npm run build` (genera IIFE bundle in dist/). MAI `cp src/ dist/` — i sorgenti hanno `import` ES module che HA non risolve senza bundle.

## Regole operative di sessione (SEMPRE)
1. **Allinea sullo stato reale del repo PRIMA di modificare/rilasciare**: `git fetch --all --tags`,
   controlla `origin/main`, i tag, le release esistenti e l'eventuale divergenza del branch. NON fidarti
   della versione in `package.json`/`CLAUDE.md` o di snapshot di contesto: verifica cosa è davvero su `main`
   e cosa è già taggato/rilasciato (lezione v1.2.6: una PR mergiata a un commit vecchio ha rilasciato senza
   il fix → servì la 1.2.7). Se il branch è dietro `main`, riallinealo (merge) prima di lavorare.
2. **Chiudi SEMPRE la risposta con un prompt pronto da incollare** all'altro Claude (GitHub Codespace) per
   gestire la PR/release: numero PR, link, e i passi (merge + Actions→Create Release→Run workflow con la
   versione giusta). Vedi i file `RELEASE_NOTE_v*.md`.

## File struttura
```
src/
  base-card.js                   # classe condivisa, import-ata dalle card (esporta anche PALETTE)
  weekly-schedule-card.js        # card principale con editing (extends base); importa view + quick-timer + serpentine
  weekly-schedule-view-card.js   # card solo visualizzazione (extends base)
  quick-timer-card.js            # card timer mono-entità (extends base)
  weekly-serpentine-card.js      # card decorativa sola-lettura, nastro a serpentina (extends base)
  lz-string.js                   # compressione storage (vendored, MIT)
rollup.config.js                 # 4 entry IIFE
dist/
  weekly-schedule-card.js        # IIFE bundle (base + card + view + mini + quick-timer + serpentine)
  weekly-schedule-view-card.js   # IIFE bundle (base + view-card)
  quick-timer-card.js            # IIFE bundle (base + quick-timer-card), standalone solo-timer
  weekly-serpentine-card.js      # IIFE bundle (base + serpentine-card), standalone
```

## Weekly Serpentine Card (`custom:weekly-serpentine-card`, v1.3.0)
Card **decorativa sola-lettura** (`src/weekly-serpentine-card.js`, 4ª entry rollup, `extends
WeeklyScheduleBase` con override TOTALE del lifecycle — niente profili/gruppi/storage, stesso
modello di `quick-timer-card`). Mostra l'intera settimana come un **nastro continuo a
serpentina** (boustrophedon VERO: lun →, mar ←, mer →, … righe pari L→R righe dispari R→L,
collegate da curve a U che alternano lato). **Mezzanotte = apice della curva**, NIENTE tacche
00→24 né marker espliciti (decisione utente, design congelato su `docs/serpentine/
mockup-2-multi-entity-FINAL.svg`). Tutto renderizzato in **un unico `<svg>`** dentro `ha-card`
(niente rettangolo/ombra disegnati a mano: li fornisce `ha-card` via tema, così dark-mode
funziona gratis) — testi/tratti che dipendono dal tema usano `style="fill:var(--...)"` (non
l'attributo di presentazione grezzo, per compatibilità var() cross-browser).
- **Config**: `entities:` accetta stringhe o `{entity, name, color}` (normalizzato in
  `setConfig`, diverso dalle altre card che richiedono solo oggetti). `title`/`language` come
  le altre card.
- **Multi-entità**: ogni entità = sotto-corsia parallela con colore proprio (`config.color` o
  `PALETTE[i]`, ora **esportata** da `base-card.js` — vedi lezione CLAUDE.md sul drift di
  PALETTE/LOCALES duplicati, qui riusata via import invece di ricopiata) + legenda in alto con
  wrap automatico (**larghezza reale misurata via canvas offscreen**, non stimata). Avviso soft
  (banner, non bloccante) se >3 entità (`serp.many_entities`), NESSUN limite rigido.
- **Geometria**: costanti derivate per adattarsi a N entità mantenendo le proporzioni del
  mockup approvato per N=3 (`strokeWidth = max(18, (n-1)*9 + 7 + 3)`, `rowStep = strokeWidth+18`,
  `curveBump = strokeWidth+2`, `xL/xR` calcolati da `curveBump` per mantenere i margini). Pillole
  posizionate per tempo→x **lineare** sulla riga (righe pari: `xL + t/1440*(xR-xL)`; dispari:
  `xR - t/1440*(xR-xL)`) — NON mappate lungo le curve (approvato così, troppo complesso per v1).
  **Bleed a mezzanotte** (fix utente reale in HA): un blocco che tocca l'inizio/fine giornata
  (`t1<=15` o `t2>=1425`, soglia = granularità snap del progetto) estende il proprio bordo di
  `curveBump*0.6` OLTRE `xL`/`xR`, dentro la curva — altrimenti due slot adiacenti a cavallo di
  mezzanotte (es. mer 23:25-00:00 + gio 00:01-00:45) si fermavano di netto sul bordo del nastro,
  sembrando due pillole scollegate "prima e dopo" la curva invece di leggersi come un unico
  flusso continuo (screenshot utente). Il resto della curva resta senza mapping (invariato).
  Blocco attivo ORA: confronto diretto giorno/minuti correnti coi timeslot (niente dipendenza da
  `current_slot`/storage) → più semplice e corretto anche senza profili.
- **Dati**: riusa `_getSchedules(entityId)` (funziona senza `_storageData`, vedi nota in
  `base-card.js`), `_appliesToDay`, `_parseTime`, `t()`, `_esc()`/`_escAttr()`, `_setStyles()`/
  `_ensureRoot()`. `set hass` riusa `_hassChangedRelevant` del base (dipende solo da
  `this._entities`, non da profili) per il debounce/diff — NIENTE fetch storage.
- **v1 = decorativa**: click su una pillola → `hass-more-info` dello `switch.schedule_*`
  (stesso pattern della mini-card). Editing futuro: riusare `_openEditPopup` (NIENTE drag sul
  nastro — rovina curve/righe invertite/estetica, deciso con l'utente).
- **Tick "ora"**: `setInterval` 60s in `connectedCallback` → re-render completo (rigenerare la
  stringa SVG è economico; NON chiama `super.connectedCallback()`, stesso pattern quick-timer).
- i18n: blocco `serp.*` (en/it/fr) — `title_default`, `many_entities` (avviso soft), `no_entities`,
  `now`. Le etichette giorno (L M M G V S D) riusano `days.*` esistenti (prima lettera), NESSUNA
  nuova chiave per i giorni.
- Verificato visivamente con screenshot headless (Chromium/Playwright) contro il mockup approvato
  (1/3/5 entità, tema chiaro/scuro, wrap legenda multi-riga, XSS-escaping di titolo/nomi con
  caratteri speciali, click→hass-more-info, config a stringhe) — NON testato in HA reale.

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
`_actionFieldsForEntity` non c'è: la logica è in `domainSection` (climate/light/fan/cover/valve/switch) +
`_entityCaps(eid)` (capacità reali: supported_color_modes, percentage, current_position, *_modes).
Azione PRINCIPALE per dominio: climate (temp/hvac/preset/fan/swing), light (on/off + brightness +
**colore rgb** se supportato), fan (on/off + **velocità %**), cover/valve (**apri/chiudi/ferma + posizione %**),
switch (on/off). Builder unico `_buildScheduleActions`. Colore via `_colorPickerHTML` (palette → rgb).
**valve = cover** (v1.2.3): stessi controlli/UI/campi `ps.coverAction`/`ps.position`/selettori
`name="cover-action"`+`.position-slider`; cambiano solo i nomi servizio via `_posServices(dom)`
(`open_valve`/`close_valve`/`stop_valve`/`set_valve_position`). Esteso in `_buildScheduleActions`,
`_buildStopActions`, `_endActionTypes`, `domainSection`, parse-back (`coverAction` regex cover|valve)
e `_activeValueMatchExpr` (override). `_entityCaps.coverPosition` è già generico → vale per valve.
Prima valve cadeva nel ramo default → `valve.turn_on/off` (servizi inesistenti) → schedule rotto.

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
  **Versionato** (`_qtWriteCount`, v1.3.0): stesso fix v1.2.5 applicato allo storage principale,
  mai portato qui — `_saveTimers()` incrementa il contatore PRIMA di scrivere; il refetch (sia al
  primo load sia al cambio store) cattura la versione prima del fetch e scarta il risultato se nel
  frattempo è partita un'altra `_saveTimers()` O se la lettura è `null` (mid-write, payload >1 chunk:
  `_saveTimers` scrive i chunk PRIMA del meta → un refetch che arriva a metà legge un meta assente/
  vecchio → `_sharedGet` torna `null`). Bug pre-fix: il refetch senza guardia trattava QUALSIASI
  `null` come "store vuoto" e azzerava `_timers` a `{}` → il countdown appena avviato spariva
  (mostrava di nuovo il pulsante "Avvia") per il tempo dei round-trip fino al chunk/meta successivo,
  per poi auto-correggersi — ma nel frattempo l'utente vedeva "non parte" e un refresh a metà
  scrittura (rara ma possibile con round-trip di rete reali) mostrava il timer "vuoto". Riprodotto
  e verificato con un harness headless (mock `hass.callService`/`connection` con round-trip
  realistici + payload a 2 chunk) prima e dopo il fix; verificato che il fix non rompe il sync
  cross-device (scrittura da un altro "device" via `_sharedSet` diretto, letta correttamente dal
  refetch `storeChanged`).
- "Annulla" = **ripristina subito** (replay delle `restore` salvate nel record). Durata **o** Fine alle.
- **Config via UI editor O YAML** (v1.2.3): `static getConfigElement()` → elemento
  `quick-timer-card-editor` (`class QuickTimerCardEditor extends WeeklyScheduleBase`, in fondo a
  `quick-timer-card.js`, registrato guardato; finisce anche nel bundle main perché importato).
  Usa **`ha-form`** (schema `_schema()`, dati `_data()`, `_valueChanged` → `config-changed`).
  L'editor gestisce `entity`/`name`/`default_minutes`/`presets` (text CSV → array int)/`language`
  (select, '' = auto). Il blocco `card:`/`tile:` (config card nativa) resta **solo-YAML**:
  l'editor lo **preserva** (spread `...this._config`) ma non lo espone. Estende il base solo per
  `t()`/`_esc()`: override TOTALE di `setConfig`/`get|set hass`/`connected|disconnectedCallback`/
  `render` (vuoto) → niente macchina-card. `ha-form` caricato best-effort via `_ensureHaForm()`
  (tira l'editor della entities-card); reseed dati solo a cambio `entity`/primo render (no cursor-jump).
- Override `setConfig`/`set hass`/`render`/`connected/disconnectedCallback` (NON usa schedule/profili).
  Riusa `_detectDomain`,`_entityCaps`,`_buildRestoreActions`,`_recreateAutomation`,`_setStyles`,`t`,`_esc`.
  LOCALES: blocco `qtimer.*` (en/it/fr) in base-card, incl. `qtimer.editor.*` (label del form).
- **valve** (v1.2.3): `_buildRestoreActions`/`_heldLabel` hanno il ramo `valve` (come `cover`,
  servizi `valve.*`); prima cadeva nel default → `valve.turn_on/off` (inesistenti) → restore rotto.
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
2026-07-01 10:02 Rome (v1.3.0 — fix serpentine: blocchi a cavallo di mezzanotte non fluivano nella
curva) — feedback utente da HA reale (screenshot): due schedule adiacenti a cavallo di mezzanotte
(mer 23:25-00:00 + gio 00:01-00:45) apparivano come due pillole staccate "prima e dopo" la curva
invece di leggersi come un flusso continuo — la decisione originale "mezzanotte = apice della
curva" restava solo concettuale, non si vedeva nel risultato reale. **Fix**: in `_buildSvg`
(`weekly-serpentine-card.js`), un blocco il cui `t1<=15` o `t2>=1425` (soglia = 15 min, la
granularità snap standard del progetto) estende il bordo corrispondente di `curveBump*0.6` oltre
`xL`/`xR`, dentro la curva — NON è mapping lungo la curva (resta esplicitamente fuori scope per
v1, vedi HANDOFF), solo un'estensione del rettangolo dritto che fa "sanguinare" visivamente la
pillola nella zona di curva così i due blocchi adiacenti sembrano toccarsi. Verificato con
screenshot headless riproducendo esattamente il caso segnalato (stesso orario) prima/dopo, e
verificato che i blocchi normali (non a cavallo di mezzanotte) restano invariati (screenshot
mockup 1/3/5 entità re-confrontati, nessuna differenza). Nessuna funzionalità esistente toccata
(unica modifica in `weekly-serpentine-card.js`, dentro il loop che genera le pillole).
2026-07-01 09:03 Rome (v1.3.0 — fix quick-timer: countdown che spariva all'avvio + timer "vuoto"
dopo refresh) — bug segnalato dall'utente sulla 1.2.9: dopo "Avvia" la card mostra "Stato
acquisito" ma poi sembra non partire (torna il pulsante), e ricaricando la pagina il timer risulta
non configurato. **Causa**: `set hass` in `quick-timer-card.js` rifà il fetch di `_timers` da
`_sharedGet` ad ogni cambio di `input_text.wsc_qt_store_*` (sync cross-device) SENZA la guardia
di versione che il v1.2.5 aveva introdotto per lo storage principale (`_wsWriteCount`) — mai
applicata qui. Risultato: mentre `_saveTimers()` scrive i chunk (payload realistici superano
spesso 255 char → 2+ chunk, scritti PRIMA del meta) i refetch triggerati dai NOSTRI STESSI cambi
di stato intermedi leggono un meta assente/vecchio → `_sharedGet` torna `null` → il vecchio codice
trattava QUALSIASI `null` come "store vuoto" e azzerava `_timers` a `{}`, facendo sparire il
countdown appena creato (poi si autocorreggeva all'ultimo refetch, dopo il meta — ma nel frattempo
l'utente vedeva "non parte", e un refresh capitato a metà scrittura mostrava "vuoto"). **Fix**:
nuovo contatore `_qtWriteCount` (incrementato in `_saveTimers()` prima di scrivere); entrambi i
refetch in `set hass` (primo load + `storeChanged`) catturano la versione prima del fetch e
scartano il risultato se la versione è cambiata nel frattempo (altra scrittura in corso) o se la
lettura è `null` (mid-write) — stesso pattern del fix v1.2.5, mai portato al percorso storage del
quick-timer. Riprodotto il bug e verificato il fix con un harness headless (mock realistico di
`hass.callService`/`connection.sendMessagePromise` con round-trip async, payload che richiede 2
chunk) prima/dopo; verificato che il sync cross-device (altro device scrive un timer) funziona
ancora. Nessuna funzionalità esistente toccata oltre al fix (solo in `quick-timer-card.js`).
2026-07-01 08:34 Rome (v1.3.0 — nuova card `weekly-serpentine-card`) — implementata da zero
seguendo `docs/serpentine/HANDOFF.md` (design congelato, approvato su `mockup-2-multi-entity-FINAL.svg`):
nastro boustrophedon vero (righe alternate, curve a U, mezzanotte all'apice, niente tacche
orarie), multi-entità con sotto-corsie parallele + legenda (wrap via canvas measureText), avviso
soft (non bloccante) oltre 3 entità, indicatore "ora" sottile, v1 sola-lettura (click pillola →
more-info). Nuovo file `src/weekly-serpentine-card.js` (4ª entry rollup, importato nel bundle
main), `PALETTE` ora esportata da `base-card.js` (riusata, non ri-duplicata — vedi lezione
storica sul drift), blocco i18n `serp.*` (en/it/fr) aggiunto a `LOCALES`. `npm run check`
aggiornato per il 4° bundle. Vedi sezione dedicata sopra ("Weekly Serpentine Card") per i
dettagli tecnici/geometria. Verificato con screenshot headless (Chromium) contro il mockup
approvato, tema chiaro/scuro, XSS-escaping, config a stringhe — **non ancora validato in HA
reale** (prossimo step utente). Nessuna funzionalità esistente toccata (solo file additivi +
2 righe di export/import + blocco i18n aggiunto).
2026-06-30 Rome (v1.2.9 — schedule "usa e getta" / one-shot) — nuovo flag per-schedule (`ps.oneShot`,
checkbox `.chk-oneshot` sotto i giorni nel popup) che fa auto-eliminare lo schedule dopo l'ultima
occorrenza dei giorni scelti. Semantica (decisa con utente): gira sulla PROSSIMA occorrenza di OGNI
giorno selezionato, poi sparisce (es. mercoledì imposto lun/mar/ven → gira ven, lun, mar prossimi →
`scheduler.remove` dopo il martedì). Meccanismo: `_computeOneShotExpiry(days,endMin)` calcola al salvataggio
la scadenza = la più lontana tra le prossime occorrenze (fine-slot futuro), salvata come wall-clock locale
`YYYY-MM-DDTHH:MM:SS` in `link.oneShotExpiry`. Automazione `wsc_oneshot_<eid>` (`_syncOneShotAutomation`,
storage `link.oneShotAutoId`): trigger fine-slot (`current_slot is none`), condition `now() >= scadenza-30s`,
action `scheduler.remove`. Event-driven come l'auto-off; si auto-distrugge alla prima occorrenza dell'ultimo
giorno. Rete di sicurezza: `_cleanupExpiredOneShots()` al load (GC: elimina one-shot già scaduti ancora
presenti se HA era spento al trigger). Cleanup `oneShotAutoId` in `_deleteSchedule`/`_deleteProfile`/
`_cleanupOrphanAutomations`/`_sweepZombieAutomations`. Riga in `_linkedObjectsHtml` (`linked.one_shot`).
LOCALES `oneshot.enable/hint` + `linked.one_shot` (en/it/fr). `_computeOneShotExpiry` testato Node (7 casi
incl. mezzanotte/slot-passato/tutti-i-giorni). Rilasciata INSIEME al feedback quick-timer (sotto). Build OK,
`check` verde. Da validare in HA. **NON toccate funzionalità esistenti** (solo aggiunte additive).
2026-06-29 Rome (v1.2.9 — quick-timer: feedback onesto all'avvio +
anti doppio-click. Sintomo utente: a volte "Avvia" non parte / è lento. Causa: `_startTimer` fa 3 await in
sequenza (DELETE+POST automazione, `_resolveAutomationEntity` polling fino 6s, `automation.trigger`) e il
`render()` del countdown era solo alla fine → nessun feedback per 1-3s + nessun blocco → il ri-click creava
una corsa (il DELETE del 2° avvio cancellava l'automazione del 1° prima del trigger). Fix in
`quick-timer-card.js`: flag `_starting` (return se già in corso) + `_setFootStatus(text,kind)` che mostra
nel piede gli step reali e RIMUOVE il pulsante (anti doppio-click): "Stato in acquisizione…" → "Stato
acquisito: <label>" (via nuovo `_restoreLabel(actions,eid)`, etichetta dal restore: spento/40%/fan only/…)
→ countdown. Errori: "Stato non acquisito" (restore vuoto) o `start_failed` (automazione) per ~2.5s poi
torna il pulsante. `render()` non ricrea il pulsante se `_starting` (un render spurio non lo riporta).
`automation.trigger` ora NON è più in try/catch silenzioso: se fallisce → errore e NIENTE record timer
(prima salvava un countdown fantasma). LOCALES `qtimer.acquiring/acquired/acquire_failed/starting` (en/it/fr).
`_restoreLabel` testato su 13 domini. Da validare in HA. (One-shot "usa e getta" resta in CHANGES.md, da fare.)
2026-06-27 Rome (v1.2.8 — fix regressione popup climate, da v1.2.6) — creare/modificare uno schedule
climate non rispondeva (popup "morto"). Causa: `updateTempUI` (in `_bindPopupEvents`) referenziava
`tempBounds`, variabile LOCALE di un altro metodo (`_renderPopup`) → `ReferenceError: tempBounds is not
defined` a runtime; siccome per i climate `enableTemp` è true, `updateTempUI()` parte durante il binding
e l'eccezione aborta TUTTI i listener successivi → nessun controllo del popup funziona. Introdotto in
v1.2.6 estraendo `tempBounds` in `_renderPopup` (per il range water_heater) ma usandolo dentro
`_bindPopupEvents` (metodo diverso). `npm run check` NON lo prende (non esegue il popup). Fix: `tempBounds`
ricalcolato localmente in `_bindPopupEvents` (`tCaps`+bounds). Bug riprodotto e fix verificato con test di
scope. LEZIONE: attenzione alle variabili condivise tra `_renderPopup` e `_bindPopupEvents` (sono 2 metodi).
2026-06-27 Rome (v1.2.7 — release del fix climate hvac/preset-only) — la v1.2.6 era stata mergiata
(PR #2) a `20baf23`, cioè PRIMA dei 2 commit del bug fix (`cd7632a`/`fce752a`): la release v1.2.6 conteneva
i 4 nuovi domini ma NON il fix di `_openEditPopup` (su `main` restava la vecchia risoluzione
`s.attributes.entities?.includes(...)`). v1.2.7 spedisce SOLO quel fix (entity_id raccolti anche dalle
`actions` → modifica schedule climate solo-preset/hvac sulla prima entità di un gruppo di nuovo funzionante).
Branch riallineato a `main` via merge, bump 1.2.6→1.2.7, workflow/nota release aggiornati a v1.2.7. Nessun
cambiamento di codice oltre al fix già descritto sotto. Build OK, `check` verde sui 3 bundle.
2026-06-25 Rome (v1.2.6 — nuovi domini controllabili: lock, input_boolean, humidifier, water_heater) —
estesi gli schedule + quick-timer + gruppi a 4 nuovi domini target (prima solo climate/light/switch/fan/
cover/valve). **Root pattern:** il ramo default di `_buildScheduleActions` faceva `${dom}.turn_on/off`,
che si rompe quando l'on/off non passa da turn_on/off (come valve). Interventi in `base-card.js`:
(1) `_getAvailableEntities` DOMAINS += lock/input_boolean/humidifier/water_heater → selezionabili nei
gruppi/picker. (2) nuovo helper `_onoffServices(dom)` (lock → `lock.lock`/`lock.unlock`, default →
turn_on/off) usato in `_buildScheduleActions` (default) e `_buildStopActions` (turn_on/off). (3) rami
dedicati in `_buildScheduleActions`: **humidifier** (turn_on + `set_humidity` + `set_mode`), **water_heater**
(`set_temperature` + `set_operation_mode`); **lock**/**input_boolean** via on/off. (4) `_buildStopActions`
nuovi casi `set_humidity`/`set_hum_mode`/`set_operation_mode` + `set_temperature` domain-aware (water_heater
vs climate). (5) `_entityCaps` += humMin/humMax/humModes (available_modes), whOpModes (operation_list),
whTempMin/whTempMax (min/max_temp). (6) `_endActionTypes`/`_endActionDefault`/`_endActionValueHtml` per i
nuovi tipi (lock→Lock/Unlock, humidity slider, hum_mode/operation_mode select). (7) `domainSection` popup:
rami lock (radio Blocca/Sblocca via name="switch-action"), humidifier (on/off + slider umidità min/max +
select modalità), water_heater (temperatura climate-style + select modalità operativa); listener nuovi
chk-humidity/humidity-slider, chk-hummode/hummode-select, chk-opmode/opmode-select; gate temp esteso a
water_heater + `tempBounds` (climate 5–35, water_heater da device 30–80) usato in markup e `updateTempUI`.
(8) parse-back edit: legge `humidity`/`mode`/`operation_mode` dalle actions, turnOn esclude `.unlock`,
nuovi ps fields (enableHumidity/humidity/enableHumMode/humMode/enableOpMode/opMode). (9) `_activeValueMatchExpr`
(override) + `_hysteresisActiveExpr`: lock (locked/unlocked), water_heater (temp/opmode), humidifier (on/off).
(10) `_blockLabel` + default notify/name. (11) `_domainIconMdi` + badge CSS `.dom-lock/.dom-input_boolean/
.dom-humidifier/.dom-water_heater`. **quick-timer-card.js**: `_buildRestoreActions`/`_heldLabel` rami nuovi.
**weekly-schedule-card.js** (mini): `_domainIcon`/`_actionLabel` estesi. LOCALES popup/endact/blk (en/it/fr).
Build OK, `check` verde sui 3 bundle. **Da validare in HA**: schedule lock (lock/unlock + auto-off), humidifier
(umidità/modalità), water_heater (temp/modalità operativa), input_boolean on/off; quick-timer hold+restore;
selezione nei gruppi. Limite: end-action set_temperature widget max 35° (digitabile oltre); slider umidità usa
range device.
**FIX (stessa sessione):** modifica schedule non funzionante sulla prima entità climate di un gruppo quando
lo schedule ha azioni **hvac/preset-only** (senza temperatura). Causa: `_openEditPopup` risolveva `ec`
(entityConf) SOLO da `s.attributes.entities`, che lo Scheduler lascia VUOTO per azioni climate hvac-only
(stesso quirk del fix v1.2.4 sul render) → `ec` cadeva sulla prima entità top-level sbagliata o `undefined`
→ popup di edit rotto (durata/preset non modificabili/salvabili). Fix: raccogliere gli entity_id anche dalle
`actions` (`entity_id`/`target.entity_id`/`service_data.entity_id`), come fa `_buildRenderCache`, e
matchare `ec` su quel set (entità top-level → gruppi → fallback sintetico `{entity}`). Create non era
affetto perché usa direttamente l'entità del tab.
2026-06-24 11:23 Rome (v1.2.5 — fix persistenza storage + healing orfani + avviso overlap) —
due bug riportati dall'utente, stessa radice. **Causa:** il refetch async in `set hass` (rami
`addedOrRemoved`/`storeChanged`) si risolveva DOPO una scrittura locale e sovrascriveva `_storageData`
con uno stato vecchio → annullava la modifica (delete gruppo revertito; schedule appena creato non
finiva in `profile.schedules` → invisibile sulle card ma attivo + visibile in mini/popup, perché quelle
viste non filtrano per profilo). **Fix A (radice):** contatore `_wsWriteCount` (incrementato in
`_wsSetNow`); il refetch cattura `ver` prima e applica il risultato SOLO se `data && _wsWriteCount===ver`
(nessuna scrittura locale nel frattempo) + usa `_sharedGet` diretto (null/mid-write → non sovrascrive;
prima `_wsGet` fabbricava `{profiles:[]}`). **Fix C (healing):** in `_ensureDefaultProfile`, ogni
`switch.schedule_*` (non `weekly_schedule_auto`) non rivendicato da ALCUN profilo viene adottato nel
profilo `default` (rete di sicurezza: nessun orfano resta invisibile; idempotente). NB: il path di
**edit non ri-aggancia** al profilo (solo create) → l'adozione è il meccanismo di recupero.
**Fix D (overlap):** `_schedulesOverlap(A,B)` (giorno condiviso + slot che si intersecano) +
`_overlapWarningBannerHtml(tabs)` → banner giallo nella editing card se due schedule ABILITATI sulla
stessa entità si sovrappongono (copre l'orfano adottato che cade nello stesso periodo). LOCALES
`entstatus.overlap_title` (en/it/fr). **Scartato Fix B** (filtro render "mostra orfani": mascherava;
C ripara il dato). **Orfano-creazione = stesso bug del refetch** (Fix A lo previene); orfano-già-esistente
= Fix C lo adotta. Item 5 (v1.2.4) resta. **Released v1.2.5** (package.json bump, commit, push main, tag +
GitHub release con i 3 dist asset via `gh release create --target main`). Da validare in HA: create
persiste, delete gruppo persiste, fan_only orfano compare dopo reload, banner overlap.
2026-06-24 10:45 Rome (v1.2.4 — batch UX/robustezza) — 6 interventi su richiesta utente:
(1) **Label blocchi = risultato** (non più friendly_name lungo): nuovo helper `_blockLabel(s, entityConf)`
in base-card (climate→temp/mode, light→on/off/% , fan→%, cover/valve→%/apri/chiudi/ferma, switch→on/off;
deriva l'entità target da entityConf o da entities/actions dello schedule). Usato in `_getBlocksForDay`
(compact/focus), gantt rows + legenda (weekly-schedule-card.js), tooltip (rimosso il vecchio actionText
climate/light-only). **Colonne restano SENZA testo** (decisione utente). LOCALES `blk.*` (en/it/fr).
(2) **Climate `fan_only`/senza-temp non compariva**: `_buildRenderCache.schedulesByEntity` ora indicizza
gli schedule **anche** per gli `entity_id` trovati nelle `actions` (entity_id/target/service_data), non
solo da `attributes.entities` (che lo Scheduler può lasciare vuoto per azioni hvac-only). Fix difensivo.
(3) **Helper storage nascosti**: nuovo `_hideInputText` (entity_registry `hidden_by:'user'`) chiamato alla
creazione in `_sharedSet.ensure()`; retro-fix una-tantum all'avvio `_hideStoreHelpers()` (admin, solo se non
già nascosti). NB: restano in Impostazioni→Helper, spariscono da liste/dashboard/selettori.
(4) **Sweep zombi conservativo** all'avvio: `_sweepZombieAutomations(data)` (chiamato in coda a
`_cleanupOrphanAutomations`) — cancella `automation.wsc_*` NON tracciate in nessun scheduleLink E che
referenziano solo `switch.schedule_*` assenti (GET config + regex `switch.schedule_\w+`); skip se 0 ref o
se ≥1 referenziato esiste. Solo admin.
(5) **Avviso entità sparite/unavailable**: `_entityStatus(eid)` ('ok'|'unavailable'|'missing') +
`_entityWarningBannerHtml(tabs)` (banner rosso in cima alla editing card che elenca entità problematiche di
schedule/gruppi del profilo). Solo segnalazione. LOCALES `entstatus.*` (en/it/fr).
(6) **Mini card edit/delete**: ogni riga è cliccabile → `hass-more-info` dello `switch.schedule_*` (apri/
modifica), + pulsante cestino `.mini-del` → `window.confirm` → `scheduler.remove` (le automazioni collegate
le ripulisce poi lo sweep/cleanup alla load della editing card). `_actionLabel` della mini card migliorato
(cover/valve/fan/luci %). Build OK, `check` verde sui 3 bundle. **Released v1.2.4** (l'utente si è
fidato senza test in HA) — package.json bump, commit, push main, tag + GitHub release con i 3 dist asset
via `gh release create --target main`. Da validare in HA quando possibile (specie item 5 climate fan_only).
2026-06-24 Rome (v1.2.3 — quick-timer UI editor + valve support) — two user requests: (1) **quick-timer-card now UI-configurable** (was YAML-only): added
`static getConfigElement()` + new `quick-timer-card-editor` element (`extends WeeklyScheduleBase`
only to reuse `t()`/`_esc()`; all card lifecycle overridden) using **`ha-form`** (entity / name /
default_minutes / presets-as-CSV→int[] / language-select). Advanced `card:`/`tile:` block stays
YAML-only but is preserved by the editor (`...this._config`). `ha-form` loaded best-effort via
`_ensureHaForm()`; data reseeded only on entity-change/first render (no cursor-jump). New
`qtimer.editor.*` LOCALES (en/it/fr). The editor is inlined in the main bundle too (imported).
(2) **valve fixed everywhere** — valve was falling through to the default branch → `valve.turn_on/off`
(non-existent services) → broken schedules AND broken quick-timer restore. Since **valve ≡ cover**
(open/close/stop/set_position, `current_position`, position data key, open/closed state), treated
`cover`+`valve` together via new helper **`_posServices(dom)`** (branches only service names) in
`base-card.js`: `_buildScheduleActions`, `_buildStopActions`, `_endActionTypes`, `domainSection`
(reuses cover UI/`name="cover-action"`/`.position-slider` → no listener changes), edit parse-back
(`coverAction` regex `cover|valve`), `_activeValueMatchExpr` (override), + `_domainIconMdi` valve icon.
`_entityCaps.coverPosition` already generic → no change. `quick-timer-card.js`: valve branch in
`_buildRestoreActions`/`_heldLabel`. Fixes editing card + view card (shared popup/builders). Build OK,
`check` green on all 3 bundles. **Released v1.2.3** (package.json bump, commit, push main, tag + GitHub
release with the 3 dist assets via `gh release create --target main`). To validate in HA: editor
round-trips to YAML + `card:` preserved; valve schedule create/edit/auto-off + quick-timer hold/restore.
2026-06-22 22:34 Rome (v1.2.2 release prep) — bumped `package.json` to 1.2.2; **fix doppia voce nel
card-picker**: con la doppia risorsa (utenti che avevano aggiunto la risorsa standalone `quick-timer-card.js`
come da istruzioni v1.2.0/1.2.1) la card appariva due volte nel menu "Aggiungi card" — il `customElements.define`
era guardato (niente crash) ma il `customCards.push` no. Spostato il `push` DENTRO la guardia
`if(!customElements.get('quick-timer-card'))` in `src/quick-timer-card.js` → solo il primo bundle caricato
registra elemento + voce di menu. README/CLAUDE.md allineati (4 card inlined, v1.2.1→v1.2.2, "two cards"→"four",
3 entry IIFE, albero src con quick-timer-card.js + lz-string.js). Aggiunto `.github/workflows/release.yml`
(`workflow_dispatch`) che builda i 3 bundle e crea la release con gli asset (il proxy git locale blocca il
push dei tag → la release va lanciata da Actions). Build OK, `check` verde sui 3 bundle.
2026-06-22 Rome (fix: quick-timer-card missing for HACS users) — added `import './quick-timer-card.js'`
in `src/weekly-schedule-card.js` so the main HACS bundle now includes all four custom elements
(`weekly-schedule-card`, `weekly-schedule-view-card`, `weekly-schedule-mini-card`, `quick-timer-card`).
Previously HACS only delivered the main bundle (`hacs.json filename: weekly-schedule-card.js`) and
the quick-timer-card was never inlined, leaving HACS users without it. Bundle grew ~15 KB (+6%).
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