class WeeklyScheduleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this._config = config;
  }

  getCardSize() {
    return 7;
  }

  get _presets() {
    return this._config.presets || [
      { name: 'Comfort', value: 20, color: '#F44336' },
      { name: 'Eco', value: 18, color: '#FF9800' },
      { name: 'Night', value: 16, color: '#2196F3' },
      { name: 'Off', value: 'off', color: '#607D8B' },
    ];
  }

  get _timeStep() {
    return this._config.time_step || 30;
  }

  get _days() {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  get _slots() {
    // 24h / timeStep = number of slots per day
    return Math.floor((24 * 60) / this._timeStep);
  }

  render() {
    if (!this._config || !this._hass) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--primary-font-family, sans-serif);
        }
        ha-card {
          padding: 16px;
          overflow: hidden;
        }
        .card-title {
          font-size: 1.1em;
          font-weight: 500;
          margin-bottom: 12px;
          color: var(--primary-text-color);
        }
        .grid-container {
          display: grid;
          grid-template-columns: 40px repeat(7, 1fr);
          gap: 2px;
          overflow-x: auto;
        }
        .header-cell {
          text-align: center;
          font-size: 0.75em;
          font-weight: 600;
          color: var(--secondary-text-color);
          padding: 4px 0;
        }
        .time-label {
          font-size: 0.65em;
          color: var(--secondary-text-color);
          text-align: right;
          padding-right: 4px;
          height: 20px;
          line-height: 20px;
        }
        .slot {
          height: 20px;
          background: var(--divider-color, #e0e0e0);
          cursor: pointer;
          border-radius: 2px;
          transition: opacity 0.1s;
        }
        .slot:hover {
          opacity: 0.8;
        }
        .presets {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .preset-btn {
          padding: 4px 12px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 0.8em;
          color: white;
          font-weight: 500;
        }
        .preset-btn.active {
          outline: 2px solid var(--primary-text-color);
          outline-offset: 2px;
        }
      </style>
      <ha-card>
        <div class="card-title">${this._config.title || 'Weekly Schedule'}</div>
        <div class="grid-container">
          ${this._renderGrid()}
        </div>
        <div class="presets">
          ${this._renderPresets()}
        </div>
      </ha-card>
    `;

    this._addEventListeners();
  }

  _renderGrid() {
    const days = this._days;
    const slots = this._slots;
    const timeStep = this._timeStep;
    let html = '';

    // Header row
    html += '<div class="header-cell"></div>';
    days.forEach(day => {
      html += `<div class="header-cell">${day}</div>`;
    });

    // Time slots
    for (let s = 0; s < slots; s++) {
      const totalMinutes = s * timeStep;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Time label (only every 2 hours)
      if (minutes === 0 && hours % 2 === 0) {
        html += `<div class="time-label">${String(hours).padStart(2, '0')}:00</div>`;
      } else {
        html += '<div class="time-label"></div>';
      }

      // Day slots
      days.forEach((day, dayIndex) => {
        const color = this._getSlotColor(dayIndex, s);
        html += `<div 
          class="slot" 
          data-day="${dayIndex}" 
          data-slot="${s}"
          style="background: ${color}"
        ></div>`;
      });
    }

    return html;
  }

  _renderPresets() {
    return this._presets.map((preset, index) => `
      <button 
        class="preset-btn ${this._activePreset === index ? 'active' : ''}"
        style="background: ${preset.color}"
        data-preset="${index}"
      >${preset.name}: ${preset.value}${typeof preset.value === 'number' ? '°' : ''}
      </button>
    `).join('');
  }

  _getSlotColor(dayIndex, slotIndex) {
    if (!this._schedule) return 'var(--divider-color, #e0e0e0)';
    const key = `${dayIndex}-${slotIndex}`;
    const presetIndex = this._schedule[key];
    if (presetIndex === undefined) return 'var(--divider-color, #e0e0e0)';
    return this._presets[presetIndex]?.color || 'var(--divider-color, #e0e0e0)';
  }

  _addEventListeners() {
    // Preset selection
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._activePreset = parseInt(e.target.dataset.preset);
        this.render();
      });
    });

    // Slot painting
    let isPainting = false;

    this.shadowRoot.querySelectorAll('.slot').forEach(slot => {
      slot.addEventListener('mousedown', (e) => {
        isPainting = true;
        this._paintSlot(e.target);
      });
      slot.addEventListener('mouseover', (e) => {
        if (isPainting) this._paintSlot(e.target);
      });
      slot.addEventListener('touchstart', (e) => {
        isPainting = true;
        this._paintSlot(e.target);
      });
      slot.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = this.shadowRoot.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('slot')) this._paintSlot(el);
      });
    });

    document.addEventListener('mouseup', () => { isPainting = false; });
    document.addEventListener('touchend', () => { isPainting = false; });
  }

  _paintSlot(slotEl) {
    if (this._activePreset === undefined) return;
    const day = slotEl.dataset.day;
    const slot = slotEl.dataset.slot;
    const key = `${day}-${slot}`;

    if (!this._schedule) this._schedule = {};
    this._schedule[key] = this._activePreset;

    const preset = this._presets[this._activePreset];
    slotEl.style.background = preset.color;
  }
}

customElements.define('weekly-schedule-card', WeeklyScheduleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'weekly-schedule-card',
  name: 'Weekly Schedule Card',
  description: 'Visual weekly schedule card with drag-and-drop time slots',
});
