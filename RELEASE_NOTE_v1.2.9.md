# 📝 Release 1.2.9 — pronta

`package.json` → 1.2.9. `main` è a v1.2.8. Tutto sul branch
`claude/inspiring-meitner-l59npr`.

## Contenuto

### 1. Schedule "usa e getta" (one-shot)
Flag in creazione/modifica → lo schedule gira sulla **prossima occorrenza di ogni giorno
selezionato** e poi si **auto-elimina** (`scheduler.remove`) dopo l'ultima.
Es: mercoledì imposto lun/mar/ven → gira ven, lun, mar (prossimi) → sparisce dopo il martedì.
- `_computeOneShotExpiry(days,endMin)` calcola la scadenza al salvataggio (testato Node, 7 casi).
- Automazione `wsc_oneshot_<eid>`: a fine slot fa `scheduler.remove` quando `now() >= scadenza`.
- GC client `_cleanupExpiredOneShots` al load (rete di sicurezza se HA era spento al trigger).
- Cleanup integrato nei delete/orphan/zombie sweep; riga in "Oggetti collegati"; i18n en/it/fr.

### 2. Quick-timer — feedback onesto all'avvio + anti doppio-click
"Stato in acquisizione…" → "Stato acquisito: \<label\>" → countdown; errori chiari; niente
record-timer fantasma se il trigger fallisce.

> Solo aggiunte additive: nessuna funzionalità esistente modificata.

## 🎯 Rilascio (2 click dopo il merge)
1. **Merge** della PR (v1.2.9) verso `main` — verifica che prenda l'HEAD del branch.
2. GitHub → **Actions** → **"Create Release"** → **Run workflow** (versione già `v1.2.9`).

In alternativa: `gh workflow run release.yml -f version=v1.2.9`.

## 🔎 Da validare in HA
- One-shot: crea uno schedule con flag su più giorni → verifica che giri e poi sparisca dopo
  l'ultimo giorno; controlla l'automazione `wsc_oneshot_*` in "Oggetti collegati".
- Quick-timer: avvio mostra gli step e il countdown; doppio click non rompe nulla.
- Sanity: schedule normali (climate/luci/ecc.) e domini v1.2.6 invariati.

## Prossimo (1.3.0)
`weekly-serpentine-card` — design congelato in `RELEASE_NOTE_v1.3.0.md`.
