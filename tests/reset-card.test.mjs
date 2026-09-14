import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { compressToBase64 } from '../src/lz-string.js';
import { prepareReset, executeReset, RESET_PHRASE } from '../src/reset-card.js';
globalThis.HTMLElement = class { attachShadow() { this.shadowRoot = { querySelector() { return null; }, querySelectorAll() { return []; } }; } };
globalThis.customElements = { m: new Map(), get(k) { return this.m.get(k); }, define(k, v) { this.m.set(k, v); } };
globalThis.window = { customCards: [], dispatchEvent() {} };
globalThis.CustomEvent = class {};
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true });
vm.runInThisContext(fs.readFileSync(new URL('../dist/weekly-schedule-card.js', import.meta.url), 'utf8'));
const Base = Object.getPrototypeOf(customElements.get('quick-timer-card').prototype).constructor;
const AUTO = 'wsc_cond_schedule_a';
const sid = 'switch.schedule_a';
const foreign = 'switch.schedule_other';
const aid = 'automation.renamed_controller';
const helper = 'wsc_cond_schedule_a_run';
const state = (entity_id, value, attributes = {}) => ({ entity_id, state: value, attributes });

function fixture() {
  Base._createdHelpers = new Set(); Base._resetSessions = new WeakSet();
  const data = { groups: [], activeProfiles: ['summer'], profiles: [{ id: 'summer', name: 'Summer', groups: [], schedules: [sid], scheduleLinks: [{ id: sid, condAutoId: AUTO, condHelpers: [`input_text.${helper}`] }] }] };
  const states = {
    [sid]: state(sid, 'triggered', { actions: [], current_slot: 0, timeslots: ['09:30 - 18:00'] }),
    [foreign]: state(foreign, 'on', { actions: [] }),
    [aid]: state(aid, 'on', { id: AUTO }),
    'automation.unrelated': state('automation.unrelated', 'on', { id: 'unrelated' }),
    [`input_text.${helper}`]: state(`input_text.${helper}`, '#{}'),
    'input_text.personal': state('input_text.personal', 'keep'),
  };
  const helpers = [{ id: helper, name: helper }, { id: 'personal', name: 'Personal' }];
  const registry = [
    { entity_id: aid, unique_id: AUTO, platform: 'automation' },
    { entity_id: 'automation.unrelated', unique_id: 'unrelated', platform: 'automation' },
    { entity_id: `input_text.${helper}`, unique_id: helper, platform: 'input_text' },
  ];
  const configs = { [AUTO]: { description: 'WSC conditional controller v1; snapshot is held in input_text helpers.', action: [{ service: 'fan.turn_on' }] } };
  const writeStore = value => {
    const payload = compressToBase64(JSON.stringify(value));
    let n = 0;
    for (let i = 0; i < payload.length; i += 255) {
      const id = `wsc_store_${n++}`;
      states[`input_text.${id}`] = state(`input_text.${id}`, payload.slice(i, i + 255));
      if (!helpers.some(h => h.id === id)) helpers.push({ id });
    }
    states['input_text.wsc_store_meta'] = state('input_text.wsc_store_meta', String(n));
    if (!helpers.some(h => h.id === 'wsc_store_meta')) helpers.push({ id: 'wsc_store_meta' });
  };
  writeStore(data);
  const calls = [];
  let failure = null;
  const card = new Base();
  card._storageData = data; card.render = () => {};
  card._hass = { states, user: { is_admin: true },
    connection: { sendMessagePromise: async msg => {
      calls.push(msg);
      if (msg.type === failure) throw new Error('simulated failure');
      switch (msg.type) {
        case 'get_states': return Object.values(states);
        case 'get_config': return { state: 'RUNNING' };
        case 'config/entity_registry/list': return registry;
        case 'input_text/list': return helpers;
        case 'config/entity_registry/update': return {};
        case 'frontend/set_user_data': return {};
        case 'input_text/create': {
          const id = msg.name.toLowerCase().replaceAll(' ', '_');
          assert(!states[`input_text.${id}`], `duplicate ${id}`);
          helpers.push({ id }); states[`input_text.${id}`] = state(`input_text.${id}`, 'unknown'); return { id };
        }
        case 'input_text/delete': {
          assert.notEqual(msg.input_text_id, 'personal');
          delete states[`input_text.${msg.input_text_id}`];
          const i = helpers.findIndex(h => h.id === msg.input_text_id); if (i >= 0) helpers.splice(i, 1);
          return {};
        }
        default: throw new Error(`Unexpected API ${msg.type}`);
      }
    } },
    callApi: async (method, path) => {
      calls.push({ method, path });
      if (method === failure) throw new Error('simulated failure');
      const id = path.split('/').at(-1);
      if (!configs[id]) throw { status: 404 };
      if (method === 'GET') return structuredClone(configs[id]);
      assert.equal(method, 'DELETE'); delete configs[id];
      const e = registry.find(x => x.unique_id === id); if (e) delete states[e.entity_id];
    },
    callService: async (domain, service, payload) => {
      calls.push({ domain, service, payload });
      if (`${domain}.${service}` === failure) throw new Error('simulated failure');
      if (domain === 'input_text') { assert(states[payload.entity_id]); states[payload.entity_id] = state(payload.entity_id, payload.value); return; }
      if (domain === 'automation') {
        assert.equal(payload.entity_id, aid); assert.equal(service, 'turn_off'); assert.equal(payload.stop_actions, true);
        states[aid].state = 'off'; return;
      }
      assert.equal(domain, 'scheduler'); assert.equal(service, 'remove'); assert.equal(payload.entity_id, sid);
      delete states[payload.entity_id];
    },
  };
  return { card, calls, states, configs, helpers, writeStore, data, fail(value) { failure = value; } };
}
const mutations = calls => calls.filter(x => x.domain || x.method === 'DELETE' || /create|delete|update|set_user_data/.test(x.type || ''));

{
  const f = fixture(); const p = await prepareReset(f.card, Base);
  assert.equal(p.schedules.length, 1); assert.equal(p.automations[0].entityId, aid);
  assert.equal(p.helpers.length, 1); assert.deepEqual(p.ignored, [foreign]);
  assert.equal(mutations(f.calls).length, 0, 'preview/export is read-only');
  await assert.rejects(() => executeReset(f.card, Base, p, 'yes'), /not confirmed/);
  assert.equal(mutations(f.calls).length, 0);
  Base._createdHelpers.add(`input_text.${helper}`);
  const clean = await executeReset(f.card, Base, p, RESET_PHRASE);
  assert(!Base._createdHelpers.has(`input_text.${helper}`), 'deleted helpers must be creatable again');
  assert(!f.states[sid]); assert(!f.states[aid]); assert(!f.states[`input_text.${helper}`]);
  assert.equal(f.states[foreign].state, 'on'); assert(f.states['automation.unrelated']); assert(f.states['input_text.personal']);
  assert.deepEqual(await Base._sharedGet(f.card._hass, 'weekly_schedule_card'), clean);
  assert.equal(clean.profiles[0].schedules.length, 0); assert(!clean.resetPending);
  const stop = f.calls.findIndex(c => c.domain === 'automation');
  const delAuto = f.calls.findIndex(c => c.method === 'DELETE');
  const delSched = f.calls.findIndex(c => c.domain === 'scheduler');
  assert(stop < delAuto && delAuto < delSched);
  assert(!f.calls.some(c => c.domain && !['input_text', 'automation', 'scheduler'].includes(c.domain)));
  await f.card._ensureDefaultProfile();
  assert.deepEqual(f.card._storageData.profiles[0].schedules, [], 'unassigned schedules must not be adopted after reset');
  assert(!JSON.stringify(f.card._externalProfileSequence(clean.profiles[0])).includes(foreign));
}
for (const step of ['automation.turn_off', 'DELETE', 'scheduler.remove', 'input_text/delete', 'frontend/set_user_data']) {
  const f = fixture(); const p = await prepareReset(f.card, Base);
  f.fail(step);
  await assert.rejects(() => executeReset(f.card, Base, p, RESET_PHRASE), /interrupted/i);
  const saved = await Base._sharedGet(f.card._hass, 'weekly_schedule_card');
  assert.equal(saved.resetPending.id, p.id); assert.equal(saved.profiles[0].id, 'summer');
  assert(Base._isResetPaused(f.card._hass));
  await assert.rejects(() => Base._sharedSet(f.card._hass, 'weekly_schedule_card', f.data), /reset in progress/);
  if (step === 'automation.turn_off') assert(!f.calls.some(c => c.method === 'DELETE' || c.domain === 'scheduler'));
  // Emulate browser reload: the persisted inventory, not session memory, allows resume.
  Base._resetSessions = new WeakSet(); f.fail(null);
  const resumed = await prepareReset(f.card, Base);
  assert.equal(resumed.id, p.id);
  await executeReset(f.card, Base, resumed, RESET_PHRASE);
  assert(!Base._isResetPaused(f.card._hass));
  assert(f.states[foreign]);
}
{
  const f = fixture(); const p = await prepareReset(f.card, Base);
  f.writeStore({ ...f.data, activeProfiles: [] });
  await assert.rejects(() => executeReset(f.card, Base, p, RESET_PHRASE), /changed/i);
  assert.equal(mutations(f.calls).length, 0);
}
{
  const f = fixture(); f.configs[AUTO].description = 'User automation';
  await assert.rejects(() => prepareReset(f.card, Base), /ambiguous/);
  assert.equal(mutations(f.calls).length, 0);
}
for (const target of ['automation', 'schedule', 'helper']) {
  const f = fixture(); const p = await prepareReset(f.card, Base);
  if (target === 'automation') f.configs[AUTO].action = [{ service: 'lock.unlock' }];
  if (target === 'schedule') f.states[sid].attributes.timeslots = ['00:00 - 23:59'];
  if (target === 'helper') f.helpers[0] = { ...f.helpers[0], name: 'Repurposed helper' };
  await assert.rejects(() => executeReset(f.card, Base, p, RESET_PHRASE), /changed/i);
  assert.equal(mutations(f.calls).length, 0, 'stale inventories must not start deleting');
}
{
  const f = fixture(); const p = await prepareReset(f.card, Base);
  p.schedules.push({ entity_id: 'switch.unrelated' });
  await assert.rejects(() => executeReset(f.card, Base, p, RESET_PHRASE), /Invalid reset target/);
  assert.equal(mutations(f.calls).length, 0);
}
{
  const f = fixture(); f.card._hass.user.is_admin = false;
  await assert.rejects(() => prepareReset(f.card, Base), /Administrator/);
  assert.equal(f.calls.length, 0);
}
{
  const f = fixture();
  const Timer = customElements.get('quick-timer-card');
  const timer = new Timer(); timer._timers = { old: { endTs: Date.now() + 60000 } };
  timer._showResetPending = timer._syncDraftFromEntity = timer._renderDraftEditor = timer.render = () => {};
  timer._cleanupFinishedTimers = async () => {};
  f.writeStore({ ...f.data, resetPending: { id: 'reset_test' } });
  timer.hass = f.card._hass;
  assert(timer._resetWasPending);
  // The empty timer store arrived during maintenance; only the profile store
  // changes on the final event. Resuming must still discard the cached timer.
  f.states['input_text.wsc_qt_store_0'] = state('input_text.wsc_qt_store_0', compressToBase64('{"timers":{}}'));
  f.states['input_text.wsc_qt_store_meta'] = state('input_text.wsc_qt_store_meta', '1');
  timer.hass = f.card._hass;
  f.writeStore(f.data);
  timer.hass = f.card._hass;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(timer._timers, {});
  assert(!timer._resetWasPending);
}
console.log('Reset inventory, confirmation, ordering and retry tests passed');
