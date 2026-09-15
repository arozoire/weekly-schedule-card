import { statesNow, WSC_AUTO_ID, WSC_RUNTIME_HELPER_ID, is404, isOwnedAutomationConfig } from './reset-card.js';

export const BACKUP_SCHEMA = 'weekly-schedule-card/backup';
export const BACKUP_VERSION = 1;
export const CLEANUP_PHRASE = 'PULISCI';
export const RESTORE_PHRASE = 'RIPRISTINA';
const AUTO_FIELDS = ['condAutoId', 'autoOffAutoId', 'oneShotAutoId', 'extrasAutoId', 'notifyAutoId', 'overrideFlagAutoId'];
const SCHEDULE_ID = /^switch\.schedule_[a-z0-9_]+$/;
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function automationIds(data) {
  const ids = new Set();
  for (const p of data?.profiles || []) for (const link of p.scheduleLinks || [])
    for (const key of AUTO_FIELDS) if (link[key]) ids.add(link[key]);
  return ids;
}

function scheduleIds(data) {
  const ids = new Set();
  for (const p of data?.profiles || []) {
    for (const id of p.schedules || []) ids.add(id);
    for (const link of p.scheduleLinks || []) {
      if (link.id) ids.add(link.id);
      if (link.autoChildId) ids.add(link.autoChildId);
    }
  }
  return ids;
}

function helperIds(data) {
  const ids = new Set();
  for (const p of data?.profiles || []) for (const link of p.scheduleLinks || [])
    for (const id of link.condHelpers || []) ids.add(id);
  return ids;
}

async function runtimeInventory(hass) {
  const [registry, helpers, schedules] = await Promise.all([
    hass.connection.sendMessagePromise({ type: 'config/entity_registry/list' }),
    hass.connection.sendMessagePromise({ type: 'input_text/list' }),
    hass.connection.sendMessagePromise({ type: 'scheduler' }),
  ]);
  if (!Array.isArray(registry) || !Array.isArray(helpers) || !Array.isArray(schedules))
    throw new Error('Invalid Home Assistant inventory response');
  return { registry, helpers, schedules };
}

function rawByEntity(schedules) {
  return new Map(schedules.filter(s => s && SCHEDULE_ID.test(s.entity_id)).map(s => [s.entity_id, s]));
}

async function ownedAutomation(hass, entry) {
  if (entry.platform !== 'automation' || !WSC_AUTO_ID.test(entry.unique_id)) return null;
  try {
    const config = await hass.callApi('GET', `config/automation/config/${entry.unique_id}`);
    return isOwnedAutomationConfig(entry.unique_id, config) ? { id: entry.unique_id, entityId: entry.entity_id, config } : null;
  } catch (e) {
    if (is404(e)) return null;
    throw e;
  }
}

function generatedSchedule(card, raw) {
  const tags = raw.tags || [];
  const first = raw.timeslots?.[0]?.actions?.[0];
  const data = first?.service_data || first?.data || {};
  return tags.includes('weekly_schedule_auto') || tags.includes('weekly_schedule_quick_timer')
    || String(raw.name || '').startsWith('WSC Quick Timer -')
    || (first?.service === 'logbook.log' && data.name === 'WSC conditional v1')
    || card._isQuickTimerSchedule?.({ entity_id: raw.entity_id, attributes: { tags, friendly_name: raw.name || '' } });
}

function safeSchedule(raw) {
  const out = {};
  for (const key of ['weekdays', 'start_date', 'end_date', 'timeslots', 'repeat_type', 'name', 'tags', 'enabled'])
    if (raw[key] !== undefined) out[key] = clone(raw[key]);
  return out;
}

export function validateBackup(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.schema !== BACKUP_SCHEMA || value.version !== BACKUP_VERSION
    || !value.profileData || !Array.isArray(value.schedules)
    || !Array.isArray(value.automations) || !Array.isArray(value.helpers))
    throw new Error('Unsupported or invalid WSC backup');
  if (!Array.isArray(value.profileData.profiles) || !Array.isArray(value.profileData.activeProfiles || []))
    throw new Error('Invalid profile data in backup');
  const ids = new Set();
  for (const item of value.schedules) {
    if (!item || !SCHEDULE_ID.test(item.entityId) || ids.has(item.entityId)
      || !item.config || !Array.isArray(item.config.timeslots) || !item.config.timeslots.length)
      throw new Error('Invalid schedule in backup');
    ids.add(item.entityId);
  }
  for (const id of scheduleIds(value.profileData)) if (!ids.has(id))
    throw new Error(`Backup is missing schedule ${id}`);
  for (const a of value.automations) {
    if (!a || !WSC_AUTO_ID.test(a.id) || !isOwnedAutomationConfig(a.id, a.config))
      throw new Error('Invalid automation in backup');
  }
  const backedAutos = new Set(value.automations.map(a => a.id));
  for (const id of automationIds(value.profileData)) if (!backedAutos.has(id))
    throw new Error(`Backup is missing automation ${id}`);
  const backedHelpers = new Set(value.helpers.map(h => h.entityId));
  for (const h of value.helpers) {
    const id = h?.entityId?.replace(/^input_text\./, '');
    if (!id || !WSC_RUNTIME_HELPER_ID.test(id) || typeof h.state !== 'string')
      throw new Error('Invalid runtime helper in backup');
  }
  for (const id of helperIds(value.profileData)) if (!backedHelpers.has(id))
    throw new Error(`Backup is missing runtime helper ${id}`);
  return value;
}

export async function prepareBackup(card, Base) {
  if (!Base._isAdmin(card._hass)) throw new Error('Administrator required');
  const config = await card._hass.connection.sendMessagePromise({ type: 'get_config' });
  if (config?.state !== 'RUNNING') throw new Error('Home Assistant is not running');
  const snapshot = await statesNow(card._hass);
  const data = await Base._sharedGet(snapshot, 'weekly_schedule_card');
  if (!data) throw new Error(card.t('reset.unreadable'));
  if (data.resetPending) throw new Error('Reset is in progress');
  const inv = await runtimeInventory(card._hass);
  const raws = rawByEntity(inv.schedules);
  const wantedSchedules = scheduleIds(data);
  const schedules = [];
  for (const id of [...wantedSchedules].sort()) {
    const raw = raws.get(id);
    if (!raw) throw new Error(`Schedule configuration unavailable: ${id}`);
    schedules.push({ entityId: id, config: safeSchedule(raw) });
  }
  const wantedAutos = automationIds(data);
  const automations = [];
  for (const id of [...wantedAutos].sort()) {
    const entry = inv.registry.find(e => e.platform === 'automation' && e.unique_id === id);
    if (!entry) throw new Error(`Generated automation unavailable: ${id}`);
    const owned = await ownedAutomation(card._hass, entry);
    if (!owned) throw new Error(`Automation ownership is ambiguous: ${id}`);
    automations.push(owned);
  }
  const wantedHelpers = helperIds(data);
  const helpers = [];
  for (const entityId of [...wantedHelpers].sort()) {
    const id = entityId.replace(/^input_text\./, '');
    const cfg = inv.helpers.find(h => h.id === id);
    if (!cfg) throw new Error(`Runtime helper configuration unavailable: ${entityId}`);
    const state = snapshot.states[entityId]?.state;
    if (typeof state !== 'string' || ['unknown', 'unavailable'].includes(state))
      throw new Error(`Runtime helper unavailable: ${entityId}`);
    helpers.push({ entityId, config: clone(cfg), state });
  }
  return validateBackup({
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    profileData: clone(data),
    schedules,
    automations,
    helpers,
    exclusions: ['target device states', 'running Quick Timers', 'dashboard YAML'],
  });
}

function currentStoreIsEmpty(data) {
  if (!data) return true;
  return !(data.groups || []).length && !(data.activeProfiles || []).length
    && (data.profiles || []).every(p => !(p.groups || []).length && !(p.schedules || []).length && !(p.scheduleLinks || []).length);
}

function fingerprint(data, timers, inv) {
  return JSON.stringify({
    data, timers,
    automations: inv.registry.filter(e => e.platform === 'automation' && WSC_AUTO_ID.test(e.unique_id) && e.unique_id !== 'wsc_external_profile_control').map(e => [e.unique_id, e.entity_id]).sort(),
    helpers: inv.helpers.filter(h => /^wsc_cond_/.test(h.id)).map(h => h.id).sort(),
    schedules: inv.schedules.filter(s => generatedSchedule({ _isQuickTimerSchedule: () => false }, s)).map(s => s.entity_id).sort(),
  });
}

export async function prepareRestore(card, Base, input) {
  const backup = validateBackup(clone(input));
  if (!Base._isAdmin(card._hass)) throw new Error('Administrator required');
  const snapshot = await statesNow(card._hass);
  const data = await Base._sharedGet(snapshot, 'weekly_schedule_card');
  const timers = await Base._sharedGet(snapshot, 'quick_timer_card');
  const inv = await runtimeInventory(card._hass);
  const conflicts = [];
  if (!currentStoreIsEmpty(data)) conflicts.push('Weekly Schedule Card data is not empty');
  if (Object.keys(timers?.timers || {}).length) conflicts.push('Quick Timers are still present');
  const generated = inv.schedules.filter(s => generatedSchedule(card, s));
  if (generated.length) conflicts.push(`${generated.length} generated schedule(s) still present`);
  const autos = inv.registry.filter(e => e.platform === 'automation' && WSC_AUTO_ID.test(e.unique_id) && e.unique_id !== 'wsc_external_profile_control');
  if (autos.length) conflicts.push(`${autos.length} WSC automation(s) still present`);
  const helpers = inv.helpers.filter(h => /^wsc_cond_/.test(h.id));
  if (helpers.length) conflicts.push(`${helpers.length} WSC runtime helper(s) still present`);
  return {
    version: 1, id: `restore_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    backup, conflicts, fingerprint: fingerprint(data, timers, inv),
  };
}

function rewrite(value, replacements) {
  if (typeof value === 'string') {
    let out = value;
    for (const [from, to] of replacements) out = out.split(from).join(to);
    return out;
  }
  if (Array.isArray(value)) return value.map(v => rewrite(v, replacements));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v, replacements)]));
  return value;
}

function serviceScheduleConfig(config) {
  const out = {};
  for (const key of ['weekdays', 'start_date', 'end_date', 'timeslots', 'repeat_type', 'name', 'tags'])
    if (config[key] !== undefined) out[key] = clone(config[key]);
  if (!('start_date' in out)) out.start_date = null;
  if (!('end_date' in out)) out.end_date = null;
  return out;
}

export async function executeRestore(card, Base, plan, phrase) {
  if (phrase !== RESTORE_PHRASE || !Base._isAdmin(card._hass)) throw new Error('Restore not confirmed');
  if (plan?.version !== 1 || !/^restore_\w+$/.test(plan.id) || plan.conflicts?.length)
    throw new Error('Restore is blocked by conflicts');
  const fresh = await prepareRestore(card, Base, plan.backup);
  if (fresh.conflicts.length || fresh.fingerprint !== plan.fingerprint) throw new Error('Home Assistant data changed; reopen the restore preview');
  const created = { schedules: [], automations: [], helpers: [] };
  if (!Base._createdHelpers) Base._createdHelpers = new Set();
  const replacements = [];
  try {
    for (const item of plan.backup.schedules) {
      const before = new Set(Object.keys(card._hass.states).filter(SCHEDULE_ID.test.bind(SCHEDULE_ID)));
      const quarantine = {
        weekdays: ['daily'], start_date: '2099-12-31', end_date: '2099-12-31',
        repeat_type: 'repeat', timeslots: clone(item.config.timeslots),
        tags: clone(item.config.tags || []),
      };
      if (item.config.name !== undefined) quarantine.name = item.config.name;
      await card._hass.callService('scheduler', 'add', quarantine);
      const newId = await card._waitForNewSchedule(before);
      if (!newId || !SCHEDULE_ID.test(newId)) throw new Error(`Scheduler did not return a new entity for ${item.entityId}`);
      created.schedules.push(newId);
      await card._hass.callService('switch', 'turn_off', { entity_id: newId });
      await card._hass.callService('scheduler', 'edit', { entity_id: newId, ...serviceScheduleConfig(item.config) });
      replacements.push([item.entityId, newId], [item.entityId.replace('switch.', ''), newId.replace('switch.', '')]);
    }
    // Avoid partial replacement when one generated ID is a prefix of another.
    replacements.sort((a, b) => b[0].length - a[0].length);
    for (const h of plan.backup.helpers) {
      const mappedEntity = rewrite(h.entityId, replacements);
      const id = mappedEntity.replace(/^input_text\./, '');
      const made = await Base._createInputText(card._hass, id);
      if (made?.id && made.id !== id) throw new Error(`Unexpected helper ID: ${made.id}`);
      created.helpers.push(mappedEntity);
      Base._createdHelpers?.add(mappedEntity);
      // Occurrence snapshots are diagnostic backup data, never a baseline for a
      // newly-created schedule occurrence.
      const restoredState = id.endsWith('_run') ? '#{}' : '#';
      await Base._setInputText(card._hass, mappedEntity, restoredState);
      await Base._hideInputText(card._hass, mappedEntity);
    }
    const currentStates = await card._hass.connection.sendMessagePromise({ type: 'get_states' });
    const present = new Set(currentStates.map(s => s.entity_id));
    for (const [entityId, name] of [['input_text.wsc_profile_command', 'WSC Profile Command'], ['input_text.wsc_profile_active', 'WSC Profile Active']]) {
      if (!present.has(entityId)) {
        const made = await Base._createInputText(card._hass, name);
        if (made?.id && `input_text.${made.id}` !== entityId) throw new Error(`Unexpected helper ID: ${made.id}`);
        created.helpers.push(entityId);
        Base._createdHelpers?.add(entityId);
      }
      await Base._setInputText(card._hass, entityId, '');
      await Base._hideInputText(card._hass, entityId);
    }
    for (const a of plan.backup.automations) {
      if (a.id === 'wsc_external_profile_control') continue;
      const id = rewrite(a.id, replacements);
      if (!WSC_AUTO_ID.test(id)) throw new Error(`Invalid mapped automation ID: ${id}`);
      const config = rewrite(a.config, replacements);
      await card._hass.callApi('POST', `config/automation/config/${id}`, config);
      created.automations.push(id);
    }
    const restored = rewrite(plan.backup.profileData, replacements);
    delete restored.resetPending;
    restored.activeProfiles = [];
    restored.restoredAt = new Date().toISOString();
    await Base._sharedSet(card._hass, 'weekly_schedule_card', restored);
    card._storageData = restored;
    card._selectedProfileId = restored.profiles?.[0]?.id || null;
    window.dispatchEvent(new CustomEvent('wsc-storage-changed', { detail: { source: card, data: restored } }));
    card._externalProfileControlSignature = null;
    card._syncExternalProfileControl?.().catch(e => console.warn('[WSC] External profile control restore sync failed', e));
    return { data: restored, replacements: Object.fromEntries(replacements.filter(([a]) => a.startsWith('switch.'))) };
  } catch (error) {
    for (const id of created.automations.reverse()) try { await card._hass.callApi('DELETE', `config/automation/config/${id}`); } catch {}
    for (const id of created.schedules.reverse()) try { await card._hass.callService('scheduler', 'remove', { entity_id: id }); } catch {}
    for (const id of created.helpers.reverse()) {
      try { await Base._deleteInputText(card._hass, id); } catch {}
      Base._createdHelpers?.delete(id);
    }
    throw new Error(`Restore failed and rollback was attempted: ${error.message || error}`);
  }
}

export async function prepareCleanup(card, Base) {
  if (!Base._isAdmin(card._hass)) throw new Error('Administrator required');
  const snapshot = await statesNow(card._hass);
  const data = await Base._sharedGet(snapshot, 'weekly_schedule_card');
  if (!data) throw new Error(card.t('reset.unreadable'));
  const timers = await Base._sharedGet(snapshot, 'quick_timer_card');
  const inv = await runtimeInventory(card._hass);
  const referencedSchedules = scheduleIds(data);
  for (const timer of Object.values(timers?.timers || {})) for (const id of timer.scheduleIds || []) referencedSchedules.add(id);
  let schedules = inv.schedules.filter(s => generatedSchedule(card, s) && !referencedSchedules.has(s.entity_id))
    .map(s => ({ entityId: s.entity_id, config: safeSchedule(s) }));
  const referencedAutos = automationIds(data);
  for (const timer of Object.values(timers?.timers || {})) if (timer.autoId) referencedAutos.add(timer.autoId);
  referencedAutos.add('wsc_external_profile_control');
  let automations = [];
  const ambiguous = [];
  for (const entry of inv.registry.filter(e => e.platform === 'automation' && WSC_AUTO_ID.test(e.unique_id) && !referencedAutos.has(e.unique_id))) {
    const owned = await ownedAutomation(card._hass, entry);
    if (!owned) { ambiguous.push(entry.entity_id); continue; }
    const refs = [...new Set((JSON.stringify(owned.config).match(/switch\.schedule_[a-z0-9_]+/g) || []))];
    if (!refs.length || refs.some(id => inv.schedules.some(s => s.entity_id === id) && !schedules.some(x => x.entityId === id))) {
      ambiguous.push(entry.entity_id); continue;
    }
    automations.push(owned);
  }
  const referencedHelpers = helperIds(data);
  const protectedSchedules = new Set();
  const protectedHelpers = new Set(referencedHelpers);
  const deletingAutos = new Set(automations.map(a => a.id));
  // A retained or ambiguous WSC automation protects every object it mentions.
  // This avoids deleting one half of a dependency that cleanup cannot prove safe.
  for (const entry of inv.registry.filter(e => e.platform === 'automation' && WSC_AUTO_ID.test(e.unique_id) && !deletingAutos.has(e.unique_id))) {
    try {
      const config = await card._hass.callApi('GET', `config/automation/config/${entry.unique_id}`);
      for (const id of JSON.stringify(config).match(/switch\.schedule_[a-z0-9_]+/g) || []) protectedSchedules.add(id);
      for (const id of JSON.stringify(config).match(/input_text\.wsc_cond_[a-z0-9_]+/g) || []) protectedHelpers.add(id);
    } catch (e) { if (!is404(e)) throw e; }
  }
  schedules = schedules.filter(s => !protectedSchedules.has(s.entityId));
  automations = automations.filter(a => {
    const refs = JSON.stringify(a.config).match(/switch\.schedule_[a-z0-9_]+/g) || [];
    if (refs.some(id => protectedSchedules.has(id))) { ambiguous.push(a.entityId); return false; }
    return true;
  });
  const helpers = [];
  const storageCounts = {
    wsc_store: Number(snapshot.states['input_text.wsc_store_meta']?.state || 0),
    wsc_qt_store: Number(snapshot.states['input_text.wsc_qt_store_meta']?.state || 0),
  };
  for (const h of inv.helpers) {
    const entityId = `input_text.${h.id}`;
    let orphan = /^wsc_cond_/.test(h.id) && !protectedHelpers.has(entityId);
    const chunk = /^(wsc_(?:qt_)?store)_(\d+)$/.exec(h.id);
    if (chunk && Number.isSafeInteger(storageCounts[chunk[1]]) && Number(chunk[2]) >= storageCounts[chunk[1]]) orphan = true;
    const duplicateMeta = /^(WSC Store|WSC QT Store) Meta$/.test(h.name || '') && !['wsc_store_meta', 'wsc_qt_store_meta'].includes(h.id);
    if (duplicateMeta && data) orphan = true;
    if (orphan) helpers.push({ id: h.id, entityId, config: clone(h) });
  }
  return { version: 1, id: `cleanup_${Date.now()}_${Math.random().toString(36).slice(2)}`, automations, schedules, helpers, ambiguous };
}

export async function executeCleanup(card, Base, plan, phrase) {
  if (phrase !== CLEANUP_PHRASE || !Base._isAdmin(card._hass)) throw new Error('Cleanup not confirmed');
  if (plan?.version !== 1 || !/^cleanup_\w+$/.test(plan.id)
    || plan.automations.some(a => !WSC_AUTO_ID.test(a.id))
    || plan.schedules.some(s => !SCHEDULE_ID.test(s.entityId))
    || plan.helpers.some(h => !/^wsc_\w+$/.test(h.id))) throw new Error('Invalid cleanup plan');
  const inv = await runtimeInventory(card._hass);
  for (const a of plan.automations) {
    const entry = inv.registry.find(e => e.unique_id === a.id);
    if (!entry) continue;
    const now = await ownedAutomation(card._hass, entry);
    if (!now || !same(now.config, a.config)) throw new Error(`Automation changed: ${a.id}`);
  }
  const raws = rawByEntity(inv.schedules);
  for (const s of plan.schedules) if (raws.has(s.entityId) && !same(safeSchedule(raws.get(s.entityId)), s.config))
    throw new Error(`Schedule changed: ${s.entityId}`);
  for (const h of plan.helpers) {
    const now = inv.helpers.find(x => x.id === h.id);
    if (now && !same(now, h.config)) throw new Error(`Helper changed: ${h.id}`);
  }
  for (const a of plan.automations) {
    const entity = inv.registry.find(e => e.unique_id === a.id)?.entity_id;
    if (entity) try { await card._hass.callService('automation', 'turn_off', { entity_id: entity, stop_actions: true }); } catch {}
    try { await card._hass.callApi('DELETE', `config/automation/config/${a.id}`); } catch (e) { if (!is404(e)) throw e; }
  }
  for (const s of plan.schedules) if (raws.has(s.entityId))
    await card._hass.callService('scheduler', 'remove', { entity_id: s.entityId });
  for (const h of plan.helpers) if (inv.helpers.some(x => x.id === h.id)) {
    await card._hass.connection.sendMessagePromise({ type: 'input_text/delete', input_text_id: h.id });
    Base._createdHelpers?.delete(h.entityId);
  }
  return { automations: plan.automations.length, schedules: plan.schedules.length, helpers: plan.helpers.length, ambiguous: plan.ambiguous.length };
}
