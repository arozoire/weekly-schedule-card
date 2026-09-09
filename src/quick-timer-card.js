// src/quick-timer-card.js
// Last modified: 2026-09-08 (temporary Scheduler one-shot lifecycle)
//
// Card legata a UNA entità. Controlli HTML propri modificano solo la bozza: nessun servizio
// viene inviato prima di Avvia. Avvia acquisisce lo stato reale, crea uno schedule Scheduler
// transitorio indipendente dai profili e una piccola automazione server-side di controllo, quindi
// esegue lo schedule. A scadenza l'automazione ripristina e rimuove lo schedule; la card elimina
// poi l'automazione orfana via API autenticata della sessione HA. Uno schedule normale che entra
// in slot nel frattempo vince: il Quick Timer viene rimosso senza ripristino.

import WeeklyScheduleBase from './base-card.js';

class QuickTimerCard extends WeeklyScheduleBase {
  constructor() {
    super();
    this._qtTick = null;
    this._timers = null;          // { eid: { runId, createdTs, endTs, autoId, scheduleIds[], restore[], apply[], label } }
    this._loadingTimers = false;
    this._qtWriteCount = 0;       // versione scritture locali: un refetch stantio (in volo prima
                                   // di una nostra _saveTimers) va scartato, vedi _saveTimers
    this._timerMode = 'duration'; // 'duration' | 'until'
    this._timerMinutes = 30;
    this._draftState = null;
    this._draftDirty = false;
    this._draftActions = [];
    this._cancelling = false;
  }

  setConfig(config) {
    this._config = config;
    this._entity = config.entity || null;
    this._lang = null;
    this._presets = Array.isArray(config.presets) && config.presets.length ? config.presets : [5, 10, 15, 30, 45, 60];
    this._timerMinutes = config.default_minutes || this._presets[0] || 30;
    this._draftState = null;
    this._draftDirty = false;
    this._draftActions = [];
  }

  getCardSize() { return 4; }
  static getStubConfig() { return { entity: '' }; }
  static getConfigElement() { return document.createElement('quick-timer-card-editor'); }

  get hass() { return this._hass; }
  set hass(hass) {
    const prev = this._prevHass;
    this._prevHass = hass;
    this._hass = hass;
    this._syncDraftFromEntity();
    this._renderDraftEditor();

    if (this._timers === null && !this._loadingTimers) {
      this._loadingTimers = true;
      const ver = this._qtWriteCount; // se _saveTimers scrive nel frattempo, scartiamo questo fetch stantio
      WeeklyScheduleBase._sharedGet(hass, 'quick_timer_card')
        .then(d => {
          this._loadingTimers = false;
          if (this._qtWriteCount !== ver) return; // una nostra scrittura è partita nel frattempo: non sovrascrivere
          // null = store vuoto O letto a metà scrittura (altro device): non distinguibile qui,
          // ma senza scritture nostre in corso è un fallback sicuro (nessun timer noto finora).
          this._timers = (d && d.timers) || {};
          this._cleanupFinishedTimers().finally(() => { this._renderDraftEditor(); this.render(); });
        })
        .catch(() => { this._loadingTimers = false; if (this._qtWriteCount === ver) { this._timers = {}; this.render(); } });
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
        // Versiona il fetch: se una NOSTRA _saveTimers è già in corso (o parte durante il fetch),
        // il refetch è potenzialmente in-volo su uno stato non ancora completo (chunk scritti,
        // meta non ancora, o viceversa) → scartalo invece di azzerare i timer visti localmente
        // (era il bug: un read "null" a metà scrittura wipeava il countdown appena avviato).
        const ver = this._qtWriteCount;
        WeeklyScheduleBase._sharedGet(hass, 'quick_timer_card')
          .then(d => {
            this._loadingTimers = false;
            if (this._qtWriteCount !== ver || !d) return; // scrittura nel frattempo, o lettura mid-write/corrotta
            this._timers = d.timers || {};
            this._renderDraftEditor();
            this.render();
          })
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
    // Lo schedule transitorio è la fonte di verità del run. Dopo la scadenza resta attivo se
    // esiste ancora: significa che il restore è in retry e non va avviato un timer concorrente.
    if (this._quickScheduleIds(t).length) return this._hasQuickSchedule(t) ? t : null;
    // Compatibilità record creati da v1.4.0 e precedenti.
    return (t.endTs > Date.now() - 1000 || this._findAutomationEntity(t.autoId)) ? t : null;
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
    if (rec.phase === 'cleanup') {
      this._cleanupFinishedTimers().finally(() => { this.render(); this._syncTick(); });
      return;
    }
    const now = Date.now();
    const born = rec.createdTs || rec.endTs - (rec.durationS || 0) * 1000;
    const quickIds = this._quickScheduleIds(rec);
    if (now > born + 10000 && (!this._findAutomationEntity(rec.autoId)
      || (quickIds.length && !this._hasQuickSchedule(rec)))) {
      this._cleanupFinishedTimers().finally(() => { this.render(); this._syncTick(); });
      return;
    }
    if (rec.endTs > now) {
      const el = this.shadowRoot.querySelector('.qt-countdown');
      if (el) el.textContent = this._fmtRemaining(rec.endTs - now);
      else this.render();          // banner non ancora mostrato
      return;
    }
    // scaduto: passa ai controlli una volta, poi GC dopo il buffer
    if (!this._expiredRendered) { this._expiredRendered = true; this.render(); }
    if (now > rec.endTs + 5000) this._cleanupFinishedTimers().finally(() => { this.render(); this._syncTick(); });
  }
  _fmtRemaining(ms) {
    let s = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const p = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }

  // ── Stato-bozza del controllo nativo ───────────────────────────────────────

  _cloneState(st) {
    return st ? { ...st, attributes: { ...(st.attributes || {}) }, context: { ...(st.context || {}) } } : null;
  }

  _syncDraftFromEntity(force = false) {
    if (!this._entity || !this._hass || this._activeTimer()) return;
    const real = this._hass.states[this._entity];
    if (!real) return;
    if (force || !this._draftState || !this._draftDirty) {
      this._draftState = this._cloneState(real);
      this._draftActions = [];
    }
  }

  // This editor contains only HTML inputs. No child receives hass, a connection,
  // a context provider, or an HA card config capable of sending device commands.
  _renderDraftEditor(force = false) {
    if (!this._hass || this._editingDraft) return;
    const host = this.shadowRoot.querySelector('.qt-editor');
    if (!host) return;
    if (!force && !this._starting && !this._cancelling && !this._activeTimer()
      && host.contains?.(this.shadowRoot.activeElement)) return;
    this._syncDraftFromEntity();
    const html = this._draftEditorHtml();
    if (host._qtHtml === html) return;
    host._qtHtml = html;
    host.innerHTML = html;
    host.querySelectorAll('[data-draft-field]').forEach(input => {
      input.addEventListener('input', () => this._changeDraftInput(input, false));
      input.addEventListener('change', () => this._changeDraftInput(input, true));
    });
  }

  _draftEditorHtml() {
    const running = this._activeTimer();
    const st = running ? this._hass.states[this._entity] : this._draftState;
    if (!st) return `<div class="qt-hint">${this._esc(this._entity)}</div>`;
    const a = st.attributes || {};
    const dom = this._detectDomain(this._entity);
    const caps = this._entityCaps(this._entity);
    const title = this._config.name || this._config.card?.name || this._config.tile?.name || a.friendly_name || this._entity;
    const disabled = running || this._starting || this._cancelling || this._timers === null
      || ['unknown', 'unavailable'].includes(st.state);
    const fields = [];
    const select = (key, label, values, value) => {
      if (!values?.length) return;
      const options = [...new Set(values.map(String))];
      const selected = value == null ? '' : String(value);
      const empty = options.includes(selected) ? '' : '<option value="" selected>—</option>';
      fields.push(`<label class="qt-field"><span>${this._esc(label)}</span><select data-draft-field="${key}">${empty}${options.map(v => `<option value="${this._escAttr(v)}" ${v === selected ? 'selected' : ''}>${this._esc(v === 'on' ? this.t('qtimer.on') : v === 'off' ? this.t('qtimer.off') : v)}</option>`).join('')}</select></label>`);
    };
    const number = (key, label, value, min, max, step = 1) => {
      fields.push(`<label class="qt-field"><span>${this._esc(label)}</span><input data-draft-field="${key}" type="number" min="${Number(min)}" max="${Number(max)}" step="${Number(step)}" value="${value == null ? '' : this._escAttr(value)}"></label>`);
    };
    const tempUnit = a.temperature_unit || this._hass.config?.unit_system?.temperature || '°C';
    if (dom === 'climate') {
      select('hvac_mode', this.t('popup.hvac_mode'), a.hvac_modes, st.state);
      if (a.temperature != null || (a.supported_features & 1))
        number('temperature', `${this.t('qtimer.temperature')} (${tempUnit})`, a.temperature, a.min_temp ?? 7, a.max_temp ?? 35, a.target_temp_step ?? 0.5);
      if (a.target_temp_low != null || (a.supported_features & 2)) {
        number('target_temp_low', `${this.t('qtimer.temperature')} min (${tempUnit})`, a.target_temp_low, a.min_temp ?? 7, a.max_temp ?? 35, a.target_temp_step ?? 0.5);
        number('target_temp_high', `${this.t('qtimer.temperature')} max (${tempUnit})`, a.target_temp_high, a.min_temp ?? 7, a.max_temp ?? 35, a.target_temp_step ?? 0.5);
      }
      select('preset_mode', this.t('popup.preset_mode'), a.preset_modes, a.preset_mode);
      select('fan_mode', this.t('popup.fan_mode'), a.fan_modes, a.fan_mode);
      select('swing_mode', this.t('popup.swing_mode'), a.swing_modes, a.swing_mode);
      select('swing_horizontal_mode', `${this.t('popup.swing_mode')} ↔`, a.swing_horizontal_modes, a.swing_horizontal_mode);
    } else if (dom === 'cover' || dom === 'valve') {
      const last = this._draftActions.at(-1)?.service || '';
      const value = last.endsWith(`stop_${dom}`) ? 'stop' : st.state === 'closed' ? 'close' : 'open';
      select('position_action', this.t('qtimer.during'), ['open', 'close', 'stop'], value);
      if (caps.coverPosition) number('position', `${this.t('qtimer.position')} (%)`, a.current_position, 0, 100);
    } else if (dom === 'lock') {
      select('lock', this.t('qtimer.during'), ['locked', 'unlocked'], st.state);
    } else if (dom === 'water_heater') {
      select('operation_mode', this.t('popup.hvac_mode'), a.operation_list, st.state);
      if (a.temperature != null || (a.supported_features & 1))
        number('temperature', `${this.t('qtimer.temperature')} (${tempUnit})`, a.temperature, a.min_temp ?? 30, a.max_temp ?? 80, 1);
    } else {
      select('power', this.t('qtimer.during'), ['on', 'off'], st.state);
      if (dom === 'light') {
        if (caps.lightBrightness) number('brightness_pct', `${this.t('qtimer.brightness')} (%)`, a.brightness == null ? 100 : Math.round(a.brightness * 100 / 255), 0, 100);
        if (caps.lightRgb) {
          const hex = '#' + (a.rgb_color || [255, 255, 255]).map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
          fields.push(`<label class="qt-field"><span>${this.t('qtimer.color')}</span><input type="color" data-draft-field="rgb_color" value="${hex}"></label>`);
        }
        if (caps.lightColorTemp) number('color_temp_kelvin', `${this.t('qtimer.temperature')} (K)`, a.color_temp_kelvin, a.min_color_temp_kelvin ?? 2000, a.max_color_temp_kelvin ?? 6500);
        select('effect', this.t('qtimer.effect'), a.effect_list, a.effect);
      } else if (dom === 'fan') {
        if (caps.fanSpeed) number('percentage', `${this.t('qtimer.speed')} (%)`, a.percentage, 0, 100, a.percentage_step || 1);
        select('preset_mode', this.t('popup.preset_mode'), a.preset_modes, a.preset_mode);
        if (a.oscillating != null) select('oscillating', this.t('popup.swing_mode'), ['on', 'off'], a.oscillating ? 'on' : 'off');
        if (a.direction != null) select('direction', this.t('qtimer.direction'), ['forward', 'reverse'], a.direction);
      } else if (dom === 'humidifier') {
        number('humidity', `${this.t('qtimer.humidity')} (%)`, a.humidity, caps.humMin, caps.humMax);
        select('mode', this.t('popup.hvac_mode'), a.available_modes, a.mode);
      }
    }
    return `<div class="qt-entity-name">${this._esc(title)}</div><div class="qt-editor-label">${this.t(running ? 'qtimer.current_state' : 'qtimer.during')}</div><fieldset class="qt-draft-fields" ${disabled ? 'disabled' : ''}>${fields.join('')}</fieldset>`;
  }

  _changeDraftInput(input, redraw) {
    if (this._starting || this._cancelling || this._activeTimer() || this._timers === null) return;
    if (input.type === 'number') input.required = true;
    if (input.value === '' || !input.checkValidity()) return;
    const key = input.dataset.draftField;
    const value = input.type === 'number' ? Number(input.value) : input.value;
    const dom = this._detectDomain(this._entity);
    let service, data = {};
    if (key === 'power') service = `turn_${value}`;
    else if (key === 'position_action') service = `${value}_${dom}`;
    else if (key === 'lock') service = value === 'locked' ? 'lock' : 'unlock';
    else if (key === 'position') { service = `set_${dom}_position`; data.position = value; }
    else if (['temperature', 'target_temp_low', 'target_temp_high'].includes(key)) {
      service = 'set_temperature'; data[key] = value;
      if (key !== 'temperature') {
        const other = key === 'target_temp_low' ? 'target_temp_high' : 'target_temp_low';
        if (this._draftState.attributes[other] != null) data[other] = this._draftState.attributes[other];
      }
    } else if (dom === 'light') {
      service = 'turn_on';
      data[key] = key === 'rgb_color' ? value.slice(1).match(/../g).map(v => parseInt(v, 16)) : value;
    } else if (key === 'oscillating') { service = 'oscillate'; data.oscillating = value === 'on'; }
    else { service = `set_${key}`; data[key] = value; }
    this._editingDraft = true;
    try { this._applyDraftService(dom, service, data); }
    finally { this._editingDraft = false; }
    if (redraw) this._renderDraftEditor(true);
  }

  _applyDraftService(domain, service, rawData = {}) {
    if (!this._draftState || this._starting || this._cancelling || this._activeTimer()) return;
    const data = { ...rawData }; delete data.entity_id;
    const st = this._cloneState(this._draftState);
    const a = st.attributes;
    const dom = this._detectDomain(this._entity);
    const turnOn = service === 'turn_on' || (service === 'toggle' && st.state === 'off');
    const turnOff = service === 'turn_off' || (service === 'toggle' && st.state !== 'off');
    if (turnOn) st.state = dom === 'lock' ? 'locked' : (dom === 'cover' || dom === 'valve' ? 'open' : 'on');
    if (turnOff) st.state = dom === 'lock' ? 'unlocked' : (dom === 'cover' || dom === 'valve' ? 'closed' : 'off');
    if (domain === 'lock' && service === 'lock') st.state = 'locked';
    if (domain === 'lock' && service === 'unlock') st.state = 'unlocked';
    if (domain === 'climate') {
      if (turnOn) st.state = (a.hvac_modes || []).find(m => m !== 'off') || 'heat';
      if (service === 'set_hvac_mode') st.state = data.hvac_mode;
      if (service === 'set_temperature') {
        if (data.hvac_mode) st.state = data.hvac_mode;
        if (data.temperature != null) a.temperature = data.temperature;
        if (data.target_temp_low != null) a.target_temp_low = data.target_temp_low;
        if (data.target_temp_high != null) a.target_temp_high = data.target_temp_high;
      }
      if (service === 'set_preset_mode') a.preset_mode = data.preset_mode;
      if (service === 'set_fan_mode') a.fan_mode = data.fan_mode;
      if (service === 'set_swing_mode') a.swing_mode = data.swing_mode;
      if (service === 'set_swing_horizontal_mode') a.swing_horizontal_mode = data.swing_horizontal_mode;
    } else if (domain === 'light' && service === 'turn_on') {
      st.state = 'on';
      if (data.brightness != null) a.brightness = data.brightness;
      if (data.brightness_pct != null) { a.brightness = Math.round(data.brightness_pct * 255 / 100); if (data.brightness_pct === 0) st.state = 'off'; }
      for (const k of ['rgb_color', 'rgbw_color', 'rgbww_color', 'hs_color', 'xy_color', 'color_temp_kelvin', 'effect']) if (data[k] != null) a[k] = data[k];
      if (data.rgb_color != null) a.color_mode = 'rgb';
      else if (data.rgbw_color != null) a.color_mode = 'rgbw';
      else if (data.rgbww_color != null) a.color_mode = 'rgbww';
      else if (data.hs_color != null) a.color_mode = 'hs';
      else if (data.xy_color != null) a.color_mode = 'xy';
      else if (data.color_temp_kelvin != null) a.color_mode = 'color_temp';
    } else if (domain === 'fan') {
      if (service === 'set_percentage' || data.percentage != null) { st.state = Number(data.percentage) === 0 ? 'off' : 'on'; a.percentage = data.percentage; }
      if (service === 'set_preset_mode') { st.state = 'on'; a.preset_mode = data.preset_mode; }
      if (service === 'oscillate') a.oscillating = data.oscillating;
      if (service === 'set_direction') a.direction = data.direction;
    } else if (domain === 'cover' || domain === 'valve') {
      if (service === `open_${domain}`) { st.state = 'open'; if (a.current_position != null) a.current_position = 100; }
      if (service === `close_${domain}`) { st.state = 'closed'; if (a.current_position != null) a.current_position = 0; }
      if (service.startsWith('set_')) {
        a.current_position = data.position;
        st.state = Number(data.position) === 0 ? 'closed' : 'open';
      }
    } else if (domain === 'humidifier') {
      if (service === 'set_humidity') a.humidity = data.humidity;
      if (service === 'set_mode') a.mode = data.mode;
    } else if (domain === 'water_heater') {
      if (service === 'turn_on') st.state = (a.operation_list || []).find(m => m !== 'off') || 'on';
      if (service === 'set_temperature') a.temperature = data.temperature;
      if (service === 'set_operation_mode') st.state = data.operation_mode;
    }
    // Preserve the user's commands instead of reconstructing an apply from every
    // snapshot attribute. A mode-only draft must not send an old temperature or preset.
    const actionService = service === 'toggle' ? (turnOn ? 'turn_on' : 'turn_off') : service;
    const fullService = `${domain}.${actionService}`;
    const isPower = value => /\.(turn_on|turn_off|set_hvac_mode)$/.test(value);
    const previous = this._draftActions.find(action => action.service === fullService);
    const positionService = value => /\.(open|close|stop|set)_(cover|valve)(?:_position)?$/.test(value);
    this._draftActions = this._draftActions.filter(action =>
      action.service !== fullService && !(isPower(fullService) && isPower(action.service))
      && !(positionService(fullService) && positionService(action.service)));
    // A light accepts only one color representation per command.
    const previousData = { ...(previous?.data || {}) };
    if (domain === 'light' && ['rgb_color', 'color_temp_kelvin'].some(k => k in data))
      for (const k of ['rgb_color', 'rgbw_color', 'rgbww_color', 'hs_color', 'xy_color', 'color_temp_kelvin']) delete previousData[k];
    this._draftActions.push({ service: fullService, target: { entity_id: this._entity },
      data: { ...previousData, ...data } });
    st.last_changed = new Date().toISOString(); st.last_updated = st.last_changed;
    this._draftState = st;
    this._draftDirty = true;
    this._renderDraftEditor();
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
      card.innerHTML = `<div class="qt-when"></div><div class="qt-editor"></div><div class="qt-foot"></div>`;
      this.shadowRoot.appendChild(card);
    }
    const when = card.querySelector('.qt-when');
    const foot = card.querySelector('.qt-foot');
    if (!this._entity) {
      card.querySelector('.qt-editor').innerHTML = '';
      when.innerHTML = '';
      foot.innerHTML = `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div><div class="qt-hint">${this.t('qtimer.no_entity')}</div>`;
      return;
    }
    this._renderDraftEditor();
    const active = this._activeTimer();
    if (active) {
      when.innerHTML = '';
      foot.innerHTML = this._activeHtml(active);
    } else {
      when.innerHTML = `<div class="qt-title"><ha-icon icon="mdi:timer-outline"></ha-icon> ${this.t('qtimer.timer')}</div>${this._whenHtml()}<div class="qt-hint">${this.t('qtimer.draft_hint')}</div>`;
      // Durante l'avvio il piede mostra lo status (gestito da _setFootStatus): non
      // ricreare il pulsante, così un render spurio non lo riporta (anti doppio-click).
      if (!this._starting) foot.innerHTML = `<button class="qt-start" ${this._timers === null ? 'disabled' : ''}><ha-icon icon="mdi:play"></ha-icon> ${this.t('qtimer.start')}</button>`;
    }
    this._bindPanel(card);
    this._syncTick();
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
        : `<div class="qt-row"><span class="qt-lbl">${this.t('qtimer.until')}</span><input type="time" class="qt-until" value="${this._untilTime || this._defaultUntil()}"></div>`}`;
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
      this._timerMinutes = Number.isFinite(v) && v > 0 ? v : 0;
      root.querySelectorAll('.qt-chip').forEach(x => x.classList.remove('sel'));
    });
    root.querySelector('.qt-until')?.addEventListener('input', ev => { this._untilTime = ev.target.value; });
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
    if (dom === 'climate' || dom === 'water_heater') return a.temperature != null ? `${a.temperature}°C` : (st.state || '');
    if (dom === 'cover' || dom === 'valve') return a.current_position != null ? `${a.current_position}%` : st.state;
    if (dom === 'lock') return st.state || '';
    if (dom === 'humidifier' && st.state === 'on') return a.humidity != null ? `${a.humidity}%` : this.t('qtimer.on');
    if ((dom === 'light' || dom === 'fan') && st.state === 'on') {
      const pct = dom === 'fan' ? a.percentage : (a.brightness != null ? Math.round(a.brightness / 255 * 100) : null);
      return pct != null ? `${pct}%` : this.t('qtimer.on');
    }
    return st.state === 'off' ? this.t('qtimer.off') : this.t('qtimer.on');
  }

  _isSupportedEntity(eid) {
    return ['light', 'fan', 'cover', 'valve', 'climate', 'lock', 'humidifier',
      'water_heater', 'switch', 'input_boolean'].includes(this._detectDomain(eid));
  }

  // ── Azioni di ripristino esplicite (NIENTE scene) ─────────────────────────

  _buildRestoreActions(eid, state = null) {
    const st = state || this._hass.states[eid];
    // Non inventare uno stato ripristinabile per entità assenti/non disponibili: un timer
    // avviato in queste condizioni potrebbe spegnere l'entità appena torna online.
    if (!st || !st.state || st.state === 'unavailable' || st.state === 'unknown') return [];
    const dom = this._detectDomain(eid);
    const a = st.attributes || {};
    const tgt = { entity_id: eid };
    const on = st.state !== 'off' && st.state !== 'unavailable' && st.state !== 'unknown';
    if (dom === 'light') {
      if (st.state !== 'on') return [{ service: 'light.turn_off', target: tgt }];
      const data = {};
      if (a.brightness != null) data.brightness = a.brightness;
      if (a.color_mode === 'color_temp' && a.color_temp_kelvin != null) data.color_temp_kelvin = a.color_temp_kelvin;
      else if (a.color_mode === 'rgbww' && a.rgbww_color) data.rgbww_color = a.rgbww_color;
      else if (a.color_mode === 'rgbw' && a.rgbw_color) data.rgbw_color = a.rgbw_color;
      else if (a.rgb_color) data.rgb_color = a.rgb_color;
      else if (a.hs_color) data.hs_color = a.hs_color;
      else if (a.xy_color) data.xy_color = a.xy_color;
      if (a.effect && a.effect !== 'none') data.effect = a.effect;
      return [{ service: 'light.turn_on', target: tgt, data }];
    }
    if (dom === 'fan') {
      if (st.state !== 'on') return [{ service: 'fan.turn_off', target: tgt }];
      const data = {}; if (a.percentage != null) data.percentage = a.percentage;
      const out = [{ service: 'fan.turn_on', target: tgt, data }];
      if (a.preset_mode) out.push({ service: 'fan.set_preset_mode', target: tgt, data: { preset_mode: a.preset_mode } });
      if (a.oscillating != null) out.push({ service: 'fan.oscillate', target: tgt, data: { oscillating: a.oscillating } });
      if (a.direction) out.push({ service: 'fan.set_direction', target: tgt, data: { direction: a.direction } });
      return out;
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
      if (!st.state || st.state === 'unavailable' || st.state === 'unknown') return [];
      const params = [];
      const temp = {};
      if (a.target_temp_low != null || a.target_temp_high != null) {
        if (a.target_temp_low != null) temp.target_temp_low = a.target_temp_low;
        if (a.target_temp_high != null) temp.target_temp_high = a.target_temp_high;
      } else if (a.temperature != null) temp.temperature = a.temperature;
      // Presets can change the target temperature; explicit snapshot values must win.
      if (a.preset_mode) params.push({ service: 'climate.set_preset_mode', target: tgt, data: { preset_mode: a.preset_mode } });
      if (Object.keys(temp).length) params.push({ service: 'climate.set_temperature', target: tgt, data: temp });
      if (a.fan_mode) params.push({ service: 'climate.set_fan_mode', target: tgt, data: { fan_mode: a.fan_mode } });
      if (a.swing_mode) params.push({ service: 'climate.set_swing_mode', target: tgt, data: { swing_mode: a.swing_mode } });
      if (a.swing_horizontal_mode) params.push({ service: 'climate.set_swing_horizontal_mode', target: tgt, data: { swing_horizontal_mode: a.swing_horizontal_mode } });
      const mode = { service: 'climate.set_hvac_mode', target: tgt, data: { hvac_mode: st.state } };
      const out = st.state === 'off' ? [...params, mode] : [mode, ...params];
      return out;
    }
    if (dom === 'lock') {
      return [{ service: `lock.${st.state === 'locked' ? 'lock' : 'unlock'}`, target: tgt }];
    }
    if (dom === 'humidifier') {
      if (st.state !== 'on') return [{ service: 'humidifier.turn_off', target: tgt }];
      const out = [{ service: 'humidifier.turn_on', target: tgt }];
      if (a.humidity != null) out.push({ service: 'humidifier.set_humidity', target: tgt, data: { humidity: a.humidity } });
      if (a.mode) out.push({ service: 'humidifier.set_mode', target: tgt, data: { mode: a.mode } });
      return out;
    }
    if (dom === 'water_heater') {
      const out = [];
      if (st.state && st.state !== 'unavailable' && st.state !== 'unknown') out.push({ service: 'water_heater.set_operation_mode', target: tgt, data: { operation_mode: st.state } });
      if (a.temperature != null) out.push({ service: 'water_heater.set_temperature', target: tgt, data: { temperature: a.temperature } });
      return out.length ? out : [{ service: 'water_heater.turn_off', target: tgt }];
    }
    const svcDom = ['switch', 'input_boolean'].includes(dom) ? dom : 'homeassistant';
    return [{ service: `${svcDom}.turn_${on ? 'on' : 'off'}`, target: tgt }];
  }

  _buildApplyActions(eid) {
    if (this._draftActions.length) return this._draftActions.map(action => ({
      ...action, target: { ...action.target }, data: { ...action.data },
    }));
    return this._buildRestoreActions(eid, this._draftState || this._hass.states[eid]);
  }

  _scheduleIdsForEntity(eid, excluded = []) {
    const found = [];
    const skip = new Set(excluded);
    for (const s of Object.values(this._hass.states || {})) {
      if (!s.entity_id.startsWith('switch.schedule_')) continue;
      if (skip.has(s.entity_id) || this._isQuickTimerSchedule(s)) continue;
      const ids = new Set(Array.isArray(s.attributes?.entities) ? s.attributes.entities : []);
      for (const a of (s.attributes?.actions || [])) {
        const raw = a?.entity_id ?? a?.target?.entity_id ?? a?.service_data?.entity_id ?? a?.data?.entity_id;
        for (const id of (Array.isArray(raw) ? raw : [raw])) if (typeof id === 'string') ids.add(id);
      }
      if (ids.has(eid)) found.push(s.entity_id);
    }
    return found;
  }

  _buildTimerAutomation(eid, autoId, runId, createdTs, endTs, restore, quickScheduleIds = []) {
    const schedules = this._scheduleIdsForEntity(eid, quickScheduleIds);
    const triggers = [
      { platform: 'time_pattern', seconds: '/5', id: 'watchdog' },
      { platform: 'homeassistant', event: 'start', id: 'startup' },
    ];
    if (schedules.length) {
      triggers.push({ platform: 'state', entity_id: schedules, id: 'schedule_state' });
      triggers.push({ platform: 'state', entity_id: schedules, attribute: 'current_slot', id: 'schedule_slot' });
    }
    const removeQuickSchedules = quickScheduleIds.map(entityId => ({
      // Deliberatamente senza continue_on_error: se la rimozione fallisce il controller deve
      // restare attivo e ritentare al watchdog successivo.
      service: 'scheduler.remove', data: { entity_id: entityId },
    }));
    // Non può cancellare la propria configurazione senza un token esterno. Si disabilita dopo
    // aver rimosso lo schedule; la card la cancella via callApi alla prima sincronizzazione.
    const cleanup = [...removeQuickSchedules, {
      service: 'automation.turn_off',
      target: { entity_id: '{{ this.entity_id }}' },
      data: { stop_actions: false },
      continue_on_error: true,
    }];
    const knownSchedules = JSON.stringify([...schedules, ...quickScheduleIds]);
    const baseline = Object.fromEntries(schedules.map(id => [id, this._hass.states[id]?.attributes?.current_slot ?? null]));
    // JSON usa null, Jinja usa none: costruisci un literal Jinja valido anche per schedule idle.
    const baselineTpl = `{${Object.entries(baseline).map(([id, slot]) => `${JSON.stringify(id)}:${slot == null ? 'none' : JSON.stringify(slot)}`).join(',')}}`;
    const triggeredTakeover = `trigger.id in ['schedule_state','schedule_slot'] and trigger.from_state is not none and trigger.to_state is not none and trigger.to_state.state != 'off' and (trigger.to_state.attributes.current_slot | default(none)) is not none and trigger.from_state.state not in ['unknown','unavailable'] and ((trigger.to_state.attributes.current_slot | default(none)) != (trigger.from_state.attributes.current_slot | default(none)) or trigger.from_state.state == 'off')`;
    // Baseline persistente: dopo un riavvio HA non dipendiamo dalla from_state del trigger.
    // Uno schedule già attivo quando il timer parte conserva lo stesso current_slot e non vince;
    // appena entra in uno slot differente, il watchdog lo rileva anche dopo un restart. Lo stesso
    // loop scopre schedule creati dopo il timer, che non possono essere trigger statici.
    const takeover = `{% if ${triggeredTakeover} %}true{% else %}{% set baseline = ${baselineTpl} %}{% set known = ${knownSchedules} %}{% set ns = namespace(hit=false) %}{% for id, old_slot in baseline.items() %}{% set slot = state_attr(id, 'current_slot') %}{% if states(id) != 'off' and slot is not none and slot != old_slot %}{% set ns.hit = true %}{% endif %}{% endfor %}{% for s in states.switch if s.entity_id.startswith('switch.schedule_') and s.entity_id not in known and s.state != 'off' and state_attr(s.entity_id, 'current_slot') is not none %}{% if '${eid}' in (s.attributes.entities | default([], true)) %}{% set ns.hit = true %}{% endif %}{% for a in (s.attributes.actions | default([], true)) %}{% set at = a.get('target') or {} %}{% set sd = a.get('service_data') or a.get('data') or {} %}{% set target = a.get('entity_id') or at.get('entity_id') or sd.get('entity_id') %}{% if target == '${eid}' or (target is iterable and target is not string and '${eid}' in target) %}{% set ns.hit = true %}{% endif %}{% endfor %}{% endfor %}{{ ns.hit }}{% endif %}`;
    const expired = `{{ as_timestamp(now()) * 1000 >= ${endTs} }}`;
    const scheduleExists = `{{ expand(${JSON.stringify(quickScheduleIds)}) | count > 0 }}`;
    return {
      id: autoId,
      alias: `QT Timer - ${eid}`,
      description: `Auto-generated by Weekly Schedule Card quick timer (${runId}). Do not edit.`,
      mode: 'single',
      max_exceeded: 'silent',
      initial_state: true,
      trigger: triggers,
      condition: [],
      action: [{ choose: [
        { conditions: [
          { condition: 'template', value_template: scheduleExists },
          { condition: 'template', value_template: takeover },
        ], sequence: cleanup },
        { conditions: [
          { condition: 'template', value_template: scheduleExists },
          { condition: 'template', value_template: expired },
        ], sequence: [...restore, ...cleanup] },
      ] }],
    };
  }

  _slug(eid) { return eid.replace(/[^a-z0-9_]+/gi, '_').toLowerCase(); }

  async _resolveAutomationEntity(autoId, timeoutMs = 6000) {
    const find = () => Object.values(this._hass.states)
      .find(s => s.entity_id.startsWith('automation.') && s.attributes?.id === autoId)?.entity_id;
    let ent = find();
    const deadline = Date.now() + timeoutMs;
    while (!ent && Date.now() < deadline) { await new Promise(r => setTimeout(r, 300)); ent = find(); }
    if (!ent) throw new Error(`Quick Timer controller ${autoId} did not become available`);
    return ent;
  }

  async _callAction(a) {
    const [dom, srv] = a.service.split('.');
    await this._hass.callService(dom, srv, { ...(a.data || {}), ...(a.target || {}) });
  }

  _quickScheduleIds(t) {
    return Array.isArray(t?.scheduleIds) ? t.scheduleIds.filter(Boolean) : [];
  }

  _hasQuickSchedule(t) {
    return this._quickScheduleIds(t).some(id => !!this._hass?.states?.[id]);
  }

  _localDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  _localTime(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
  }

  _schedulerActions(actions, eid) {
    return actions.map(a => ({
      entity_id: a.target?.entity_id || eid,
      service: a.service,
      service_data: { ...(a.data || {}) },
    }));
  }

  async _waitForQuickSchedule(beforeIds, name, timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    const expectedId = `switch.schedule_${this._slug(name)}`;
    while (Date.now() < deadline) {
      const found = Object.values(this._hass.states || {}).find(s =>
        s.entity_id.startsWith('switch.schedule_') && !beforeIds.has(s.entity_id)
        && (s.attributes?.friendly_name === name || s.entity_id === expectedId || s.entity_id.startsWith(`${expectedId}_`)));
      if (found) return found.entity_id;
      await this._sleep(300);
    }
    throw new Error('Scheduler did not expose the temporary schedule');
  }

  async _createQuickSchedule(eid, runId, createdTs, endTs, apply) {
    const start = new Date(createdTs);
    const name = `WSC Quick Timer - ${this._slug(eid)} - ${runId}`;
    const beforeIds = new Set(Object.keys(this._hass.states || {}).filter(k => k.startsWith('switch.schedule_')));
    const slot = { start: this._localTime(start), actions: this._schedulerActions(apply, eid) };
    // Scheduler accetta stop solo nello stesso giorno (00:00 è il limite del giorno dopo).
    // Per un timer che attraversa mezzanotte, il controller conserva comunque l'expiry esatto
    // e rimuove lo schedule; un timeslot start-only evita un intervallo non valido.
    const roundedEnd = new Date(Math.ceil(endTs / 60000) * 60000);
    if (this._localDate(start) === this._localDate(roundedEnd)) {
      const startMinute = start.getHours() * 60 + start.getMinutes();
      const endMinute = roundedEnd.getHours() * 60 + roundedEnd.getMinutes();
      if (endMinute > startMinute) slot.stop = this._localTime(roundedEnd);
    }
    await this._hass.callService('scheduler', 'add', {
      name,
      weekdays: [['mon','tue','wed','thu','fri','sat','sun'][(start.getDay() + 6) % 7]],
      start_date: this._localDate(start),
      end_date: this._localDate(start),
      timeslots: [slot],
      repeat_type: 'repeat',
    });
    return this._waitForQuickSchedule(beforeIds, name);
  }

  async _removeQuickSchedules(scheduleIds) {
    let firstError = null;
    for (const entityId of scheduleIds || []) {
      try { await this._hass.callService('scheduler', 'remove', { entity_id: entityId }); }
      catch (e) { firstError ||= e; }
    }
    if (firstError) throw firstError;
  }

  // ── Avvio / annullo / pulizia ─────────────────────────────────────────────

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Status onesto nel piede della card durante l'avvio (niente UI ottimistica):
  // mostra cosa sta facendo il codice e rimuove il pulsante → blocco anti doppio-click.
  _setFootStatus(text, kind) {
    const foot = this.shadowRoot.querySelector('.qt-foot');
    if (!foot) return;
    const icon = kind === 'error' ? 'mdi:alert-circle-outline'
      : kind === 'ok' ? 'mdi:check-circle-outline'
      : 'mdi:progress-clock';
    foot.innerHTML = `<div class="qt-status qt-status-${kind}"><ha-icon icon="${icon}"></ha-icon><span>${this._esc(text)}</span></div>`;
  }

  // Etichetta leggibile dello stato acquisito (target di ripristino), dalle azioni di restore.
  _restoreLabel(actions, eid) {
    if (!Array.isArray(actions) || !actions.length) return '';
    const dom = this._detectDomain(eid);
    const svcs = actions.map(a => a.service || '');
    const data = Object.assign({}, ...actions.map(a => a.data || {}));
    const has = frag => svcs.some(s => s.includes(frag));
    if (dom === 'climate' || dom === 'water_heater') {
      const parts = [];
      const mode = data.hvac_mode || data.operation_mode;
      if (mode) parts.push(mode === 'off' ? this.t('qtimer.off') : String(mode).replace(/_/g, ' '));
      if (data.temperature != null) parts.push(`${data.temperature}°C`);
      if (data.preset_mode) parts.push(String(data.preset_mode));
      return parts.join(' · ') || this._heldLabel(eid);
    }
    if (dom === 'cover' || dom === 'valve') {
      if (data.position != null) return `${data.position}%`;
      if (has('open')) return this.t('blk.open');
      if (has('close')) return this.t('blk.close');
      return this._heldLabel(eid);
    }
    if (dom === 'lock') return has('unlock') ? this.t('blk.unlocked') : this.t('blk.locked');
    if (has('turn_off')) return this.t('qtimer.off');
    if (data.percentage != null) return `${data.percentage}%`;
    if (data.brightness != null) return `${Math.round(data.brightness / 255 * 100)}%`;
    if (data.humidity != null) return `${data.humidity}%`;
    return this.t('qtimer.on');
  }

  async _startTimer(root) {
    if (this._starting || this._cancelling || this._activeTimer()) return; // no overlapping local runs
    if (!this._entity || this._timers === null) return;
    const inputs = root.querySelectorAll?.('[data-draft-field]') || [];
    for (const input of inputs) if (!input.reportValidity()) return;
    const low = this._draftState?.attributes?.target_temp_low;
    const high = this._draftState?.attributes?.target_temp_high;
    if (low != null && high != null && low > high) { await this._alert(this.t('qtimer.bad_range')); return; }
    const eid = this._entity;
    // Non sovrascrivere un record in cleanup pendente: perderemmo l'ID del vecchio controller.
    if (this._timers?.[eid] && !this._activeTimer()) {
      await this._cleanupFinishedTimers();
      if (this._timers?.[eid]) {
        await this._alert('Quick Timer cleanup is still pending. Retry in a few seconds.');
        return;
      }
    }
    const durationS = this._readDurationSeconds(root);
    if (!Number.isFinite(durationS) || durationS < 1) { await this._alert(this.t('qtimer.bad_duration')); return; }

    if (!this._isSupportedEntity(eid)) {
      await this._alert(`Quick Timer cannot safely restore ${eid}. Choose a light, fan, cover, valve, climate, lock, humidifier, water heater, switch or input boolean.`);
      return;
    }

    this._starting = true;
    this._renderDraftEditor();
    // 1) snapshot reale + azioni temporanee dalla card-bozza
    this._setFootStatus(this.t('qtimer.acquiring'), 'progress');
    const current = this._hass.states[eid];
    const restore = this._buildRestoreActions(eid, current);
    const apply = this._buildApplyActions(eid);
    if (!restore || !restore.length) {
      this._setFootStatus(this.t('qtimer.acquire_failed'), 'error');
      this._starting = false;
      await this._sleep(2500);
      if (!this._activeTimer()) this.render();   // ripristina il pulsante "Avvia"
      return;
    }
    if (!apply || !apply.length) {
      this._setFootStatus(this.t('qtimer.start_failed'), 'error');
      this._starting = false;
      await this._sleep(2500);
      this.render();
      return;
    }
    this._setFootStatus(this.t('qtimer.acquired', { state: this._restoreLabel(restore, eid) }), 'ok');

    const runId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const autoId = `qt_timer_${this._slug(eid)}_${runId}`;
    const createdTs = Date.now();
    const endTs = createdTs + durationS * 1000;
    const record = { runId, createdTs, endTs, autoId, scheduleIds: [], restore, apply, label: this._actionsLabel(apply, eid), durationS };
    let applyStarted = false;
    try {
      // Lo schedule è volutamente NON aggiunto a profile.schedules/scheduleLinks: è indipendente.
      // Considera l'apply potenzialmente iniziato già durante scheduler.add: un interval che
      // include il minuto corrente può essere eseguito subito dal componente.
      applyStarted = true;
      const scheduleId = await this._createQuickSchedule(eid, runId, createdTs, endTs, apply);
      record.scheduleIds = [scheduleId];
      await this._recreateAutomation(autoId, this._buildTimerAutomation(eid, autoId, runId, createdTs, endTs, restore, record.scheduleIds));
      await this._resolveAutomationEntity(autoId);
      this._timers = this._timers || {};
      this._timers[eid] = record;
      this._expiredRendered = false;
      await this._saveTimers();

      // Solo ora cambia l'entità reale. run_action usa esattamente le azioni dello schedule.
      // Se il servizio fallisce dopo un'applicazione parziale, il catch ripristina e pulisce.
      await this._hass.callService('scheduler', 'run_action', { entity_id: scheduleId });
      this._starting = false;
      this._renderDraftEditor();
      this.render();
    } catch (e) {
      // Stampa un riassunto leggibile in cima (i rifiuti di hass.callService arrivano come
      // {type:'result',success:false,error:{code,message}} — un oggetto compresso in console,
      // scomodo da leggere senza sapere come espanderlo). L'oggetto raw resta comunque loggato.
      const detail = e?.error ? `${e.error.code || ''} ${e.error.message || ''}`.trim() || JSON.stringify(e.error) : (e?.message || String(e));
      console.error(`QT startTimer failed: ${detail}`, e);
      let rollbackOk = true;
      if (applyStarted) {
        for (const a of restore) {
          try { await this._callAction(a); }
          catch (restoreError) { rollbackOk = false; console.error('QT rollback failed', restoreError); }
        }
      }
      let cleanupOk = false;
      if (rollbackOk) {
        try {
          await this._removeQuickSchedules(record.scheduleIds);
          await this._deleteAutomation(autoId);
          cleanupOk = true;
        }
        catch (cleanupError) { console.error('QT cleanup after failed start failed', cleanupError); }
      }
      if (cleanupOk) {
        if (this._timers?.[eid]?.runId === runId) {
          delete this._timers[eid];
          try { await this._saveTimers(); } catch {}
        }
      } else {
        // Se restore o cleanup non sono confermati, conservare automazione + record è il
        // comportamento fail-safe: il watchdog server potrà riprovare a scadenza.
        this._timers = this._timers || {};
        this._timers[eid] = record;
        try { await this._saveTimers(); } catch {}
        try {
          const ent = await this._resolveAutomationEntity(autoId, 1000);
          await this._hass.callService('automation', 'turn_on', { entity_id: ent });
        } catch (recoveryError) { console.error('QT recovery controller unavailable', recoveryError); }
        await this._alert('Quick Timer could not complete its rollback or cleanup. The timer was kept so Home Assistant can retry safely.');
      }
      this._setFootStatus(this.t('qtimer.start_failed'), 'error');
      this._starting = false;
      await this._sleep(2500);
      this.render();
    }
  }

  _actionsLabel(actions, eid) {
    return this._restoreLabel(actions, eid);
  }

  _findAutomationEntity(autoId) {
    return Object.values(this._hass.states || {}).find(s => s.entity_id.startsWith('automation.') && s.attributes?.id === autoId)?.entity_id || null;
  }

  async _deleteAutomation(autoId) {
    try { await this._hass.callApi('DELETE', `config/automation/config/${autoId}`); }
    catch (e) {
      // Missing state is not evidence that DELETE succeeded (permissions/network/reload).
      if (e?.status !== 404 && e?.status_code !== 404) throw e;
    }
  }

  async _cancelTimer(eid) {
    if (this._cancelling || this._starting || this._cleaningTimers) return;
    const t = this._timers?.[eid];
    if (!t) { this.render(); return; }
    this._cancelling = true;
    try {
      const ent = await this._resolveAutomationEntity(t.autoId, 2000);
      await this._hass.callService('automation', 'turn_off', { entity_id: ent });
      try {
        if (t.phase !== 'cleanup') for (const a of (t.restore || [])) await this._callAction(a);
      } catch (e) {
        console.error('QT restore-now failed', e);
        try { await this._hass.callService('automation', 'turn_on', { entity_id: ent }); } catch {}
        await this._alert('Restore failed. The timer was kept so Home Assistant can retry.');
        return;
      }
      // Persist the completed restore so retries only clean resources, never restore twice.
      t.phase = 'cleanup';
      await this._saveTimers();
      try {
        await this._removeQuickSchedules(this._quickScheduleIds(t));
        await this._deleteAutomation(t.autoId);
      }
      catch (e) {
        console.error('QT cleanup after cancel failed', e);
        // Restore riuscito: non riattivare il controller, altrimenti potrebbe ripristinare di
        // nuovo. Conserva il record così il prossimo tick/load ritenta solo la pulizia.
        await this._alert('The entity was restored, but cleanup is still pending. Quick Timer will retry it automatically.');
        return;
      }
      delete this._timers[eid];
      try { await this._saveTimers(); }
      catch (e) { console.error('QT save after cancel failed', e); }
      this._draftState = null; this._draftDirty = false; this._syncDraftFromEntity(true);
      this._renderDraftEditor();
      this.render();
    } catch (e) {
      console.error('QT cancel failed', e);
      await this._alert('Cancellation could not complete. The timer record was kept; retry cancellation.');
    } finally {
      this._cancelling = false;
      this._renderDraftEditor();
    }
  }

  async _cleanupFinishedTimers() {
    if (!this._timers || this._cleaningTimers || this._starting || this._cancelling) return;
    this._cleaningTimers = true;
    const now = Date.now();
    let changed = false;
    try {
      for (const [eid, t] of Object.entries(this._timers)) {
        if (t.phase === 'cleanup') {
          try {
            await this._removeQuickSchedules(this._quickScheduleIds(t).filter(id => this._hass.states[id]));
            await this._deleteAutomation(t.autoId);
            delete this._timers[eid]; changed = true;
          } catch (e) { console.warn('QT cancellation cleanup pending', eid, e); }
          continue;
        }
        // Migrazione best-effort dei timer creati da versioni precedenti, che non avevano
        // runId né cleanup server-side.
        if (!t.runId && now > t.endTs + 30000) {
          try { await this._deleteAutomation(t.autoId); } catch {}
          delete this._timers[eid]; changed = true; continue;
        }
        const born = t.createdTs || t.endTs - (t.durationS || 0) * 1000;
        const scheduleIds = this._quickScheduleIds(t);
        const schedulePresent = this._hasQuickSchedule(t);
        const autoPresent = !!this._findAutomationEntity(t.autoId);
        if (now <= born + 10000) continue; // buffer propagazione entità appena create

        // Migrazione v1.4.0: non aveva scheduleIds. Quando il vecchio controller/package ha
        // finito e l'automazione non esiste più, elimina finalmente il record condiviso.
        if (!scheduleIds.length) {
          if (!autoPresent) { delete this._timers[eid]; changed = true; }
          continue;
        }

        if (!schedulePresent) {
          // Scadenza, takeover o annullo hanno già rimosso lo schedule. L'automazione è ormai
          // innocua (e normalmente spenta): cancellala con la sessione frontend corrente.
          if (autoPresent) {
            try { await this._deleteAutomation(t.autoId); }
            catch (e) { console.warn('QT orphan controller cleanup pending', t.autoId, e); continue; }
          }
          delete this._timers[eid]; changed = true; continue;
        }

        if (!autoPresent) {
          // Controller eliminato a mano o creazione incompleta: fail-safe browser-side.
          // Ripristina prima, poi rimuovi lo schedule; se fallisce, lascia tutto tracciato.
          try {
            for (const a of (t.restore || [])) await this._callAction(a);
            await this._removeQuickSchedules(scheduleIds);
            delete this._timers[eid]; changed = true;
          } catch (e) { console.warn('QT missing-controller recovery failed', eid, e); }
        }
      }
      if (changed) {
        await this._saveTimers();
        this._draftState = null; this._draftDirty = false; this._syncDraftFromEntity(true);
        this._renderDraftEditor();
      }
    } finally { this._cleaningTimers = false; }
  }

  async _saveTimers() {
    this._qtWriteCount++; // invalida ogni refetch già in volo iniziato prima di questa scrittura
    try { await WeeklyScheduleBase._sharedSet(this._hass, 'quick_timer_card', { timers: this._timers || {} }); }
    catch (e) { console.error('QT saveTimers failed', e); throw e; }
  }

  // ── Stili ─────────────────────────────────────────────────────────────────

  _styles() {
    return `
      .qt-card{display:flex;flex-direction:column}
      .qt-when{padding:14px 16px 6px}
      .qt-when:empty{padding:0}
      .qt-editor{padding:10px 16px}
      .qt-entity-name{font-size:1em;font-weight:600;color:var(--primary-text-color)}
      .qt-editor-label{font-size:.8em;color:var(--secondary-text-color);margin:4px 0 10px}
      .qt-draft-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border:0;padding:0;margin:0;min-width:0}
      .qt-field{display:flex;flex-direction:column;gap:5px;min-width:0;color:var(--primary-text-color);font-size:.85em}
      .qt-field input,.qt-field select{box-sizing:border-box;width:100%;min-width:0;min-height:40px;border:1px solid var(--divider-color);border-radius:8px;padding:8px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}
      .qt-field input[type=color]{padding:3px}
      .qt-draft-fields:disabled{opacity:.65}
      .qt-start:disabled{opacity:.5;cursor:default}
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
      .qt-status{display:flex;align-items:center;gap:8px;width:100%;padding:10px;border-radius:10px;font-size:.85em;font-weight:600;box-sizing:border-box}
      .qt-status ha-icon{--mdc-icon-size:18px;flex-shrink:0}
      .qt-status span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .qt-status-progress{background:color-mix(in srgb,var(--primary-color) 13%,transparent);color:var(--primary-color)}
      .qt-status-ok{background:color-mix(in srgb,var(--success-color,#4caf50) 15%,transparent);color:var(--success-color,#4caf50)}
      .qt-status-error{background:color-mix(in srgb,var(--error-color,#f44336) 15%,transparent);color:var(--error-color,#f44336)}
      .qt-status-progress ha-icon{animation:qt-spin 1.1s linear infinite}
      @keyframes qt-spin{to{transform:rotate(360deg)}}
      @media (prefers-reduced-motion:reduce){.qt-status-progress ha-icon{animation:none}}
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
// Legacy card:/tile: configs retain name only; embedded controls are never instantiated.
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
      { name: 'entity', required: true, selector: { entity: { domain: [
        'light', 'fan', 'cover', 'valve', 'climate', 'lock', 'humidifier',
        'water_heater', 'switch', 'input_boolean',
      ] } } },
      { name: 'name', selector: { text: {} } },
      { name: 'default_minutes', selector: { number: { min: 1, mode: 'box' } } },
      { name: 'presets', selector: { text: {} } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: [
        { value: '', label: this.t('qtimer.editor.lang_auto') },
        { value: 'en', label: 'English' },
        { value: 'it', label: 'Italiano' },
        { value: 'fr', label: 'Français' },
        { value: 'es', label: 'Español' },
        { value: 'pt', label: 'Português' },
        { value: 'de', label: 'Deutsch' },
        { value: 'nl', label: 'Nederlands' },
        { value: 'pl', label: 'Polski' },
        { value: 'sv', label: 'Svenska' },
        { value: 'no', label: 'Norsk' },
        { value: 'da', label: 'Dansk' },
        { value: 'cs', label: 'Čeština' },
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
