import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import vm from 'node:vm';
import api from '../../worker/index.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(html.includes("fetch('https://swgoh-data.mrfaberzen.workers.dev/api/wind',"),'The static page must call the independent live data service');
assert.ok(!html.includes("fetch('/api/wind',"),'GitHub Pages cannot execute the old relative server route');
assert.ok(!html.includes('chatgpt.site'),'The exported page must have no ChatGPT hosting dependency');
assert.ok(html.includes('},300000)'),'Five-minute checks must be preserved');
assert.ok(html.includes("'visibilitychange'"),'Foreground refresh must be preserved');
assert.ok(html.includes("cache:'no-store'"));
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);
const boot=JSON.parse(html.match(/const BOOT = (.*);/)[1]);
assert.equal(boot.metadata.length,7);assert.equal(boot.spotGuides.length,18);assert.equal(boot.guideSources.length,3);
for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  assert.ok(!/^\/(?!\/)/.test(match[1]),'A root-relative asset would escape /Swgoh-data/wind/: '+match[1]);
  if(match[1].startsWith('./'))assert.ok(statSync(new URL('../'+match[1].slice(2),import.meta.url)));
}
assert.ok(readFileSync(new URL('../leaflet.js',import.meta.url),'utf8').includes('Leaflet'));

const origin='https://jeffkites.github.io',endpoint='https://swgoh-data.mrfaberzen.workers.dev/api/wind';
const nativeFetch=globalThis.fetch,nativeWarn=console.warn;let calls=0;
globalThis.fetch=async()=>{calls++;throw new Error('Test source unavailable');};console.warn=()=>{};
try {
  const response=await api.fetch(new Request(endpoint,{headers:{Origin:origin}}),{DASHBOARD_ACCESS_TOKEN:'private-secret'});
  assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const payload=await response.json();assert.equal(payload.stations.length,7);assert.ok(payload.checkedAt);
  assert.ok(!JSON.stringify(payload).includes('private-secret'));
  assert.equal(calls,7,'The wind endpoint must contact only its public station sources');
  calls=0;
  const preflight=await api.fetch(new Request(endpoint,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'}}),{});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(calls,0);
  assert.equal((await api.fetch(new Request(endpoint,{headers:{Origin:'https://other.example'}}),{})).status,403);
  assert.equal((await api.fetch(new Request(endpoint,{method:'POST',headers:{Origin:origin}}),{})).status,405);assert.equal(calls,0);
  const health=await api.fetch(new Request('https://swgoh-data.mrfaberzen.workers.dev/health'),{});
  assert.deepEqual(await health.json(),{ok:true,service:'swgoh-private-api',privateSnapshotVersion:2});
  const privateRequest=new Request('https://swgoh-data.mrfaberzen.workers.dev/api/private/inventory',{method:'POST',headers:{Origin:origin}});
  assert.equal((await api.fetch(privateRequest,{DASHBOARD_ACCESS_TOKEN:'private-secret'})).status,401);
  assert.equal(calls,0,'Wind access must not authorize private SWGOH data');
} finally {globalThis.fetch=nativeFetch;console.warn=nativeWarn;}
console.log('Passed: nested Pages assets, independent live endpoint, polling, seven gauges, author credits, CORS, read-only methods and private API isolation.');
