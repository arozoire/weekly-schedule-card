// Run after build with Playwright installed (npm run test:browser).
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.WSC_PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent(`<style>body{font-family:sans-serif;margin:16px;background:#111;color:#eee;--primary-color:#03a9f4;--primary-text-color:#eee;--secondary-text-color:#bbb;--card-background-color:#222;--divider-color:#555}ha-card{display:block;border-radius:12px;background:#222}</style>`);
    await page.addScriptTag({ path: path.join(__dirname, '../dist/quick-timer-card.js') });
    await page.evaluate(() => {
      window.writes = [];
      window.deviceActions = [];
      window.embeds = 0;
      window.loadCardHelpers = async () => { window.embeds++; throw Error('Live embedded cards must never be created'); };
      const states = {
        'climate.office': { entity_id: 'climate.office', state: 'cool', attributes: {
          friendly_name: 'Clima ufficio', temperature: 24, min_temp: 16, max_temp: 30,
          target_temp_step: 0.5, hvac_modes: ['off', 'cool', 'fan_only'],
          fan_modes: ['low', '100%'], fan_mode: 'low', preset_modes: ['none', 'eco'], preset_mode: 'none',
        } },
        'switch.office': { entity_id: 'switch.office', state: 'off', attributes: { friendly_name: 'Luce ufficio' } },
        'light.office': { entity_id: 'light.office', state: 'off', attributes: { brightness: 128, rgb_color: [255, 255, 255], color_temp_kelvin: 3000, supported_color_modes: ['rgb', 'color_temp'] } },
      };
      const schedules = {};
      const applyDevice = (domain, service, data) => {
        window.deviceActions.push({ domain, service, data: structuredClone(data) });
        const st = states[data.entity_id];
        if (service === 'turn_on') st.state = 'on';
        if (service === 'turn_off') st.state = 'off';
        if (service === 'set_hvac_mode') st.state = data.hvac_mode;
        if (service === 'set_temperature') st.attributes.temperature = data.temperature;
        if (service === 'set_fan_mode') st.attributes.fan_mode = data.fan_mode;
        if (service === 'set_preset_mode') st.attributes.preset_mode = data.preset_mode;
      };
      window.fakeHass = {
        states, language: 'it', user: { is_admin: true }, config: { unit_system: { temperature: '°C' } },
        callService: async (domain, service, data = {}) => {
          window.writes.push({ domain, service, data: structuredClone(data) });
          if (domain === 'scheduler') {
            if (service === 'add') {
              const id = 'switch.schedule_' + data.name.replace(/[^a-z0-9_]+/gi, '_').toLowerCase();
              schedules[id] = data;
              states[id] = { entity_id: id, state: 'on', attributes: { friendly_name: data.name, current_slot: 0 } };
            }
            if (service === 'run_action') for (const action of schedules[data.entity_id].timeslots[0].actions) {
              const [dom, srv] = action.service.split('.');
              applyDevice(dom, srv, { ...action.service_data, entity_id: action.entity_id });
            }
            if (service === 'remove') { delete schedules[data.entity_id]; delete states[data.entity_id]; }
          } else if (domain === 'automation') {
            if (states[data.entity_id]) states[data.entity_id].state = service === 'turn_off' ? 'off' : 'on';
          } else if (domain === 'input_text') {
            states[data.entity_id] = { entity_id: data.entity_id, state: data.value, attributes: {} };
          } else applyDevice(domain, service, data);
        },
        callApi: async (method, endpoint, body) => {
          window.writes.push({ method, endpoint });
          const id = endpoint.split('/').at(-1);
          if (method === 'POST') states['automation.' + id] = { entity_id: 'automation.' + id, state: 'on', attributes: { id } };
          if (method === 'DELETE') delete states['automation.' + id];
        },
        callWS: async msg => { window.writes.push({ ws: msg }); },
        connection: { sendMessagePromise: async msg => { window.writes.push({ connection: msg }); return {}; } },
      };
      window.mount = (entity, extra = {}) => {
        document.querySelector('quick-timer-card')?.remove();
        const card = document.createElement('quick-timer-card');
        card.setConfig({ entity, language: 'it', ...extra });
        document.body.append(card);
        card.hass = window.fakeHass;
        window.card = card;
      };
      window.mount('climate.office', { card: { type: 'custom:untrusted-card', tap_action: { action: 'toggle' } } });
    });
    const field = name => page.locator(`[data-draft-field="${name}"]`);
    await field('hvac_mode').selectOption('fan_only');
    await field('fan_mode').selectOption('100%');
    await page.locator('[data-min="60"]').click();
    assert.deepEqual(await page.evaluate(() => ({ writes: writes.length, embeds, state: fakeHass.states['climate.office'].state })), { writes: 0, embeds: 0, state: 'cool' });

    // HA updates must not discard the draft; snapshot must be taken at Start, not at first edit.
    await page.evaluate(() => {
      fakeHass.states['climate.office'] = { ...fakeHass.states['climate.office'], attributes: { ...fakeHass.states['climate.office'].attributes, temperature: 25 } };
      card.hass = { ...fakeHass };
    });
    assert.equal(await field('hvac_mode').inputValue(), 'fan_only');
    await page.locator('.qt-start').click();
    await page.locator('.qt-cancel').waitFor();
    const started = await page.evaluate(() => ({ state: fakeHass.states['climate.office'], record: card._timers['climate.office'], actions: deviceActions }));
    assert.equal(started.state.state, 'fan_only');
    assert.equal(started.state.attributes.fan_mode, '100%');
    assert.equal(started.record.durationS, 3600);
    assert.equal(started.record.restore.find(a => a.service === 'climate.set_temperature').data.temperature, 25);
    assert.deepEqual(started.actions.map(a => a.service), ['set_hvac_mode', 'set_fan_mode']);
    assert.equal(await field('hvac_mode').isDisabled(), true);
    await page.locator('.qt-cancel').click();
    await page.locator('.qt-start').waitFor();
    assert.deepEqual(await page.evaluate(() => ({ mode: fakeHass.states['climate.office'].state, temperature: fakeHass.states['climate.office'].attributes.temperature, timer: card._timers['climate.office'] || null })), { mode: 'cool', temperature: 25, timer: null });
    assert.equal(await page.evaluate(() => Object.keys(fakeHass.states).some(k => k.startsWith('automation.qt_timer_') || k.startsWith('switch.schedule_'))), false);
    assert.equal(await field('hvac_mode').isEnabled(), true);

    // Power editing must be local even with legacy tile action configuration.
    await page.evaluate(() => { writes.length = 0; deviceActions.length = 0; mount('switch.office', { tile: { icon_tap_action: { action: 'toggle' } } }); });
    await field('power').selectOption('on');
    assert.equal(await page.evaluate(() => writes.length), 0);
    assert.equal(await page.evaluate(() => fakeHass.states['switch.office'].state), 'off');
    await page.locator('.qt-start').click();
    await page.locator('.qt-cancel').waitFor();
    assert.equal(await page.evaluate(() => fakeHass.states['switch.office'].state), 'on');
    await page.locator('.qt-cancel').click();
    await page.locator('.qt-start').waitFor();
    assert.equal(await page.evaluate(() => fakeHass.states['switch.office'].state), 'off');

    // Preserve edited color/brightness and prevent incompatible color payloads.
    await page.evaluate(() => { writes.length = 0; mount('light.office'); });
    await field('brightness_pct').fill('70');
    await field('rgb_color').evaluate(input => { input.value = '#ff0000'; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
    await field('color_temp_kelvin').fill('4000');
    await page.locator('.qt-title').click();
    const light = await page.evaluate(() => ({ writes: writes.length, actions: card._buildApplyActions('light.office') }));
    assert.equal(light.writes, 0);
    assert.equal(light.actions.length, 1);
    assert.equal(light.actions[0].data.brightness_pct, 70);
    assert.equal(light.actions[0].data.color_temp_kelvin, 4000);
    assert.equal('rgb_color' in light.actions[0].data, false);

    // End-time selection survives unrelated rendering and field edits.
    await page.locator('[data-mode="until"]').click();
    await page.locator('.qt-until').fill('23:17');
    await page.evaluate(() => card.render());
    assert.equal(await page.locator('.qt-until').inputValue(), '23:17');
    assert.equal(await page.evaluate(() => writes.length), 0);

    if (process.env.WSC_TEST_SCREENSHOT) await page.screenshot({ path: process.env.WSC_TEST_SCREENSHOT });
    assert.deepEqual(errors, []);
    console.log('Browser tests passed: edit -> zero writes; Start -> apply; Cancel -> restore and cleanup.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
