import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const frame=html.match(/<iframe[^>]*id="forecast-frame"[^>]*>/)?.[0];
assert.ok(frame);assert.ok(!/\bsrc=/.test(frame),'A collapsed forecast panel must not load the external widget');
assert.match(frame,/loading="lazy"/);assert.match(frame,/referrerpolicy="no-referrer-when-downgrade"/);
assert.ok(html.includes('Forecast graphs supplied by Seabreeze'));
assert.ok(!/<details[^>]*id="forecast-details"[^>]*\bopen\b/.test(html),'Forecasts must not lengthen the wind page until opened');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1],cut=script.lastIndexOf("$('refresh').onclick=refresh;");
assert.ok(cut>0);
const nodes=new Map(),loads=[];
function node(id){
 if(!nodes.has(id))nodes.set(id,{id,open:false,textContent:'',href:'',style:{},dataset:{},
  setAttribute(key,value){this[key]=value;},addEventListener(){},scrollIntoView(){this.scrolled=true;},
  get src(){return this._src||'';},set src(value){this._src=value;loads.push(value);}});
 return nodes.get(id);
}
const places=['newcastle','norah'].map(id=>Object.assign(node('choose-'+id),{dataset:{forecast:id}}));
const periods=[3,7].map(days=>Object.assign(node('period-'+days),{dataset:{forecastDays:String(days)}}));
const context=vm.createContext({Intl,Date,Set,Map,URLSearchParams,AbortSignal,
 window:{matchMedia:()=>({matches:true})},
 document:{getElementById:node,querySelectorAll:selector=>selector==='[data-forecast]'?places:selector==='[data-forecast-days]'?periods:[]},
 fetch(){throw new Error('Forecast controls must embed the published widget without extracting provider data.');}
});
vm.runInContext(script.slice(0,cut)+';globalThis.forecastTest={setupForecasts,openForecasts,setForecastPlace,setForecastDays};',context);
const app=context.forecastTest;app.setupForecasts();
assert.equal(loads.length,0);assert.ok(node('forecast-current').textContent.includes('Newcastle'));
places[1].onclick();assert.equal(loads.length,0,'Choosing a location while collapsed must not contact the provider');
node('forecast-nav').onclick();
function assertWidget(location,size){
 const url=new URL(node('forecast-frame').src);
 assert.equal(url.origin,'https://www.seabreeze.com.au');assert.equal(url.pathname,'/weather/shared/panel');
 assert.equal(url.searchParams.get('panel'),'graph');assert.equal(url.searchParams.get('loc'),location);assert.equal(url.searchParams.get('size'),size);assert.equal(url.searchParams.get('rev'),'0');
 assert.equal(node('forecast-source').href,url.href,'The external fallback must retain the official widget URL');
}
assertWidget('nora','m');assert.equal(places[1]['aria-pressed'],'true');
assert.ok(node('forecast-frame').title.includes('Norah Head'));
periods[1].onclick();assertWidget('nora','l');assert.equal(periods[1]['aria-pressed'],'true');
places[0].onclick();assertWidget('newc','l');
app.setForecastPlace('untrusted.example');app.setForecastDays(99);assertWidget('newc','l');
const before=loads.length;node('forecast-details').open=false;node('forecast-details').ontoggle();
assert.equal(loads.length,before,'Closing the forecast must not reload it');
app.openForecasts();assertWidget('newc','l');assert.equal(loads.length,before,'Reopening keeps the selected forecast without redundant requests');
assert.equal(node('forecasts').scrolled,true);
node('forecast-reload').onclick();assert.equal(loads.length,before+1);assertWidget('newc','l');
periods[0].onclick();assertWidget('newc','m');assert.ok(node('forecast-current').textContent.includes('3-day'));
console.log('Passed: official Seabreeze iframe URLs, no provider requests while collapsed, location and forecast-period selection, explicit reload, preserved selection and external fallback.');
