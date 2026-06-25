# 📝 Nota per il rilascio v1.2.6

Ciao 👋 — qui nell'ambiente remoto il proxy git locale blocca il push dei tag,
quindi NON ho potuto creare la release. È tutto pronto: serve solo cuocere il tag.

## ✅ Già fatto
- Codice + `dist/` buildati e pushati (branch `claude/inspiring-meitner-l59npr`).
- **PR aperta verso `main`**.
- `package.json` bumpato a **1.2.6**, `CLAUDE.md` aggiornato.
- `.github/workflows/release.yml` aggiornato: default versione **`v1.2.6`** + note già corrette.

## 🎯 Minimo indispensabile per rilasciare (2 click)
1. **Merge** della PR verso `main`.
2. GitHub → tab **Actions** → workflow **"Create Release"** → **Run workflow**
   (il campo versione è già `v1.2.6`) → Run.
   → builda i 3 bundle e crea il tag + release `v1.2.6` con gli asset `dist/*.js`.

In alternativa, da una shell con `gh` su `main`:
```bash
gh workflow run release.yml -f version=v1.2.6
# oppure manualmente:
npm ci && npm run check
gh release create v1.2.6 --target main \
  --title "v1.2.6 — lock / input_boolean / humidifier / water_heater" \
  dist/weekly-schedule-card.js dist/weekly-schedule-view-card.js dist/quick-timer-card.js
```

## 🔎 Da validare in HA (post-release, quando possibile)
- schedule **lock** (blocca/sblocca + auto-off), **humidifier** (umidità/modalità),
  **water_heater** (temperatura/modalità operativa), **input_boolean** on/off;
- quick-timer hold + restore sui nuovi domini;
- selezione dei nuovi domini nella creazione/modifica gruppi.

> Dopo la release, questo file può essere eliminato.
