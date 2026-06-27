# 📝 Nota per il rilascio v1.2.7

Patch sopra la **v1.2.6** (già rilasciata, con i 4 nuovi domini lock / input_boolean /
humidifier / water_heater). La 1.2.6 però è stata mergiata **prima** che il bug fix qui
sotto entrasse nel branch → è rimasto fuori. Questa 1.2.7 lo spedisce.

## 🐞 Cosa corregge
**Modifica di uno schedule climate hvac/preset-only (senza temperatura) sulla prima
entità di un gruppo.** `_openEditPopup` risolveva l'`entityConf` solo da
`s.attributes.entities`, che lo Scheduler lascia VUOTO per le azioni climate hvac-only
(stesso quirk del fix v1.2.4 sul render). Risultato: l'entità risolta era sbagliata →
durata e preset non modificabili/salvabili. Ora gli entity_id si raccolgono anche dalle
`actions` (`entity_id` / `target.entity_id` / `service_data.entity_id`). Verificato a
livello logico su 12 domini (round-trip parse-back ok).

## ✅ Già fatto
- Branch `claude/inspiring-meitner-l59npr` allineato a `main` + commit del fix.
- `package.json` bumpato a **1.2.7**, `dist/` ribuildati (`npm run check` verde).
- `.github/workflows/release.yml` con default **`v1.2.7`** + note corrette.

## 🎯 Minimo indispensabile per rilasciare (2 click)
1. **Merge** della PR (v1.2.7) verso `main`.
2. GitHub → **Actions** → **"Create Release"** → **Run workflow** (versione già `v1.2.7`).
   → builda i 3 bundle e crea tag + release `v1.2.7` con gli asset `dist/*.js`.

In alternativa, da shell con `gh` su `main`:
```bash
gh workflow run release.yml -f version=v1.2.7
```

## 🔎 Da validare in HA
- **Modifica** di uno schedule climate solo-preset/hvac sulla prima entità di un gruppo
  (durata + preset modificabili e salvabili) — il bug originale.
- (Già in 1.2.6, ricontrollare se comodo) lock / humidifier / water_heater / input_boolean.

> Dopo la release, questo file può essere eliminato.
