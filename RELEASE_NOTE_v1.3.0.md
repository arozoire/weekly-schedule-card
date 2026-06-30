# 🐍 Release 1.3.0 — `weekly-serpentine-card` (design congelato, da implementare)

Nuova card **decorativa** che mostra l'intera settimana di un'entità (o più) come un
**nastro continuo a serpentina** (boustrophedon). Da fare DOPO la 1.2.9.

## Concept (deciso con l'utente, mockup v3 approvato)
- **Boustrophedon vero**: 7 corsie (LUN→DOM) che alternano direzione (LUN →, MAR ←, …),
  collegate da curve a U arrotondate → un unico nastro che "torna su sé stesso".
- **Mezzanotte = apice delle curve**: un giorno va da **mezza-curva a mezza-curva** (l'asse
  tempo è continuo lungo TUTTO il nastro, curve incluse; il confine giorno cade nell'apice).
  NIENTE marker espliciti di mezzanotte (si legge dalle curve). NIENTE tacche 00→24.
- **Indicatore "ora"**: sottile — linetta (~1.5px) perpendicolare al nastro sul punto-tempo
  corrente + puntino piccolo. Niente glow/etichetta vistosa.
- **Multi-entità**: l'utente sceglie le entità; ognuna è una **sotto-corsia parallela** dentro
  il nastro, con colore proprio + legenda in alto. **≤3 consigliato** per leggibilità → mostrare
  un avviso soft se >3, ma NESSUN limite rigido (l'utente è libero).
- **Blocchi schedule** = pillole arrotondate lungo la corsia; "attivo ora" evidenziato.
- Estetica: stra pulita, header con nome card/zona, palette per-entità.

## Editing (deciso)
- **Decorativa di base**: click su un blocco → `hass-more-info` dello `switch.schedule_*`.
- **Editing futuro = popup esistente**: click → `_openEditPopup` (riuso totale). NIENTE drag
  sul nastro (difficile su curve/righe invertite/cavallo-mezzanotte, rovina l'estetica).
- Costruire il layer geometria/dati **riutilizzabile** così abilitare click→popup è incrementale.

## Tecnico (bozza)
- Nuovo entry rollup → `dist/weekly-serpentine-card.js`; inline anche nel bundle main (import in
  `src/weekly-schedule-card.js`) come le altre. `customCards.push` guardato.
- Render in **SVG** (path serpentina + pillole posizionate per tempo→lunghezza lungo il nastro).
- Riusa il data-layer di base: `_getSchedules`, `_blockColor`, `_blockLabel`, `_parseTime`,
  palette, `_detectDomain`. Probabilmente `extends WeeklyScheduleBase` con override lifecycle
  (come quick-timer) — sola lettura, niente profili/gruppi.
- Nodo tecnico da risolvere in implementazione: offset delle sotto-corsie lungo le **curve**
  (path paralleli/concentrici) e i blocchi che attraversano la mezzanotte (wrap nell'apice).
- i18n: blocco `serp.*` (en/it/fr) per titolo/legenda/avviso ">3 entità".

## Config YAML (bozza)
```yaml
type: custom:weekly-serpentine-card
title: "Zona giorno"
entities:
  - climate.camera
  - light.salotto
  - switch.caldaia
```

## Stato
Design congelato. Implementazione pianificata come **1.3.0**, dopo il rilascio della 1.2.9
(one-shot + feedback timer).
