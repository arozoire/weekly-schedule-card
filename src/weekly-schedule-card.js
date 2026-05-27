// Last modified: 2026-05-25 18:45 CEST

const PALETTE=['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B','#000000','#FFFFFF','#FF80AB','#69F0AE','#40C4FF'];

const LOCALES = {
  en: {
    card:{ title:'Weekly Schedule',new_profile:'New profile',groups:'Groups',no_entities:'No entities configured',no_entities_sub:'Add entities via YAML config, or create a Group to get started.',manage_groups:'Manage Groups' },
    popup:{ new_schedule:'New Schedule',edit_schedule:'Edit Schedule',schedule_active:'Schedule Active',time_slot:'Time slot',snap:'Snap',days:'Days',start:'Start',end:'End',drag_hint:'Drag handles to resize.',next_slot:'＋ Next slot',temperature:'Temperature',hvac_mode:'HVAC Mode',preset_mode:'Preset Mode',fan_mode:'Fan Mode',swing_mode:'Swing Mode',climate_actions:'Climate Actions',light_action:'Light Action',action:'Action',brightness:'Brightness',auto_off:'Auto at slot end',none:'None',turn_off:'Turn Off',turn_on:'Turn On',set_temp:'Set temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (e.g. notify.mobile_app_phone)',notify_message_label:'Message',name:'Name',name_placeholder:'Schedule name (optional)',save:'Save',delete:'Delete',cancel:'Cancel' },
    days:{ mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun',all:'All',workdays:'Workdays',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Exclusive (deactivates other exclusive profiles)',shared_label:'🔓 Shared (coexists with other profiles)',new_profile:'New Profile',create:'Create',name_placeholder:'Profile name',new_profile_mode:'new profile',rename:'Rename',duplicate:'Duplicate',delete:'Delete' },
    group:{ title:'Groups',back:'← Back',edit:'Edit',create:'Create Group',tab_color:'Tab color',select_entities:'Select entities',no_groups:'No groups yet.',create_new:'Create new group',delete_confirm:'Delete this group?' },
    errors:{ no_days:'Please select at least one day.',delete_confirm:'Delete this schedule?',delete_profile_confirm:'Delete this profile and all its schedules?' },
    warnings:{ temp_unusual:'⚠️ Unusual value — check device compatibility',temp_very_high:'🔴 Warning: very high temperature',out_of_slider_range:'Outside typical range for this entity' },
    cond:{ add:'Add condition',entity:'Entity',operator:'Operator',value:'Value',and_all:'All (AND)',or_any:'Any (OR)',recheck:'Re-check interval' }
  },
  it: {
    card:{ title:'Pianificazione Settimanale',new_profile:'Nuovo profilo',groups:'Gruppi',no_entities:'Nessuna entità configurata',no_entities_sub:'Aggiungi entità via YAML o crea un Gruppo per iniziare.',manage_groups:'Gestisci Gruppi' },
    popup:{ new_schedule:'Nuovo Schedule',edit_schedule:'Modifica Schedule',schedule_active:'Schedule Attivo',time_slot:'Fascia oraria',snap:'Snap',days:'Giorni',start:'Inizio',end:'Fine',drag_hint:'Trascina le maniglie per ridimensionare.',next_slot:'＋ Slot successivo',temperature:'Temperatura',hvac_mode:'Modalità HVAC',preset_mode:'Modalità preset',fan_mode:'Modalità ventola',swing_mode:'Modalità oscillazione',climate_actions:'Azioni clima',light_action:'Azione luce',action:'Azione',brightness:'Luminosità',auto_off:'Azione al termine slot',none:'Nessuna',turn_off:'Spegni',turn_on:'Accendi',set_temp:'Imposta temp',conditions:'Condizioni',add_condition:'+ Condizione',notifications:'Notifiche',notify_service_label:'Servizio (es. notify.mobile_app_phone)',notify_message_label:'Messaggio',name:'Nome',name_placeholder:'Nome schedule (opzionale)',save:'Salva',delete:'Elimina',cancel:'Annulla' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Gio',fri:'Ven',sat:'Sab',sun:'Dom',all:'Tutti',workdays:'Feriali',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Esclusivo (disattiva altri profili esclusivi)',shared_label:'🔓 Condiviso (coesiste con altri profili)',new_profile:'Nuovo Profilo',create:'Crea',name_placeholder:'Nome profilo',new_profile_mode:'nuovo profilo',rename:'Rinomina',duplicate:'Duplica',delete:'Elimina' },
    group:{ title:'Gruppi',back:'← Indietro',edit:'Modifica',create:'Crea Gruppo',tab_color:'Colore tab',select_entities:'Seleziona entità',no_groups:'Nessun gruppo.',create_new:'Crea nuovo gruppo',delete_confirm:'Eliminare questo gruppo?' },
    errors:{ no_days:'Seleziona almeno un giorno.',delete_confirm:'Eliminare questo schedule?',delete_profile_confirm:'Eliminare questo profilo e tutti i suoi schedule?' },
    warnings:{ temp_unusual:'⚠️ Valore insolito — verifica compatibilità con il tuo dispositivo',temp_very_high:'🔴 Attenzione: temperatura molto alta',out_of_slider_range:'Fuori dal range tipico per questa entità' },
    cond:{ add:'Aggiungi condizione',entity:'Entità',operator:'Operatore',value:'Valore',and_all:'Tutte (AND)',or_any:'Una qualsiasi (OR)',recheck:'Intervallo rivalutazione' }
  },
  fr: {
    card:{ title:'Planning Hebdomadaire',new_profile:'Nouveau profil',groups:'Groupes',no_entities:'Aucune entité configurée',no_entities_sub:'Ajoutez des entités via la config YAML, ou créez un Groupe pour commencer.',manage_groups:'Gérer les Groupes' },
    popup:{ new_schedule:'Nouveau Schedule',edit_schedule:'Modifier Schedule',schedule_active:'Schedule Actif',time_slot:'Créneau horaire',snap:'Snap',days:'Jours',start:'Début',end:'Fin',drag_hint:'Glissez les poignées pour redimensionner.',next_slot:'＋ Créneau suivant',temperature:'Température',hvac_mode:'Mode HVAC',preset_mode:'Mode preset',fan_mode:'Mode ventilateur',swing_mode:'Mode oscillation',climate_actions:'Actions climatisation',light_action:'Action lumière',action:'Action',brightness:'Luminosité',auto_off:'Action en fin de créneau',none:'Aucune',turn_off:'Éteindre',turn_on:'Allumer',set_temp:'Définir temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (ex. notify.mobile_app_phone)',notify_message_label:'Message',name:'Nom',name_placeholder:'Nom du schedule (optionnel)',save:'Sauvegarder',delete:'Supprimer',cancel:'Annuler' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Jeu',fri:'Ven',sat:'Sam',sun:'Dim',all:'Tous',workdays:'Jours ouvrés',weekend:'Week-end' },
    profile:{ exclusive_label:"🔒 Exclusif (désactive les autres profils exclusifs)",shared_label:"🔓 Partagé (coexiste avec d'autres profils)",new_profile:'Nouveau Profil',create:'Créer',name_placeholder:'Nom du profil',new_profile_mode:'nouveau profil',rename:'Renommer',duplicate:'Dupliquer',delete:'Supprimer' },
    group:{ title:'Groupes',back:'← Retour',edit:'Modifier',create:'Créer Groupe',tab_color:'Couleur onglet',select_entities:'Sélectionner entités',no_groups:'Aucun groupe.',create_new:'Créer nouveau groupe',delete_confirm:'Supprimer ce groupe ?' },
    errors:{ no_days:'Sélectionnez au moins un jour.',delete_confirm:'Supprimer ce schedule ?',delete_profile_confirm:'Supprimer ce profil et tous ses schedules ?' },
    warnings:{ temp_unusual:"⚠️ Valeur inhabituelle — vérifiez la compatibilité avec votre appareil",temp_very_high:"🔴 Attention : température très élevée",out_of_slider_range:'Hors de la plage typique pour cette entité' },
    cond:{ add:'Ajouter condition',entity:'Entité',operator:'Opérateur',value:'Valeur',and_all:'Toutes (AND)',or_any:"N'importe laquelle (OR)",recheck:'Intervalle de réévaluation' }
  }
};

import WeeklyScheduleBase from './base-card.js';

class WeeklyScheduleCard extends WeeklyScheduleBase {
  setConfig(config) {
    super.setConfig(config);
    const saved = (() => { try { return localStorage.getItem('weekly-schedule-layout'); } catch { return null; } })();
    this._layout = ['columns', 'rows'].includes(saved) ? saved : 'columns';
  }

  // ── Main render ───────────────────────────────────────────────────────────

  render() {
    if (!this._config || !this._hass || !this._storageData) return;

    const profiles=this._storageData.profiles||[];
    const inNewProfile = !!this._profileEditMode;
    const editingProfile = inNewProfile ? profiles.find(p => p.id === this._profileEditMode.profileId) : null;

    if (!this._entities.length && !(this._getSelectedProfile()?.groups?.length)) {
      this.shadowRoot.innerHTML=`
        <style>:host{display:block;font-family:var(--primary-font-family,sans-serif)}
        ha-card{padding:28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
        .empty-title{font-size:1em;font-weight:600;color:var(--primary-text-color)}
        .empty-sub{font-size:.85em;color:var(--secondary-text-color);max-width:320px;line-height:1.5}
        .btn-setup{padding:10px 24px;border-radius:10px;background:var(--primary-color,#03a9f4);color:white;border:none;cursor:pointer;font-size:.88em;font-weight:600}</style>
        <ha-card>
          <div class="empty-title">${this.t('card.no_entities')}</div>
          <div class="empty-sub">${this.t('card.no_entities_sub')}</div>
          <button class="btn-setup">${this.t('card.manage_groups')}</button>
        </ha-card>`;
      this.shadowRoot.querySelector('.btn-setup').addEventListener('click',()=>this._renderGroupsView());
      return;
    }

    const DAYS = ['mon','tue','wed','thu','fri','sat','sun'].map(k=>this.t(`days.${k}`));
    const allTabs = this._getAllTabs();
    const tab = this._currentTab();
    const isGroup = tab.type === 'group';
    const H = 480;

    const timeLabels = [];
    for (let h=0;h<24;h+=2) timeLabels.push({label:`${String(h).padStart(2,'0')}:00`,pct:(h/24)*100});

    // Build column-mode grid HTML
    const _blk = b => `<div class="block ${b.isOff?'off':''}${b.isActive?' active':''}" data-entity="${b.entityId}" style="top:${b.startPct}%;height:${b.heightPct}%;background-color:${b.color};min-height:4px${b.isActive?`;--blk-glow:${b.color};--blk-glow-soft:${b.color}80`:''}">${b.heightPct>8?b.label:''}${b.hasStop?'<span class="blk-stop">⏹</span>':''}${b.hasCond?'<span class="blk-stop" style="right:12px">⚡</span>':''}</div>`;
    let colGrid = '';
    if (!isGroup) {
      colGrid = DAYS.map((_,di)=>{
        const blocks = this._getBlocksForDay(di, this._getProfileSchedules(tab.entity), tab);
        return `<div class="day-column" data-day="${di}" style="border-left:3px solid ${tab.color||'transparent'}">
          ${blocks.map(_blk).join('')}
          <div class="add-hint">+</div>
        </div>`;
      }).join('');
    } else if (this._layout !== 'rows' && this._layout !== 'focus') {
      const ents = tab.entities||[], N=ents.length;
      colGrid = DAYS.map((_,di)=>`
        <div class="day-column day-column-grp" data-day="${di}">
          ${ents.map((ec,ei)=>{
            const blocks=this._getBlocksForDay(di,this._getProfileSchedules(ec.entity),ec);
            return `<div class="sub-col" data-day="${di}" data-ei="${ei}" style="left:${(ei/N)*100}%;width:${(1/N)*100}%;box-shadow:inset 3px 0 0 0 ${ec.color||'transparent'}">
              ${ei>0?'<div class="sub-divider"></div>':''}
              ${blocks.map(_blk).join('')}
              <div class="add-hint">+</div>
            </div>`;
          }).join('')}
        </div>`).join('');
    }

    // Gantt rows mode
    const gantt = this._layout === 'rows' ? `
      <div class="gantt">
        <div class="gantt-hdr">
          <div class="gantt-day-col"></div>
          <div class="gantt-ent-spacer"></div>
          <div class="gantt-axis">
            ${[0,6,12,18,24].map(h=>`<div class="gantt-tick" style="left:${(h/24)*100}%">${String(h%24).padStart(2,'0')}:00</div><div class="gantt-vline" style="left:${(h/24)*100}%"></div>`).join('')}
          </div>
        </div>
        ${DAYS.map((day,di)=>`
          <div class="gantt-day" data-day="${di}">
            <div class="gantt-day-lbl">${day}</div>
            <div class="gantt-rows">
              ${(tab.entities || (tab.entity ? [tab] : [])).map((ec,ei)=>`
                <div class="gantt-row" data-day="${di}" data-ei="${ei}" style="border-left:3px solid ${ec.color||'#9E9E9E'};border-top:3px solid ${ec.color||'#9E9E9E'}">
                  <div class="gantt-ent-lbl">${ec.name||ec.entity}</div>
                  <div class="gantt-area">
                    ${[0,6,12,18,24].map(h=>`<div class="gantt-vline" style="left:${(h/24)*100}%"></div>`).join('')}
                    ${this._getProfileSchedules(ec.entity).filter(s=>this._appliesToDay(s.attributes.weekdays||[],di)).flatMap(s=>(s.attributes.timeslots||[]).map(slot=>{
                      const [a,b]=slot.split(' - ');
                      const sMin=this._parseTime(a); let eMin=this._parseTime(b); if(eMin===0)eMin=1440;
                      const color=this._blockColor(s,ec), isOff=s.state==='off';
                      const hasStop=this._hasAutoChild(s.entity_id);
                      const hasCond=this._getStoredConditions(s.entity_id).conditions.length > 0;
                      const isActive=s.attributes.current_slot!==null&&s.attributes.current_slot!==undefined;
                      const temp=s.attributes.actions?.[0]?.data?.temperature??null;
                      const lbl=this._detectDomain(ec.entity)==='climate'&&temp!=null?`${temp}°`:s.attributes.friendly_name;
                      const glowStyle=isActive?`;--blk-glow:${color};--blk-glow-soft:${color}80`:'';
                      return `<div class="gantt-block ${isOff?'off':''}${isActive?' active':''}" data-entity="${s.entity_id}" style="left:${this._minutesToPercent(sMin)}%;width:${this._minutesToPercent(eMin-sMin)}%;background-color:${color}${glowStyle}">${(eMin-sMin)>60?lbl:''}${hasStop?'<span class="blk-stop">⏹</span>':''}${hasCond?'<span class="blk-stop" style="right:12px">⚡</span>':''}</div>`;
                    })).join('')}
                    <div class="gantt-add">+</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>` : '';

    // Compact view
    const compact = isGroup && this._layout === 'compact' ? this._buildCompactView(tab, DAYS) : '';

    // Focus view
    const focus = isGroup && this._layout === 'focus' ? this._buildFocusView(tab, DAYS, H) : '';

    // Legend
    const legend = isGroup
      ? `<div class="ent-legend">${(tab.entities||[]).map(ec=>'<div class="ent-legend-item"><div class="ent-legend-dot" style="background:' + (ec.color||'#9E9E9E') + '"></div><span>' + (ec.name||ec.entity) + '</span></div>').join('')}</div>`
      : `<div class="legend">${this._getProfileSchedules(tab.entity).map(s=>{
          const color=this._blockColor(s,tab),isOff=s.state==='off',temp=s.attributes.actions?.[0]?.data?.temperature??null;
          return `<div class="legend-item" data-entity="${s.entity_id}" style="${isOff?'opacity:.55':''}"><div class="legend-dot" style="background-color:${color}"></div><span>${s.attributes.friendly_name||s.entity_id}${this._detectDomain(tab.entity)==='climate'&&temp!=null?` — ${temp}°`:''}${isOff?' (off)':''}</span></div>`;
        }).join('')}</div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:var(--primary-font-family,sans-serif)}
        ha-card{padding:14px 16px 8px}
        .card-header{display:flex;flex-direction:column;gap:0;margin-bottom:0}
        .hdr-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .hdr-row2{display:flex;flex-wrap:nowrap;gap:6px;align-items:center;margin-bottom:6px;overflow-x:auto;scrollbar-width:none}
        .hdr-row2::-webkit-scrollbar{display:none}
        .hdr-sep{height:1px;background:var(--divider-color,#e0e0e0);margin-bottom:10px}
        .card-title{font-size:.95em;font-weight:500;color:var(--primary-text-color)}
        .hdr-icons{display:flex;gap:8px;align-items:center}
        .btn-icon,.btn-groups,.btn-layout-toggle{width:32px;height:32px;border-radius:50%;background:var(--secondary-background-color,#f5f5f5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color);padding:0;flex-shrink:0;transition:all .15s}
        .btn-icon:hover,.btn-groups:hover,.btn-layout-toggle:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent);color:var(--primary-color,#03a9f4)}
        .btn-hdr{padding:4px 12px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:none;cursor:pointer;font-size:.78em;color:var(--primary-text-color)}
        .btn-hdr:hover{background:var(--divider-color,#e0e0e0)}
        .profile-status-bar{font-size:.68em;color:var(--secondary-text-color);display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:2px 0 4px}
        .psb-active{color:#4CAF50;font-weight:600}
        .psb-activate-btn{background:none;border:none;cursor:pointer;font-size:1em;color:var(--primary-color,#03a9f4);padding:0;text-decoration:underline;font-family:inherit}
        .ent-legend{display:flex;flex-wrap:wrap;gap:8px 16px;padding:8px 0 4px;border-top:1px solid var(--divider-color,#e0e0e0);margin-top:8px}
        .ent-legend-item{display:flex;align-items:center;gap:4px;font-size:.72em;color:var(--secondary-text-color)}
        .ent-legend-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .tab-bar{display:flex;margin-bottom:12px;border-bottom:2px solid var(--divider-color,#e0e0e0);overflow-x:auto}
        .tab{padding:6px 16px;font-size:.82em;font-weight:600;cursor:pointer;color:var(--secondary-text-color);border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;user-select:none}
        .tab.active{color:var(--primary-color,#03a9f4);border-bottom-color:var(--primary-color,#03a9f4)}
        .tab-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}
        .grid{display:grid;grid-template-columns:36px repeat(7,1fr);gap:6px}
        .hdr-cell{text-align:center;font-size:.68em;font-weight:700;color:var(--secondary-text-color);padding:4px 0;text-transform:uppercase;letter-spacing:.05em}
        .time-axis{position:relative;height:${H}px}
        .time-lbl{position:absolute;right:4px;font-size:.6em;color:var(--secondary-text-color);transform:translateY(-50%);white-space:nowrap}
        .day-column{position:relative;height:${H}px;background:var(--divider-color,#e0e0e0);border-radius:6px;overflow:hidden;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .day-column:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,var(--divider-color,#e0e0e0))}
        .sub-col{position:absolute;top:0;bottom:0}
        .sub-col:hover{background:rgba(255,255,255,.08)}
        .sub-divider{position:absolute;top:0;left:0;width:1px;height:100%;background:rgba(255,255,255,.35);z-index:1;pointer-events:none}
        @keyframes block-pulse{0%,100%{box-shadow:0 0 4px var(--blk-glow),0 0 8px var(--blk-glow)}50%{box-shadow:0 0 8px var(--blk-glow),0 0 16px var(--blk-glow),0 0 24px var(--blk-glow-soft)}}
        .block{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:center;font-size:.6em;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,.4);cursor:pointer;transition:filter .15s;overflow:hidden;border-radius:4px;border-left:3px solid rgba(255,255,255,.4);box-sizing:border-box;opacity:.88}
        .block:hover{filter:brightness(.84);opacity:1}
        .block.active{animation:block-pulse 2s infinite ease-in-out;opacity:1!important;z-index:2}
        .block.off{opacity:.5;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.15) 4px,rgba(255,255,255,.15) 6px)}
        .blk-stop{position:absolute;bottom:2px;right:2px;font-size:.5em;opacity:.75;pointer-events:none;line-height:1}
        .add-hint{position:absolute;bottom:6px;right:0;left:0;text-align:center;font-size:1.1em;color:var(--secondary-text-color);opacity:0;pointer-events:none;transition:opacity .15s}
        .day-column:hover .add-hint,.sub-col:hover .add-hint{opacity:.5}
        .gantt{display:flex;flex-direction:column}
        .gantt-hdr{display:flex;margin-bottom:4px}
        .gantt-day-col{width:46px;flex-shrink:0}
        .gantt-axis{position:relative;flex:1;height:18px}
        .gantt-tick{position:absolute;font-size:.58em;color:var(--secondary-text-color);transform:translateX(-50%);white-space:nowrap;top:0}
        .gantt-vline{position:absolute;top:0;bottom:0;width:1px;background:var(--divider-color,#e0e0e0);pointer-events:none}
        .gantt-day{display:flex;border-bottom:1px solid var(--divider-color,#e0e0e0)}
        .gantt-day:last-child{border-bottom:none}
        .gantt-day-lbl{width:46px;flex-shrink:0;font-size:.72em;font-weight:600;color:var(--secondary-text-color);display:flex;align-items:center;padding:4px 0}
        .gantt-rows{flex:1;display:flex;flex-direction:column;gap:2px;padding:4px 0}
        .gantt-row{display:flex;align-items:center;height:32px;border-radius:4px;overflow:hidden;padding-left:4px;cursor:pointer;background:var(--divider-color,#f5f5f5);position:relative}
        .gantt-row:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 6%,var(--divider-color,#f5f5f5))}
        .gantt-ent-spacer{width:64px;flex-shrink:0}
        .gantt-ent-lbl{font-size:.62em;font-weight:600;color:var(--secondary-text-color);width:64px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .gantt-area{flex:1;position:relative;height:100%}
        .gantt-block{position:absolute;top:3px;bottom:3px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:.58em;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,.4);cursor:pointer;overflow:hidden;min-width:4px;border-left:3px solid rgba(255,255,255,.4);box-sizing:border-box;opacity:.88}
        .gantt-block:hover{filter:brightness(.84);opacity:1}
        .gantt-block.active{animation:block-pulse 2s infinite ease-in-out;opacity:1!important;z-index:2}
        .gantt-block.off{opacity:.5;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.15) 4px,rgba(255,255,255,.15) 6px)}
        .gantt-add{position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:.9em;color:var(--secondary-text-color);opacity:0;pointer-events:none}
        .gantt-row:hover .gantt-add{opacity:.5}
        .legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
        .legend-item{display:flex;align-items:center;gap:4px;font-size:.75em;color:var(--primary-text-color);cursor:pointer}
        .legend-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
        .chip-wrap{position:relative;flex-shrink:0}
        .profile-chip{display:flex;align-items:center;gap:5px;padding:4px 10px 4px 8px;height:28px;border-radius:20px;border:1.5px solid var(--divider-color,#ccc);cursor:pointer;font-size:.78em;background:transparent;color:var(--secondary-text-color);user-select:none;transition:all .15s;box-sizing:border-box;flex-shrink:0}
        .profile-chip.viewed{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent);border-color:color-mix(in srgb,var(--primary-color,#03a9f4) 40%,transparent);color:var(--primary-color,#03a9f4);font-weight:500}
        .profile-chip.active-op{border-color:var(--pchip-color,#03a9f4)}
        .profile-chip.viewed.active-op{background:color-mix(in srgb,var(--pchip-color,#03a9f4) 10%,transparent);border:2px solid var(--pchip-color,#03a9f4);color:var(--pchip-color,#03a9f4);font-weight:600;box-shadow:0 0 6px color-mix(in srgb,var(--pchip-color,#03a9f4) 25%,transparent)}
        .chip-act-dot{width:6px;height:6px;border-radius:50%;background:#4CAF50;flex-shrink:0}
        .chip-lock{font-size:.7em;opacity:.6}
        .chip-activate{background:none;border:none;cursor:pointer;font-size:.72em;padding:0 1px;line-height:1;transition:color .12s}
        .chip-activate:hover{opacity:.8}
        .chip-menu{background:none;border:none;cursor:pointer;font-size:.9em;padding:0 2px;line-height:1;color:inherit;opacity:.5;margin-left:1px}
        .chip-menu:hover{opacity:1}
        .chip-dropdown{display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:100;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#ccc);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);min-width:130px;overflow:hidden}
        .chip-dropdown.open{display:block}
        .chip-dd-item{padding:8px 14px;font-size:.8em;cursor:pointer;color:var(--primary-text-color);white-space:nowrap}
        .chip-dd-item:hover{background:var(--divider-color,#e0e0e0)}
        .chip-dd-item.disabled{opacity:.38;pointer-events:none}
        .chip-add{padding:4px 10px;border-radius:16px;border:1.5px dashed var(--divider-color,#ccc);background:none;cursor:pointer;font-size:.85em;color:var(--secondary-text-color);line-height:1;flex-shrink:0;transition:all .12s}
        .chip-add:hover{border-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4)}
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
        .focus-blk-info{display:flex;flex-direction:column;min-width:0;overflow:hidden;gap:1px}
        .focus-blk-info-row{flex-direction:row!important;gap:4px;align-items:center}
        .focus-blk-name{font-size:.72em;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
        .focus-blk-val{font-size:.68em;opacity:.9;white-space:nowrap;overflow:hidden;line-height:1.2}
        .focus-slim{display:flex;flex-direction:column;cursor:pointer;border-radius:8px;transition:background .15s;min-width:0;overflow:hidden}
        .focus-slim:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 5%,transparent)}
        .focus-slim-hdr{height:40px;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-size:.65em;font-weight:600;flex-shrink:0}
        .focus-slim-body{flex:1;position:relative;overflow:hidden}
        .focus-slim-bar{position:absolute;border-radius:3px;min-height:4px;box-sizing:border-box}
        .focus-slim:hover .focus-slim-bar{opacity:1!important}
      </style>
      <style id="tt-style">
        .sched-tooltip{position:fixed;background:rgba(0,0,0,.78);color:#fff;border-radius:8px;padding:8px 12px;font-size:.75em;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:9999;pointer-events:none;max-width:220px;line-height:1.5;backdrop-filter:blur(8px);animation:tt-in .15s ease}
        @keyframes tt-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .sched-tooltip::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:rgba(0,0,0,.78);border-bottom:none}
        .sched-tooltip .tt-name{font-weight:600;margin-bottom:3px}
        .sched-tooltip .tt-row{opacity:.8;font-size:.9em}
      </style>
      <ha-card>
        ${inNewProfile ? `
        <div class="card-header">
          <div class="hdr-row1">
            <span class="card-title">${(editingProfile?.name||this.t('profile.new_profile')).replace(/</g,'&lt;')} <span style="font-size:.68em;font-weight:400;opacity:.55">— ${this.t('profile.new_profile_mode')}</span></span>
            <div class="hdr-icons">
              <button class="btn-hdr btn-profile-cancel">${this.t('popup.cancel')}</button>
              <button class="btn-hdr btn-profile-save" style="background:var(--primary-color,#03a9f4);color:white;border-color:var(--primary-color,#03a9f4)">${this.t('popup.save')}</button>
            </div>
          </div>
        </div>` : `
        <div class="card-header">
          <div class="hdr-row1">
            <span class="card-title">${this._config.title||this.t('card.title')}</span>
            <div class="hdr-icons">
              <button class="btn-layout-toggle" title="${this._layout==='columns' ? this.t('card.layout_rows_view') : this.t('card.layout_cols_view')}"><ha-icon icon="${this._layout==='columns' ? 'mdi:view-agenda' : 'mdi:view-column'}" style="--mdi-icon-size:18px"></ha-icon></button>
              <button class="btn-groups" title="${this.t('card.manage_groups')}"><ha-icon icon="mdi:layers" style="--mdi-icon-size:18px"></ha-icon></button>
            </div>
          </div>
          <div class="hdr-row2">
            ${profiles.map(p=>{
              const active=this._isProfileActive(p),viewed=p.id===this._selectedProfileId,excl=p.exclusive!==false,isDef=p.id==='default';
              const pcolor=this._getProfileColor(p);
              return '<div class="chip-wrap">'
                + '<div class="profile-chip' + (viewed?' viewed':'') + (active?' active-op':'') + '" data-pid="' + p.id + '" style="--pchip-color:' + pcolor + '">'
                + '<span class="chip-lock">' + (excl?'🔒':'🔓') + '</span>'
                + (active?'<span class="chip-act-dot"></span>':'')
                + '<span class="chip-name">' + p.name + '</span>'
                + '<button class="chip-activate" data-pid="' + p.id + '" title="' + (active?this.t('profile.deactivate'):this.t('profile.activate')) + '" style="color:' + (active?'var(--secondary-text-color)':'#4CAF50') + '">▶</button>'
                + '<button class="chip-menu" data-pid="' + p.id + '">⋯</button>'
                + '</div>'
                + '<div class="chip-dropdown" data-pid="' + p.id + '">'
                + '<div class="chip-dd-item" data-action="rename" data-pid="' + p.id + '">' + this.t('profile.rename') + '</div>'
                + '<div class="chip-dd-item" data-action="duplicate" data-pid="' + p.id + '">' + this.t('profile.duplicate') + '</div>'
                + '<div class="chip-dd-item' + (isDef?' disabled':'') + '" data-action="delete" data-pid="' + p.id + '">' + this.t('profile.delete') + '</div>'
                + '</div></div>';
            }).join('')}
            <button class="chip-add" title="${this.t('profile.new_profile')}">＋</button>
          </div>
          <div class="hdr-sep"></div>
        </div>
        ${(()=>{
          const vp=profiles.find(x=>x.id===this._selectedProfileId)||profiles[0];
          if(!vp) return '';
          const isAct=this._isProfileActive(vp);
          return '<div class="profile-status-bar">' + this.t('profile.viewing') + ': <strong>' + vp.name + '</strong>'
            + (isAct ? ' <span class="psb-active">● ' + this.t('profile.active') + '</span>'
                     : ' <span>○ </span><button class="psb-activate-btn" data-pid="' + vp.id + '">' + this.t('profile.activate') + '</button>')
            + '</div>';
        })()}`}

        ${allTabs.length>1?`<div class="tab-bar">${allTabs.map((t,i)=>{
          const dot=t.color||(t.entities?.[0]?.color)||null;
          return `<div class="tab ${i===this._activeTab?'active':''}" data-tab="${i}">${dot?`<span class="tab-dot" style="background-color:${dot}"></span>`:''}${t.name||t.entity}</div>`;
        }).join('')}</div>`:''}

        ${this._layout === 'rows' ? gantt : `
        <div class="grid">
          <div class="hdr-cell"></div>
          ${DAYS.map(d=>`<div class="hdr-cell">${d}</div>`).join('')}
          <div class="time-axis">${timeLabels.map(tl=>`<div class="time-lbl" style="top:${tl.pct}%">${tl.label}</div>`).join('')}</div>
          ${colGrid}
        </div>`}

        ${legend}
      </ha-card>`;

    // Tab switching
    if (allTabs.length>1) {
      this.shadowRoot.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
        this._activeTab=parseInt(t.dataset.tab);
        try{localStorage.setItem('weekly-schedule-tab',this._activeTab);}catch{}
        this.render();
      }));
    }

    this.shadowRoot.querySelector('.btn-groups')?.addEventListener('click',()=>this._renderGroupsView());
    this.shadowRoot.querySelector('.btn-layout-toggle')?.addEventListener('click',()=>{
      this._layout = this._layout === 'columns' ? 'rows' : 'columns';
      try { localStorage.setItem('weekly-schedule-layout', this._layout); } catch {}
      this._animatedRender();
    });

    // New-profile Save / Cancel
    if (inNewProfile) {
      this.shadowRoot.querySelector('.btn-profile-save')?.addEventListener('click', () => {
        this._profileEditMode = null;
        this.render();
      });
      this.shadowRoot.querySelector('.btn-profile-cancel')?.addEventListener('click', () => this._cancelNewProfile());
    }

    this.shadowRoot.querySelector('ha-card').addEventListener('click',()=>{
      this.shadowRoot.querySelectorAll('.chip-dropdown').forEach(d=>d.classList.remove('open'));
    });
    this.shadowRoot.querySelectorAll('.profile-chip').forEach(chip=>chip.addEventListener('click',e=>{
      if(e.target.closest('.chip-menu')) return;
      if(e.target.closest('.chip-activate')) {
        const p=profiles.find(x=>x.id===chip.dataset.pid); if(!p) return;
        if(this._isProfileActive(p)) this._deactivateProfile(p.id);
        else this._activateProfile(p.id);
        return;
      }
      // Solo visualizzazione
      this._selectedProfileId=chip.dataset.pid;
      this._activeTab=0;
      this.render();
    }));
    this.shadowRoot.querySelectorAll('.psb-activate-btn').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const p=profiles.find(x=>x.id===btn.dataset.pid); if(!p) return;
      this._activateProfile(p.id);
    }));
    this.shadowRoot.querySelectorAll('.chip-menu').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const dd=btn.closest('.chip-wrap').querySelector('.chip-dropdown');
      const open=dd.classList.contains('open');
      this.shadowRoot.querySelectorAll('.chip-dropdown').forEach(d=>d.classList.remove('open'));
      if(!open) dd.classList.add('open');
    }));
    this.shadowRoot.querySelectorAll('.chip-dd-item').forEach(item=>item.addEventListener('click',()=>{
      const pid=item.dataset.pid, action=item.dataset.action;
      this.shadowRoot.querySelectorAll('.chip-dropdown').forEach(d=>d.classList.remove('open'));
      if(action==='rename') this._renameProfile(pid);
      else if(action==='duplicate') this._duplicateProfile(pid);
      else if(action==='delete') this._deleteProfile(pid);
    }));
    this.shadowRoot.querySelector('.chip-add')?.addEventListener('click',e=>{
      e.stopPropagation();
      this._showNewProfileDialog();
    });

    if (!isGroup) {
      this.shadowRoot.querySelectorAll('.block').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();this._openEditPopup(el.dataset.entity);}));
      this.shadowRoot.querySelectorAll('.day-column').forEach(col=>col.addEventListener('click',e=>{
        if(e.target.classList.contains('block')) return;
        const rect=col.getBoundingClientRect();
        this._openCreatePopup(parseInt(col.dataset.day),((e.clientY-rect.top)/rect.height)*100,tab);
      }));
      this.shadowRoot.querySelectorAll('.legend-item').forEach(el=>el.addEventListener('click',()=>this._openEditPopup(el.dataset.entity)));
    } else if (this._layout === 'rows') {
      this.shadowRoot.querySelectorAll('.gantt-block').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();this._openEditPopup(el.dataset.entity);}));
      this.shadowRoot.querySelectorAll('.gantt-area').forEach(area=>area.addEventListener('click',e=>{
        if(e.target.classList.contains('gantt-block')) return;
        const row=area.closest('.gantt-row');
        const ei=parseInt(row.dataset.ei), di=parseInt(row.dataset.day);
        const rect=area.getBoundingClientRect();
        this._openCreatePopup(di,((e.clientX-rect.left)/rect.width)*100,(tab.entities||[])[ei]);
      }));
    } else if (this._layout === 'compact') {
      this.shadowRoot.querySelectorAll('.compact-blk').forEach(el=>el.addEventListener('click',e=>{
        e.stopPropagation();
        this._openEditPopup(el.dataset.entity);
      }));
      this.shadowRoot.querySelectorAll('.compact-bar').forEach(bar=>bar.addEventListener('click',e=>{
        if(e.target.closest('.compact-blk')) return;
        const di=parseInt(bar.dataset.day), ei=parseInt(bar.dataset.ei);
        const rect=bar.getBoundingClientRect();
        const xPct=((e.clientX-rect.left)/rect.width)*100;
        const ec=(tab.entities||[])[ei];
        if(ec) this._openCreatePopup(di,xPct,ec);
      }));
      this.shadowRoot.querySelectorAll('.compact-day-hdr').forEach(hdr=>hdr.addEventListener('click',()=>{
        const di=parseInt(hdr.dataset.day);
        if(this._compactExpanded.has(di)) this._compactExpanded.delete(di);
        else this._compactExpanded.add(di);
        this.render();
      }));
    } else if (this._layout === 'focus') {
      this.shadowRoot.querySelectorAll('.focus-blk').forEach(el=>el.addEventListener('click',e=>{
        e.stopPropagation();
        this._openEditPopup(el.dataset.entity);
      }));
      this.shadowRoot.querySelectorAll('.focus-col-body').forEach(body=>body.addEventListener('click',e=>{
        if(e.target.closest('.focus-blk')) return;
        const di=parseInt(body.dataset.day);
        const rect=body.getBoundingClientRect();
        const yPct=((e.clientY-rect.top)/rect.height)*100;
        const ec=(tab.entities||[])[0];
        if(ec) this._openCreatePopup(di,yPct,ec);
      }));
      this.shadowRoot.querySelectorAll('.focus-slim').forEach(col=>col.addEventListener('click',()=>{
        this._focusDay=parseInt(col.dataset.day);
        this.render();
      }));
    } else {
      this.shadowRoot.querySelectorAll('.block').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();this._openEditPopup(el.dataset.entity);}));
      this.shadowRoot.querySelectorAll('.sub-col').forEach(col=>col.addEventListener('click',e=>{
        if(e.target.classList.contains('block')) return;
        const ei=parseInt(col.dataset.ei), di=parseInt(col.dataset.day);
        const rect=col.getBoundingClientRect();
        this._openCreatePopup(di,((e.clientY-rect.top)/rect.height)*100,(tab.entities||[])[ei]);
      }));
    }

    // Time line
    this._startTimeInterval();
    this._updateTimeLine();

    // Tooltip hover
    this.shadowRoot.addEventListener('mouseover', e => {
      const blk = e.target.closest('.block,.gantt-block,.compact-blk,.focus-blk'); if (!blk) return;
      const id = blk.dataset.entity; if (!id) return;
      this._hideTooltip();
      this._ttTimer = setTimeout(() => this._showTooltip(id, blk.getBoundingClientRect()), 300);
    });
    this.shadowRoot.addEventListener('mouseout', e => {
      if (e.target.closest('.block,.gantt-block,.compact-blk,.focus-blk')) this._hideTooltip();
    });
  }
}

customElements.define('weekly-schedule-card', WeeklyScheduleCard);
window.customCards = window.customCards || [];
window.customCards.push({ type:'weekly-schedule-card', name:'Weekly Schedule Card', description:'Visual weekly schedule card' });

// ── Mini Card ─────────────────────────────────────────────────────────────

class WeeklyScheduleMiniCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interval = null;
  }

  set hass(hass) { this._hass = hass; this._render(); }
  setConfig(config) { this._config = config; }
  getCardSize() { return 2; }

  _parseTime(t) { const [h,m]=t.split(':').map(Number); return h*60+(m||0); }

  _isActiveNow(s) {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7;
    const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];
    const dayKey = DAY_KEYS[dayIdx];
    if (!(s.attributes.weekdays||[]).includes(dayKey)) return false;
    const nowMin = now.getHours()*60+now.getMinutes();
    for (const slot of s.attributes.timeslots||[]) {
      const parts=slot.split(' - '); if(parts.length<2)continue;
      const [ah,am]=parts[0].split(':').map(Number), [bh,bm]=parts[1].split(':').map(Number);
      const start=ah*60+am; let end=bh*60+bm; if(end===0)end=1440;
      if(nowMin>=start&&nowMin<end)return true;
    }
    return false;
  }

  _domainIcon(entityId) {
    const d=(entityId||'').split('.')[0];
    if(d==='climate')return '🌡'; if(d==='light')return '💡';
    if(d==='switch')return '🔌'; if(d==='cover')return '🪟';
    return '📅';
  }

  _actionLabel(s, entityId) {
    const actions=s.attributes.actions||[]; if(!actions.length)return '';
    const svc=actions[0]?.service||'', data=actions[0]?.data||{};
    const dom=(entityId||'').split('.')[0];
    if(dom==='climate'&&data.temperature!=null)return `${data.temperature}°C`;
    if(svc.includes('turn_on'))return 'On'; if(svc.includes('turn_off'))return 'Off';
    return svc.split('.')[1]||'';
  }

  _render() {
    if(!this._hass)return;
    const states=this._hass.states;
    const cfgEntities=this._config?.entities
      ?this._config.entities.map(e=>typeof e==='string'?e:e.entity)
      :this._config?.entity?[this._config.entity]:null;

    const active=Object.values(states).filter(s=>
      s.entity_id.startsWith('switch.schedule_')&&s.state!=='off'&&this._isActiveNow(s)
    ).filter(s=>{
      if(!cfgEntities)return true;
      const ents=s.attributes.entities||[];
      return ents.some(e=>cfgEntities.includes(typeof e==='string'?e:e.entity_id));
    });

    const rows=active.map(s=>{
      const ents=s.attributes.entities||[];
      const firstEnt=typeof ents[0]==='string'?ents[0]:ents[0]?.entity_id||'';
      const icon=this._domainIcon(firstEnt);
      const name=(s.attributes.friendly_name||s.entity_id).replace(/</g,'&lt;');
      const action=this._actionLabel(s,firstEnt);
      return `<div class="mini-row">
        <div class="mini-icon-wrap">${icon}</div>
        <span class="mini-name">${name}</span>
        ${action?`<span class="mini-action">${action}`:''}${action?'</span>':''}
      </div>`;
    }).join('');

    const lang=this._hass?.language||'en';
    const defTitle=lang==='it'?'Schedule attivi':lang==='fr'?'Plannings actifs':'Active schedules';
    const title=(this._config?.title||defTitle).replace(/</g,'&lt;');
    this.shadowRoot.innerHTML=`
      <style>
        :host{display:block}
        ha-card{padding:12px 16px;border-radius:12px}
        .mini-title{font-size:.88em;font-weight:600;color:var(--primary-text-color);margin-bottom:10px}
        .mini-row{display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid var(--divider-color,#eee)}
        .mini-row:last-child{border-bottom:none}
        .mini-icon-wrap{width:36px;height:36px;border-radius:10px;background:rgba(3,169,244,.12);display:flex;align-items:center;justify-content:center;font-size:1.1em;flex-shrink:0}
        .mini-name{flex:1;font-size:.83em;color:var(--primary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .mini-action{font-size:.78em;color:var(--primary-color,#03a9f4);font-weight:600;flex-shrink:0}
        .mini-empty{text-align:center;padding:16px 0;font-size:.8em;color:var(--secondary-text-color)}
      </style>
      <ha-card>
        <div class="mini-title">${title}</div>
        ${rows||`<div class="mini-empty">📅 ${this._hass?.language==='it'?'Nessuno schedule attivo ora':this._hass?.language==='fr'?'Aucun planning actif':'No schedule active now'}</div>`}
      </ha-card>`;

    if(!this._interval) this._interval=setInterval(()=>this._render(),60000);
  }

  disconnectedCallback() {
    if(this._interval){clearInterval(this._interval);this._interval=null;}
  }
}

if(!customElements.get('weekly-schedule-mini-card'))
  customElements.define('weekly-schedule-mini-card',WeeklyScheduleMiniCard);
window.customCards.push({type:'weekly-schedule-mini-card',name:'Weekly Schedule Mini Card',description:'Shows currently active schedules'});
