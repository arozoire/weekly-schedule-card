// Exercise the shipped dialog in Chromium; no Home Assistant writes are allowed.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.WSC_PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const { compressToBase64 } = await import('../src/lz-string.js');
  const data = { groups: [], profiles: [{ id: 'summer', name: 'Summer', groups: [], schedules: [], scheduleLinks: [] }], activeProfiles: [] };
  const payload = compressToBase64(JSON.stringify(data));
  const states = {};
  let n = 0;
  for (let i = 0; i < payload.length; i += 255) {
    const id = `input_text.wsc_store_${n++}`;
    states[id] = { entity_id: id, state: payload.slice(i, i + 255), attributes: {} };
  }
  states['input_text.wsc_store_meta'] = { entity_id: 'input_text.wsc_store_meta', state: String(n), attributes: {} };
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<style>body{font-family:sans-serif;--primary-text-color:#111;--card-background-color:#fff;--divider-color:#ddd;--error-color:#b00020}</style>');
    await page.addScriptTag({ path: path.join(__dirname, '../dist/weekly-schedule-card.js') });
    await page.evaluate(({ states, data }) => {
      const Base = Object.getPrototypeOf(customElements.get('quick-timer-card').prototype).constructor;
      customElements.define('wsc-reset-test', class extends Base { connectedCallback() {} });
      window.writes = [];
      window.card = document.createElement('wsc-reset-test');
      card._config = { language: 'it' };
      card._storageData = data;
      card._selectedProfileId = 'summer';
      card._hass = { states, language: 'it', user: { is_admin: true },
        connection: { sendMessagePromise: async msg => {
          if (msg.type === 'get_states') return Object.values(states);
          if (msg.type === 'get_config') return { state: 'RUNNING' };
          if (msg.type === 'input_text/list') return Object.keys(states).map(id => ({ id: id.split('.')[1] }));
          if (msg.type === 'config/entity_registry/list') return [];
          writes.push(msg); throw Error('Unexpected write');
        } },
        callApi: async (...args) => { writes.push(args); throw Error('Unexpected API'); },
        callService: async (...args) => { writes.push(args); throw Error('Unexpected service'); },
      };
      document.body.append(card);
      card._renderGroupsView();
    }, { states, data });
    const open = async () => {
      await page.locator('.btn-reset-card').click();
      await page.locator('.reset-phrase').waitFor();
      assert.equal(await page.locator('.reset-confirm').isEnabled(), false);
    };
    await open();
    assert(await page.locator('.reset-cancel').evaluate(el => el === el.getRootNode().activeElement));
    await page.locator('.reset-phrase').fill('CANCELLA TUTTO');
    await page.locator('.reset-ack').check();
    assert.equal(await page.locator('.reset-confirm').isEnabled(), false, 'export is required');
    await page.locator('.reset-phrase').press('Enter');
    assert(await page.locator('dialog').isVisible(), 'Enter must not bypass confirmation');
    const downloadEvent = page.waitForEvent('download');
    await page.locator('.reset-export').click();
    const download = await downloadEvent;
    assert.match(download.suggestedFilename(), /^weekly-schedule-card-reset_.*\.json$/);
    const stream = await download.createReadStream();
    let exported = ''; for await (const chunk of stream) exported += chunk;
    assert.equal(JSON.parse(exported).original.profiles[0].id, 'summer');
    assert.equal(await page.locator('.reset-confirm').isEnabled(), true);
    await page.locator('.reset-ack').uncheck();
    assert.equal(await page.locator('.reset-confirm').isEnabled(), false);
    await page.locator('.reset-ack').check();
    await page.locator('.reset-phrase').fill('cancella tutto');
    assert.equal(await page.locator('.reset-confirm').isEnabled(), false, 'phrase must match exactly');
    await page.locator('.reset-phrase').fill('CANCELLA TUTTO');
    assert.equal(await page.locator('.reset-confirm').isEnabled(), true);
    await page.locator('.reset-cancel').click();
    await page.waitForFunction(() => !card._resetting);
    assert.deepEqual(await page.evaluate(() => writes), []);
    await open();
    assert.equal(await page.locator('.reset-phrase').inputValue(), '');
    assert.equal(await page.locator('.reset-ack').isChecked(), false);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !card._resetting);
    assert.deepEqual(await page.evaluate(() => writes), []);
    await page.evaluate(() => { card._hass.user.is_admin = false; card._renderGroupsView(); });
    assert.equal(await page.locator('.btn-reset-card').count(), 0);
    assert.deepEqual(errors, []);
    console.log('Reset browser confirmation, export and cancellation tests passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
