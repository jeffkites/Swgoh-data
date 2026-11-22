// One speed scale for map markers, observation cards and history arrows.
// The changeover speeds are 12, 16 and 30 knots; gusts use their own series.
export const WIND_BANDS=[
 {id:'red',max:12,color:'#ed2029',edge:'#9b1720',label:'Under 12',description:'Red: under 12 knots'},
 {id:'yellow',max:16,color:'#f0dc22',edge:'#8a7610',label:'12–<16',description:'Yellow: 12 to under 16 knots'},
 {id:'green',max:30,color:'#26cf42',edge:'#147d27',label:'16–<30',description:'Green: 16 to under 30 knots'},
 {id:'brown',max:null,color:'#98603c',edge:'#623b23',label:'30+',description:'Brown: 30 knots and above'}
];
export const WIND_UNKNOWN={id:'unknown',color:'#81949a',edge:'#60767b',label:'No reading'};
export const WIND_ARROW_PATH='M12 1 22 11 16 11 16 23 8 23 8 11 2 11Z';
export function windBand(speed){
 return Number.isFinite(speed)&&speed>=0?WIND_BANDS.find(b=>b.max===null||speed<b.max):WIND_UNKNOWN;
}
export function timedWindHistory(history,start=0,end=Date.now()){
 const unique=new Map();
 for(const point of Array.isArray(history)?history:[]){
  const stamp=typeof point?.time==='string'?Date.parse(point.time):NaN;
  if(!Number.isFinite(stamp)||stamp<start||stamp>end)continue;
  const valid=v=>Number.isFinite(v)&&v>=0?v:null;
  unique.set(stamp,{...point,stamp,speed:valid(point.speed),gust:valid(point.gust),
   degrees:Number.isFinite(point.degrees)?((point.degrees%360)+360)%360:null});
 }
 return [...unique.values()].sort((a,b)=>a.stamp-b.stamp);
}
export function windTrend(reading,now=Date.now()){
 const unknown=reason=>({state:'unknown',symbol:'—',label:'Trend unavailable',delta:null,minutes:null,reason});
 const latest=reading?.latest,stamp=typeof latest?.time==='string'?Date.parse(latest.time):NaN;
 if(!Number.isFinite(latest?.speed)||latest.speed<0||!Number.isFinite(stamp))return unknown('A timed wind observation and recent history are required.');
 if(reading.mode==='saved'||reading.mode==='untimed-saved'||now-stamp>90*60000||stamp>now+5*60000)return unknown('Saved or old readings do not establish a current wind trend.');
 const candidates=timedWindHistory(reading.history,stamp-45*60000,stamp-5*60000).filter(p=>p.speed!==null);
 candidates.sort((a,b)=>Math.abs(stamp-a.stamp-20*60000)-Math.abs(stamp-b.stamp-20*60000)||b.stamp-a.stamp);
 const previous=candidates[0];
 if(!previous)return unknown('No comparable average-wind reading from 5–45 minutes earlier.');
 const delta=Math.round((latest.speed-previous.speed)*10)/10,minutes=Math.round((stamp-previous.stamp)/60000);
 const state=delta>=1?'rising':delta<=-1?'falling':'steady';
 return {state,symbol:state==='rising'?'↗':state==='falling'?'↘':'→',
  label:state==='rising'?'Rising':state==='falling'?'Falling':'Steady',delta,minutes,
  reason:'Compared with the average wind '+minutes+' minutes before the latest measurement. Changes smaller than 1 knot are labelled steady.'};
}
export function windHistorySegments(points,key,maxGap=50*60000){
 const segments=[];let segment=[],previous=null;
 for(const point of points){
  if(!Number.isFinite(point[key])){if(segment.length)segments.push(segment);segment=[];previous=null;continue;}
  if(previous!==null&&point.stamp-previous>maxGap){if(segment.length)segments.push(segment);segment=[];}
  segment.push(point);previous=point.stamp;
 }
 if(segment.length)segments.push(segment);
 return segments;
}
export function sampleWindArrows(points,limit,key='speed',start=null,end=null){
 const valid=points.filter(p=>Number.isFinite(p[key])&&Number.isFinite(p.stamp)).sort((a,b)=>a.stamp-b.stamp);
 if(!valid.length)return [];
 const count=Math.max(2,Math.floor(limit)),first=valid[0],last=valid.at(-1);
 const from=Number.isFinite(start)?start:first.stamp,to=Number.isFinite(end)?end:last.stamp,gap=Math.max(0,to-from)/(count-1);
 if(!gap)return [last];
 // Work backwards so the newest observation is always shown. Space glyphs by
 // elapsed time across the visible chart, independent of source sample density.
 const selected=[last];
 for(let i=valid.length-2;i>=0;i--)if(selected.at(-1).stamp-valid[i].stamp>=gap)selected.push(valid[i]);
 // Keep the start of the series when it fits; do not crowd a short recent burst.
 if(selected.length>1&&selected.at(-1)!==first)selected[selected.length-1]=first;
 return selected.reverse();
}
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const WIND_LEGEND_HTML='<div class="scale wind-scale" aria-label="Wind speed colours in knots">'+WIND_BANDS.map(b=>'<span title="'+escapeHtml(b.description)+'"><i style="background:'+b.color+'"></i>'+escapeHtml(b.label)+'</span>').join('')+'<span class="wind-scale-unit">kt</span></div>';
export const WIND_DISPLAY_CSS=String.raw`
.metric{border-top:3px solid var(--wind-color,var(--line))}.metric .small-arrow{color:var(--wind-color,var(--muted))}.wind-trend{display:inline-flex;align-items:center;gap:4px;color:var(--ink);font-size:12px;font-weight:600;line-height:1.5}.wind-trend small{color:var(--muted);font-weight:400;font-size:11px}.wind-trend.unknown{color:var(--muted);font-weight:400}.metric>.wind-trend{margin-top:7px}.wind-scale{gap:12px;font-size:12px}.wind-scale i{width:10px;height:10px;border:1px solid #15353d25;flex-shrink:0}.wind-scale-unit{color:var(--muted)}
#wind-map-card{display:flex;flex-direction:column}#wind-map-card .map-shell{display:flex;flex:1;min-height:454px}#wind-map-card #map{height:auto;min-height:454px;flex:1}.station-list{max-height:none;overflow:visible}.station-strip{padding:5px 12px;border-bottom:1px solid #edf1f0;position:relative}.station-strip:last-child{border-bottom:0}.station-strip.selected{background:#f1f8f5;box-shadow:inset 3px 0 var(--teal)}.station-strip-head{display:flex;align-items:center;gap:7px;min-width:0;min-height:24px}.station-select{border:0;padding:2px 0;background:none;text-align:left;color:var(--ink);font-size:13px;font-weight:600;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:24px}.station-source{font-size:10px;color:var(--muted);padding:4px 2px;min-height:24px;text-decoration:none}.station-source:hover{text-decoration:underline}.station-strip-head .wind-trend,.strip-status{font-size:10px;white-space:nowrap}.station-strip-head .wind-trend svg{width:11px;height:11px}.strip-status{color:#8a621e}.station-strip-chart{height:40px;width:100%;position:relative}.station-strip-chart>svg{display:block;width:100%;height:40px;overflow:visible}.station-strip-chart>svg:focus-visible{outline:2px solid var(--teal);outline-offset:1px;border-radius:3px}.wind-history-glyph,.wind-gust-glyph{pointer-events:none}.strip-empty{height:40px;display:flex;align-items:center;margin:0;font-size:11px;color:var(--muted)}.station-strip-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line);flex-wrap:wrap}.station-series-key{display:flex;gap:10px;font-size:10px;color:var(--muted)}.station-series-key span{display:inline-flex;align-items:center;gap:3px}.station-series-key svg{width:11px;height:14px}.station-strip-toolbar .range button{padding:3px 7px;font-size:11px}.station-time-axis{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);padding:4px 20px 0 33px}.station-chart-help{font-size:10px;color:var(--muted);line-height:1.5;margin:6px 12px 10px}.station-tooltip{position:fixed;z-index:1200;max-width:240px;white-space:normal;line-height:1.5}
@media(max-width:760px){#wind-map-card .map-shell{display:block;flex:initial;min-height:390px}#wind-map-card #map{height:390px;min-height:390px}.station-strip{padding:5px 15px}.station-strip-toolbar{padding:9px 15px}.station-select{font-size:14px}.station-source,.station-series-key,.station-chart-help,.station-time-axis{font-size:11px}.station-strip-head .wind-trend,.strip-status{font-size:11px}.wind-scale{gap:8px}}
`;
export const WIND_DISPLAY_SCRIPT=[
 'const WIND_BANDS='+JSON.stringify(WIND_BANDS)+';',
 'const WIND_UNKNOWN='+JSON.stringify(WIND_UNKNOWN)+';',
 'const WIND_ARROW_PATH='+JSON.stringify(WIND_ARROW_PATH)+';',
 windBand.toString(),timedWindHistory.toString(),windTrend.toString(),windHistorySegments.toString(),sampleWindArrows.toString()
].join('\n')+String.raw`
function color(speed){return windBand(speed).color;}
function trendBadge(d,compact=false){
 const t=windTrend(d),change=t.state==='unknown'?'':(t.delta>0?'+':'')+value(t.delta)+' kt';
 const path=t.state==='rising'?'M5 19 19 5M6 5H19V18':t.state==='falling'?'M5 5 19 19M6 19H19V6':t.state==='steady'?'M4 12H20M14 6 20 12 14 18':'M5 12H19';
 return '<span class="wind-trend '+t.state+'" title="'+esc(t.reason)+'"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink:0;align-self:center"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>'+(compact&&t.state==='unknown'?'No trend':t.label)+(!compact&&change?' '+change:'')+'</span>'+(!compact&&t.minutes?'<small>over '+t.minutes+' min</small>':'')+'</span>';
}
function renderStationStrip(station,d,now=Date.now()){
 const host=$('station-strip-'+station.id),start=now-hours*3600000,points=timedWindHistory(d.history,start,now);
 if(!points.some(p=>p.speed!==null||p.gust!==null)){
  host.innerHTML='<p class="strip-empty">'+(d.history?.length?'No readings in the last '+hours+'h':'Timed history unavailable')+'</p>';return;
 }
 const w=Math.max(220,Math.round(host.getBoundingClientRect().width)||290),h=40,left=21,right=9,top=6,bottom=6,plotW=w-left-right,plotH=h-top-bottom;
 const vals=points.flatMap(p=>[p.speed,p.gust]).filter(Number.isFinite),max=Math.max(20,Math.ceil((Math.max(...vals,0)+2)/5)*5);
 const x=p=>left+(p.stamp-start)/(now-start)*plotW,y=v=>top+plotH-v/max*plotH;
 const chartLabel=station.name+', average wind and gust arrow history, last '+hours+' hours. Use left and right arrow keys to inspect readings.';
 let svg='<svg viewBox="0 0 '+w+' '+h+'" height="40" role="img" tabindex="0" aria-describedby="station-chart-help" aria-label="'+esc(chartLabel)+'"><title>'+esc(station.name)+' · last '+hours+'h</title><desc>Coloured arrows show average wind, translucent grey arrows show gusts. Both use the recorded wind direction. Missing data is not joined.</desc>';
 svg+='<line x1="'+left+'" y1="'+y(0)+'" x2="'+(w-right)+'" y2="'+y(0)+'" stroke="#e3eae8"/><text x="1" y="10" font-size="8" fill="#7b8c90">'+max+'</text><text x="1" y="37" font-size="8" fill="#7b8c90">0</text>';
 for(const segment of windHistorySegments(points,'gust'))svg+='<path class="wind-gust-line" d="'+segment.map((p,i)=>(i?'L':'M')+x(p).toFixed(1)+','+y(p.gust).toFixed(1)).join(' ')+'" fill="none" stroke="#7c888e" stroke-width="1" stroke-opacity=".22"/>';
 for(const segment of windHistorySegments(points,'speed'))for(let i=1;i<segment.length;i++){const a=segment[i-1],b=segment[i];svg+='<line class="wind-speed-line" x1="'+x(a).toFixed(1)+'" y1="'+y(a.speed).toFixed(1)+'" x2="'+x(b).toFixed(1)+'" y2="'+y(b.speed).toFixed(1)+'" stroke="'+color(b.speed)+'" stroke-width="1.2" stroke-opacity=".55"/>';}
 const count=Math.max(10,Math.floor(plotW/12));
 for(const key of ['gust','speed'])for(const point of sampleWindArrows(points,count,key,start,now)){
  const speed=point[key],gust=key==='gust',band=windBand(speed),directional=speed>0&&Number.isFinite(point.degrees);
  const cls=gust?'wind-gust-glyph':'wind-history-glyph wind-average-glyph',fill=gust?'#7c888e':band.color,stroke=gust?'#63747b':band.edge;
  svg+='<g class="'+cls+'" data-series="'+(gust?'gust':'average')+'" data-speed="'+speed+'"'+(gust?' opacity=".35"':' data-band="'+band.id+'"')+' transform="translate('+x(point).toFixed(1)+' '+y(speed).toFixed(1)+')'+(directional?' rotate('+(point.degrees+180)+')':'')+'"><title>'+esc(time(point.time)+', '+(gust?'gust ':'average ')+value(speed)+' kt')+'</title>'+(directional?'<path d="'+WIND_ARROW_PATH+'" transform="scale(.48) translate(-12 -12)" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5" stroke-linejoin="round"/>':'<circle r="2" fill="'+fill+'" stroke="'+stroke+'" stroke-width=".6"/>')+'</g>';
 }
 host.innerHTML=svg+'</svg>';
 const svgEl=host.querySelector('svg'),tip=$('station-tooltip');let active=points.length-1;
 const show=(point,pixel)=>{
  const rect=svgEl.getBoundingClientRect(),viewportW=window.innerWidth||1100,viewportH=window.innerHeight||800;
  tip.innerHTML='<strong>'+esc(station.name)+'</strong><br>'+esc(fullTime(point.time))+'<br>Average '+value(point.speed)+' kt · gust '+value(point.gust)+' kt<br>From '+esc(point.direction||(point.speed===0?'Calm':'unavailable'));
  tip.style.display='block';tip.style.left=Math.max(8,Math.min(rect.left+pixel-100,viewportW-248))+'px';tip.style.top=Math.max(8,Math.min(rect.top-104,viewportH-120))+'px';
 };
 const inspect=event=>{
  const rect=svgEl.getBoundingClientRect(),pixel=event.clientX-rect.left,stamp=start+((pixel/rect.width*w)-left)/plotW*(now-start);
  active=points.reduce((best,p,i)=>Math.abs(p.stamp-stamp)<Math.abs(points[best].stamp-stamp)?i:best,0);show(points[active],pixel);
 };
 svgEl.onpointermove=inspect;svgEl.onpointerdown=inspect;svgEl.onpointerleave=event=>{if(event.pointerType!=='touch')tip.style.display='none';};
 svgEl.onfocus=()=>show(points[active],x(points[active])/w*svgEl.getBoundingClientRect().width);svgEl.onblur=()=>tip.style.display='none';
 svgEl.onkeydown=event=>{
  if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key))return;
  event.preventDefault();if(event.key==='Escape'){tip.style.display='none';return;}
  active=event.key==='Home'?0:event.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,active+(event.key==='ArrowLeft'?-1:1)));
  const point=points[active];show(point,x(point)/w*svgEl.getBoundingClientRect().width);
  svgEl.setAttribute('aria-label',station.name+', '+fullTime(point.time)+', average '+value(point.speed)+' knots, gust '+value(point.gust)+' knots, from '+(point.direction||'unavailable')+'. Use left and right arrows to inspect readings.');
 };
}
`;
