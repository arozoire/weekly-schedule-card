import WeeklyScheduleBase from './base-card.js';

class WeeklyScheduleViewCard extends WeeklyScheduleBase {
  constructor() {
    super();
    this._layout = 'focus';
    try {
      const saved = localStorage.getItem('weekly-schedule-view-layout');
      if (['focus', 'compact'].includes(saved)) this._layout = saved;
    } catch {}
  }

  setConfig(config) {
    super.setConfig(config);
    if (!['focus', 'compact'].includes(this._layout)) this._layout = 'focus';
  }

  _cycleLayout() {
    this._layout = this._layout === 'focus' ? 'compact' : 'focus';
    try { localStorage.setItem('weekly-schedule-view-layout', this._layout); } catch {}
    this._animatedRender();
  }

  _layoutLabel() {
    return this._layout === 'focus' ? (this.t('layout.focus') || 'Focus')
      : (this.t('layout.compact') || 'Compact');
  }

  _layoutIcon() {
    // Show icon of the NEXT view to suggest the action
    return this._layout === 'focus' ? 'mdi:view-agenda' : 'mdi:view-column';
  }

  // Persistent CSS for the view card (extracted from render() so it isn't
  // re-parsed on every state change — see _setStyles in base-card).
  _mainStyles() {
    return `
        :host { display: block; }
        ha-card { padding: 12px; }
        .header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .title { flex:1; font-size:1.05em; font-weight:600; color:var(--primary-text-color); }
        .toggle-btn { background:none; border:1px solid var(--divider-color,#ccc); border-radius:8px; padding:5px 10px; cursor:pointer; font-size:.78em; color:var(--primary-text-color); display:flex; align-items:center; gap:6px; }
        .toggle-btn:hover { background:var(--secondary-background-color,#f5f5f5); }
        .vc-icon-btn { width:32px; height:32px; border-radius:50%; background:var(--secondary-background-color,#f5f5f5); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--secondary-text-color); padding:0; flex-shrink:0; transition:all .15s; }
        .vc-icon-btn:hover { background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent); color:var(--primary-color,#03a9f4); }
        .profiles-row, .tabs-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
        .prof-chip, .tab-chip { padding:4px 10px; border-radius:14px; border:1.5px solid var(--divider-color,#ccc); cursor:pointer; font-size:.75em; color:var(--secondary-text-color); user-select:none; display:flex; align-items:center; gap:6px; }
        .prof-chip.active, .tab-chip.active { font-weight:600; }
        .prof-chip.viewed { background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent); border-color:color-mix(in srgb,var(--primary-color,#03a9f4) 40%,transparent); color:var(--primary-color,#03a9f4); }
        .prof-chip.viewed.active { box-shadow:0 0 6px color-mix(in srgb,var(--primary-color,#03a9f4) 25%,transparent); }
        .chip-name { pointer-events:none; }
        .chip-activate { background:none; border:none; cursor:pointer; font-size:.78em; padding:0 2px; line-height:1; }
        .chip-activate:hover { opacity:.7; }
        .tab-chip.active { background:var(--primary-color,#03a9f4); color:white; border-color:var(--primary-color,#03a9f4); }
        .status { font-size:.72em; color:var(--secondary-text-color); margin-top:6px; padding-top:6px; border-top:1px solid var(--divider-color,#eee); display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
        .status-sep { opacity:.5; }
        .status-prof { font-weight:600; }
        @keyframes compact-pulse{0%,100%{box-shadow:0 0 4px var(--cblk-glow,transparent),0 0 8px var(--cblk-glow-soft,transparent)}50%{box-shadow:0 0 8px var(--cblk-glow,transparent),0 0 16px var(--cblk-glow-soft,transparent)}}
        .compact-days{display:flex;flex-direction:column;gap:4px}
        .compact-day-wrap{border-radius:8px;overflow:hidden}
        .compact-today-wrap{background:color-mix(in srgb,var(--primary-color,#03a9f4) 5%,transparent)}
        .compact-day-hdr{display:flex;align-items:center;height:44px;padding:0 12px;gap:8px;cursor:pointer;border-radius:8px;box-sizing:border-box}
        .compact-day-hdr:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 3%,transparent)}
        .compact-day-bar{width:3px;align-self:stretch;border-radius:2px;flex-shrink:0}
        .compact-day-name{font-size:.85em;font-weight:600;width:36px;flex-shrink:0}
        .compact-mini-timeline{flex:1;position:relative;height:8px;background:color-mix(in srgb,var(--divider-color,#e0e0e0) 30%,transparent);border-radius:4px;overflow:hidden}
        .compact-mini-bar{position:absolute;border-radius:2px}
        .compact-day-content{padding:0 4px 8px 12px}
        .compact-ent-row{display:flex;align-items:center;gap:8px;padding:6px 0}
        .compact-ent-sep{border-top:1px solid var(--divider-color,#e0e0e0)}
        .compact-ent-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .compact-ent-name{font-size:.75em;color:var(--primary-text-color);width:80px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .compact-bar{flex:1;height:32px;background:var(--divider-color,#e0e0e0);border-radius:6px;position:relative;overflow:hidden;cursor:pointer}
        .compact-blk{position:absolute;top:1px;bottom:1px;border-radius:5px;display:flex;align-items:center;justify-content:center;gap:2px;overflow:hidden;cursor:pointer;transition:transform .15s,opacity .15s;opacity:.85;font-size:.65em;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,.4);min-width:4px;box-sizing:border-box}
        .compact-blk:hover{transform:scaleY(1.04);opacity:.9}
        .compact-blk.active{animation:compact-pulse 2s infinite ease-in-out;opacity:1!important;z-index:2}
        .compact-blk.off{opacity:.5;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.15) 4px,rgba(255,255,255,.15) 6px)}
        .compact-blk.muted,.focus-blk.muted{background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,152,0,.5) 4px,rgba(255,152,0,.5) 8px)!important;outline:2px dashed #FF9800;outline-offset:-2px;animation:none!important;opacity:.85!important}
        .blk-muted-ico{position:absolute;top:1px;left:2px;--mdi-icon-size:13px;color:#FF9800;z-index:3;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
        .compact-blk-val{white-space:nowrap;overflow:hidden;max-width:40px}
        .compact-ticks{position:relative;height:14px;margin-top:2px}
        .compact-tick{position:absolute;font-size:.55em;color:var(--secondary-text-color);opacity:.6;transform:translateX(-50%)}
        @keyframes focus-pulse{0%,100%{box-shadow:0 0 4px var(--fblk-glow,transparent),0 0 8px var(--fblk-glow-soft,transparent)}50%{box-shadow:0 0 8px var(--fblk-glow,transparent),0 0 16px var(--fblk-glow-soft,transparent)}}
        .focus-wrap{overflow-x:auto}
        .focus-container{display:grid;align-items:stretch}
        .focus-axis{width:36px;flex-shrink:0;display:flex;flex-direction:column}
        .focus-axis-spacer{height:40px;flex-shrink:0}
        .focus-axis-body{flex:1;position:relative}
        .focus-axis-tick{position:absolute;right:4px;font-size:.6em;color:var(--secondary-text-color);transform:translateY(-50%);white-space:nowrap}
        .focus-col--active{display:flex;flex-direction:column;border:1px solid color-mix(in srgb,var(--primary-color,#03a9f4) 30%,transparent);border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);background:var(--card-background-color,#fff);min-width:0;overflow:hidden}
        .focus-col-hdr{height:40px;display:flex;align-items:center;justify-content:center;font-size:.85em;font-weight:600;flex-shrink:0}
        .focus-lane-hdrs{position:relative;height:18px;flex-shrink:0;margin:0 2px 2px}
        .focus-lane-hdr{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;gap:3px;font-size:.6em;font-weight:600;color:var(--secondary-text-color);overflow:hidden;white-space:nowrap;padding:0 2px;box-sizing:border-box}
        .focus-lane-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .focus-col-body{flex:1;position:relative;overflow:hidden;cursor:pointer}
        .focus-blk{position:absolute;border-radius:8px;display:flex;align-items:center;padding:3px 6px;gap:4px;overflow:hidden;cursor:pointer;transition:filter .15s;opacity:.9;font-size:.68em;color:white;box-sizing:border-box}
        .focus-blk:hover{filter:brightness(.84);opacity:1}
        .focus-blk.active{animation:focus-pulse 2s infinite ease-in-out;border:2px solid rgba(255,255,255,.75);opacity:1!important;z-index:2}
        .focus-blk.off{opacity:.5;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.15) 4px,rgba(255,255,255,.15) 6px)}
        @media (prefers-reduced-motion: reduce){
          .compact-blk.active{animation:none!important;box-shadow:0 0 0 2px var(--cblk-glow,var(--primary-color,#03a9f4))}
          .focus-blk.active{animation:none!important;box-shadow:0 0 0 2px var(--fblk-glow,var(--primary-color,#03a9f4))}
        }
        .focus-blk-info{display:flex;flex-direction:column;min-width:0;overflow:hidden;gap:1px}
        .focus-blk-name{font-size:.72em;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
        .focus-blk-val{font-size:.68em;opacity:.9;white-space:nowrap;overflow:hidden;line-height:1.2}
        .focus-slim{display:flex;flex-direction:column;cursor:pointer;border-radius:8px;transition:background .15s;min-width:0;overflow:hidden}
        .focus-slim:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 5%,transparent)}
        .focus-slim-hdr{height:40px;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-size:.65em;font-weight:600;flex-shrink:0}
        .focus-slim-body{flex:1;position:relative;overflow:hidden}
        .focus-slim-bar{position:absolute;border-radius:3px;min-height:4px;box-sizing:border-box}
        .sched-tooltip{position:fixed;background:rgba(0,0,0,.78);color:#fff;border-radius:8px;padding:8px 12px;font-size:.75em;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:9999;pointer-events:none;max-width:220px;line-height:1.5;backdrop-filter:blur(8px);animation:tt-in .15s ease}
        @keyframes tt-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .sched-tooltip::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:rgba(0,0,0,.78);border-bottom:none}
        .sched-tooltip .tt-name{font-weight:600;margin-bottom:3px}
        .sched-tooltip .tt-row{opacity:.8;font-size:.9em}`;
  }

  render() {
    if (!this._config || !this._hass || !this._storageData) return;
    const DAYS = ['mon','tue','wed','thu','fri','sat','sun'].map(k => this.t(`days.${k}`));
    const tab = this._currentTab();
    if (!tab) return;
    const H = 380;

    const body = this._layout === 'compact' ? this._buildCompactView(tab, DAYS)
      : this._buildFocusView(tab, DAYS, H);

    const profiles = this._storageData.profiles || [];
    const profileChips = profiles.map(p => {
      const active = this._isProfileActive(p);
      const viewed = p.id === this._selectedProfileId;
      const color = this._getProfileColor(p);
      const cls = ['prof-chip'];
      if (active) cls.push('active');
      if (viewed) cls.push('viewed');
      const style = active ? `background:${color}1F;border-color:${color};color:${color}` : '';
      const actLbl = active ? (this.t('profile.deactivate') || 'Disattiva') : (this.t('profile.activate') || 'Attiva');
      const actColor = active ? 'var(--secondary-text-color)' : '#4CAF50';
      return `<div class="${cls.join(' ')}" role="button" tabindex="0" data-pid="${p.id}" style="${style}"><span class="chip-name">${this._esc(p.name)}</span><button class="chip-activate" data-pid="${p.id}" title="${actLbl}" style="color:${actColor}">${active ? '⏸' : '▶'}</button></div>`;
    }).join('');

    const tabs = this._getAllTabs();
    const activeTabIdx = Math.min(this._activeTab, tabs.length - 1);
    const tabsHtml = tabs.length > 1 ? tabs.map((t, i) => {
      const name = this._esc(t.name || t.entity || '?');
      return `<div class="tab-chip${i === activeTabIdx ? ' active' : ''}" data-ti="${i}" role="button" tabindex="0">${name}</div>`;
    }).join('') : '';

    this._setStyles('main', this._mainStyles());
    const root = this._ensureRoot();
    root.innerHTML = `
      <ha-card>
        <div class="header">
          <span class="title">${this._config.title || 'Weekly Schedule'}</span>
          <button class="vc-icon-btn vc-new-profile" title="${this.t('profile.new_profile') || 'Nuovo profilo'}"><ha-icon icon="mdi:account-plus" style="--mdi-icon-size:18px"></ha-icon></button>
          <button class="vc-icon-btn vc-manage-groups" title="${this.t('card.manage_groups') || 'Gestisci gruppi'}"><ha-icon icon="mdi:layers" style="--mdi-icon-size:18px"></ha-icon></button>
          <button class="toggle-btn" title="${this._layoutLabel()}">
            <ha-icon icon="${this._layoutIcon()}" style="--mdi-icon-size:16px"></ha-icon>
            <span>${this._layoutLabel()}</span>
          </button>
        </div>
        ${profileChips ? `<div class="profiles-row">${profileChips}</div>` : ''}
        ${tabsHtml ? `<div class="tabs-row">${tabsHtml}</div>` : ''}
        ${body}
        <div class="status">${(() => {
          const sel = this._getSelectedProfile();
          if (!sel) return this._esc(tab.name || tab.entity || '');
          const isAct = this._isProfileActive(sel);
          const color = isAct ? 'var(--success-color,#4CAF50)' : 'var(--secondary-text-color)';
          const dot = isAct ? '●' : '○';
          const lbl = isAct ? this.t('profile.active') || 'Attivo' : this.t('profile.activate') || 'Attiva...';
          const tabName = tab.name || tab.entity || '';
          return `<span>${this.t('profile.viewing') || 'Stai visualizzando'}: <b>${this._esc(sel.name)}</b></span> <span class="status-sep">·</span> <span class="status-prof" data-pid="${sel.id}" style="color:${color};cursor:${isAct ? 'default' : 'pointer'}">${dot} ${lbl}</span>${tabName ? ` <span class="status-sep">·</span> <span>${this._esc(tabName)}</span>` : ''}`;
        })()}</div>
      </ha-card>
    `;

    root.querySelector('.toggle-btn')?.addEventListener('click', () => this._cycleLayout());
    root.querySelector('.vc-new-profile')?.addEventListener('click', () => this._showNewProfileDialog());
    root.querySelector('.vc-manage-groups')?.addEventListener('click', () => this._renderGroupsView());

    root.querySelectorAll('.prof-chip').forEach(el => {
      el.addEventListener('click', e => {
        const pid = el.dataset.pid;
        const p = (this._storageData.profiles || []).find(x => x.id === pid);
        if (!p) return;
        if (e.target.closest('.chip-activate')) {
          if (this._isProfileActive(p)) this._deactivateProfile(pid);
          else this._activateProfile(pid);
        } else {
          this._selectedProfileId = pid;
          this.render();
        }
      });
    });

    root.querySelectorAll('.tab-chip').forEach(el => {
      el.addEventListener('click', () => {
        this._activeTab = parseInt(el.dataset.ti);
        this.render();
      });
    });

    root.querySelectorAll('[data-entity]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this._openEditPopup(el.dataset.entity);
      });
      el.addEventListener('mouseenter', () => {
        this._showTooltip(el.dataset.entity, el.getBoundingClientRect());
      });
      el.addEventListener('mouseleave', () => this._hideTooltip());
    });

    const ents = tab.entities || (tab.entity ? [tab] : []);

    root.querySelectorAll('.focus-col-body').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-entity]')) return;
        const rect = el.getBoundingClientRect();
        const clickPct = ((e.clientY - rect.top) / rect.height) * 100;
        const di = parseInt(el.dataset.day);
        const ec = ents[0]; if (!ec) return;
        this._openCreatePopup(di, clickPct, ec);
      });
    });

    root.querySelectorAll('.compact-ent-row').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-entity]')) return;
        const di = parseInt(el.dataset.day);
        const entityId = el.dataset.entityId;
        const ec = ents.find(e => e.entity === entityId) || ents[parseInt(el.dataset.ei) || 0];
        if (!ec) return;
        // clickPct relative to compact-bar if click happened inside, otherwise center
        const bar = el.querySelector('.compact-bar');
        let clickPct = 50;
        if (bar && bar.contains(e.target)) {
          const rect = bar.getBoundingClientRect();
          clickPct = ((e.clientX - rect.left) / rect.width) * 100;
        }
        this._openCreatePopup(di, clickPct, ec);
      });
    });

    root.querySelectorAll('.compact-day-hdr').forEach(el => {
      el.addEventListener('click', () => {
        const di = parseInt(el.dataset.day);
        if (!this._compactExpanded) this._compactExpanded = new Set();
        if (this._compactExpanded.has(di)) this._compactExpanded.delete(di);
        else this._compactExpanded.add(di);
        this.render();
      });
    });

    root.querySelectorAll('.focus-slim').forEach(el => {
      el.addEventListener('click', () => {
        this._focusDay = parseInt(el.dataset.day);
        this.render();
      });
    });

    root.querySelector('.status-prof')?.addEventListener('click', e => {
      const pid = e.currentTarget.dataset.pid;
      const p = (this._storageData.profiles || []).find(x => x.id === pid);
      if (p && !this._isProfileActive(p)) this._activateProfile(pid);
    });

    this._startTimeInterval();
    this._updateTimeLine();
    // Re-apply after browser layout in case selectors hadn't been laid out yet
    requestAnimationFrame(() => this._updateTimeLine());
  }
}

if (!customElements.get('weekly-schedule-view-card')) {
  customElements.define('weekly-schedule-view-card', WeeklyScheduleViewCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'weekly-schedule-view-card',
    name: 'Weekly Schedule View Card',
    description: 'Read-only weekly schedule view'
  });
}
