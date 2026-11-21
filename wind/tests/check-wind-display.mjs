import assert from 'node:assert/strict';
import {WIND_BANDS,WIND_UNKNOWN,windBand,windTrend,timedWindHistory,windHistorySegments,sampleWindArrows,WIND_LEGEND_HTML} from '../../worker/hunter-wind-display.mjs';

assert.deepEqual(WIND_BANDS.map(b=>b.id),['red','yellow','green','brown']);
for(const [speed,band] of [[0,'red'],[11.9,'red'],[12,'yellow'],[15.9,'yellow'],[16,'green'],[29.9,'green'],[30,'brown'],[45,'brown']])assert.equal(windBand(speed).id,band,'Incorrect band at '+speed+' knots');
for(const value of [null,undefined,NaN,-1,'12',Infinity])assert.equal(windBand(value),WIND_UNKNOWN,'Missing or invalid speeds must not look like light wind');
for(const band of WIND_BANDS){assert.ok(WIND_LEGEND_HTML.includes(band.color));assert.ok(WIND_LEGEND_HTML.includes(band.description));}

const now=Date.parse('2026-11-22T00:00:00Z'),at=(minutes,speed,gust=40,degrees=0)=>({time:new Date(now-minutes*60000).toISOString(),speed,gust,degrees});
const reading=(speed,previous,mode='live')=>({mode,latest:at(0,speed),history:[at(30,previous-5),at(20,previous),at(5,previous+7),at(0,speed)]});
assert.equal(windTrend(reading(18,12),now).state,'rising');
assert.equal(windTrend(reading(8,14),now).state,'falling');
assert.equal(windTrend(reading(12.4,12),now).state,'steady');
assert.equal(windTrend(reading(13,12),now).state,'rising');
assert.equal(windTrend(reading(11,12),now).state,'falling');
assert.equal(windTrend(reading(0,0),now).state,'steady','Calm is a real observation');
assert.equal(windTrend(reading(18,12),now).delta,6,'Gusts must not be compared with average wind');
assert.equal(windTrend(reading(18,12),now).minutes,20,'Prefer a comparable reading about 20 minutes earlier');
assert.equal(windTrend({mode:'live',latest:at(0,18),history:[at(30,12)]},now).minutes,30,'A 30-minute station cadence must work');
for(const d of [
 {...reading(18,12),latest:{speed:18,time:null}},
 {...reading(18,12),latest:at(100,18)},
 {...reading(18,12),latest:at(-10,18)},
 {...reading(18,12),history:[at(46,12)]},
 {...reading(18,12),history:[]},
 reading(18,12,'saved')
])assert.equal(windTrend(d,now).state,'unknown','An unverified trend must not be presented as rising or falling');

const points=timedWindHistory([at(0,12),at(30,8),at(20,9),at(20,10),{time:'bad',speed:80},at(-1,30)],now-3600000,now);
assert.deepEqual(points.map(p=>p.speed),[8,10,12],'Sort, deduplicate and reject invalid/future timestamps');
assert.equal(timedWindHistory([{...at(0,0),degrees:370}],0,now)[0].degrees,10);
const broken=timedWindHistory([at(120,8),at(110,10),at(100,null),at(90,12),at(0,18)],0,now);
assert.deepEqual(windHistorySegments(broken,'speed').map(s=>s.length),[2,1,1],'Neither missing values nor long gaps may be joined');
const sampled=sampleWindArrows(Array.from({length:1000},(_,i)=>({speed:i%35,stamp:i})),25);
assert.equal(sampled.length,25);assert.equal(sampled[0].stamp,0);assert.equal(sampled.at(-1).stamp,999,'The last reading must always be represented');
const partial=[{speed:null,gust:20},{speed:5,gust:null},{speed:0,gust:0}];
assert.deepEqual(sampleWindArrows(partial,10,'gust').map(p=>p.gust),[20,0],'Gust-only readings and zero gusts must be retained');
assert.deepEqual(sampleWindArrows(partial,10).map(p=>p.speed),[5,0],'Missing averages must not be invented from gusts');
console.log('Passed: exact speed changeovers, unknown readings, average-wind trends, station cadences, stale/untimed suppression, history gaps and arrow sampling.');
