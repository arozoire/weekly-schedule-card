// src/base-card.js
// Last modified: 2026-06-08 Rome

const PALETTE=['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B','#000000','#FFFFFF','#FF80AB','#69F0AE','#40C4FF'];

const LOCALES = {
  en: {
    card:{ title:'Weekly Schedule',new_profile:'New profile',groups:'Groups',no_entities:'No entities configured',no_entities_sub:'Add entities via YAML config, or create a Group to get started.',manage_groups:'Manage Groups',layout_rows_view:'Rows view',layout_cols_view:'Columns view',no_schedule_now:'No schedule active now',empty_schedule:'No schedule' },
    popup:{ new_schedule:'New Schedule',edit_schedule:'Edit Schedule',schedule_active:'Schedule Active',time_slot:'Time slot',snap:'Snap',days:'Days',start:'Start',end:'End',drag_hint:'Drag handles to resize.',next_slot:'＋ Next slot',temperature:'Temperature',hvac_mode:'HVAC Mode',preset_mode:'Preset Mode',fan_mode:'Fan Mode',swing_mode:'Swing Mode',climate_actions:'Climate Actions',light_action:'Light Action',action:'Action',brightness:'Brightness',auto_off:'Auto at slot end',none:'None',turn_off:'Turn Off',turn_on:'Turn On',set_temp:'Set temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (e.g. notify.mobile_app_phone)',notify_message_label:'Message',name:'Name',name_placeholder:'Schedule name (optional)',save:'Save',delete:'Delete',cancel:'Cancel',ok:'OK' },
    days:{ mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun',all:'All',workdays:'Workdays',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Exclusive (deactivates other exclusive profiles)',shared_label:'🔓 Shared (coexists with other profiles)',new_profile:'New Profile',create:'Create',name_placeholder:'Profile name',new_profile_mode:'new profile',rename:'Rename',duplicate:'Duplicate',delete:'Delete',viewing:'Viewing',active:'Active',activate:'Activate',deactivate:'Deactivate' },
    group:{ title:'Groups',back:'← Back',edit:'Edit',create:'Create Group',tab_color:'Tab color',select_entities:'Select entities',no_groups:'No groups yet.',create_new:'Create new group',delete_confirm:'Delete this group?',name:'Group name',enter_name:'Enter a group name.',select_entity:'Please select at least one entity.',create_placeholder:'e.g. Home Climate',removed_active:'active schedule(s) found on removed entit(ies). Deactivate?' },
    errors:{ no_days:'Please select at least one day.',delete_confirm:'Delete this schedule?',delete_profile_confirm:'Delete this profile and all its schedules?',save_failed:'Failed',overlap:'Overlap with existing schedule in this profile' },
    warnings:{ temp_unusual:'⚠️ Unusual value — check device compatibility',temp_very_high:'🔴 Warning: very high temperature',out_of_slider_range:'Outside typical range for this entity' },
    cond:{ add:'Add condition',entity:'Entity',operator:'Operator',value:'Value',and_all:'All (AND)',or_any:'Any (OR)',recheck:'Re-check interval' },
    notify:{ restore_auto:'Restore auto text',trigger_label:'When to notify',trigger_none:'Never',trigger_start:'On start',trigger_end:'On end',trigger_both:'Start + end',msg_start_label:'Start message',msg_end_label:'End message',default_start:'Schedule started',default_end:'Schedule ended' },
    linked:{ title:'Linked objects',auto_off:'Auto-off automation',cond_auto:'Condition automation',extras_auto:'Extras automation',notify:'Notification',override_flag:'Override flag',open:'Open',edit_yaml:'Edit YAML',missing:'missing' },
    endact:{ brightness:'Set brightness',color:'Set color',color_temp:'Set color temp',speed:'Set speed',position:'Set position',open:'Open',close:'Close',stop:'Stop' },
    override:{ enable:'Allow manual override',hint:'If you change the entity by hand during a slot, the schedule stops re-applying its value until the next slot (conditional schedules only).',active:'Manual override active',inactive:'No override',cancel:'Cancel override now' }
  },
  it: {
    card:{ title:'Pianificazione Settimanale',new_profile:'Nuovo profilo',groups:'Gruppi',no_entities:'Nessuna entità configurata',no_entities_sub:'Aggiungi entità via YAML o crea un Gruppo per iniziare.',manage_groups:'Gestisci Gruppi',layout_rows_view:'Vista righe',layout_cols_view:'Vista colonne',no_schedule_now:'Nessuno schedule attivo ora',empty_schedule:'Nessuno schedule' },
    popup:{ new_schedule:'Nuovo Schedule',edit_schedule:'Modifica Schedule',schedule_active:'Schedule Attivo',time_slot:'Fascia oraria',snap:'Snap',days:'Giorni',start:'Inizio',end:'Fine',drag_hint:'Trascina le maniglie per ridimensionare.',next_slot:'＋ Slot successivo',temperature:'Temperatura',hvac_mode:'Modalità HVAC',preset_mode:'Modalità preset',fan_mode:'Modalità ventola',swing_mode:'Modalità oscillazione',climate_actions:'Azioni clima',light_action:'Azione luce',action:'Azione',brightness:'Luminosità',auto_off:'Azione al termine slot',none:'Nessuna',turn_off:'Spegni',turn_on:'Accendi',set_temp:'Imposta temp',conditions:'Condizioni',add_condition:'+ Condizione',notifications:'Notifiche',notify_service_label:'Servizio (es. notify.mobile_app_phone)',notify_message_label:'Messaggio',name:'Nome',name_placeholder:'Nome schedule (opzionale)',save:'Salva',delete:'Elimina',cancel:'Annulla',ok:'OK' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Gio',fri:'Ven',sat:'Sab',sun:'Dom',all:'Tutti',workdays:'Feriali',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Esclusivo (disattiva altri profili esclusivi)',shared_label:'🔓 Condiviso (coesiste con altri profili)',new_profile:'Nuovo Profilo',create:'Crea',name_placeholder:'Nome profilo',new_profile_mode:'nuovo profilo',rename:'Rinomina',duplicate:'Duplica',delete:'Elimina',viewing:'Stai visualizzando',active:'Attivo',activate:'Attiva',deactivate:'Disattiva' },
    group:{ title:'Gruppi',back:'← Indietro',edit:'Modifica',create:'Crea Gruppo',tab_color:'Colore tab',select_entities:'Seleziona entità',no_groups:'Nessun gruppo.',create_new:'Crea nuovo gruppo',delete_confirm:'Eliminare questo gruppo?',name:'Nome gruppo',enter_name:'Inserisci un nome gruppo.',select_entity:"Seleziona almeno un'entità.",create_placeholder:'es. Clima Casa',removed_active:'schedule attivi su entità rimosse. Disattivarli?' },
    errors:{ no_days:'Seleziona almeno un giorno.',delete_confirm:'Eliminare questo schedule?',delete_profile_confirm:'Eliminare questo profilo e tutti i suoi schedule?',save_failed:'Errore',overlap:'Sovrapposizione con schedule esistente in questo profilo' },
    warnings:{ temp_unusual:'⚠️ Valore insolito — verifica compatibilità con il tuo dispositivo',temp_very_high:'🔴 Attenzione: temperatura molto alta',out_of_slider_range:'Fuori dal range tipico per questa entità' },
    cond:{ add:'Aggiungi condizione',entity:'Entità',operator:'Operatore',value:'Valore',and_all:'Tutte (AND)',or_any:'Una qualsiasi (OR)',recheck:'Intervallo rivalutazione' },
    notify:{ restore_auto:'Ripristina testo automatico',trigger_label:'Quando notificare',trigger_none:'Mai',trigger_start:"All'inizio",trigger_end:'Alla fine',trigger_both:'Inizio + fine',msg_start_label:'Messaggio inizio',msg_end_label:'Messaggio fine',default_start:'Schedule attivato',default_end:'Schedule terminato' },
    linked:{ title:'Oggetti collegati',auto_off:'Automazione auto-off',cond_auto:'Automazione condizioni',extras_auto:'Automazione extra',notify:'Notifica',override_flag:'Flag override',open:'Apri',edit_yaml:'Modifica YAML',missing:'mancante' },
    endact:{ brightness:'Imposta luminosità',color:'Imposta colore',color_temp:'Imposta temp. colore',speed:'Imposta velocità',position:'Imposta posizione',open:'Apri',close:'Chiudi',stop:'Ferma' },
    override:{ enable:'Consenti override manuale',hint:'Se cambi l\'entità a mano durante uno slot, lo schedule smette di ri-applicare il suo valore fino al prossimo slot (solo schedule con condizioni).',active:'Override manuale attivo',inactive:'Nessun override',cancel:'Annulla override adesso' }
  },
  fr: {
    card:{ title:'Planning Hebdomadaire',new_profile:'Nouveau profil',groups:'Groupes',no_entities:'Aucune entité configurée',no_entities_sub:'Ajoutez des entités via la config YAML, ou créez un Groupe pour commencer.',manage_groups:'Gérer les Groupes',layout_rows_view:'Vue lignes',layout_cols_view:'Vue colonnes',no_schedule_now:'Aucun planning actif',empty_schedule:'Aucun planning' },
    popup:{ new_schedule:'Nouveau Schedule',edit_schedule:'Modifier Schedule',schedule_active:'Schedule Actif',time_slot:'Créneau horaire',snap:'Snap',days:'Jours',start:'Début',end:'Fin',drag_hint:'Glissez les poignées pour redimensionner.',next_slot:'＋ Créneau suivant',temperature:'Température',hvac_mode:'Mode HVAC',preset_mode:'Mode preset',fan_mode:'Mode ventilateur',swing_mode:'Mode oscillation',climate_actions:'Actions climatisation',light_action:'Action lumière',action:'Action',brightness:'Luminosité',auto_off:'Action en fin de créneau',none:'Aucune',turn_off:'Éteindre',turn_on:'Allumer',set_temp:'Définir temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (ex. notify.mobile_app_phone)',notify_message_label:'Message',name:'Nom',name_placeholder:'Nom du schedule (optionnel)',save:'Sauvegarder',delete:'Supprimer',cancel:'Annuler',ok:'OK' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Jeu',fri:'Ven',sat:'Sam',sun:'Dim',all:'Tous',workdays:'Jours ouvrés',weekend:'Week-end' },
    profile:{ exclusive_label:"🔒 Exclusif (désactive les autres profils exclusifs)",shared_label:"🔓 Partagé (coexiste avec d'autres profils)",new_profile:'Nouveau Profil',create:'Créer',name_placeholder:'Nom du profil',new_profile_mode:'nouveau profil',rename:'Renommer',duplicate:'Dupliquer',delete:'Supprimer',viewing:'En vue',active:'Actif',activate:'Activer',deactivate:'Désactiver' },
    group:{ title:'Groupes',back:'← Retour',edit:'Modifier',create:'Créer Groupe',tab_color:'Couleur onglet',select_entities:'Sélectionner entités',no_groups:'Aucun groupe.',create_new:'Créer nouveau groupe',delete_confirm:'Supprimer ce groupe ?',name:'Nom du groupe',enter_name:'Entrez un nom de groupe.',select_entity:'Sélectionnez au moins une entité.',create_placeholder:'ex. Climat Maison',removed_active:'planning(s) actif(s) sur entité(s) retirée(s). Désactiver ?' },
    errors:{ no_days:'Sélectionnez au moins un jour.',delete_confirm:'Supprimer ce schedule ?',delete_profile_confirm:'Supprimer ce profil et tous ses schedules ?',save_failed:'Échec',overlap:'Chevauchement avec un planning existant dans ce profil' },
    warnings:{ temp_unusual:"⚠️ Valeur inhabituelle — vérifiez la compatibilité avec votre appareil",temp_very_high:"🔴 Attention : température très élevée",out_of_slider_range:'Hors de la plage typique pour cette entité' },
    cond:{ add:'Ajouter condition',entity:'Entité',operator:'Opérateur',value:'Valeur',and_all:'Toutes (AND)',or_any:"N'importe laquelle (OR)",recheck:'Intervalle de réévaluation' },
    notify:{ restore_auto:'Restaurer texte auto',trigger_label:'Quand notifier',trigger_none:'Jamais',trigger_start:'Au début',trigger_end:'À la fin',trigger_both:'Début + fin',msg_start_label:'Message début',msg_end_label:'Message fin',default_start:'Schedule démarré',default_end:'Schedule terminé' },
    linked:{ title:'Objets liés',auto_off:'Automatisation auto-off',cond_auto:'Automatisation conditions',extras_auto:'Automatisation extra',notify:'Notification',override_flag:'Indicateur surcharge',open:'Ouvrir',edit_yaml:'Modifier YAML',missing:'manquant' },
    endact:{ brightness:'Définir luminosité',color:'Définir couleur',color_temp:'Définir temp. couleur',speed:'Définir vitesse',position:'Définir position',open:'Ouvrir',close:'Fermer',stop:'Arrêter' },
    override:{ enable:'Autoriser la commande manuelle',hint:'Si vous changez l\'entité à la main pendant un créneau, le planning cesse de réappliquer sa valeur jusqu\'au prochain créneau (plannings avec conditions uniquement).',active:'Commande manuelle active',inactive:'Aucune surcharge',cancel:'Annuler la surcharge' }
  }
};

export default class WeeklyScheduleBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._popupState = null;
    this._snap = 15;
    this._activeTab = 0;
    this._profilesMode = false;
    this._groupsMode = false;
    this._storageData = null;
    this._loadingStorage = false;
    this._layout = 'columns';
    this._compactExpanded = new Set(); // BF-2: Set vuoto, non null
    this._focusDay = null;
    this._profileEdit = null;
    this._selectedProfileId = null;
    this._profileEditMode = null;
    this._dialogOpen = false;
    this._timeInterval = null;
    this._ttTimer = null;
    this._ttEl = null;
    this._lang = null;
    this._prevHass = null;
  }

  set hass(hass) {
    const prev = this._prevHass;
    this._prevHass = hass;
    this._hass = hass;
    // Auto re-fetch storage when a schedule entity is added/removed (cross-card sync)
    if (prev && this._storageData && !this._loadingStorage) {
      const prevSet = new Set(Object.keys(prev.states).filter(k => k.startsWith('switch.schedule_')));
      const currKeys = Object.keys(hass.states).filter(k => k.startsWith('switch.schedule_'));
      const addedOrRemoved = currKeys.length !== prevSet.size || currKeys.some(k => !prevSet.has(k));
      if (addedOrRemoved) {
        this._loadingStorage = true;
        this._wsGet().then(data => {
          if (data) this._storageData = data;
          this._loadingStorage = false;
          if (!this._popupState && !this._profilesMode && !this._groupsMode && !this._dialogOpen) this.render();
        }).catch(() => { this._loadingStorage = false; });
        return;
      }
    }
    if (!this._storageData && !this._loadingStorage) {
      this._loadingStorage = true;
      this._wsGet().then(data => {
        this._storageData = data;
        this._ensureDefaultProfile();
        this._loadingStorage = false;
        this._cleanupOrphanAutomations().catch(() => {});
        if (!this._popupState && !this._profilesMode && !this._groupsMode && !this._dialogOpen) this.render();
      }).catch(() => {
        this._storageData = { groups: [], profiles: [], activeProfiles: [] };
        this._ensureDefaultProfile();
        this._loadingStorage = false;
        if (!this._popupState && !this._profilesMode && !this._groupsMode && !this._dialogOpen) this.render();
      });
    } else if (!this._popupState && !this._profilesMode && !this._groupsMode && !this._dialogOpen) {
      this._scheduleRender(prev);
    }
  }

  // Wrap a render() call with a View Transition (crossfade) when supported.
  // Falls back to a short opacity fade for older browsers. Used by view-toggle handlers.
  _animatedRender() {
    if (typeof document.startViewTransition === 'function') {
      try { document.startViewTransition(() => this.render()); return; } catch {}
    }
    const card = this.shadowRoot?.querySelector('ha-card');
    if (!card) { this.render(); return; }
    card.style.transition = 'opacity .12s ease-out';
    card.style.opacity = '0';
    setTimeout(() => {
      this.render();
      const fresh = this.shadowRoot?.querySelector('ha-card');
      if (!fresh) return;
      fresh.style.opacity = '0';
      fresh.style.transition = 'opacity .18s ease-in';
      requestAnimationFrame(() => { fresh.style.opacity = '1'; });
    }, 120);
  }

  _scheduleRender(prevHass) {
    if (this._renderTimer) return;
    this._pendingPrev = this._pendingPrev || prevHass;
    this._renderTimer = setTimeout(() => {
      this._renderTimer = null;
      const p = this._pendingPrev;
      this._pendingPrev = null;
      if (this._popupState || this._profilesMode || this._groupsMode || this._dialogOpen) return;
      if (this._hassChangedRelevant(p, this._hass)) this.render();
    }, 100);
  }

  _hassChangedRelevant(prev, curr) {
    if (!prev || !curr) return true;
    const watched = new Set();
    for (const ec of this._entities || []) if (ec.entity) watched.add(ec.entity);
    for (const p of this._storageData?.profiles || [])
      for (const g of p.groups || [])
        for (const ec of g.entities || []) if (ec.entity) watched.add(ec.entity);
    if (watched.size === 0) return true;
    for (const eid of watched) {
      const s = curr.states[eid], ps = prev.states[eid];
      if (!ps || !s) return true;
      if (ps.state !== s.state || ps.last_changed !== s.last_changed) return true;
    }
    for (const s of Object.values(curr.states)) {
      if (!s.entity_id.startsWith('switch.schedule_')) continue;
      const ents = s.attributes?.entities || [];
      if (!ents.some(e => watched.has(e))) continue;
      const ps = prev.states[s.entity_id];
      if (!ps || ps.state !== s.state || ps.last_changed !== s.last_changed) return true;
    }
    return false;
  }

  setConfig(config) {
    if (config.entities) {
      this._entities = config.entities;
    } else if (config.entity) {
      this._entities = [{ entity: config.entity, name: config.name || null, color: null }];
    } else {
      this._entities = [];
    }
    this._config = config;
    this._snap = config.snap || 15;
    this._lang = null;
    try {
      const idx = parseInt(localStorage.getItem('weekly-schedule-tab') || '0');
      if (idx >= 0) this._activeTab = idx;
      const lv = localStorage.getItem('weekly-schedule-layout');
      this._layout = lv === 'rows' ? 'rows' : lv === 'compact' ? 'compact' : lv === 'focus' ? 'focus' : 'columns';
    } catch {}
    // BF-2: inizializza compactExpanded con il giorno corrente
    const todayIdx = (new Date().getDay() + 6) % 7;
    this._compactExpanded = new Set([todayIdx]);
  }

  t(key) {
    if (!this._lang) {
      const cfg = (this._config?.language || '').toLowerCase().slice(0, 2);
      const ha  = (this._hass?.language || '').toLowerCase().slice(0, 2);
      const nav = (navigator?.language || '').toLowerCase().slice(0, 2);
      const raw = cfg || ha || nav || 'en';
      this._lang = LOCALES[raw] ? raw : 'en';
    }
    const parts = key.split('.');
    let obj = LOCALES[this._lang];
    for (const p of parts) { if (obj == null) break; obj = obj[p]; }
    if (obj != null && typeof obj === 'string') return obj;
    let en = LOCALES.en;
    for (const p of parts) { if (en == null) break; en = en[p]; }
    return (en != null && typeof en === 'string') ? en : key;
  }

  getCardSize() { return 7; }

  // ── Render helpers: persistent <style> + body container ──────────────────

  // Persist a <style> element across renders. css is replaced in place if changed.
  // Without this, every shadowRoot.innerHTML = ... would re-parse the CSS.
  _setStyles(key, css) {
    let el = this.shadowRoot.querySelector(`style[data-wsc="${key}"]`);
    if (!el) {
      el = document.createElement('style');
      el.dataset.wsc = key;
      this.shadowRoot.prepend(el);
    }
    if (el.textContent !== css) el.textContent = css;
  }

  // Lazily create a <div class="wsc-root"> as the body container.
  // Render methods write into root.innerHTML instead of shadowRoot.innerHTML
  // so that persistent <style> siblings (and live <dialog>/tooltips) survive.
  _ensureRoot() {
    let root = this.shadowRoot.querySelector('.wsc-root');
    if (!root) {
      root = document.createElement('div');
      root.className = 'wsc-root';
      this.shadowRoot.appendChild(root);
    }
    return root;
  }

  // ── WebSocket storage ─────────────────────────────────────────────────────

  async _wsGet() {
    const result = await this._hass.connection.sendMessagePromise({
      type: 'frontend/get_user_data',
      key: 'weekly_schedule_card',
    });
    return result?.value || { groups: [], profiles: [], activeProfiles: [] };
  }

  async _wsSet(data) {
    this._storageData = data;
    await this._hass.connection.sendMessagePromise({
      type: 'frontend/set_user_data',
      key: 'weekly_schedule_card',
      value: data,
    });
    // Notify other card instances on the same page
    try {
      window.dispatchEvent(new CustomEvent('wsc-storage-changed', { detail: { source: this, data } }));
    } catch {}
  }

  // ── Profile bootstrap ─────────────────────────────────────────────────────

  _ensureDefaultProfile() {
    const data = this._storageData;
    if (!data.activeProfiles) data.activeProfiles = [];
    let dirty = false;
    if (!data.profiles || !data.profiles.length) {
      const existingSchedules = this._hass
        ? Object.keys(this._hass.states).filter(k => k.startsWith('switch.schedule_'))
        : [];
      data.profiles = [{ id: 'default', name: 'Default', exclusive: true, groups: [], schedules: existingSchedules, scheduleLinks: [] }];
      if (existingSchedules.length) data.activeProfiles = ['default'];
      dirty = true;
    }
    for (const p of data.profiles) {
      if (!p.groups) { p.groups = []; dirty = true; }
      if (!p.scheduleLinks) { p.scheduleLinks = []; dirty = true; }
      for (const link of p.scheduleLinks)
        if (link.autoChild) { delete link.autoChild; dirty = true; }
    }
    if (data.groups?.length) {
      const def = data.profiles.find(p => p.id === 'default') || data.profiles[0];
      if (def) {
        const existing = new Set(def.groups.map(g => g.id));
        for (const g of data.groups) if (!existing.has(g.id)) def.groups.push(g);
      }
      data.groups = [];
      dirty = true;
    }
    if (dirty) this._wsSet(data).catch(() => {});
    if (!this._selectedProfileId || !data.profiles.find(p => p.id === this._selectedProfileId))
      this._selectedProfileId = data.activeProfiles[0] || data.profiles[0]?.id || null;
  }

  _getSelectedProfile() {
    const profiles = this._storageData?.profiles || [];
    return profiles.find(p => p.id === this._selectedProfileId) || profiles[0] || null;
  }

  _getProfileSchedules(entityId) {
    const all = this._getSchedules(entityId).filter(s => !s.attributes.tags?.includes('weekly_schedule_auto'));
    const profile = this._getSelectedProfile();
    if (!profile) return all;
    const ids = profile.schedules || [];
    const profiles = this._storageData?.profiles || [];
    if (profiles.length === 1 && !ids.length) return all;
    if (!ids.length) return [];
    const set = new Set(ids);
    return all.filter(s => set.has(s.entity_id));
  }

  async _waitForNewSchedule(beforeIds) {
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 500));
      const newId = Object.keys(this._hass.states).find(k => k.startsWith('switch.schedule_') && !beforeIds.has(k));
      if (newId) return newId;
    }
    return null;
  }

  async _addScheduleToProfile(entityId) {
    const data = this._storageData;
    const profile = this._getSelectedProfile();
    if (!profile) return;
    if (!profile.schedules) profile.schedules = [];
    if (!profile.scheduleLinks) profile.scheduleLinks = [];
    if (!profile.schedules.includes(entityId)) profile.schedules.push(entityId);
    await this._wsSet({ ...data, profiles: data.profiles });
  }

  // ── Auto-child helpers ────────────────────────────────────────────────────

  _getAutoChildId(parentEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === parentEntityId);
      if (link?.autoChildId) return link.autoChildId;
    }
    return null;
  }

  _hasAutoChild(entityId) { return !!this._getAutoChildId(entityId); }

  async _clearAutoChildId(parentEntityId) {
    const data = this._storageData;
    for (const p of data.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === parentEntityId);
      if (link) delete link.autoChildId;
    }
    await this._wsSet(data);
  }

  // ── Auto-off (end-of-slot) helpers ────────────────────────────────────────

  _getAutoOffAutoId(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.autoOffAutoId) return link.autoOffAutoId;
    }
    return null;
  }

  async _saveAutoOffAutoId(scheduleEntityId, autoId) {
    const data = this._storageData;
    for (const p of data.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link) { if (autoId) link.autoOffAutoId = autoId; else delete link.autoOffAutoId; }
    }
    await this._wsSet(data);
  }

  // Stored end-of-slot action ({stopAction, stopValue}) or null if not persisted.
  _getStoredStop(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link && 'stopAction' in link) return { stopAction: link.stopAction || null, stopValue: link.stopValue ?? null };
    }
    return null;
  }

  _hasEndAction(scheduleEntityId) {
    return !!(this._getStoredStop(scheduleEntityId)?.stopAction) || this._hasAutoChild(scheduleEntityId);
  }

  // ── Condition storage helpers ─────────────────────────────────────────────

  _getStoredConditions(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.conditions) return { conditions: link.conditions, condCombinator: link.condCombinator || 'and', condInterval: link.condInterval || 15 };
    }
    return { conditions: [], condCombinator: 'and', condInterval: 15 };
  }

  _getCondAutoId(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.condAutoId) return link.condAutoId;
    }
    return null;
  }

  async _saveCondData(scheduleEntityId, condAutoId, conditions, condCombinator, condInterval=15) {
    const data = this._storageData;
    let found = false;
    for (const p of data.profiles || []) {
      if (!p.scheduleLinks) p.scheduleLinks = [];
      const link = p.scheduleLinks.find(l => l.id === scheduleEntityId);
      if (link) {
        if (condAutoId !== null) link.condAutoId = condAutoId;
        link.conditions = conditions;
        link.condCombinator = condCombinator;
        link.condInterval = condInterval;
        found = true;
      }
    }
    if (!found) {
      const profile = this._getSelectedProfile();
      if (profile) {
        if (!profile.scheduleLinks) profile.scheduleLinks = [];
        let link = profile.scheduleLinks.find(l => l.id === scheduleEntityId);
        if (!link) { link = { id: scheduleEntityId }; profile.scheduleLinks.push(link); }
        if (condAutoId !== null) link.condAutoId = condAutoId;
        link.conditions = conditions;
        link.condCombinator = condCombinator;
        link.condInterval = condInterval;
      }
    }
    await this._wsSet(data);
  }

  async _clearCondData(scheduleEntityId) {
    const data = this._storageData;
    for (const p of data.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link) { delete link.condAutoId; delete link.conditions; delete link.condCombinator; delete link.condInterval; }
    }
    await this._wsSet(data);
  }

  // ── Manual-override storage helpers ───────────────────────────────────────
  // Override state is held by a trigger-less marker automation (wsc_ovrflag_<slug>):
  // state 'on' = no override (schedule in control), 'off' = manual override active.
  // The flag entity_id is deterministic from the config object_id.
  _overrideFlagEntityId(scheduleEntityId) {
    // HA derives an automation's entity_id from its ALIAS (slugified), NOT from the
    // config object_id. Our flag alias is `WSC Override flag - <eid>` → slugifies to
    // `wsc_override_flag_<eid with "." → "_">`. Must match exactly or templates/turn_off
    // would target a non-existent entity (→ override never engages).
    return `automation.wsc_override_flag_${scheduleEntityId.replace(/\./g, '_')}`;
  }

  _getOverrideEnabled(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link && 'overrideEnabled' in link) return !!link.overrideEnabled;
    }
    return false;
  }

  _getOverrideFlagId(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.overrideFlagAutoId) return link.overrideFlagAutoId;
    }
    return null;
  }

  async _saveOverrideData(scheduleEntityId, enabled, flagId) {
    const data = this._storageData;
    for (const p of data.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link) {
        link.overrideEnabled = !!enabled;
        if (flagId !== undefined) { if (flagId) link.overrideFlagAutoId = flagId; else delete link.overrideFlagAutoId; }
      }
    }
    await this._wsSet(data);
  }

  // ── Extras (preset/fan/swing/hvac) storage helpers ────────────────────────

  _getExtras(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.extras) return link.extras;
    }
    return null;
  }

  _getExtrasAutoId(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.extrasAutoId) return link.extrasAutoId;
    }
    return null;
  }

  _getNotifyAutoId(scheduleEntityId) {
    for (const p of this._storageData?.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link?.notifyAutoId) return link.notifyAutoId;
    }
    return null;
  }

  async _saveNotifyAutoId(scheduleEntityId, autoId) {
    const data = this._storageData;
    for (const p of data.profiles || []) {
      const link = (p.scheduleLinks || []).find(l => l.id === scheduleEntityId);
      if (link) { if (autoId) link.notifyAutoId = autoId; else delete link.notifyAutoId; }
    }
    await this._wsSet(data);
  }

  async _saveExtras(scheduleEntityId, extras, extrasAutoId) {
    const data = this._storageData;
    let found = false;
    for (const p of data.profiles || []) {
      if (!p.scheduleLinks) p.scheduleLinks = [];
      const link = p.scheduleLinks.find(l => l.id === scheduleEntityId);
      if (link) {
        if (extras) link.extras = extras; else delete link.extras;
        if (extrasAutoId !== undefined) {
          if (extrasAutoId) link.extrasAutoId = extrasAutoId; else delete link.extrasAutoId;
        }
        found = true;
      }
    }
    if (!found && extras) {
      const profile = this._getSelectedProfile();
      if (profile) {
        if (!profile.scheduleLinks) profile.scheduleLinks = [];
        let link = profile.scheduleLinks.find(l => l.id === scheduleEntityId);
        if (!link) { link = { id: scheduleEntityId }; profile.scheduleLinks.push(link); }
        link.extras = extras;
        if (extrasAutoId) link.extrasAutoId = extrasAutoId;
      }
    }
    await this._wsSet(data);
  }

  // Cleanup (runs once at boot). Two passes:
  //  1. Storage-tracked: scheduleLinks whose parent entity is gone → delete their
  //     condAutoId/extrasAutoId automations + autoChildId schedule, then prune the link.
  //  2. Tag sweep: any switch.schedule_ tagged weekly_schedule_auto whose `parent:<eid>`
  //     no longer exists → remove it. Catches children orphaned by whole-profile deletions
  //     (their links are gone from storage, so pass 1 can't see them).
  // Guard: only run once HA states are loaded.
  async _cleanupOrphanAutomations() {
    if (this._orphanCleanupDone) return;
    const states = this._hass?.states;
    if (!states || Object.keys(states).length === 0) return;
    this._orphanCleanupDone = true;
    const data = this._storageData;
    if (!data?.profiles) return;
    let dirty = false;
    const deletions = [];
    const childRemovals = new Set();
    for (const p of data.profiles) {
      const links = p.scheduleLinks || [];
      const surviving = [];
      for (const link of links) {
        if (!link.id) { surviving.push(link); continue; }
        if (states[link.id]) { surviving.push(link); continue; }
        // Orphan — collect automation IDs + auto-off child to delete
        if (link.condAutoId) deletions.push(link.condAutoId);
        if (link.extrasAutoId) deletions.push(link.extrasAutoId);
        if (link.notifyAutoId) deletions.push(link.notifyAutoId);
        if (link.autoOffAutoId) deletions.push(link.autoOffAutoId);
        if (link.overrideFlagAutoId) deletions.push(link.overrideFlagAutoId);
        if (link.autoChildId) childRemovals.add(link.autoChildId);
        // Also remove from p.schedules
        p.schedules = (p.schedules || []).filter(x => x !== link.id);
        dirty = true;
      }
      if (surviving.length !== links.length) { p.scheduleLinks = surviving; dirty = true; }
    }
    // Tag sweep: auto-children whose parent entity is gone (e.g. profile deleted)
    for (const s of Object.values(states)) {
      if (!s.entity_id.startsWith('switch.schedule_')) continue;
      const tags = s.attributes?.tags;
      if (!Array.isArray(tags) || !tags.includes('weekly_schedule_auto')) continue;
      const parentTag = tags.find(t => t.startsWith('parent:'));
      if (!parentTag) continue;
      const parentEid = parentTag.slice('parent:'.length);
      if (parentEid && !states[parentEid]) childRemovals.add(s.entity_id);
    }
    for (const autoId of deletions) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${autoId}`); }
      catch (e) { console.warn('WSC orphan automation cleanup failed', autoId, e); }
    }
    for (const childId of childRemovals) {
      try { await this._hass.callService('scheduler', 'remove', { entity_id: childId }); }
      catch (e) { console.warn('WSC orphan child cleanup failed', childId, e); }
    }
    if (dirty) await this._wsSet(data).catch(() => {});
    if (deletions.length || childRemovals.size)
      console.log(`[WSC] Cleaned up ${deletions.length} orphan automation(s), ${childRemovals.size} orphan child schedule(s)`);
  }

  // ── Auto-off automation (end-of-slot action; replaces the old child schedule) ──

  async _syncAutoOffAutomation(scheduleEntityId, ps) {
    const existingId = this._getAutoOffAutoId(scheduleEntityId);
    // Migration: remove any legacy child schedule for this parent.
    const legacyChild = this._getAutoChildId(scheduleEntityId);
    if (legacyChild) {
      try { await this._hass.callService('scheduler', 'remove', { entity_id: legacyChild }); } catch {}
      await this._clearAutoChildId(scheduleEntityId);
    }
    const cleanup = async () => {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC autoOff delete failed', e); }
        await this._saveAutoOffAutoId(scheduleEntityId, null);
      }
    };
    const endActions = this._buildStopActions(ps); // null if no end action
    if (!endActions || !endActions.length) { await cleanup(); return; }
    const eid = ps.entityConf.entity;
    const targetId = existingId || `wsc_autooff_${scheduleEntityId.replace('switch.', '')}`;
    // Race guard: do nothing if another WSC schedule controlling the same entity is
    // active right now → the next schedule wins (es. A→off mentre B→on subito dopo).
    const guardTpl = `{% set ns = namespace(a=false) %}{% for s in states.switch if s.entity_id.startswith('switch.schedule_') and s.entity_id != '${scheduleEntityId}' and s.state != 'off' and state_attr(s.entity_id, 'current_slot') is not none and '${eid}' in (s.attributes.entities | default([])) %}{% set ns.a = true %}{% endfor %}{{ not ns.a }}`;
    const automationConfig = {
      alias: `WSC Auto-off - ${scheduleEntityId}`,
      description: 'Auto-generated by Weekly Schedule Card',
      trigger: [{ platform: 'template', value_template: `{{ state_attr('${scheduleEntityId}', 'current_slot') is none }}` }],
      condition: [{ condition: 'not', conditions: [{ condition: 'state', entity_id: scheduleEntityId, state: 'off' }] }],
      action: [
        { delay: { seconds: 3 } },
        { condition: 'template', value_template: guardTpl },
        ...endActions,
      ],
      mode: 'restart',
    };
    try {
      await this._recreateAutomation(targetId, automationConfig);
      await this._saveAutoOffAutoId(scheduleEntityId, targetId);
    } catch (e) {
      console.error('WSC autoOff save failed', e);
    }
  }

  // ── Default notification message ──────────────────────────────────────────

  _buildDefaultNotifyMessage(ps, kind = 'start') {
    if (!ps) return '';
    const lang = this._lang || 'it';
    const ec = ps.entityConf || {};
    const entityName = this._hass?.states?.[ec.entity]?.attributes?.friendly_name || ec.name || ec.entity || '';
    const startTime = this._minutesToTime(ps.startMin);
    const endTime = this._minutesToTime(ps.endMin === 1440 ? 0 : ps.endMin);
    const onLbl = lang === 'en' ? 'on' : lang === 'fr' ? 'allumé' : 'acceso';
    const offLbl = lang === 'en' ? 'off' : lang === 'fr' ? 'éteint' : 'spento';
    const fromTo = lang === 'en' ? `From ${startTime} to ${endTime}` : lang === 'fr' ? `De ${startTime} à ${endTime}` : `Dalle ${startTime} alle ${endTime}`;
    // weekdays
    const ds = [...(ps.days || [])].sort((a,b)=>a-b);
    let daysText;
    if (ds.length === 7) daysText = this.t('days.all') || (lang==='en'?'every day':lang==='fr'?'tous les jours':'tutti i giorni');
    else if (ds.length === 5 && ds.every((v,i)=>v===i)) daysText = this.t('days.workdays') || (lang==='en'?'workdays':lang==='fr'?'jours ouvrés':'feriali');
    else if (ds.length === 2 && ds[0]===5 && ds[1]===6) daysText = this.t('days.weekend') || (lang==='en'?'weekend':'weekend');
    else daysText = ds.map(i => this.t(`days.${this._getDayKey(i)}`) || this._getDayKey(i)).join(', ');
    // end action
    let endAction;
    if (ps.stopAction === 'turn_off') endAction = lang==='en'?'auto turn off':lang==='fr'?'extinction automatique':'spegnimento automatico';
    else if (ps.stopAction === 'turn_on') endAction = lang==='en'?'auto turn on':lang==='fr'?'allumage automatique':'accensione automatica';
    else if (ps.stopAction === 'set_temperature') endAction = lang==='en'?`set ${ps.stopValue}°C`:lang==='fr'?`régler ${ps.stopValue}°C`:`imposta ${ps.stopValue}°C`;
    else endAction = lang==='en'?'no action':lang==='fr'?'aucune action':'nessuna azione';
    // condition line
    let condLine = '';
    const validConds = (ps.conditions || []).filter(c => c.entity && c.value);
    if (validConds.length) {
      const condTxt = validConds.map(c => `${c.entity} ${c.operator} ${c.value}`).join(ps.condCombinator === 'or' ? ' OR ' : ' AND ');
      const condLbl = lang==='en'?'Conditions':lang==='fr'?'Conditions':'Condizioni';
      const recheckLbl = lang==='en'?`Recheck every ${ps.condInterval} min`:lang==='fr'?`Revérification chaque ${ps.condInterval} min`:`Controllo ogni ${ps.condInterval} min`;
      condLine = `\n🔍 ${condLbl}: ${condTxt}\n🔄 ${recheckLbl}`;
    }
    const daysLbl = `📅 ${daysText}`;
    const endLbl = lang==='en'?`🔚 At end: ${endAction}`:lang==='fr'?`🔚 À la fin: ${endAction}`:`🔚 Alla fine: ${endAction}`;
    let firstLine;
    if (kind === 'end') {
      // End-of-slot message: schedule completed, optionally mentions auto-action
      const endedLbl = lang==='en'?'schedule completed':lang==='fr'?'planification terminée':'schedule completato';
      firstLine = `⏹️ ${entityName} — ${endedLbl}`;
      const wasFromTo = lang==='en'?`Was active ${startTime}–${endTime}`:lang==='fr'?`Était actif ${startTime}–${endTime}`:`Era attivo ${startTime}–${endTime}`;
      return `${firstLine}\n⏰ ${wasFromTo}\n${daysLbl}\n${endLbl}`;
    }
    // Start message (default)
    if (ps.domain === 'climate') {
      if (ps.enableTemp) {
        const setLbl = lang==='en'?'set to':lang==='fr'?'réglé à':'impostato a';
        firstLine = `🌡️ ${entityName} ${setLbl} ${ps.temp}°C`;
      } else if (ps.enableHvac && ps.hvacMode) {
        firstLine = `❄️ ${entityName}: ${ps.hvacMode}`;
      } else {
        firstLine = `🌡️ ${entityName}`;
      }
    } else if (ps.domain === 'light') {
      const stateLbl = ps.turnOn ? onLbl : offLbl;
      let bLine = '';
      if (ps.turnOn && ps.enableBrightness) {
        const brLbl = lang==='en'?'brightness':lang==='fr'?'luminosité':'luminosità';
        bLine = ` (${brLbl} ${ps.brightness}%)`;
      }
      firstLine = `💡 ${entityName} ${stateLbl}${bLine}`;
    } else {
      firstLine = `🔌 ${entityName} ${ps.turnOn ? onLbl : offLbl}`;
    }
    return `${firstLine}\n⏰ ${fromTo}\n${daysLbl}${condLine}\n${endLbl}`;
  }

  // Compact, human-readable schedule name for the "name" field default.
  // Pattern: "<Entity> <Action> <Time> [<Days>]" — max ~40 chars.
  _buildDefaultScheduleName(ps) {
    if (!ps) return '';
    const lang = this._lang || 'en';
    const ec = ps.entityConf || {};
    let entName = ec.name || this._hass?.states?.[ec.entity]?.attributes?.friendly_name || ec.entity || '';
    if (entName.length > 12) entName = entName.slice(0, 11) + '…';
    // Action descriptor
    let act = '';
    if (ps.domain === 'climate') {
      if (ps.enableTemp) act = `${ps.temp}°`;
      else if (ps.enableHvac && ps.hvacMode) act = ps.hvacMode;
      else if (ps.enablePreset && ps.presetMode) act = ps.presetMode;
      else if (ps.enableFan && ps.fanMode) act = ps.fanMode;
    } else if (ps.domain === 'light') {
      if (ps.turnOn) act = ps.enableBrightness ? `${ps.brightness}%` : 'On';
      else act = 'Off';
    } else {
      act = ps.turnOn ? 'On' : 'Off';
    }
    // Time
    const allDay = ps.startMin === 0 && ps.endMin === 1440;
    let timeStr;
    if (allDay) {
      timeStr = lang==='it'?'tutto-gg':lang==='fr'?'tt-jour':'all-day';
    } else {
      const sM = ps.startMin % 60, eM = ps.endMin % 60;
      if (sM === 0 && eM === 0) {
        const sH = ps.startMin / 60, eH = ps.endMin === 1440 ? 24 : ps.endMin / 60;
        timeStr = `${String(sH).padStart(2,'0')}-${String(eH).padStart(2,'0')}`;
      } else {
        timeStr = `${this._minutesToTime(ps.startMin)}-${this._minutesToTime(ps.endMin===1440?0:ps.endMin)}`;
      }
    }
    // Days
    const ds = [...(ps.days || [])].sort((a,b)=>a-b);
    let daysStr = '';
    if (ds.length === 7 || ds.length === 0) daysStr = '';
    else if (ds.length === 5 && ds.every((v,i)=>v===i)) daysStr = lang==='it'?'fer':lang==='fr'?'jo':'wd';
    else if (ds.length === 2 && ds[0]===5 && ds[1]===6) daysStr = 'we';
    else if (ds.length <= 3) daysStr = ds.map(i => (this.t(`days.${this._getDayKey(i)}`)||'').slice(0,3)).join(',');
    return [entName, act, timeStr, daysStr].filter(Boolean).join(' ').slice(0, 40);
  }

  _refreshNameDefault(dlg) {
    const ps = this._popupState;
    if (!ps) return;
    // Only auto-update in create mode and when user hasn't customized the name
    if (ps.mode !== 'create') return;
    const newDef = this._buildDefaultScheduleName(ps);
    const wasAuto = !ps.name || ps.name === ps._defaultName;
    if (wasAuto) ps.name = newDef;
    ps._defaultName = newDef;
    const inp = dlg?.querySelector('.name-input');
    if (inp && wasAuto && document.activeElement !== inp && inp.shadowRoot?.activeElement !== inp) {
      // Don't overwrite while user is typing
      const ae = dlg.getRootNode()?.activeElement;
      if (ae !== inp) inp.value = newDef;
    }
  }

  _refreshNotifyDefault(dlg) {
    const ps = this._popupState;
    if (!ps) return;
    // Start message
    const newDefStart = this._buildDefaultNotifyMessage(ps, 'start');
    const wasAutoStart = !ps.notifyMessage || ps.notifyMessage === ps._defaultNotifyMsg;
    if (wasAutoStart) ps.notifyMessage = newDefStart;
    ps._defaultNotifyMsg = newDefStart;
    const inpStart = dlg?.querySelector('.notif-msg');
    if (inpStart && wasAutoStart) inpStart.value = newDefStart;
    const restoreStart = dlg?.querySelector('.notif-restore');
    if (restoreStart) restoreStart.style.display = (ps.notifyMessage !== newDefStart && ps.notifyMessage !== '') ? '' : 'none';
    // End message
    const newDefEnd = this._buildDefaultNotifyMessage(ps, 'end');
    const wasAutoEnd = !ps.notifyMessageEnd || ps.notifyMessageEnd === ps._defaultNotifyMsgEnd;
    if (wasAutoEnd) ps.notifyMessageEnd = newDefEnd;
    ps._defaultNotifyMsgEnd = newDefEnd;
    const inpEnd = dlg?.querySelector('.notif-msg-end');
    if (inpEnd && wasAutoEnd) inpEnd.value = newDefEnd;
    const restoreEnd = dlg?.querySelector('.notif-restore-end');
    if (restoreEnd) restoreEnd.style.display = (ps.notifyMessageEnd !== newDefEnd && ps.notifyMessageEnd !== '') ? '' : 'none';
  }

  // ── Condition automation ──────────────────────────────────────────────────

  _getCondFieldSpec(entityId, attribute) {
    const NUMERIC_OPS = ['>', '<', '>=', '<=', '==', '!='];
    const EQ_OPS = ['==', '!='];
    const TEXT_OPS = ['==', '!='];
    const fallback = { kind: 'text', operators: NUMERIC_OPS };
    if (!entityId) return fallback;
    const s = this._hass?.states?.[entityId];
    if (!s) return fallback;
    const domain = entityId.split('.')[0];
    const attrs = s.attributes || {};
    const unit = attrs.unit_of_measurement || '';
    // climate with attribute picker
    if (domain === 'climate') {
      // Default to a list of common climate attributes that make sense in conditions
      const climateAttrs = ['temperature', 'current_temperature', 'target_temp_low', 'target_temp_high', 'hvac_action', 'hvac_mode', 'preset_mode', 'fan_mode'];
      if (!attribute) {
        return { kind: 'climate-picker', climateAttrs, operators: NUMERIC_OPS };
      }
      // numeric attributes
      if (['temperature','current_temperature','target_temp_low','target_temp_high'].includes(attribute)) {
        return { kind: 'numeric', operators: NUMERIC_OPS, unit: '°C', step: 0.5, climateAttrs, attribute };
      }
      // categorical attributes
      if (attribute === 'hvac_mode') return { kind: 'select', operators: EQ_OPS, options: attrs.hvac_modes || ['heat','cool','heat_cool','auto','dry','fan_only','off'], climateAttrs, attribute };
      if (attribute === 'hvac_action') return { kind: 'select', operators: EQ_OPS, options: ['heating','cooling','idle','off','drying','fan'], climateAttrs, attribute };
      if (attribute === 'preset_mode') return { kind: 'select', operators: EQ_OPS, options: attrs.preset_modes || [], climateAttrs, attribute };
      if (attribute === 'fan_mode') return { kind: 'select', operators: EQ_OPS, options: attrs.fan_modes || [], climateAttrs, attribute };
      return { kind: 'text', operators: TEXT_OPS, climateAttrs, attribute };
    }
    // boolean-like
    if (domain === 'input_boolean' || domain === 'binary_sensor') {
      return { kind: 'boolean', operators: EQ_OPS, options: ['on', 'off'] };
    }
    // dropdown
    if (domain === 'input_select') {
      return { kind: 'select', operators: EQ_OPS, options: attrs.options || [] };
    }
    // numeric input
    if (domain === 'input_number' || domain === 'number' || domain === 'counter') {
      return {
        kind: 'numeric', operators: NUMERIC_OPS,
        unit, step: attrs.step || 1, min: attrs.min, max: attrs.max,
      };
    }
    // sensor: check if numeric by device_class or unit
    if (domain === 'sensor') {
      const numericClasses = ['temperature','humidity','illuminance','battery','power','energy','pressure','voltage','current','frequency','signal_strength','co2','carbon_monoxide','carbon_dioxide','pm1','pm10','pm25','speed','distance','aqi','volume'];
      if (numericClasses.includes(attrs.device_class) || unit || !isNaN(parseFloat(s.state))) {
        return { kind: 'numeric', operators: NUMERIC_OPS, unit, step: 0.1 };
      }
      return { kind: 'text', operators: TEXT_OPS };
    }
    // weather: state is descriptive text (sunny, cloudy...)
    if (domain === 'weather') {
      return { kind: 'select', operators: EQ_OPS, options: ['clear-night','cloudy','exceptional','fog','hail','lightning','lightning-rainy','partlycloudy','pouring','rainy','snowy','snowy-rainy','sunny','windy','windy-variant'] };
    }
    return fallback;
  }

  // Runtime evaluation: check if a stored condition is satisfied against current hass.states
  _evalCondition(c) {
    if (!c?.entity) return false;
    const s = this._hass?.states?.[c.entity]; if (!s) return false;
    const raw = c.attribute ? s.attributes?.[c.attribute] : s.state;
    if (raw === null || raw === undefined) return false;
    const v = String(raw);
    const tv = String(c.value);
    switch (c.operator) {
      case '==': return v === tv;
      case '!=': return v !== tv;
      case '>':  return parseFloat(v) >  parseFloat(tv);
      case '<':  return parseFloat(v) <  parseFloat(tv);
      case '>=': return parseFloat(v) >= parseFloat(tv);
      case '<=': return parseFloat(v) <= parseFloat(tv);
    }
    return false;
  }

  _evalAllConditions(scheduleId) {
    const { conditions, condCombinator } = this._getStoredConditions(scheduleId);
    if (!conditions?.length) return { hasCond: false, satisfied: true };
    const valid = conditions.filter(c => c.entity && c.value !== '' && c.value != null);
    if (!valid.length) return { hasCond: false, satisfied: true };
    const results = valid.map(c => this._evalCondition(c));
    const satisfied = condCombinator === 'or' ? results.some(Boolean) : results.every(Boolean);
    return { hasCond: true, satisfied };
  }

  _buildHACondition(c) {
    const numOps = ['>', '<', '>=', '<='];
    if (numOps.includes(c.operator)) {
      const cond = { condition: 'numeric_state', entity_id: c.entity };
      if (c.attribute) cond.attribute = c.attribute;
      const v = parseFloat(c.value);
      if (c.operator === '>')  cond.above = v;
      if (c.operator === '<')  cond.below = v;
      if (c.operator === '>=') cond.above = v - 0.001;
      if (c.operator === '<=') cond.below = v + 0.001;
      return cond;
    } else {
      const cond = { condition: 'state', entity_id: c.entity, state: c.value };
      if (c.attribute) cond.attribute = c.attribute;
      if (c.operator === '!=') return { condition: 'not', conditions: [cond] };
      return cond;
    }
  }

  // Build HA service actions array for schedule's PRIMARY (active) action set.
  // Used both by scheduler timeslot actions AND condition automation activeAction.
  _buildScheduleActions(ps) {
    const eid = ps.entityConf.entity;
    const dom = ps.domain;
    const out = [];
    if (dom === 'climate') {
      if (ps.enableTemp) out.push({ service: 'climate.set_temperature', target: { entity_id: eid }, data: { temperature: ps.temp } });
      if (ps.enableHvac && ps.hvacMode) out.push({ service: 'climate.set_hvac_mode', target: { entity_id: eid }, data: { hvac_mode: ps.hvacMode } });
      if (ps.enablePreset && ps.presetMode) out.push({ service: 'climate.set_preset_mode', target: { entity_id: eid }, data: { preset_mode: ps.presetMode } });
      if (ps.enableFan && ps.fanMode) out.push({ service: 'climate.set_fan_mode', target: { entity_id: eid }, data: { fan_mode: ps.fanMode } });
      if (ps.enableSwing && ps.swingMode) out.push({ service: 'climate.set_swing_mode', target: { entity_id: eid }, data: { swing_mode: ps.swingMode } });
      if (!out.length) out.push({ service: 'climate.turn_on', target: { entity_id: eid } });
    } else if (dom === 'light') {
      if (ps.turnOn) {
        const data = {};
        if (ps.enableBrightness) data.brightness_pct = ps.brightness;
        if (ps.enableColor && ps.color) data.rgb_color = this._hexToRgb(ps.color);
        out.push({ service: 'light.turn_on', target: { entity_id: eid }, data });
      } else {
        out.push({ service: 'light.turn_off', target: { entity_id: eid } });
      }
    } else if (dom === 'fan') {
      if (ps.turnOn) {
        const data = ps.enableSpeed ? { percentage: ps.speed } : {};
        out.push({ service: 'fan.turn_on', target: { entity_id: eid }, data });
      } else {
        out.push({ service: 'fan.turn_off', target: { entity_id: eid } });
      }
    } else if (dom === 'cover') {
      if (ps.enablePosition) {
        out.push({ service: 'cover.set_cover_position', target: { entity_id: eid }, data: { position: ps.position } });
      } else {
        const map = { open: 'open_cover', close: 'close_cover', stop: 'stop_cover' };
        out.push({ service: `cover.${map[ps.coverAction] || 'close_cover'}`, target: { entity_id: eid } });
      }
    } else {
      out.push({ service: ps.turnOn ? `${dom}.turn_on` : `${dom}.turn_off`, target: { entity_id: eid } });
    }
    return out;
  }

  // Build HA service actions array for the end-of-slot (auto-off) / inactive action.
  // Uses ps.stopAction (type) + ps.stopValue (value). Returns null if no action.
  _buildStopActions(ps) {
    const t = ps.stopAction;
    if (!t) return null;
    const eid = ps.entityConf.entity;
    const dom = ps.domain;
    const v = ps.stopValue;
    const tgt = { entity_id: eid };
    switch (t) {
      case 'turn_on':       return [{ service: `${dom}.turn_on`, target: tgt }];
      case 'turn_off':      return [{ service: `${dom}.turn_off`, target: tgt }];
      case 'set_temperature': return [{ service: 'climate.set_temperature', target: tgt, data: { temperature: parseFloat(v) } }];
      case 'set_hvac_mode': return [{ service: 'climate.set_hvac_mode', target: tgt, data: { hvac_mode: v } }];
      case 'set_preset_mode': return [{ service: 'climate.set_preset_mode', target: tgt, data: { preset_mode: v } }];
      case 'set_fan_mode':  return [{ service: 'climate.set_fan_mode', target: tgt, data: { fan_mode: v } }];
      case 'set_swing_mode': return [{ service: 'climate.set_swing_mode', target: tgt, data: { swing_mode: v } }];
      case 'set_brightness': return [{ service: 'light.turn_on', target: tgt, data: { brightness_pct: parseInt(v) } }];
      case 'set_color':     return [{ service: 'light.turn_on', target: tgt, data: { rgb_color: this._hexToRgb(v) } }];
      case 'set_color_temp': return [{ service: 'light.turn_on', target: tgt, data: { color_temp_kelvin: parseInt(v) } }];
      case 'set_speed':     return [{ service: 'fan.set_percentage', target: tgt, data: { percentage: parseInt(v) } }];
      case 'set_position':  return [{ service: 'cover.set_cover_position', target: tgt, data: { position: parseInt(v) } }];
      case 'open':          return [{ service: 'cover.open_cover', target: tgt }];
      case 'close':         return [{ service: 'cover.close_cover', target: tgt }];
      case 'stop':          return [{ service: 'cover.stop_cover', target: tgt }];
    }
    return null;
  }

  _hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ''));
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
  }
  _rgbToHex(rgb) {
    if (!Array.isArray(rgb)) return '#FFFFFF';
    return '#' + rgb.slice(0, 3).map(x => Math.max(0, Math.min(255, x | 0)).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  // ── End-of-slot action: capability detection + UI ─────────────────────────

  _entityCaps(entityId) {
    const a = this._hass?.states?.[entityId]?.attributes || {};
    const cm = a.supported_color_modes || [];
    const sf = a.supported_features || 0;
    return {
      lightBrightness: cm.some(m => m !== 'onoff'),
      lightRgb: cm.some(m => ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'].includes(m)),
      lightColorTemp: cm.includes('color_temp'),
      fanSpeed: ('percentage' in a) || (sf & 1) === 1,
      coverPosition: ('current_position' in a) || (sf & 4) === 4,
      hvacModes: a.hvac_modes || [],
      presetModes: a.preset_modes || [],
      fanModes: a.fan_modes || [],
      swingModes: a.swing_modes || [],
    };
  }

  _endActionTypes(entityId) {
    const dom = this._detectDomain(entityId);
    const c = this._entityCaps(entityId);
    const out = [{ v: '', label: this.t('popup.none') }];
    const onoff = () => { out.push({ v: 'turn_off', label: this.t('popup.turn_off') }); out.push({ v: 'turn_on', label: this.t('popup.turn_on') }); };
    if (dom === 'climate') {
      onoff();
      out.push({ v: 'set_temperature', label: this.t('popup.set_temp') });
      if (c.hvacModes.length) out.push({ v: 'set_hvac_mode', label: this.t('popup.hvac_mode') });
      if (c.presetModes.length) out.push({ v: 'set_preset_mode', label: this.t('popup.preset_mode') });
      if (c.fanModes.length) out.push({ v: 'set_fan_mode', label: this.t('popup.fan_mode') });
      if (c.swingModes.length) out.push({ v: 'set_swing_mode', label: this.t('popup.swing_mode') });
    } else if (dom === 'light') {
      onoff();
      if (c.lightBrightness) out.push({ v: 'set_brightness', label: this.t('endact.brightness') });
      if (c.lightRgb) out.push({ v: 'set_color', label: this.t('endact.color') });
      if (c.lightColorTemp) out.push({ v: 'set_color_temp', label: this.t('endact.color_temp') });
    } else if (dom === 'fan') {
      onoff();
      if (c.fanSpeed) out.push({ v: 'set_speed', label: this.t('endact.speed') });
    } else if (dom === 'cover') {
      out.push({ v: 'close', label: this.t('endact.close') });
      out.push({ v: 'open', label: this.t('endact.open') });
      out.push({ v: 'stop', label: this.t('endact.stop') });
      if (c.coverPosition) out.push({ v: 'set_position', label: this.t('endact.position') });
    } else {
      onoff();
    }
    return out;
  }

  _endActionDefault(type, entityId) {
    const a = this._hass?.states?.[entityId]?.attributes || {};
    switch (type) {
      case 'set_temperature': return 18;
      case 'set_brightness':
      case 'set_speed':
      case 'set_position': return 50;
      case 'set_color': return '#FFFFFF';
      case 'set_color_temp': return Math.round(((a.min_color_temp_kelvin || 2200) + (a.max_color_temp_kelvin || 6500)) / 2);
      case 'set_hvac_mode': return (a.hvac_modes || [])[0] || '';
      case 'set_preset_mode': return (a.preset_modes || [])[0] || '';
      case 'set_fan_mode': return (a.fan_modes || [])[0] || '';
      case 'set_swing_mode': return (a.swing_modes || [])[0] || '';
      default: return null;
    }
  }

  _endActionValueHtml(ps) {
    const t = ps.stopAction, v = ps.stopValue, eid = ps.entityConf.entity;
    const a = this._hass?.states?.[eid]?.attributes || {};
    if (t === 'set_temperature')
      return `<div class="end-act-val param-inline"><input type="number" class="end-val-num temp-inp" min="5" max="35" step="0.5" value="${v}"><span style="font-size:.8em;color:var(--secondary-text-color)">°C</span></div>`;
    if (t === 'set_brightness' || t === 'set_speed' || t === 'set_position')
      return `<div class="end-act-val param-inline"><span class="end-val-pct" style="min-width:40px;text-align:right;font-weight:700">${v}%</span><input type="range" class="end-val-range" min="0" max="100" step="1" value="${v}"></div>`;
    if (t === 'set_color')
      return `<div class="end-act-val">${this._colorPickerHTML(v || '#FFFFFF')}</div>`;
    if (t === 'set_color_temp') {
      const mn = a.min_color_temp_kelvin || 2000, mx = a.max_color_temp_kelvin || 6500;
      return `<div class="end-act-val param-inline"><input type="number" class="end-val-num" min="${mn}" max="${mx}" step="50" value="${v}"><span style="font-size:.8em;color:var(--secondary-text-color)">K</span></div>`;
    }
    if (t === 'set_hvac_mode' || t === 'set_preset_mode' || t === 'set_fan_mode' || t === 'set_swing_mode') {
      const lists = { set_hvac_mode: a.hvac_modes, set_preset_mode: a.preset_modes, set_fan_mode: a.fan_modes, set_swing_mode: a.swing_modes };
      const opts = (lists[t] || []).map(m => `<option value="${m}" ${v === m ? 'selected' : ''}>${m}</option>`).join('');
      return `<div class="end-act-val"><select class="end-val-sel param-select">${opts}</select></div>`;
    }
    return '';
  }

  _endActionHtml(ps) {
    const types = this._endActionTypes(ps.entityConf.entity);
    const cur = ps.stopAction || '';
    const sel = `<select class="end-act-type param-select">${types.map(o => `<option value="${o.v}" ${cur === o.v ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
    return `<div>
        <div class="section-label">${this.t('popup.auto_off')}</div>
        <div class="param-inline" style="gap:10px;align-items:center;flex-wrap:wrap">${sel}${this._endActionValueHtml(ps)}</div>
      </div>`;
  }

  // Delete the existing automation (best-effort) then POST a fresh one.
  // Ensures every save rewrites a clean automation (no stale/merged content).
  async _recreateAutomation(targetId, config) {
    try { await this._hass.callApi('DELETE', `config/automation/config/${targetId}`); } catch {}
    await this._hass.callApi('POST', `config/automation/config/${targetId}`, config);
  }

  async _syncConditionAutomation(scheduleEntityId, conditions, condCombinator, condInterval=15, ps=null) {
    const existingId = this._getCondAutoId(scheduleEntityId);
    const numericOps = ['>', '<', '>=', '<='];
    const allConds = conditions || [];
    const validConds = allConds.filter(c => {
      if (!c.entity || !c.operator) return false;
      if (c.value === '' || c.value == null) return false;
      // Numeric operators require a parseable number
      if (numericOps.includes(c.operator) && isNaN(parseFloat(c.value))) return false;
      return true;
    });
    // No conditions provided at all → cleanup (user removed them)
    if (allConds.length === 0) {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC condAuto delete failed', e); }
      }
      await this._clearCondData(scheduleEntityId);
      return;
    }
    // Some conditions exist but ALL are invalid → keep them in storage so user can re-edit, but don't create automation
    if (!validConds.length) {
      console.warn('[WSC] All conditions are invalid (missing value or non-numeric). Storage preserved, no automation created.');
      await this._saveCondData(scheduleEntityId, existingId, allConds, condCombinator, condInterval);
      return;
    }
    // Persist conditions to storage FIRST — survives even if HA automation fails
    await this._saveCondData(scheduleEntityId, null, validConds, condCombinator, condInterval);
    // Deterministic automation ID (REST endpoint requires a non-empty object_id)
    const targetId = existingId || `wsc_cond_${scheduleEntityId.replace('switch.', '')}`;
    const haConds = validConds.map(c => this._buildHACondition(c));
    const condBlock = haConds.length === 1 ? haConds[0] : { condition: condCombinator === 'or' ? 'or' : 'and', conditions: haConds };
    // Build active/inactive actions on the TARGET entity (not on schedule switch)
    const activeActions = ps ? this._buildScheduleActions(ps) : null;
    const inactiveActions = ps ? this._buildStopActions(ps) : null;
    const notMet = { condition: 'not', conditions: [condBlock] };
    // Manual-override mode: only when enabled AND there is a target action to gate.
    const overrideOn = !!(ps && ps.overrideEnabled && activeActions);
    const flagEnt = this._overrideFlagEntityId(scheduleEntityId);
    // Triggers: schedule turn_on + slot start/end (id 'slot') + periodic + condition entities (id 'eval').
    const triggers = [
      { platform: 'state', entity_id: scheduleEntityId, to: 'on', id: 'slot' },
      { platform: 'state', entity_id: scheduleEntityId, attribute: 'current_slot', id: 'slot' },
      { platform: 'time_pattern', minutes: `/${condInterval}`, id: 'eval' },
    ];
    const condEntityIds = [...new Set(validConds.map(c => c.entity).filter(Boolean))];
    for (const ce of condEntityIds) triggers.push({ platform: 'state', entity_id: ce, id: 'eval' });

    let action, mode, topInSlot = true;
    if (overrideOn) {
      // Watch the TARGET entity for manual changes.
      triggers.push({ platform: 'state', entity_id: ps.entityConf.entity, id: 'manual' });
      const inSlotTpl = { condition: 'template', value_template: `{{ state_attr('${scheduleEntityId}', 'current_slot') != None }}` };
      const noOverrideTpl = { condition: 'template', value_template: `{{ states('${flagEnt}') != 'off' }}` };
      // ATTIVA gated on flag (gateActive), SAFETY (not-met → inactive) always.
      const applyByCond = (gateActive) => {
        const branches = [];
        if (inactiveActions) branches.push({ conditions: [notMet], sequence: inactiveActions });
        branches.push({ conditions: gateActive ? [condBlock, noOverrideTpl] : [condBlock], sequence: activeActions });
        return { choose: branches };
      };
      action = [{
        choose: [
          // 1) manual change of target entity → activate override flag (suspend ATTIVA re-apply)
          {
            conditions: [
              { condition: 'trigger', id: 'manual' },
              inSlotTpl,
              { condition: 'template', value_template: `{{ trigger.platform == 'state' and trigger.to_state is not none and trigger.to_state.context.parent_id is none and (now() - states['${scheduleEntityId}'].last_changed).total_seconds() > 5 }}` },
              noOverrideTpl,
            ],
            sequence: [{ service: 'automation.turn_off', target: { entity_id: flagEnt } }],
          },
          // 1b) target changed but machine-caused (our own apply / scheduler) → ignore,
          //     so it does NOT fall through to the eval re-apply below.
          {
            conditions: [{ condition: 'trigger', id: 'manual' }],
            sequence: [],
          },
          // 2) slot transition → reset override flag + (re)apply for the (new) slot
          {
            conditions: [{ condition: 'trigger', id: 'slot' }],
            sequence: [
              { service: 'automation.turn_on', target: { entity_id: flagEnt } },
              { if: [inSlotTpl], then: [applyByCond(false)] },
            ],
          },
        ],
        // 3) eval (periodic / condition change): SAFETY always, ATTIVA only if no override
        default: [{ if: [inSlotTpl], then: [applyByCond(true)] }],
      }];
      mode = 'queued';
      topInSlot = false; // reset branch must also run when current_slot becomes None (slot end)
    } else {
      // Original behaviour (no override). active+inactive → choose/default; active-only → met→active.
      let actionBlock;
      if (activeActions && inactiveActions) {
        actionBlock = { choose: [{ conditions: [notMet], sequence: inactiveActions }], default: activeActions };
      } else if (activeActions) {
        actionBlock = { choose: [{ conditions: [condBlock], sequence: activeActions }] };
      } else {
        // Fallback (no ps): old behaviour — toggle schedule switch
        actionBlock = {
          choose: [{ conditions: [notMet], sequence: [{ service: 'switch.turn_off', target: { entity_id: scheduleEntityId } }] }],
          default: [{ service: 'switch.turn_on', target: { entity_id: scheduleEntityId } }],
        };
      }
      action = [actionBlock];
      mode = 'single';
    }

    const condList = [
      { condition: 'not', conditions: [{ condition: 'state', entity_id: scheduleEntityId, state: 'off' }] },
    ];
    if (topInSlot) condList.push({ condition: 'template', value_template: `{{ state_attr('${scheduleEntityId}', 'current_slot') != None }}` });

    const automationConfig = {
      alias: `WSC Conditions - ${scheduleEntityId}`,
      description: 'Auto-generated by Weekly Schedule Card',
      trigger: triggers,
      condition: condList,
      action,
      mode,
    };
    try {
      await this._recreateAutomation(targetId, automationConfig);
      await this._saveCondData(scheduleEntityId, targetId, validConds, condCombinator, condInterval);
    } catch (e) {
      console.error('WSC condAuto save failed', e);
    }
  }

  // Trigger-less marker automation that holds the manual-override flag.
  // Only for conditional schedules with override enabled. state 'on' = no override,
  // 'off' = override active. initial_state:true → override resets at every HA restart.
  // Must be called AFTER _syncConditionAutomation (depends on condAutoId existing).
  async _syncOverrideFlag(scheduleEntityId, ps) {
    const existingId = this._getOverrideFlagId(scheduleEntityId);
    const enabled = !!(ps && ps.overrideEnabled) && !!this._getCondAutoId(scheduleEntityId);
    if (!enabled) {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC overrideFlag delete failed', e); }
      }
      await this._saveOverrideData(scheduleEntityId, !!(ps && ps.overrideEnabled), null);
      return;
    }
    const targetId = existingId || `wsc_ovrflag_${scheduleEntityId.replace('switch.', '')}`;
    const automationConfig = {
      alias: `WSC Override flag - ${scheduleEntityId}`,
      description: 'Auto-generated by Weekly Schedule Card (manual-override flag: on = no override, off = override active)',
      trigger: [{ platform: 'template', value_template: '{{ false }}' }],
      action: [],
      mode: 'single',
      initial_state: true,
    };
    try {
      await this._recreateAutomation(targetId, automationConfig);
      await this._saveOverrideData(scheduleEntityId, true, targetId);
    } catch (e) {
      console.error('WSC overrideFlag save failed', e);
    }
  }

  // Snapshot of preset/fan/swing/hvac from popup state → storage (so we can re-populate UI at reload).
  async _persistExtras(scheduleEntityId, ps) {
    const extras = {};
    if (ps.enableHvac && ps.hvacMode) extras.hvacMode = ps.hvacMode;
    if (ps.enablePreset && ps.presetMode) extras.presetMode = ps.presetMode;
    if (ps.enableFan && ps.fanMode) extras.fanMode = ps.fanMode;
    if (ps.enableSwing && ps.swingMode) extras.swingMode = ps.swingMode;
    const hasAny = Object.keys(extras).length > 0;
    await this._saveExtras(scheduleEntityId, hasAny ? extras : null, undefined);
  }

  // Sync HA automation that applies extras (preset/fan/swing/hvac) at slot start.
  // Skipped if condition automation exists for same schedule (extras already in activeActions).
  async _syncExtrasAutomation(scheduleEntityId, ps) {
    const existingId = this._getExtrasAutoId(scheduleEntityId);
    // If condition automation exists, it handles extras → ensure no orphan extras auto
    if (this._getCondAutoId(scheduleEntityId)) {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC extrasAuto delete failed', e); }
        await this._saveExtras(scheduleEntityId, null, null);
      }
      return;
    }
    const hasExtras = (ps.enableHvac && ps.hvacMode) || (ps.enablePreset && ps.presetMode) || (ps.enableFan && ps.fanMode) || (ps.enableSwing && ps.swingMode);
    if (!hasExtras) {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC extrasAuto delete failed', e); }
        await this._saveExtras(scheduleEntityId, null, null);
      }
      return;
    }
    const allActions = this._buildScheduleActions(ps);
    // Skip set_temperature (already in scheduler timeslot) — keep only secondary services
    const extraActions = allActions.filter(a => !a.service.endsWith('set_temperature') && !a.service.endsWith('turn_on') && !a.service.endsWith('turn_off'));
    if (!extraActions.length) {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch {}
        await this._saveExtras(scheduleEntityId, null, null);
      }
      return;
    }
    const targetId = existingId || `wsc_extras_${scheduleEntityId.replace('switch.', '')}`;
    const automationConfig = {
      alias: `WSC Extras - ${scheduleEntityId}`,
      description: 'Auto-generated by Weekly Schedule Card',
      trigger: [
        { platform: 'state', entity_id: scheduleEntityId, attribute: 'current_slot' },
      ],
      condition: [
        { condition: 'not', conditions: [{ condition: 'state', entity_id: scheduleEntityId, state: 'off' }] },
        { condition: 'template', value_template: `{{ state_attr('${scheduleEntityId}', 'current_slot') != None }}` },
      ],
      action: extraActions,
      mode: 'single',
    };
    try {
      await this._recreateAutomation(targetId, automationConfig);
      // Persist automation id (keep existing extras, just update id)
      const currentExtras = this._getExtras(scheduleEntityId);
      await this._saveExtras(scheduleEntityId, currentExtras, targetId);
    } catch (e) {
      console.error('WSC extrasAuto save failed', e);
    }
  }

  // ── Notify automation (server-side, works with HA frontend closed) ────────

  async _syncNotifyAutomation(scheduleEntityId, ps) {
    const existingId = this._getNotifyAutoId(scheduleEntityId);
    const svc = ps.notifyService;
    const trig = ps.notifyTrigger || 'start';
    const cleanup = async () => {
      if (existingId) {
        try { await this._hass.callApi('DELETE', `config/automation/config/${existingId}`); } catch (e) { console.error('WSC notifyAuto delete failed', e); }
        await this._saveNotifyAutoId(scheduleEntityId, null);
      }
    };
    if (!svc || svc.split('.').length < 2 || trig === 'none') { await cleanup(); return; }
    const title = this.t('card.title');
    const startMsg = ps.notifyMessage || this.t('notify.default_start');
    const endMsg = ps.notifyMessageEnd || ps.notifyMessage || this.t('notify.default_end');
    const notifyAction = (msg) => ({ service: svc, data: { title, message: msg } });
    // Single attribute-change trigger; distinguish start/end via from/to + a
    // default(none) filter (handles current_slot being absent OR null). Fires on
    // every current_slot change → no initial-state arming issue (the bug where the
    // start notification didn't fire while end did).
    const startedTpl = `{{ (trigger.to_state.attributes.current_slot | default(none)) is not none and (trigger.from_state.attributes.current_slot | default(none)) is none }}`;
    const endedTpl = `{{ (trigger.to_state.attributes.current_slot | default(none)) is none and (trigger.from_state.attributes.current_slot | default(none)) is not none }}`;
    const choose = [];
    if (trig === 'start' || trig === 'both')
      choose.push({ conditions: [{ condition: 'template', value_template: startedTpl }], sequence: [notifyAction(startMsg)] });
    if (trig === 'end' || trig === 'both')
      choose.push({ conditions: [{ condition: 'template', value_template: endedTpl }], sequence: [notifyAction(endMsg)] });
    if (!choose.length) { await cleanup(); return; }
    const targetId = existingId || `wsc_notify_${scheduleEntityId.replace('switch.', '')}`;
    const automationConfig = {
      alias: `WSC Notify - ${scheduleEntityId}`,
      description: 'Auto-generated by Weekly Schedule Card',
      trigger: [{ platform: 'state', entity_id: scheduleEntityId, attribute: 'current_slot' }],
      condition: [{ condition: 'not', conditions: [{ condition: 'state', entity_id: scheduleEntityId, state: 'off' }] }],
      action: [{ choose }],
      mode: 'queued',
    };
    try {
      await this._recreateAutomation(targetId, automationConfig);
      await this._saveNotifyAutoId(scheduleEntityId, targetId);
    } catch (e) {
      console.error('WSC notifyAuto save failed', e);
    }
  }

  // ── Linked objects panel (diagnostics in the edit popup) ──────────────────

  _linkedObjectsHtml(ps) {
    const eid = ps?.entityId;
    if (!eid) return '';
    const states = this._hass?.states || {};
    const findAuto = (cfgId) => cfgId ? Object.values(states).find(s => s.entity_id.startsWith('automation.') && s.attributes?.id === cfgId) : null;
    const rows = [];
    const autoOffId = this._getAutoOffAutoId(eid);
    if (autoOffId) {
      const ent = findAuto(autoOffId);
      rows.push(this._linkRow('mdi:timer-off-outline', this.t('linked.auto_off'), ent ? ent.entity_id : autoOffId, ent ? ent.state : null,
        [ent ? { label: this.t('linked.open'), act: 'more-info', val: ent.entity_id } : null,
         { label: this.t('linked.edit_yaml'), act: 'edit-auto', val: autoOffId }]));
    } else {
      // Legacy child schedule (pre-migration)
      const childId = this._getAutoChildId(eid);
      if (childId) {
        const ent = states[childId];
        rows.push(this._linkRow('mdi:timer-off-outline', this.t('linked.auto_off') + ' (legacy)', childId, ent ? ent.state : null,
          ent ? [{ label: this.t('linked.open'), act: 'more-info', val: childId }] : []));
      }
    }
    const condId = this._getCondAutoId(eid);
    if (condId) {
      const ent = findAuto(condId);
      rows.push(this._linkRow('mdi:flash-outline', this.t('linked.cond_auto'), ent ? ent.entity_id : condId, ent ? ent.state : null,
        [ent ? { label: this.t('linked.open'), act: 'more-info', val: ent.entity_id } : null,
         { label: this.t('linked.edit_yaml'), act: 'edit-auto', val: condId }]));
    }
    const extrasId = this._getExtrasAutoId(eid);
    if (extrasId) {
      const ent = findAuto(extrasId);
      rows.push(this._linkRow('mdi:tune', this.t('linked.extras_auto'), ent ? ent.entity_id : extrasId, ent ? ent.state : null,
        [ent ? { label: this.t('linked.open'), act: 'more-info', val: ent.entity_id } : null,
         { label: this.t('linked.edit_yaml'), act: 'edit-auto', val: extrasId }]));
    }
    const notifyId = this._getNotifyAutoId(eid);
    if (notifyId) {
      const ent = findAuto(notifyId);
      rows.push(this._linkRow('mdi:bell-outline', this.t('linked.notify'), ent ? ent.entity_id : notifyId, ent ? ent.state : null,
        [ent ? { label: this.t('linked.open'), act: 'more-info', val: ent.entity_id } : null,
         { label: this.t('linked.edit_yaml'), act: 'edit-auto', val: notifyId }]));
    }
    // Manual-override flag (marker automation: state 'on' = no override, 'off' = override active)
    if (this._getOverrideEnabled(eid) && this._getOverrideFlagId(eid)) {
      const flagId = this._getOverrideFlagId(eid);
      const ent = findAuto(flagId);
      const active = !!ent && ent.state === 'off';
      const idText = ent ? ent.entity_id : flagId;
      const badge = !ent
        ? `<span class="lo-badge missing">${this.t('linked.missing')}</span>`
        : `<span class="lo-badge ${active ? 'off' : 'on'}">${active ? this.t('override.active') : this.t('override.inactive')}</span>`;
      const acts = [];
      if (active) acts.push(`<button class="lo-btn lo-btn-warn" data-act="cancel-override" data-val="${eid}">${this.t('override.cancel')}</button>`);
      if (ent) acts.push(`<button class="lo-btn" data-act="more-info" data-val="${ent.entity_id}">${this.t('linked.open')}</button>`);
      acts.push(`<button class="lo-btn" data-act="edit-auto" data-val="${flagId}">${this.t('linked.edit_yaml')}</button>`);
      rows.push(`<div class="lo-row">
        <ha-icon class="lo-ic" icon="mdi:hand-back-right-outline"></ha-icon>
        <div class="lo-meta"><span class="lo-name">${this.t('linked.override_flag')}</span><span class="lo-id">${String(idText).replace(/</g,'&lt;')}</span></div>
        ${badge}
        <div class="lo-acts">${acts.join('')}</div>
      </div>`);
    }
    if (!rows.length) return '';
    return `<div class="linked-section"><div class="linked-hdr">🔧 ${this.t('linked.title')}</div>${rows.join('')}</div>`;
  }

  _linkRow(icon, name, idText, state, actions) {
    const acts = (actions || []).filter(Boolean).map(a =>
      `<button class="lo-btn" data-act="${a.act}" data-val="${String(a.val).replace(/"/g, '&quot;')}">${a.label}</button>`).join('');
    const badge = state
      ? `<span class="lo-badge ${state === 'on' ? 'on' : 'off'}">${state}</span>`
      : `<span class="lo-badge missing">${this.t('linked.missing')}</span>`;
    return `<div class="lo-row">
      <ha-icon class="lo-ic" icon="${icon}"></ha-icon>
      <div class="lo-meta"><span class="lo-name">${name}</span><span class="lo-id">${String(idText).replace(/</g, '&lt;')}</span></div>
      ${badge}
      <div class="lo-acts">${acts}</div>
    </div>`;
  }

  // ── Modal helpers (alert / confirm / prompt sostituiti da <dialog>) ──────
  //
  // Sostituiscono le funzioni browser-native con dialog in shadow DOM, allineate
  // allo stile di _showNewProfileDialog. Bloccate da meno PWA, traducibili e
  // coerenti con il resto della UI della card. API: tutte ritornano Promise.

  _modalStyles() {
    return `
      dialog.wsc-modal{border:none;padding:0;margin:0;background:rgba(0,0,0,.55);width:100vw;height:100vh;max-width:100vw;max-height:100vh;display:flex;align-items:center;justify-content:center}
      dialog.wsc-modal::backdrop{display:none}
      .wsc-modal-box{background:var(--card-background-color,#fff);border-radius:14px;padding:20px;width:min(360px,90vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 32px rgba(0,0,0,.3);color:var(--primary-text-color)}
      .wsc-modal-msg{font-size:.92em;line-height:1.4;white-space:pre-wrap}
      .wsc-modal-label{font-size:.78em;font-weight:600;color:var(--secondary-text-color)}
      .wsc-modal-inp{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.9em;box-sizing:border-box;font-family:inherit}
      .wsc-modal-inp:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
      .wsc-modal-footer{display:flex;gap:8px;justify-content:flex-end}
      .wsc-modal-btn{padding:8px 18px;border-radius:9px;border:none;cursor:pointer;font-size:.84em;font-weight:600}
      .wsc-modal-cancel{background:var(--divider-color,#e0e0e0);color:var(--primary-text-color)}
      .wsc-modal-ok{background:var(--primary-color,#03a9f4);color:white}`;
  }

  // Open a centered <dialog>, set up Esc/click-out to resolve(cancelValue),
  // and call setup() to wire OK/cancel buttons. Centralizes the boilerplate.
  _openModal(bodyHtml, { setup, cancelValue }) {
    this._setStyles('modal', this._modalStyles());
    const existing = this.shadowRoot.querySelector('dialog.wsc-modal');
    if (existing) existing.remove();
    const dlg = document.createElement('dialog');
    dlg.className = 'wsc-modal';
    dlg.innerHTML = `<div class="wsc-modal-box">${bodyHtml}</div>`;
    this._dialogOpen = true;
    this.shadowRoot.appendChild(dlg);
    dlg.showModal();
    return new Promise(resolve => {
      const close = (value) => { this._dialogOpen = false; dlg.close(); dlg.remove(); resolve(value); };
      dlg.addEventListener('click', e => { if (e.target === dlg) close(cancelValue); });
      dlg.addEventListener('cancel', e => { e.preventDefault(); close(cancelValue); }); // Esc
      setup(dlg, close);
    });
  }

  _alert(message, { okLabel } = {}) {
    const ok = okLabel || this.t('popup.ok') || 'OK';
    const body = `
      <div class="wsc-modal-msg">${String(message).replace(/</g,'&lt;')}</div>
      <div class="wsc-modal-footer">
        <button class="wsc-modal-btn wsc-modal-ok">${ok}</button>
      </div>`;
    return this._openModal(body, {
      cancelValue: undefined,
      setup: (dlg, close) => {
        const btn = dlg.querySelector('.wsc-modal-ok');
        btn.focus();
        btn.addEventListener('click', () => close());
        dlg.addEventListener('keydown', e => { if (e.key === 'Enter') close(); });
      },
    });
  }

  _confirm(message, { okLabel, cancelLabel } = {}) {
    const ok = okLabel || this.t('popup.ok') || 'OK';
    const cancel = cancelLabel || this.t('popup.cancel') || 'Cancel';
    const body = `
      <div class="wsc-modal-msg">${String(message).replace(/</g,'&lt;')}</div>
      <div class="wsc-modal-footer">
        <button class="wsc-modal-btn wsc-modal-cancel">${cancel}</button>
        <button class="wsc-modal-btn wsc-modal-ok">${ok}</button>
      </div>`;
    return this._openModal(body, {
      cancelValue: false,
      setup: (dlg, close) => {
        const okBtn = dlg.querySelector('.wsc-modal-ok');
        okBtn.focus();
        okBtn.addEventListener('click', () => close(true));
        dlg.querySelector('.wsc-modal-cancel').addEventListener('click', () => close(false));
        dlg.addEventListener('keydown', e => { if (e.key === 'Enter') close(true); });
      },
    });
  }

  _prompt(label, defaultValue = '', { okLabel, cancelLabel } = {}) {
    const ok = okLabel || this.t('popup.ok') || 'OK';
    const cancel = cancelLabel || this.t('popup.cancel') || 'Cancel';
    const body = `
      <div class="wsc-modal-label">${String(label).replace(/</g,'&lt;')}</div>
      <input class="wsc-modal-inp" type="text" value="${String(defaultValue).replace(/"/g,'&quot;')}">
      <div class="wsc-modal-footer">
        <button class="wsc-modal-btn wsc-modal-cancel">${cancel}</button>
        <button class="wsc-modal-btn wsc-modal-ok">${ok}</button>
      </div>`;
    return this._openModal(body, {
      cancelValue: null,
      setup: (dlg, close) => {
        const inp = dlg.querySelector('.wsc-modal-inp');
        inp.focus(); inp.select();
        dlg.querySelector('.wsc-modal-ok').addEventListener('click', () => close(inp.value));
        dlg.querySelector('.wsc-modal-cancel').addEventListener('click', () => close(null));
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') close(inp.value); });
      },
    });
  }

  // ── Profile create / duplicate / cancel ───────────────────────────────────

  _showNewProfileDialog() {
    const existing = this.shadowRoot.querySelector('dialog.new-profile-dlg');
    if (existing) existing.remove();
    const dlg = document.createElement('dialog');
    dlg.className = 'new-profile-dlg';
    dlg.innerHTML = `
      <style>
        dialog.new-profile-dlg{border:none;padding:0;margin:0;background:rgba(0,0,0,.55);width:100vw;height:100vh;max-width:100vw;max-height:100vh;display:flex;align-items:center;justify-content:center}
        dialog.new-profile-dlg::backdrop{display:none}
        .np-box{background:var(--card-background-color,#fff);border-radius:14px;padding:20px;width:min(360px,90vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
        .np-title{font-size:1em;font-weight:600;color:var(--primary-text-color)}
        .np-inp{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.9em;box-sizing:border-box;font-family:inherit}
        .np-inp:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
        .np-excl-row{display:flex;align-items:center;gap:10px;font-size:.83em;color:var(--primary-text-color)}
        .toggle-switch{position:relative;width:38px;height:22px;cursor:pointer;display:inline-block;flex-shrink:0}
        .toggle-switch input{opacity:0;width:0;height:0;position:absolute}
        .toggle-track{position:absolute;inset:0;border-radius:11px;background:var(--disabled-color,#ccc);transition:background .2s}
        .toggle-switch input:checked + .toggle-track{background:var(--primary-color,#03a9f4)}
        .toggle-thumb{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .2s;pointer-events:none}
        .toggle-switch input:checked ~ .toggle-thumb{transform:translateX(16px)}
        .np-excl-lbl{flex:1}
        .np-footer{display:flex;gap:8px;justify-content:flex-end}
        .np-btn{padding:8px 18px;border-radius:9px;border:none;cursor:pointer;font-size:.84em;font-weight:600}
        .np-btn-cancel{background:var(--divider-color,#e0e0e0);color:var(--primary-text-color)}
        .np-btn-create{background:var(--primary-color,#03a9f4);color:white}
        .np-btn-create:disabled{opacity:.5;pointer-events:none}
      </style>
      <div class="np-box">
        <div class="np-title">${this.t('profile.new_profile')}</div>
        <input class="np-inp" placeholder="${this.t('profile.name_placeholder')}" maxlength="48" autofocus>
        <div class="np-excl-row">
          <label class="toggle-switch">
            <input type="checkbox" class="np-excl-chk" checked>
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
          <span class="np-excl-lbl">${this.t('profile.exclusive_label')}</span>
        </div>
        <div class="np-footer">
          <button class="np-btn np-btn-cancel">${this.t('popup.cancel')}</button>
          <button class="np-btn np-btn-create" disabled>${this.t('profile.create')}</button>
        </div>
      </div>`;
    this._dialogOpen = true;
    this.shadowRoot.appendChild(dlg);
    dlg.showModal();
    const inp = dlg.querySelector('.np-inp');
    const createBtn = dlg.querySelector('.np-btn-create');
    const exclChk = dlg.querySelector('.np-excl-chk');
    const exclLbl = dlg.querySelector('.np-excl-lbl');
    inp.addEventListener('input', () => { createBtn.disabled = !inp.value.trim(); });
    exclChk.addEventListener('change', () => {
      exclLbl.textContent = exclChk.checked ? this.t('profile.exclusive_label') : this.t('profile.shared_label');
    });
    dlg.querySelector('.np-btn-cancel').addEventListener('click', () => { this._dialogOpen = false; dlg.close(); dlg.remove(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) { this._dialogOpen = false; dlg.close(); dlg.remove(); } });
    createBtn.addEventListener('click', () => {
      const name = inp.value.trim();
      if (!name) return;
      this._dialogOpen = false; dlg.close(); dlg.remove();
      this._startNewProfile(name, exclChk.checked);
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim()) { createBtn.click(); } });
  }

  async _startNewProfile(name, exclusive) {
    const prevId = this._selectedProfileId;
    const newId = `prf_${Date.now()}`;
    const newProfile = { id: newId, name, exclusive, groups: [], schedules: [], scheduleLinks: [] };
    const profiles = [...(this._storageData.profiles || []), newProfile];
    await this._wsSet({ ...this._storageData, profiles });
    this._selectedProfileId = newId;
    this._activeTab = 0;
    this._profileEditMode = { profileId: newId, previousSelectedId: prevId };
    this.render();
  }

  async _cancelNewProfile() {
    const pe = this._profileEditMode;
    if (!pe) return;
    this._profileEditMode = null;
    this._selectedProfileId = pe.previousSelectedId;
    const data = this._storageData;
    const p = (data.profiles || []).find(x => x.id === pe.profileId);
    if (p) {
      for (const eid of p.schedules || [])
        try { await this._hass.callService('scheduler', 'remove', { entity_id: eid }); } catch {}
    }
    const profiles = (data.profiles || []).filter(x => x.id !== pe.profileId);
    const activeProfiles = (data.activeProfiles || []).filter(x => x !== pe.profileId);
    await this._wsSet({ ...data, profiles, activeProfiles });
    this._activeTab = 0;
    this.render();
  }

  // ── Tab management ────────────────────────────────────────────────────────

  _getAllTabs() {
    const entityTabs = this._entities.map(e => ({ type: 'entity', ...e }));
    const profile = this._getSelectedProfile();
    const groupTabs = (profile?.groups || []).map(g => ({ type: 'group', ...g }));
    return [...entityTabs, ...groupTabs];
  }

  _currentTab() {
    const tabs = this._getAllTabs();
    return tabs[Math.min(this._activeTab, tabs.length - 1)] || tabs[0] || { type: 'entity', ...this._entities[0] };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _getSchedules(entityId) {
    if (!this._hass || !entityId) return [];
    return Object.values(this._hass.states).filter(s =>
      s.entity_id.startsWith('switch.schedule_') &&
      s.attributes.entities?.includes(entityId)
    );
  }

  _detectDomain(entityId) {
    return entityId?.split('.')[0] || 'unknown';
  }

  _domainIconMdi(entityId) {
    const map = {
      climate:      ['mdi:thermometer',      '#F44336'],
      switch:       ['mdi:toggle-switch',    '#2196F3'],
      light:        ['mdi:lightbulb',        '#FFC107'],
      fan:          ['mdi:fan',              '#00BCD4'],
      cover:        ['mdi:window-shutter',   '#9C27B0'],
      input_boolean:['mdi:checkbox-marked',  '#4CAF50'],
      media_player: ['mdi:television-play',  '#FF5722'],
    };
    const d = (entityId||'').split('.')[0];
    return map[d] || ['mdi:calendar-clock','#607D8B'];
  }

  _tempToColor(temp) {
    if (temp == null) return '#9E9E9E';
    const ratio = Math.min(1, Math.max(0, (temp - 10) / 15));
    return `rgb(${Math.round(33 + ratio * 211)},${Math.round(150 - ratio * 83)},${Math.round(243 - ratio * 189)})`;
  }

  _parseTime(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
  _minutesToPercent(m) { return (m / 1440) * 100; }
  _minutesToTime(m) { return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  _snapToGrid(m) { return Math.round(m / this._snap) * this._snap; }

  _getDayIndex(day) {
    return { mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6,monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6,daily:-1,workday:-2,weekend:-3 }[day.toLowerCase()] ?? -1;
  }
  _getDayKey(i) { return ['mon','tue','wed','thu','fri','sat','sun'][i]; }

  _appliesToDay(weekdays, dayIndex) {
    return weekdays.some(wd => {
      const idx = this._getDayIndex(wd);
      if (idx === -1) return true;
      if (idx === -2) return dayIndex < 5;
      if (idx === -3) return dayIndex >= 5;
      return idx === dayIndex;
    });
  }

  _magneticSnap(minutes, pts) {
    const thr = this._snap * 2;
    let closest = null, dist = thr;
    for (const pt of pts) { const d = Math.abs(minutes - pt); if (d < dist) { dist = d; closest = pt; } }
    return closest !== null ? closest : this._snapToGrid(minutes);
  }

  _blockColor(schedule, entityConf) {
    if (this._detectDomain(entityConf?.entity) === 'climate')
      return this._tempToColor(schedule.attributes.actions?.[0]?.data?.temperature ?? null);
    return entityConf?.color || '#9E9E9E';
  }

  _getBlocksForDay(dayIndex, schedules, entityConf) {
    const blocks = [];
    for (const s of schedules) {
      if (!this._appliesToDay(s.attributes.weekdays || [], dayIndex)) continue;
      const color = this._blockColor(s, entityConf);
      const isOff = s.state === 'off';
      const hasStop = this._hasEndAction(s.entity_id);
      const evalRes = this._evalAllConditions(s.entity_id);
      const hasCond = evalRes.hasCond;
      const isActive = s.attributes.current_slot !== null && s.attributes.current_slot !== undefined;
      const isMuted = isActive && !isOff && hasCond && !evalRes.satisfied;
      const temp = s.attributes.actions?.[0]?.data?.temperature ?? null;
      const label = this._detectDomain(entityConf?.entity) === 'climate' && temp != null
        ? `${temp}°` : s.attributes.friendly_name;
      for (const slot of s.attributes.timeslots || []) {
        const [a, b] = slot.split(' - ');
        const sMin = this._parseTime(a);
        let eMin = this._parseTime(b); if (eMin === 0) eMin = 1440;
        blocks.push({ startPct: this._minutesToPercent(sMin), heightPct: this._minutesToPercent(eMin - sMin), color, isOff, hasStop, hasCond, isActive, isMuted, label, entityId: s.entity_id });
      }
    }
    return blocks.sort((a, b) => a.startPct - b.startPct);
  }

  _autoColor(extraUsed=[]) {
    const profile = this._getSelectedProfile();
    const used=new Set([
      ...this._entities.map(e=>e.color),
      ...(profile?.groups||[]).flatMap(g=>[g.color,...(g.entities||[]).map(e=>e.color)]),
      ...extraUsed,
    ].filter(Boolean).map(c=>c.toLowerCase()));
    return PALETTE.find(c=>!used.has(c.toLowerCase()))||PALETTE[0];
  }

  _colorPickerHTML(current,cls='') {
    const cur=(current||'').toLowerCase();
    return `<div class="color-palette${cls?' '+cls:''}">
      ${PALETTE.map(c=>`<div class="pal-swatch${c.toLowerCase()===cur?' sel':''}" data-color="${c}" style="background:${c}" title="${c}"></div>`).join('')}
      <input type="hidden" class="pal-value" value="${current||PALETTE[0]}">
    </div>`;
  }

  _bindColorPalettes(root) {
    root.querySelectorAll('.color-palette').forEach(pal=>{
      pal.querySelectorAll('.pal-swatch').forEach(sw=>sw.addEventListener('click',()=>{
        pal.querySelectorAll('.pal-swatch').forEach(s=>s.classList.remove('sel'));
        sw.classList.add('sel');
        pal.querySelector('.pal-value').value=sw.dataset.color;
      }));
    });
  }

  connectedCallback() {
    if (!this._storageListener) {
      this._storageListener = e => {
        if (e.detail?.source === this) return;
        if (!e.detail?.data) return;
        this._storageData = e.detail.data;
        if (!this._popupState && !this._profilesMode && !this._groupsMode && !this._dialogOpen) this.render();
      };
      window.addEventListener('wsc-storage-changed', this._storageListener);
    }
  }

  disconnectedCallback() {
    if (this._timeInterval) { clearInterval(this._timeInterval); this._timeInterval = null; }
    if (this._renderTimer) { clearTimeout(this._renderTimer); this._renderTimer = null; }
    if (this._storageListener) {
      window.removeEventListener('wsc-storage-changed', this._storageListener);
      this._storageListener = null;
    }
    this._hideTooltip();
  }

  _startTimeInterval() {
    if (this._timeInterval) return;
    this._timeInterval = setInterval(() => this._updateTimeLine(), 60000);
  }

  _updateTimeLine() {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7;
    const pct = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100;
    this.shadowRoot.querySelectorAll('.time-now-line').forEach(el => el.remove());
    this.shadowRoot.querySelectorAll(`.day-column[data-day="${todayIdx}"], .sub-col[data-day="${todayIdx}"]`).forEach(col => {
      const line = document.createElement('div');
      line.className = 'time-now-line';
      line.style.cssText = `position:absolute;left:0;right:0;top:${pct}%;height:2px;background:linear-gradient(to right,var(--primary-color,#03a9f4),transparent);opacity:.85;z-index:10;pointer-events:none`;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;left:-3px;top:-3px;width:8px;height:8px;border-radius:50%;background:var(--primary-color,#03a9f4)`;
      line.appendChild(dot);
      col.appendChild(line);
    });
    this.shadowRoot.querySelectorAll(`.gantt-day[data-day="${todayIdx}"] .gantt-area`).forEach(area => {
      const line = document.createElement('div');
      line.className = 'time-now-line';
      line.style.cssText = `position:absolute;top:0;bottom:0;left:${pct}%;width:2px;background:linear-gradient(to bottom,var(--primary-color,#03a9f4),transparent);opacity:.85;z-index:10;pointer-events:none`;
      area.appendChild(line);
    });
    this.shadowRoot.querySelectorAll(`.compact-bar[data-day="${todayIdx}"]`).forEach(bar => {
      const line = document.createElement('div');
      line.className = 'time-now-line';
      line.style.cssText = `position:absolute;top:0;bottom:0;left:${pct}%;width:2px;background:var(--primary-color,#03a9f4);opacity:.8;z-index:10;pointer-events:none`;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;top:50%;left:-2px;width:6px;height:6px;border-radius:50%;background:var(--primary-color,#03a9f4);transform:translateY(-50%)`;
      line.appendChild(dot);
      bar.appendChild(line);
    });
    const focusBody = this.shadowRoot.querySelector(`.focus-col-body[data-day="${todayIdx}"]`);
    if (focusBody) {
      const line = document.createElement('div');
      line.className = 'time-now-line';
      line.style.cssText = `position:absolute;left:0;right:0;top:${pct}%;height:2px;background:var(--primary-color,#03a9f4);opacity:.7;z-index:10;pointer-events:none`;
      focusBody.appendChild(line);
    }
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────

  _showTooltip(entityId, rect) {
    const s = this._hass?.states?.[entityId]; if (!s) return;
    this._hideTooltip();
    const DAY_MAP = {mon:'Lun',tue:'Mar',wed:'Mer',thu:'Gio',fri:'Ven',sat:'Sab',sun:'Dom'};
    const days = (s.attributes.weekdays||[]).map(d=>DAY_MAP[d]||d).join(', ');
    const slots = (s.attributes.timeslots||[]).join(', ');
    const act = s.attributes.actions?.[0];
    let actionText = '';
    if (act) {
      const svc = act.service||'', d2 = act.data||{};
      if (svc.includes('climate')) actionText = d2.temperature!=null?`🌡 ${d2.temperature}°C`:'';
      else if (svc.includes('light')) actionText = `💡 ${d2.brightness_pct!=null?d2.brightness_pct+'%':(svc.includes('turn_on')?'On':'Off')}`;
      else actionText = svc.split('.')[1]||'';
    }
    const state = s.state==='off'?' (disattivo)':'';
    const el = document.createElement('div');
    el.className = 'sched-tooltip';
    el.innerHTML = `<div class="tt-name">${(s.attributes.friendly_name||entityId).replace(/</g,'&lt;')}${state}</div><div class="tt-row">🕐 ${slots}</div>${actionText?`<div class="tt-row">${actionText}</div>`:''}${days?`<div class="tt-row">📅 ${days}</div>`:''}`;
    this.shadowRoot.appendChild(el); this._ttEl = el;
    const W=el.offsetWidth, H2=el.offsetHeight;
    let left=rect.left+rect.width/2-W/2, top=rect.top-H2-12;
    if(left<8)left=8; if(left+W>window.innerWidth-8)left=window.innerWidth-W-8;
    if(top<8)top=rect.bottom+12;
    el.style.left=left+'px'; el.style.top=top+'px';
  }

  _hideTooltip() {
    if(this._ttTimer){clearTimeout(this._ttTimer);this._ttTimer=null;}
    if(this._ttEl){this._ttEl.remove();this._ttEl=null;}
  }

  // ── Toggle ────────────────────────────────────────────────────────────────

  async _toggleSchedule(entityId, on) {
    try { await this._hass.callService('switch', on ? 'turn_on' : 'turn_off', { entity_id: entityId }); }
    catch (e) { console.error('toggle failed', e); }
  }

  // ── Popup ─────────────────────────────────────────────────────────────────

  _openCreatePopup(dayIndex, clickPct, entityConf) {
    const tab = this._currentTab();
    const ec = entityConf || (tab.type === 'entity' ? tab : tab.entities?.[0] || this._entities[0]);
    const domain = this._detectDomain(ec.entity);
    const startMin = this._snapToGrid(Math.max(0, (clickPct / 100) * 1440 - 30));
    this._popupState = {
      mode: 'create', entityId: null, entityConf: ec, domain,
      startMin, endMin: Math.min(startMin + 60, 1440),
      days: [dayIndex], name: '', isOff: false,
      temp: this._config.default_temp ?? 21,
      hvacMode: '', presetMode: '', fanMode: '', swingMode: '',
      enableTemp: domain === 'climate', enableHvac: false, enablePreset: false, enableFan: false, enableSwing: false,
      turnOn: true, brightness: 100, enableBrightness: false,
      enableColor: false, color: '#FFFFFF',
      enableSpeed: false, speed: 50,
      coverAction: 'close', enablePosition: false, position: 50,
      stopAction: null, stopValue: null,
      conditions: [], condCombinator: 'and', condInterval: 15, _condOpen: false,
      overrideEnabled: false,
      notifyService: '', notifyMessage: '', notifyMessageEnd: '',
      _defaultNotifyMsg: '', _defaultNotifyMsgEnd: '',
      notifyTrigger: 'start', _notifOpen: false,
      groupEntities: tab.type === 'group' ? tab.entities : null,
    };
    this._popupState._defaultNotifyMsg = this._buildDefaultNotifyMessage(this._popupState, 'start');
    this._popupState._defaultNotifyMsgEnd = this._buildDefaultNotifyMessage(this._popupState, 'end');
    this._popupState.notifyMessage = this._popupState._defaultNotifyMsg;
    this._popupState.notifyMessageEnd = this._popupState._defaultNotifyMsgEnd;
    this._popupState._defaultName = this._buildDefaultScheduleName(this._popupState);
    this._popupState.name = this._popupState._defaultName;
    this._renderPopup();
  }

  _openEditPopup(entityId) {
    const s = this._hass.states[entityId];
    if (!s) return;
    const { weekdays, timeslots, actions } = s.attributes;
    let ec = this._entities[0];
    for (const e of this._entities) { if (s.attributes.entities?.includes(e.entity)) { ec = e; break; } }
    for (const p of this._storageData?.profiles || [])
      for (const g of p.groups || [])
        for (const e of g.entities || []) { if (s.attributes.entities?.includes(e.entity)) { ec = e; break; } }

    const slot = timeslots?.[0] || '08:00 - 22:00';
    const [a, b] = slot.split(' - ');
    const startMin = this._parseTime(a);
    let endMin = this._parseTime(b); if (endMin === 0) endMin = 1440;
    const days = [];
    weekdays.forEach(wd => {
      const idx = this._getDayIndex(wd);
      if (idx >= 0) days.push(idx);
      else if (idx === -1) days.push(0,1,2,3,4,5,6);
      else if (idx === -2) days.push(0,1,2,3,4);
      else if (idx === -3) days.push(5,6);
    });
    // Merge all action data (climate now uses one action per service: set_temperature, set_preset_mode, ...)
    const ad = {};
    let svc = '';
    for (const a of actions || []) {
      const d = a.data || a.service_data || {};
      if (d.temperature !== undefined) ad.temperature = d.temperature;
      if (d.hvac_mode !== undefined) ad.hvac_mode = d.hvac_mode;
      if (d.preset_mode !== undefined) ad.preset_mode = d.preset_mode;
      if (d.fan_mode !== undefined) ad.fan_mode = d.fan_mode;
      if (d.swing_mode !== undefined) ad.swing_mode = d.swing_mode;
      if (d.brightness_pct !== undefined) ad.brightness_pct = d.brightness_pct;
      if (d.brightness !== undefined) ad.brightness = d.brightness;
      if (d.rgb_color !== undefined) ad.rgb_color = d.rgb_color;
      if (d.color_temp_kelvin !== undefined) ad.color_temp_kelvin = d.color_temp_kelvin;
      if (d.percentage !== undefined) ad.percentage = d.percentage;
      if (d.position !== undefined) ad.position = d.position;
      if (!svc) svc = a.service || '';
    }
    // Storage extras override (HA Scheduler keeps only the first action — preset/fan/swing/hvac live in storage)
    const storedExtras = this._getExtras(entityId);
    if (storedExtras) {
      if (storedExtras.hvacMode != null) ad.hvac_mode = storedExtras.hvacMode;
      if (storedExtras.presetMode != null) ad.preset_mode = storedExtras.presetMode;
      if (storedExtras.fanMode != null) ad.fan_mode = storedExtras.fanMode;
      if (storedExtras.swingMode != null) ad.swing_mode = storedExtras.swingMode;
    }
    const domain = this._detectDomain(ec.entity);
    this._popupState = {
      mode: 'edit', entityId, entityConf: ec, domain,
      startMin, endMin, days: [...new Set(days)].sort(),
      name: s.attributes.friendly_name || '', isOff: s.state === 'off',
      temp: ad.temperature ?? 21, hvacMode: ad.hvac_mode ?? '',
      presetMode: ad.preset_mode ?? '', fanMode: ad.fan_mode ?? '', swingMode: ad.swing_mode ?? '',
      enableTemp: ad.temperature !== undefined, enableHvac: !!ad.hvac_mode,
      enablePreset: !!ad.preset_mode, enableFan: !!ad.fan_mode, enableSwing: !!ad.swing_mode,
      turnOn: !svc.endsWith('turn_off'),
      brightness: ad.brightness_pct ?? ad.brightness ?? 100,
      enableBrightness: ad.brightness_pct !== undefined || ad.brightness !== undefined,
      enableColor: ad.rgb_color !== undefined,
      color: ad.rgb_color ? this._rgbToHex(ad.rgb_color) : '#FFFFFF',
      enableSpeed: ad.percentage !== undefined,
      speed: ad.percentage ?? 50,
      coverAction: (svc.includes('open_cover') ? 'open' : svc.includes('stop_cover') ? 'stop' : 'close'),
      enablePosition: ad.position !== undefined,
      position: ad.position ?? 50,
      stopAction: (() => {
        const stored = this._getStoredStop(entityId);
        if (stored) return stored.stopAction;
        // Legacy fallback: read from old child schedule
        const cid = this._getAutoChildId(entityId);
        const cs  = cid ? this._hass.states[cid] : null;
        const svc = cs?.attributes.actions?.[0]?.service || '';
        if (svc.includes('set_temperature')) return 'set_temperature';
        if (svc.includes('turn_on')) return 'turn_on';
        if (svc.includes('turn_off')) return 'turn_off';
        return null;
      })(),
      stopValue: (() => {
        const stored = this._getStoredStop(entityId);
        if (stored && stored.stopValue != null) return stored.stopValue;
        // Legacy fallback: child temperature for set_temperature
        const cid = this._getAutoChildId(entityId);
        const cs  = cid ? this._hass.states[cid] : null;
        const cd = cs?.attributes.actions?.[0]?.data || {};
        if (cd.temperature != null) return cd.temperature;
        return null;
      })(),
      conditions: this._getStoredConditions(entityId).conditions,
      condCombinator: this._getStoredConditions(entityId).condCombinator,
      condInterval: this._getStoredConditions(entityId).condInterval,
      _condOpen: false,
      overrideEnabled: this._getOverrideEnabled(entityId),
      notifyService: (() => { for (const p of this._storageData?.profiles||[]) { const l=(p.scheduleLinks||[]).find(l=>l.id===entityId); if(l?.notifyService)return l.notifyService; } return ''; })(),
      notifyMessage: (() => { for (const p of this._storageData?.profiles||[]) { const l=(p.scheduleLinks||[]).find(l=>l.id===entityId); if(l?.notifyMessage)return l.notifyMessage; } return ''; })(),
      notifyMessageEnd: (() => { for (const p of this._storageData?.profiles||[]) { const l=(p.scheduleLinks||[]).find(l=>l.id===entityId); if(l?.notifyMessageEnd)return l.notifyMessageEnd; } return ''; })(),
      notifyTrigger: (() => { for (const p of this._storageData?.profiles||[]) { const l=(p.scheduleLinks||[]).find(l=>l.id===entityId); if(l?.notifyTrigger)return l.notifyTrigger; } return 'start'; })(),
      _defaultNotifyMsg: '',
      _defaultNotifyMsgEnd: '',
      _notifOpen: false,
      groupEntities: null,
    };
    this._popupState._defaultNotifyMsg = this._buildDefaultNotifyMessage(this._popupState, 'start');
    this._popupState._defaultNotifyMsgEnd = this._buildDefaultNotifyMessage(this._popupState, 'end');
    if (!this._popupState.notifyMessage) this._popupState.notifyMessage = this._popupState._defaultNotifyMsg;
    if (!this._popupState.notifyMessageEnd) this._popupState.notifyMessageEnd = this._popupState._defaultNotifyMsgEnd;
    this._renderPopup();
  }

  _closePopup() {
    this._popupState = null;
    const dlg = this.shadowRoot.querySelector('dialog');
    if (dlg) { dlg.close(); dlg.remove(); }
    this.render();
  }

  _renderPopup() {
    const existing = this.shadowRoot.querySelector('dialog');
    if (existing) existing.remove();
    const ps = this._popupState;
    // Normalize end-action value (ensures value widgets have a sane default)
    if (ps.stopAction && ps.stopValue == null) ps.stopValue = this._endActionDefault(ps.stopAction, ps.entityConf.entity);
    const DAY_NAMES = ['mon','tue','wed','thu','fri','sat','sun'].map(k=>this.t(`days.${k}`));
    const SNAP_OPTIONS = [5,10,15,30];
    const schedules = this._getSchedules(ps.entityConf.entity);

    const bgBlocks = schedules
      .filter(s => s.entity_id !== ps.entityId && ps.days.some(di => this._appliesToDay(s.attributes.weekdays || [], di)))
      .flatMap(s => (s.attributes.timeslots || []).map(slot => {
        const [a, b] = slot.split(' - ');
        const sMin = this._parseTime(a); let eMin = this._parseTime(b); if (eMin === 0) eMin = 1440;
        return { left: this._minutesToPercent(sMin), width: this._minutesToPercent(eMin - sMin), color: this._blockColor(s, ps.entityConf), startMin: sMin, endMin: eMin };
      }));

    const magnetPoints = [...new Set(bgBlocks.flatMap(b => [b.startMin, b.endMin]))];
    const editLeft = this._minutesToPercent(ps.startMin);
    const editWidth = this._minutesToPercent(ps.endMin - ps.startMin);
    const editColor = ps.domain === 'climate' ? this._tempToColor(ps.temp) : (ps.entityConf.color || '#9E9E9E');
    const timeLabel = `${this._minutesToTime(ps.startMin)} – ${this._minutesToTime(ps.endMin)}`;

    const groupPicker = ps.groupEntities ? `
      <div>
        <div class="section-label">Entità</div>
        <div class="entity-pills">
          ${ps.groupEntities.map((ec, i) => {
            const sel = ps.entityConf.entity === ec.entity;
            const color = ec.color || '#9E9E9E';
            const nm = ec.name || ec.entity;
            const label = nm.length > 20 ? nm.slice(0,20) + '…' : nm;
            const style = sel ? 'background:' + color + '1F;border-color:' + color + ';color:' + color + ';box-shadow:0 0 8px ' + color + '66' : '';
            return '<div class="entity-pill ' + (sel ? 'sel' : '') + '" data-ei="' + i + '" style="' + style + '"><span class="ep-dot" style="background:' + color + '"></span><span class="ep-name">' + label + '</span></div>';
          }).join('')}
        </div>
      </div>` : '';

    const HVAC = ['heat','cool','heat_cool','auto','dry','fan_only','off'];
    const climateAttrs = ps.domain === 'climate' ? (this._hass?.states?.[ps.entityConf.entity]?.attributes || {}) : {};
    const modeField = (clsBase, modes, value, enabled, placeholder) => {
      const list = Array.isArray(modes) ? modes : null;
      const disAttr = enabled ? '' : 'disabled';
      const disCls = enabled ? '' : ' disabled';
      if (!list || list.length === 0) {
        return `<input type="text" class="${clsBase}-input param-input${disCls}" value="${value}" placeholder="${placeholder}" ${disAttr}>`;
      }
      const inList = list.includes(value);
      const outCls = (!inList && value) ? ' out-list' : '';
      const extra = (!inList && value) ? `<option value="${value}" selected>${value} ⚠</option>` : '';
      const opts = list.map(m => `<option value="${m}" ${value === m ? 'selected' : ''}>${m}</option>`).join('');
      return `<select class="${clsBase}-select param-select${disCls}${outCls}" ${disAttr}><option value="">-- select --</option>${extra}${opts}</select>`;
    };
    const domainSection = ps.domain === 'climate' ? `
      <div>
        <div class="section-label">${this.t('popup.climate_actions')}</div>
        <div class="action-row">
          <label class="action-check"><input type="checkbox" class="chk-temp" ${ps.enableTemp?'checked':''}><span>${this.t('popup.temperature')}</span></label>
          <div class="param-inline temp-ctrl ${ps.enableTemp?'':'disabled'} ${ps.temp<5||ps.temp>35?'out-range-wrap':''}">
            <input type="number" class="temp-inp ${ps.temp<5||ps.temp>35?'out-range':''}" min="5" max="100" step="0.5" value="${ps.temp}" ${ps.enableTemp?'':'disabled'}>
            <input type="range" class="temp-slider ${ps.temp<5||ps.temp>35?'out-range':''}" min="5" max="35" step="0.5" value="${Math.min(35,Math.max(5,ps.temp))}" ${ps.enableTemp?'':'disabled'}>
          </div>
        </div>
        <div class="temp-msg-area" style="${ps.enableTemp?'':'display:none'}"></div>
        <div class="action-row">
          <label class="action-check"><input type="checkbox" class="chk-hvac" ${ps.enableHvac?'checked':''}><span>${this.t('popup.hvac_mode')}</span></label>
          <select class="hvac-select param-select ${ps.enableHvac?'':'disabled'}" ${ps.enableHvac?'':'disabled'}>
            <option value="">-- select --</option>${HVAC.map(m=>`<option value="${m}" ${ps.hvacMode===m?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="action-row">
          <label class="action-check"><input type="checkbox" class="chk-preset" ${ps.enablePreset?'checked':''}><span>${this.t('popup.preset_mode')}</span></label>
          ${modeField('preset', climateAttrs.preset_modes, ps.presetMode, ps.enablePreset, 'eco, comfort…')}
        </div>
        <div class="action-row">
          <label class="action-check"><input type="checkbox" class="chk-fan" ${ps.enableFan?'checked':''}><span>${this.t('popup.fan_mode')}</span></label>
          ${modeField('fan', climateAttrs.fan_modes, ps.fanMode, ps.enableFan, 'auto, high…')}
        </div>
        <div class="action-row">
          <label class="action-check"><input type="checkbox" class="chk-swing" ${ps.enableSwing?'checked':''}><span>${this.t('popup.swing_mode')}</span></label>
          ${modeField('swing', climateAttrs.swing_modes, ps.swingMode, ps.enableSwing, 'off, both…')}
        </div>
      </div>` :
    ps.domain === 'light' ? `
      <div>
        <div class="section-label">${this.t('popup.light_action')}</div>
        <div class="radio-row">
          <label><input type="radio" name="light-action" value="on" ${ps.turnOn?'checked':''}> ${this.t('popup.turn_on')}</label>
          <label><input type="radio" name="light-action" value="off" ${!ps.turnOn?'checked':''}> ${this.t('popup.turn_off')}</label>
        </div>
        <div class="action-row" style="margin-top:8px">
          <label class="action-check"><input type="checkbox" class="chk-brightness" ${ps.enableBrightness?'checked':''}><span>${this.t('popup.brightness')}</span></label>
          <div class="param-inline ${ps.enableBrightness?'':'disabled'}">
            <span class="brightness-value">${ps.brightness}%</span>
            <input type="range" class="brightness-slider" min="0" max="100" step="1" value="${ps.brightness}" ${ps.enableBrightness?'':'disabled'}>
          </div>
        </div>
        ${this._entityCaps(ps.entityConf.entity).lightRgb ? `
        <div class="action-row" style="border-bottom:none;align-items:flex-start">
          <label class="action-check"><input type="checkbox" class="chk-color" ${ps.enableColor?'checked':''}><span>${this.t('endact.color')}</span></label>
          ${this._colorPickerHTML(ps.color || '#FFFFFF', 'light-color-pal')}
        </div>` : ''}
      </div>` :
    ps.domain === 'fan' ? `
      <div>
        <div class="section-label">${this.t('popup.action')}</div>
        <div class="radio-row">
          <label><input type="radio" name="switch-action" value="on" ${ps.turnOn?'checked':''}> ${this.t('popup.turn_on')}</label>
          <label><input type="radio" name="switch-action" value="off" ${!ps.turnOn?'checked':''}> ${this.t('popup.turn_off')}</label>
        </div>
        ${this._entityCaps(ps.entityConf.entity).fanSpeed ? `
        <div class="action-row" style="margin-top:8px;border-bottom:none">
          <label class="action-check"><input type="checkbox" class="chk-speed" ${ps.enableSpeed?'checked':''}><span>${this.t('endact.speed')}</span></label>
          <div class="param-inline ${ps.enableSpeed?'':'disabled'}">
            <span class="speed-value" style="min-width:40px;text-align:right;font-weight:700">${ps.speed}%</span>
            <input type="range" class="speed-slider" min="0" max="100" step="1" value="${ps.speed}" ${ps.enableSpeed?'':'disabled'}>
          </div>
        </div>` : ''}
      </div>` :
    ps.domain === 'cover' ? `
      <div>
        <div class="section-label">${this.t('popup.action')}</div>
        <div class="radio-row" style="flex-wrap:wrap;gap:10px">
          <label><input type="radio" name="cover-action" value="open" ${ps.coverAction==='open'?'checked':''}> ${this.t('endact.open')}</label>
          <label><input type="radio" name="cover-action" value="close" ${ps.coverAction!=='open'&&ps.coverAction!=='stop'?'checked':''}> ${this.t('endact.close')}</label>
          <label><input type="radio" name="cover-action" value="stop" ${ps.coverAction==='stop'?'checked':''}> ${this.t('endact.stop')}</label>
        </div>
        ${this._entityCaps(ps.entityConf.entity).coverPosition ? `
        <div class="action-row" style="margin-top:8px;border-bottom:none">
          <label class="action-check"><input type="checkbox" class="chk-position" ${ps.enablePosition?'checked':''}><span>${this.t('endact.position')}</span></label>
          <div class="param-inline ${ps.enablePosition?'':'disabled'}">
            <span class="position-value" style="min-width:40px;text-align:right;font-weight:700">${ps.position}%</span>
            <input type="range" class="position-slider" min="0" max="100" step="1" value="${ps.position}" ${ps.enablePosition?'':'disabled'}>
          </div>
        </div>` : ''}
      </div>` : `
      <div>
        <div class="section-label">${this.t('popup.action')}</div>
        <div class="radio-row">
          <label><input type="radio" name="switch-action" value="on" ${ps.turnOn?'checked':''}> ${this.t('popup.turn_on')}</label>
          <label><input type="radio" name="switch-action" value="off" ${!ps.turnOn?'checked':''}> ${this.t('popup.turn_off')}</label>
        </div>
      </div>`;

    const COND_DOMAINS = ['sensor','binary_sensor','input_number','input_boolean','number','counter','climate','weather'];
    const condEnts = Object.keys(this._hass?.states||{}).filter(eid=>COND_DOMAINS.includes(eid.split('.')[0])).sort();
    const OP_LABEL = { '>':'&gt;','<':'&lt;','>=':'&gt;=','<=':'&lt;=','==':'=','!=':'&ne;' };
    const condBodyHtml = ps._condOpen ? `
      <div class="cond-body">
        <div class="cond-comb" style="${ps.conditions.length<2?'display:none':''}">
          <label><input type="radio" name="comb" value="and" ${ps.condCombinator==='and'?'checked':''}> ${this.t('cond.and_all')}</label>
          <label><input type="radio" name="comb" value="or" ${ps.condCombinator==='or'?'checked':''}> ${this.t('cond.or_any')}</label>
        </div>
        ${ps.conditions.map((c,i)=>{
          const hasEntity = !!c.entity;
          const entityInput = `<input class="cond-entity" list="cond-ents-${i}" placeholder="${this.t('cond.entity')}" value="${(c.entity||'').replace(/"/g,'&quot;')}" data-ci="${i}">
            <datalist id="cond-ents-${i}">${condEnts.map(eid=>`<option value="${eid}">`).join('')}</datalist>`;
          if (!hasEntity) {
            // Wait for entity selection before showing operator/value pickers
            return `<div class="cond-row">
              ${entityInput}
              <span class="cond-hint">${this.t('cond.choose_entity')||"⬅ Scegli un'entità"}</span>
              <button class="cond-del" data-ci="${i}">✕</button>
            </div>`;
          }
          const spec = this._getCondFieldSpec(c.entity, c.attribute);
          const validOp = spec.operators.includes(c.operator) ? c.operator : spec.operators[0];
          const opHtml = `<select class="cond-op" data-ci="${i}">${spec.operators.map(op=>`<option value="${op}" ${validOp===op?'selected':''}>${OP_LABEL[op]||op}</option>`).join('')}</select>`;
          // attribute picker (climate)
          const attrHtml = spec.climateAttrs ? `<select class="cond-attribute" data-ci="${i}"><option value="">-- attr --</option>${spec.climateAttrs.map(a=>`<option value="${a}" ${c.attribute===a?'selected':''}>${a}</option>`).join('')}</select>` : '';
          // value field
          let valHtml;
          if (spec.kind === 'numeric') {
            const stepAttr = spec.step ? ` step="${spec.step}"` : '';
            const minAttr = spec.min!=null ? ` min="${spec.min}"` : '';
            const maxAttr = spec.max!=null ? ` max="${spec.max}"` : '';
            const unitHtml = spec.unit ? `<span class="cond-unit">${spec.unit}</span>` : '';
            valHtml = `<input class="cond-val" type="number"${stepAttr}${minAttr}${maxAttr} data-ci="${i}" placeholder="${this.t('cond.value')}" value="${(c.value||'').replace(/"/g,'&quot;')}">${unitHtml}`;
          } else if (spec.kind === 'boolean' || spec.kind === 'select') {
            const opts = spec.options || [];
            valHtml = `<select class="cond-val" data-ci="${i}"><option value="">--</option>${opts.map(o=>`<option value="${o}" ${c.value===o?'selected':''}>${o}</option>`).join('')}</select>`;
          } else if (spec.kind === 'climate-picker') {
            // attribute not yet selected
            valHtml = `<span class="cond-hint">${this.t('cond.choose_attribute')||'⬅ Scegli un attributo'}</span>`;
          } else {
            valHtml = `<input class="cond-val" type="text" data-ci="${i}" placeholder="${this.t('cond.value')}" value="${(c.value||'').replace(/"/g,'&quot;')}">`;
          }
          return `
          <div class="cond-row">
            ${entityInput}
            ${attrHtml}
            ${spec.kind === 'climate-picker' ? '' : opHtml}
            ${valHtml}
            <button class="cond-del" data-ci="${i}">✕</button>
          </div>`;
        }).join('')}
        ${ps.conditions.length === 0 ? `<div class="cond-empty">ℹ️ ${this.t('cond.empty_hint') || (this._lang==='it'?'Nessuna condizione attiva — lo schedule girerà sempre nei suoi orari':this._lang==='fr'?'Aucune condition active — le planning fonctionnera toujours dans ses créneaux':'No active conditions — schedule will always run in its slots')}</div>` : ''}
        <button class="cond-add">${this.t('cond.add')}</button>
        <div class="cond-interval-row">
          <span style="font-size:.75em;color:var(--secondary-text-color)">${this.t('cond.recheck')}</span>
          <select class="cond-interval">
            <option value="5"  ${ps.condInterval===5 ?'selected':''}>5 min</option>
            <option value="10" ${ps.condInterval===10?'selected':''}>10 min</option>
            <option value="15" ${ps.condInterval===15?'selected':''}>15 min</option>
            <option value="30" ${ps.condInterval===30?'selected':''}>30 min</option>
            <option value="60" ${ps.condInterval===60?'selected':''}>60 min</option>
          </select>
        </div>
        <label class="cond-override-row" style="${ps.conditions.length===0?'opacity:.45':''}">
          <input type="checkbox" class="cond-override" ${ps.overrideEnabled?'checked':''} ${ps.conditions.length===0?'disabled':''}>
          <span><b>✋ ${this.t('override.enable')}</b><br><span class="cond-override-hint">${this.t('override.hint')}</span></span>
        </label>
      </div>` : '';

    const dlg = document.createElement('dialog');
    dlg.innerHTML = `
      <style>
        dialog { border:none;padding:0;margin:0;background:rgba(0,0,0,0.45);width:100vw;height:100vh;max-width:100vw;max-height:100vh;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px); }
        dialog::backdrop { display:none; }
        .popup { background:var(--card-background-color,#fff);border-radius:16px;padding:20px;width:min(500px,92vw);max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:18px;box-shadow:0 8px 32px rgba(0,0,0,.25); }
        .popup-header { display:flex;justify-content:space-between;align-items:center; }
        .popup-title { font-size:1.1em;font-weight:600;color:var(--primary-text-color); }
        .popup-close { background:none;border:none;font-size:1.3em;cursor:pointer;color:var(--secondary-text-color);padding:4px 8px;border-radius:6px;line-height:1; }
        .popup-close:hover { background:var(--divider-color,#e0e0e0); }
        .toggle-row { display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:var(--divider-color,#f0f0f0); }
        .toggle-label { font-size:0.85em;font-weight:600;color:var(--primary-text-color);flex:1; }
        .toggle-switch { position:relative;width:42px;height:24px;cursor:pointer;display:inline-block; }
        .toggle-switch input { opacity:0;width:0;height:0;position:absolute; }
        .toggle-track { position:absolute;inset:0;border-radius:12px;background:var(--disabled-color,#ccc);transition:background .2s; }
        .toggle-switch input:checked + .toggle-track { background:var(--primary-color,#03a9f4); }
        .toggle-thumb { position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .2s;pointer-events:none; }
        .toggle-switch input:checked ~ .toggle-thumb { transform:translateX(18px); }
        .section-label { font-size:0.72em;font-weight:600;letter-spacing:.03em;color:var(--secondary-text-color);margin-bottom:6px; }
        .timebar { position:relative;height:48px;background:var(--secondary-background-color,#f5f5f5);border-radius:8px;overflow:hidden;touch-action:none;user-select:none; }
        .tb-bg { position:absolute;top:6px;height:calc(100% - 12px);border-radius:6px;opacity:.6;pointer-events:none; }
        .tb-edit { position:absolute;top:0;height:100%;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.65em;font-weight:700;color:white;text-shadow:0 1px 3px rgba(0,0,0,.45);cursor:grab;box-sizing:border-box;touch-action:none;overflow:hidden;box-shadow:0 2px 8px rgba(var(--rgb-primary-color,3,169,244),.3); }
        .tb-edit:active { cursor:grabbing; }
        .tb-handle { position:absolute;top:0;height:100%;width:20px;cursor:ew-resize;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .tb-handle::after { content:'';display:block;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 6px rgba(0,0,0,.25);border:2px solid var(--primary-color,#03a9f4);transition:background .15s; }
        .tb-handle-l { left:0; } .tb-handle-r { right:0; }
        .tb-magnet { position:absolute;top:0;width:2px;height:100%;background:rgba(255,255,255,.55);pointer-events:none;transform:translateX(-50%); }
        .tb-magnet.near { background:rgba(255,255,255,.95);box-shadow:0 0 4px rgba(255,255,255,.8); }
        .tb-ticks { display:flex;justify-content:space-between;margin-top:3px; }
        .tb-tick { font-size:.6em;color:var(--secondary-text-color); }
        .time-display { text-align:center;font-size:1em;font-weight:700;color:var(--primary-text-color);letter-spacing:.03em;margin-top:2px; }
        .snap-row { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
        .snap-lbl { font-size:.72em;color:var(--secondary-text-color);margin-right:2px; }
        .snap-btn { padding:3px 10px;border-radius:12px;border:none;background:var(--secondary-background-color,#f5f5f5);cursor:pointer;font-size:.75em;color:var(--secondary-text-color);transition:all .12s; }
        .snap-btn.active { background:var(--primary-color,#03a9f4);color:white;font-weight:600; }
        .shortcuts { display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap; }
        .shortcut-btn { padding:4px 10px;border-radius:12px;border:1px solid var(--divider-color,#ccc);background:none;cursor:pointer;font-size:.75em;color:var(--secondary-text-color);transition:all .12s; }
        .shortcut-btn.active { background:color-mix(in srgb,var(--primary-color,#03a9f4) 15%,transparent);border-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4); }
        .day-chips { display:flex;gap:6px;flex-wrap:wrap; }
        .day-chip { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--divider-color,#ccc);cursor:pointer;font-size:.72em;font-weight:600;color:var(--secondary-text-color);user-select:none;transition:all .12s;flex-shrink:0; }
        .day-chip.on { background:var(--primary-color,#03a9f4);color:white;border-color:var(--primary-color,#03a9f4); }
        .action-row { display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--divider-color,#f0f0f0); }
        .action-check { display:flex;align-items:center;gap:6px;font-size:.82em;color:var(--primary-text-color);white-space:nowrap;cursor:pointer;min-width:110px; }
        .param-inline { display:flex;align-items:center;gap:8px;flex:1; }
        .brightness-value { font-size:.9em;font-weight:700;color:var(--primary-text-color);min-width:40px;text-align:right; }
        input[type=range] { flex:1;accent-color:var(--primary-color,#03a9f4);cursor:pointer; }
        .temp-inp { width:70px;flex-shrink:0;padding:4px 6px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.88em;font-family:inherit;text-align:center;-moz-appearance:textfield; }
        .temp-inp::-webkit-inner-spin-button,.temp-inp::-webkit-outer-spin-button{opacity:1}
        .temp-inp:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
        .temp-inp.out-range{border-color:#FF9800 !important}
        input[type=range].out-range{accent-color:#FF9800}
        .temp-ctrl.out-range-wrap{background:repeating-linear-gradient(90deg,rgba(255,152,0,.07),rgba(255,152,0,.07) 5px,transparent 5px,transparent 10px);border-radius:4px;padding:2px 4px}
        .temp-msg-area{font-size:.75em;display:flex;flex-direction:column;gap:2px;margin-top:-12px;padding-bottom:4px}
        .temp-msg-warn{color:#FF9800}
        .temp-msg-warn.red{color:var(--error-color,#f44336)}
        .temp-msg-range{color:var(--secondary-text-color)}
        .param-select,.param-input { flex:1;padding:5px 8px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.82em;font-family:inherit; }
        .param-select:focus,.param-input:focus { outline:none;border-color:var(--primary-color,#03a9f4); }
        .param-select.out-list { border-color:#FF9800; }
        .disabled { opacity:.4;pointer-events:none; }
        .radio-row { display:flex;gap:20px; }
        .radio-row label { display:flex;align-items:center;gap:6px;font-size:.85em;cursor:pointer; }
        .entity-pills { display:flex;flex-wrap:wrap;gap:8px; }
        .entity-pill { display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid var(--divider-color,#ccc);cursor:pointer;font-size:.8em;color:var(--secondary-text-color);transition:all .15s; }
        .entity-pill.sel { font-weight:600; }
        .ep-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
        .ep-name { white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px; }
        .name-input { width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.9em;box-sizing:border-box;font-family:inherit; }
        .name-input:focus { outline:none;border-color:var(--primary-color,#03a9f4); }
        .popup-footer { display:flex;gap:8px;padding-top:4px; }
        .spacer { flex:1; }
        .btn { padding:8px 20px;border-radius:20px;border:none;cursor:pointer;font-size:.85em;font-weight:600;transition:all .15s; }
        .btn:hover { filter:brightness(.9);transform:translateY(-1px); }
        .slot-note{font-size:.72em;color:var(--secondary-text-color);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
        .time-inputs-row{display:flex;gap:16px;margin-top:8px}
        .time-inp-grp{display:flex;flex-direction:column;gap:2px}
        .time-inp{padding:5px 8px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.85em;font-family:inherit;width:108px}
        .time-inp:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
        .time-inp.error{border-color:var(--error-color,#f44336)}
        .btn-next-slot{padding:3px 10px;border-radius:8px;border:1px solid var(--primary-color,#03a9f4);background:none;cursor:pointer;font-size:.9em;color:var(--primary-color,#03a9f4);white-space:nowrap}
        .btn-next-slot:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}
        .btn-delete { background:rgba(244,67,54,.12);color:var(--error-color,#f44336);border:1px solid rgba(244,67,54,.3); }
        .btn-cancel { background:transparent;color:var(--primary-text-color);border:1px solid var(--divider-color,#ccc); }
        .btn-save { background:var(--primary-color,#03a9f4);color:white; }
        .cond-section,.notif-section{border-top:1px solid var(--divider-color,#eee);padding-top:8px}
        .cond-hdr,.notif-hdr{display:flex;justify-content:space-between;cursor:pointer;font-size:.82em;font-weight:600;color:var(--primary-text-color);padding:4px 0;user-select:none}
        .cond-body,.notif-body{padding-top:8px;display:flex;flex-direction:column;gap:6px}
        .cond-comb{display:flex;gap:14px;font-size:.8em}
        .cond-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:2px}
        .cond-entity{flex:2;min-width:100px;padding:4px 6px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.78em}
        .cond-op{flex:0 0 52px;padding:4px 3px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.78em}
        .cond-val{flex:1;min-width:60px;padding:4px 6px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.78em}
        .cond-attribute{flex:0 0 110px;padding:4px 4px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.74em}
        .cond-unit{font-size:.75em;color:var(--secondary-text-color);padding:0 2px;flex-shrink:0}
        .cond-hint{flex:1;font-size:.72em;color:var(--secondary-text-color);font-style:italic;padding:0 4px}
        .cond-del{background:none;border:none;cursor:pointer;color:var(--error-color,#f44336);font-size:.85em;padding:2px 6px;line-height:1}
        .cond-add{padding:5px 12px;border-radius:7px;border:1px dashed var(--primary-color,#03a9f4);background:none;color:var(--primary-color,#03a9f4);cursor:pointer;font-size:.78em;align-self:flex-start}
        .cond-empty{padding:8px 10px;border-radius:6px;background:color-mix(in srgb,var(--secondary-text-color) 8%,transparent);color:var(--secondary-text-color);font-size:.75em;font-style:italic;line-height:1.4}
        .cond-interval-row{display:flex;align-items:center;gap:8px;padding-top:6px;border-top:1px solid var(--divider-color,#eee);margin-top:4px}
        .cond-interval{padding:3px 6px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.78em}
        .cond-override-row{display:flex;align-items:flex-start;gap:8px;padding-top:8px;margin-top:6px;border-top:1px solid var(--divider-color,#eee);font-size:.8em;cursor:pointer}
        .cond-override-row input{margin-top:2px;flex-shrink:0}
        .cond-override-hint{font-size:.82em;color:var(--secondary-text-color);line-height:1.3}
        .notif-row{display:flex;flex-direction:column;gap:3px}
        .notif-svc,.notif-msg,.notif-msg-end{padding:6px 8px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.82em;font-family:inherit}
        .notif-msg,.notif-msg-end{resize:vertical;min-height:80px;line-height:1.4;white-space:pre-wrap;width:100%;box-sizing:border-box}
        .notif-restore,.notif-restore-end{align-self:flex-start;background:none;border:none;color:var(--primary-color,#03a9f4);font-size:.75em;cursor:pointer;padding:2px 0;text-decoration:underline}
        .notif-restore:hover,.notif-restore-end:hover{opacity:.7}
        .notif-trigger-row{display:flex;flex-wrap:wrap;gap:10px;font-size:.78em}
        .notif-trigger-row label{display:flex;align-items:center;gap:4px;cursor:pointer}
        .linked-section{border-top:1px solid var(--divider-color,#eee);padding-top:10px;display:flex;flex-direction:column;gap:6px}
        .linked-hdr{font-size:.78em;font-weight:600;color:var(--primary-text-color)}
        .lo-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--divider-color,#eee);border-radius:8px;background:var(--secondary-background-color,#f5f5f5)}
        .lo-ic{--mdi-icon-size:18px;color:var(--secondary-text-color);flex-shrink:0}
        .lo-meta{display:flex;flex-direction:column;min-width:0;flex:1}
        .lo-name{font-size:.76em;font-weight:600;color:var(--primary-text-color)}
        .lo-id{font-size:.66em;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace}
        .lo-badge{font-size:.6em;font-weight:700;padding:1px 6px;border-radius:6px;flex-shrink:0;text-transform:uppercase}
        .lo-badge.on{background:color-mix(in srgb,#4CAF50 22%,transparent);color:#2e7d32}
        .lo-badge.off{background:color-mix(in srgb,var(--secondary-text-color) 18%,transparent);color:var(--secondary-text-color)}
        .lo-badge.missing{background:color-mix(in srgb,#f44336 18%,transparent);color:#f44336}
        .lo-acts{display:flex;gap:4px;flex-shrink:0}
        .lo-btn{padding:3px 8px;border-radius:7px;border:1px solid var(--primary-color,#03a9f4);background:none;color:var(--primary-color,#03a9f4);cursor:pointer;font-size:.68em;white-space:nowrap}
        .lo-btn:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}
      </style>
      <div class="popup" role="dialog" aria-modal="true">
        <div class="popup-header">
          <span class="popup-title">${ps.mode==='edit'?this.t('popup.edit_schedule'):this.t('popup.new_schedule')}</span>
          <button class="popup-close">✕</button>
        </div>
        ${ps.mode==='edit'?`
        <div class="toggle-row">
          <span class="toggle-label">${this.t('popup.schedule_active')}</span>
          <label class="toggle-switch">
            <input type="checkbox" class="schedule-toggle" ${!ps.isOff?'checked':''}>
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
        </div>`:''}
        ${groupPicker}
        <div>
          <div class="section-label">${this.t('popup.time_slot')}</div>
          <div class="timebar">
            ${bgBlocks.map(b=>`<div class="tb-bg" style="left:${b.left}%;width:${b.width}%;background:${b.color};opacity:.45"></div>`).join('')}
            ${magnetPoints.map(pt=>`<div class="tb-magnet" data-min="${pt}" style="left:${this._minutesToPercent(pt)}%"></div>`).join('')}
            <div class="tb-edit" style="left:${editLeft}%;width:${editWidth}%;background:${editColor}">
              <div class="tb-handle tb-handle-l"></div>
              <span class="tb-label">${timeLabel}</span>
              <div class="tb-handle tb-handle-r"></div>
            </div>
          </div>
          <div class="tb-ticks">${[0,6,12,18,24].map(h=>`<span class="tb-tick">${String(h%24).padStart(2,'0')}:00</span>`).join('')}</div>
          <div class="time-display">${timeLabel}</div>
          <div class="slot-note">${this.t('popup.drag_hint')} <button class="btn-next-slot">${this.t('popup.next_slot')}</button></div>
          <div class="time-inputs-row">
            <div class="time-inp-grp">
              <label class="section-label" style="margin:0 0 2px">${this.t('popup.start')}</label>
              <input type="time" class="time-inp time-inp-start" value="${this._minutesToTime(ps.startMin)}">
            </div>
            <div class="time-inp-grp">
              <label class="section-label" style="margin:0 0 2px">${this.t('popup.end')}</label>
              <input type="time" class="time-inp time-inp-end" value="${this._minutesToTime(ps.endMin===1440?0:ps.endMin)}">
            </div>
          </div>
        </div>
        <div class="snap-row">
          <span class="snap-lbl">${this.t('popup.snap')}</span>
          ${SNAP_OPTIONS.map(s=>`<button class="snap-btn ${s===this._snap?'active':''}" data-snap="${s}">${s}m</button>`).join('')}
        </div>
        <div>
          <div class="section-label">${this.t('popup.days')}</div>
          <div class="shortcuts">
            <button class="shortcut-btn" data-shortcut="all">${this.t('days.all')}</button>
            <button class="shortcut-btn" data-shortcut="workdays">${this.t('days.workdays')}</button>
            <button class="shortcut-btn" data-shortcut="weekend">${this.t('days.weekend')}</button>
          </div>
          <div class="day-chips">
            ${DAY_NAMES.map((d,i)=>`<div class="day-chip ${ps.days.includes(i)?'on':''}" data-day="${i}">${d.slice(0,2)}</div>`).join('')}
          </div>
        </div>
        ${domainSection}
        ${this._endActionHtml(ps)}
        <div>
          <div class="section-label">${this.t('popup.name')}</div>
          <input type="text" class="name-input" value="${ps.name||''}" placeholder="${this.t('popup.name_placeholder')}">
        </div>
        <div class="cond-section">
          <div class="cond-hdr" id="condToggle">
            <span>⚡ ${this.t('popup.conditions')}${ps.conditions.length?` (${ps.conditions.length})`:''}</span>
            <span>${ps._condOpen?'▾':'▸'}</span>
          </div>
          ${condBodyHtml}
        </div>
        <div class="notif-section">
          <div class="notif-hdr" id="notifToggle">
            <span>🔔 ${this.t('popup.notifications')}${ps.notifyService?' ✓':''}</span>
            <span>${ps._notifOpen?'▾':'▸'}</span>
          </div>
          ${ps._notifOpen?`
          <div class="notif-body">
            <div class="notif-row">
              <label class="section-label" style="margin:0 0 3px">${this.t('popup.notify_service_label')}</label>
              ${(() => {
                const notifySvcs = Object.keys(this._hass?.services?.notify || {}).sort().map(s => `notify.${s}`);
                const current = ps.notifyService || '';
                const inList = notifySvcs.includes(current);
                const extra = (current && !inList) ? `<option value="${current.replace(/"/g,'&quot;')}" selected>${current} ⚠</option>` : '';
                const opts = notifySvcs.map(svc => `<option value="${svc}" ${current === svc ? 'selected' : ''}>${svc}</option>`).join('');
                return `<select class="notif-svc"><option value="">-- ${this._lang==='it'?'seleziona':this._lang==='fr'?'sélectionner':'select'} --</option>${extra}${opts}</select>`;
              })()}
            </div>
            <div class="notif-row">
              <label class="section-label" style="margin:0 0 3px">${this.t('notify.trigger_label') || 'Quando notificare'}</label>
              <div class="notif-trigger-row">
                <label><input type="radio" name="notif-trig" value="none" ${ps.notifyTrigger==='none'?'checked':''}> ${this.t('notify.trigger_none') || 'Mai'}</label>
                <label><input type="radio" name="notif-trig" value="start" ${ps.notifyTrigger==='start'?'checked':''}> ${this.t('notify.trigger_start') || "All'inizio"}</label>
                <label><input type="radio" name="notif-trig" value="end" ${ps.notifyTrigger==='end'?'checked':''}> ${this.t('notify.trigger_end') || 'Alla fine'}</label>
                <label><input type="radio" name="notif-trig" value="both" ${ps.notifyTrigger==='both'?'checked':''}> ${this.t('notify.trigger_both') || 'Inizio + fine'}</label>
              </div>
            </div>
            <div class="notif-row notif-msg-start-row" style="${(ps.notifyTrigger==='start' || ps.notifyTrigger==='both') ? '' : 'display:none'}">
              <label class="section-label" style="margin:0 0 3px">${ps.notifyTrigger==='both' ? (this.t('notify.msg_start_label') || 'Messaggio inizio') : (this.t('popup.notify_message_label') || 'Messaggio')}</label>
              <textarea class="notif-msg" rows="5" placeholder="${this.t('notify.default_start')}">${(ps.notifyMessage||'').replace(/</g,'&lt;')}</textarea>
              <button class="notif-restore" style="${(ps.notifyMessage && ps.notifyMessage !== ps._defaultNotifyMsg) ? '' : 'display:none'}">↺ ${this.t('notify.restore_auto') || 'Ripristina testo automatico'}</button>
            </div>
            <div class="notif-row notif-msg-end-row" style="${(ps.notifyTrigger==='end' || ps.notifyTrigger==='both') ? '' : 'display:none'}">
              <label class="section-label" style="margin:0 0 3px">${ps.notifyTrigger==='both' ? (this.t('notify.msg_end_label') || 'Messaggio fine') : (this.t('popup.notify_message_label') || 'Messaggio')}</label>
              <textarea class="notif-msg-end" rows="5" placeholder="${this.t('notify.default_end')}">${(ps.notifyMessageEnd||'').replace(/</g,'&lt;')}</textarea>
              <button class="notif-restore-end" style="${(ps.notifyMessageEnd && ps.notifyMessageEnd !== ps._defaultNotifyMsgEnd) ? '' : 'display:none'}">↺ ${this.t('notify.restore_auto') || 'Ripristina testo automatico'}</button>
            </div>
          </div>`:''}
        </div>
        ${ps.mode==='edit'?this._linkedObjectsHtml(ps):''}
        <div class="popup-footer">
          ${ps.mode==='edit'?`<button class="btn btn-delete">${this.t('popup.delete')}</button>`:''}
          <div class="spacer"></div>
          <button class="btn btn-cancel">${this.t('popup.cancel')}</button>
          <button class="btn btn-save">${this.t('popup.save')}</button>
        </div>
      </div>`;

    this.shadowRoot.appendChild(dlg);
    dlg.showModal();
    this._bindPopupEvents(dlg, ps, magnetPoints);
  }

  _bindPopupEvents(dlg, ps, magnetPoints) {
    dlg.addEventListener('click', e => { if (e.target === dlg) this._closePopup(); });
    dlg.querySelector('.popup-close').addEventListener('click', () => this._closePopup());
    dlg.querySelector('.btn-cancel').addEventListener('click', () => this._closePopup());
    dlg.querySelector('.btn-save').addEventListener('click', () => this._saveSchedule());
    dlg.querySelector('.btn-delete')?.addEventListener('click', () => this._deleteSchedule());

    dlg.querySelectorAll('.lo-btn').forEach(btn => btn.addEventListener('click', async () => {
      const act = btn.dataset.act, val = btn.dataset.val;
      if (act === 'more-info') {
        this._closePopup();
        this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: val }, bubbles: true, composed: true }));
      } else if (act === 'edit-auto') {
        this._closePopup();
        history.pushState(null, '', `/config/automation/edit/${val}`);
        window.dispatchEvent(new Event('location-changed'));
      } else if (act === 'cancel-override') {
        // val = schedule entity id. Reset flag → 'on' (no override) + re-evaluate now.
        const flagEnt = this._overrideFlagEntityId(val);
        const condId = this._getCondAutoId(val);
        // Resolve the condition automation's real entity_id by its id attribute
        // (entity_id derives from alias, not from the config id).
        const condEnt = condId ? Object.values(this._hass.states).find(s => s.entity_id.startsWith('automation.') && s.attributes?.id === condId)?.entity_id : null;
        try { await this._hass.callService('automation', 'turn_on', { entity_id: flagEnt }); } catch (e) { console.error('WSC cancel-override turn_on failed', e); }
        if (condEnt) { try { await this._hass.callService('automation', 'trigger', { entity_id: condEnt }); } catch (e) { console.error('WSC cancel-override trigger failed', e); } }
        this._renderPopup();
      }
    }));

    dlg.querySelector('.btn-next-slot')?.addEventListener('click', () => {
      const newStart=ps.endMin, newEnd=Math.min(ps.endMin+60,1440);
      this._popupState={...ps,mode:'create',entityId:null,startMin:newStart,endMin:newEnd};
      const dlgEl=this.shadowRoot.querySelector('dialog');
      if(dlgEl){dlgEl.close();dlgEl.remove();}
      this._renderPopup();
    });

    dlg.querySelector('.schedule-toggle')?.addEventListener('change', async e => {
      ps.isOff = !e.target.checked;
      await this._toggleSchedule(ps.entityId, e.target.checked);
    });

    dlg.querySelectorAll('.entity-pill').forEach(pill =>
      pill.addEventListener('click', () => {
        const i = parseInt(pill.dataset.ei);
        const newEc = ps.groupEntities[i];
        if (!newEc || newEc.entity === ps.entityConf.entity) return;
        const newDomain = this._detectDomain(newEc.entity);
        ps.entityConf = newEc;
        ps.domain = newDomain;
        // Reset domain-specific action defaults so the form matches the new entity
        ps.enableTemp = newDomain === 'climate';
        ps.enableHvac = false; ps.enablePreset = false; ps.enableFan = false; ps.enableSwing = false;
        ps.hvacMode = ''; ps.presetMode = ''; ps.fanMode = ''; ps.swingMode = '';
        ps.enableBrightness = false;
        ps.enableColor = false; ps.enableSpeed = false; ps.enablePosition = false; ps.coverAction = 'close';
        ps.stopAction = null; ps.stopValue = null;
        // Re-render the whole popup so domainSection + name + notify defaults update
        this._renderPopup();
      })
    );

    dlg.querySelectorAll('.snap-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        this._snap = parseInt(btn.dataset.snap);
        dlg.querySelectorAll('.snap-btn').forEach(b => b.classList.toggle('active', b === btn));
      })
    );

    dlg.querySelectorAll('.day-chip').forEach(chip =>
      chip.addEventListener('click', () => {
        const d = parseInt(chip.dataset.day);
        ps.days = ps.days.includes(d) ? ps.days.filter(x => x !== d) : [...ps.days, d].sort((a,b)=>a-b);
        chip.classList.toggle('on', ps.days.includes(d));
      })
    );

    dlg.querySelectorAll('.shortcut-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const s = btn.dataset.shortcut;
        ps.days = s==='all'?[0,1,2,3,4,5,6]:s==='workdays'?[0,1,2,3,4]:[5,6];
        dlg.querySelectorAll('.day-chip').forEach(c => c.classList.toggle('on', ps.days.includes(parseInt(c.dataset.day))));
        dlg.querySelectorAll('.shortcut-btn').forEach(b => b.classList.toggle('active', b === btn));
      })
    );

    dlg.querySelector('.name-input').addEventListener('input', e => { ps.name = e.target.value; });

    if (ps.domain === 'climate') {
      const eb = dlg.querySelector('.tb-edit');
      const bindChk = (chkSel, fieldSel, key, enableKey, isSelect) => {
        const chk = dlg.querySelector(chkSel);
        const field = dlg.querySelector(fieldSel) || dlg.querySelector(fieldSel.replace('-input','-select')) || dlg.querySelector(fieldSel.replace('-select','-input'));
        if (!chk || !field) return;
        chk.addEventListener('change', () => {
          ps[enableKey] = chk.checked; field.disabled = !chk.checked;
          field.classList.toggle('disabled', !chk.checked);
          field.closest('.param-inline')?.classList.toggle('disabled', !chk.checked);
        });
        const isSel = field.tagName === 'SELECT';
        field.addEventListener(isSel ? 'change' : 'input', () => { ps[key] = field.value; });
      };
      const ts = dlg.querySelector('.temp-slider'), ti = dlg.querySelector('.temp-inp'), ct = dlg.querySelector('.chk-temp');
      const updateTempUI = () => {
        const v = ps.temp;
        const outSlider = v < 5 || v > 35;
        ts.classList.toggle('out-range', outSlider);
        ti.classList.toggle('out-range', outSlider);
        ti.closest('.param-inline')?.classList.toggle('out-range-wrap', outSlider);
        ts.value = String(Math.min(35, Math.max(5, v)));
        ti.value = String(v);
        const eState = this._hass.states[ps.entityConf.entity];
        const haMin = eState?.attributes.min_temp;
        const haMax = eState?.attributes.max_temp;
        let warn = '';
        if (v > 80) {
          warn = `<span class="temp-msg-warn red">${this.t('warnings.temp_very_high')}</span>`;
        } else if (outSlider) {
          if (haMin != null && haMax != null && v >= haMin && v <= haMax) {
            warn = `<span class="temp-msg-warn">${this.t('warnings.out_of_slider_range')} (${haMin}° – ${haMax}°)</span>`;
          } else {
            warn = `<span class="temp-msg-warn">${this.t('warnings.temp_unusual')}</span>`;
          }
        }
        const deviceRange = (haMin != null && haMax != null)
          ? `<span class="temp-msg-range">Range dispositivo: ${haMin}° → ${haMax}°</span>` : '';
        const msgArea = dlg.querySelector('.temp-msg-area');
        if (msgArea) msgArea.innerHTML = warn + deviceRange;
        if (eb) eb.style.backgroundColor = this._tempToColor(v);
      };
      if (ct && ts && ti) {
        ct.addEventListener('change', () => {
          ps.enableTemp = ct.checked;
          ts.disabled = !ct.checked; ti.disabled = !ct.checked;
          ts.closest('.param-inline')?.classList.toggle('disabled', !ct.checked);
          const ma = dlg.querySelector('.temp-msg-area');
          if (ma) ma.style.display = ct.checked ? '' : 'none';
        });
        ts.addEventListener('input', () => { ps.temp = parseFloat(ts.value); updateTempUI(); });
        ti.addEventListener('input', () => {
          const raw = parseFloat(ti.value);
          if (isNaN(raw)) return;
          ps.temp = Math.min(100, raw);
          updateTempUI();
        });
        if (ps.enableTemp) updateTempUI();
      }
      bindChk('.chk-hvac','.hvac-select','hvacMode','enableHvac',true);
      bindChk('.chk-preset','.preset-input','presetMode','enablePreset',false);
      bindChk('.chk-fan','.fan-input','fanMode','enableFan',false);
      bindChk('.chk-swing','.swing-input','swingMode','enableSwing',false);
    } else if (ps.domain === 'light') {
      dlg.querySelectorAll('input[name="light-action"]').forEach(r => r.addEventListener('change', () => { ps.turnOn = r.value === 'on'; }));
      const cb = dlg.querySelector('.chk-brightness'), sb = dlg.querySelector('.brightness-slider'), vb = dlg.querySelector('.brightness-value');
      if (cb && sb) {
        cb.addEventListener('change', () => { ps.enableBrightness=cb.checked; sb.disabled=!cb.checked; sb.closest('.param-inline')?.classList.toggle('disabled',!cb.checked); });
        sb.addEventListener('input', () => { ps.brightness=parseInt(sb.value); if(vb)vb.textContent=`${ps.brightness}%`; });
      }
    } else {
      dlg.querySelectorAll('input[name="switch-action"]').forEach(r => r.addEventListener('change', () => { ps.turnOn = r.value === 'on'; }));
    }
    // Main action extras (light color / fan speed / cover action+position)
    const colChk = dlg.querySelector('.chk-color');
    if (colChk) colChk.addEventListener('change', () => { ps.enableColor = colChk.checked; });
    const spdChk = dlg.querySelector('.chk-speed'), spd = dlg.querySelector('.speed-slider'), spdV = dlg.querySelector('.speed-value');
    if (spdChk && spd) {
      spdChk.addEventListener('change', () => { ps.enableSpeed = spdChk.checked; spd.disabled = !spdChk.checked; spd.closest('.param-inline')?.classList.toggle('disabled', !spdChk.checked); });
      spd.addEventListener('input', () => { ps.speed = parseInt(spd.value); if (spdV) spdV.textContent = `${ps.speed}%`; });
    }
    dlg.querySelectorAll('input[name="cover-action"]').forEach(r => r.addEventListener('change', () => { ps.coverAction = r.value; }));
    const posChk = dlg.querySelector('.chk-position'), pos = dlg.querySelector('.position-slider'), posV = dlg.querySelector('.position-value');
    if (posChk && pos) {
      posChk.addEventListener('change', () => { ps.enablePosition = posChk.checked; pos.disabled = !posChk.checked; pos.closest('.param-inline')?.classList.toggle('disabled', !posChk.checked); });
      pos.addEventListener('input', () => { ps.position = parseInt(pos.value); if (posV) posV.textContent = `${ps.position}%`; });
    }
    // End-of-slot (auto-off) action editor
    dlg.querySelector('.end-act-type')?.addEventListener('change', e => {
      ps.stopAction = e.target.value || null;
      ps.stopValue = ps.stopAction ? this._endActionDefault(ps.stopAction, ps.entityConf.entity) : null;
      this._renderPopup();
    });
    dlg.querySelector('.end-val-num')?.addEventListener('input', e => { ps.stopValue = e.target.value; });
    dlg.querySelector('.end-val-sel')?.addEventListener('change', e => { ps.stopValue = e.target.value; });
    const endRange = dlg.querySelector('.end-val-range');
    if (endRange) endRange.addEventListener('input', e => {
      ps.stopValue = parseInt(e.target.value);
      const pct = dlg.querySelector('.end-val-pct'); if (pct) pct.textContent = `${ps.stopValue}%`;
    });
    if (dlg.querySelector('.color-palette')) {
      this._bindColorPalettes(dlg);
      dlg.querySelectorAll('.end-act-val .pal-swatch').forEach(sw => sw.addEventListener('click', () => { ps.stopValue = sw.dataset.color; }));
      dlg.querySelectorAll('.light-color-pal .pal-swatch').forEach(sw => sw.addEventListener('click', () => { ps.color = sw.dataset.color; }));
    }

    // Conditions
    dlg.querySelector('#condToggle')?.addEventListener('click', () => { ps._condOpen=!ps._condOpen; this._renderPopup(); });
    dlg.querySelector('.cond-add')?.addEventListener('click', () => { ps.conditions.push({entity:'',operator:'>',value:'',attribute:''}); ps._condOpen=true; this._renderPopup(); });
    dlg.querySelectorAll('.cond-del').forEach(btn=>btn.addEventListener('click',()=>{ ps.conditions.splice(parseInt(btn.dataset.ci),1); this._renderPopup(); }));
    dlg.querySelectorAll('.cond-entity').forEach(inp=>inp.addEventListener('change',()=>{
      const i = parseInt(inp.dataset.ci);
      const oldEntity = ps.conditions[i].entity;
      ps.conditions[i].entity = inp.value;
      if (oldEntity !== inp.value) {
        ps.conditions[i].attribute = '';
        ps.conditions[i].value = '';
        // Align operator with new entity's allowed set (avoids stale '>' on boolean entities)
        const newSpec = this._getCondFieldSpec(inp.value, '');
        if (!newSpec.operators.includes(ps.conditions[i].operator)) {
          ps.conditions[i].operator = newSpec.operators[0];
        }
      }
      this._renderPopup();
    }));
    dlg.querySelectorAll('.cond-attribute').forEach(sel=>sel.addEventListener('change',()=>{
      const i = parseInt(sel.dataset.ci);
      ps.conditions[i].attribute = sel.value;
      ps.conditions[i].value = '';
      // Align operator with new attribute's allowed set
      const newSpec = this._getCondFieldSpec(ps.conditions[i].entity, sel.value);
      if (!newSpec.operators.includes(ps.conditions[i].operator)) {
        ps.conditions[i].operator = newSpec.operators[0];
      }
      this._renderPopup();
    }));
    dlg.querySelectorAll('.cond-op').forEach(sel=>sel.addEventListener('change',()=>{ ps.conditions[parseInt(sel.dataset.ci)].operator=sel.value; }));
    dlg.querySelectorAll('.cond-val').forEach(inp=>inp.addEventListener(inp.tagName==='SELECT'?'change':'input',()=>{ ps.conditions[parseInt(inp.dataset.ci)].value=inp.value; }));
    dlg.querySelectorAll('input[name="comb"]').forEach(r=>r.addEventListener('change',()=>{ ps.condCombinator=r.value; }));
    dlg.querySelector('.cond-interval')?.addEventListener('change', e=>{ ps.condInterval=parseInt(e.target.value); });
    dlg.querySelector('.cond-override')?.addEventListener('change', e=>{ ps.overrideEnabled=e.target.checked; });
    // Notifications
    dlg.querySelector('#notifToggle')?.addEventListener('click', () => { ps._notifOpen=!ps._notifOpen; this._renderPopup(); });
    dlg.querySelector('.notif-svc')?.addEventListener('change', e=>{ ps.notifyService=e.target.value; });
    dlg.querySelectorAll('input[name="notif-trig"]').forEach(r => r.addEventListener('change', () => {
      ps.notifyTrigger = r.value;
      this._renderPopup();
    }));
    dlg.querySelector('.notif-restore')?.addEventListener('click', () => {
      ps.notifyMessage = ps._defaultNotifyMsg;
      const inp = dlg.querySelector('.notif-msg');
      if (inp) inp.value = ps.notifyMessage;
      const btn = dlg.querySelector('.notif-restore');
      if (btn) btn.style.display = 'none';
    });
    dlg.querySelector('.notif-restore-end')?.addEventListener('click', () => {
      ps.notifyMessageEnd = ps._defaultNotifyMsgEnd;
      const inp = dlg.querySelector('.notif-msg-end');
      if (inp) inp.value = ps.notifyMessageEnd;
      const btn = dlg.querySelector('.notif-restore-end');
      if (btn) btn.style.display = 'none';
    });
    dlg.querySelector('.notif-msg')?.addEventListener('input', e=>{
      ps.notifyMessage = e.target.value;
      const btn = dlg.querySelector('.notif-restore');
      if (btn) btn.style.display = (ps.notifyMessage !== ps._defaultNotifyMsg && ps.notifyMessage !== '') ? '' : 'none';
    });
    dlg.querySelector('.notif-msg-end')?.addEventListener('input', e=>{
      ps.notifyMessageEnd = e.target.value;
      const btn = dlg.querySelector('.notif-restore-end');
      if (btn) btn.style.display = (ps.notifyMessageEnd !== ps._defaultNotifyMsgEnd && ps.notifyMessageEnd !== '') ? '' : 'none';
    });
    // Time inputs (no snap, exact value)
    const tiStart = dlg.querySelector('.time-inp-start'), tiEnd = dlg.querySelector('.time-inp-end');
    const eb2 = dlg.querySelector('.tb-edit'), td2 = dlg.querySelector('.time-display');
    const syncBar = () => {
      if (!eb2) return;
      eb2.style.left = this._minutesToPercent(ps.startMin) + '%';
      eb2.style.width = this._minutesToPercent(ps.endMin - ps.startMin) + '%';
      const lbl = `${this._minutesToTime(ps.startMin)} – ${this._minutesToTime(ps.endMin)}`;
      const span = eb2.querySelector('.tb-label'); if (span) span.textContent = lbl;
      if (td2) td2.textContent = lbl;
    };
    if (tiStart) tiStart.addEventListener('change', e => {
      const m = this._parseTime(e.target.value);
      if (m >= ps.endMin) { e.target.classList.add('error'); return; }
      e.target.classList.remove('error'); ps.startMin = m; syncBar();
      if (tiEnd) tiEnd.value = this._minutesToTime(ps.endMin === 1440 ? 0 : ps.endMin);
    });
    if (tiEnd) tiEnd.addEventListener('change', e => {
      let m = this._parseTime(e.target.value); if (m === 0) m = 1440;
      if (m <= ps.startMin) { e.target.classList.add('error'); return; }
      e.target.classList.remove('error'); ps.endMin = m; syncBar();
      if (tiStart) tiStart.value = this._minutesToTime(ps.startMin);
    });

    this._setupTimebarDrag(dlg, ps, magnetPoints);

    // Auto-refresh default notify message + schedule name when popup state changes
    const refreshAll = () => { this._refreshNotifyDefault(dlg); this._refreshNameDefault(dlg); };
    dlg.addEventListener('input', refreshAll);
    dlg.addEventListener('change', refreshAll);
    dlg.querySelectorAll('.day-chip,.shortcut-btn').forEach(el => el.addEventListener('click', () => setTimeout(refreshAll, 0)));
  }

  _setupTimebarDrag(dlg, ps, magnetPoints) {
    const bar = dlg.querySelector('.timebar'), eb = dlg.querySelector('.tb-edit'), td = dlg.querySelector('.time-display');
    if (!bar || !eb) return;
    let dragType = null, startX, s0, e0;
    const mms = [...dlg.querySelectorAll('.tb-magnet')];
    const hl = eb.querySelector('.tb-handle-l'), hr = eb.querySelector('.tb-handle-r');

    const getThreshMin = () => { const w=bar.getBoundingClientRect().width; return w>0?10/w*1440:20; };
    const hilite = (...vs) => {
      const thr = getThreshMin();
      mms.forEach(m => m.classList.toggle('near', vs.some(v=>Math.abs(v-parseFloat(m.dataset.min))<thr)));
    };
    const setHandleColor = (handle, min) => {
      if (!handle) return;
      const thr = getThreshMin();
      const mag = magnetPoints.some(p => Math.abs(min - p) < thr);
      handle.style.setProperty('--handle-color', mag ? 'var(--primary-color,#03a9f4)' : 'rgba(255,255,255,.75)');
    };
    const upd = () => {
      const lbl = `${this._minutesToTime(ps.startMin)} – ${this._minutesToTime(ps.endMin)}`;
      eb.style.left = this._minutesToPercent(ps.startMin)+'%';
      eb.style.width = this._minutesToPercent(ps.endMin-ps.startMin)+'%';
      const span = eb.querySelector('.tb-label'); if (span) span.textContent = lbl;
      if (td) td.textContent = lbl;
      // sync time inputs
      const tiS = dlg.querySelector('.time-inp-start'), tiE = dlg.querySelector('.time-inp-end');
      if (tiS) tiS.value = this._minutesToTime(ps.startMin);
      if (tiE) tiE.value = this._minutesToTime(ps.endMin === 1440 ? 0 : ps.endMin);
    };

    const magSnap = (m, pts) => {
      const thr = getThreshMin();
      let closest = null, dist = thr;
      for (const pt of pts) { const d = Math.abs(m - pt); if (d < dist) { dist = d; closest = pt; } }
      return closest !== null ? closest : this._snapToGrid(m);
    };

    eb.addEventListener('pointerdown', e => {
      e.preventDefault();
      const path = e.composedPath();
      dragType = path.includes(hl)?'rs':path.includes(hr)?'re':'mv';
      startX=e.clientX; s0=ps.startMin; e0=ps.endMin;
      eb.setPointerCapture(e.pointerId);
    });
    eb.addEventListener('pointermove', e => {
      if (!dragType) return;
      const w = bar.getBoundingClientRect().width; if (!w) return;
      const dx = ((e.clientX-startX)/w)*1440, mn = this._snap;
      if (dragType==='mv') {
        const dur=e0-s0, raw=s0+dx;
        const ss=magSnap(raw,magnetPoints), se=magSnap(raw+dur,magnetPoints)-dur;
        let ns = Math.abs(ss-raw)<=Math.abs(se-raw)?ss:se;
        ns=Math.max(0,Math.min(1440-dur,ns)); ps.startMin=ns; ps.endMin=ns+dur;
        hilite(ps.startMin,ps.endMin); setHandleColor(hl,ps.startMin); setHandleColor(hr,ps.endMin);
      } else if (dragType==='rs') {
        ps.startMin=Math.max(0,Math.min(ps.endMin-mn,magSnap(s0+dx,magnetPoints)));
        hilite(ps.startMin); setHandleColor(hl,ps.startMin);
      } else {
        ps.endMin=Math.max(ps.startMin+mn,Math.min(1440,magSnap(e0+dx,magnetPoints)));
        hilite(ps.endMin); setHandleColor(hr,ps.endMin);
      }
      upd();
    });
    const stop = () => {
      dragType=null; mms.forEach(m=>m.classList.remove('near'));
      if (hl) hl.style.removeProperty('--handle-color');
      if (hr) hr.style.removeProperty('--handle-color');
      this._refreshNotifyDefault(dlg);
      this._refreshNameDefault(dlg);
    };
    eb.addEventListener('pointerup', stop);
    eb.addEventListener('pointercancel', stop);
  }

  // ── Save / Delete ─────────────────────────────────────────────────────────

  _checkOverlap(ps) {
    const profile = this._getSelectedProfile();
    const profileIds = new Set(profile?.schedules || []);
    for (const s of this._getSchedules(ps.entityConf.entity)) {
      if (ps.mode==='edit' && s.entity_id===ps.entityId) continue;
      if (profileIds.size && !profileIds.has(s.entity_id)) continue;
      const shared = ps.days.filter(di => this._appliesToDay(s.attributes.weekdays||[], di));
      if (!shared.length) continue;
      for (const slot of s.attributes.timeslots||[]) {
        const [a,b]=slot.split(' - '); const sMin=this._parseTime(a); let eMin=this._parseTime(b); if(eMin===0)eMin=1440;
        if (ps.startMin<eMin && ps.endMin>sMin) {
          const ename = ps.entityConf.name || ps.entityConf.entity;
          return `⚠️ ${this.t('errors.overlap')} (${a} - ${b} → ${ename}).`;
        }
      }
    }
    return null;
  }

  async _saveSchedule() {
    const ps = this._popupState;
    if (!ps?.days.length) { await this._alert(this.t('errors.no_days')); return; }
    const overlap = this._checkOverlap(ps);
    if (overlap) { await this._alert(overlap); return; }

    const weekdays = ps.days.map(d => this._getDayKey(d));
    const eid = ps.entityConf.entity;
    const dom = ps.domain;
    // Build actions using shared helper (climate: one action per service — preset/fan/swing each need their own)
    const built = this._buildScheduleActions(ps);
    // Scheduler component expects {entity_id, service, service_data} (no `target` wrapping)
    const actions = built.map(a => ({ entity_id: eid, service: a.service, service_data: a.data || {} }));
    const timeslots = [{ start: this._minutesToTime(ps.startMin), stop: this._minutesToTime(ps.endMin === 1440 ? 0 : ps.endMin), actions }];

    const saveNotify = (scheduleId) => {
      const profile = this._getSelectedProfile(); if (!profile) return;
      if (!profile.scheduleLinks) profile.scheduleLinks = [];
      let link = profile.scheduleLinks.find(l => l.id === scheduleId);
      if (!link) { link = { id: scheduleId }; profile.scheduleLinks.push(link); }
      link.notifyService = ps.notifyService;
      link.notifyMessage = ps.notifyMessage;
      link.notifyMessageEnd = ps.notifyMessageEnd;
      link.notifyTrigger = ps.notifyTrigger || 'start';
      link.stopAction = ps.stopAction || null;
      link.stopValue = ps.stopValue;
    };

    try {
      if (ps.mode === 'create') {
        const beforeIds = new Set(Object.keys(this._hass.states).filter(k => k.startsWith('switch.schedule_')));
        const p = { weekdays, timeslots, repeat_type: 'repeat' };
        if (ps.name) p.name = ps.name;
        await this._hass.callService('scheduler', 'add', p);
        const newId = await this._waitForNewSchedule(beforeIds);
        if (newId) {
          await this._addScheduleToProfile(newId);
          saveNotify(newId);
          await this._syncAutoOffAutomation(newId, ps);
          await this._syncConditionAutomation(newId, ps.conditions, ps.condCombinator, ps.condInterval, ps);
          await this._syncOverrideFlag(newId, ps);
          await this._persistExtras(newId, ps);
          await this._syncExtrasAutomation(newId, ps);
          await this._syncNotifyAutomation(newId, ps);
          const prof = this._getSelectedProfile();
          if (prof && !this._isProfileActive(prof)) {
            try { await this._hass.callService('switch', 'turn_off', { entity_id: newId }); } catch {}
          }
        }
      } else {
        const p = { entity_id: ps.entityId, weekdays, timeslots };
        if (ps.name) p.name = ps.name;
        await this._hass.callService('scheduler', 'edit', p);
        saveNotify(ps.entityId);
        await this._syncAutoOffAutomation(ps.entityId, ps);
        await this._syncConditionAutomation(ps.entityId, ps.conditions, ps.condCombinator, ps.condInterval, ps);
        await this._syncOverrideFlag(ps.entityId, ps);
        await this._persistExtras(ps.entityId, ps);
        await this._syncExtrasAutomation(ps.entityId, ps);
        await this._syncNotifyAutomation(ps.entityId, ps);
      }
    } catch (e) { await this._alert(`${this.t('errors.save_failed')}: ${e.message || e}`); return; }
    await this._wsSet(this._storageData).catch(() => {});
    this._closePopup();
  }

  async _deleteSchedule() {
    const ps = this._popupState;
    if (!ps || ps.mode !== 'edit') return;
    if (!await this._confirm(this.t('errors.delete_confirm'))) return;
    const eid = ps.entityId;
    const childId = this._getAutoChildId(eid);
    const condAutoId = this._getCondAutoId(eid);
    const extrasAutoId = this._getExtrasAutoId(eid);
    const notifyAutoId = this._getNotifyAutoId(eid);
    const autoOffAutoId = this._getAutoOffAutoId(eid);
    const overrideFlagId = this._getOverrideFlagId(eid);
    const data = this._storageData;
    for (const p of data.profiles || []) {
      p.schedules = (p.schedules || []).filter(x => x !== eid);
      p.scheduleLinks = (p.scheduleLinks || []).filter(l => l.id !== eid);
    }
    if (condAutoId) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${condAutoId}`); } catch (e) { console.error('WSC condAuto delete failed', e); }
    }
    if (extrasAutoId) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${extrasAutoId}`); } catch (e) { console.error('WSC extrasAuto delete failed', e); }
    }
    if (notifyAutoId) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${notifyAutoId}`); } catch (e) { console.error('WSC notifyAuto delete failed', e); }
    }
    if (autoOffAutoId) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${autoOffAutoId}`); } catch (e) { console.error('WSC autoOff delete failed', e); }
    }
    if (overrideFlagId) {
      try { await this._hass.callApi('DELETE', `config/automation/config/${overrideFlagId}`); } catch (e) { console.error('WSC overrideFlag delete failed', e); }
    }
    if (childId) {
      try { await this._hass.callService('scheduler', 'remove', { entity_id: childId }); } catch {}
    }
    try { await this._hass.callService('scheduler', 'remove', { entity_id: eid }); } catch (e) { console.error(e); }
    await this._wsSet(data);
    this._closePopup();
  }

  // ── Profiles view ─────────────────────────────────────────────────────────

  _isProfileActive(p) {
    return (this._storageData?.activeProfiles || []).includes(p.id);
  }

  _getProfileColor(p) {
    return p.groups?.[0]?.color || '#03a9f4';
  }

  async _activateProfile(id) {
    const data = this._storageData;
    const profiles = data.profiles || [];
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    let activeProfiles = [...(data.activeProfiles || [])];
    if (p.exclusive !== false) {
      for (const cp of profiles.filter(x => x.id !== id && x.exclusive !== false && activeProfiles.includes(x.id))) {
        for (const eid of cp.schedules || [])
          try { await this._hass.callService('switch', 'turn_off', { entity_id: eid }); } catch {}
        activeProfiles = activeProfiles.filter(x => x !== cp.id);
      }
      const profSched = new Set([
        ...profiles.flatMap(pr => pr.schedules || []),
        ...profiles.flatMap(pr => (pr.scheduleLinks || []).map(l => l.autoChildId).filter(Boolean)),
      ]);
      for (const s of Object.values(this._hass.states))
        if (s.entity_id.startsWith('switch.schedule_') && !profSched.has(s.entity_id) && s.state !== 'off')
          try { await this._hass.callService('switch', 'turn_off', { entity_id: s.entity_id }); } catch {}
    }
    for (const eid of p.schedules || [])
      try { await this._hass.callService('switch', 'turn_on', { entity_id: eid }); } catch {}
    for (const link of p.scheduleLinks || [])
      if (link.autoChildId)
        try { await this._hass.callService('switch', 'turn_on', { entity_id: link.autoChildId }); } catch {}
    if (!activeProfiles.includes(id)) activeProfiles.push(id);
    await this._wsSet({ ...data, activeProfiles });
    this.render();
  }

  async _deactivateProfile(id) {
    const data = this._storageData;
    const p = (data.profiles || []).find(x => x.id === id);
    if (!p) return;
    for (const eid of p.schedules || [])
      try { await this._hass.callService('switch', 'turn_off', { entity_id: eid }); } catch {}
    const activeProfiles = (data.activeProfiles || []).filter(x => x !== id);
    await this._wsSet({ ...data, activeProfiles });
    this.render();
  }

  async _deleteProfile(id) {
    if (id === 'default') return;
    if (!await this._confirm(this.t('errors.delete_profile_confirm'))) return;
    const data = this._storageData;
    const p = (data.profiles || []).find(x => x.id === id);
    if (p) {
      // Remove linked auto-off children + condition/extras automations first (mirrors _deleteSchedule)
      for (const link of p.scheduleLinks || []) {
        if (link.condAutoId)
          try { await this._hass.callApi('DELETE', `config/automation/config/${link.condAutoId}`); } catch (e) { console.error('WSC condAuto delete failed', e); }
        if (link.extrasAutoId)
          try { await this._hass.callApi('DELETE', `config/automation/config/${link.extrasAutoId}`); } catch (e) { console.error('WSC extrasAuto delete failed', e); }
        if (link.notifyAutoId)
          try { await this._hass.callApi('DELETE', `config/automation/config/${link.notifyAutoId}`); } catch (e) { console.error('WSC notifyAuto delete failed', e); }
        if (link.autoOffAutoId)
          try { await this._hass.callApi('DELETE', `config/automation/config/${link.autoOffAutoId}`); } catch (e) { console.error('WSC autoOff delete failed', e); }
        if (link.overrideFlagAutoId)
          try { await this._hass.callApi('DELETE', `config/automation/config/${link.overrideFlagAutoId}`); } catch (e) { console.error('WSC overrideFlag delete failed', e); }
        if (link.autoChildId)
          try { await this._hass.callService('scheduler', 'remove', { entity_id: link.autoChildId }); } catch {}
      }
      for (const eid of p.schedules || [])
        try { await this._hass.callService('scheduler', 'remove', { entity_id: eid }); } catch {}
    }
    const profiles = (data.profiles || []).filter(x => x.id !== id);
    const activeProfiles = (data.activeProfiles || []).filter(x => x !== id);
    if (this._selectedProfileId === id)
      this._selectedProfileId = activeProfiles[0] || profiles[0]?.id || null;
    await this._wsSet({ ...data, profiles, activeProfiles });
    this.render();
  }

  async _renameProfile(id) {
    const profiles=this._storageData.profiles||[];
    const p=profiles.find(x=>x.id===id); if(!p) return;
    const name=await this._prompt(this.t('profile.rename'),p.name);
    if(!name?.trim()) return;
    await this._wsSet({...this._storageData,profiles:profiles.map(x=>x.id===id?{...x,name:name.trim()}:x)});
    this.render();
  }
  async _duplicateProfile(id) {
    const profiles = this._storageData.profiles || [];
    const src = profiles.find(x => x.id === id);
    if (!src) return;
    const name = await this._prompt(this.t('profile.duplicate'), `${src.name} (copy)`);
    if (!name?.trim()) return;
    const newId = `prf_${Date.now()}`;
    const newProfile = {
      id: newId, name: name.trim(), exclusive: src.exclusive,
      groups: JSON.parse(JSON.stringify(src.groups || [])),
      schedules: [], scheduleLinks: [],
    };
    await this._wsSet({ ...this._storageData, profiles: [...profiles, newProfile] });
    const prevSelectedId = this._selectedProfileId;
    this._selectedProfileId = newId;
    // Recreate schedules on Scheduler Component
    for (const schedId of src.schedules || []) {
      const s = this._hass.states[schedId];
      if (!s?.attributes.weekdays || !s.attributes.timeslots?.length) continue;
      if (s.attributes.tags?.includes('weekly_schedule_auto')) continue; // skip auto-children
      try {
        const beforeIds = new Set(Object.keys(this._hass.states).filter(k => k.startsWith('switch.schedule_')));
        const params = { weekdays: s.attributes.weekdays, timeslots: s.attributes.timeslots, repeat_type: 'repeat' };
        if (s.attributes.friendly_name) params.name = s.attributes.friendly_name;
        await this._hass.callService('scheduler', 'add', params);
        const newSchedId = await this._waitForNewSchedule(beforeIds);
        if (newSchedId) await this._addScheduleToProfile(newSchedId);
      } catch (e) { console.error('Duplicate schedule failed', schedId, e); }
    }
    this._selectedProfileId = prevSelectedId;
    this.render();
  }

  // ── Compact view ──────────────────────────────────────────────────────────

  _buildCompactView(tab, DAYS) {
    const todayIdx = (new Date().getDay() + 6) % 7;
    if (!this._compactExpanded) this._compactExpanded = new Set([todayIdx]);
    const ents = tab.entities || (tab.entity ? [tab] : []);

    const daysHtml = DAYS.map((dayName, di) => {
      const isToday = di === todayIdx;
      const expanded = this._compactExpanded.has(di);

      // Entities with at least one schedule on this day (preserving original index)
      const entsWithSched = ents.reduce((acc, ec, ei) => {
        if (this._getProfileSchedules(ec.entity).some(s => this._appliesToDay(s.attributes.weekdays||[], di)))
          acc.push({ ec, ei });
        return acc;
      }, []);

      // Mini timeline (replaces dots in collapsed day header)
      const visibleEnts = entsWithSched.slice(0, 4);
      const laneCount = Math.max(1, visibleEnts.length);
      const miniBars = visibleEnts.map(({ ec }, li) => {
        const [, defColor] = this._domainIconMdi(ec.entity);
        const color = ec.color || defColor;
        const blocks = this._getBlocksForDay(di, this._getProfileSchedules(ec.entity), ec);
        const top = (100 / laneCount) * li;
        const h = 100 / laneCount;
        return blocks.map(b =>
          `<div class="compact-mini-bar" style="left:${b.startPct}%;width:${b.heightPct}%;top:${top}%;height:${h}%;background:${color};opacity:${b.isOff?.35:.75}"></div>`
        ).join('');
      }).join('');

      const barColor = isToday ? 'var(--primary-color,#03a9f4)' : 'var(--divider-color,#e0e0e0)';
      const nameColor = isToday ? 'var(--primary-text-color)' : 'var(--secondary-text-color)';

      const hdr = `<div class="compact-day-hdr" data-day="${di}">
        <div class="compact-day-bar" style="background:${barColor}"></div>
        <span class="compact-day-name" style="color:${nameColor}">${dayName.toUpperCase().slice(0,3)}</span>
        <div class="compact-mini-timeline">${miniBars}</div>
        <ha-icon icon="${expanded?'mdi:chevron-up':'mdi:chevron-down'}" style="--mdi-icon-size:16px;color:var(--secondary-text-color)"></ha-icon>
      </div>`;

      if (!expanded) {
        return `<div class="compact-day-wrap${isToday?' compact-today-wrap':''}" data-day="${di}">${hdr}</div>`;
      }

      // Entity rows
      const entRowsHtml = entsWithSched.map(({ ec, ei }, rowIdx) => {
        const [icon, defColor] = this._domainIconMdi(ec.entity);
        const color = ec.color || defColor;
        const blocks = this._getBlocksForDay(di, this._getProfileSchedules(ec.entity), ec);

        const blocksHtml = blocks.map(b => {
          const glowStyle = b.isActive ? `;--cblk-glow:${b.color};--cblk-glow-soft:${b.color}80` : '';
          const showContent = b.heightPct > 4;
          return `<div class="compact-blk${b.isOff?' off':''}${b.isActive?' active':''}${b.isMuted?' muted':''}" data-entity="${b.entityId}" data-day="${di}" style="left:${b.startPct}%;width:${b.heightPct}%;background-color:${b.color}${glowStyle}">` +
            (showContent ? `<ha-icon icon="${icon}" style="--mdi-icon-size:10px;color:white;opacity:.9;flex-shrink:0"></ha-icon><span class="compact-blk-val">${b.label||''}</span>` : '') +
            `</div>`;
        }).join('');

        return `<div class="compact-ent-row${rowIdx>0?' compact-ent-sep':''}" data-day="${di}" data-ei="${ei}" data-entity-id="${ec.entity}">
          <div class="compact-ent-icon" style="background:${color}26">
            <ha-icon icon="${icon}" style="--mdi-icon-size:18px;color:${color}E6"></ha-icon>
          </div>
          <span class="compact-ent-name">${(ec.name||ec.entity).replace(/</g,'&lt;')}</span>
          <div class="compact-bar" data-day="${di}" data-ei="${ei}" data-entity-id="${ec.entity}" style="position:relative;flex:1;height:32px;background:var(--divider-color,#e0e0e0);border-radius:6px;overflow:hidden;cursor:pointer">
            ${blocksHtml}
          </div>
        </div>`;
      }).join('');

      // Ticks (only if there are entity rows)
      const ticksHtml = entsWithSched.length > 0 ? `<div class="compact-ticks">
        ${[0,6,12,18].map(h=>`<div class="compact-tick" style="left:${(h/24)*100}%">${String(h).padStart(2,'0')}</div>`).join('')}
      </div>` : '';

      const emptyHtml = entsWithSched.length === 0 ? `<div style="padding:6px 0;font-size:.75em;color:var(--secondary-text-color);opacity:.6">${this.t('card.empty_schedule')}</div>` : '';

      return `<div class="compact-day-wrap${isToday?' compact-today-wrap':''}" data-day="${di}">
        ${hdr}
        <div class="compact-day-content">
          ${entRowsHtml}${emptyHtml}${ticksHtml}
        </div>
      </div>`;
    }).join('');

    return `<div class="compact-days">
      ${daysHtml}
    </div>`;
  }

  // ── Focus view ────────────────────────────────────────────────────────────

  _buildFocusView(tab, DAYS, H) {
    const todayIdx = (new Date().getDay() + 6) % 7;
    if (this._focusDay === null) this._focusDay = todayIdx;
    const focusDay = this._focusDay;
    const ents = tab.entities || (tab.entity ? [tab] : []);

    // Axis labels every 2h (00, 02 ... 22)
    const axisLabels = [];
    for (let h = 0; h < 24; h += 2)
      axisLabels.push({ label: String(h).padStart(2,'0'), pct: (h/24)*100 });

    // Threshold percentages for block content (based on px at height H)
    const minForFull    = (48 / H) * 100;
    const minForContent = (32 / H) * 100;
    const minForValue   = (20 / H) * 100;

    // Per-entity blocks for today → lane calculation
    const entBlocksForDay = ents.map(ec =>
      this._getBlocksForDay(focusDay, this._getProfileSchedules(ec.entity), ec)
    );
    // Build lane map: only entities with blocks get a lane (consecutive, max 4)
    const laneMap = new Map();
    ents.forEach((_, ei) => {
      if (entBlocksForDay[ei].length > 0 && laneMap.size < 4) laneMap.set(ei, laneMap.size);
    });
    const numLanes = Math.max(1, laneMap.size);

    // Focus column: blocks with entity index for lane positioning
    const allFocusBlocks = ents.flatMap((ec, ei) => {
      const [icon, defColor] = this._domainIconMdi(ec.entity);
      const entColor = ec.color || defColor;
      return entBlocksForDay[ei].map(b => ({ ...b, icon, entityName: ec.name || ec.entity, entIdx: ei, entColor }));
    });

    // Lane headers (shown when numLanes > 1)
    const laneHeadersHtml = numLanes > 1
      ? `<div class="focus-lane-hdrs">${[...laneMap.entries()].map(([ei, li]) => {
          const ec = ents[ei];
          const [, defColor] = this._domainIconMdi(ec.entity);
          const color = ec.color || defColor;
          const name = (ec.name || ec.entity).replace(/</g,'&lt;');
          const label = name.length > 8 ? name.slice(0,7) + '…' : name;
          return `<div class="focus-lane-hdr" style="left:${li * 100 / numLanes}%;width:${100 / numLanes}%">` +
            `<div class="focus-lane-dot" style="background:${color}"></div><span>${label}</span></div>`;
        }).join('')}</div>`
      : '';

    const focusBlocksHtml = allFocusBlocks.map(b => {
      const laneIdx = laneMap.get(b.entIdx) ?? 0;
      const lanePct = 100 / numLanes;
      const posStyle = numLanes > 1
        ? `left:calc(${laneIdx * lanePct}% + 2px);width:calc(${lanePct}% - 4px);right:auto`
        : `left:4px;right:4px`;
      const glowStyle = b.isActive ? `;--fblk-glow:${b.color};--fblk-glow-soft:${b.color}80` : '';
      const content = b.heightPct >= minForFull
        ? `<ha-icon icon="${b.icon}" style="--mdi-icon-size:14px;color:white;opacity:.9;flex-shrink:0"></ha-icon>` +
          `<div class="focus-blk-info">` +
            `<span class="focus-blk-name">${(b.entityName).replace(/</g,'&lt;')}</span>` +
            `<span class="focus-blk-val">${(b.label||'').replace(/</g,'&lt;')}</span>` +
          `</div>`
        : b.heightPct >= minForContent
          ? `<ha-icon icon="${b.icon}" style="--mdi-icon-size:14px;color:white;opacity:.9;flex-shrink:0"></ha-icon>` +
            `<span class="focus-blk-val">${(b.label||'').replace(/</g,'&lt;')}</span>`
          : b.heightPct >= minForValue
            ? `<span class="focus-blk-val">${(b.label||'').replace(/</g,'&lt;')}</span>`
            : '';
      return `<div class="focus-blk${b.isOff?' off':''}${b.isActive?' active':''}${b.isMuted?' muted':''}" data-entity="${b.entityId}" style="top:${b.startPct}%;height:${b.heightPct}%;background-color:${b.color}${glowStyle};min-height:20px;${posStyle}">${content}</div>`;
    }).join('');

    // CSS grid column template: axis fixed, focus day gets max 45%, slims share rest equally
    const cardWidth = this.offsetWidth || 400;
    const isMobile = cardWidth < 400;
    const focusMax = isMobile ? '50%' : '45%';
    const slimMin = isMobile ? '24px' : '28px';
    const gridCols = ['36px'];
    for (let i = 0; i < 7; i++)
      gridCols.push(i === focusDay ? `minmax(50px,${focusMax})` : `minmax(${slimMin},1fr)`);
    const gridTemplate = gridCols.join(' ');

    // Build all 7 columns
    const colsHtml = DAYS.map((dayName, di) => {
      const isToday = di === todayIdx;
      const isFocus = di === focusDay;

      if (isFocus) {
        const hdrColor = isToday ? 'var(--primary-color,#03a9f4)' : 'var(--primary-text-color)';
        return `<div class="focus-col focus-col--active" data-day="${di}">
          <div class="focus-col-hdr" style="color:${hdrColor}">${dayName}</div>
          ${laneHeadersHtml}
          <div class="focus-col-body" data-day="${di}">${focusBlocksHtml}</div>
        </div>`;
      }

      // Slim column — entity bars
      const N = Math.min(ents.length, 4);
      const barW = N <= 1 ? 8 : 6;
      const totalW = N * barW + Math.max(0, N - 1) * 2;
      const slimPx = isMobile ? 24 : 28;
      const leftStart = Math.max(0, (slimPx - totalW) / 2);

      const barsHtml = ents.slice(0, 4).map((ec, ei) => {
        const [, defColor] = this._domainIconMdi(ec.entity);
        const color = ec.color || defColor;
        const blocks = this._getBlocksForDay(di, this._getProfileSchedules(ec.entity), ec);
        const left = leftStart + ei * (barW + 2);
        return blocks.map(b =>
          `<div class="focus-slim-bar${b.isOff?' off':''}" style="left:${left}px;width:${barW}px;top:${b.startPct}%;height:${b.heightPct}%;background:${color};opacity:${b.isOff?'.35':'.75'}"></div>`
        ).join('');
      }).join('');

      const nameColor = isToday ? 'var(--primary-color,#03a9f4)' : 'var(--secondary-text-color)';
      const shortName = dayName.slice(0,2);
      return `<div class="focus-slim" data-day="${di}">
        <div class="focus-slim-hdr" style="color:${nameColor}">${shortName}</div>
        <div class="focus-slim-body">${barsHtml}</div>
      </div>`;
    }).join('');

    const axisHtml = axisLabels.map(({label, pct}) =>
      `<div class="focus-axis-tick" style="top:${pct}%">${label}</div>`
    ).join('');

    return `<div class="focus-wrap">
      <div class="focus-container" style="height:${H}px;grid-template-columns:${gridTemplate}">
        <div class="focus-axis">
          <div class="focus-axis-spacer"></div>
          <div class="focus-axis-body">${axisHtml}</div>
        </div>
        ${colsHtml}
      </div>
    </div>`;
  }

  // ── Groups view ───────────────────────────────────────────────────────────

  // CSS regole comuni a _renderGroupsView e _renderGroupEditView.
  // Mantenute in un unico posto per evitare drift tra le due viste.
  _groupSharedStyles() {
    return `
      :host{display:block;font-family:var(--primary-font-family,sans-serif)}
      ha-card{padding:16px}
      .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
      .card-title{font-size:1.1em;font-weight:500;color:var(--primary-text-color)}
      .btn-back{padding:6px 14px;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:none;cursor:pointer;font-size:.8em;color:var(--primary-text-color)}
      .btn-back:hover{background:var(--divider-color,#e0e0e0)}
      .form{border:1px dashed var(--divider-color,#ccc);border-radius:10px;padding:14px}
      .form-row{margin-bottom:12px}
      .form-label{font-size:.78em;font-weight:600;color:var(--secondary-text-color);margin-bottom:6px}
      .form-input{width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.85em;box-sizing:border-box;font-family:inherit}
      .form-input:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
      .color-lbl{font-size:.78em;color:var(--secondary-text-color);margin-bottom:4px;display:block}
      .color-palette{display:flex;flex-wrap:wrap;gap:5px;padding:4px 0}
      .pal-swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;box-sizing:border-box;outline:1px solid rgba(0,0,0,.1);transition:transform .1s}
      .pal-swatch:hover{transform:scale(1.15)}
      .pal-swatch.sel{border-color:var(--primary-text-color,#333);box-shadow:0 0 0 2px var(--card-background-color,white),0 0 0 4px var(--primary-text-color,#333)}
      .domain-filter{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
      .dom-btn{padding:3px 10px;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:none;cursor:pointer;font-size:.72em;color:var(--primary-text-color)}
      .dom-btn.active{background:var(--primary-color,#03a9f4);color:white;border-color:var(--primary-color,#03a9f4)}
      .ent-search{width:100%;padding:6px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);font-size:.82em;box-sizing:border-box;font-family:inherit;margin-bottom:8px}
      .ent-search:focus{outline:none;border-color:var(--primary-color,#03a9f4)}
      .ent-list{display:flex;flex-direction:column;gap:4px;max-height:320px;overflow-y:auto}
      .ent-item{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);cursor:default;user-select:none}
      .ent-item.sel{border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}
      .ent-row-top{display:flex;align-items:center;gap:8px;width:100%;cursor:pointer}
      .ent-item .color-palette{display:none;padding:2px 0}
      .ent-item.sel .color-palette{display:flex}
      .dom-badge{font-size:.62em;font-weight:700;padding:1px 6px;border-radius:6px;color:white;flex-shrink:0;min-width:44px;text-align:center}
      .dom-climate{background:#FF7043}.dom-switch{background:#42A5F5}.dom-light{background:#F9A825}.dom-fan{background:#26C6DA}.dom-cover{background:#AB47BC}
      .ent-name{flex:1;font-size:.83em;color:var(--primary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ent-label-inp{padding:4px 8px;border-radius:6px;border:1px solid var(--divider-color,#ccc);font-size:.78em;color:var(--primary-text-color);background:var(--card-background-color,#fff);font-family:inherit;width:80px;flex-shrink:0}`;
  }

  _renderGroupEditView(group) {
    this._groupsMode=true; this._profilesMode=false;
    const availableEnts=this._getAvailableEntities();
    const domains=[...new Set(availableEnts.map(e=>e.domain))];
    const S = this._groupSharedStyles() + `
      .ge-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
      .btn-save-ge{background:var(--primary-color,#03a9f4);color:white;padding:8px 18px;border-radius:10px;border:none;cursor:pointer;font-size:.85em;font-weight:600}
      .btn-cancel-ge{background:var(--divider-color,#e0e0e0);color:var(--primary-text-color);padding:8px 18px;border-radius:10px;border:none;cursor:pointer;font-size:.85em;font-weight:600}
      .btn-del-ge{background:none;border:1px solid var(--error-color,#f44336);color:var(--error-color,#f44336);padding:7px 16px;border-radius:10px;cursor:pointer;font-size:.85em;font-weight:600;margin-left:auto}`;

    this._setStyles('group-edit', S);
    const root = this._ensureRoot();
    root.innerHTML=`<ha-card>
      <div class="card-header"><span class="card-title">Edit: ${group.name.replace(/</g,'&lt;')}</span><button class="btn-back">← Back</button></div>
      <div class="form">
        <div class="form-row"><div class="form-label">${this.t('group.name')}</div><input type="text" class="form-input grp-name-inp" value="${group.name.replace(/"/g,'&quot;')}"></div>
        <div class="form-row">
          <span class="color-lbl">Tab color</span>
          ${this._colorPickerHTML(group.color||'#9C27B0','group-pal')}
        </div>
        <div class="form-row">
          <div class="form-label">Select entities</div>
          <div class="domain-filter">
            <button class="dom-btn active" data-domain="">All</button>
            ${domains.map(d=>`<button class="dom-btn" data-domain="${d}">${d.charAt(0).toUpperCase()+d.slice(1)}</button>`).join('')}
          </div>
          <input type="text" class="ent-search" placeholder="Search entity…">
          <div class="ent-list">
            ${availableEnts.map(e=>{
              const pre=(group.entities||[]).find(x=>x.entity===e.entity_id);
              return `<div class="ent-item${pre?' sel':''}" data-entity="${e.entity_id}" data-domain="${e.domain}" data-name="${e.friendly_name.toLowerCase().replace(/"/g,'')}">
                <div class="ent-row-top">
                  <input type="checkbox" class="ent-chk" data-entity="${e.entity_id}"${pre?' checked':''}>
                  <span class="dom-badge dom-${e.domain}">${e.domain}</span>
                  <span class="ent-name">${e.friendly_name}</span>
                  <input type="text" class="ent-label-inp" data-entity="${e.entity_id}" placeholder="Label" value="${pre?.name||e.friendly_name}">
                </div>
                ${this._colorPickerHTML(pre?.color||'#9E9E9E')}
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="ge-actions">
          <button class="btn-save-ge">Save</button>
          <button class="btn-cancel-ge">Cancel</button>
          <button class="btn-del-ge">Delete group</button>
        </div>
      </div>
    </ha-card>`;

    const sr=root;
    sr.querySelector('.btn-back').addEventListener('click',()=>this._renderGroupsView());
    sr.querySelector('.btn-cancel-ge').addEventListener('click',()=>this._renderGroupsView());
    sr.querySelector('.btn-del-ge').addEventListener('click',async()=>{
      if(!await this._confirm(this.t('group.delete_confirm'))) return;
      const profile=this._getSelectedProfile();
      const newGroups=(profile?.groups||[]).filter(g=>g.id!==group.id);
      const profiles=(this._storageData.profiles||[]).map(p=>p.id===profile?.id?{...p,groups:newGroups}:p);
      await this._wsSet({...this._storageData,profiles});
      this._renderGroupsView();
    });
    this._bindColorPalettes(sr);
    sr.querySelectorAll('.ent-row-top').forEach(top=>{
      top.addEventListener('click',e=>{
        if(e.target.tagName==='INPUT') return;
        const chk=top.querySelector('.ent-chk'); chk.checked=!chk.checked;
        top.closest('.ent-item').classList.toggle('sel',chk.checked);
      });
    });
    sr.querySelectorAll('.ent-chk').forEach(chk=>chk.addEventListener('change',()=>chk.closest('.ent-item').classList.toggle('sel',chk.checked)));
    let activeDomain='';
    const filterEnts=()=>{
      const search=sr.querySelector('.ent-search')?.value.toLowerCase()||'';
      sr.querySelectorAll('.ent-item').forEach(item=>{
        const ok=(!activeDomain||item.dataset.domain===activeDomain)&&(!search||item.dataset.name.includes(search));
        item.style.display=ok?'':'none';
      });
    };
    sr.querySelectorAll('.dom-btn').forEach(btn=>btn.addEventListener('click',()=>{
      activeDomain=btn.dataset.domain;
      sr.querySelectorAll('.dom-btn').forEach(b=>b.classList.toggle('active',b===btn));
      filterEnts();
    }));
    sr.querySelector('.ent-search').addEventListener('input',filterEnts);

    sr.querySelector('.btn-save-ge').addEventListener('click',async()=>{
      const name=sr.querySelector('.grp-name-inp').value.trim();
      if(!name){await this._alert(this.t('group.enter_name'));return;}
      const color=sr.querySelector('.group-pal .pal-value')?.value||group.color||PALETTE[2];
      const selected=[...sr.querySelectorAll('.ent-chk:checked')];
      if(!selected.length){await this._alert(this.t('group.select_entity'));return;}
      const oldEntityIds=(group.entities||[]).map(e=>e.entity);
      const newEntityIds=selected.map(chk=>chk.dataset.entity);
      const removed=oldEntityIds.filter(eid=>!newEntityIds.includes(eid));
      if(removed.length){
        const activeScheds=removed.flatMap(eid=>this._getSchedules(eid).filter(s=>s.state==='on'));
        if(activeScheds.length){
          const n=activeScheds.length;
          const yes=await this._confirm(`${n} ${this.t('group.removed_active')}`);
          if(yes) for(const s of activeScheds) try{await this._hass.callService('switch','turn_off',{entity_id:s.entity_id})}catch{}
        }
      }
      const usedColors=[];
      const entities=selected.map(chk=>{
        const eid=chk.dataset.entity;
        const oldEnt=(group.entities||[]).find(x=>x.entity===eid);
        const palVal=sr.querySelector(`.ent-item[data-entity="${eid}"] .pal-value`)?.value;
        const entColor=palVal||oldEnt?.color||this._autoColor(usedColors);
        usedColors.push(entColor);
        return {entity:eid,name:sr.querySelector(`.ent-label-inp[data-entity="${eid}"]`)?.value.trim()||this._hass.states[eid]?.attributes.friendly_name||eid,color:entColor};
      });
      const profile=this._getSelectedProfile();
      const newGroups=(profile?.groups||[]).map(g=>g.id===group.id?{...g,name,color,entities}:g);
      const profiles=(this._storageData.profiles||[]).map(p=>p.id===profile?.id?{...p,groups:newGroups}:p);
      try{await this._wsSet({...this._storageData,profiles});this._renderGroupsView();}
      catch(e){await this._alert(`${this.t('errors.save_failed')}: ${e.message||e}`);}
    });
  }

  _getAvailableEntities() {
    const DOMAINS = ['climate', 'switch', 'light', 'fan', 'cover'];
    return Object.values(this._hass?.states || {})
      .filter(s => {
        const d = s.entity_id.split('.')[0];
        return DOMAINS.includes(d) && !s.entity_id.startsWith('switch.schedule_');
      })
      .map(s => ({ entity_id: s.entity_id, domain: s.entity_id.split('.')[0], friendly_name: s.attributes.friendly_name || s.entity_id }))
      .sort((a, b) => a.domain.localeCompare(b.domain) || a.friendly_name.localeCompare(b.friendly_name));
  }

  _renderGroupsView() {
    this._groupsMode=true; this._profilesMode=false;
    const profile=this._getSelectedProfile();
    const groups=profile?.groups||[];
    const availableEnts=this._getAvailableEntities();
    const domains=[...new Set(availableEnts.map(e=>e.domain))];
    const yamlMap=Object.fromEntries(this._entities.map(e=>[e.entity,e]));
    const S = this._groupSharedStyles() + `
      .group-list{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
      .group-card{border:1px solid var(--divider-color,#e0e0e0);border-radius:10px;padding:12px 14px}
      .group-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      .dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
      .group-name{font-size:.95em;font-weight:600;color:var(--primary-text-color);flex:1}
      .tags{display:flex;flex-wrap:wrap;gap:6px}
      .tag{display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:8px;font-size:.75em;background:var(--divider-color,#f0f0f0);color:var(--primary-text-color)}
      .tag-dot{width:7px;height:7px;border-radius:50%}
      .group-footer{display:flex;justify-content:flex-end;margin-top:10px}
      .btn-del{background:none;border:1px solid var(--error-color,#f44336);color:var(--error-color,#f44336);padding:5px 12px;border-radius:8px;cursor:pointer;font-size:.78em;font-weight:600}
      .btn-edit-grp{background:none;border:1px solid var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4);padding:5px 12px;border-radius:8px;cursor:pointer;font-size:.78em;font-weight:600}
      .sec{font-size:.75em;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--secondary-text-color);margin-bottom:10px}
      .color-row{display:flex;align-items:center;gap:8px}
      .btn-create{background:var(--primary-color,#03a9f4);color:white;padding:8px 18px;border-radius:10px;border:none;cursor:pointer;font-size:.85em;font-weight:600;margin-top:4px}
      .btn-create:hover{filter:brightness(.9)}
      .empty{font-size:.85em;color:var(--secondary-text-color)}`;

    this._setStyles('groups', S);
    const root = this._ensureRoot();
    root.innerHTML=`<ha-card>
      <div class="card-header"><span class="card-title">Groups</span><button class="btn-back">← Back</button></div>
      <div class="group-list">
        ${groups.length?groups.map(g=>`
          <div class="group-card">
            <div class="group-hd"><span class="dot" style="background:${g.color||'#9E9E9E'}"></span><span class="group-name">${g.name}</span></div>
            <div class="tags">${(g.entities||[]).map(ec=>`<div class="tag"><span class="tag-dot" style="background:${ec.color||'#9E9E9E'}"></span>${ec.name||ec.entity}</div>`).join('')}</div>
            <div class="group-footer"><button class="btn-edit-grp" data-id="${g.id}">Edit</button><button class="btn-del" data-id="${g.id}">Delete</button></div>
          </div>`).join(''):'<div class="empty">No groups yet.</div>'}
      </div>
      <div class="sec">Create new group</div>
      <div class="form">
        <div class="form-row"><div class="form-label">${this.t('group.name')}</div><input type="text" class="form-input new-group-name" placeholder="${this.t('group.create_placeholder')}"></div>
        <div class="form-row">
          <span class="color-lbl">Tab color</span>
          ${this._colorPickerHTML('#9C27B0','group-pal')}
        </div>
        <div class="form-row">
          <div class="form-label">Select entities</div>
          <div class="domain-filter">
            <button class="dom-btn active" data-domain="">All</button>
            ${domains.map(d=>`<button class="dom-btn" data-domain="${d}">${d.charAt(0).toUpperCase()+d.slice(1)}</button>`).join('')}
          </div>
          <input type="text" class="ent-search" placeholder="Search entity…">
          <div class="ent-list">
            ${availableEnts.map(e=>{
              const pre=yamlMap[e.entity_id];
              return `<div class="ent-item${pre?' sel':''}" data-entity="${e.entity_id}" data-domain="${e.domain}" data-name="${e.friendly_name.toLowerCase().replace(/"/g,'')}">
                <div class="ent-row-top">
                  <input type="checkbox" class="ent-chk" data-entity="${e.entity_id}"${pre?' checked':''}>
                  <span class="dom-badge dom-${e.domain}">${e.domain}</span>
                  <span class="ent-name">${e.friendly_name}</span>
                  <input type="text" class="ent-label-inp" data-entity="${e.entity_id}" placeholder="Label" value="${pre?.name||e.friendly_name}">
                </div>
                ${this._colorPickerHTML(pre?.color||'#9E9E9E')}
              </div>`;
            }).join('')}
          </div>
        </div>
        <button class="btn-create">Create Group</button>
      </div>
    </ha-card>`;

    root.querySelector('.btn-back').addEventListener('click',()=>{this._groupsMode=false;this.render();});
    root.querySelectorAll('.btn-del').forEach(btn=>btn.addEventListener('click',async()=>{
      if(!await this._confirm(this.t('group.delete_confirm'))) return;
      const newGroups=groups.filter(g=>g.id!==btn.dataset.id);
      const profiles=(this._storageData.profiles||[]).map(p=>p.id===profile?.id?{...p,groups:newGroups}:p);
      await this._wsSet({...this._storageData,profiles});
      this._renderGroupsView();
    }));
    root.querySelectorAll('.btn-edit-grp').forEach(btn=>btn.addEventListener('click',()=>{
      const g=groups.find(x=>x.id===btn.dataset.id);
      if(g) this._renderGroupEditView(g);
    }));
    this._bindColorPalettes(root);
    root.querySelectorAll('.ent-row-top').forEach(top=>{
      top.addEventListener('click',e=>{
        if(e.target.tagName==='INPUT') return;
        const chk=top.querySelector('.ent-chk'); chk.checked=!chk.checked;
        top.closest('.ent-item').classList.toggle('sel',chk.checked);
      });
    });
    root.querySelectorAll('.ent-chk').forEach(chk=>chk.addEventListener('change',()=>chk.closest('.ent-item').classList.toggle('sel',chk.checked)));

    let activeDomain='';
    const filterEnts=()=>{
      const search=root.querySelector('.ent-search')?.value.toLowerCase()||'';
      root.querySelectorAll('.ent-item').forEach(item=>{
        const ok=(!activeDomain||item.dataset.domain===activeDomain)&&(!search||item.dataset.name.includes(search));
        item.style.display=ok?'':'none';
      });
    };
    root.querySelectorAll('.dom-btn').forEach(btn=>btn.addEventListener('click',()=>{
      activeDomain=btn.dataset.domain;
      root.querySelectorAll('.dom-btn').forEach(b=>b.classList.toggle('active',b===btn));
      filterEnts();
    }));
    root.querySelector('.ent-search').addEventListener('input',filterEnts);

    root.querySelector('.btn-create').addEventListener('click',async()=>{
      const name=root.querySelector('.new-group-name').value.trim();
      if(!name){await this._alert(this.t('group.enter_name'));return;}
      const color=root.querySelector('.group-pal .pal-value')?.value||PALETTE[2];
      const selected=[...root.querySelectorAll('.ent-chk:checked')];
      if(!selected.length){await this._alert(this.t('group.select_entity'));return;}
      const usedColors=[];
      const entities=selected.map(chk=>{
        const eid=chk.dataset.entity;
        const palVal=root.querySelector(`.ent-item[data-entity="${eid}"] .pal-value`)?.value;
        const entColor=palVal||this._autoColor(usedColors);
        usedColors.push(entColor);
        return {
          entity:eid,
          name:root.querySelector(`.ent-label-inp[data-entity="${eid}"]`)?.value.trim()||this._hass.states[eid]?.attributes.friendly_name||eid,
          color:entColor,
        };
      });
      const id=`grp_${name.toLowerCase().replace(/\s+/g,'_')}_${Date.now()}`;
      const newGroups=[...groups,{id,name,color,entities}];
      const profiles=(this._storageData.profiles||[]).map(p=>p.id===profile?.id?{...p,groups:newGroups}:p);
      try{await this._wsSet({...this._storageData,profiles});this._renderGroupsView();}
      catch(e){await this._alert(`${this.t('errors.save_failed')}: ${e.message||e}`);}
    });
  }

  // ── Abstract render (must be overridden by subclass) ──────────────────────

  render() {}
}
