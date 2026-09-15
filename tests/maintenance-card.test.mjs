import assert from 'node:assert/strict';
import {
  prepareBackup, validateBackup, prepareRestore, executeRestore, RESTORE_PHRASE,
  prepareCleanup, executeCleanup, CLEANUP_PHRASE,
} from '../src/maintenance-card.js';

globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };

const oldId = 'switch.schedule_living';
const autoId = 'wsc_cond_schedule_living';
const helperId = 'input_text.wsc_cond_schedule_living_run';
const state = (entity_id, value, attributes = {}) => ({ entity_id, state: value, attributes });
const raw = (entityId = oldId) => ({
  entity_id: entityId, enabled: true, weekdays: ['mon', 'tue'], start_date: null, end_date: null,
  repeat_type: 'repeat', name: 'Living', tags: [], timeslots: [{ start: '09:30:00', stop: '18:00:00', actions: [
    { entity_id: 'climate.living', service: 'climate.set_hvac_mode', service_data: { hvac_mode: 'heat' } },
    { entity_id: 'climate.living', service: 'climate.set_temperature', service_data: { temperature: 20 } },
  ] }],
});
const profileData = { groups: [], activeProfiles: ['home'], profiles: [{ id: 'home', name: 'Home', groups: [], schedules: [oldId], scheduleLinks: [{ id: oldId, condAutoId: autoId, condHelpers: [helperId] }] }] };
const autoConfig = { description: 'WSC conditional controller v1; snapshot is held in input_text helpers.', initial_state: true, trigger: [{ platform: 'state', entity_id: oldId }], action: [{ service: 'input_text.set_value', target: { entity_id: helperId } }] };

function fixture({ empty = false } = {}) {
  const data = empty ? { groups: [], activeProfiles: [], profiles: [{ id: 'default', name: 'Default', groups: [], schedules: [], scheduleLinks: [] }] } : structuredClone(profileData);
  const timers = { timers: {} };
  const states = empty ? {} : {
    [oldId]: state(oldId, 'on'),
    'automation.renamed_controller': state('automation.renamed_controller', 'on', { id: autoId }),
    [helperId]: state(helperId, '#{}'),
  };
  const schedules = empty ? [] : [raw()];
  const registry = empty ? [] : [
    { platform: 'automation', unique_id: autoId, entity_id: 'automation.renamed_controller' },
    { platform: 'input_text', unique_id: helperId.replace('input_text.', ''), entity_id: helperId },
  ];
  const helpers = empty ? [] : [{ id: helperId.replace('input_text.', ''), name: 'Runtime', min: 0, max: 255, mode: 'text' }];
  const configs = empty ? {} : { [autoId]: structuredClone(autoConfig) };
  if (empty) {
    states['input_text.wsc_profile_command'] = state('input_text.wsc_profile_command', '');
    states['input_text.wsc_profile_active'] = state('input_text.wsc_profile_active', 'Home');
    states['automation.wsc_external_profile_control'] = state('automation.wsc_external_profile_control', 'on', { id: 'wsc_external_profile_control' });
    helpers.push({ id: 'wsc_profile_command', name: 'WSC Profile Command' }, { id: 'wsc_profile_active', name: 'WSC Profile Active' });
    registry.push({ platform: 'automation', unique_id: 'wsc_external_profile_control', entity_id: 'automation.wsc_external_profile_control' });
    configs.wsc_external_profile_control = { alias: 'WSC External Profile Control', trigger: [], action: [] };
  }
  const calls = [];
  let saved = data;
  let createdIndex = 0;
  const hass = {
    user: { is_admin: true }, states,
    connection: { sendMessagePromise: async msg => {
      calls.push(structuredClone(msg));
      if (msg.type === 'get_config') return { state: 'RUNNING' };
      if (msg.type === 'get_states') return Object.values(states);
      if (msg.type === 'config/entity_registry/list') return registry;
      if (msg.type === 'input_text/list') return helpers;
      if (msg.type === 'scheduler') return schedules;
      if (msg.type === 'input_text/create') {
        const id = msg.name.toLowerCase().replaceAll(' ', '_');
        helpers.push({ id, name: msg.name, min: 0, max: 255, mode: 'text' });
        states[`input_text.${id}`] = state(`input_text.${id}`, 'unknown');
        return { id };
      }
      if (msg.type === 'input_text/delete') {
        const i = helpers.findIndex(h => h.id === msg.input_text_id); if (i >= 0) helpers.splice(i, 1);
        delete states[`input_text.${msg.input_text_id}`]; return {};
      }
      if (msg.type === 'config/entity_registry/update') return {};
      throw new Error(`Unexpected message ${msg.type}`);
    } },
    callApi: async (method, path, body) => {
      calls.push({ method, path, body: structuredClone(body) });
      const id = path.split('/').at(-1);
      if (method === 'GET') {
        if (!configs[id]) throw { status: 404 };
        return structuredClone(configs[id]);
      }
      if (method === 'POST') { configs[id] = structuredClone(body); registry.push({ platform: 'automation', unique_id: id, entity_id: `automation.${id}` }); return {}; }
      if (method === 'DELETE') { delete configs[id]; const i = registry.findIndex(e => e.unique_id === id); if (i >= 0) registry.splice(i, 1); return {}; }
      throw new Error(`Unexpected API ${method}`);
    },
    callService: async (domain, service, payload) => {
      calls.push({ domain, service, payload: structuredClone(payload) });
      if (domain === 'input_text' && service === 'set_value') { states[payload.entity_id].state = payload.value; return; }
      if (domain === 'scheduler' && service === 'add') {
        const id = `switch.schedule_restored_${++createdIndex}`;
        states[id] = state(id, 'on'); schedules.push({ entity_id: id, enabled: true, ...structuredClone(payload) }); return;
      }
      if (domain === 'switch' && service === 'turn_off') { states[payload.entity_id].state = 'off'; const s = schedules.find(x => x.entity_id === payload.entity_id); if (s) s.enabled = false; return; }
      if (domain === 'scheduler' && service === 'edit') { const s = schedules.find(x => x.entity_id === payload.entity_id); Object.assign(s, structuredClone(payload)); return; }
      if (domain === 'scheduler' && service === 'remove') { const i = schedules.findIndex(x => x.entity_id === payload.entity_id); if (i >= 0) schedules.splice(i, 1); delete states[payload.entity_id]; return; }
      if (domain === 'automation' && service === 'turn_off') return;
      throw new Error(`Unexpected service ${domain}.${service}`);
    },
  };
  const Base = {
    _isAdmin: h => h.user.is_admin,
    _sharedGet: async (_h, key) => key === 'weekly_schedule_card' ? saved : timers,
    _sharedSet: async (_h, key, value) => { assert.equal(key, 'weekly_schedule_card'); saved = structuredClone(value); },
    _createInputText: async (h, name) => h.connection.sendMessagePromise({ type: 'input_text/create', name }),
    _setInputText: async (h, entity_id, value) => h.callService('input_text', 'set_value', { entity_id, value }),
    _hideInputText: async () => {},
    _deleteInputText: async (h, entityId) => h.connection.sendMessagePromise({ type: 'input_text/delete', input_text_id: entityId.replace('input_text.', '') }),
    _createdHelpers: new Set(),
  };
  const card = { _hass: hass, _storageData: data, _isQuickTimerSchedule: () => false, t: key => key,
    _waitForNewSchedule: async before => Object.keys(states).find(id => id.startsWith('switch.schedule_') && !before.has(id)) || null };
  return { card, Base, calls, states, schedules, registry, helpers, configs, get saved() { return saved; } };
}

{
  const f = fixture();
  const backup = await prepareBackup(f.card, f.Base);
  assert.equal(backup.schedules[0].config.timeslots[0].actions.length, 2, 'backup must use full Scheduler config');
  assert.equal(backup.automations[0].id, autoId);
  assert.equal(backup.helpers[0].state, '#{}');
  assert(!f.calls.some(c => c.domain || ['POST', 'DELETE'].includes(c.method)), 'backup must be read-only');
  const broken = structuredClone(backup); broken.schedules = [];
  assert.throws(() => validateBackup(broken), /missing schedule/);

  const r = fixture({ empty: true });
  const plan = await prepareRestore(r.card, r.Base, backup);
  assert.deepEqual(plan.conflicts, []);
  await assert.rejects(() => executeRestore(r.card, r.Base, plan, 'yes'), /not confirmed/);
  const result = await executeRestore(r.card, r.Base, plan, RESTORE_PHRASE);
  const newId = result.replacements[oldId];
  assert(newId && newId !== oldId);
  assert.deepEqual(r.saved.activeProfiles, [], 'restore must not activate profiles');
  assert.equal(r.states['input_text.wsc_profile_active'].state, '', 'external active-profile state must be cleared');
  assert.deepEqual(r.saved.profiles[0].schedules, [newId]);
  const add = r.calls.find(c => c.domain === 'scheduler' && c.service === 'add');
  assert.equal(add.payload.start_date, '2099-12-31');
  const off = r.calls.findIndex(c => c.domain === 'switch' && c.service === 'turn_off');
  const edit = r.calls.findIndex(c => c.domain === 'scheduler' && c.service === 'edit');
  assert(off >= 0 && off < edit, 'restored schedule must be disabled before applying original dates');
  assert(!r.calls.some(c => c.domain && !['scheduler', 'switch', 'input_text'].includes(c.domain)), 'restore must not call target domains');
  const mappedAuto = Object.entries(r.configs).find(([id]) => id.startsWith('wsc_cond_schedule_restored_'));
  assert(mappedAuto && mappedAuto[1].initial_state === true, 'controller must be ready for later manual profile activation');
}

{
  const source = fixture();
  const backup = await prepareBackup(source.card, source.Base);
  const r = fixture({ empty: true });
  const plan = await prepareRestore(r.card, r.Base, backup);
  const originalApi = r.card._hass.callApi;
  r.card._hass.callApi = async (method, ...args) => {
    if (method === 'POST') throw new Error('simulated automation failure');
    return originalApi(method, ...args);
  };
  await assert.rejects(() => executeRestore(r.card, r.Base, plan, RESTORE_PHRASE), /rollback was attempted/);
  assert(!r.schedules.some(s => s.entity_id.startsWith('switch.schedule_restored_')), 'failed restore must remove quarantined schedules');
  assert(!r.helpers.some(h => h.id.startsWith('wsc_cond_')), 'failed restore must remove created condition helpers');
  assert(r.helpers.some(h => h.id === 'wsc_profile_active'), 'pre-existing infrastructure must survive rollback');
}

{
  const f = fixture();
  const orphanId = 'switch.schedule_wsc_quick_timer_orphan';
  f.schedules.push({ ...raw(orphanId), name: 'WSC Quick Timer - orphan', tags: ['weekly_schedule_quick_timer'] });
  const orphanAuto = 'qt_timer_orphan';
  f.registry.push({ platform: 'automation', unique_id: orphanAuto, entity_id: 'automation.orphan' });
  f.configs[orphanAuto] = { description: 'Auto-generated by Weekly Schedule Card', trigger: [{ entity_id: orphanId }], action: [] };
  f.registry.push({ platform: 'automation', unique_id: 'wsc_notify_ambiguous', entity_id: 'automation.ambiguous' });
  f.configs.wsc_notify_ambiguous = { description: 'Auto-generated by Weekly Schedule Card', action: [] };
  f.helpers.push({ id: 'wsc_cond_schedule_orphan_run', name: 'orphan' });
  const plan = await prepareCleanup(f.card, f.Base);
  assert.deepEqual(plan.schedules.map(x => x.entityId), [orphanId]);
  assert.deepEqual(plan.automations.map(x => x.id), [orphanAuto]);
  assert(plan.ambiguous.includes('automation.ambiguous'));
  assert(plan.helpers.some(x => x.id === 'wsc_cond_schedule_orphan_run'));
  assert(!f.calls.some(c => c.domain || ['POST', 'DELETE'].includes(c.method)), 'cleanup preview must be read-only');
  await assert.rejects(() => executeCleanup(f.card, f.Base, plan, 'yes'), /not confirmed/);
  const result = await executeCleanup(f.card, f.Base, plan, CLEANUP_PHRASE);
  assert.equal(result.schedules, 1); assert.equal(result.automations, 1); assert.equal(result.helpers, 1);
  assert(f.configs[autoId], 'referenced controller must remain');
  assert(f.configs.wsc_notify_ambiguous, 'ambiguous controller must remain');
  assert(f.schedules.some(s => s.entity_id === oldId), 'referenced schedule must remain');
}

{
  const f = fixture();
  const orphanId = 'switch.schedule_wsc_quick_timer_shared';
  f.schedules.push({ ...raw(orphanId), name: 'WSC Quick Timer - shared', tags: ['weekly_schedule_quick_timer'] });
  f.registry.push({ platform: 'automation', unique_id: 'wsc_notify_shared', entity_id: 'automation.shared' });
  f.configs.wsc_notify_shared = { description: 'User-owned replacement', trigger: [{ entity_id: orphanId }], action: [] };
  f.helpers.push({ id: 'wsc_cond_schedule_shared_run', name: 'shared' });
  f.configs.wsc_notify_shared.action.push({ service: 'input_text.set_value', target: { entity_id: 'input_text.wsc_cond_schedule_shared_run' } });
  const plan = await prepareCleanup(f.card, f.Base);
  assert(!plan.schedules.some(s => s.entityId === orphanId), 'schedule referenced by ambiguous WSC automation must be preserved');
  assert(!plan.helpers.some(h => h.id === 'wsc_cond_schedule_shared_run'), 'helper referenced by ambiguous WSC automation must be preserved');
}

{
  const f = fixture();
  const orphanId = 'switch.schedule_wsc_quick_timer_changed';
  f.schedules.push({ ...raw(orphanId), name: 'WSC Quick Timer - changed', tags: ['weekly_schedule_quick_timer'] });
  const plan = await prepareCleanup(f.card, f.Base);
  f.schedules.find(s => s.entity_id === orphanId).name = 'Changed after preview';
  await assert.rejects(() => executeCleanup(f.card, f.Base, plan, CLEANUP_PHRASE), /Schedule changed/);
  assert(f.schedules.some(s => s.entity_id === orphanId), 'changed candidate must be preserved');
}

console.log('Maintenance backup, safe restore and orphan cleanup tests passed');
