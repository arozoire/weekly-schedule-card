// src/weekly-serpentine-card.js
// Last modified: 2026-07-03 Rome (v1.3.4 — sub-lane order alternates per row; concentric, non-overlapping curve lanes)
//
// Decorative card: the whole week as one continuous boustrophedon ribbon (LUN →, MAR ←,
// MER →, … connected by rounded U-turns; midnight sits at the apex of each curve, no
// explicit tick marks). Multi-entity: each entity is a parallel sub-lane with its own
// color + legend, soft warning past 3 (no hard limit). Click a pill → the SAME rich
// edit-schedule popup used by the editing/view cards (_openEditPopup), so this inherits
// WeeklyScheduleBase's DEFAULT `hass`/connectedCallback (storage fetch, default-profile
// bootstrap, cross-card sync) instead of overriding them — same lifecycle as
// weekly-schedule-card/weekly-schedule-view-card, just without a groups/profiles UI of
// its own (new schedules land in the first/default profile via _getSelectedProfile's
// fallback). Own additions: a periodic tick for the "now" indicator.

import WeeklyScheduleBase, { PALETTE } from './base-card.js';

const W = 380;                 // fixed viewBox width (scales responsively via CSS)
const MARGIN = 28;              // svg-edge → curve apex, both sides
const DAY_LABEL_X = 18;
const SUBLANE_STEP = 9;         // vertical distance between adjacent entity sub-lane centers
const PILL_H = 7;
const PILL_RX = 3.5;
const PILL_PAD = 3;             // padding added to ribbon stroke width around the sub-lanes
const ROW_GAP = 18;             // gap between ribbon strokes across rows
const LEGEND_SWATCH = 9;
const LEGEND_ITEM_GAP = 20;
const LEGEND_LINE_H = 17;
const TOP_PAD = 8;
const TITLE_H = 26;
const GAP_TITLE_LEGEND = 12;
const GAP_LEGEND_ROWS = 40;
const BOTTOM_PAD = 22;

class WeeklySerpentineCard extends WeeklyScheduleBase {
  constructor() {
    super();
    this._serpTick = null;
  }

  setConfig(config) {
    this._config = config || {};
    const raw = Array.isArray(config?.entities) ? config.entities : [];
    this._entities = raw.map(e => {
      const o = typeof e === 'string' ? { entity: e } : (e || {});
      return { entity: o.entity, name: o.name || null, color: o.color || null };
    }).filter(e => !!e.entity);
    this._snap = config?.snap || 15; // usato dal popup di modifica (drag/snap dello slot)
    this._lang = null;
  }

  static getStubConfig() { return { entities: [] }; }
  getCardSize() { return 6; }

  // hass getter/setter: NOT overridden — inherits WeeklyScheduleBase's default (fetches/
  // maintains _storageData, bootstraps the default profile, gates render() while a popup
  // is open, refetches on cross-card/cross-device storage changes). Needed so the edit
  // popup opened from a pill (save/conditions/notifications/linked-objects panel) works
  // exactly like it does from the other two cards.

  connectedCallback() {
    super.connectedCallback();
    // Only the "ora" indicator needs a periodic tick; a full re-render (cheap SVG string
    // rebuild) once a minute is simpler than patching two coordinates in place. Skipped
    // while the edit popup is open so it doesn't get disturbed mid-edit.
    if (!this._serpTick) this._serpTick = setInterval(() => { if (!this._popupState) this.render(); }, 60000);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._serpTick) { clearInterval(this._serpTick); this._serpTick = null; }
  }

  // ── Colore per-entità ──────────────────────────────────────────────────────

  _entityColor(ec, i) { return ec.color || PALETTE[i % PALETTE.length]; }

  _hexToRgb(hex) {
    let h = String(hex).trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const num = parseInt(h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  _lighten(hex, amt) {
    const rgb = this._hexToRgb(hex);
    if (!rgb) return hex;
    const f = c => Math.min(255, Math.round(c + (255 - c) * amt));
    return `rgb(${f(rgb[0])},${f(rgb[1])},${f(rgb[2])})`;
  }

  // ── Testo (legenda): larghezza reale via canvas offscreen, per un wrap corretto ──

  _measureCtx() {
    if (!this._mctx) this._mctx = document.createElement('canvas').getContext('2d');
    return this._mctx;
  }
  _textWidth(str, font) {
    const ctx = this._measureCtx();
    ctx.font = font;
    return ctx.measureText(str).width;
  }

  // ── Dati: blocchi per giorno/entità ─────────────────────────────────────────

  _dayNow() {
    const now = new Date();
    return { day: (now.getDay() + 6) % 7, minutes: now.getHours() * 60 + now.getMinutes() };
  }

  _blocksFor(entity, dayIndex, nowInfo) {
    const scheds = this._getSchedules(entity).filter(s => !(s.attributes.tags || []).includes('weekly_schedule_auto'));
    const out = [];
    for (const s of scheds) {
      if (!this._appliesToDay(s.attributes.weekdays || [], dayIndex)) continue;
      for (const slot of s.attributes.timeslots || []) {
        const [a, b] = slot.split(' - ');
        const t1 = this._parseTime(a);
        let t2 = this._parseTime(b); if (t2 === 0) t2 = 1440;
        const isOff = s.state === 'off';
        const isActive = !isOff && dayIndex === nowInfo.day && nowInfo.minutes >= t1 && nowInfo.minutes < t2;
        out.push({ t1, t2, isOff, isActive, schedule: s });
      }
    }
    return out;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  _styles() {
    return `
      :host{display:block}
      ha-card{padding:12px 14px}
      .serp-svg{display:block;width:100%;height:auto}
      .serp-empty{padding:20px 4px;text-align:center;color:var(--secondary-text-color)}
      .serp-empty-sub{font-size:.82em;margin-top:4px}
      .serp-warn{margin-top:8px;padding:6px 10px;border-radius:8px;font-size:.75em;color:var(--secondary-text-color);background:color-mix(in srgb,var(--warning-color,#ff9800) 10%,transparent);display:flex;align-items:center;gap:6px}
      .serp-warn ha-icon{--mdc-icon-size:15px;color:var(--warning-color,#ff9800);flex-shrink:0}
      .serp-pill{cursor:pointer;transition:opacity .15s,filter .15s}
      .serp-pill:hover{filter:brightness(.92)}
      @media (prefers-reduced-motion: reduce){.serp-pill{transition:none}}
    `;
  }

  render() {
    if (!this._hass || !this._config || !this._storageData) return;
    this._setStyles('serp', this._styles());
    const root = this._ensureRoot();
    const entities = this._entities || [];

    if (!entities.length) {
      root.innerHTML = `<ha-card>
        <div class="serp-empty">
          <div>${this._esc(this.t('card.no_entities'))}</div>
          <div class="serp-empty-sub">${this._esc(this.t('serp.no_entities'))}</div>
        </div>
      </ha-card>`;
      return;
    }

    const svg = this._buildSvg(entities);
    const warn = entities.length > 3
      ? `<div class="serp-warn"><ha-icon icon="mdi:information-outline"></ha-icon><span>${this._esc(this.t('serp.many_entities'))}</span></div>`
      : '';

    root.innerHTML = `<ha-card>${svg}${warn}</ha-card>`;

    root.querySelectorAll('[data-schedule]').forEach(el => {
      el.addEventListener('click', () => this._openEditPopup(el.dataset.schedule));
    });
  }

  // ── Geometria SVG ────────────────────────────────────────────────────────

  _buildSvg(entities) {
    const nEnt = entities.length;
    const strokeWidth = Math.max(18, (nEnt - 1) * SUBLANE_STEP + PILL_H + PILL_PAD);
    const curveBump = strokeWidth + 2;
    const rowStep = strokeWidth + ROW_GAP;
    const xL = MARGIN + curveBump;
    const xR = W - MARGIN - curveBump;

    const titleRaw = this._config.title || this.t('serp.title_default');
    const titleText = this._esc(titleRaw);

    // Legenda: wrap in righe usando la larghezza reale del testo (canvas offscreen).
    const legendFont = '600 10.5px -apple-system,Segoe UI,Roboto,sans-serif';
    const colors = entities.map((e, i) => this._entityColor(e, i));
    const labels = entities.map((e, i) => e.name || this._hass.states[e.entity]?.attributes?.friendly_name || e.entity);
    const availW = W - 2 * DAY_LABEL_X;
    const legendLines = [[]];
    let lineW = 0;
    labels.forEach((lbl, i) => {
      const itemW = LEGEND_SWATCH + 5 + this._textWidth(lbl, legendFont) + LEGEND_ITEM_GAP;
      if (lineW + itemW > availW && legendLines[legendLines.length - 1].length) {
        legendLines.push([]);
        lineW = 0;
      }
      legendLines[legendLines.length - 1].push(i);
      lineW += itemW;
    });

    let y = TOP_PAD + TITLE_H;
    const titleBaseline = y - 8;
    y += GAP_TITLE_LEGEND;
    const legendSvg = legendLines.map(line => {
      let x = DAY_LABEL_X;
      const row = line.map(i => {
        const sw = `<rect x="${x}" y="${y}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" rx="2.5" fill="${colors[i]}"/>`;
        const tx = x + LEGEND_SWATCH + 5;
        const txt = `<text x="${tx}" y="${y + 8}" font-size="10.5" font-weight="600" style="fill:var(--secondary-text-color,#5a6772)">${this._esc(labels[i])}</text>`;
        x += LEGEND_SWATCH + 5 + this._textWidth(labels[i], legendFont) + LEGEND_ITEM_GAP;
        return sw + txt;
      }).join('');
      y += LEGEND_LINE_H;
      return row;
    }).join('');

    y += GAP_LEGEND_ROWS - LEGEND_LINE_H;
    const yTop = y;
    const rowY = i => yTop + i * rowStep;

    // Nastro (boustrophedon): righe pari L→R, dispari R→L, curve a U agli estremi.
    let ribbon = `M${xL},${rowY(0)} L${xR},${rowY(0)}`;
    for (let i = 0; i < 6; i++) {
      const y0 = rowY(i), y1 = rowY(i + 1);
      if (i % 2 === 0) {
        // riga i finiva a destra (xR) → bump a destra verso la riga i+1 (che parte da xR)
        ribbon += ` C${xR + curveBump},${y0} ${xR + curveBump},${y1} ${xR},${y1} L${xL},${y1}`;
      } else {
        // riga i finiva a sinistra (xL) → bump a sinistra
        ribbon += ` C${xL - curveBump},${y0} ${xL - curveBump},${y1} ${xL},${y1} L${xR},${y1}`;
      }
    }

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = dayKeys.map(k => (this.t(`days.${k}`) || k).charAt(0).toUpperCase());
    const dayLabelsSvg = dayLabels.map((l, i) =>
      `<text x="${DAY_LABEL_X}" y="${rowY(i) + 4}" font-size="10" font-weight="700" style="fill:var(--secondary-text-color,#aeb9c4)">${this._esc(l)}</text>`
    ).join('');

    const nowInfo = this._dayNow();

    // Sotto-corsie come in un nastro VERO: l'ordine verticale delle entità si alterna a
    // ogni riga (lun 1ª sopra, mar 1ª sotto, mer 1ª sopra, …) perché attraverso una U la
    // corsia esterna resta esterna e quella interna resta interna — così dentro le curve
    // le corsie sono archi CONCENTRICI che non si accavallano mai (richiesta utente).
    const baseOffsets = entities.map((_, i) => (i - (nEnt - 1) / 2) * SUBLANE_STEP);
    const rowOff = (d, ei) => (d % 2 === 0 ? baseOffsets[ei] : -baseOffsets[ei]);

    // Metà-curva della U tra le righe i e i+1: split de Casteljau a t=0.5 della cubica
    // del nastro, resa CONCENTRICA per la sotto-corsia — `offIn` è l'offset della corsia
    // sulla riga i (in ingresso); la corsia esce sulla riga i+1 a `-offIn` (ordine
    // alternato) e il bump orizzontale scala col raggio (distanza dal centro della U).
    // L'apice (= mezzanotte) cade a metà strada esatta tra le due righe — è lo STESSO
    // punto sia per il blocco che finisce il giorno i sia per quello che inizia il
    // giorno i+1: i due round-cap si sovrappongono lì e la pillola "gira" col nastro.
    const halfCurveD = (i, offIn, half) => {
      const yA = rowY(i) + offIn, yB = rowY(i + 1) - offIn, ym = (yA + yB) / 2;
      const s = i % 2 === 0 ? 1 : -1; // curva a destra dopo le righe pari, a sinistra dopo le dispari
      const xE = s === 1 ? xR : xL;
      const cb = curveBump * (1 - offIn / (rowStep / 2)); // concentrica: raggio ∝ distanza dal centro
      const c1 = xE + s * cb / 2, c2 = xE + s * cb * 0.75;
      const f = n => n.toFixed(1);
      return half === 'out'
        ? `L${f(xE)},${f(yA)} C${f(c1)},${f(yA)} ${f(c2)},${f((3 * yA + yB) / 4)} ${f(c2)},${f(ym)}`
        : `M${f(c2)},${f(ym)} C${f(c2)},${f((yA + 3 * yB) / 4)} ${f(c1)},${f(yB)} ${f(xE)},${f(yB)}`;
    };
    let pills = '';
    for (let d = 0; d < 7; d++) {
      const even = d % 2 === 0;
      const y0 = rowY(d);
      entities.forEach((ec, ei) => {
        const blocks = this._blocksFor(ec.entity, d, nowInfo);
        const color = colors[ei];
        for (const b of blocks) {
          const x1 = even ? xL + (b.t1 / 1440) * (xR - xL) : xR - (b.t1 / 1440) * (xR - xL);
          const x2 = even ? xL + (b.t2 / 1440) * (xR - xL) : xR - (b.t2 / 1440) * (xR - xL);
          const h = b.isActive ? PILL_H + 3 : PILL_H;
          const laneY = y0 + rowOff(d, ei);
          const opacity = b.isOff ? 0.35 : (b.isActive ? 1 : 0.88);
          const fill = b.isActive ? color : `url(#serp-grad-${ei})`;
          const glow = b.isActive ? ` style="filter:drop-shadow(0 0 3px ${color})"` : '';
          const attrs = `class="serp-pill" data-schedule="${this._escAttr(b.schedule.entity_id)}" opacity="${opacity}"${glow}`;
          // Un blocco che tocca la mezzanotte (inizio/fine giornata) fluisce DENTRO la
          // curva a U fino all'apice (mezzanotte = apice): reso come <path> con stroke
          // round-cap che segue la metà-curva del nastro, così due slot adiacenti a
          // cavallo di mezzanotte (es. 23:25-00:00 + 00:00-00:45) si incontrano
          // esattamente all'apice e si leggono come un unico flusso continuo.
          const NEAR_MIDNIGHT = 15; // minuti, stessa granularità dello snap/time_step del progetto
          const startsMid = b.t1 <= NEAR_MIDNIGHT && d > 0;      // curva in ingresso (riga d-1 → d)
          const endsMid = b.t2 >= 1440 - NEAR_MIDNIGHT && d < 6; // curva in uscita (riga d → d+1)
          if (startsMid || endsMid) {
            const h2 = h / 2; // i round-cap sporgono di h/2 oltre gli estremi del path
            let dp;
            if (startsMid) {
              dp = halfCurveD(d - 1, rowOff(d - 1, ei), 'in'); // dall'apice fino al bordo della riga d
            } else {
              const sx = even ? Math.min(x1 + h2, xR) : Math.max(x1 - h2, xL);
              dp = `M${sx.toFixed(1)},${laneY.toFixed(1)}`;
            }
            if (endsMid) {
              dp += ' ' + halfCurveD(d, rowOff(d, ei), 'out'); // dal bordo della riga d fino all'apice
            } else {
              const ex = even ? Math.max(x2 - h2, xL) : Math.min(x2 + h2, xR);
              dp += ` L${ex.toFixed(1)},${laneY.toFixed(1)}`;
            }
            pills += `<path ${attrs} d="${dp}" fill="none" stroke="${fill}" stroke-width="${h}" stroke-linecap="round"></path>`;
          } else {
            let rx0 = Math.min(x1, x2), rx1 = Math.max(x1, x2);
            // Bordo settimana (inizio lunedì / fine domenica): lì il nastro non ha curva,
            // resta solo il piccolo bleed verso il round-cap del nastro.
            const bleed = curveBump * 0.6;
            if (b.t1 <= NEAR_MIDNIGHT && d === 0) rx0 -= bleed;
            if (b.t2 >= 1440 - NEAR_MIDNIGHT && d === 6) rx1 += bleed;
            const rw = Math.max(1, rx1 - rx0);
            const ry = laneY - h / 2;
            pills += `<rect ${attrs} x="${rx0.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${h}" rx="${PILL_RX}" fill="${fill}"></rect>`;
          }
        }
      });
    }

    // Indicatore "ora": linetta sottile perpendicolare al nastro sul giorno corrente.
    const td = nowInfo.day, tEven = td % 2 === 0;
    const ty = rowY(td);
    const tx = tEven ? xL + (nowInfo.minutes / 1440) * (xR - xL) : xR - (nowInfo.minutes / 1440) * (xR - xL);
    const half = strokeWidth / 2 + 2;
    const nowSvg = `<g opacity="0.85"><title>${this._esc(this.t('serp.now'))}</title>
        <line x1="${tx.toFixed(1)}" y1="${(ty - half).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty + half).toFixed(1)}" style="stroke:var(--primary-text-color,#5b6b7a)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="2.4" style="fill:var(--primary-text-color,#5b6b7a)"/>
      </g>`;

    const H = rowY(6) + strokeWidth / 2 + BOTTOM_PAD;

    const gradDefs = colors.map((c, i) => `<linearGradient id="serp-grad-${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${this._lighten(c, 0.3)}"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join('');

    return `<svg class="serp-svg" viewBox="0 0 ${W} ${H.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${this._escAttr(titleRaw)}">
      <defs>${gradDefs}</defs>
      <text x="${DAY_LABEL_X}" y="${titleBaseline}" font-size="15" font-weight="700" style="fill:var(--primary-text-color,#28323c)">${titleText}</text>
      ${legendSvg}
      <path d="${ribbon}" fill="none" style="stroke:var(--divider-color,#e0e4e8)" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.75"/>
      ${dayLabelsSvg}
      ${pills}
      ${nowSvg}
    </svg>`;
  }
}

if (!customElements.get('weekly-serpentine-card')) {
  customElements.define('weekly-serpentine-card', WeeklySerpentineCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'weekly-serpentine-card',
    name: 'Weekly Serpentine Card',
    description: 'Decorative weekly view: the whole week as one continuous boustrophedon ribbon.',
    preview: false,
  });
}

export default WeeklySerpentineCard;
