"""Run generated controller actions with Home Assistant's real template/script engine.
No physical devices, browser or Scheduler instance are used. Node exports the fixtures.
Usage: python tests/conditional-controller-ha.py /path/to/fixtures.json
"""
import asyncio
import copy
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

import voluptuous as vol
from homeassistant.core import HomeAssistant, Context, Event, callback
from homeassistant.helpers import config_validation as cv, entity_registry, device_registry, area_registry
from homeassistant.helpers.script import Script
from homeassistant.components.automation.config import PLATFORM_SCHEMA
from homeassistant.util import dt as dt_util

F = json.loads(Path(sys.argv[1]).read_text())
SID, EID, HS = F['id'], F['eid'], F['hs']
logging.basicConfig(level=logging.ERROR)

async def main():
    hass = HomeAssistant(tempfile.mkdtemp(prefix='wsc-ha-'))
    hass.config.set_time_zone('UTC')
    for key in ['config','fallback','override','overnight','oneShot']:
        PLATFORM_SCHEMA(copy.deepcopy(F[key]))
    await entity_registry.async_load(hass)
    await device_registry.async_load(hass)
    await area_registry.async_load(hass)
    calls = []
    fail = {'service': None}
    @callback
    def write_text(call):
        value = call.data['value']
        assert isinstance(value, str), (type(value), value)
        assert len(value) <= 255, len(value)
        for entity in call.data['entity_id']: hass.states.async_set(entity, value)
    @callback
    def target(call):
        if fail['service'] == call.service:
            raise RuntimeError('simulated device failure')
        calls.append((call.domain + '.' + call.service, dict(call.data)))
        entity = call.data.get('entity_id', EID)
        if isinstance(entity, list): entity = entity[0]
        old = hass.states.get(entity)
        attrs = dict(old.attributes) if old else {}
        state = old.state if old else 'off'
        if call.service == 'set_hvac_mode': state = call.data['hvac_mode']
        elif call.service == 'turn_off': state = 'off'
        elif call.service == 'turn_on': state = 'on'
        for k,v in call.data.items():
            if k != 'entity_id': attrs[k] = v
        hass.states.async_set(entity, state, attrs, context=Context(parent_id='machine'))
    hass.services.async_register('input_text', 'set_value', write_text,
        schema=vol.Schema({vol.Required('entity_id'): cv.entity_ids, vol.Required('value'): cv.string}))
    for dom, services in {
        'climate': ['set_hvac_mode','set_temperature','set_preset_mode','set_fan_mode','set_swing_mode','set_swing_horizontal_mode','turn_off'],
        'automation': ['turn_on','turn_off'], 'scheduler': ['remove'],
        'light': ['turn_on','turn_off'], 'fan': ['turn_on','turn_off','set_preset_mode','oscillate','set_direction'],
        'cover': ['set_cover_position','open_cover','close_cover'], 'valve': ['set_valve_position','open_valve','close_valve'],
        'lock': ['lock','unlock'], 'switch': ['turn_on','turn_off'], 'input_boolean': ['turn_on','turn_off'],
        'humidifier': ['turn_on','turn_off','set_humidity','set_mode'], 'water_heater': ['set_operation_mode','set_temperature'],
    }.items():
        for svc in services: hass.services.async_register(dom, svc, target)

    def reset(state='cool', attrs=None):
        calls.clear(); fail['service'] = None
        for s in list(hass.states.async_all()): hass.states.async_remove(s.entity_id)
        hass.states.async_set(EID, state, attrs or {'temperature':24, 'fan_mode':'high', 'preset_mode':'none'})
        hass.states.async_set(SID, 'triggered', {'current_slot':0})
        hass.states.async_set('sensor.test', '0')
        hass.states.async_set('automation.test_flag', 'on')
        hass.states.async_set(HS['meta'], '#{}')
        for h in HS['chunks']: hass.states.async_set(h, '#')

    def meta(): return json.loads(hass.states.get(HS['meta']).state[1:])
    def saved(): return ''.join(hass.states.get(h).state[1:] for h in HS['chunks'])
    async def run(kind='config', at='2026-09-11T08:00:00', trigger=None):
        # Recreate the Script each invocation: proves all necessary state is persisted in HA.
        seq = cv.SCRIPT_SCHEMA(copy.deepcopy(F[kind]['action']))
        script = Script(hass, seq, f'wsc-{kind}', 'automation', script_mode='queued')
        with patch.object(dt_util, 'now', return_value=datetime.fromisoformat(at).replace(tzinfo=timezone.utc)):
            await script.async_run(({} if trigger == 'direct' else {'trigger': trigger or {'id':'eval'}}), Context())
    def target_calls(): return [x for x in calls if not x[0].startswith(('automation.', 'scheduler.'))]

    # False at start: no active command, unchanged baseline; true->false restores exactly once.
    reset(); await run()
    assert target_calls() == [] and meta()['status']=='live'
    baseline=saved()
    hass.states.async_set('sensor.test','20'); await run(at='2026-09-11T09:00:00')
    assert hass.states.get(EID).state=='fan_only'
    hass.states.async_set('sensor.test','0'); await run(at='2026-09-11T10:00:00')
    assert hass.states.get(EID).state=='cool' and hass.states.get(EID).attributes['temperature']==24
    count=len(target_calls()); await run(at='2026-09-11T10:01:00')
    assert len(target_calls())==count and saved()==baseline
    hass.states.async_set('sensor.test','20'); await run(at='2026-09-11T11:00:00')
    assert saved()==baseline and hass.states.get(EID).state=='fan_only'
    # No final action: leave running, no target write at expiry.
    count=len(target_calls()); hass.states.async_set(SID,'on',{'current_slot':None})
    await run(at='2026-09-11T20:00:01'); assert len(target_calls())==count and meta()=={}
    print('PASS immutable snapshot, false/true/false, no write at end')

    # Explicit fallback applies even if condition never passed, including at expiry.
    reset(); await run('fallback'); assert hass.states.get(EID).state=='off'
    hass.states.async_set('sensor.test','20'); await run('fallback',at='2026-09-11T09:00:00')
    assert hass.states.get(EID).state=='fan_only'
    hass.states.async_set(SID,'on',{'current_slot':None})
    await run('fallback',at='2026-09-11T20:00:01'); assert hass.states.get(EID).state=='off'
    print('PASS explicit false and end output')

    # Restore failure is retried by the recovery tick, preserving the snapshot.
    reset(); hass.states.async_set('sensor.test','20'); await run()
    hass.states.async_set('sensor.test','0'); fail['service']='set_hvac_mode'
    try: await run(at='2026-09-11T09:00:00')
    except Exception: pass
    assert meta()['pending'] and meta()['active']
    fail['service']=None; await run(at='2026-09-11T09:01:00',trigger={'id':'watchdog'})
    assert hass.states.get(EID).state=='cool' and not meta()['pending']
    print('PASS restore retry after device failure')

    # End failure remains pending for retry; lack of an end action leaves an off entity off.
    reset(); await run('fallback')
    hass.states.async_set(SID,'on',{'current_slot':None}); fail['service']='turn_off'
    try: await run('fallback',at='2026-09-11T20:00:01')
    except Exception: pass
    assert meta()['status']=='ending'
    fail['service']=None; await run('fallback',at='2026-09-11T20:01:00',trigger={'id':'watchdog'})
    assert meta()=={} and hass.states.get(EID).state=='off'
    reset('off'); await run(); calls.clear(); hass.states.async_set(SID,'on',{'current_slot':None})
    await run(at='2026-09-11T20:00:01'); assert target_calls()==[] and hass.states.get(EID).state=='off'
    # Set up a live occurrence for restart checks.
    reset(); await run()
    # Restarts use saved baseline; next occurrence acquires a fresh baseline.
    baseline=saved(); await run(at='2026-09-11T09:02:00',trigger={'id':'startup'}); assert saved()==baseline
    hass.states.async_set(SID,'on',{'current_slot':None})
    await run(at='2026-09-11T09:03:00',trigger={'id':'startup'}); assert saved()==baseline and meta()['status']=='live'
    hass.states.async_set(SID,'triggered',{'current_slot':0})
    await run(at='2026-09-11T09:04:00',trigger='direct'); assert saved()==baseline
    hass.states.async_set(EID,'heat',{'temperature':21}); await run(at='2026-09-12T08:00:01')
    assert json.loads(saved())['state']=='heat'
    print('PASS restart reuses snapshot; next day refreshes it')

    # Unavailable or oversized snapshot blocks active commands for this occurrence.
    reset('unavailable'); hass.states.async_set('sensor.test','20'); await run()
    assert target_calls()==[] and meta()['status']=='blocked'
    reset('cool',{'preset_mode':'x'*3000}); hass.states.async_set('sensor.test','20'); await run()
    assert target_calls()==[] and meta()['status']=='blocked'
    print('PASS snapshot failure blocks activation')

    # New schedule/Quick Timer takes over: no old fallback or final action.
    reset(); hass.states.async_set('sensor.test','20'); await run('fallback')
    old=hass.states.get(SID)
    other='switch.schedule_new'; hass.states.async_set(other,'triggered',{'current_slot':0,'entities':[EID]})
    new=hass.states.get(other)
    event=Event('state_changed',{'entity_id':other,'old_state':None,'new_state':new},time_fired=datetime(2026,9,11,9,tzinfo=timezone.utc))
    await run('fallback',at='2026-09-11T09:00:01',trigger={'id':'other','event':event})
    assert meta()['status']=='yielded'
    calls.clear(); hass.states.async_set('sensor.test','0'); await run('fallback',at='2026-09-11T10:00:00')
    hass.states.async_set(SID,'on',{'current_slot':None}); await run('fallback',at='2026-09-11T20:00:01')
    assert target_calls()==[]
    print('PASS takeover prevents old restore and end writes')

    # Existing conditional resumes after Quick Timer removal; supports start-only timers.
    reset(); hass.states.async_set('sensor.test','20'); await run()
    other='switch.schedule_wsc_quick_timer_test'
    hass.states.async_set(other,'on',{'friendly_name':'WSC Quick Timer - test','actions':[{'entity_id':EID}], 'current_slot':None})
    event=Event('state_changed',{'entity_id':other,'old_state':None,'new_state':hass.states.get(other)},time_fired=datetime(2026,9,11,9,tzinfo=timezone.utc))
    await run(at='2026-09-11T09:00:01',trigger={'id':'other','event':event})
    assert meta()['status']=='timer'
    calls.clear(); hass.states.async_set('sensor.test','0'); await run(at='2026-09-11T10:00:00'); assert target_calls()==[]
    old=hass.states.get(other); hass.states.async_remove(other)
    event=Event('state_changed',{'entity_id':other,'old_state':old,'new_state':None},time_fired=datetime(2026,9,11,10,1,tzinfo=timezone.utc))
    await run(at='2026-09-11T10:01:00',trigger={'id':'other','event':event})
    assert meta()['status']=='live' and hass.states.get(EID).state=='cool'
    print('PASS Quick Timer pause and resume, including start-only timers')

    # Manual override uses value match, not sensor-only attribute changes.
    reset(); hass.states.async_set('sensor.test','20'); await run('override')
    hass.states.async_set(EID,'fan_only',{'temperature':24,'current_temperature':22},context=Context())
    calls.clear(); await run('override',at='2026-09-11T09:00:00',trigger={'id':'manual','to_state':hass.states.get(EID)})
    assert not any(s=='automation.turn_off' for s,d in calls)
    hass.states.async_set(EID,'off',{'temperature':24},context=Context())
    await run('override',at='2026-09-11T09:01:00',trigger={'id':'manual','to_state':hass.states.get(EID)})
    assert any(s=='automation.turn_off' for s,d in calls)
    hass.states.async_set('sensor.test','0'); await run('override',at='2026-09-11T09:02:00')
    assert hass.states.get(EID).state=='cool'
    print('PASS manual override does not suppress false-condition restore')

    reset(); hass.states.async_set('sensor.test','20'); await run('overnight',at='2026-09-11T20:00:01')
    baseline=saved(); await run('overnight',at='2026-09-12T01:00:00',trigger={'id':'startup'})
    assert saved()==baseline
    calls.clear(); hass.states.async_set(SID,'on',{'current_slot':None}); await run('overnight',at='2026-09-12T08:00:01')
    assert target_calls()==[] and meta()=={}
    print('PASS overnight snapshot and no end write')

    # Hysteresis uses controller phase, even if restored target is still switched on.
    reset(); hass.states.async_set('sensor.test','58'); await run('hysteresis'); assert target_calls()==[]
    hass.states.async_set('sensor.test','56'); await run('hysteresis',at='2026-09-11T09:00:00'); assert hass.states.get(EID).state=='fan_only'
    hass.states.async_set('sensor.test','61'); await run('hysteresis',at='2026-09-11T10:00:00'); assert meta()['active']
    hass.states.async_set('sensor.test','64'); await run('hysteresis',at='2026-09-11T11:00:00'); assert not meta()['active'] and hass.states.get(EID).state=='cool'
    calls.clear(); hass.states.async_set('sensor.test','58'); await run('hysteresis',at='2026-09-11T12:00:00'); assert target_calls()==[]
    print('PASS hysteresis is independent of restored target state')

    # Every generated restore branch is exercised with the HA script evaluator.
    examples={
      'climate': [('cool',{'temperature':24,'preset_mode':'none','fan_mode':'high'}),('off',{'temperature':20}),('heat_cool',{'target_temp_low':18,'target_temp_high':24})],
      'light': [('on',{'brightness':120,'color_mode':'rgb','rgb_color':[10,20,30]}),('off',{}),('on',{'color_mode':'color_temp','color_temp_kelvin':2700})],
      'fan': [('on',{'percentage':50,'oscillating':True,'direction':'forward'}),('off',{})],
      'cover': [('open',{'current_position':40}),('closed',{})], 'valve': [('open',{'current_position':30}),('closed',{})],
      'lock': [('locked',{}),('unlocked',{})], 'switch':[('on',{}),('off',{})], 'input_boolean':[('on',{}),('off',{})],
      'humidifier':[('on',{'humidity':50,'mode':'auto'}),('off',{})], 'water_heater':[('eco',{'temperature':50})],
    }
    for dom,cases in examples.items():
        for state,attrs in cases:
            calls.clear()
            script=Script(hass,cv.SCRIPT_SCHEMA(copy.deepcopy(F['restores'][dom])),f'restore-{dom}','automation')
            await script.async_run({'snap':{'state':state,'attributes':attrs}},Context())
            assert target_calls(),(dom,state)
    print('PASS all 10 restore domains')
    await hass.async_stop()

asyncio.run(main())
