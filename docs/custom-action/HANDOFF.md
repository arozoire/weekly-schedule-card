# 🔧 Handoff — schedule "azione personalizzata" (pro/nascosta)

Documento **autosufficiente** per implementare questa funzionalità. Non serve la chat precedente:
qui c'è il contesto, la decisione di design già presa con l'utente, e i punti esatti del codice
da toccare. **Leggi prima `CLAUDE.md`** (architettura/convenzioni del progetto) — questo doc
presuppone che tu l'abbia già letto.

## Stato
- **Design deciso con l'utente, ZERO codice scritto.** Tutto da fare.
- Ultima release: **v1.3.2**, taggata e pubblicata su GitHub, su `main` (verifica comunque tu
  stesso lo stato reale — vedi CLAUDE.md "Regole operative di sessione", punto 1 — non fidarti
  di questo numero se è passato tempo).
- Nessun branch/PR aperti per questa feature. Parti da `main` pulito.

## 1. Il problema che risolve (contesto)
Un utente ha degli switch (Meross via integrazione `meross_lan`) che **non rispondono** ai
servizi standard `switch.turn_on`/`switch.turn_off`, nemmeno chiamati a mano da Sviluppatori→
Azioni (verificato: non è un bug della card, l'azione generata è corretta — il problema è
nell'integrazione/dispositivo, fuori dal nostro controllo). Alcuni dispositivi così rispondono
solo a `switch.toggle`, che però è **inadatto per uno schedule** (non deterministico: se lo stato
si disallinea anche una volta, il toggle fa il contrario di quel che dovrebbe, e l'errore si
propaga). La card oggi non permette di scegliere un servizio diverso da quelli che genera
automaticamente per dominio.

## 2. La soluzione decisa (con l'utente)
Un flag **per-schedule**, pensato come funzionalità "pro" — **nascosta/minimale nella UI**, non
in evidenza — chiamiamola `ps.customAction` (bikeshed il nome se vuoi, ma tieni la coerenza col
resto del codice):

- Quando **attivo**: la card gestisce SOLO il **quando** (giorni/ore, tramite la UI esistente,
  drag/slot invariati). Il **cosa fare** lo scrive l'utente **fuori dalla card**, in una sua
  automazione HA scritta a mano, agganciata allo stesso `switch.schedule_XXX` che la card crea
  (trigger su `current_slot` che passa da/a `none` — stesso pattern già usato da auto-off/notify/
  condizioni, vedi `_syncAutoOffAutomation`/`_syncNotifyAutomation` in `base-card.js`).
- La card **NON deve generare nessuna azione reale** sull'entità quando questo flag è attivo,
  altrimenti entrerebbe in conflitto con l'automazione custom dell'utente.
- **Vincolo tecnico verificato** (ho controllato la sorgente dello Scheduler Component,
  `nielsfaber/scheduler-component`, file `const.py`): lo schema di `scheduler.add`/`scheduler.edit`
  richiede **sempre almeno un'azione per timeslot** —
  `vol.Required(ATTR_ACTIONS): vol.All(cv.ensure_list, vol.Length(min=1), [ACTION_SCHEMA])`.
  Non si può mandare un array vuoto. **Serve un'azione placeholder innocua.**
- **Placeholder scelto (concordato con l'utente)**: `logbook.log` — scrive solo una riga nel
  Registro eventi di HA (es. "Schedule X attivato"), **nessun effetto su nessuna entità reale**,
  ma resta visibile per debug (l'utente può controllare che lo schedule sia scattato). Scartate:
  `persistent_notification.create` (troppo invadente), `system_log.write` (invisibile, meno
  comodo per debug).
- **Auto-off**: **non serve nessuna gestione speciale!** Guarda `_syncAutoOffAutomation` (riga
  ~935 in `base-card.js`): se `_buildStopActions(ps)` ritorna `null`/vuoto (cioè `ps.stopAction`
  non è impostato), la funzione **già** salta la creazione dell'automazione di auto-off e ripulisce
  quella eventualmente esistente (righe 949-950: `if (!endActions || !endActions.length) { await
  cleanup(); return; }`). Quindi: se in modalità "azione personalizzata" semplicemente non si
  imposta/si nasconde `ps.stopAction`, l'auto-off si disattiva da sola, gratis. L'utente gestirà
  anche la fine-slot nella sua automazione custom (stesso trigger `current_slot`, transizione
  verso `none` invece che da `none`).

## 3. Piano tecnico (dove toccare)

Segui il pattern già usato per **`oneShot`** ("usa e getta", v1.2.9) — è l'esempio più simile e
recente di un flag booleano per-schedule aggiunto alla card. Cerca `oneShot` in `base-card.js`
per vedere ESATTAMENTE lo schema da replicare:

- **`_openCreatePopup`** (~riga 2623-2656): inizializza `ps.oneShot: false` — aggiungi
  `ps.customAction: false` allo stesso modo.
- **`_openEditPopup`** (~riga 2659-2785): parse-back da `_getOneShot(entityId)` (~riga 2770) —
  serve un `_getCustomAction(entityId)` analogo che legge da `scheduleLinks` (vedi storage sotto).
- **`_renderPopup`** (~riga 2795+): il checkbox `.chk-oneshot` è renderizzato ~riga 3255, con
  `oneshot.enable`/`oneshot.hint` da i18n. Aggiungi un checkbox analogo (es. `.chk-customaction`)
  — **posizionalo in una zona "avanzata" del popup, non in cima**, per tenerlo poco in vista
  (l'utente ha detto esplicitamente "più o meno nascosto, una funzionalità pro"). Quando è
  **attivo**, la sezione `domainSection` (l'azione per dominio: temperatura/hvac/switch on-off/
  ecc., generata ~righe 2845-2990) andrebbe **nascosta/sostituita** con una breve nota che spiega
  il funzionamento (in stile hint, tipo `oneshot.hint`) — tipo: "Questo schedule gestisce solo
  l'orario. Crea una tua automazione HA agganciata a `current_slot` di questo schedule per
  l'azione. Guida: [eventuale link doc]". **Attenzione**: `domainSection` è calcolato PRIMA del
  return del template (è una variabile, non una funzione inline) — quindi la gate `customAction`
  va messa dove la variabile è usata nel render finale, o al livello del calcolo di
  `domainSection` stesso con un `ps.customAction ? customActionHintHtml : domainSection`.
- **`_bindPopupEvents`** (~riga 3325+): il listener di `.chk-oneshot` è ~riga 3413
  (`ps.oneShot = e.target.checked`). Aggiungi l'equivalente per `.chk-customaction`. Se nascondi/
  mostri `domainSection` dinamicamente al cambio checkbox, serve richiamare `_renderPopup()` nel
  listener (come fanno `#condToggle`/`#notifToggle`, vedi righe 3552/3630) per rigenerare la vista.
- **`_buildScheduleActions(ps)`** (riga 1362): **in cima alla funzione**, prima di tutto il resto,
  aggiungi:
  ```js
  if (ps.customAction) return [{ service: 'logbook.log', data: { name: ps.name || 'WSC', message: `Schedule attivato: ${eid}` } }];
  ```
  (adatta i18n/messaggio). Così qualsiasi dominio, quando il flag è attivo, ignora tutta la
  logica esistente e manda solo il placeholder — **zero rischio di rompere la logica esistente
  per gli altri domini**, perché è un early-return prima di tutto il resto.
- **`ps.stopAction`**: quando `customAction` è attivo, **non impostarlo** (lascialo `null`/non
  mostrare la UI di fine-slot). Se la UI di "Auto a fine slot" resta visibile nel popup anche in
  modalità custom, valuta se nasconderla anche lei per coerenza (probabilmente sì, altrimenti
  l'utente potrebbe impostare comunque un'azione di fine che non farebbe nulla essendo
  `_buildStopActions` comunque chiamata — verifica che `_buildStopActions` NON abbia bisogno di
  un early-return simmetrico: in teoria no, perché se non tocchi `ps.stopAction` resta `null` e
  `_syncAutoOffAutomation` già salta da sola, come spiegato sopra).
- **`_saveSchedule`** (~riga 3788+): dove si salva `link.oneShot = !!ps.oneShot` (~riga 3816),
  aggiungi `link.customAction = !!ps.customAction` sullo `scheduleLink` (stesso oggetto, stesso
  profilo). Nessuna nuova automazione da sincronizzare per questo flag (a differenza di
  `_syncOneShotAutomation`) — è solo un dato che condiziona `_buildScheduleActions`/l'assenza di
  `stopAction`.
- **`_linkedObjectsHtml`** (riga 1878+): valuta se aggiungere una riga informativa quando
  `customAction` è attivo (es. "Azione personalizzata — gestita da un'automazione esterna"), per
  chiarezza nel pannello "Oggetti collegati". Non è la parte critica, è polish.
- **i18n**: nuovo blocco tipo `customaction: { enable: '...', hint: '...' }` in `LOCALES`
  (en/it/fr) in `base-card.js`, seguendo lo stile di `oneshot: {...}` (cercalo per il pattern
  esatto).
- **Storage**: nessuna nuova migrazione necessaria, `customAction` è solo un altro campo booleano
  su `scheduleLink`, stesso oggetto di `oneShot`/`overrideEnabled`/ecc. Nessun cleanup speciale
  richiesto in `_deleteSchedule`/`_cleanupOrphanAutomations` (a differenza di `oneShot`, che ha un
  `oneShotAutoId` da ripulire — `customAction` non crea automazioni proprie, quindi non serve).

## 4. Cosa NON toccare / vincoli
- **Non modificare `_buildStopActions`** — resta invariata, `customAction` la aggira semplicemente
  non impostando `ps.stopAction`.
- **Non toccare la logica esistente per gli altri domini** dentro `_buildScheduleActions` — il
  flag deve essere un early-return in cima, non un `if/else` intrecciato con la logica per dominio.
- **Non serve** una `_syncCustomActionAutomation` o simili — non c'è nessuna automazione da
  generare per questo flag, la card si limita a NON generare l'azione reale.
- Segui il workflow di CLAUDE.md: pianifica in `CHANGES.md`, aspetta conferma dell'utente PRIMA
  di applicare, poi `str_replace` mirati (mai riscrivere file interi), poi `npm run build`/`check`.

## 5. Test suggeriti (headless, stesso stile delle sessioni precedenti)
- Creazione schedule con `customAction: true` su un'entità qualsiasi (es. climate) → verifica che
  `scheduler.add`/`edit` riceva SOLO `[{service:'logbook.log', ...}]` come actions, non l'azione
  di dominio.
- Verifica che NESSUNA automazione auto-off venga creata/richiesta per quello schedule.
- Verifica che disattivando il flag su uno schedule esistente, si torni al comportamento normale
  (azione di dominio rigenerata, auto-off di nuovo disponibile se configurato).
- Verifica visiva del popup: checkbox in posizione "nascosta", sezione azione-per-dominio
  sostituita dall'hint quando il flag è attivo.

## 6. Lezioni della sessione precedente da NON perdere
- **L'utente vuole ragionare insieme PRIMA di ogni modifica di codice** — non implementare di
  slancio, presenta il piano/le domande aperte e aspetta conferma esplicita, anche per dettagli
  minori (nomi campi, wording, posizionamento UI).
- **Verifica sempre le assunzioni contro la fonte reale** quando possibile (es. ho controllato il
  sorgente dello Scheduler Component su GitHub prima di assumere che accettasse array vuoti —
  non accetta). Non dare per scontato il comportamento di dipendenze esterne.
- Build/test come sempre: `npm run build && npm run check` deve passare su tutti e 4 i bundle
  prima di qualsiasi commit.

## 7. Chiusura sessione
Come sempre: chiudi la sessione con un prompt pronto da incollare per l'altro Claude (Codespace)
per gestire PR/release, con numero PR, link, versione da usare in Actions→Create Release.
