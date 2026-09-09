import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

globalThis.HTMLElement = class {
  attachShadow() { this.shadowRoot = { appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; } }; }
};
globalThis.customElements = { _m: new Map(), get(k) { return this._m.get(k); }, define(k, v) { this._m.set(k, v); } };
globalThis.window = { customCards: [] };
globalThis.document = { createElement() { return {}; } };
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true });
globalThis.CustomEvent = class {};

vm.runInThisContext(fs.readFileSync(new URL('../dist/quick-timer-card.js', import.meta.url), 'utf8'));
const QuickTimerCard = customElements.get('quick-timer-card');

const climateState = (overrides = {}) => ({
  entity_id: 'climate.office',
  state: 'cool',
  attributes: {
    temperature: 24,
    fan_mode: 'high',
    swing_mode: 'vertical',
    preset_mode: 'none',
    hvac_modes: ['off', 'cool', 'fan_only'],
  },
  last_changed: '2026-09-07T10:00:00Z',
  last_updated: '2026-09-07T10:00:00Z',
  context: {},
  ...overrides,
});

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._hass = { states: { 'climate.office': climateState() } };
  const restore = card._buildRestoreActions('climate.office');
  assert.deepEqual(restore.map(a => a.service), [
    'climate.set_hvac_mode',
    'climate.set_preset_mode',
    'climate.set_temperature',
    'climate.set_fan_mode',
    'climate.set_swing_mode',
  ]);
  card._hass.states['climate.office'] = climateState({ state: 'unavailable' });
  assert.deepEqual(card._buildRestoreActions('climate.office'), []);
}

{
  const card = new QuickTimerCard();
  card._entity = 'light.office';
  card._config = { entity: 'light.office', tile: { name: 'Office' } };
  card._hass = {
    states: {
      'light.office': { entity_id: 'light.office', state: 'unavailable', attributes: {} },
    },
  };
  assert.deepEqual(card._buildRestoreActions('light.office'), []);
  card._syncDraftFromEntity();
  assert.match(card._draftEditorHtml(), /Office/);
  assert.match(card._draftEditorHtml(), /disabled/);
}

{
  const card = new QuickTimerCard();
  assert.equal(card._isSupportedEntity('climate.office'), true);
  assert.equal(card._isSupportedEntity('sensor.temperature'), false);
}

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._hass = {
    states: {
      'climate.office': climateState(),
      'switch.schedule_office': {
        entity_id: 'switch.schedule_office', state: 'on', last_updated: '2026-09-07T10:00:00Z',
        attributes: { entities: [], actions: [{ service: 'climate.set_temperature', entity_id: 'climate.office' }] },
      },
      'switch.schedule_other': {
        entity_id: 'switch.schedule_other', state: 'on', last_updated: '2026-09-07T10:00:00Z',
        attributes: { entities: ['light.kitchen'], actions: [] },
      },
    },
  };
  const restore = card._buildRestoreActions('climate.office');
  const auto = card._buildTimerAutomation('climate.office', 'qt_test', 'run_1', 1000, 61000, restore,
    ['switch.schedule_wsc_quick_timer_climate_office_run_1']);
  const ids = auto.trigger.filter(t => t.id?.startsWith('schedule')).flatMap(t => t.entity_id || []);
  assert(ids.every(id => id === 'switch.schedule_office'));
  assert.deepEqual(auto.action[0].choose[0].sequence.map(a => a.service), ['scheduler.remove', 'automation.turn_off']);
  assert.deepEqual(auto.action[0].choose[1].sequence.slice(0, -2), restore);
  assert.equal(auto.action[0].choose[1].sequence.at(-2).service, 'scheduler.remove');
  const takeoverTemplate = auto.action[0].choose[0].conditions[1].value_template;
  assert(takeoverTemplate.startsWith('{% if '));
  assert(takeoverTemplate.endsWith('{% endif %}'));
  assert.match(takeoverTemplate, /"switch\.schedule_office":none/);
  assert.equal(takeoverTemplate.includes(':null'), false);
  assert.match(auto.action[0].choose[0].conditions[0].value_template, /expand/);
}

{
  const card = new QuickTimerCard();
  const regular = {
    entity_id: 'switch.schedule_office', state: 'on',
    attributes: { friendly_name: 'Office', entities: ['climate.office'], actions: [] },
  };
  const quick = {
    entity_id: 'switch.schedule_wsc_quick_timer_climate_office_run_1', state: 'triggered',
    attributes: { friendly_name: 'WSC Quick Timer - climate_office - run_1', entities: ['climate.office'], actions: [] },
  };
  card._hass = { states: { [regular.entity_id]: regular, [quick.entity_id]: quick } };
  card._storageData = { profiles: [{ id: 'default', name: 'Default', schedules: [], scheduleLinks: [], groups: [] }], activeProfiles: [] };
  card._wsSet = async () => {};
  card._ensureDefaultProfile();
  assert.deepEqual(card._storageData.profiles[0].schedules, [regular.entity_id]);
  assert.equal(card._getProfileSchedules('climate.office').some(s => s.entity_id === quick.entity_id), false);
  const seq = card._externalProfileSequence(card._storageData.profiles[0]);
  const offIds = seq.find(a => a.service === 'switch.turn_off')?.target.entity_id || [];
  assert.equal(offIds.includes(quick.entity_id), false);

  const fresh = new QuickTimerCard();
  fresh._hass = { states: { [quick.entity_id]: quick } };
  fresh._storageData = { profiles: [], activeProfiles: [] };
  fresh._wsSet = async () => {};
  fresh._ensureDefaultProfile();
  assert.deepEqual(fresh._storageData.profiles[0].schedules, []);
}

{
  const card = new QuickTimerCard();
  const quickId = 'switch.schedule_wsc_quick_timer_climate_office_run_2';
  const ownedId = 'switch.schedule_owned';
  const orphanId = 'switch.schedule_orphan';
  const calls = [];
  card._hass = {
    states: {
      [quickId]: { entity_id: quickId, state: 'triggered', attributes: { friendly_name: 'WSC Quick Timer - climate_office - run_2' } },
      [ownedId]: { entity_id: ownedId, state: 'on', attributes: {} },
      [orphanId]: { entity_id: orphanId, state: 'on', attributes: {} },
    },
    callService: async (domain, service, data) => calls.push({ domain, service, data }),
  };
  card._storageData = {
    profiles: [
      { id: 'p1', name: 'One', exclusive: true, schedules: [], scheduleLinks: [] },
      { id: 'p2', name: 'Two', exclusive: true, schedules: [ownedId], scheduleLinks: [] },
    ],
    activeProfiles: ['p2'],
  };
  card._wsSet = async data => { card._storageData = data; };
  card.render = () => {};
  await card._activateProfile('p1');
  const turnedOff = calls.filter(c => c.domain === 'switch' && c.service === 'turn_off').map(c => c.data.entity_id);
  assert.equal(turnedOff.includes(ownedId), true);
  assert.equal(turnedOff.includes(orphanId), true);
  assert.equal(turnedOff.includes(quickId), false);
}

{
  const card = new QuickTimerCard();
  const calls = [];
  const startTs = new Date(2026, 8, 8, 10, 15, 30).getTime();
  const endTs = startTs + 60 * 60000;
  card._hass = {
    states: {},
    callService: async (domain, service, data) => {
      calls.push({ domain, service, data });
      if (domain === 'scheduler' && service === 'add') {
        card._hass.states['switch.schedule_wsc_quick_timer_climate_office_run_1'] = {
          entity_id: 'switch.schedule_wsc_quick_timer_climate_office_run_1', state: 'on',
          attributes: { friendly_name: data.name },
        };
      }
    },
  };
  card._sleep = async () => {};
  const id = await card._createQuickSchedule('climate.office', 'run_1', startTs, endTs, [
    { service: 'climate.set_hvac_mode', target: { entity_id: 'climate.office' }, data: { hvac_mode: 'fan_only' } },
  ]);
  assert.equal(id, 'switch.schedule_wsc_quick_timer_climate_office_run_1');
  const add = calls[0].data;
  assert.equal(add.repeat_type, 'repeat');
  assert.equal(add.timeslots[0].start, '10:15:00');
  assert.equal(add.timeslots[0].stop, '11:16:00');
  assert.equal(add.timeslots[0].actions[0].service, 'climate.set_hvac_mode');

  const midnightCard = new QuickTimerCard();
  const midnightCalls = [];
  const lateTs = new Date(2026, 8, 8, 23, 50, 0).getTime();
  midnightCard._hass = {
    states: {},
    callService: async (domain, service, data) => {
      midnightCalls.push({ domain, service, data });
      if (domain === 'scheduler' && service === 'add') {
        midnightCard._hass.states['switch.schedule_wsc_quick_timer_light_office_run_2'] = {
          entity_id: 'switch.schedule_wsc_quick_timer_light_office_run_2', state: 'on',
          attributes: { friendly_name: data.name },
        };
      }
    },
  };
  midnightCard._sleep = async () => {};
  await midnightCard._createQuickSchedule('light.office', 'run_2', lateTs, lateTs + 30 * 60000, [
    { service: 'light.turn_on', target: { entity_id: 'light.office' }, data: {} },
  ]);
  assert.equal('stop' in midnightCalls[0].data.timeslots[0], false);
}

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._timers = {};
  let realCalls = 0;
  card._hass = {
    states: { 'climate.office': climateState() },
    callService: async () => { realCalls++; },
  };
  card._draftState = card._cloneState(card._hass.states['climate.office']);
  card._applyDraftService('climate', 'set_hvac_mode', { hvac_mode: 'fan_only' });
  card._applyDraftService('climate', 'set_fan_mode', { fan_mode: '100%' });
  assert.equal(realCalls, 0);
  assert.equal(card._draftState.state, 'fan_only');
  assert.equal(card._draftState.attributes.fan_mode, '100%');
  assert.equal(card._buildApplyActions('climate.office')[0].data.hvac_mode, 'fan_only');
}

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._timers = {};
  card._draftState = climateState({ state: 'fan_only', attributes: { ...climateState().attributes, fan_mode: '100%' } });
  const order = [];
  card._hass = {
    states: { 'climate.office': climateState() },
    callApi: async (method) => { order.push(`api:${method}`); },
    callService: async (domain, service) => { order.push(`service:${domain}.${service}`); },
  };
  card._readDurationSeconds = () => 60;
  card._createQuickSchedule = async () => { order.push('schedule:create'); return 'switch.schedule_wsc_quick_timer_test'; };
  card._resolveAutomationEntity = async () => 'automation.qt_test';
  card._saveTimers = async () => { order.push('store'); };
  card._setFootStatus = () => {};
  card.render = () => {};
  await card._startTimer({});
  assert(order.indexOf('api:POST') < order.indexOf('store'));
  assert(order.indexOf('store') < order.indexOf('service:scheduler.run_action'));
  assert.deepEqual(card._timers['climate.office'].scheduleIds, ['switch.schedule_wsc_quick_timer_test']);
}

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._timers = {};
  card._draftState = climateState({ state: 'fan_only' });
  const serviceCalls = [];
  card._hass = {
    states: { 'climate.office': climateState() },
    callService: async (domain, service) => {
      serviceCalls.push(`${domain}.${service}`);
      if (domain === 'scheduler' && service === 'run_action') throw new Error('run failed');
    },
  };
  card._readDurationSeconds = () => 60;
  card._createQuickSchedule = async () => 'switch.schedule_wsc_quick_timer_test';
  card._recreateAutomation = async () => {};
  card._resolveAutomationEntity = async () => 'automation.qt_test';
  card._saveTimers = async () => {};
  card._deleteAutomation = async () => { throw new Error('delete failed'); };
  card._callAction = async () => { throw new Error('apply/rollback failed'); };
  card._setFootStatus = () => {};
  card._sleep = async () => {};
  card._alert = async () => {};
  card.render = () => {};
  const savedError = console.error;
  console.error = () => {};
  await card._startTimer({});
  console.error = savedError;
  assert.ok(card._timers['climate.office']);
  assert.equal(serviceCalls.includes('automation.turn_on'), true);
}

{
  const card = new QuickTimerCard();
  card._entity = 'switch.office';
  card._timers = {
    'switch.office': {
      runId: 'run_1', autoId: 'qt_test', endTs: Date.now() + 60000,
      scheduleIds: ['switch.schedule_wsc_quick_timer_test'],
      restore: [{ service: 'switch.turn_off', target: { entity_id: 'switch.office' } }],
    },
  };
  const serviceCalls = [];
  card._hass = { states: {}, callService: async (domain, service) => { serviceCalls.push(`${domain}.${service}`); } };
  card._resolveAutomationEntity = async () => 'automation.qt_test';
  card._callAction = async () => {};
  card._saveTimers = async () => {};
  card._deleteAutomation = async () => { throw new Error('delete failed'); };
  card._alert = async () => {};
  const savedError = console.error;
  console.error = () => {};
  await card._cancelTimer('switch.office');
  console.error = savedError;
  assert.deepEqual(serviceCalls, ['automation.turn_off', 'scheduler.remove']);
  assert.ok(card._timers['switch.office']);
}

{
  const card = new QuickTimerCard();
  const now = Date.now();
  let deleted = 0;
  card._timers = {
    'switch.office': {
      runId: 'run_gc', autoId: 'qt_gc', createdTs: now - 20000, endTs: now + 40000,
      scheduleIds: ['switch.schedule_wsc_quick_timer_gc'], restore: [],
    },
  };
  card._hass = {
    states: {
      'automation.qt_gc': { entity_id: 'automation.qt_gc', state: 'off', attributes: { id: 'qt_gc' } },
    },
  };
  card._deleteAutomation = async () => { deleted++; };
  card._saveTimers = async () => {};
  await card._cleanupFinishedTimers();
  assert.equal(deleted, 1);
  assert.equal(card._timers['switch.office'], undefined);
}

{
  const card = new QuickTimerCard();
  const now = Date.now();
  const order = [];
  const scheduleId = 'switch.schedule_wsc_quick_timer_recover';
  card._timers = {
    'switch.office': {
      runId: 'run_recover', autoId: 'qt_missing', createdTs: now - 20000, endTs: now + 40000,
      scheduleIds: [scheduleId], restore: [{ service: 'switch.turn_off', target: { entity_id: 'switch.office' } }],
    },
  };
  card._hass = { states: { [scheduleId]: { entity_id: scheduleId, state: 'on', attributes: {} } } };
  card._callAction = async () => order.push('restore');
  card._removeQuickSchedules = async ids => order.push(`remove:${ids[0]}`);
  card._saveTimers = async () => {};
  await card._cleanupFinishedTimers();
  assert.deepEqual(order, ['restore', `remove:${scheduleId}`]);
  assert.equal(card._timers['switch.office'], undefined);
}

{
  const card = new QuickTimerCard();
  card._entities = [{ entity: 'climate.office' }];
  card._storageData = { profiles: [] };
  const before = { states: { 'climate.office': climateState() } };
  const afterAttr = { states: { 'climate.office': climateState({ last_updated: '2026-09-07T10:00:01Z' }) } };
  assert.equal(card._hassChangedRelevant(before, afterAttr), true);
  const withSchedule = {
    states: {
      ...before.states,
      'switch.schedule_office': {
        entity_id: 'switch.schedule_office', state: 'on', last_updated: '2026-09-07T10:00:00Z',
        attributes: { entities: ['climate.office'], actions: [] },
      },
    },
  };
  assert.equal(card._hassChangedRelevant(withSchedule, before), true);

  const scheduleBefore = {
    states: {
      ...before.states,
      'switch.schedule_office': {
        entity_id: 'switch.schedule_office', state: 'on', last_updated: '2026-09-07T10:00:00Z',
        attributes: { entities: ['climate.office'], actions: [] },
      },
    },
  };
  const scheduleAfter = {
    states: {
      ...before.states,
      'switch.schedule_office': {
        entity_id: 'switch.schedule_office', state: 'on', last_updated: '2026-09-07T10:00:01Z',
        attributes: { entities: ['light.kitchen'], actions: [] },
      },
    },
  };
  assert.equal(card._hassChangedRelevant(scheduleBefore, scheduleAfter), true);
}

{
  const card = new QuickTimerCard();
  card._entity = 'switch.office';
  card._timers = {};
  card._hass = { states: { 'switch.office': { entity_id: 'switch.office', state: 'off', attributes: {} } } };
  card._syncDraftFromEntity();
  card._applyDraftService('switch', 'toggle');
  assert.equal(card._draftState.state, 'on');
  card._applyDraftService('switch', 'toggle');
  assert.equal(card._draftState.state, 'off');
  card._entity = 'cover.office';
  card._draftActions = [];
  card._draftState = { state: 'open', attributes: { current_position: 70 } };
  card._applyDraftService('cover', 'close_cover');
  assert.equal(card._draftState.attributes.current_position, 0);
  assert.equal(card._buildApplyActions('cover.office')[0].service, 'cover.close_cover');
  card._entity = 'fan.office';
  card._draftActions = [];
  card._draftState = { state: 'on', attributes: { percentage: 60 } };
  card._applyDraftService('fan', 'set_percentage', { percentage: 0 });
  assert.equal(card._draftState.state, 'off');
  assert.equal(card._buildApplyActions('fan.office')[0].data.percentage, 0);
}

// Realistic preset side effect: it resets the thermostat setpoint.
{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._hass = { states: { 'climate.office': climateState() } };
  let temperature = 30;
  for (const action of card._buildRestoreActions('climate.office')) {
    if (action.service === 'climate.set_preset_mode') temperature = 20;
    if (action.service === 'climate.set_temperature') temperature = action.data.temperature;
  }
  assert.equal(temperature, 24, 'restore must survive preset overwriting the setpoint');
  card._config = { entity: 'climate.office' };
  card._hass.states['climate.office'].attributes.fan_modes = ['low', 'high'];
  card._hass.states['climate.office'].attributes.preset_modes = ['none', 'eco'];
  card._syncDraftFromEntity();
  assert.match(card._draftEditorHtml(), /data-draft-field="fan_mode"/);
  assert.match(card._draftEditorHtml(), /data-draft-field="preset_mode"/);
}

// A failed schedule removal after Cancel must retry cleanup, without a second restore.
{
  const card = new QuickTimerCard();
  const eid = 'switch.office';
  const scheduleId = 'switch.schedule_wsc_quick_timer_retry';
  card._entity = eid;
  card._timers = { [eid]: {
    runId: 'retry', autoId: 'qt_retry', createdTs: Date.now() - 30000,
    endTs: Date.now() + 60000, scheduleIds: [scheduleId],
    restore: [{ service: 'switch.turn_off', target: { entity_id: eid } }],
  } };
  let restored = 0, removes = 0, deleted = 0;
  card._hass = {
    states: {
      [scheduleId]: { entity_id: scheduleId, state: 'on', attributes: {} },
      'automation.qt_retry': { entity_id: 'automation.qt_retry', state: 'on', attributes: { id: 'qt_retry' } },
    },
    callService: async () => {},
  };
  card._callAction = async () => { restored++; };
  card._removeQuickSchedules = async () => { if (++removes === 1) throw new Error('temporary failure'); };
  card._deleteAutomation = async () => { deleted++; };
  card._saveTimers = async () => {};
  card._alert = async () => {};
  card.render = () => {};
  const log = console.error;
  console.error = () => {};
  try { await card._cancelTimer(eid); } finally { console.error = log; }
  assert.equal(card._timers[eid].phase, 'cleanup');
  await card._cleanupFinishedTimers();
  assert.equal(restored, 1);
  assert.equal(removes, 2);
  assert.equal(deleted, 1);
  assert.equal(card._timers[eid], undefined);
}

{
  const card = new QuickTimerCard();
  card._hass = { states: {}, callApi: async () => { throw new Error('network failure'); } };
  await assert.rejects(card._deleteAutomation('missing-from-state'), /network failure/);
  await assert.rejects(card._resolveAutomationEntity('missing-from-state', 0), /did not become available/);
  card._entity = 'switch.office';
  card._timers = { 'switch.office': { autoId: 'busy', endTs: Date.now() + 60000 } };
  card._readDurationSeconds = () => { throw new Error('must not begin a second run'); };
  await card._startTimer({});
}

console.log('Quick Timer tests passed');
