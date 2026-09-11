import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { conditionalMarker, effectiveSchedule } from '../src/conditional-controller.js';
globalThis.HTMLElement = class { attachShadow() { this.shadowRoot = { querySelector() { return null; }, querySelectorAll() { return []; } }; } };
globalThis.customElements = { m:new Map(), get(k) { return this.m.get(k); }, define(k,v) { this.m.set(k,v); } };
globalThis.window = { customCards:[], dispatchEvent() {} };
globalThis.document = { createElement() { return {}; } };
globalThis.CustomEvent = class {};
Object.defineProperty(globalThis,'navigator',{value:{language:'en'},configurable:true});
vm.runInThisContext(fs.readFileSync('dist/quick-timer-card.js','utf8'));
const QT=customElements.get('quick-timer-card');
const Base=Object.getPrototypeOf(QT.prototype).constructor;
const EID='climate.office';
const condition={entity:'sensor.test',operator:'>',value:'10',hysteresis:'0'};
function card() {
  const c=new Base();
  c._config={entities:[{entity:EID}]}; c._entities=c._config.entities;
  c._storageData={profiles:[{id:'default',name:'Default',schedules:[],scheduleLinks:[],groups:[]}],activeProfiles:['default']};
  c._selectedProfileId='default'; c._renderCache=null;
  c.calls=[];c.configs=[];c.errors=[];
  c._hass={user:{is_admin:true},states:{[EID]:{entity_id:EID,state:'cool',attributes:{temperature:24,hvac_modes:['cool','fan_only','off']}}},
    callService:async(d,s,data)=>{
      c.calls.push({d,s,data});
      if(d==='scheduler'&&s==='add'){
        const id=`switch.schedule_test_${c.calls.length}`;
        c.lastId=id;
        c._hass.states[id]={entity_id:id,state:'on',attributes:{weekdays:data.weekdays,timeslots:data.timeslots.map(t=>`${t.start} - ${t.stop}`),actions:data.timeslots[0].actions,entities:[],current_slot:null}};
      }
      if(d==='scheduler'&&s==='edit') {
        const st=c._hass.states[data.entity_id];
        st.attributes.actions=data.timeslots[0].actions;
      }
      if(d==='switch' && c._hass.states[data.entity_id]) c._hass.states[data.entity_id].state=s==='turn_on'?'on':'off';
      if(d==='input_text') c._hass.states[data.entity_id]={entity_id:data.entity_id,state:data.value,attributes:{}};
    },
    callApi:async(method,path,config)=>{
      c.configs.push({method,path,config});
      const id=path.split('/').pop();
      if(method==='POST') c._hass.states[`automation.${id}`]={entity_id:`automation.${id}`,state:'on',attributes:{id}};
    },connection:{sendMessagePromise:async(m)=>{
      if(m.type==='get_states')return Object.values(c._hass.states);
      if(m.type==='input_text/create'){
        const id=`input_text.${m.name}`;
        assert(!c._hass.states[id],`duplicate helper ${id}`);
        c._hass.states[id]={entity_id:id,state:'',attributes:{}};
        return {id:m.name};
      }
      if(m.type==='input_text/delete')delete c._hass.states[`input_text.${m.input_text_id}`];
      return {};
    }} };
  c._wsSetNow=async()=>{};
  c._alert=async text=>c.errors.push(text);
  c._waitForNewSchedule=async()=>c.lastId;
  c._closePopup=()=>{c._popupState=null;}; c.render=()=>{};
  c._popupState={mode:'create',entityConf:{entity:EID},domain:'climate',days:[0,1,2,3,4,5,6],startMin:480,endMin:1200,
    enableHvac:true,hvacMode:'fan_only',enableTemp:false,conditions:[],condCombinator:'and',stopAction:null,notifyTrigger:'none'};
  return c;
}
{
  const c=card();await c._saveSchedule();assert.deepEqual(c.errors,[]);
  const add=c.calls.find(x=>x.d==='scheduler'&&x.s==='add');
  assert.equal(add.data.timeslots[0].actions[0].service,'climate.set_hvac_mode');
  assert(!c.calls.some(x=>x.d==='input_text'));
  assert(!c.configs.some(x=>x.config?.description?.includes('conditional controller')));
}
{
  const c=card();c._popupState.conditions=[condition];await c._saveSchedule();assert.deepEqual(c.errors,[]);
  const add=c.calls.find(x=>x.d==='scheduler'&&x.s==='add');
  assert.equal(add.data.timeslots[0].actions[0].service,'logbook.log');
  assert(!c.calls.some(x=>x.d==='climate'));
  const controller=c.configs.find(x=>x.config?.description?.includes('conditional controller')).config;
  assert(controller.trigger.some(x=>x.entity_id==='sensor.test'));
  assert(!c.configs.some(x=>x.config?.alias?.startsWith('WSC Auto-off')));
  const sid=c.lastId;assert.equal(c._getSchedules(EID)[0].entity_id,sid);
  assert.equal(c._blockLabel(c._hass.states[sid]),'fan only');
  const ps=c._openEditPopup(sid,false);assert.equal(ps.hvacMode,'fan_only');assert.equal(ps.entityConf.entity,EID);
  assert.equal(c._storageData.profiles[0].scheduleLinks[0].condHelpers.length,9);
  assert(c._hass.states[c._storageData.profiles[0].scheduleLinks[0].condHelpers[0]].state==='#{}');
  // Duplicate retains controller/settings but gets independent helpers and stays disabled.
  c._prompt=async()=> 'Copy';await c._duplicateProfile('default');assert.deepEqual(c.errors,[]);
  const copy=c._storageData.profiles[1];assert.equal(copy.scheduleLinks.length,1);
  assert.notDeepEqual(copy.scheduleLinks[0].condHelpers,c._storageData.profiles[0].scheduleLinks[0].condHelpers);
  assert.equal(c._hass.states[copy.schedules[0]].state,'off');
  // Removing conditions restores the original Scheduler action and removes runtime helpers.
  c._selectedProfileId='default';c._popupState={...ps,conditions:[],isOff:false};await c._saveSchedule();assert.deepEqual(c.errors,[]);
  assert.equal(c._hass.states[sid].attributes.actions[0].service,'climate.set_hvac_mode');
  assert.equal(c._storageData.profiles[0].scheduleLinks[0].condHelpers,undefined);
}
{
  const c=card();c._popupState.conditions=[{...condition,value:''}];await c._saveSchedule();
  assert.equal(c.calls.length,0);assert.equal(c.errors.length,1);
}
{
  const c=card();c._popupState.conditions=[condition];c._popupState.stopAction='turn_off';await c._saveSchedule();assert.deepEqual(c.errors,[]);
  assert.equal(c._storageData.profiles[0].scheduleLinks[0].condHelpers.length,1);
  assert(!c.configs.some(x=>x.config?.alias?.startsWith('WSC Auto-off')));
}
{
  const c=card();const sid='switch.schedule_old';
  c._hass.states[sid]={entity_id:sid,state:'triggered',attributes:{entities:[EID],actions:[{entity_id:EID,service:'climate.set_hvac_mode',service_data:{hvac_mode:'fan_only'}}],weekdays:['mon'],timeslots:['08:00 - 20:00'],current_slot:0}};
  const p=c._storageData.profiles[0];p.schedules.push(sid);p.scheduleLinks.push({id:sid,conditions:[condition]});
  c._popupState=null;await c._migrateConditionalSchedules();assert.equal(c.calls.length,0,'active legacy schedule must be deferred');
  c._hass.states[sid].attributes.current_slot=null;c._hass.states[sid].state='on';
  await c._migrateConditionalSchedules();assert.equal(p.scheduleLinks[0].condVersion,1);assert.equal(c._hass.states[sid].state,'on');
  assert.equal(c._hass.states[sid].attributes.actions[0].service,'logbook.log');
  const count=c.calls.length;await c._migrateConditionalSchedules();assert.equal(c.calls.length,count,'migration must be idempotent');
}
{
  const actions=[{entity_id:EID,service:'climate.set_temperature',service_data:{temperature:24}}];
  const raw={entity_id:'switch.schedule_marker',state:'on',attributes:{entities:[],actions:conditionalMarker(EID,actions)}};
  assert.deepEqual(effectiveSchedule(raw).attributes.actions,actions);
  const qt=new QT();qt._hass={states:{[raw.entity_id]:raw}};
  assert.deepEqual(qt._scheduleIdsForEntity(EID),[raw.entity_id]);
}
console.log('Conditional card integration tests passed');
