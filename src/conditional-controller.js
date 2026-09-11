// Conditional schedules: Scheduler keeps time; this HA automation owns target writes.
// Runtime state lives in HA helpers, never in the browser or an ephemeral scene.
export const CONTROLLER_VERSION = 1;
export const SNAPSHOT_CHUNKS = 8;
const MARKER = 'WSC conditional v1';
const tpl = expr => `{{ ${expr} }}`;
const check = expr => ({ condition: 'template', value_template: tpl(expr) });
const set = (entity, value) => ({ service: 'input_text.set_value', target: { entity_id: entity }, data: { value } });

export function conditionalMarker(eid, actions) {
  return [{ service: 'logbook.log', entity_id: eid, service_data: {
    name: MARKER, message: JSON.stringify(actions),
  } }];
}

// Decode from Scheduler itself: works in mini cards, other accounts and before storage loads.
export function effectiveSchedule(s) {
  const a = s?.attributes?.actions?.[0];
  const d = a?.service_data || a?.data;
  if (a?.service !== 'logbook.log' || d?.name !== MARKER) return s;
  try {
    const actions = JSON.parse(d.message);
    if (!Array.isArray(actions) || !actions.length || actions.some(x => typeof x.service !== 'string')) return s;
    return { ...s, attributes: { ...s.attributes, entities: [a.entity_id], actions } };
  } catch { return s; }
}

export function controllerHelpers(id, snapshot = true) {
  const stem = `input_text.wsc_cond_${id.replace('switch.', '')}`;
  return { meta: `${stem}_run`, chunks: snapshot ? Array.from({ length: SNAPSHOT_CHUNKS }, (_, i) => `${stem}_${i}`) : [] };
}

const ATTRS = {
  climate: ['temperature', 'target_temp_low', 'target_temp_high', 'preset_mode', 'fan_mode', 'swing_mode', 'swing_horizontal_mode'],
  light: ['brightness', 'color_mode', 'color_temp_kelvin', 'rgb_color', 'rgbw_color', 'rgbww_color', 'hs_color', 'xy_color', 'effect'],
  fan: ['percentage', 'preset_mode', 'oscillating', 'direction'],
  cover: ['current_position'], valve: ['current_position'],
  humidifier: ['humidity', 'mode'], water_heater: ['temperature'],
  lock: [], switch: [], input_boolean: [],
};

// Same explicit services/order as Quick Timer; templates read the immutable runtime snapshot.
export function runtimeRestore(eid) {
  const dom = eid.split('.')[0];
  const call = (service, data) => ({ service, target: { entity_id: eid }, ...(data ? { data } : {}) });
  const optional = (attr, service, key = attr) => ({ if: [check(`snap.attributes.get('${attr}') is not none`)],
    then: [call(service, { [key]: tpl(`snap.attributes['${attr}']`) })] });
  const onoff = (on, off) => [{ choose: [{ conditions: [check("snap.state == 'off'")], sequence: [call(off)] }], default: on }];
  if (dom === 'climate') {
    const params = [optional('preset_mode', 'climate.set_preset_mode'),
      { choose: [{ conditions: [check("snap.attributes.get('target_temp_low') is not none or snap.attributes.get('target_temp_high') is not none")],
        sequence: [call('climate.set_temperature', tpl("dict(snap.attributes.items() | selectattr('0', 'in', ['target_temp_low', 'target_temp_high']))"))] }],
        default: [optional('temperature', 'climate.set_temperature')] },
      optional('fan_mode', 'climate.set_fan_mode'), optional('swing_mode', 'climate.set_swing_mode'),
      optional('swing_horizontal_mode', 'climate.set_swing_horizontal_mode')];
    const mode = call('climate.set_hvac_mode', { hvac_mode: tpl('snap.state') });
    return [{ choose: [{ conditions: [check("snap.state == 'off'")], sequence: [...params, mode] }], default: [mode, ...params] }];
  }
  if (dom === 'light') {
    const data = `{% set a = snap.attributes %}{% set ns = namespace(d={}) %}{% if a.get('brightness') is not none %}{% set ns.d = dict(ns.d, brightness=a.brightness) %}{% endif %}{% if a.get('color_mode') == 'color_temp' and a.get('color_temp_kelvin') is not none %}{% set ns.d = dict(ns.d, color_temp_kelvin=a.color_temp_kelvin) %}{% elif a.get('color_mode') == 'rgbww' and a.get('rgbww_color') %}{% set ns.d = dict(ns.d, rgbww_color=a.rgbww_color) %}{% elif a.get('color_mode') == 'rgbw' and a.get('rgbw_color') %}{% set ns.d = dict(ns.d, rgbw_color=a.rgbw_color) %}{% elif a.get('rgb_color') %}{% set ns.d = dict(ns.d, rgb_color=a.rgb_color) %}{% elif a.get('hs_color') %}{% set ns.d = dict(ns.d, hs_color=a.hs_color) %}{% elif a.get('xy_color') %}{% set ns.d = dict(ns.d, xy_color=a.xy_color) %}{% endif %}{% if a.get('effect') and a.effect != 'none' %}{% set ns.d = dict(ns.d, effect=a.effect) %}{% endif %}{{ ns.d }}`;
    return onoff([call('light.turn_on', data)], 'light.turn_off');
  }
  if (dom === 'fan') return onoff([
    call('fan.turn_on', tpl("dict(snap.attributes.items() | selectattr('0', 'eq', 'percentage'))")),
    optional('preset_mode', 'fan.set_preset_mode'), optional('oscillating', 'fan.oscillate'), optional('direction', 'fan.set_direction'),
  ], 'fan.turn_off');
  if (dom === 'cover' || dom === 'valve') {
    return [{ choose: [{ conditions: [check("snap.attributes.get('current_position') is not none")],
      sequence: [call(`${dom}.set_${dom}_position`, { position: tpl('snap.attributes.current_position') })] }],
      default: [call(tpl(`'${dom}.' ~ ('open_${dom}' if snap.state == 'open' else 'close_${dom}')`))] }];
  }
  if (dom === 'humidifier') return onoff([call('humidifier.turn_on'), optional('humidity', 'humidifier.set_humidity'), optional('mode', 'humidifier.set_mode')], 'humidifier.turn_off');
  if (dom === 'water_heater') return [call('water_heater.set_operation_mode', { operation_mode: tpl('snap.state') }), optional('temperature', 'water_heater.set_temperature')];
  if (dom === 'lock') return [call(tpl("'lock.' ~ ('lock' if snap.state == 'locked' else 'unlock')"))];
  return [call(tpl(`'${dom}.turn_' ~ ('off' if snap.state == 'off' else 'on')`))];
}

export function snapshotTemplate(eid) {
  const attrs = ATTRS[eid.split('.')[0]];
  if (!attrs) throw new Error(`Conditional snapshot is not supported for ${eid}`);
  return `{% set s = states['${eid}'] %}{{ dict(state=s.state, attributes=dict(s.attributes.items() | selectattr('0', 'in', ${JSON.stringify(attrs)}))) }}`;
}

export function buildController({ id, eid, helpers, start, stop, conditions, active, inactive, override, flag, manualMatch, manualConditions = conditions, oneShotExpiry }) {
  const { meta, chunks } = helpers;
  const read = tpl(`(states('${meta}')[1:] if states('${meta}').startswith('#') else '{}') | from_json`);
  const record = values => set(meta, tpl(`'#' ~ (dict(run, ${values}) | to_json)`));
  const enabled = `states('${id}') not in ['off', 'unknown', 'unavailable']`;
  const inSlot = `${enabled} and state_attr('${id}', 'current_slot') is not none and now().timestamp() < finish`;
  const available = `states('${eid}') not in ['unknown', 'unavailable']`;
  const readSnapshot = chunks.map(h => `states('${h}')[1:]`).join(' ~ ') || "'{}'";
  const flagOn = { service: 'automation.turn_on', target: { entity_id: flag } };
  const healthy = `run.get('status') == 'live' and run.get('key') == begin`;
  const safety = inactive || [
    { variables: { snap: tpl(`(${readSnapshot}) | from_json`) } },
    check("snap.get('state') not in [none, 'unknown', 'unavailable'] and snap.get('attributes') is mapping"),
    ...runtimeRestore(eid),
  ];
  // Skip repeated false writes. At the initial false evaluation no restore is needed:
  // the target is already at its captured state. Explicit fallback still runs immediately.
  const apply = [{ choose: [{ conditions, sequence: [
    ...(override ? [check(`states('${flag}') != 'off'`)] : []),
    record('active=true, applied=true, pending=true'), ...active.flatMap(a => [check(inSlot), a]), record('active=true, applied=true, evaluated=true, pending=false'),
  ] }], default: [
    ...(inactive ? [] : [check("run.get('applied', false) and run.get('active', false)")]),
    record('pending=true'), ...safety, record('active=false, evaluated=true, pending=false'),
  ] }];
  const snapshot = inactive ? [] : [
    check(available),
    ...(['lock', 'cover', 'valve'].includes(eid.split('.')[0]) ? [check(`states('${eid}') in ${eid.startsWith('lock.') ? "['locked','unlocked']" : "['open','closed']"} or ${eid.startsWith('lock.') ? 'false' : `state_attr('${eid}', 'current_position') is not none`}`)] : []),
    { variables: { payload: snapshotTemplate(eid) } },
    check(`payload | to_json | length <= ${chunks.length * 254}`),
    ...chunks.map((h, i) => set(h, tpl(`'#' ~ (payload | to_json)[${i * 254}:${(i + 1) * 254}]`))),
  ];
  const arm = [
    // Invalidate first; if any write fails the old snapshot can never be used.
    set(meta, tpl("'#' ~ (dict(key=begin, end=finish, since=now().timestamp(), status='blocked', active=false, applied=false) | to_json)")),
    ...snapshot,
    set(meta, tpl("'#' ~ (dict(key=begin, end=finish, since=now().timestamp(), status='live', active=false, applied=false) | to_json)")),
    ...(override ? [flagOn] : []),
  ];
  const eventRelevant = `trigger is defined and trigger.id == 'other' and trigger.event.data.entity_id.startswith('switch.schedule_') and trigger.event.data.entity_id != '${id}'`;
  const otherStarted = `{% set d = trigger.event.data %}{% set old = d.old_state %}{% set new = d.new_state %}{% set ns = namespace(hit=false) %}{% if new is not none and new.state not in ['off','unknown','unavailable'] and (new.attributes.get('current_slot') is not none or new.attributes.get('friendly_name', '').startswith('WSC Quick Timer - ')) and (old is none or (old.state not in ['unknown','unavailable'] and (old.state == 'off' or old.attributes.get('current_slot') != new.attributes.get('current_slot')))) and as_timestamp(trigger.event.time_fired) > run.get('since', 0) %}{% if '${eid}' in new.attributes.get('entities', []) %}{% set ns.hit=true %}{% endif %}{% for a in new.attributes.get('actions', []) %}{% if a.get('entity_id') == '${eid}' or (a.get('service_data') or a.get('data') or {}).get('entity_id') == '${eid}' %}{% set ns.hit=true %}{% endif %}{% endfor %}{% endif %}{{ ns.hit }}`;
  const quickPresent = `{% set ns=namespace(hit=false) %}{% for s in states.switch if s.entity_id.startswith('switch.schedule_') and s.attributes.get('friendly_name', '').startswith('WSC Quick Timer - ') %}{% for a in s.attributes.get('actions', []) %}{% if a.get('entity_id') == '${eid}' %}{% set ns.hit=true %}{% endif %}{% endfor %}{% if '${eid}' in s.attributes.get('entities', []) %}{% set ns.hit=true %}{% endif %}{% endfor %}{{ ns.hit }}`;
  const quickEnded = { condition: 'not', conditions: [{ condition: 'template', value_template: quickPresent }] };
  const otherActive = `{% set ns=namespace(hit=false) %}{% for s in states.switch if s.entity_id.startswith('switch.schedule_') and s.entity_id != '${id}' and s.state not in ['off','unknown','unavailable'] and s.attributes.get('current_slot') is not none %}{% if '${eid}' in s.attributes.get('entities', []) %}{% set ns.hit=true %}{% endif %}{% for a in s.attributes.get('actions', []) %}{% if a.get('entity_id') == '${eid}' %}{% set ns.hit=true %}{% endif %}{% endfor %}{% endfor %}{{ not ns.hit }}`;
  const endActions = [
    ...(inactive ? [{ delay: { seconds: 3 } }, check(`${enabled} and state_attr('${id}', 'current_slot') is none`),
      { if: [{ condition: 'template', value_template: otherActive }], then: inactive }] : []),
  ];
  const triggers = [
    { platform: 'state', entity_id: id, id: 'schedule' },
    { platform: 'homeassistant', event: 'start', id: 'startup' },
    // Boundary recovery also works after HA was offline at the end of a slot.
    { platform: 'time_pattern', minutes: '/1', id: 'watchdog' },
    { platform: 'event', event_type: 'state_changed', id: 'other' },
  ];
  if (override) triggers.push({ platform: 'state', entity_id: eid, id: 'manual' });
  return {
    alias: `WSC Conditions - ${id}`, description: 'WSC conditional controller v1; snapshot is held in input_text helpers.',
    initial_state: true, mode: 'queued', max: 20,
    trigger: triggers,
    condition: [check(`trigger is not defined or trigger.id != 'other' or (${eventRelevant})`)],
    action: [
      { variables: { run: read,
        begin: `{% set t = today_at('${start}') %}{{ as_timestamp(t - timedelta(days=1) if now() < t else t) }}` } },
      check("not run.get('suspended', false)"),
      { variables: { finish: `{% set t = today_at('${stop}') %}{{ as_timestamp(t + timedelta(days=1) if as_timestamp(t) <= begin else t) }}` } },
      { choose: [
        { conditions: [check("trigger is defined and trigger.id == 'other'")], sequence: [
          { choose: [
            { conditions: [check("run.get('status') in ['live','timer'] and run.get('key') == begin"),
              { condition: 'template', value_template: otherStarted }], sequence: [
              record("status=('timer' if trigger.event.data.new_state.attributes.get('friendly_name', '').startswith('WSC Quick Timer - ') else 'yielded')"),
            ] },
            { conditions: [check(`run.get('status') == 'timer' and (${inSlot})`), quickEnded], sequence: [
              record("status='live'"), { variables: { run: read } }, ...apply,
            ] },
          ] },
        ] },
        // Disabled/missing schedule releases control without changing the entity.
        { conditions: [check(`states('${id}') == 'off' or (trigger is defined and trigger.id == 'schedule' and trigger.to_state is not none and trigger.to_state.state == 'off')`)], sequence: [set(meta, '#{}')] },
        { conditions: [check(`states('${id}') in ['unknown','unavailable']`)], sequence: [] },
        { conditions: [check(`not (${inSlot})`)], sequence: [
          // A transient idle state at HA startup must not erase an unexpired snapshot.
          check("not run or now().timestamp() >= run.get('end', 0)"),
          { if: [check("run.get('status') in ['live', 'ending'] and now().timestamp() >= run.get('end', 0)")], then: [
            // Persist pending completion; retry after reload/failure without ever restoring at end.
            record("status='ending'"), ...endActions,
          ] },
          set(meta, '#{}'),
          ...(oneShotExpiry ? [{ if: [check(`now().timestamp() >= as_timestamp('${oneShotExpiry}')`)], then: [
            { service: 'scheduler.remove', data: { entity_id: id } },
          ] }] : []),
        ] },
      ], default: [
        { if: [check("run.get('key') != begin")], then: arm },
        { variables: { run: read } },
        { if: [check("run.get('status') == 'timer'"), quickEnded], then: [record("status='live'")] },
        { variables: { run: read } },
        check(healthy), check(available),
        { choose: [
          ...(override ? [{ conditions: [check("trigger is defined and trigger.id == 'manual'")], sequence: [
            check(`run.get('active', false) and trigger.to_state is not none and trigger.to_state.context.parent_id is none and ${manualMatch ? `not (${manualMatch})` : 'trigger.to_state.context.user_id is not none'}`),
            ...manualConditions,
            { service: 'automation.turn_off', target: { entity_id: flag } },
          ] }] : []),
          // Recovery polling must not keep fighting manual edits or flood target services.
          { conditions: [check("trigger is defined and trigger.id == 'watchdog' and run.get('evaluated', false) and not run.get('pending', false)"),
            { condition: 'or', conditions: [
              { condition: 'and', conditions: [...conditions, check("run.get('active', false)")] },
              { condition: 'and', conditions: [{ condition: 'not', conditions: [{ condition: 'and', conditions }] }, check("not run.get('active', false)")] },
            ] }], sequence: [] },
        ], default: apply },
      ] },
    ],
  };
}
