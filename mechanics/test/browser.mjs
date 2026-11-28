// Run with the dashboard's Playwright installation. --generated-data uses mechanics/data/.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dataUrl } from '../app.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const real = process.argv.includes('--generated-data');
const root = new URL('../', import.meta.url);
const base = 'http://localhost/Swgoh-data/mechanics/';
const units = [
  { id: 'TESTCHAR', name: 'Test character', kind: 'character', path: 'units/TESTCHAR.json' },
  { id: 'TESTSHIP', name: 'Test ship', kind: 'ship', path: 'units/TESTSHIP.json' }
];
const datasets = Object.fromEntries(['skills', 'abilities', 'effects'].map(name => [
  name, { buckets: 1, path: 'tables/' + name + '/{bucket}.json' }
]));
const fixture = {
  'index.json': { schemaVersion: 1, gameVersion: 'test', retrievedAt: '2000-01-01', units },
  'manifest.json': { datasets },
  'units/TESTCHAR.json': { ...units[0], skillIds: ['TESTSKILL'] },
  'units/TESTSHIP.json': { ...units[1], skillIds: [] },
  'tables/skills/00.json': { TESTSKILL: { id: 'TESTSKILL', abilityId: 'TESTABILITY', levels: [{level: 1}] } },
  'tables/abilities/00.json': { TESTABILITY: {
    id: 'TESTABILITY', name: 'Test ability', levels: [{ level: 1, cooldown: 0, effects: [{ id: 'TESTEFFECT' }] }]
  }},
  'tables/effects/00.json': { TESTEFFECT: { id: 'TESTEFFECT', operation: 'TEST_OPERATION' } }
};

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
try {
  const page = await browser.newPage();
  const requests = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = route.request().url();
    requests.push(url);
    if (!url.startsWith(base)) return route.abort();
    const relative = url.slice(base.length);
    const types = { '': 'text/html', 'app.mjs': 'text/javascript', 'lookup.mjs': 'text/javascript', 'style.css': 'text/css' };
    if (Object.hasOwn(types, relative)) {
      return route.fulfill({ contentType: types[relative], body: await readFile(new URL(relative || 'index.html', root)) });
    }
    if (!relative.startsWith('data/')) return route.fulfill({ status: 404 });
    const path = relative.slice(5);
    const body = real ? await readFile(dataUrl(new URL('data/', root), path)) : JSON.stringify(fixture[path]);
    return route.fulfill({ status: body ? 200 : 404, contentType: 'application/json', body });
  });
  await page.goto(base);
  const id = real ? 'VADER' : 'TESTCHAR';
  const ship = real ? 'CAPITALEXECUTOR' : 'TESTSHIP';
  await page.locator('#query').fill(id);
  await page.locator('#results a[href="#unit=' + id + '"]').click();
  await page.locator('#detail details').first().waitFor();
  assert(requests.every(url => !url.includes('/data/tables/')), 'Skill shards should wait for a selection');
  await page.locator('#detail section').first().locator(':scope > details > summary').first().click();
  const ability = page.locator('#detail details details > summary').filter({ hasText: /^Ability ·/ }).first();
  await ability.click();
  await page.getByRole('heading', {name: 'Ability levels and cooldowns'}).waitFor();
  await page.getByRole('heading', {name: 'Ability levels and cooldowns'}).locator('..')
    .locator('summary').filter({hasText: /^Level 1(?: ·|$)/}).first().click();
  await page.locator('summary:visible').filter({hasText: /^Effect ·/}).first().click();
  await page.getByText('Operation', {exact: true}).first().waitFor();
  const viewport = {width: 375, height: 740};
  await page.setViewportSize(viewport);
  await page.locator('#kind').selectOption('ship');
  await page.locator('#query').fill(ship);
  await page.locator('#results a[href="#unit=' + ship + '"]').click();
  await page.waitForFunction(expected => document.querySelector('#profile-status').textContent.includes(expected), ship);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#query').fill('impossible test unit 999999');
  await page.getByText('No matching units.', {exact:true}).waitFor();
  assert.deepEqual(errors, []);
  assert(requests.every(url => url.startsWith(base)), 'Mechanics must not request roster or private APIs');
  console.log('Character search, ship filter, deep links, ability levels, effect lookup and mobile layout passed.');
} finally {
  await browser.close();
}
