import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {MAP_REGIONS,SPOT_LOCATIONS,STATIONS,SPOT_GUIDES} from '../../worker/hunter-wind.mjs';

assert.deepEqual(MAP_REGIONS.map(r=>r.id),['lake','nelson','central']);
assert.deepEqual(MAP_REGIONS.flatMap(r=>r.stationIds).sort(),STATIONS.map(s=>s.id).sort(),'Each gauge belongs to exactly one regional map');
assert.ok(!MAP_REGIONS[0].stationIds.includes('nelson'));
assert.ok(!MAP_REGIONS[0].stationIds.includes('norah'));
assert.ok(MAP_REGIONS[0].bounds[1][0]-MAP_REGIONS[0].bounds[0][0]<0.3,'The lake map must stay close in');
assert.equal(SPOT_LOCATIONS.length,19);
for(const place of SPOT_LOCATIONS){
 assert.ok(SPOT_GUIDES.some(g=>g.id===place.guideId));
 assert.ok(MAP_REGIONS.some(r=>r.id===place.region));
 assert.ok(Number.isFinite(place.lat)&&place.lat<-32.5&&place.lat>-33.5);
 assert.ok(Number.isFinite(place.lon)&&place.lon>151.3&&place.lon<152.4);
 if(place.guideId==='mawsons-wall-spoons')assert.equal(place.sourceUrl,'https://www.geonames.org/2148784/spoon-rocks.html');else assert.match(place.sourceUrl,/^https:\/\/www\.openstreetmap\.org\/(way|node|relation)\//);
}
assert.equal(new Set(SPOT_LOCATIONS.map(p=>p.guideId)).size,19,'All reviews must be reachable from a map pin');
const salts=SPOT_LOCATIONS.find(p=>p.guideId==='salts-bay');
assert.notEqual(salts.lat,STATIONS.find(s=>s.id==='swansea').lat,'A kiting area must not reuse the Marine Rescue gauge position');

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),maps=new Map(),createdMarkers=[];
const node=id=>{
 if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',_value:'',get value(){return this._value;},set value(v){this._value=String(v);},style:{},dataset:{},isConnected:true,
  classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],querySelector:()=>node(id+'-child'),
  setAttribute(name,value){this[name]=value;},focus(){this.focused=true;},scrollIntoView(){},
  showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100};}});
 return nodes.get(id);
};
const L={
 map(id,options){const map={id,options,layers:new Set(),fits:[],events:{},on(name,fn){this.events[name]=fn;return this;},fitBounds(bounds){this.fits.push(bounds);return this;},addLayer(layer){this.layers.add(layer);return this;},removeLayer(layer){this.layers.delete(layer);return this;},hasLayer(layer){return this.layers.has(layer);},panTo(position){this.pan=position;return this;}};maps.set(id,map);return map;},
 tileLayer:()=>({addTo(){return this;}}),control:{zoom:()=>({addTo(map){map.zoomControlAdded=true;}})},divIcon:options=>({options}),
 latLngBounds:positions=>positions,
 layerGroup(){return {layers:[],addTo(map){map.addLayer(this);return this;},addLayer(layer){this.layers.push(layer);},clearLayers(){this.layers=[];}};},
 marker(position,options){const marker={position,options,events:{},element:node('marker-'+createdMarkers.length),
  addTo(layer){layer.addLayer(this);return this;},on(name,fn){this.events[name]=fn;return this;},
  bindTooltip(){return this;},getElement(){return this.element;},setIcon(icon){this.options.icon=icon;return this;}};
  createdMarkers.push(marker);return marker;}
};
const context=vm.createContext({console,Intl,Date,Set,Map,URLSearchParams,AbortSignal,L,
 window:{L,matchMedia:()=>({matches:true})},
 document:{getElementById:node,querySelectorAll:()=>[],body:{classList:{add(){},remove(){}}}},
 fetch:async()=>Response.json({checkedAt:new Date().toISOString(),stations:JSON.parse(html.match(/const BOOT = (.*);/)[1]).stations})
});
const cut=script.lastIndexOf("$('refresh').onclick=refresh;");
assert.ok(cut>0);
vm.runInContext(script.slice(0,cut)+';globalThis.actions={setRegion,selectStation,render,renderSpotCards,initMap,refresh,fitWindCoast,visibleSpotGuides,renderStationStrip,setHours:value=>{hours=value;renderStations();},replaceReadings:items=>{data=items;render();},setupReviewDesk,applyPublishedReviews,loadOwnerQueue,saveOwnerReview,state:()=>({region,selected,siteLayer,guideFilter,hours,windDirection}),reviews:()=>({ownerStore,ownerKey,ownerRevision,spotGuides,guideSources,spotLocations}),filter:value=>{guideFilter=value;renderSpotCards();renderSpotMap(true);}};',context);
const app=context.actions;
app.render();app.renderSpotCards();app.initMap();
assert.equal(maps.size,2,'Wind and site maps must be separate');
assert.equal(app.state().siteLayer.layers.length,13);
assert.equal(node('station-count').textContent,'7 stations');
assert.equal(maps.get('map').layers.size,7,'The wind map must show every gauge together');
assert.equal(maps.get('map').fits.at(-1).length,7,'Fixed wind map must include the full coast');
for(const handler of ['dragging','touchZoom','doubleClickZoom','boxZoom','keyboard','scrollWheelZoom','tapHold'])assert.equal(maps.get('map').options[handler],false,'Wind map must disable '+handler);
assert.equal(maps.get('map').zoomControlAdded,undefined);
assert.equal(maps.get('spot-map').zoomControlAdded,true,'Review map must retain its zoom controls');
assert.notEqual(maps.get('spot-map').options.dragging,false,'Review map must retain dragging');
for(const marker of createdMarkers.filter(m=>m.options.alt?.endsWith(' wind station')))assert.equal(marker.options.autoPanOnFocus,false);
assert.ok(html.includes('touch-action:pan-y pinch-zoom!important'),'Touch scrolling must pass through the fixed map');
assert.ok(!html.includes('id="fit"'),'The fixed wind map must not have a fit control');
assert.ok(html.includes('id="wind-map-title">Along the coast</h2>'));
assert.ok(!html.includes('aria-label="Wind map region"'),'Region tabs belong only to the site reviews');
const initialWindFits=maps.get('map').fits.length;
app.setRegion('nelson');
assert.equal(app.state().selected,'nobbys','Site-region changes must preserve the selected wind gauge');
assert.equal(node('station-count').textContent,'7 stations');
assert.equal(maps.get('map').layers.size,7,'Site regions must not hide wind gauges');
assert.equal(maps.get('map').fits.length,initialWindFits,'Site regions must not reset the wind view');
assert.equal(maps.get('map').pan,undefined);
assert.equal(app.state().siteLayer.layers.length,5);
const bagnalls=app.state().siteLayer.layers.find(m=>m.options.title.startsWith("Bagnall"));
assert.ok(bagnalls);bagnalls.events.click();
assert.equal(node('spot-dialog').open,true);
assert.ok(node('spot-content').innerHTML.includes('Jordan Jensen'));
assert.ok(node('spot-content').innerHTML.includes('/kitesurfing-in-nelson-bay'));
assert.ok(!node('spot-content').innerHTML.includes('Directions in'),'Link-only reviews must not display fabricated direction details');
node('spot-dialog').close();
app.selectStation('norah',true);
assert.equal(maps.get('map').pan,undefined,'Selecting a gauge must never pan the fixed map');
assert.equal(app.state().region,'nelson','Selecting a wind gauge must preserve the site-review area');
assert.equal(app.state().selected,'norah');
assert.equal(app.state().siteLayer.layers.length,5);
assert.equal(maps.get('map').layers.size,7);
const windFits=maps.get('map').fits.length;
await app.refresh();
assert.equal(app.state().region,'nelson','Live refresh must preserve the selected site region');
assert.equal(app.state().selected,'norah','Live refresh must preserve the selected wind gauge');
assert.equal(maps.get('map').fits.length,windFits,'Live refresh must preserve the fixed wind view');
app.fitWindCoast();
assert.equal(maps.get('map').fits.at(-1).length,7,'Responsive fitting must retain all gauges after selecting Norah Head');
assert.equal(app.state().region,'nelson','Fitting the wind coast must leave the review map alone');
app.setRegion('lake');app.filter('historical');
assert.equal(app.state().siteLayer.layers.length,6);
assert.ok(node('spot-grid').innerHTML.includes('Source · via JulesK'));
app.setupReviewDesk();app.filter('all');app.setRegion('nelson');
const chooseWind=value=>{node('spot-wind').value=value;node('spot-wind').onchange();};
chooseWind('NE');
assert.equal(app.state().siteLayer.layers.length,0,'Unknown directions must not be guessed for link-only Nelson Bay reviews');
assert.ok(node('spot-grid').innerHTML.includes('No matching sites'));
app.setRegion('lake');
assert.ok(app.visibleSpotGuides().some(g=>g.id==='salts-bay'));
assert.ok(!app.visibleSpotGuides().some(g=>g.id==='belmont-south-squids'));
assert.equal(app.state().siteLayer.layers.length,app.visibleSpotGuides().length,'Direction filter must affect both cards and pins');
chooseWind('WNW');
assert.ok(app.visibleSpotGuides().some(g=>g.id==='belmont-south-squids'),'W–NW must include WNW');
assert.ok(!app.visibleSpotGuides().some(g=>g.id==='salts-bay'));
node('spot-search').value='Salts';node('spot-search').oninput();
assert.equal(app.state().siteLayer.layers.length,0,'Name and direction filters must combine');
chooseWind('NE');
assert.equal(app.state().siteLayer.layers.length,1);
assert.ok(node('spot-search-status').textContent.includes('NE across all areas'));
node('spot-search-clear').onclick();
assert.equal(app.state().windDirection,'');assert.equal(node('spot-wind').value,'');
app.setRegion('nelson');
node('spot-search').value="Squid's Ink";node('spot-search').oninput();
assert.equal(app.state().siteLayer.layers.length,1,'Global search must find Squids even with Nelson Bay selected');
assert.ok(node('spot-grid').innerHTML.includes('belmont-south-squids'));
app.state().siteLayer.layers[0].events.click();
assert.equal(app.state().region,'lake');assert.ok(node('spot-content').innerHTML.includes('Jordan Jensen'));
node('spot-edit-review').onclick();assert.equal(node('review-desk-details').open,true);assert.equal(node('review-key').focused,true);
node('spot-search').value='Spoons';node('spot-search').oninput();
app.state().siteLayer.layers[0].events.click();
assert.ok(node('spot-content').innerHTML.includes('Awaiting local review'));assert.ok(node('spot-content').innerHTML.includes('Surf Life Saving NSW'));assert.ok(!node('spot-content').innerHTML.includes('Directions in'));
node('spot-search-clear').onclick();
const local={id:'belmont-south-squids',name:'Squids updated',aliases:['Cane Point'],region:'lake',lat:-33.0494,lon:151.6491,wind:'Checked locally',hazards:'<img src=x onerror=alert(1)>',notes:'Owner approved note',publishedAt:'2026-11-21T11:00:00Z',sources:[{title:'Squids',author:'WindHounds',url:'https://wind-hounds.com/sailing-spots/new-south-wales/squids/'}]};
app.applyPublishedReviews([local]);
chooseWind('WNW');assert.ok(!app.visibleSpotGuides().some(g=>g.id===local.id),'An unknown published direction must override the source range');
app.applyPublishedReviews([{...local,wind:'N–SE'}]);chooseWind('ENE');
assert.ok(app.visibleSpotGuides().some(g=>g.id===local.id),'Public review updates must immediately change range matching');
node('spot-search-clear').onclick();
assert.equal(app.reviews().spotGuides.find(g=>g.id===local.id).sourceId,'eco-jordan');
app.state().siteLayer.layers.find(m=>m.options.title.startsWith('Squids updated')).events.click();
assert.ok(node('spot-content').innerHTML.includes('Jeff’s reviewed site notes'));assert.ok(node('spot-content').innerHTML.includes('Jordan Jensen'));assert.ok(node('spot-content').innerHTML.includes('WindHounds'));assert.ok(node('spot-content').innerHTML.includes('&lt;img'));assert.ok(!node('spot-content').innerHTML.includes('<img src=x'));
app.applyPublishedReviews([{...local,id:'new-local-area',name:'New checked site'}]);
assert.equal(app.reviews().spotGuides.filter(g=>g.id==='new-local-area').length,1);
app.applyPublishedReviews([]);assert.ok(!app.reviews().spotGuides.some(g=>g.id==='new-local-area'),'Unpublishing restores the source guide set');
node('review-wind').value='N–SE';node('review-wind').oninput();
assert.ok(node('review-wind-preview').textContent.includes('N, NNE, NE, ENE, E, ESE, SE'));
node('review-wind').value='SW–NE';node('review-wind').oninput();
assert.ok(node('review-wind-preview').textContent.includes('Add a middle point'));
const queue={revision:'review-rev-1',version:1,records:[{id:local.id,draft:{...local,aliases:['Squids'],water:'',level:'',access:'',hazards:'',notes:'PRIVATE DRAFT'},published:null,researchNotes:'PRIVATE RESEARCH',sourceRefs:local.sources,savedAt:'2026-11-21T11:00:00Z'}]};
const ownerCalls=[];context.fetch=async(url,options)=>{ownerCalls.push({url,options});return Response.json(url.endsWith('/manage')?queue:{reviews:[]});};
node('review-key').value='owner-ui-test';node('review-unlock').onsubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
assert.equal(node('review-workspace').hidden,false);assert.ok(node('review-research').innerHTML.includes('PRIVATE RESEARCH'));
node('review-notes').value='My unsaved edit';await app.saveOwnerReview('save-draft');
const sent=JSON.parse(ownerCalls.find(c=>c.options.method==='POST').options.body);assert.equal(sent.action,'save-draft');assert.equal(sent.review.notes,'My unsaved edit');assert.equal(sent.revision,'review-rev-1');assert.equal(ownerCalls.filter(c=>c.options.method==='POST').length,1);
assert.equal(app.reviews().spotGuides.find(g=>g.id===local.id).ownerReview,undefined,'Draft saves cannot enter the public map');
node('review-lock').onclick();assert.equal(app.reviews().ownerKey,'');assert.equal(app.reviews().ownerStore,null);assert.equal(node('review-workspace').hidden,true);assert.equal(node('review-research').innerHTML,'');assert.equal(node('review-notes').value,'');
assert.ok(html.includes("const REVIEW_API='https://swgoh-data.mrfaberzen.workers.dev/api/wind/reviews'"));
const clock=Date.now(),observation=(minutes,speed,degrees)=>({time:new Date(clock-minutes*60000).toISOString(),speed,gust:speed+3,degrees,direction:speed===0?'Calm':degrees===null?null:'N'});
const series=[observation(50,10,0),observation(40,12,90),observation(30,18,180),observation(20,34,270),observation(10,14,null),observation(0,0,null)];
const speeds={nelson:11.9,williamtown:12,nobbys:16,marks:null,swansea:30,cooranbong:0,norah:0};
const windColors={nelson:'#ed2029',williamtown:'#f0dc22',nobbys:'#26cf42',marks:'#81949a',swansea:'#98603c',cooranbong:'#ed2029',norah:'#ed2029'};
const live=STATIONS.map(s=>({id:s.id,mode:'live',latest:speeds[s.id]===null?null:observation(0,speeds[s.id],0),history:s.id==='norah'?series:[]}));
app.selectStation('norah',false);app.replaceReadings(live);
for(const station of STATIONS){
 const marker=createdMarkers.find(m=>m.options.title===station.name);
 assert.ok(marker.options.icon.options.html.includes('--marker-color:'+windColors[station.id]),'Map speed band must match the chart scale for '+station.id);
}
const strip=node('station-strip-norah').innerHTML;
assert.ok(!html.includes('id="history"'),'The separate large history window must be removed');
assert.ok(!html.includes('class="station-speed '),'Current wind numbers must not be repeated in the station rows');
assert.equal((node('station-list').innerHTML.match(/class="station-strip /g)||[]).length,7,'Every gauge must have its own compact history row');
assert.ok(strip.includes('height="40"'),'Station history charts must be slim');
for(const band of ['red','yellow','green','brown'])assert.ok(strip.includes('data-band="'+band+'"'),'Average arrows must render '+band+' speeds');
for(const rotation of [180,270,360,450])assert.ok(strip.includes('rotate('+rotation+')'),'Direction arrows must show where wind goes');
const averageGroups=[...strip.matchAll(/<g class="wind-history-glyph wind-average-glyph"[\s\S]*?<\/g>/g)].map(m=>m[0]);
const gustGroups=[...strip.matchAll(/<g class="wind-gust-glyph"[\s\S]*?<\/g>/g)].map(m=>m[0]);
assert.equal(averageGroups.filter(g=>g.includes('<circle ')).length,2,'Calm and missing average direction must use dots');
assert.equal(gustGroups.length,6);assert.ok(gustGroups.every(g=>g.includes('opacity=".35"')),'Gust arrows must be translucent');
assert.ok(gustGroups.every(g=>g.includes('fill="#7c888e"')),'Gusts must stay grey instead of using average-wind colours');
assert.ok(!strip.includes('NaN'));assert.ok(node('station-list').innerHTML.includes('Falling'));
assert.ok(node('station-strip-marks').innerHTML.includes('Timed history unavailable'),'Missing histories must have a real source link, not invented arrows');
node('station-strip-norah-child').onkeydown({key:'Home',preventDefault(){}});
assert.ok(node('station-tooltip').innerHTML.includes('Average 10 kt'),'Keyboard inspection must reach the first reading');
node('station-strip-norah-child').onkeydown({key:'End',preventDefault(){}});
assert.ok(node('station-tooltip').innerHTML.includes('Average 0 kt'),'Keyboard inspection must retain calm readings');
app.setHours(24);assert.ok(node('station-time-axis').innerHTML.includes('Last 24h'));chooseWind('NE');
context.fetch=async url=>Response.json(url.endsWith('/reviews')?{reviews:[]}:{checkedAt:new Date().toISOString(),stations:live});
const fitsBefore=maps.get('map').fits.length;await app.refresh();
assert.equal(app.state().hours,24,'Live refresh must preserve the station chart range');
assert.equal(app.state().windDirection,'NE','Live refresh must preserve the site direction filter');
assert.equal(app.state().selected,'norah');assert.equal(maps.get('map').fits.length,fitsBefore);
console.log('Passed: seven compact station histories, translucent gust arrows, average speed colours, keyboard inspection, range/selection preservation, site maps and private review editing.');
