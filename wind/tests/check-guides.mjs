import assert from 'node:assert/strict';
import worker,{SPOT_GUIDES,GUIDE_SOURCES,STATIONS} from '../../worker/hunter-wind.mjs';
assert.equal(SPOT_GUIDES.length,19);
assert.equal(new Set(SPOT_GUIDES.map(g=>g.id)).size,19,'Each spot must have one stable identity');
const source=GUIDE_SOURCES.find(s=>s.id==='source-2011');assert.equal(source.author,'Sourse');assert.equal(source.via,'Quoted by JulesK');assert.equal(source.date,'28 August 2011');
assert.equal(GUIDE_SOURCES.find(s=>s.id==='eco-jordan').author,'Jordan Jensen');
for(const guide of SPOT_GUIDES){
 assert.ok(GUIDE_SOURCES.some(source=>source.id===guide.sourceId),'Every guide must credit a known author');
 assert.ok(guide.stationIds.length>0);
 for(const id of guide.stationIds)assert.ok(STATIONS.some(s=>s.id===id),'Wind references must point to real gauges');
 if(guide.sourceId==='source-2011'){assert.equal(guide.access,null,'A direction-only forum post must not acquire invented launch instructions');assert.equal(guide.level,null);assert.deepEqual(guide.hazards,[]);}
}
assert.equal(SPOT_GUIDES.find(g=>g.id==='salts-bay').stationIds[0],'swansea');
assert.equal(SPOT_GUIDES.filter(g=>g.id==='salts-bay').length,1);
const html=await(await worker.fetch(new Request('https://example.test/?spot=salts-bay'))).text();
assert.ok(html.includes('id="spot-dialog"'));assert.ok(html.includes('id="station-panel"'));assert.ok(!html.includes('id="history"'));assert.ok(html.includes('aria-labelledby="spot-title"'));
assert.ok(!html.includes('id="overview"'),'Duplicate summary gauges must be removed');
assert.match(html,/<section[^>]*id="review-desk"[^>]* hidden>/,'Owner editor must start hidden');
assert.ok(html.includes('id="review-desk-toggle"'));
const originals=SPOT_GUIDES.filter(g=>g.externalReview);
assert.equal(originals.length,5);
for(const guide of originals){
 assert.equal(guide.sourceId,'eco-jordan-nelson');
 assert.equal(guide.wind,null,'A source link must not invent a direction rating');
 assert.equal(guide.access,null);assert.equal(guide.level,null);assert.deepEqual(guide.hazards,[]);
}
const nelson=GUIDE_SOURCES.find(s=>s.id==='eco-jordan-nelson');
assert.equal(nelson.author,'Jordan Jensen');assert.ok(nelson.url.endsWith('/kitesurfing-in-nelson-bay'));
const bootstrap=JSON.parse(html.match(/const BOOT = (.*);/)[1]);assert.equal(bootstrap.spotGuides.length,19);assert.equal(bootstrap.guideSources.length,4);
console.log('Passed: author attribution, original-source chain, historical labels, no invented launch details, valid gauge links and guide-page structure.');
