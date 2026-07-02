# CHANGES — schedule "azione personalizzata" (pro/nascosta)

Feature: flag per-schedule `customAction`. Quando attivo, la card gestisce SOLO il *quando*
(giorni/ore, drag/slot invariati) e NON genera alcuna azione reale sull'entità; manda un solo
placeholder innocuo (`logbook.log`) per soddisfare lo schema dello Scheduler Component (min 1
azione/timeslot). L'utente scrive a mano la propria automazione HA agganciata a `current_slot`
dello `switch.schedule_XXX`. Segue il pattern del flag `oneShot`.

Decisioni prese con l'utente:
- Nome campo: **`customAction`** (`ps.customAction` / `link.customAction`).
- UI: checkbox in una **nuova sezione "Avanzate" collassabile in fondo al popup** (sotto le
  notifiche), chiusa di default → poco in vista, stile "pro".
- Placeholder log: `logbook.log` con `name = ps.name || 'WSC'`, `message = 'Schedule triggered: <entità>'`
  (fisso, inglese).
- Hint: solo testo (come si aggancia l'automazione a `current_slot`), **niente link a doc**.

## File toccati: SOLO `src/base-card.js` (+ build)

### 1. i18n — blocco `customaction` in `LOCALES` (en/it/fr)
Accanto ai blocchi `oneshot:` (righe ~27 / ~48 / ~69). Chiavi:
- `enable`: label checkbox (es. EN "Custom action (advanced)", IT "Azione personalizzata (avanzato)",
  FR "Action personnalisée (avancé)").
- `hint`: nota che sostituisce la sezione azione-per-dominio quando attivo. Testo (IT, adattato
  en/fr): "Questo schedule gestisce solo l'orario. Nessuna azione viene eseguita sull'entità:
  crea una tua automazione Home Assistant con trigger sull'attributo `current_slot` di questo
  schedule (da/verso `none`) per definire cosa fare all'inizio e alla fine dello slot."
- `advanced`: label header della sezione collassabile "Avanzate" / "Advanced" / "Avancé".

### 2. `_getCustomAction(scheduleEntityId)` — nuovo, accanto a `_getOneShot` (~riga 573)
Legge `link.customAction` da `scheduleLinks` in tutti i profili; ritorna `!!link.customAction`
(default `false`).

### 3. Init popup — `customAction: false`
- `_openCreatePopup` (~riga 2642, accanto a `oneShot: false`): aggiungo `customAction: false,`
  e `_advOpen: false,` (stato apertura sezione Avanzate).
- `_openEditPopup` (~riga 2770, accanto a `oneShot: this._getOneShot(...)`): aggiungo
  `customAction: this._getCustomAction(entityId),` e `_advOpen: false,`.

### 4. `_buildScheduleActions(ps)` (riga 1362) — early-return in cima
Prima di qualsiasi altra logica:
```js
if (ps.customAction) {
  const eid = ps.entityConf.entity;
  return [{ service: 'logbook.log', data: { name: ps.name || 'WSC', message: `Schedule triggered: ${eid}` } }];
}
```
Nessun `target`/effetto su entità reali. Zero rischio per gli altri domini (early-return).

### 5. Render popup (`_renderPopup`)
- **Gate azione-per-dominio + auto-off** (righe 3259-3260):
  - `${ps.customAction ? `<div class="ca-hint">${this.t('customaction.hint')}</div>` : domainSection}`
  - `${ps.customAction ? '' : this._endActionHtml(ps)}` (nasconde "Auto a fine slot": la fine-slot
    la gestisce l'automazione custom dell'utente).
- **Nuova sezione "Avanzate" collassabile** — inserita tra la sezione notifiche (chiude ~3310) e
  `${ps.mode==='edit'?this._linkedObjectsHtml(ps):''}` (~3311). Stessa struttura di
  `cond-section`/`notif-section`:
  ```html
  <div class="adv-section">
    <div class="adv-hdr" id="advToggle">
      <span><ha-icon icon="mdi:cog-outline" .../>${this.t('customaction.advanced')}${ps.customAction?' ✓':''}</span>
      <span>${ps._advOpen?'▾':'▸'}</span>
    </div>
    ${ps._advOpen ? `<div class="adv-body">
      <label class="oneshot-row">
        <input type="checkbox" class="chk-customaction" ${ps.customAction?'checked':''}>
        <span><b><ha-icon icon="mdi:code-braces" .../>${this.t('customaction.enable')}</b><br>
        <span class="oneshot-hint">${this.t('customaction.hint')}</span></span>
      </label>
    </div>` : ''}
  </div>
  ```
  Riuso classi `.oneshot-row`/`.oneshot-hint` esistenti. CSS `.adv-hdr`/`.adv-body`/`.ca-hint`
  mutuati da `.cond-hdr`/`.cond-body` (aggiungo poche regole nel getter degli stili del popup,
  accanto a `.oneshot-*` riga ~3173).

### 6. `_bindPopupEvents` (listeners)
- Accanto al toggle `#condToggle`/`#notifToggle` (righe 3552/3630): 
  `dlg.querySelector('#advToggle')?.addEventListener('click', () => { ps._advOpen=!ps._advOpen; this._renderPopup(); });`
- Accanto al listener `.chk-oneshot` (riga 3413):
  ```js
  dlg.querySelector('.chk-customaction')?.addEventListener('change', e => {
    ps.customAction = e.target.checked;
    if (ps.customAction) { ps.stopAction = null; ps.stopValue = null; } // no auto-off in custom mode
    this._renderPopup(); // swap domainSection/end-action + mostra ✓ header
  });
  ```
  Azzerare `stopAction`/`stopValue` fa sì che `_syncAutoOffAutomation` salti da sola (come da
  HANDOFF §2) — nessun early-return in `_buildStopActions`, non toccata.

### 7. `_saveSchedule` (~riga 3816, accanto a `link.oneShot = !!ps.oneShot`)
`link.customAction = !!ps.customAction;`
Nessuna automazione da sincronizzare per questo flag (niente `_syncCustomActionAutomation`).

### 8. `_linkedObjectsHtml` (polish, ~riga 1878+)
Se `_getCustomAction(eid)` è true, aggiungo una riga informativa statica (senza badge/azioni):
"Azione personalizzata — gestita da un'automazione esterna". Non critico.

## NON toccati (vincoli HANDOFF)
- `_buildStopActions` invariata (customAction la aggira non impostando `stopAction`).
- Logica per-dominio in `_buildScheduleActions` invariata (solo early-return in cima).
- Nessuna `_syncCustomActionAutomation`. Nessuna migrazione storage. Nessun cleanup speciale in
  `_deleteSchedule`/`_cleanupOrphanAutomations` (il flag non crea automazioni proprie).
- Condizioni/notifiche NON ristrette: la notifica inizio/fine slot resta utile anche in questa
  modalità. (Le condizioni in-card sono un edge case sconsigliato con customAction ma innocuo;
  non le blocco per non allargare lo scope.)

## Note
- `oneShot` resta disponibile anche con `customAction` (riguarda il ciclo di vita dello schedule,
  non l'azione) — nessuna interazione da gestire.
- La sezione azione-per-dominio riappare intatta disattivando il flag (dati `ps.*` per dominio
  restano in memoria, solo nascosti dal gate).

## Test headless (stile sessioni precedenti)
1. Create schedule `customAction:true` su climate → `scheduler.add` riceve SOLO
   `[{service:'logbook.log', data:{name, message}}]`, niente azione climate.
2. Nessuna automazione auto-off creata/richiesta per quello schedule (stopAction null).
3. Disattivare il flag su schedule esistente → azione di dominio rigenerata + auto-off di nuovo
   disponibile.
4. Verifica visiva popup: checkbox nella sezione "Avanzate" chiusa di default; sezione
   azione-per-dominio + auto-off sostituite dall'hint quando attivo; header Avanzate mostra ✓.

## Build/verifica
`npm run build && npm run check` verde su tutti e 4 i bundle prima del commit.
Aggiornare `CLAUDE.md` (sezione feature + Last modified) e README se opportuno.
Poi: bump versione, commit, push sul branch; merge/release da gestire dall'altro Claude.
