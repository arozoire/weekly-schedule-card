// src/quick-timer-card.js
// Last modified: 2026-06-22 Rome (v1.2.1 quick-timer card redesign)
//
// Card legata a UNA entità, in UN'unica ha-card (no divisori): scelta durata in alto → card HA
// nativa incorporata (configurabile via blocco `card:` in YAML, default tile) per impostare il
// valore → pulsante Avvia in fondo. "Il controllo arma il timer": il valore lo imposta l'utente
// col controllo nativo (set reale), Avvia crea solo un'automazione transitoria che dopo la durata
// RIPRISTINA lo stato precedente (baseline: ultimo stato stabile, debounce 30s — NIENTE scene).
// Overlap con schedule: vince l'ultimo attivato (guardia al revert).

import WeeklyScheduleBase from './base-card.js';

class QuickTimerCard extends WeeklyScheduleBase {
  constructor() {
    super();
    this._qtTick = null;
    this._childCard = null;
    this._childBuilding = false;
    this._timers = null;          // { eid: { endTs, autoId, restore[], label, durationS } }
    this._loadingTimers = false;
    this._timerMode = 'duration'; // 'duration' | 'until'
    this._timerMinutes = 30;
    // baseline di ripristino: ultimo stato "stabile" dell'entità (azioni restore) usato come
    // ripristino quando si arma il timer. Si aggiorna quando lo stato è fermo da SETTLE_MS.
    this._settledRestore = null;
    this._lastSig = null;
    this._baselineDebounce = null;
    this._baselineInit = false;
    this._BASELINE_SETTLE_MS = 30000;
  }

  setConfig(config) {
    this._config = config;
    this._entity = config.entity || null;
    this._lang = null;
    this._presets = Array.isArray(config.presets) && config.presets.length ? config.presets : [5, 10, 15, 30, 45, 60];
    this._timerMinutes = config.default_minutes || this._presets[0] || 30;
    this._childCard = null; // forza rebuild della card nativa al cambio config
    // reset baseline (l'entità o la card potrebbero essere cambiate)
    this._baselineInit = false;
    this._settledRestore = null;
    this._lastSig = null;
    if (this._baselineDebounce) { clearTimeout(this._baselineDebounce); this._baselineDebounce = null; }
  }

  getCardSize() { return 4; }
  static getStubConfig() { return { entity: '' }; }
  static getConfigElement() { return document.createElement('quick-timer-card-editor'); }

  get hass() { return this._hass; }
  set hass(hass) {
    const prev = this._prevHass;
    this._prevHass = hass;
    this._hass = hass;
    if (this._childCard) this._childCard.hass = hass;
    this._trackBaseline();

    if (this._timers === null && !this._loadingTimers) {
      this._loadingTimers = true;
      WeeklyScheduleBase._sharedGet(hass, 'quick_timer_card')
        .then(d => { this._timers = (d && d.timers) || {}; this._loadingTimers = false; this._cleanupFinishedTimers().finally(() => this.render()); })
        .catch(() => { this._timers = {}; this._loadingTimers = false; this.render(); });
      this.render();
      return;
    }

    // sync cross-device: i timer cambiano quando cambiano gli input_text.wsc_qt_store_*
    if (prev) {
      const re = /^input_text\.wsc_qt_store_/;
      const keys = new Set([...Object.keys(prev.states), ...Object.keys(hass.states)].filter(k => re.test(k)));
      let storeChanged = false;
      for (const k of keys) { if (prev.states[k]?.state !== hass.states[k]?.state) { storeChanged = true; break; } }
      if (storeChanged && !this._loadingTimers) {
        this._loadingTimers = true;
        WeeklyScheduleBase._sharedGet(hass, 'quick_timer_card')
          .then(d => { this._timers = (d && d.timers) || {}; this._loadingTimers = false; this.render(); })
          .catch(() => { this._loadingTimers = false; });
      }
    }
  }

  connectedCallback() { this._syncTick(); }   // NB: non chiama super (niente listener schedule)
  disconnectedCallback() { this._stopTick(); }

  // ── Timer attivo / countdown ──────────────────────────────────────────────

  _activeTimer() {
    const t = this._timers?.[this._entity];
    if (!t) return null;
    return (t.endTs > Date.now() - 1000) ? t : null;   // scaduto → trattato come assente
  }

  _syncTick() {
    // tick attivo finché esiste un record (countdown se attivo, attesa buffer+GC se scaduto)
    if (this._timers?.[this._entity]) this._startTick(); else this._stopTick();
  }
  _startTick() {
    if (this._qtTick) return;
    this._qtTick = setInterval(() => this._tick(), 1000);
  }
  _stopTick() {
    if (this._qtTick) { clearInterval(this._qtTick); this._qtTick = null; }
  }
  _tick() {
    const rec = this._timers?.[this._entity];
    if (!rec) { this._stopTick(); return; }
    const now = Date.now();
    if (rec.endTs > now) {
      const el = this.shadowRoot.querySelector('.qt-countdown');
      if (el) el.textContent = this._fmtRemaining(rec.endTs - now);
      else this.render();          // banner non ancora mostrato
      return;
    }
    // scaduto: passa ai controlli una volta, poi GC dopo il buffer
    if (!this._expiredRendered) { this._expiredRendered = true; this.render(); }
    if (now > rec.endTs + 30000) {
      this._stopTick();
      this._expiredRendered = false;
      this._cleanupFinishedTimers().finally(() => { this.render(); this._syncTick(); });
    }
  }
  _fmtRemaining(ms) {
    let s = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const p = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }

  // ── Baseline di ripristino ─────────────────────────────────────────────────
  // Il controllo nativo cambia l'entità "live": per ripristinare lo stato PRIMA che
  // l'utente toccasse il controllo, teniamo l'ultimo stato stabile. Durante una raffica
  // di modifiche NON aggiorniamo il baseline (resta il valore pre-raffica); quando lo
  // stato resta fermo per SETTLE_MS il nuovo stato diventa il baseline.

  _trackBaseline() {
    const eid = this._entity;
    if (!eid || !this._hass) return;
    const st = this._hass.states[eid];
    if (!st) return;
    if (this._activeTimer()) return;          // congelato: il restore è già nel record del timer
    const restore = this._buildRestoreActions(eid);
    const sig = JSON.stringify(restore);
    if (!this._baselineInit) {
      this._settledRestore = restore;
      this._lastSig = sig;
      this._baselineInit = true;
      return;
    }
    if (sig === this._lastSig) return;        // nessun cambiamento
    this._lastSig = sig;                      // NON tocco _settledRestore: resta lo stato pre-modifica
    if (this._baselineDebounce) clearTimeout(this._baselineDebounce);
    this._baselineDebounce = setTimeout(() => {
      this._baselineDebounce = null;
      if (!this._activeTimer()) this._settledRestore = this._buildRestoreActions(eid);
    }, this._BASELINE_SETTLE_MS);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this._hass) return;
    this._setStyles('qt', this._styles());
    let card = this.shadowRoot.querySelector('.qt-card');
    if (!card) {
      card = document.createElement('ha-card');
      card.className = 'qt-card';
      // ordine: scelta timer in alto → card nativa al centro → Avvia/countdown in fondo
      card.innerHTML = `<div class="qt-when"></div><div class="qt-native"></div><div class="qt-foot"></div>`;
      this.shadowRoot.appendChild(card);
    }
    const when = card.querySelector('.qt-when');
    const foot = card.querySelector('.qt-foot');
    if (!this._entity) {
      card.querySelector('.qt-native').innerHTML = '';
      when.innerHTML = '';
      foot.innerHTML = `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div><div class="qt-hint">${this.t('qtimer.no_entity')}</div>`;
      return;
    }
    this._ensureChildCard();
    const active = this._activeTimer();
    if (active) {
      when.innerHTML = '';
      foot.innerHTML = this._activeHtml(active);
    } else {
      when.innerHTML = `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div>${this._whenHtml()}`;
      foot.innerHTML = `<button class="qt-start"><ha-icon icon="mdi:play"></ha-icon> ${this.t('qtimer.start')}</button>`;
    }
    this._bindPanel(card);
    this._syncTick();
  }

  async _ensureChildCard() {
    if (this._childCard || this._childBuilding || !this._entity) return;
    this._childBuilding = true;
    try {
      const helpers = await window.loadCardHelpers();
      const el = helpers.createCardElement(this._buildNativeCardConfig());
      el.hass = this._hass;
      this._childCard = el;
      const host = this.shadowRoot.querySelector('.qt-native');
      if (host) { host.innerHTML = ''; host.appendChild(el); }
    } catch (e) {
      console.error('QT: embed card nativa fallito', e);
      const host = this.shadowRoot.querySelector('.qt-native');
      if (host) host.innerHTML = `<ha-card style="padding:12px">${this._esc(this._entity)}</ha-card>`;
    } finally { this._childBuilding = false; }
  }

  _buildNativeCardConfig() {
    // YAML: blocco `card:` con la config completa di qualsiasi card HA (type + opzioni).
    // L'entity di default è quella della quick-timer-card (l'eventuale entity nel blocco vince).
    if (this._config.card) return { entity: this._entity, ...this._config.card };
    if (this._config.tile) return { type: 'tile', entity: this._entity, ...this._config.tile };
    const dom = this._detectDomain(this._entity);
    const caps = this._entityCaps(this._entity);
    const features = [];
    if (dom === 'light') {
      if (caps.lightBrightness) features.push({ type: 'light-brightness' });
      if (caps.lightColorTemp) features.push({ type: 'light-color-temp' });
    } else if (dom === 'climate') {
      features.push({ type: 'target-temperature' });
      if (caps.hvacModes.length) features.push({ type: 'climate-hvac-modes', hvac_modes: caps.hvacModes });
    } else if (dom === 'cover') {
      features.push({ type: 'cover-open-close' });
      if (caps.coverPosition) features.push({ type: 'cover-position' });
    } else if (dom === 'fan') {
      if (caps.fanSpeed) features.push({ type: 'fan-speed' });
    }
    const cfg = { type: 'tile', entity: this._entity };
    if (this._config.name) cfg.name = this._config.name;
    if (features.length) cfg.features = features;
    return cfg;
  }

  _activeHtml(t) {
    return `<div class="qt-active">
        <ha-icon class="qt-active-ic" icon="mdi:timer-sand"></ha-icon>
        <div class="qt-active-info">
          <div class="qt-countdown">${this._fmtRemaining(t.endTs - Date.now())}</div>
          <div class="qt-active-lbl">${this.t('qtimer.holding')}${t.label ? ` · ${this._esc(t.label)}` : ''}</div>
        </div>
        <button class="qt-cancel">${this.t('qtimer.cancel')}</button>
      </div>`;
  }

  _whenHtml() {
    const mode = this._timerMode;
    const chips = this._presets.map(m =>
      `<button class="qt-chip${this._timerMinutes === m && mode === 'duration' ? ' sel' : ''}" data-min="${m}">${m}</button>`).join('');
    const customVal = this._presets.includes(this._timerMinutes) ? '' : this._timerMinutes;
    return `<div class="qt-when-tabs">
        <button class="qt-when-tab${mode === 'duration' ? ' sel' : ''}" data-mode="duration">${this.t('qtimer.duration')}</button>
        <button class="qt-when-tab${mode === 'until' ? ' sel' : ''}" data-mode="until">${this.t('qtimer.until')}</button>
      </div>
      ${mode === 'duration'
        ? `<div class="qt-chips">${chips}<input type="number" class="qt-custom" min="1" placeholder="${this.t('qtimer.custom')}" value="${customVal}"><span class="qt-min">${this.t('qtimer.minutes')}</span></div>`
        : `<div class="qt-row"><span class="qt-lbl">${this.t('qtimer.until')}</span><input type="time" class="qt-until" value="${this._defaultUntil()}"></div>`}`;
  }

  _defaultUntil() {
    const end = new Date(Date.now() + this._timerMinutes * 60000);
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  }

  // ── Binding ───────────────────────────────────────────────────────────────

  _bindPanel(root) {
    root.querySelector('.qt-cancel')?.addEventListener('click', () => this._cancelTimer(this._entity));
    root.querySelector('.qt-start')?.addEventListener('click', () => this._startTimer(root));

    root.querySelectorAll('.qt-chip').forEach(c => c.addEventListener('click', () => {
      this._timerMinutes = parseInt(c.dataset.min, 10);
      this.render();
    }));
    const custom = root.querySelector('.qt-custom');
    custom?.addEventListener('input', () => {
      const v = parseInt(custom.value, 10);
      if (v > 0) { this._timerMinutes = v; root.querySelectorAll('.qt-chip').forEach(x => x.classList.remove('sel')); }
    });
    root.querySelectorAll('.qt-when-tab').forEach(tb => tb.addEventListener('click', () => {
      this._timerMode = tb.dataset.mode;
      this.render();
    }));
  }

  // ── Lettura durata / etichetta ────────────────────────────────────────────

  _readDurationSeconds(panel) {
    if (this._timerMode === 'until') {
      const v = panel.querySelector('.qt-until')?.value;
      if (!v) return 0;
      const [h, m] = v.split(':').map(Number);
      const now = new Date();
      const end = new Date(now); end.setHours(h, m, 0, 0);
      if (end <= now) end.setDate(end.getDate() + 1);
      return Math.round((end - now) / 1000);
    }
    return Math.round((this._timerMinutes || 0) * 60);
  }

  _heldLabel(eid) {
    const st = this._hass.states[eid];
    if (!st) return '';
    const dom = this._detectDomain(eid);
    const a = st.attributes || {};
    if (dom === 'climate') return a.temperature != null ? `${a.temperature}°C` : (st.state || '');
    if (dom === 'cover' || dom === 'valve') return a.current_position != null ? `${a.current_position}%` : st.state;
    if ((dom === 'light' || dom === 'fan') && st.state === 'on') {
      const pct = dom === 'fan' ? a.percentage : (a.brightness != null ? Math.round(a.brightness / 255 * 100) : null);
      return pct != null ? `${pct}%` : this.t('qtimer.on');
    }
    return st.state === 'off' ? this.t('qtimer.off') : this.t('qtimer.on');
  }

  // ── Azioni di ripristino esplicite (NIENTE scene) ─────────────────────────

  _buildRestoreActions(eid) {
    const st = this._hass.states[eid];
    if (!st) return [];
    const dom = this._detectDomain(eid);
    const a = st.attributes || {};
    const tgt = { entity_id: eid };
    const on = st.state !== 'off' && st.state !== 'unavailable' && st.state !== 'unknown';
    if (dom === 'light') {
      if (st.state !== 'on') return [{ service: 'light.turn_off', target: tgt }];
      const data = {};
      if (a.brightness != null) data.brightness = a.brightness;
      if (a.color_mode === 'color_temp' && a.color_temp_kelvin != null) data.color_temp_kelvin = a.color_temp_kelvin;
      else if (a.rgb_color) data.rgb_color = a.rgb_color;
      else if (a.hs_color) data.hs_color = a.hs_color;
      return [{ service: 'light.turn_on', target: tgt, data }];
    }
    if (dom === 'fan') {
      if (st.state !== 'on') return [{ service: 'fan.turn_off', target: tgt }];
      const data = {}; if (a.percentage != null) data.percentage = a.percentage;
      return [{ service: 'fan.turn_on', target: tgt, data }];
    }
    if (dom === 'cover') {
      if (a.current_position != null) return [{ service: 'cover.set_cover_position', target: tgt, data: { position: a.current_position } }];
      return [{ service: `cover.${st.state === 'open' ? 'open_cover' : 'close_cover'}`, target: tgt }];
    }
    if (dom === 'valve') {
      if (a.current_position != null) return [{ service: 'valve.set_valve_position', target: tgt, data: { position: a.current_position } }];
      return [{ service: `valve.${st.state === 'open' ? 'open_valve' : 'close_valve'}`, target: tgt }];
    }
    if (dom === 'climate') {
      const out = [];
      if (st.state) out.push({ service: 'climate.set_hvac_mode', target: tgt, data: { hvac_mode: st.state } });
      if (a.temperature != null) out.push({ service: 'climate.set_temperature', target: tgt, data: { temperature: a.temperature } });
      if (a.preset_mode) out.push({ service: 'climate.set_preset_mode', target: tgt, data: { preset_mode: a.preset_mode } });
      return out;
    }
    return [{ service: `${dom}.turn_${on ? 'on' : 'off'}`, target: tgt }];
  }

  _buildTimerAutomation(eid, autoId, durationS, restore) {
    const p = n => String(n).padStart(2, '0');
    const hh = Math.floor(durationS / 3600), mm = Math.floor((durationS % 3600) / 60), ss = Math.floor(durationS % 60);
    const win = Math.round(durationS);
    // GUARDIA "vince l'ultimo attivato": salta il revert se uno schedule WSC è entrato in slot
    // (current_slot, state!=off) su questa entità DOPO l'avvio del timer (last_changed > now()-durata).
    const guard = `{% set ns = namespace(a=false) %}{% for s in states.switch if s.entity_id.startswith('switch.schedule_') and s.state != 'off' and state_attr(s.entity_id, 'current_slot') is not none and '${eid}' in (s.attributes.entities | default([])) and s.last_changed.timestamp() > (now().timestamp() - ${win}) %}{% set ns.a = true %}{% endfor %}{{ not ns.a }}`;
    return {
      id: autoId,
      alias: `QT Timer - ${eid}`,
      mode: 'restart',
      trigger: [{ platform: 'template', value_template: '{{ false }}' }],
      condition: [],
      action: [
        { delay: `${p(hh)}:${p(mm)}:${p(ss)}` },
        { condition: 'template', value_template: guard },
        ...restore,
      ],
    };
  }

  _slug(eid) { return eid.replace(/[^a-z0-9_]+/gi, '_').toLowerCase(); }

  async _resolveAutomationEntity(autoId, timeoutMs = 6000) {
    const find = () => Object.values(this._hass.states)
      .find(s => s.entity_id.startsWith('automation.') && s.attributes?.id === autoId)?.entity_id;
    let ent = find();
    const deadline = Date.now() + timeoutMs;
    while (!ent && Date.now() < deadline) { await new Promise(r => setTimeout(r, 300)); ent = find(); }
    return ent || `automation.${autoId}`;   // fallback deterministico (id == slug alias)
  }

  async _callAction(a) {
    const [dom, srv] = a.service.split('.');
    await this._hass.callService(dom, srv, { ...(a.data || {}), ...(a.target || {}) });
  }

  // ── Avvio / annullo / pulizia ─────────────────────────────────────────────

  async _startTimer(root) {
    if (!this._entity) return;
    const eid = this._entity;
    const durationS = this._readDurationSeconds(root);
    if (!durationS || durationS < 1) { await this._alert(this.t('qtimer.bad_duration')); return; }
    // Il valore "tenuto" è quello impostato dall'utente col controllo nativo (già applicato):
    // qui creiamo solo il ripristino verso il baseline (stato pre-modifica).
    const existing = this._activeTimer();
    const restore = existing?.restore || this._settledRestore || this._buildRestoreActions(eid);
    if (!restore || !restore.length) { await this._alert(this.t('qtimer.start_failed')); return; }

    try {
      const autoId = `qt_timer_${this._slug(eid)}`;
      await this._recreateAutomation(autoId, this._buildTimerAutomation(eid, autoId, durationS, restore));
      const ent = await this._resolveAutomationEntity(autoId);
      try { await this._hass.callService('automation', 'trigger', { entity_id: ent }); }
      catch (e) { console.error('QT trigger failed', e); }
      this._timers = this._timers || {};
      this._timers[eid] = { endTs: Date.now() + durationS * 1000, autoId, restore, label: this._heldLabel(eid), durationS };
      this._expiredRendered = false;
      await this._saveTimers();
    } catch (e) {
      console.error('QT startTimer failed', e);
      await this._alert(this.t('qtimer.start_failed'));
    }
    this.render();
  }

  async _cancelTimer(eid) {
    const t = this._timers?.[eid];
    if (!t) { this.render(); return; }
    const ent = await this._resolveAutomationEntity(t.autoId, 2000);
    try { await this._hass.callService('automation', 'turn_off', { entity_id: ent }); } catch {}
    try { await this._hass.callApi('DELETE', `config/automation/config/${t.autoId}`); } catch {}
    for (const a of (t.restore || [])) { try { await this._callAction(a); } catch (e) { console.error('QT restore-now failed', e); } }
    delete this._timers[eid];
    await this._saveTimers();
    this.render();
  }

  async _cleanupFinishedTimers() {
    if (!this._timers) return;
    const now = Date.now();
    let changed = false;
    for (const [eid, t] of Object.entries(this._timers)) {
      if (now > t.endTs + 30000) {   // buffer: il revert lato server è già scattato
        try { await this._hass.callApi('DELETE', `config/automation/config/${t.autoId}`); } catch {}
        delete this._timers[eid];
        changed = true;
      }
    }
    if (changed) await this._saveTimers();
  }

  async _saveTimers() {
    try { await WeeklyScheduleBase._sharedSet(this._hass, 'quick_timer_card', { timers: this._timers || {} }); }
    catch (e) { console.error('QT saveTimers failed', e); }
  }

  // ── Stili ─────────────────────────────────────────────────────────────────

  _styles() {
    return `
      .qt-card{display:flex;flex-direction:column}
      .qt-when{padding:14px 16px 6px}
      .qt-when:empty{padding:0}
      /* card nativa incorporata: fusa nella card (niente bordo/ombra/sfondo propri) */
      .qt-native{--ha-card-box-shadow:none;--ha-card-border-width:0px;--ha-card-border-radius:0px;--ha-card-background:transparent;--card-background-color:transparent}
      .qt-foot{padding:6px 16px 14px}
      .qt-title{display:flex;align-items:center;gap:6px;font-weight:600;font-size:.95em;color:var(--primary-text-color)}
      .qt-title ha-icon{--mdc-icon-size:20px;color:var(--primary-color)}
      .qt-hint{font-size:.85em;color:var(--secondary-text-color);margin-top:6px}
      .qt-lbl{font-size:.75em;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color)}
      .qt-row{display:flex;align-items:center;gap:8px;margin-top:6px}
      .qt-when-tab,.qt-chip{cursor:pointer;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);border-radius:8px;padding:6px 12px;font-size:.85em;font-weight:600}
      .qt-when-tab.sel,.qt-chip.sel{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
      .qt-when-tabs{display:flex;gap:6px;margin:10px 0 8px}
      .qt-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
      .qt-custom{width:64px;padding:6px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)}
      .qt-min{font-size:.85em;color:var(--secondary-text-color)}
      .qt-until{padding:6px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)}
      .qt-start{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border:none;border-radius:10px;background:var(--primary-color);color:var(--text-primary-color,#fff);font-size:.9em;font-weight:600;cursor:pointer}
      .qt-start ha-icon{--mdc-icon-size:18px}
      .qt-start:hover{filter:brightness(.95)}
      .qt-active{display:flex;align-items:center;gap:12px}
      .qt-active-ic{--mdc-icon-size:32px;color:var(--primary-color)}
      .qt-active-info{flex:1}
      .qt-countdown{font-size:1.6em;font-weight:700;font-variant-numeric:tabular-nums;color:var(--primary-text-color)}
      .qt-active-lbl{font-size:.8em;color:var(--secondary-text-color)}
      .qt-cancel{border:1px solid var(--error-color,#f44336);color:var(--error-color,#f44336);background:none;border-radius:8px;padding:8px 14px;font-size:.85em;font-weight:600;cursor:pointer}
      .qt-cancel:hover{background:var(--error-color,#f44336);color:#fff}
    `;
  }
}

// ── UI config editor ──────────────────────────────────────────────────────────
// Lightweight ha-form editor. Extends the base only to reuse t()/_esc(); every card
// lifecycle method is overridden so no schedule/storage machinery runs. The advanced
// `card:`/`tile:` embedded-card config is preserved but not exposed (YAML-only).
class QuickTimerCardEditor extends WeeklyScheduleBase {
  setConfig(config) {
    const reseed = !this._config || config.entity !== this._config.entity;
    this._config = config;
    this._lang = null;                 // recompute language from config
    this._renderEditor(reseed);
  }
  get hass() { return this._hass; }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  connectedCallback() { this._renderEditor(true); }
  disconnectedCallback() {}
  render() {}                          // suppress base-card render

  _data() {
    const c = this._config || {};
    return {
      entity: c.entity || '',
      name: c.name || '',
      default_minutes: c.default_minutes ?? undefined,
      presets: Array.isArray(c.presets) ? c.presets.join(', ') : '',
      language: c.language || '',
    };
  }

  _schema() {
    return [
      { name: 'entity', required: true, selector: { entity: {} } },
      { name: 'name', selector: { text: {} } },
      { name: 'default_minutes', selector: { number: { min: 1, mode: 'box' } } },
      { name: 'presets', selector: { text: {} } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: [
        { value: '', label: this.t('qtimer.editor.lang_auto') },
        { value: 'en', label: 'English' },
        { value: 'it', label: 'Italiano' },
        { value: 'fr', label: 'Français' },
      ] } } },
    ];
  }

  // ha-form may not be loaded yet; pulling the entities-card editor registers it.
  async _ensureHaForm() {
    if (customElements.get('ha-form')) return;
    try {
      const helpers = await window.loadCardHelpers();
      const card = await helpers.createCardElement({ type: 'entities', entities: [] });
      if (card?.constructor?.getConfigElement) await card.constructor.getConfigElement();
    } catch (e) { /* best-effort */ }
  }

  async _renderEditor(reseed) {
    if (this._form) { if (reseed) this._form.data = this._data(); return; }
    if (this._building) return;
    this._building = true;
    await this._ensureHaForm();
    this._building = false;
    if (this._form) { if (reseed) this._form.data = this._data(); return; }
    if (!customElements.get('ha-form')) {
      this.shadowRoot.innerHTML = `<div style="padding:12px;color:var(--secondary-text-color)">${this._esc(this.t('qtimer.editor.no_form'))}</div>`;
      return;
    }
    const form = document.createElement('ha-form');
    form.schema = this._schema();
    form.data = this._data();
    if (this._hass) form.hass = this._hass;
    form.computeLabel = (s) => this.t('qtimer.editor.' + s.name);
    form.addEventListener('value-changed', (e) => this._valueChanged(e));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:8px 4px';
    wrap.appendChild(form);
    const help = document.createElement('div');
    help.style.cssText = 'font-size:.8em;color:var(--secondary-text-color);margin-top:8px;padding:0 4px';
    help.textContent = this.t('qtimer.editor.presets_help');
    wrap.appendChild(help);
    this.shadowRoot.appendChild(wrap);
    this._form = form;
  }

  _valueChanged(ev) {
    ev.stopPropagation();
    if (!this._config) return;
    const v = ev.detail.value || {};
    const cfg = { ...this._config };       // preserve type, card:/tile:, etc.
    if (v.entity) cfg.entity = v.entity; else delete cfg.entity;
    if (v.name) cfg.name = v.name; else delete cfg.name;
    if (v.default_minutes != null && v.default_minutes !== '') cfg.default_minutes = Number(v.default_minutes);
    else delete cfg.default_minutes;
    const arr = String(v.presets ?? '').split(',').map(x => parseInt(x.trim(), 10)).filter(n => Number.isFinite(n) && n > 0);
    if (arr.length) cfg.presets = arr; else delete cfg.presets;
    if (v.language) cfg.language = v.language; else delete cfg.language;
    this._config = cfg;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('quick-timer-card')) {
  customElements.define('quick-timer-card', QuickTimerCard);
  // push inside the guard: when both the main bundle and the standalone bundle are
  // registered as resources, only the first one defines the element AND adds the
  // card-picker entry — avoids a duplicate "Quick Timer Card" in the Add-card menu.
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'quick-timer-card',
    name: 'Quick Timer Card',
    description: 'Standard HA entity card + a temporary timer (hold a value for a duration, then restore).',
    preview: false,
  });
}

if (!customElements.get('quick-timer-card-editor')) {
  customElements.define('quick-timer-card-editor', QuickTimerCardEditor);
}

export default QuickTimerCard;
