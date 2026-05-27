export const LOCALES = {
  en: {
    card:{ title:'Weekly Schedule',new_profile:'New profile',groups:'Groups',no_entities:'No entities configured',no_entities_sub:'Add entities via YAML config, or create a Group to get started.',manage_groups:'Manage Groups' },
    popup:{ new_schedule:'New Schedule',edit_schedule:'Edit Schedule',schedule_active:'Schedule Active',time_slot:'Time slot',snap:'Snap',days:'Days',start:'Start',end:'End',drag_hint:'Drag handles to resize.',next_slot:'＋ Next slot',temperature:'Temperature',hvac_mode:'HVAC Mode',preset_mode:'Preset Mode',fan_mode:'Fan Mode',swing_mode:'Swing Mode',climate_actions:'Climate Actions',light_action:'Light Action',action:'Action',brightness:'Brightness',auto_off:'Auto at slot end',none:'None',turn_off:'Turn Off',turn_on:'Turn On',set_temp:'Set temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (e.g. notify.mobile_app_phone)',notify_message_label:'Message',name:'Name',name_placeholder:'Schedule name (optional)',save:'Save',delete:'Delete',cancel:'Cancel' },
    days:{ mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun',all:'All',workdays:'Workdays',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Exclusive (deactivates other exclusive profiles)',shared_label:'🔓 Shared (coexists with other profiles)',new_profile:'New Profile',create:'Create',name_placeholder:'Profile name',new_profile_mode:'new profile',rename:'Rename',duplicate:'Duplicate',delete:'Delete' },
    group:{ title:'Groups',back:'← Back',edit:'Edit',create:'Create Group',tab_color:'Tab color',select_entities:'Select entities',no_groups:'No groups yet.',create_new:'Create new group',delete_confirm:'Delete this group?',col_view:'Column view',row_view:'Row view' },
    errors:{ no_days:'Please select at least one day.',delete_confirm:'Delete this schedule?',delete_profile_confirm:'Delete this profile and all its schedules?' },
    warnings:{ temp_unusual:'⚠️ Unusual value — check device compatibility',temp_very_high:'🔴 Warning: very high temperature',out_of_slider_range:'Outside typical range for this entity' },
    cond:{ add:'Add condition',entity:'Entity',operator:'Operator',value:'Value',and_all:'All (AND)',or_any:'Any (OR)',recheck:'Re-check interval' }
  },
  it: {
    card:{ title:'Pianificazione Settimanale',new_profile:'Nuovo profilo',groups:'Gruppi',no_entities:'Nessuna entità configurata',no_entities_sub:'Aggiungi entità via YAML o crea un Gruppo per iniziare.',manage_groups:'Gestisci Gruppi' },
    popup:{ new_schedule:'Nuovo Schedule',edit_schedule:'Modifica Schedule',schedule_active:'Schedule Attivo',time_slot:'Fascia oraria',snap:'Snap',days:'Giorni',start:'Inizio',end:'Fine',drag_hint:'Trascina le maniglie per ridimensionare.',next_slot:'＋ Slot successivo',temperature:'Temperatura',hvac_mode:'Modalità HVAC',preset_mode:'Modalità preset',fan_mode:'Modalità ventola',swing_mode:'Modalità oscillazione',climate_actions:'Azioni clima',light_action:'Azione luce',action:'Azione',brightness:'Luminosità',auto_off:'Azione al termine slot',none:'Nessuna',turn_off:'Spegni',turn_on:'Accendi',set_temp:'Imposta temp',conditions:'Condizioni',add_condition:'+ Condizione',notifications:'Notifiche',notify_service_label:'Servizio (es. notify.mobile_app_phone)',notify_message_label:'Messaggio',name:'Nome',name_placeholder:'Nome schedule (opzionale)',save:'Salva',delete:'Elimina',cancel:'Annulla' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Gio',fri:'Ven',sat:'Sab',sun:'Dom',all:'Tutti',workdays:'Feriali',weekend:'Weekend' },
    profile:{ exclusive_label:'🔒 Esclusivo (disattiva altri profili esclusivi)',shared_label:'🔓 Condiviso (coesiste con altri profili)',new_profile:'Nuovo Profilo',create:'Crea',name_placeholder:'Nome profilo',new_profile_mode:'nuovo profilo',rename:'Rinomina',duplicate:'Duplica',delete:'Elimina' },
    group:{ title:'Gruppi',back:'← Indietro',edit:'Modifica',create:'Crea Gruppo',tab_color:'Colore tab',select_entities:'Seleziona entità',no_groups:'Nessun gruppo.',create_new:'Crea nuovo gruppo',delete_confirm:'Eliminare questo gruppo?',col_view:'Vista colonne',row_view:'Vista righe' },
    errors:{ no_days:'Seleziona almeno un giorno.',delete_confirm:'Eliminare questo schedule?',delete_profile_confirm:'Eliminare questo profilo e tutti i suoi schedule?' },
    warnings:{ temp_unusual:'⚠️ Valore insolito — verifica compatibilità con il tuo dispositivo',temp_very_high:'🔴 Attenzione: temperatura molto alta',out_of_slider_range:'Fuori dal range tipico per questa entità' },
    cond:{ add:'Aggiungi condizione',entity:'Entità',operator:'Operatore',value:'Valore',and_all:'Tutte (AND)',or_any:'Una qualsiasi (OR)',recheck:'Intervallo rivalutazione' }
  },
  fr: {
    card:{ title:'Planning Hebdomadaire',new_profile:'Nouveau profil',groups:'Groupes',no_entities:'Aucune entité configurée',no_entities_sub:'Ajoutez des entités via la config YAML, ou créez un Groupe pour commencer.',manage_groups:'Gérer les Groupes' },
    popup:{ new_schedule:'Nouveau Schedule',edit_schedule:'Modifier Schedule',schedule_active:'Schedule Actif',time_slot:'Créneau horaire',snap:'Snap',days:'Jours',start:'Début',end:'Fin',drag_hint:'Glissez les poignées pour redimensionner.',next_slot:'＋ Créneau suivant',temperature:'Température',hvac_mode:'Mode HVAC',preset_mode:'Mode preset',fan_mode:'Mode ventilateur',swing_mode:'Mode oscillation',climate_actions:'Actions climatisation',light_action:'Action lumière',action:'Action',brightness:'Luminosité',auto_off:'Action en fin de créneau',none:'Aucune',turn_off:'Éteindre',turn_on:'Allumer',set_temp:'Définir temp',conditions:'Conditions',add_condition:'+ Condition',notifications:'Notifications',notify_service_label:'Service (ex. notify.mobile_app_phone)',notify_message_label:'Message',name:'Nom',name_placeholder:'Nom du schedule (optionnel)',save:'Sauvegarder',delete:'Supprimer',cancel:'Annuler' },
    days:{ mon:'Lun',tue:'Mar',wed:'Mer',thu:'Jeu',fri:'Ven',sat:'Sam',sun:'Dim',all:'Tous',workdays:'Jours ouvrés',weekend:'Week-end' },
    profile:{ exclusive_label:"🔒 Exclusif (désactive les autres profils exclusifs)",shared_label:"🔓 Partagé (coexiste avec d'autres profils)",new_profile:'Nouveau Profil',create:'Créer',name_placeholder:'Nom du profil',new_profile_mode:'nouveau profil',rename:'Renommer',duplicate:'Dupliquer',delete:'Supprimer' },
    group:{ title:'Groupes',back:'← Retour',edit:'Modifier',create:'Créer Groupe',tab_color:'Couleur onglet',select_entities:'Sélectionner entités',no_groups:'Aucun groupe.',create_new:'Créer nouveau groupe',delete_confirm:'Supprimer ce groupe ?',col_view:'Vue colonnes',row_view:'Vue lignes' },
    errors:{ no_days:'Sélectionnez au moins un jour.',delete_confirm:'Supprimer ce schedule ?',delete_profile_confirm:'Supprimer ce profil et tous ses schedules ?' },
    warnings:{ temp_unusual:"⚠️ Valeur inhabituelle — vérifiez la compatibilité avec votre appareil",temp_very_high:"🔴 Attention : température très élevée",out_of_slider_range:'Hors de la plage typique pour cette entité' },
    cond:{ add:'Ajouter condition',entity:'Entité',operator:'Opérateur',value:'Valeur',and_all:'Toutes (AND)',or_any:"N'importe laquelle (OR)",recheck:'Intervalle de réévaluation' }
  }
};

export function detectLang(config, hass) {
  const cfg = (config?.language || '').toLowerCase().slice(0, 2);
  const ha  = (hass?.language || '').toLowerCase().slice(0, 2);
  const nav = (navigator?.language || '').toLowerCase().slice(0, 2);
  const raw = cfg || ha || nav || 'en';
  return LOCALES[raw] ? raw : 'en';
}

export function lookupT(lang, key) {
  const parts = key.split('.');
  let obj = LOCALES[lang];
  for (const p of parts) { if (obj == null) break; obj = obj[p]; }
  if (obj != null && typeof obj === 'string') return obj;
  let en = LOCALES.en;
  for (const p of parts) { if (en == null) break; en = en[p]; }
  return (en != null && typeof en === 'string') ? en : key;
}
