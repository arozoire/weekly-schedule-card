class WeeklyScheduleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._schedule = {};
    this._activePreset = 0;
    this._isDragging = false;
    this._dragStartSlot = null;
    this._dragDay = null;
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

  get _slotsPerDay() {
    return Math.floor((24 * 60) / this._timeStep);
  }

  _getSlotColor(dayIndex, slotIndex) {
    const key = `${dayIndex}-${slotIndex}`;
    const presetIndex = this._schedule[key];
    if (presetIndex === undefined) return 'var(--divider-color, #e0e0e0)';
    return this._presets[presetIndex]?.color || 'var(--divider-color, #e0e0e0)';
  }

  _getScheduleEntities() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(e => e.startsWith('switch.schedule_'))
      .map(e => this._hass.states[e]);
  }

  _openSchedulePopup(scheduleEntityId) {
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId: scheduleEntityId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _getBlocksForDay(dayIndex) {
    const slots = this._slotsPerDay;
    const blocks = [];
    let currentPreset = null;
    let startSlot = 0;

    for (let s = 0; s <= slots; s++) {
      const key = `${dayIndex}-${s}`;
      const preset = s < slots ? this._schedule[key] : null;

      if (preset !== currentPreset) {
        if (s > 0) {
          blocks.push({
            presetIndex: currentPreset,
            startSlot,
            endSlot: s - 1,
            color: currentPreset !== null && currentPreset !== undefined
              ? this._presets[currentPreset]?.color
              : 'var(--divider-color, #e0e0e0)',
          });
        }
        currentPreset = preset !== undefined ? preset : null;
        startSlot = s;
      }
    }
    return blocks;
  }

  render() {
    if (!this._config || !this._hass) return;

    const days = this._days;
    const slots = this._slotsPerDay;
    const timeStep = this._timeStep;
    const scheduleEntities = this._getScheduleEntities();

    // Time labels every 2h
    const timeLabels = [];
    for (let s = 0; s < slots; s++) {
      const totalMin = s * timeStep;
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      if (minutes === 0 && hours % 2 === 0) {
        timeLabels.push({ slot: s, label: `${String(hours).padStart(2, '0')}:00` });
      }
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--primary-font-family, sans-serif);
        }
        ha-card {
          padding: 16px;
        }
        .card-title {
          font-size: 1.1em;
          font-weight: 500;
          margin-bottom: 12px;
          color: var(--primary-text-color);
        }
        .grid-container {
          display: grid;
          grid-template-columns: 36px repeat(${days.length}, 1fr);
          gap: 4px;
        }
        .header-cell {
          text-align: center;
          font-size: 0.75em;
          font-weight: 600;
          color: var(--secondary-text-color);
          padding: 4px 0;
        }
        .time-axis {
          position: relative;
          grid-column: 1;
          height: ${slots * 4}px;
        }
        .time-label {
          position: absolute;
          right: 4px;
          font-size: 0.6em;
          color: var(--secondary-text-color);
          transform: translateY(-50%);
          white-space: nowrap;
        }
        .day-column {
          position: relative;
          height: ${slots * 4}px;
          background: var(--divider-color, #e0e0e0);
          border-radius: 4px;
          overflow: hidden;
          cursor: crosshair;
        }
        .block {
          position: absolute;
          left: 0;
          right: 0;
          cursor: pointer;
          transition: filter 0.1s;
        }
        .block:hover {
          filter: brightness(0.85);
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
          border: 2px solid transparent;
          cursor: pointer;
          font-size: 0.8em;
          color: white;
          font-weight: 500;
        }
        .preset-btn.active {
          border-color: var(--primary-text-color);
        }
        .schedules-list {
          margin-top: 12px;
          font-size: 0.8em;
          color: var(--secondary-text-color);
        }
        .schedule-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          cursor: pointer;
          border-bottom: 1px solid var(--divider-color);
        }
        .schedule-item:hover {
          color: var(--primary-text-color);
        }
        .schedule-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-color);
        }
      </style>
      <ha-card>
        <div class="card-title">${this._config.title || 'Weekly Schedule'}</div>

        <div class="grid-container">
          <!-- Headers -->
          <div class="header-cell"></div>
          ${days.map(d => `<div class="header-cell">${d}</div>`).join('')}

          <!-- Time axis -->
          <div class="time-axis">
            ${timeLabels.map(tl => `
              <div class="time-label" style="top: ${tl.slot * 4}px">${tl.label}</div>
            `).join('')}
          </div>

          <!-- Day columns -->
          ${days.map((day, dayIndex) => `
            <div class="day-column" data-day="${dayIndex}">
              ${this._getBlocksForDay(dayIndex).map(block => `
                <div 
                  class="block"
                  data-day="${dayIndex}"
                  data-start="${block.startSlot}"
                  data-end="${block.endSlot}"
                  data-preset="${block.presetIndex}"
                  style="
                    top: ${block.startSlot * 4}px;
                    height: ${(block.endSlot - block.startSlot + 1) * 4}px;
                    background: ${block.color};
                  "
                ></div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <!-- Presets -->
        <div class="presets">
          ${this._presets.map((preset, index) => `
            <button 
              class="preset-btn ${this._activePreset === index ? 'active' : ''}"
              style="background: ${preset.color}"
              data-preset="${index}"
            >${preset.name}: ${preset.value}${typeof preset.value === 'number' ? '°' : ''}
            </button>
          `).join('')}
        </div>

        <!-- Schedule entities list -->
        ${scheduleEntities.length > 0 ? `
          <div class="schedules-list">
            <div style="font-weight:600; margin-bottom:4px; color: var(--primary-text-color)">Schedules</div>
            ${scheduleEntities.map(e => `
              <div class="schedule-item" data-entity="${e.entity_id}">
                <div class="schedule-dot"></div>
                <span>${e.attributes.friendly_name || e.entity_id}</span>
                <span style="margin-left:auto">${e.state}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </ha-card>
    `;

    this._addEventListeners();
  }

  _addEventListeners() {
    // Preset buttons
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._activePreset = parseInt(e.currentTarget.dataset.preset);
        this.render();
      });
    });

    // Paint on day columns
    this.shadowRoot.querySelectorAll('.day-column').forEach(col => {
      col.addEventListener('mousedown', (e) => {
        this._isDragging = true;
        this._dragDay = parseInt(col.dataset.day);
        this._paintAtEvent(e, col);
      });
      col.addEventListener('mousemove', (e) => {
        if (this._isDragging && this._dragDay === parseInt(col.dataset.day)) {
          this._paintAtEvent(e, col);
        }
      });
      col.addEventListener('touchstart', (e) => {
        this._isDragging = true;
        this._dragDay = parseInt(col.dataset.day);
        this._paintAtEvent(e.touches[0], col);
      });
      col.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (this._isDragging) this._paintAtEvent(e.touches[0], col);
      });
    });

    document.addEventListener('mouseup', () => { this._isDragging = false; });
    document.addEventListener('touchend', () => { this._isDragging = false; });

    // Click on block → open schedule popup
    this.shadowRoot.querySelectorAll('.block').forEach(block => {
      block.addEventListener('click', (e) => {
        e.stopPropagation();
        // Find matching schedule entity
        const scheduleEntities = this._getScheduleEntities();
        if (scheduleEntities.length > 0) {
          this._openSchedulePopup(scheduleEntities[0].entity_id);
        }
      });
    });

    // Click on schedule list item
    this.shadowRoot.querySelectorAll('.schedule-item').forEach(item => {
      item.addEventListener('click', () => {
        this._openSchedulePopup(item.dataset.entity);
      });
    });
  }

  _paintAtEvent(e, col) {
    const rect = col.getBoundingClientRect();
    const y = (e.clientY || e.pageY) - rect.top;
    const slotHeight = 4;
    const slotIndex = Math.floor(y / slotHeight);
    const day = parseInt(col.dataset.day);

    if (slotIndex < 0 || slotIndex >= this._slotsPerDay) return;

    const key = `${day}-${slotIndex}`;
    this._schedule[key] = this._activePreset;

    // Update block visually without full re-render
    const block = col.querySelector(`[data-start="${slotIndex}"]`);
    if (block) {
      block.style.background = this._presets[this._activePreset]?.color;
    }

    // Throttle re-render
    if (!this._renderPending) {
      this._renderPending = true;
      requestAnimationFrame(() => {
        this._renderPending = false;
        this.render();
      });
    }
  }
}

customElements.define('weekly-schedule-card', WeeklyScheduleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'weekly-schedule-card',
  name: 'Weekly Schedule Card',
  description: 'Visual weekly schedule card with continuous bars and color-coded presets',
});
