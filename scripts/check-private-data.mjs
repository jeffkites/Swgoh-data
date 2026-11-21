import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('worker/index.js', 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).default;
const realFetch = globalThis.fetch;
const origin = 'https://jeffkites.github.io';
const env = {DASHBOARD_ACCESS_TOKEN:'test-dashboard', MHANNDALORIAN_API_KEY:'test-api', PRIVATE_DATA_GITHUB_TOKEN:'test-github'};
const inventory = {items:[{id:'test-item',quantity:7}]};
let calls;
function queue(responses) {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url, options});
    assert.ok(responses.length, 'Unexpected outbound request');
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return Response.json(next.body ?? {}, {status:next.status ?? 200});
  };
}
function request(token = env.DASHBOARD_ACCESS_TOKEN) {
  return new Request('https://swgoh-data.mrfaberzen.workers.dev/api/private/inventory', {
    method:'POST', headers:{Origin:origin, Authorization:'Bearer ' + token}
  });
}
async function verifyLive(response, saved) {
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), inventory);
  assert.equal(response.headers.get('X-Snapshot-Saved'), String(saved));
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  assert.ok(response.headers.get('Access-Control-Expose-Headers').includes('X-Snapshot-Error'));
}
try {
  queue([{body:inventory},{body:{sha:'old'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);
  assert.equal(calls[1].url,'https://api.github.com/repos/jeffkites/swgoh-private-data/contents/data/inventory.json?ref=main');
  assert.equal(calls[2].url,'https://api.github.com/repos/jeffkites/swgoh-private-data/contents/data/inventory.json');
  const write = JSON.parse(calls[2].options.body);
  assert.equal(write.sha,'old');
  assert.deepEqual(JSON.parse(Buffer.from(write.content,'base64').toString()).data,inventory);

  queue([{body:inventory},{body:{sha:'old'}},{status:500},{body:{sha:'new'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);
  assert.equal(JSON.parse(calls[4].options.body).sha,'new');

  queue([{body:inventory},{body:{sha:'old'}},{status:409},{body:{sha:'new'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);

  queue([{body:inventory},{status:401}]);
  const expired = await worker.fetch(request(),env);
  assert.ok(expired.headers.get('X-Snapshot-Error').includes('HTTP 401'));
  await verifyLive(expired,false);
  assert.equal(calls.length,2,'Do not retry invalid credentials');

  queue([{body:inventory},{status:404},{status:404}]);
  const denied = await worker.fetch(request(),env);
  assert.ok(denied.headers.get('X-Snapshot-Error').includes('HTTP 404'));
  await verifyLive(denied,false);

  queue([{body:inventory},{status:500},{status:503},{status:502}]);
  await verifyLive(await worker.fetch(request(),env),false);
  assert.equal(calls.length,4,'Bound retries');

  queue([{body:inventory},new Error('private transport detail'),new Error('private transport detail'),new Error('private transport detail')]);
  const network = await worker.fetch(request(),env);
  assert.ok(!network.headers.get('X-Snapshot-Error').includes('private transport detail'));
  await verifyLive(network,false);

  queue([{body:inventory}]);
  await verifyLive(await worker.fetch(request(),{...env,PRIVATE_DATA_GITHUB_TOKEN:undefined}),false);

  queue([]);
  assert.equal((await worker.fetch(request('wrong'),env)).status,401);
  assert.equal(calls.length,0);
  const blocked = new Request(request(),{headers:{Origin:'https://other.example',Authorization:'Bearer test-dashboard'}});
  assert.equal((await worker.fetch(blocked,env)).status,403);
  assert.equal(calls.length,0);

  // The fast GAC dashboard route reads the compact private GitHub file,
  // and must never return it without the dashboard access token.
  const summary = {kind:'gac', allyCode:'843153117', round:3, phase:2, away:{zones:[]}};
  const summaryRequest = token => new Request(
    'https://swgoh-data.mrfaberzen.workers.dev/api/private/gac-summary', {
      method:'GET', headers:{Origin:origin, Authorization:'Bearer ' + token}
    }
  );
  queue([{body:{encoding:'base64',content:Buffer.from(JSON.stringify(summary)).toString('base64')}}]);
  const latestGac = await worker.fetch(summaryRequest('test-dashboard'), env);
  assert.equal(latestGac.status, 200);
  assert.deepEqual(await latestGac.json(), summary);
  assert.equal(latestGac.headers.get('Cache-Control'),'no-store, private');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://api.github.com/repos/jeffkites/swgoh-private-data/contents/data/gac-summary.json?ref=main');
  queue([]);
  assert.equal((await worker.fetch(summaryRequest('wrong'),env)).status,401);
  assert.equal(calls.length,0);
  assert.equal((await worker.fetch(new Request(summaryRequest('test-dashboard'),{
    method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Headers':'Authorization'}
  }),env)).status,204);
  assert.equal(calls.length,0);

  // Exercise the actual page handler against both persistence outcomes.
  const app = readFileSync('app.js','utf8');
  const handler = app.slice(app.indexOf('async function readTwUnitCatalog('),app.indexOf("document.querySelectorAll('[data-private]')"));
  const tw = {code:0,data:{
    homeGuild:{profile:{name:'Home'},conflictStatus:[{warSquad:[{squad:{cell:[{unitId:'defence'}]}}]}]},
    awayGuild:{profile:{name:'Away'},conflictStatus:[
      {zoneStatus:{zoneId:'tw_map_phase01_conflict01',zoneState:4},squadCount:0},
      {zoneStatus:{zoneId:'tw_map_phase02_conflict02',zoneState:3},squadCount:1,squadCapacity:13,warSquad:[
        {playerName:'Cleared',squadStatus:3},
        {playerName:'Live',squadStatus:1,power:133158,successfulDefends:2,squad:{cell:[
          {unitDefId:'BOBAFETT:SEVEN_STAR',cellIndex:0,squadUnitType:2,unitBattleStat:{tier:13,unitRelicTier:7},
            unitState:{healthPercent:'50',shieldPercent:'0',turnPercent:'37'}}
        ]}}
      ]},
      {zoneStatus:{zoneId:'tw_map_phase03_conflict01',zoneState:1},squadCount:13}
    ]},
    playerStatus:{
      warRoster:[{unitId:'defence',unitDefId:'SLKR:SEVEN_STAR'},{unitId:'attack',unitDefId:'VEERS:SEVEN_STAR'}],
      unitStatus:[{unitId:'defence'},{unitId:'attack'}]
    }
  }};
  for (const saved of [true,false]) {
    let clickCopy;
    let clipboard;
    const nodes = {
      'access-token':{value:'test-dashboard'},
      'private-status':{},
      'private-output':{},
      'tw-copy-controls':{hidden:true},
      'tw-copy-status':{},
      'tw-copy-text':{},
      'copy-tw-snapshot':{addEventListener(type, handler) { clickCopy = handler; }}
    };
    const context = vm.createContext({
      $:id=>nodes[id],
      snapshot:null,
      privateApiBase:'https://example.test',
      navigator:{clipboard:{writeText:async text => { clipboard = text; }}},
      fetch:async url => {
        if (url === 'data/unit-catalog.json') {
          return Response.json({units:{BOBAFETT:{name:'Boba Fett'},SLKR:{name:'Supreme Leader Kylo Ren'},VEERS:{name:'General Veers'}}});
        }
        return Response.json(url.endsWith('/tw') ? tw : inventory, {
          headers:{'X-Snapshot-Saved':String(saved),'X-Snapshot-Error':'GitHub snapshot save failed (HTTP 401).'}
        });
      }
    });
    vm.runInContext(handler, context);
    const button = {};
    await context.loadPrivateData('tw',button);
    assert.equal(nodes['tw-copy-controls'].hidden,false);
    await clickCopy();
    assert.match(clipboard,/Row 2, territory 2 \| 1 remaining \/ 13 slots/);
    assert.match(clipboard,/133,158 GP \| Live \| Boba Fett \(lead\) R5 HP 50% prot 0% TM 37% \| holds 2/);
    assert.match(clipboard,/My units on defence — Supreme Leader Kylo Ren/);
    assert.match(clipboard,/My units spent on attack — General Veers/);
    assert.doesNotMatch(clipboard,/Row [13], territory|Cleared|test-dashboard/);
    assert.equal(nodes['private-output'].textContent, JSON.stringify(tw,null,2));

    await context.loadPrivateData('inventory',button);
    assert.equal(nodes['tw-copy-controls'].hidden,true);
    assert.equal(nodes['tw-copy-text'].value,'');
    assert.equal(nodes['private-output'].textContent, JSON.stringify(inventory,null,2));
    assert.equal(button.disabled,false);
    assert.ok(nodes['private-status'].textContent.includes(saved ? 'and saved to your private GitHub' : 'snapshot was not saved'));
    if (!saved) assert.ok(nodes['private-status'].textContent.includes('HTTP 401'));
  }
  console.log('PASS: private data access and saves, page display and copying the open TW territories.');
} finally { globalThis.fetch = realFetch; }
