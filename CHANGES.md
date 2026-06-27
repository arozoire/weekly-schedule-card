# Piano: schedule "usa e getta" (one-shot, auto-eliminazione)

## Obiettivo
Flag in fase di creazione/modifica schedule → lo schedule gira sulla **prossima occorrenza
di ogni giorno selezionato** e poi viene **eliminato** (`scheduler.remove`) dopo l'ultima.
Es. mercoledì imposto lun/mar/ven → gira ven, lun, mar (prossimi) → sparisce dopo il martedì.

## Meccanismo
1. **Scadenza concreta calcolata al salvataggio** (`_computeOneShotExpiry(days, endMin, now)`):
   per ogni giorno selezionato trova la prossima occorrenza il cui **fine-slot** è ancora
   futuro; prende la più lontana → `oneShotExpiry` (timestamp/ISO locale).
   - Conversione giorni WSC (0=lun..6=dom) → JS `getDay` (0=dom): `js=(d+1)%7`.
   - `endMin===1440` (mezzanotte) → fine slot = 00:00 del giorno dopo (add 1440 min al day-start).
   - Se il fine-slot di oggi è già passato → spinge alla settimana dopo (≤7 giorni avanti).
2. **Automazione `wsc_oneshot_<eid>`** (`_syncOneShotAutomation`, famiglia di `wsc_autooff_*`):
   - trigger: fine slot → `state_attr(eid,'current_slot') is none` (come auto-off);
   - condition: `now().timestamp() >= <oneShotExpiry_ts>` (vera solo all'ultima occorrenza);
   - action: `scheduler.remove` per l'entity_id dello schedule.
   - `_recreateAutomation` (delete+post) come le altre.
3. **GC client-side** (`_cleanupExpiredOneShots`, chiamato nel load come gli altri cleanup):
   per ogni scheduleLink con `oneShot` e `oneShotExpiry < now`: se lo `switch.schedule_*`
   esiste ancora → `scheduler.remove` + rimozione `wsc_oneshot_*`; in ogni caso pulizia
   storage (toglie l'id da `profile.schedules` e lo `scheduleLink`). Copre HA-spento-al-trigger.

## Storage (scheduleLink)
Nuovi campi: `oneShot: bool`, `oneShotExpiry: <ISO/ts>`, `oneShotAutoId: 'wsc_oneshot_...'`.
Helper: `_getOneShot(entityId)` (legge link), `_saveOneShot(...)` dentro `saveNotify`/`_saveSchedule`.

## File / funzioni toccate (`src/base-card.js`)
- **ps init** (`_openCreatePopup`): `oneShot: false`. (`_openEditPopup`): parse-back da link
  (`oneShot`, e ricalcolo non serve: si rilegge `oneShotExpiry` salvato).
- **Popup UI**: checkbox "Usa e getta — elimina dopo l'ultimo giorno" (sezione vicino a giorni
  o sotto domainSection) + hint. Listener `.chk-oneshot` → `ps.oneShot`.
- **`_saveSchedule`**: se `ps.oneShot` → calcola `oneShotExpiry` (create) o ricalcola se i giorni
  cambiano (edit), salva nel link, chiama `_syncOneShotAutomation`. Se `!oneShot` → rimuove
  eventuale automazione + flag (toggle off).
- **`_syncOneShotAutomation` / `_computeOneShotExpiry`** (nuovi).
- **Cleanup**: `_deleteSchedule`, `_deleteProfile`, `_cleanupOrphanAutomations` → DELETE
  `oneShotAutoId`. `_cleanupExpiredOneShots` chiamato nel load (vicino a `_cleanupFinishedTimers`/
  `_cleanupOrphanAutomations`).
- **`_linkedObjectsHtml`**: riga per l'automazione one-shot (badge stato, Apri/YAML) — coerenza.
- **Indicatore visivo (opz.)**: badge "1×"/icona sui blocchi one-shot nelle viste (nice-to-have,
  valutare in implementazione; non bloccante).

## i18n (LOCALES en/it/fr)
Blocco `oneshot`: `enable` ("Usa e getta"), `hint` ("Elimina lo schedule dopo l'ultimo giorno
selezionato"), `linked` (label oggetto collegato). + eventuale `blk.oneshot` per il badge.

## Edge / note
- Mono-entità invariato.
- Interazione auto-off/condizioni/notifiche: indipendenti, convivono; all'ultima occorrenza
  l'auto-off applica l'azione di fine e l'one-shot rimuove (ordine ok: remove non tocca lo stato
  entità).
- Timezone: confronto su orario locale (browser==HA, caso normale) — documentare il limite.
- La rimozione server-side lascia id stale in storage finché non passa il GC/load → il GC lo
  pulisce; nel frattempo `_getSchedules` non trova lo switch (innocuo).
- `repeat_type` resta `repeat` (la scadenza gestisce il "one-shot", non serve `single`).

## Test
- `_computeOneShotExpiry`: test Node standalone su vari (oggi, set giorni, endMin) → verifica la
  data attesa (incl. mercoledì+lun/mar/ven → martedì prossimo; giorno singolo; endMin=1440).
- Build + `npm run check` verde sui 3 bundle.

## Versione
Bump → **1.2.9** (feature). Workflow/RELEASE_NOTE aggiornati. PR + prompt release.
