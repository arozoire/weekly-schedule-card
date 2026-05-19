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

  _getSchedules() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(s =>
      s.entity_id.startsWith('switch.schedule_') &&
      s.attributes.entities &&
      s.attributes.entities.includes(this._config.entity)
    );
  }

  _tempToColor(temp) {
    if (temp === null || temp === undefined) return '#9E9E9E';
    const min = 10, max = 25;
    const ratio = Math.min(1, Math.max(0, (temp - min) / (max - min)));
    const r = Math.round(33 + ratio * (244 - 33));
    const g = Math.round(150 - ratio * (150 - 67));
    const b = Math.round(243 - ratio * (243 - 54));
    return `rgb(${r},${g},${b})`;
  }

  _parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  _minutesToPercent(minutes) {
    return (minutes / (24 * 60)) * 100;
  }

  _getDayIndex(day) {
    const map = {
      'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3,
      'fri': 4, 'sat': 5, 'sun': 6,
      'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
      'friday': 4, 'saturday': 5, 'sunday': 6,
      'daily': -1, 'workday': -2, 'weekend': -3
    };
    return map[day.toLowerCase()] ?? -1;
  }

  _getBlocksForDay(dayIndex, schedules) {
    const blocks = [];
    for (const schedule of schedules) {
      const { weekdays, timeslots, actions } = schedule.attributes;
      const temp = actions?.[0]?.data?.temperature ?? null;
      const color = this._tempToColor(temp);

      const appliesToDay = weekdays.some(wd => {
        const idx = this._getDayIndex(wd);
        if (idx === -1) return true; // daily
        if (idx === -2) return dayIndex < 5; // workday
        if (idx === -3) return dayIndex >= 5; // weekend
        return idx === dayIndex;
      });

      if (!appliesToDay) continue;

      for (const slot of timeslots) {
        const [startStr, endStr] = slot.split(' - ');
        const startMin = this._parseTime(startStr);
        let endMin = this._parseTime(endStr);
        if (endMin === 0) endMin = 24 * 60; // midnight

        blocks.push({
          startPct: this._minutesToPercent(startMin),
          heightPct: this._minutesToPercent(endMin - startMin),
          color,
          temp,
          entityId: schedule.entity_id,
          label: temp !== null ? `${temp}°` : schedule.attributes.friendly_name,
        });
      }
    }
    return blocks.sort((a, b) => a.startPct - b.startPct);
  }

  render() {
    if (!this._config || !this._hass) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const schedules = this._getSchedules();
    const columnHeight = 480;

    // Time labels every 2h
    const timeLabels = [];
    for (let h = 0; h < 24; h += 2) {
      timeLabels.push({
        label: `${String(h).padStart(2, '0')}:00`,
        pct: (h / 24) * 100,
      });
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
          grid-template-columns: 36px repeat(7, 1fr);
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
          height: ${columnHeight}px;
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
          height: ${columnHeight}px;
          background: var(--divider-color, #e0e0e0);
          border-radius: 4px;
          overflow: hidden;
        }
        .block {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65em;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: filter 0.15s;
          overflow: hidden;
        }
        .block:hover {
          filter: brightness(0.85);
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75em;
          color: var(--primary-text-color);
          cursor: pointer;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      </style>
      <ha-card>
        <div class="card-title">${this._config.title || 'Weekly Schedule'}</div>
        <div class="grid-container">
          <div class="header-cell"></div>
          ${days.map(d => `<div class="header-cell">${d}</div>`).join('')}

          <div class="time-axis">
            ${timeLabels.map(tl => `
              <div class="time-label" style="top: ${tl.pct}%">${tl.label}</div>
            `).join('')}
          </div>

          ${days.map((day, dayIndex) => {
            const blocks = this._getBlocksForDay(dayIndex, schedules);
            return `
              <div class="day-column">
                ${blocks.map(b => `
                  <div
                    class="block"
                    data-entity="${b.entityId}"
                    style="
                      top: ${b.startPct}%;
                      height: ${b.heightPct}%;
                      background: ${b.color};
                      min-height: 4px;
                    "
                  >${b.heightPct > 8 ? b.label : ''}</div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>

        <div class="legend">
          ${schedules.map(s => {
            const temp = s.attributes.actions?.[0]?.data?.temperature ?? null;
            const color = this._tempToColor(temp);
            const name = s.attributes.friendly_name || s.entity_id;
            return `
              <div class="legend-item" data-entity="${s.entity_id}">
                <div class="legend-dot" style="background: ${color}"></div>
                <span>${name}${temp !== null ? ` — ${temp}°` : ''}</span>
              </div>
            `;
          }).join('')}
        </div>
      </ha-card>
    `;

    // Click → open more-info
    this.shadowRoot.querySelectorAll('.block, .legend-item').forEach(el => {
      el.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId: el.dataset.entity },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }
}

customElements.define('weekly-schedule-card', WeeklyScheduleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'weekly-schedule-card',
  name: 'Weekly Schedule Card',
  description: 'Visual weekly schedule card with color-coded temperature blocks',
});
