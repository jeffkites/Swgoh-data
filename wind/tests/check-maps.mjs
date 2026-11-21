import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {MAP_REGIONS,SPOT_LOCATIONS,STATIONS,SPOT_GUIDES} from '../../worker/hunter-wind.mjs';

assert.deepEqual(MAP_REGIONS.map(r=>r.id),['lake','nelson','central']);
assert.deepEqual(MAP_REGIONS.flatMap(r=>r.stationIds).sort(),STATIONS.map(s=>s.id).sort(),'Each gauge belongs to exactly one regional map');
assert.ok(!MAP_REGIONS[0].stationIds.includes('nelson'));
assert.ok(!MAP_REGIONS[0].stationIds.includes('norah'));
assert.ok(MAP_REGIONS[0].bounds[1][0]-MAP_REGIONS[0].bounds[0][0]<0.3,'The lake map must stay close in');
assert.equal(SPOT_LOCATIONS.length,18);
for(const place of SPOT_LOCATIONS){
 assert.ok(SPOT_GUIDES.some(g=>g.id===place.guideId));
 assert.ok(MAP_REGIONS.some(r=>r.id===place.region));
 assert.ok(Number.isFinite(place.lat)&&place.lat<-32.5&&place.lat>-33.5);
 assert.ok(Number.isFinite(place.lon)&&place.lon>151.3&&place.lon<152.4);
 assert.match(place.sourceUrl,/^https:\/\/www\.openstreetmap\.org\/(way|node|relation)\//);
}
assert.equal(new Set(SPOT_LOCATIONS.map(p=>p.guideId)).size,18,'All reviews must be reachable from a map pin');
const salts=SPOT_LOCATIONS.find(p=>p.guideId==='salts-bay');
assert.notEqual(salts.lat,STATIONS.find(s=>s.id==='swansea').lat,'A kiting area must not reuse the Marine Rescue gauge position');

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),maps=new Map(),createdMarkers=[];
const node=id=>{
 if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',style:{},dataset:{},isConnected:true,
  classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],querySelector:()=>node(id+'-child'),
  setAttribute(name,value){this[name]=value;},focus(){this.focused=true;},scrollIntoView(){},
  showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100};}});
 return nodes.get(id);
};
const L={
 map(id){const map={id,layers:new Set(),fits:[],fitBounds(bounds){this.fits.push(bounds);return this;},addLayer(layer){this.layers.add(layer);return this;},removeLayer(layer){this.layers.delete(layer);return this;},hasLayer(layer){return this.layers.has(layer);},panTo(position){this.pan=position;return this;}};maps.set(id,map);return map;},
 tileLayer:()=>({addTo(){return this;}}),control:{zoom:()=>({addTo(){}})},divIcon:options=>({options}),
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
vm.runInContext(script.slice(0,cut)+';globalThis.actions={setRegion,selectStation,render,renderSpotCards,initMap,refresh,state:()=>({region,selected,siteLayer,guideFilter}),filter:value=>{guideFilter=value;renderSpotCards();renderSpotMap(true);}};',context);
const app=context.actions;
app.render();app.renderSpotCards();app.initMap();
assert.equal(maps.size,2,'Wind and site maps must be separate');
assert.equal(app.state().siteLayer.layers.length,12);
assert.equal(node('station-count').textContent,'4 stations');
app.setRegion('nelson');
assert.equal(app.state().selected,'nelson');
assert.equal(node('station-count').textContent,'2 stations');
assert.equal(app.state().siteLayer.layers.length,5);
const bagnalls=app.state().siteLayer.layers.find(m=>m.options.title.startsWith("Bagnall"));
assert.ok(bagnalls);bagnalls.events.click();
assert.equal(node('spot-dialog').open,true);
assert.ok(node('spot-content').innerHTML.includes('Jordan Jensen'));
assert.ok(node('spot-content').innerHTML.includes('/kitesurfing-in-nelson-bay'));
assert.ok(!node('spot-content').innerHTML.includes('Directions in'),'Link-only reviews must not display fabricated direction details');
node('spot-dialog').close();
app.selectStation('norah',true);
assert.equal(app.state().region,'central','Selecting a gauge switches to its region');
assert.equal(app.state().siteLayer.layers.length,1);
const windFits=maps.get('map').fits.length;
await app.refresh();
assert.equal(app.state().region,'central','Live refresh must preserve the selected region');
assert.equal(maps.get('map').fits.length,windFits,'Live refresh must not reset a panned map');
app.setRegion('lake');app.filter('historical');
assert.equal(app.state().siteLayer.layers.length,6);
assert.ok(node('spot-grid').innerHTML.includes('Source · via JulesK'));
console.log('Passed: regional coverage, all 18 review pins, separate maps, map-to-review attribution, gauge navigation, filtering and live refresh without map resets.');
