// Export the actual generated YAML-equivalent objects for HA's script engine tests.
import fs from 'node:fs';
import { buildController, controllerHelpers, runtimeRestore } from '../src/conditional-controller.js';
const id = 'switch.schedule_test';
const eid = 'climate.office';
const hs = controllerHelpers(id);
const condition = { condition: 'numeric_state', entity_id: 'sensor.test', above: 10 };
const make = overrides => buildController({ id, eid, helpers: hs, start: '08:00', stop: '20:00',
  conditions: [condition], active: [{ service: 'climate.set_hvac_mode', target: { entity_id: eid }, data: { hvac_mode: 'fan_only' } }],
  inactive: null, override: false, flag: 'automation.test_flag', ...overrides });
globalThis.HTMLElement = class {};
const { default: Base } = await import('../src/base-card.js');
const base = Object.create(Base.prototype);
const hysteresis = base._buildHACondition({ entity: 'sensor.test', operator: '<', value: '60', hysteresis: '3' }, `(states('${hs.meta}')[1:] | from_json).get('active', false)`);
const config = make({});
config.trigger.push({ platform: 'state', entity_id: 'sensor.test', id: 'eval' });
const output = { id, eid, hs, config,
  hysteresis: make({ conditions: [hysteresis] }),
  fallback: make({ inactive: [{ service: 'climate.turn_off', target: { entity_id: eid } }] }),
  override: make({ override: true, manualMatch: "is_state('climate.office', 'fan_only')" }),
  overnight: make({ start: '20:00', stop: '08:00' }),
  oneShot: make({ oneShotExpiry: '2026-09-11T20:00:00+00:00' }),
  restores: Object.fromEntries(['climate','light','fan','cover','valve','lock','switch','input_boolean','humidifier','water_heater'].map(d => [d, runtimeRestore(`${d}.office`)])),
};
fs.writeFileSync(process.argv[2] || '/tmp/wsc-conditional-fixtures.json', JSON.stringify(output));
