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
    'climate.set_temperature',
    'climate.set_preset_mode',
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
  const cfg = card._buildNativeCardConfig();
  assert.equal(cfg.name, 'Office');
  let blocked = 0;
  card._timers = {};
  card._guardDraftMoreInfo({
    preventDefault() { blocked++; },
    stopImmediatePropagation() { blocked++; },
    stopPropagation() { blocked++; },
  });
  assert.equal(blocked, 3);
  card._timers['light.office'] = { endTs: Date.now() + 60000, autoId: 'qt_test' };
  card._guardDraftMoreInfo({ preventDefault() { blocked++; } });
  assert.equal(blocked, 3);
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
  const auto = card._buildTimerAutomation('climate.office', 'qt_test', 'run_1', 1000, 61000, restore);
  const ids = auto.trigger.filter(t => t.id?.startsWith('schedule')).flatMap(t => t.entity_id || []);
  assert(ids.every(id => id === 'switch.schedule_office'));
  assert.deepEqual(auto.action[0].choose[0].sequence.map(a => a.service), ['script.turn_on']);
  assert.deepEqual(auto.action[0].choose[1].sequence.slice(0, -1), restore);
  assert.equal(auto.action[0].choose[1].sequence.at(-1).service, 'script.turn_on');
  const takeoverTemplate = auto.action[0].choose[0].conditions[0].value_template;
  assert(takeoverTemplate.startsWith('{% if '));
  assert(takeoverTemplate.endsWith('{% endif %}'));
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
  const draftHass = card._draftHassObject();
  await draftHass.callService('climate', 'set_hvac_mode', { entity_id: 'climate.office', hvac_mode: 'fan_only' });
  await draftHass.callService('climate', 'set_fan_mode', { entity_id: 'climate.office', fan_mode: '100%' });
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
    states: {
      'climate.office': climateState(),
      'script.wsc_quick_timer_cleanup': { entity_id: 'script.wsc_quick_timer_cleanup', state: 'off', attributes: {} },
    },
    callApi: async (method) => { order.push(`api:${method}`); },
    callService: async (domain, service) => { order.push(`service:${domain}.${service}`); },
  };
  card._readDurationSeconds = () => 60;
  card._resolveAutomationEntity = async () => 'automation.qt_test';
  card._saveTimers = async () => { order.push('store'); };
  card._setFootStatus = () => {};
  card.render = () => {};
  await card._startTimer({});
  assert(order.indexOf('api:POST') < order.indexOf('store'));
  assert(order.indexOf('store') < order.findIndex(x => x.startsWith('service:climate.')));
}

{
  const card = new QuickTimerCard();
  card._entity = 'climate.office';
  card._timers = {};
  card._draftState = climateState({ state: 'fan_only' });
  const serviceCalls = [];
  card._hass = {
    states: {
      'climate.office': climateState(),
      'script.wsc_quick_timer_cleanup': { entity_id: 'script.wsc_quick_timer_cleanup', state: 'off', attributes: {} },
    },
    callService: async (domain, service) => { serviceCalls.push(`${domain}.${service}`); },
  };
  card._readDurationSeconds = () => 60;
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
      restore: [{ service: 'switch.turn_off', target: { entity_id: 'switch.office' } }],
    },
  };
  const serviceCalls = [];
  card._hass = { states: {}, callService: async (domain, service) => { serviceCalls.push(`${domain}.${service}`); } };
  card._resolveAutomationEntity = async () => 'automation.qt_test';
  card._callAction = async () => {};
  card._deleteAutomation = async () => { throw new Error('delete failed'); };
  card._alert = async () => {};
  const savedError = console.error;
  console.error = () => {};
  await card._cancelTimer('switch.office');
  console.error = savedError;
  assert.deepEqual(serviceCalls, ['automation.turn_off', 'automation.turn_on']);
  assert.ok(card._timers['switch.office']);
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

console.log('Quick Timer tests passed');
