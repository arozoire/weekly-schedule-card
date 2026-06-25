# 📝 Nota per il rilascio v1.2.6 (da fare in GitHub Codespace)

Ciao 👋 — questa nota è per un altro Claude che ha accesso a `gh` CLI / push dei tag
(qui nell'ambiente remoto il proxy git locale blocca il push dei tag, quindi NON ho
potuto creare la release io).

## Cosa è già fatto
- Tutto il lavoro è sul branch **`claude/inspiring-meitner-l59npr`** (committato + pushato).
- `package.json` già bumpato a **1.2.6**.
- I 3 bundle in `dist/` sono già buildati (`npm run build` → `npm run check` verde).
- `CLAUDE.md` aggiornato con la nota di sessione.

## Cosa contiene la 1.2.6
Aggiunti 4 nuovi domini controllabili negli schedule + quick-timer + selezione gruppi
(prima solo climate/light/switch/fan/cover/valve):
- **lock** (lock/unlock), **input_boolean** (on/off), **humidifier** (on/off + umidità +
  modalità), **water_heater** (temperatura + modalità operativa).

## Passi per la release
1. Porta le modifiche su `main` (merge del branch `claude/inspiring-meitner-l59npr`,
   o della relativa PR se aperta). La release va taggata su `main`.
2. Verifica il build:
   ```bash
   npm ci
   npm run check   # deve stampare OK sui 3 bundle dist/*.js
   ```
3. Crea il tag + GitHub release con i 3 asset (come per le release precedenti):
   ```bash
   gh release create v1.2.6 \
     --target main \
     --title "v1.2.6 — lock / input_boolean / humidifier / water_heater" \
     --notes "Aggiunti 4 nuovi domini controllabili (lock, input_boolean, humidifier, water_heater) negli schedule, nella quick-timer card e nella selezione entità dei gruppi." \
     dist/weekly-schedule-card.js \
     dist/weekly-schedule-view-card.js \
     dist/quick-timer-card.js
   ```
   In alternativa, lancia il workflow `.github/workflows/release.yml`
   (`workflow_dispatch`) che builda e crea la release con gli asset.

## Da validare in HA (post-release)
- schedule **lock** (lock/unlock + auto-off), **humidifier** (umidità/modalità),
  **water_heater** (temperatura/modalità operativa), **input_boolean** on/off;
- quick-timer hold + restore sui nuovi domini;
- selezione dei nuovi domini nella creazione/modifica gruppi.

> Dopo la release, questo file (`RELEASE_NOTE_v1.2.6.md`) può essere eliminato.
