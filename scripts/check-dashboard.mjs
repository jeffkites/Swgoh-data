import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/dashboard.json', 'utf8'));
assert.ok(data.units.length > 0);
assert.equal(data.units.filter(u => u.type === 'Unknown').length, 0, 'Missing unit definitions');
assert.equal(data.units.filter(u => u.name === u.id).length, 0, 'Missing unit names');
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(() => document.querySelector('#total').textContent !== '—');
  assert.equal(await page.locator('#rows tr').count(), data.units.length);
  assert.ok(await page.locator('#farm-plan').isVisible(), 'Farm advice section is visible');
  assert.ok(await page.locator('#trigger-refresh').isVisible(), 'Direct refresh button is present');
  assert.ok(await page.locator('#check-refresh').isVisible(), 'Workflow status button is present');
  await page.route('https://swgoh-data.mrfaberzen.workers.dev/api/roster/status', route => route.fulfill({
    status:200, contentType:'application/json',
    headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:8000'},
    body:JSON.stringify({
      active:null,
      latestManual:{event:'workflow_dispatch',status:'completed',conclusion:'failure',createdAt:'2026-10-22T12:18:29Z'},
      latest:{event:'push',status:'completed',conclusion:'success',createdAt:'2026-10-22T20:32:16Z'},
      failedStep:'Refresh localized roster'
    })
  }));
  await page.locator('#check-refresh').click();
  await page.waitForFunction(() => document.querySelector('#workflow-status').textContent.includes('completed successfully'));
  assert.ok(!(await page.locator('#workflow-status').textContent()).includes('Failed step'), 'Do not show an older failed workflow after a newer successful refresh');

  assert.equal(await page.locator('#access-token').count(), 1, 'Access token only entered once');
  assert.equal(await page.locator('#access-token').getAttribute('autocomplete'), 'current-password');
  assert.ok((await page.locator('#private-key-form').innerText()).includes('Dashlane'));
  assert.equal(await page.locator('#use-saved-key').count(), 0, 'Removed Chrome-only key retrieval');
  assert.equal(await page.locator('#save-private-key').count(), 0, 'Removed unreliable Chrome save prompt');
  // Roster refresh needs no access token; private data is still protected.
  assert.ok(!(await page.locator('header').innerHTML()).includes('access-token'));
  await page.route('https://swgoh-data.mrfaberzen.workers.dev/api/roster/refresh', route => {
    const cors = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:8000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    return route.request().method() === 'OPTIONS'
      ? route.fulfill({status:204, headers:cors})
      : route.fulfill({
          status:429,
          contentType:'application/json',
          headers:cors,
          body:JSON.stringify({error:'Too many refresh requests. Try again in a minute.'})
        });
  });
  await page.locator('#trigger-refresh').click();
  await page.waitForFunction(() => document.querySelector('#refresh-status').textContent.includes('Too many refresh requests.'));
  assert.ok(!(await page.locator('header').innerHTML()).includes('actions/workflows/refresh-player.yml'), 'Refresh button does not redirect to GitHub');

  await page.locator('[data-tab="farm-plan"]').click();
  const executorPlan = await page.locator('#executor-targets').textContent();
  assert.ok(executorPlan.includes('Dengar') && executorPlan.includes('R5'));
  assert.ok(executorPlan.includes('Razor Crest'));
  assert.match(await page.locator('#farm-plan').textContent(), /Fleet (?:Arena )?Store/);
  assert.ok((await page.locator('#fleet-targets').innerText()).includes('Punishing One'));
  assert.ok((await page.locator('#slkr-targets').textContent()).includes('Emperor Palpatine'));
  assert.ok((await page.locator('#slkr-build-targets').textContent()).includes('G13'));
  assert.ok((await page.locator('#slkr-build-targets').textContent()).includes('R7'));
  assert.equal(await page.locator('#inquisitor-targets .farm-target').count(), 5);
  assert.ok((await page.locator('#grievous-targets').textContent()).includes('General Grievous'));
  assert.ok((await page.locator('#slkr-status').textContent()).includes('Four ability rows now show upgrades'));
  assert.ok((await page.locator('#era-targets').textContent()).includes('Adelphi Ranger'));
  assert.ok((await page.locator('#era-targets').textContent()).includes('Mercenary Guard Droid (B1)'));
  // The roster updates over time: never hardcode a character's current stars.
  const adelphi = data.units.find(u => u.id === 'ADELPHIRANGER');
  if (adelphi) {
    assert.ok((await page.locator('#era-targets').textContent()).includes(adelphi.stars + '★ of 5★'));
  }
  assert.ok((await page.locator('#farm-plan').textContent()).includes('ended 17 Nov 2026'));
  assert.ok((await page.locator('#executor-targets').textContent()).includes('Darth Vader'));
  // Once SLKR is unlocked the status legitimately changes, so check both cases.
  const slkrMessage = await page.locator('#slkr-status').textContent();
  assert.ok(slkrMessage.includes('prerequisites met') || slkrMessage.includes('SLKR is unlocked') ||
    slkrMessage.includes('Complete the outstanding prerequisites'), 'SLKR progression is shown');
  assert.ok(!(await page.locator('#era-targets').textContent()).includes('Darth Jar Jar'));
  assert.ok((await page.locator('#farm-plan').textContent()).includes('Fleet 5-F Hard'));
  assert.ok((await page.locator('#farm-plan').textContent()).includes('Light Side 6-E Hard'));
  await page.locator('[data-tab="squads-5v5"]').click();
  assert.ok(await page.locator('#squads-5v5').isVisible());
  assert.ok(!(await page.locator('#farm-plan').isVisible()));
  assert.equal(await page.locator('#squad-list-5v5 .squad-card').count(), 18);
  await page.locator('#squad-search-5v5').fill('Great Mothers');
  assert.equal(await page.locator('#squad-list-5v5 .squad-card').count(), 1);
  await page.locator('#squad-list-5v5 summary').click();
  assert.ok((await page.locator('#squad-list-5v5').innerText()).includes('Night Trooper'));
  await page.locator('#squad-search-5v5').fill('');
  await page.locator('#squad-filter-5v5').selectOption('project');
  assert.equal(await page.locator('#squad-list-5v5 .squad-card').count(), 6);
  await page.locator('[data-tab="squads-3v3"]').click();
  assert.equal(await page.locator('#squad-list-3v3 .squad-card').count(), 19);
  assert.ok((await page.locator('#squad-list-3v3').textContent()).includes('Enoch'));
  await page.locator('#tab-squads-3v3').press('ArrowRight');
  assert.ok(await page.locator('#roster').isVisible(), 'Arrow navigation selects the roster');
  await page.locator('#tab-roster').press('Home');
  assert.ok(await page.locator('#farm-plan').isVisible());
  await page.locator('[data-goal-tab="energy"]').click();
  assert.ok(await page.locator('#goal-energy').isVisible());
  assert.ok(!(await page.locator('#goal-slkr').isVisible()));
  await page.locator('a[href="#roster"]').click();
  await page.locator('#roster').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#search').fill('Captain Rex');
  assert.equal(await page.locator('#rows tr').count(), 1);
  const rex = data.units.find(u => u.id === 'CAPTAINREX');
  assert.ok((await page.locator('#rows').innerText()).includes('R' + rex.relic));
  await page.locator('#search').fill('');
  await page.locator('#filter').selectOption('ships');
  assert.equal(await page.locator('#rows tr').count(), data.units.filter(u => u.type === 'Ship').length);
  assert.equal(await page.locator('#rows tr').first().locator('td').nth(4).innerText(), '—');
  await page.locator('#filter').selectOption('all');
  await page.locator('#sort').selectOption('name');
  // GAC scouting tab: authenticated summary, clear observed-vs-predicted labels,
  // opponent link generation and private notes stored per opponent on the device.
  await page.route('https://swgoh-data.mrfaberzen.workers.dev/api/private/gac-summary', route => {
    const cors = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:8000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization'
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({status:204, headers:cors});
    assert.equal(route.request().headers().authorization, 'Bearer local-test-token');
    return route.fulfill({status:200, headers:cors, json:{
      kind:'gac', allyCode:'843153117', sourceFetchedAt:'2026-11-20T22:40:33Z',
      round:3, phase:2, matchEndsAt:1795384800000,
      opponent:{name:'Test Opponent',guild:'Training Guild'},
      home:{zones:[{id:'4zone_phase01_conflict01_duel01',score:0,squads:[]}]},
      away:{zones:[{id:'4zone_phase01_conflict01_duel01',score:0,squads:[
        {status:1,units:[{id:'DARTHTRAYA',gear:13,relic:5},{id:'SAVAGEOPRESS',gear:13,relic:5}]}
      ]}]}
    }});
  });
  await page.locator('[data-tab="private-data"]').click();
  await page.locator('#access-token').fill('local-test-token');
  await page.locator('[data-tab="gac-scout"]').click();
  await page.locator('#gac-load').click();
  await page.waitForFunction(() => document.querySelector('#gac-opponent-name').textContent === 'Test Opponent');
  assert.ok((await page.locator('#gac-enemy-zones').innerText()).includes('Darth Traya'));
  assert.ok((await page.locator('#gac-round').innerText()).includes('Attack'));
  await page.locator('#gac-opp-code').fill('681756884');
  await page.locator('#gac-save-code').click();
  assert.ok((await page.locator('#gac-link-planner').getAttribute('href')).endsWith('/843153117/681756884'));
  await page.locator('.gac-notes summary').click();
  await page.locator('#gac-scout-notes').fill('Hera appears frequently in recent 3v3 defences');
  await page.locator('#gac-save-notes').click();
  assert.ok((await page.locator('#gac-notes-status').innerText()).includes('saved on this device'));
  assert.deepEqual(errors, []);
  console.log('PASS: GAC scouting summary, opponent links, predicted/observed separation and notes.');
  await page.screenshot({path:'dashboard-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-tab="squads-5v5"]').click();
  await page.locator('#squad-filter-5v5').selectOption('all');
  await page.screenshot({path:'dashboard-mobile.png',fullPage:true});
  await page.locator('[data-tab="roster"]').click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflows mobile viewport');
  await page.locator('#search').fill('no_such_unit_999');
  assert.equal(await page.locator('#rows tr').count(), 0);
  assert.ok(await page.locator('#empty').isVisible());
  // The dashboard adds ?v=<timestamp> to bypass browser caches. Match the
  // real request URL including its changing query string when simulating failure.
  await page.route('**/data/dashboard.json*', route => route.fulfill({status:500,body:'error'}));
  await page.locator('#reload').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Keeping'));
  assert.deepEqual(errors, []);
  console.log('PASS: real roster, names, relics, ships, search, sort, mobile width and failed reload.');

  // Simulate Pages with a raw branch file that lags behind GitHub's Contents API.
  const pagesUrl = 'https://jeffkites.github.io/Swgoh-data/';
  const cors = {'Access-Control-Allow-Origin':'https://jeffkites.github.io'};
  await page.route(pagesUrl + '**', route => {
    const path = new URL(route.request().url()).pathname.slice('/Swgoh-data/'.length) || 'index.html';
    return route.fulfill({path});
  });
  const older = {...data, refreshedAt:new Date(Date.now() - 120000).toISOString(), arena:{'2':95}};
  const newer = {...data, refreshedAt:new Date(Date.now() - 60000).toISOString(), arena:{'2':73}};
  let githubSnapshot = older;
  await page.route('https://api.github.com/repos/jeffkites/Swgoh-data/contents/data/dashboard.json*',
    route => githubSnapshot
      ? route.fulfill({json:{encoding:'base64',content:Buffer.from(JSON.stringify(githubSnapshot)).toString('base64')},headers:cors})
      : route.fulfill({status:403,headers:cors}));
  await page.route('https://raw.githubusercontent.com/jeffkites/Swgoh-data/main/data/dashboard.json*',
    route => route.fulfill({json:older,headers:cors}));

  await page.goto(pagesUrl);
  await page.waitForFunction(() => document.querySelector('#fleet').textContent === '#95');
  githubSnapshot = newer;
  await page.locator('#reload').click();
  await page.waitForFunction(() => document.querySelector('#refresh-status').textContent.includes('New roster loaded'));
  assert.equal(await page.locator('#fleet').textContent(), '#73');

  githubSnapshot = null;
  await page.locator('#reload').click();
  await page.waitForFunction(() => document.querySelector('#refresh-status').textContent.includes('Saved roster unchanged'));
  assert.equal(await page.locator('#fleet').textContent(), '#73', 'An older fallback must not replace a newer roster');
  assert.deepEqual(errors, []);
  console.log('PASS: Pages reloads the newer GitHub snapshot and keeps it if an older fallback is returned.');
} finally { await browser.close(); }
