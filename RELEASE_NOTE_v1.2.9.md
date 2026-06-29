# 🚧 Release 1.2.9 — in preparazione (lista viva)

Stato: **WIP, non rilasciato.** `package.json` è ancora a 1.2.8 (bump a 1.2.9 solo al
momento del rilascio). `main` è a v1.2.8. Tutto il lavoro è sul branch
`claude/inspiring-meitner-l59npr`.

Quando si rilascia: bump `package.json` → 1.2.9, aggiornare `release.yml` (default `v1.2.9`)
+ questa nota, `npm run check`, PR → merge → Actions → Create Release → Run workflow `v1.2.9`.

---

## ✅ Fatto (già sul branch)

### 1. Quick-timer — feedback onesto all'avvio + anti doppio-click
Sintomo: a volte "Avvia" non partiva o sembrava lento. Causa: `_startTimer` fa 3 await in
sequenza (DELETE+POST automazione, attesa entità fino 6s, `automation.trigger`) e il
countdown appariva solo alla fine → nessun feedback 1-3s + nessun blocco → il ri-click
creava una corsa (il DELETE del 2° avvio cancellava l'automazione del 1° prima del trigger).

Ora il piede della card mostra gli step reali e rimuove il pulsante (anti doppio-click):
- **"Stato in acquisizione…"** → **"Stato acquisito: \<label\>"** (spento / 40% / fan only /
  bloccato / eco · 50°C …, via nuovo `_restoreLabel`) → **countdown**.
- Errori: **"Stato non acquisito"** (restore vuoto) o errore automazione (~2.5s, poi torna il
  pulsante). `automation.trigger` non più ingoiato: se fallisce → niente record-timer fantasma.
- LOCALES `qtimer.acquiring/acquired/acquire_failed/starting` (en/it/fr).
- `_restoreLabel` verificato su 13 domini (test Node).

---

## ⏳ Da fare (pianificato, non ancora implementato)

### 2. Schedule "usa e getta" (one-shot, auto-eliminazione)
Piano dettagliato e approvato in **`CHANGES.md`**. Sintesi:
- Flag in creazione/modifica → lo schedule gira sulla **prossima occorrenza di ogni giorno
  selezionato** e poi si **auto-elimina** (`scheduler.remove`) dopo l'ultima.
- Es: mercoledì imposto lun/mar/ven → gira ven, lun, mar (prossimi) → sparisce dopo il martedì.
- Meccanismo: `oneShotExpiry` (datetime) calcolata al salvataggio = la più lontana tra le
  prossime occorrenze; automazione `wsc_oneshot_<eid>` che a fine slot fa `scheduler.remove`
  quando `now() >= scadenza`; GC client-side al load come rete di sicurezza.
- Decisioni confermate dall'utente: **eliminare** (non disabilitare) · **prossima occorrenza
  di ogni giorno scelto**.
- Aperti (da decidere in implementazione): indicatore visivo sui blocchi one-shot (badge);
  posizione checkbox nel popup (sotto la selezione giorni).

---

## Idee/eventuali (non confermate)
- Traduzione nomi modalità hvac nel feedback timer ("fan_only" → "solo ventola") — al momento
  mostrato raw con `_`→spazio. Da fare solo se richiesto.
