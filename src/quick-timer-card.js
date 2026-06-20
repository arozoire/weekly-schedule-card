// src/quick-timer-card.js
// Last modified: 2026-06-20 Rome (v1.2.0 quick-timer card)
//
// Card legata a UNA entità: card HA nativa (tile) incorporata per il controllo diretto +
// pannello "Timer" che applica un valore TEMPORANEO per una durata / fino a un orario, poi
// ripristina lo stato precedente (azioni di ripristino esplicite cucite in un'automazione
// transitoria — NIENTE scene). Overlap con schedule: vince l'ultimo attivato (guardia al revert).

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
  }

  setConfig(config) {
    this._config = config;
    this._entity = config.entity || null;
    this._lang = null;
    this._presets = Array.isArray(config.presets) && config.presets.length ? config.presets : [5, 10, 15, 30, 45, 60];
    this._timerMinutes = config.default_minutes || this._presets[0] || 30;
    this._childCard = null; // forza rebuild della card nativa al cambio config
  }

  getCardSize() { return 4; }
  static getStubConfig() { return { entity: '' }; }

  get hass() { return this._hass; }
  set hass(hass) {
    const prev = this._prevHass;
    this._prevHass = hass;
    this._hass = hass;
    if (this._childCard) this._childCard.hass = hass;

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

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this._hass) return;
    this._setStyles('qt', this._styles());
    let wrap = this.shadowRoot.querySelector('.qt-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'qt-wrap';
      wrap.innerHTML = `<div class="qt-native"></div><ha-card class="qt-timer-card"><div class="qt-panel"></div></ha-card>`;
      this.shadowRoot.appendChild(wrap);
    }
    if (!this._entity) {
      wrap.querySelector('.qt-native').innerHTML = '';
      wrap.querySelector('.qt-panel').innerHTML = `<div class="qt-title">${this.t('qtimer.timer')}</div><div class="qt-hint">${this.t('qtimer.no_entity')}</div>`;
      return;
    }
    this._ensureChildCard();
    const panel = wrap.querySelector('.qt-panel');
    panel.innerHTML = this._panelHtml();
    this._bindPanel(panel);
    this._syncTick();
  }

  async _ensureChildCard() {
    if (this._childCard || this._childBuilding || !this._entity) return;
    this._childBuilding = true;
    try {
      const helpers = await window.loadCardHelpers();
      const el = helpers.createCardElement(this._buildTileConfig());
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

  _buildTileConfig() {
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

  _panelHtml() {
    const t = this._activeTimer();
    if (t) {
      return `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div>
        <div class="qt-active">
          <ha-icon class="qt-active-ic" icon="mdi:timer-sand"></ha-icon>
          <div class="qt-active-info">
            <div class="qt-countdown">${this._fmtRemaining(t.endTs - Date.now())}</div>
            <div class="qt-active-lbl">${this.t('qtimer.holding')}${t.label ? ` · ${this._esc(t.label)}` : ''}</div>
          </div>
          <button class="qt-cancel">${this.t('qtimer.cancel')}</button>
        </div>`;
    }
    return `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div>
      <div class="qt-target">${this._targetHtml()}</div>
      ${this._whenHtml()}
      <button class="qt-start"><ha-icon icon="mdi:play"></ha-icon> ${this.t('qtimer.start')}</button>`;
  }

  _onoffHtml(defOn) {
    return `<div class="qt-seg qt-onoff-wrap">
      <button class="qt-onoff${defOn ? ' sel' : ''}" data-val="on">${this.t('qtimer.on')}</button>
      <button class="qt-onoff${!defOn ? ' sel' : ''}" data-val="off">${this.t('qtimer.off')}</button>
    </div>`;
  }

  _targetHtml() {
    const eid = this._entity;
    const dom = this._detectDomain(eid);
    const caps = this._entityCaps(eid);
    const a = this._hass.states[eid]?.attributes || {};
    if (dom === 'climate') {
      const cur = a.temperature ?? 21;
      return `<label class="qt-lbl">${this.t('qtimer.temperature')}</label>
        <div class="qt-row">
          <input type="range" class="qt-temp-rng" min="5" max="35" step="0.5" value="${cur}">
          <input type="number" class="qt-temp" min="5" max="100" step="0.5" value="${cur}"><span class="qt-unit">°C</span>
        </div>`;
    }
    if (dom === 'light') {
      let h = this._onoffHtml(true);
      if (caps.lightBrightness) {
        const bri = a.brightness != null ? Math.max(1, Math.round(a.brightness / 255 * 100)) : 100;
        h += `<label class="qt-lbl">${this.t('qtimer.brightness')}</label><input type="range" class="qt-bri" min="1" max="100" value="${bri}">`;
      }
      if (caps.lightRgb) {
        const cur = a.rgb_color ? this._rgbToHex(a.rgb_color) : '#FFFFFF';
        h += `<label class="qt-lbl">${this.t('qtimer.color')}</label>${this._colorPickerHTML(cur, 'qt-col')}`;
      }
      return h;
    }
    if (dom === 'fan') {
      let h = this._onoffHtml(true);
      if (caps.fanSpeed) {
        const sp = a.percentage ?? 100;
        h += `<label class="qt-lbl">${this.t('qtimer.speed')}</label><input type="range" class="qt-speed" min="1" max="100" value="${sp}">`;
      }
      return h;
    }
    if (dom === 'cover') {
      let h = `<div class="qt-seg qt-cover-seg">
        <label><input type="radio" name="qt-cover" value="open"> ${this.t('qtimer.open')}</label>
        <label><input type="radio" name="qt-cover" value="close" checked> ${this.t('qtimer.close')}</label>
        <label><input type="radio" name="qt-cover" value="stop"> ${this.t('qtimer.stop')}</label>`;
      if (caps.coverPosition) h += `<label><input type="radio" name="qt-cover" value="position"> ${this.t('qtimer.position')}</label>`;
      h += `</div>`;
      if (caps.coverPosition) { const pos = a.current_position ?? 50; h += `<input type="range" class="qt-pos" min="0" max="100" value="${pos}">`; }
      return h;
    }
    return this._onoffHtml(true);
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

  _bindPanel(panel) {
    panel.querySelector('.qt-cancel')?.addEventListener('click', () => this._cancelTimer(this._entity));
    panel.querySelector('.qt-start')?.addEventListener('click', () => this._startTimer(panel));

    panel.querySelectorAll('.qt-onoff-wrap').forEach(wrap => {
      wrap.querySelectorAll('.qt-onoff').forEach(b => b.addEventListener('click', () => {
        wrap.querySelectorAll('.qt-onoff').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      }));
    });

    const rng = panel.querySelector('.qt-temp-rng'), num = panel.querySelector('.qt-temp');
    if (rng && num) {
      rng.addEventListener('input', () => { num.value = rng.value; });
      num.addEventListener('input', () => { rng.value = num.value; });
    }

    panel.querySelectorAll('.qt-chip').forEach(c => c.addEventListener('click', () => {
      this._timerMinutes = parseInt(c.dataset.min, 10);
      this.render();
    }));
    const custom = panel.querySelector('.qt-custom');
    custom?.addEventListener('input', () => {
      const v = parseInt(custom.value, 10);
      if (v > 0) { this._timerMinutes = v; panel.querySelectorAll('.qt-chip').forEach(x => x.classList.remove('sel')); }
    });
    panel.querySelectorAll('.qt-when-tab').forEach(tb => tb.addEventListener('click', () => {
      this._timerMode = tb.dataset.mode;
      this.render();
    }));
    this._bindColorPalettes(panel);
  }

  // ── Lettura target / durata ───────────────────────────────────────────────

  _readTarget(panel) {
    const eid = this._entity;
    const dom = this._detectDomain(eid);
    const ps = { entityConf: { entity: eid }, domain: dom };
    const onSel = () => panel.querySelector('.qt-onoff.sel')?.dataset.val === 'on';
    if (dom === 'climate') {
      ps.enableTemp = true; ps.temp = parseFloat(panel.querySelector('.qt-temp')?.value) || 21;
    } else if (dom === 'light') {
      ps.turnOn = onSel();
      if (ps.turnOn) {
        const bri = panel.querySelector('.qt-bri'); if (bri) { ps.enableBrightness = true; ps.brightness = parseInt(bri.value, 10); }
        const col = panel.querySelector('.qt-col .pal-value'); if (col) { ps.enableColor = true; ps.color = col.value; }
      }
    } else if (dom === 'fan') {
      ps.turnOn = onSel();
      if (ps.turnOn) { const sp = panel.querySelector('.qt-speed'); if (sp) { ps.enableSpeed = true; ps.speed = parseInt(sp.value, 10); } }
    } else if (dom === 'cover') {
      ps.coverAction = panel.querySelector('input[name="qt-cover"]:checked')?.value || 'close';
      if (ps.coverAction === 'position') ps.position = parseInt(panel.querySelector('.qt-pos')?.value, 10);
    } else {
      ps.turnOn = onSel();
    }
    return ps;
  }

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

  _targetLabel(ps) {
    if (ps.domain === 'climate') return `${ps.temp}°C`;
    if (ps.domain === 'cover') return this.t('qtimer.cover_' + (ps.coverAction || 'close')) || ps.coverAction;
    return ps.turnOn ? this.t('qtimer.on') : this.t('qtimer.off');
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

  async _startTimer(panel) {
    if (!this._entity) return;
    const eid = this._entity;
    const durationS = this._readDurationSeconds(panel);
    if (!durationS || durationS < 1) { await this._alert(this.t('qtimer.bad_duration')); return; }
    const ps = this._readTarget(panel);
    const targetActions = this._buildScheduleActions(ps);
    const existing = this._activeTimer();
    const restore = existing?.restore || this._buildRestoreActions(eid);

    try {
      for (const a of targetActions) await this._callAction(a);
      const autoId = `qt_timer_${this._slug(eid)}`;
      await this._recreateAutomation(autoId, this._buildTimerAutomation(eid, autoId, durationS, restore));
      const ent = await this._resolveAutomationEntity(autoId);
      try { await this._hass.callService('automation', 'trigger', { entity_id: ent }); }
      catch (e) { console.error('QT trigger failed', e); }
      this._timers = this._timers || {};
      this._timers[eid] = { endTs: Date.now() + durationS * 1000, autoId, restore, label: this._targetLabel(ps), durationS };
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
      .qt-wrap{display:flex;flex-direction:column;gap:8px}
      .qt-timer-card{padding:14px 16px}
      .qt-title{display:flex;align-items:center;gap:6px;font-weight:600;font-size:.95em;color:var(--primary-text-color);margin-bottom:10px}
      .qt-title ha-icon{--mdc-icon-size:20px;color:var(--primary-color)}
      .qt-hint{font-size:.85em;color:var(--secondary-text-color)}
      .qt-lbl{display:block;font-size:.75em;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color);margin:8px 0 4px}
      .qt-row{display:flex;align-items:center;gap:8px}
      .qt-unit{font-size:.9em;color:var(--secondary-text-color)}
      .qt-target input[type=range]{flex:1;width:100%}
      .qt-temp{width:64px;padding:4px;border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);color:var(--primary-text-color)}
      .qt-seg{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
      .qt-onoff,.qt-when-tab,.qt-chip{cursor:pointer;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);border-radius:8px;padding:6px 12px;font-size:.85em;font-weight:600}
      .qt-onoff.sel,.qt-when-tab.sel,.qt-chip.sel{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
      .qt-cover-seg label{display:flex;align-items:center;gap:4px;font-size:.85em;color:var(--primary-text-color)}
      .qt-when-tabs{display:flex;gap:6px;margin:10px 0 8px}
      .qt-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
      .qt-custom{width:64px;padding:6px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)}
      .qt-min{font-size:.85em;color:var(--secondary-text-color)}
      .qt-until{padding:6px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)}
      .qt-start{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:12px;padding:10px;border:none;border-radius:10px;background:var(--primary-color);color:var(--text-primary-color,#fff);font-size:.9em;font-weight:600;cursor:pointer}
      .qt-start ha-icon{--mdc-icon-size:18px}
      .qt-start:hover{filter:brightness(.95)}
      .qt-active{display:flex;align-items:center;gap:12px}
      .qt-active-ic{--mdc-icon-size:32px;color:var(--primary-color)}
      .qt-active-info{flex:1}
      .qt-countdown{font-size:1.6em;font-weight:700;font-variant-numeric:tabular-nums;color:var(--primary-text-color)}
      .qt-active-lbl{font-size:.8em;color:var(--secondary-text-color)}
      .qt-cancel{border:1px solid var(--error-color,#f44336);color:var(--error-color,#f44336);background:none;border-radius:8px;padding:8px 14px;font-size:.85em;font-weight:600;cursor:pointer}
      .qt-cancel:hover{background:var(--error-color,#f44336);color:#fff}
      .color-palette{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0}
      .pal-swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent}
      .pal-swatch.sel{border-color:var(--primary-text-color)}
    `;
  }
}

if (!customElements.get('quick-timer-card')) {
  customElements.define('quick-timer-card', QuickTimerCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'quick-timer-card',
  name: 'Quick Timer Card',
  description: 'Standard HA entity card + a temporary timer (hold a value for a duration, then restore).',
  preview: false,
});

export default QuickTimerCard;
