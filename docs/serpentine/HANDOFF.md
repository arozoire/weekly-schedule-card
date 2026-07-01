# 🐍 Handoff — `weekly-serpentine-card` (release 1.3.0)

Documento **autosufficiente** per implementare la nuova card serpentina. Non serve la chat
precedente: qui c'è tutto (design congelato, decisioni, piano tecnico, pattern da riusare,
lezioni, workflow). Leggi anche `RELEASE_NOTE_v1.3.0.md` (spec sintetica, già su `main`).

## Stato
- Design **congelato** e approvato dall'utente (via iterazione su mockup).
- 1.2.9 già rilasciata e su `main` (one-shot + feedback timer). Base pulita.
- Branch di lavoro: **`claude/serpentine-1.3.0`** (parte da `main`). NON ancora implementata.
- Nessun codice card ancora scritto: è tutto da fare.

## Mockup di riferimento (in questa cartella)
- `mockup-1-single-entity.svg` — look mono-entità "hero" (il più pulito).
- `mockup-2-multi-entity-FINAL.svg` — **quello approvato**: boustrophedon vero, 3 entità in
  parallelo, indicatore "ora" sottile, niente tacche orarie, niente marker mezzanotte.
  Aprili in un browser per vedere il target esatto.

---

## 1. Cosa è (concept, deciso con l'utente)
Card **decorativa** ("solo per fare bello, stra pulita") che mostra l'intera settimana come
un **nastro continuo a serpentina** (boustrophedon: le righe alternano direzione e sono
collegate da curve a U → un unico flusso che "torna su sé stesso", come una S ripetuta / ∞).

Decisioni FISSE (non re-litigare, sono state discusse a lungo):
1. **Boustrophedon VERO**: LUN scorre →, MAR ←, MER →, … Il tempo nelle righe pari va da
   destra a sinistra. L'utente lo vuole così (estetica > leggibilità stretta).
2. **Mezzanotte all'apice delle curve**: il giorno va "da mezza-curva a mezza-curva" (l'asse
   tempo è continuo lungo TUTTO il nastro, curve incluse; il confine-giorno cade nell'apice
   della U). **NIENTE** marker espliciti di mezzanotte, **NIENTE** tacche 00→24 (rimossi su
   richiesta: si capisce dalle curve).
3. **Indicatore "ORA" SOTTILE**: una linetta ~1.5px perpendicolare al nastro sul punto-tempo
   corrente + un puntino piccolo. Niente glow/etichetta vistosa. (vedi mockup-2)
4. **Multi-entità**: l'utente sceglie le entità; ognuna è una **sotto-corsia parallela** dentro
   il nastro, colore proprio + **legenda** in alto. **≤3 consigliato** per leggibilità →
   mostrare un **avviso soft** se ne mette >3, ma **NESSUN limite rigido** (parole dell'utente:
   "se ne vuole mettere 5 sono cavoli suoi").
5. **Blocchi schedule** = pillole arrotondate lungo la corsia; blocco "attivo ORA" evidenziato.

## 2. Editing (deciso)
- **v1 = decorativa**: click su un blocco → `hass-more-info` dello `switch.schedule_*`.
- **Editing FUTURO = popup esistente**: click → riusare `_openEditPopup` (NIENTE drag sul
  nastro: difficile su curve/righe invertite/cavallo-mezzanotte, rovina l'estetica).
- Costruire il layer **geometria/dati riutilizzabile** così abilitare "click→popup" dopo è
  incrementale. Per la v1 basta il more-info.

## 3. Config YAML (target)
```yaml
type: custom:weekly-serpentine-card
title: "Zona giorno"        # opzionale
language: "it"              # opzionale, auto-detect come le altre card
entities:                   # accetta stringhe o {entity, name, color}
  - climate.camera
  - light.salotto
  - switch.caldaia
```

---

## 4. Piano tecnico

### File & wiring (come le altre card)
- Nuovo file **`src/weekly-serpentine-card.js`** (`class WeeklySerpentineCard extends WeeklyScheduleBase`).
- **`rollup.config.js`**: aggiungere una 4ª entry IIFE → `dist/weekly-serpentine-card.js`
  (name: `WeeklySerpentineCard`), copiando le 3 esistenti.
- **`src/weekly-schedule-card.js`**: aggiungere `import './weekly-serpentine-card.js';` in cima
  (così finisce anche nel bundle main HACS, come quick-timer). Vedi gli altri `import './...'`.
- Registrazione IN FONDO al file (pattern quick-timer, guardato per evitare doppioni col
  doppio-bundle):
  ```js
  if (!customElements.get('weekly-serpentine-card')) {
    customElements.define('weekly-serpentine-card', WeeklySerpentineCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: 'weekly-serpentine-card',
      name: 'Weekly Serpentine Card', description: '...' });
  }
  ```
- **NON** copiare a mano in dist: `npm run build` (rollup) genera i bundle. `npm run check`
  verifica i 4 bundle (aggiornare lo script `check` in package.json per includere il 4°!).
- `scripts/deploy.js` copia già tutti i `dist/*.js` → ok automatico.

### Struttura classe (mono-file, sola lettura — modello quick-timer)
Override TOTALE del lifecycle (NON usa profili/gruppi/storage):
`setConfig` (legge `entities`, `title`, `language`), `set hass` (salva `_hass`, poi `render()`
con debounce/diff se serve), `connectedCallback`/`disconnectedCallback` (tick per l'indicatore
"ora", ~1/min), `getCardSize`, `static getStubConfig`. NIENTE `_openEditPopup`/profili in v1.
Riusa dal base: `t()`, `_esc()`, `_setStyles()`/`_ensureRoot()`, `_detectDomain`, `_parseTime`,
`_minutesToTime`, `PALETTE`, e — se comodo — `_getSchedules(entityId)` (vedi nota sotto).

### Dati
Per ogni entità in config:
- schedule = `switch.schedule_*` che la controllano. Puoi usare `_getSchedules(entityId)` del
  base (ritorna gli schedule per entità via render-cache). **Attenzione**: `_getSchedules` usa
  `_getRenderCache()` che si appoggia a `_hass` (schedulesByEntity è costruita da `hass.states`,
  NON dallo storage) → funziona anche senza `_storageData`. Se dà noie, replica la raccolta:
  filtra `switch.schedule_*` e raccogli gli entity_id da `attributes.entities` **UNITI** a quelli
  nelle `actions` (`entity_id`/`target.entity_id`/`service_data.entity_id`) — lo Scheduler lascia
  `attributes.entities` VUOTO per azioni climate hvac/preset-only (lezione v1.2.4/v1.2.7!).
- Per ogni schedule: `attributes.weekdays` + `attributes.timeslots` (["HH:MM:SS - HH:MM:SS"]).
  Converti giorni con `_getDayIndex(weekday)` (0=lun..6=dom) e orari con `_parseTime` (→minuti).
  Stato "attivo ora": `attributes.current_slot != null` e `state != 'off'`.
- Colore: **per-entità** (dalla config `color`, o `PALETTE[i]`), così la legenda ha senso.
  Blocco attivo-ora → variante più accesa/glow.

### Geometria (SVG) — replica il mockup-2
Il target è ESATTAMENTE `mockup-2-multi-entity-FINAL.svg`. Modello pragmatico approvato:
- 7 corsie orizzontali (una per giorno), stroke unico arrotondato = il "nastro" (curve a U agli
  estremi che alternano lato: dx tra righe 1-2, sx tra 2-3, …). Genera il `path` da parametri
  (numero righe, y-step, raggio U, x-start/x-end).
- Dentro ogni corsia, **N sotto-righe** (una per entità) impilate; le pillole schedule sono
  `<rect rx>` posizionate per tempo→x **lineare** sulla larghezza-giorno, con **boustrophedon**:
  - riga pari (0,2,4,6): 00:00 a sinistra → x = xL + (t/1440)*(xR-xL)
  - riga dispari (1,3,5): 00:00 a destra → x = xR - (t/1440)*(xR-xL)
  Un blocco [t1,t2] → rect da min(xa,xb) larghezza |xb-xa|.
- **Indicatore ORA**: calcola giorno corrente + minuto corrente → x sulla sua corsia; disegna
  linetta sottile (1.5px) perpendicolare + puntino. (Per precisione max si può usare
  `path.getPointAtLength()` sul nastro, ma la posizione per-corsia lineare basta e avanza per v1.)
- Etichette giorno a sinistra (L M M G V S D), legenda entità in alto, header col titolo.
- Palette calda/pulita, sfondo `--ha-card` vars, ombra morbida. Rispetta `prefers-reduced-motion`.
- Nota "mezzanotte all'apice": nel mockup approvato le pillole stanno sulle rette e le curve sono
  il connettore/mezzanotte — l'utente ha approvato QUESTA resa. Non serve mappare i blocchi lungo
  le curve in v1 (complesso). Se in futuro vuoi il tempo continuo esatto sulle curve → path
  parametrico con getPointAtLength (rimandato).

### i18n
Blocco **`serp.*`** in `LOCALES` (base-card.js), en/it/fr: titolo default, legenda, e l'avviso
">3 entità" (es. "Oltre 3 entità la leggibilità cala"). Accesso via `t('serp.xxx')`.

## 5. Lezioni del progetto da NON dimenticare
- **`npm run check` NON esegue il DOM/popup**: bug runtime (ReferenceError ecc.) NON vengono
  colti. Per la logica pura, scrivi mini-test Node nello scratchpad (es. geometria/mapping tempo).
- **Variabili tra metodi**: bug v1.2.8 → una const di `_renderPopup` usata in `_bindPopupEvents`
  (metodo diverso) = ReferenceError che uccide i listener. Tieni le variabili nello scope giusto.
- **entity_id automazioni da ALIAS slug**, non dall'object_id (se mai creerai automazioni qui).
- **`attributes.entities` vuoto** per climate hvac/preset-only → raccogli entity_id anche dalle
  `actions` (vedi sopra).
- Mono-entità resta l'invariante degli schedule; qui la card è multi-entità solo a livello di
  VISUALIZZAZIONE (aggrega più entità), non tocca gli schedule.

## 6. Build / test / commit
```bash
npm ci
npm run build      # genera i 4 bundle IIFE in dist/
npm run check      # deve stampare OK sui 4 bundle (aggiorna lo script per il 4°!)
```
- Sviluppa su `claude/serpentine-1.3.0` (parte da `main` con 1.2.9).
- Bump `package.json` → **1.3.0**; aggiorna `.github/workflows/release.yml` (default `v1.3.0` +
  note) e `hacs.json` se elenca i file; aggiungi voce in `CLAUDE.md` "Last modified".
- Commit con Co-Authored-By, PR verso `main`, poi rilascio via **Actions → Create Release →
  Run workflow v1.3.0** (il proxy git locale blocca il push dei tag → release da Actions).
- Chiudi SEMPRE con un prompt pronto per l'altro Claude (Codespace) per merge+release.

## 7. Validare in HA (dopo)
Card con 1 entità (hero look), poi 2-3 (parallelo + legenda), avviso >3; indicatore ORA sul
giorno corrente; click blocco → more-info; auto-detect lingua.
