import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { compressToBase64 } from '../src/lz-string.js';

globalThis.HTMLElement = class {
  attachShadow() { this.shadowRoot = { querySelector() { return null; }, querySelectorAll() { return []; } }; }
};
globalThis.window = { dispatchEvent() {}, customCards: [] };
globalThis.customElements = { entries: new Map(), get(k) { return this.entries.get(k); }, define(k, v) { this.entries.set(k, v); } };
globalThis.CustomEvent = class {};
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true });
vm.runInThisContext(fs.readFileSync(new URL('../dist/weekly-schedule-card.js', import.meta.url), 'utf8'));
// Exercise the shipped bundle, including mini-card integration, not a test-only copy.
const Base = Object.getPrototypeOf(customElements.get('quick-timer-card').prototype).constructor;
const profiles = {
  groups: [], activeProfiles: ['summer'],
  profiles: [
    { id: 'summer', name: 'Estate', exclusive: true, groups: [], schedules: ['switch.schedule_a'], scheduleLinks: [] },
    { id: 'winter', name: 'Inverno', exclusive: true, groups: [], schedules: ['switch.schedule_b'], scheduleLinks: [] },
  ],
};
const state = (entity_id, value) => ({ entity_id, state: value, attributes: {} });
function store(data = profiles) {
  const payload = compressToBase64(JSON.stringify(data));
  const out = {};
  let n = 0;
  for (let i = 0; i < payload.length; i += 255) {
    const id = `input_text.wsc_store_${n++}`;
    out[id] = state(id, payload.slice(i, i + 255));
  }
  out['input_text.wsc_store_meta'] = state('input_text.wsc_store_meta', String(n));
  return out;
}
function fixture(states, options = {}) {
  const c = new Base();
  const server = options.server || states;
  const calls = [];
  const helpers = options.helpers || Object.keys(server).filter(k => k.startsWith('input_text.')).map(k => ({ id: k.slice(11) }));
  c._hass = {
    states, user: { is_admin: options.admin !== false },
    connection: { sendMessagePromise: async msg => {
      calls.push(msg);
      if (options.fail === msg.type) throw new Error('connection unavailable');
      if (msg.type === 'get_states') return Object.values(server);
      if (msg.type === 'get_config') return { state: options.haState || 'RUNNING' };
      if (msg.type === 'input_text/list') return helpers;
      if (msg.type === 'frontend/get_user_data') return { value: options.legacy || null };
      if (options.allowWrites) {
        if (msg.type === 'config/entity_registry/update') return {};
        if (msg.type === 'input_text/create') {
          const id = msg.name.toLowerCase().replaceAll(' ', '_');
          assert(!server[`input_text.${id}`], `duplicate helper: ${id}`);
          helpers.push({ id, name: msg.name });
          server[`input_text.${id}`] = state(`input_text.${id}`, 'unknown');
          return { id };
        }
        if (msg.type === 'input_text/delete') {
          delete server[`input_text.${msg.input_text_id}`];
          return {};
        }
      }
      throw new Error(`Unexpected mutation/API: ${msg.type}`);
    } },
    callService: async (...args) => {
      calls.push({ service: args });
      if (options.allowWrites && args[0] === 'input_text' && args[1] === 'set_value') {
        assert(server[args[2].entity_id]);
        assert(args[2].value.length <= 255);
        server[args[2].entity_id] = state(args[2].entity_id, args[2].value);
        return;
      }
      throw new Error('Unexpected service');
    },
  };
  c.render = () => {};
  c._ensureRoot = () => (c.root ||= { innerHTML: '' });
  return { c, calls, server };
}

// Reproduce the reported symptom: unreadable existing storage must NEVER become
// an empty store (which _ensureDefaultProfile would save over all old profiles).
{
  const states = store();
  delete states['input_text.wsc_store_0'];
  const { c, calls } = fixture(states);
  await assert.rejects(() => c._wsGet(), /storage/i);
  assert(!calls.some(m => m.type === 'frontend/get_user_data'), 'do not migrate stale per-user data over existing storage');
}
// Invalid states/metadata and malformed schemas must not reach default bootstrap.
for (const value of ['unknown', 'unavailable', '', '2broken', '-1', '9007199254740999']) {
  const states = store();
  states['input_text.wsc_store_meta'].state = value;
  const { c } = fixture(states, { legacy: profiles });
  await assert.rejects(() => c._wsGet(), /storage/i);
}
for (const value of ['unknown', 'unavailable', '', 'corrupt!!!']) {
  const states = store();
  states['input_text.wsc_store_0'].state = value;
  await assert.rejects(() => fixture(states).c._wsGet(), /storage/i);
}
for (const value of [null, {}, [], { profiles: 'broken' }, { profiles: [null] }, { profiles: [{ id: 'x', schedules: {} }] }]) {
  await assert.rejects(() => fixture(store(value)).c._wsGet(), /storage/i);
}
// A stale browser snapshot can recover the complete store from the server.
{
  const { c, calls } = fixture({}, { server: store() });
  assert.deepEqual(await c._wsGet(), profiles);
  assert.deepEqual(calls.map(m => m.type), ['get_states']);
}
// Missing states do not imply missing configured (disabled/renamed) helpers.
for (const helper of [{ id: 'wsc_store_meta' }, { id: 'renamed', name: 'WSC Store 0' }, { id: 'wsc_profile_active' }]) {
  await assert.rejects(() => fixture({}, { helpers: [helper] }).c._wsGet(), /storage/i);
}
for (const haState of ['STARTING', 'STOPPING', 'NOT_RUNNING']) {
  await assert.rejects(() => fixture({}, { haState }).c._wsGet(), /storage/i);
}
for (const fail of ['get_states', 'get_config', 'input_text/list', 'frontend/get_user_data']) {
  await assert.rejects(() => fixture({}, { fail }).c._wsGet());
}
// Brand-new installation still bootstraps, including adopting ordinary schedules.
{
  const s = state('switch.schedule_existing', 'on');
  const { c } = fixture({ [s.entity_id]: s });
  c._storageData = await c._wsGet();
  const writes = [];
  c._wsSetNow = async data => writes.push(structuredClone(data));
  await c._ensureDefaultProfile();
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].profiles[0].schedules, [s.entity_id]);
}
// Legacy groups-only storage is still a supported migration source. A non-admin
// may read their old data; they cannot silently overwrite existing global helpers.
{
  const legacy = { groups: [{ id: 'room', name: 'Room', entities: [] }] };
  assert.deepEqual(await fixture({}, { legacy, admin: false }).c._wsGet(), legacy);
  assert.deepEqual(await Base._sharedGet({ states: store(legacy) }, 'weekly_schedule_card'), legacy);
}
// If a different card starts provisioning between absence checks, do not bootstrap.
{
  const { c, server } = fixture({});
  const send = c._hass.connection.sendMessagePromise;
  c._hass.connection.sendMessagePromise = async msg => {
    const result = await send(msg);
    if (msg.type === 'input_text/list') server['input_text.wsc_store_meta'] = state('input_text.wsc_store_meta', 'unknown');
    return result;
  };
  await assert.rejects(() => c._wsGet(), /storage/i);
}
// Failed reads must not run migrations, cleanup or external-profile synchronization.
{
  const states = store();
  delete states['input_text.wsc_store_0'];
  const { c, calls } = fixture(states);
  const tasks = [];
  for (const method of ['_migrateConditionalSchedules', '_cleanupOrphanAutomations', '_cleanupExpiredOneShots', '_hideStoreHelpers', '_syncExternalProfileControl'])
    c[method] = async () => tasks.push(method);
  let retries = 0;
  c._retryProfileStorage = () => retries++;
  await c._loadProfileStorage();
  assert.equal(c._storageData, null);
  assert.equal(c._loadingStorage, false);
  assert.match(c.root.innerHTML, /Profile data is unavailable/);
  assert.equal(retries, 1);
  assert.deepEqual(tasks, []);
  assert(!calls.some(m => m.service || /create|delete|update/.test(m.type)));
  // Helpers eventually finish restoring: the next attempt recovers both profiles.
  Object.assign(states, store());
  await c._loadProfileStorage();
  assert.deepEqual(c._storageData, profiles);
  assert.equal(c._storageError, null);
  assert.equal(tasks.length, 5);
  assert(!calls.some(m => m.service || /create|delete|update/.test(m.type)));
}
// Await the bootstrap save before provisioning other WSC helpers; otherwise those
// helpers would falsely make the first write look like damaged existing storage.
{
  const { c } = fixture({});
  let finish;
  let syncs = 0;
  c._wsSet = () => new Promise(resolve => { finish = resolve; });
  for (const method of ['_migrateConditionalSchedules', '_cleanupOrphanAutomations', '_cleanupExpiredOneShots', '_hideStoreHelpers', '_syncExternalProfileControl'])
    c[method] = async () => syncs++;
  const loading = c._loadProfileStorage();
  for (let i = 0; i < 30 && !finish; i++) await Promise.resolve();
  assert(finish);
  assert.equal(syncs, 0);
  finish();
  await loading;
  assert.equal(syncs, 5);
}
// Even an already-open card must not overwrite unreadable persisted data.
{
  const states = store();
  delete states['input_text.wsc_store_0'];
  const { c, calls } = fixture(states);
  await assert.rejects(() => Base._sharedSet(c._hass, 'weekly_schedule_card', profiles), /storage/i);
  assert(!calls.some(m => m.service || /create|delete|update/.test(m.type)));
}
// Cross-device refresh must preserve the last good profiles and suppress orphan
// cleanup when schedules disappear together with unreadable storage during restart.
{
  const full = { ...store(), 'switch.schedule_a': state('switch.schedule_a', 'on') };
  const { c } = fixture(full);
  c._storageData = structuredClone(profiles);
  c._prevHass = c._hass;
  let cleanups = 0;
  c._cleanupOrphanAutomations = async () => cleanups++;
  const next = store();
  delete next['input_text.wsc_store_0'];
  c.hass = { ...c._hass, states: next };
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.deepEqual(c._storageData, profiles);
  assert.equal(cleanups, 0);
}
// The mini card must retry an unreadable first snapshot and refresh across devices.
{
  const Mini = customElements.get('weekly-schedule-mini-card');
  const c = new Mini(); c._render = () => {}; c._scheduleMiniRender = () => {};
  const drain = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
  c.hass = { states: {} }; await drain();
  assert(!c._storageData);
  c.hass = { states: store() }; await drain();
  assert.deepEqual(c._storageData, profiles);
  c.hass = { states: {} }; await drain();
  assert.deepEqual(c._storageData, profiles);
  const changed = { ...profiles, activeProfiles: ['winter'] };
  c.hass = { states: store(changed) }; await drain();
  assert.deepEqual(c._storageData, changed);
}
// Confirm first save, legacy migration, subsequent saves and stale-browser writes
// still work using realistic helper creation IDs and immediate server readback.
{
  Base._createdHelpers = new Set();
  const { c, server, calls } = fixture({}, { allowWrites: true, legacy: profiles });
  assert.deepEqual(await c._wsGet(), profiles);
  assert.deepEqual(await Base._sharedGet({ states: server }, 'weekly_schedule_card'), profiles);
  const creates = calls.filter(m => m.type === 'input_text/create').length;
  assert(creates >= 2);
  const next = { ...profiles, activeProfiles: ['winter'] };
  // Stale snapshot intentionally excludes helpers already created server-side.
  await Base._sharedSet({ ...c._hass, states: {} }, 'weekly_schedule_card', next);
  assert.deepEqual(await Base._sharedGet({ states: server }, 'weekly_schedule_card'), next);
  assert.equal(calls.filter(m => m.type === 'input_text/create').length, creates);
  assert(calls.filter(m => m.service).every(m => m.service[0] === 'input_text'));
}
{
  Base._createdHelpers = new Set();
  const { c, server } = fixture({}, { allowWrites: true });
  await Base._sharedSet(c._hass, 'weekly_schedule_card', profiles);
  assert.deepEqual(await Base._sharedGet({ states: server }, 'weekly_schedule_card'), profiles);
}
console.log('Profile storage regression tests passed');
