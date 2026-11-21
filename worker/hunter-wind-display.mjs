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
export function sampleWindArrows(points,limit){
 const valid=points.filter(p=>Number.isFinite(p.speed));
 const count=Math.max(2,Math.floor(limit));
 if(valid.length<=count)return valid;
 return Array.from({length:count},(_,i)=>valid[Math.round(i*(valid.length-1)/(count-1))]);
}
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const WIND_LEGEND_HTML='<div class="scale wind-scale" aria-label="Wind speed colours in knots">'+WIND_BANDS.map(b=>'<span title="'+escapeHtml(b.description)+'"><i style="background:'+b.color+'"></i>'+escapeHtml(b.label)+'</span>').join('')+'<span class="wind-scale-unit">kt</span></div>';
export const WIND_DISPLAY_CSS=String.raw`
.metric{border-top:3px solid var(--wind-color,var(--line))}.metric .small-arrow{color:var(--wind-color,var(--muted))}.wind-trend{display:inline-flex;align-items:baseline;gap:5px;color:var(--ink);font-size:12px;font-weight:600;line-height:1.5}.wind-trend small{color:var(--muted);font-weight:400;font-size:11px}.wind-trend.unknown{color:var(--muted);font-weight:400}.metric>.wind-trend{margin-top:7px}.station-meta>.wind-trend{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}.chart-stats>.wind-trend{align-self:center}.chart-key{display:flex;flex-direction:column;gap:7px;margin:12px 24px 0}.chart-caption{margin:0;font-size:12px;line-height:1.6;color:var(--muted)}.wind-scale{gap:12px;font-size:12px}.wind-scale i{width:10px;height:10px;border:1px solid #15353d25;flex-shrink:0}.wind-scale-unit{color:var(--muted)}.legend .average svg{width:17px;height:21px;color:#26cf42}.legend .gust i{height:2px;background:repeating-linear-gradient(to right,#849498 0 5px,transparent 5px 8px)}.chart svg:focus-visible{outline:2px solid var(--teal);outline-offset:3px;border-radius:5px}.chart .wind-history-glyph{pointer-events:none}.chart .tooltip{font-size:12px;max-width:240px;white-space:normal}.chart-note{line-height:1.6}@media(max-width:760px){.chart-key{margin:12px 17px 0}.chart-caption,.wind-scale{font-size:11px}.chart{min-height:280px}.chart-stats>.wind-trend{flex-basis:100%}.wind-scale{gap:8px}.wind-trend{font-size:12px}}
`;
export const WIND_DISPLAY_SCRIPT=[
 'const WIND_BANDS='+JSON.stringify(WIND_BANDS)+';',
 'const WIND_UNKNOWN='+JSON.stringify(WIND_UNKNOWN)+';',
 'const WIND_ARROW_PATH='+JSON.stringify(WIND_ARROW_PATH)+';',
 windBand.toString(),timedWindHistory.toString(),windTrend.toString(),windHistorySegments.toString(),sampleWindArrows.toString()
].join('\n')+String.raw`
function color(speed){return windBand(speed).color;}
function trendBadge(d){
 const t=windTrend(d),change=t.state==='unknown'?'':(t.delta>0?'+':'')+value(t.delta)+' kt';
 return '<span class="wind-trend '+t.state+'" title="'+esc(t.reason)+'"><span aria-hidden="true">'+t.symbol+'</span><span>'+t.label+(change?' '+change:'')+'</span>'+(t.minutes?'<small>over '+t.minutes+' min</small>':'')+'</span>';
}
function renderChart(s,d){
 const now=Date.now(),start=now-hours*3600000,points=timedWindHistory(d.history,start,now);
 document.querySelectorAll('[data-hours]').forEach(b=>{const active=Number(b.dataset.hours)===hours;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const latest=d.latest||points.at(-1)||{},gusts=points.map(p=>p.gust).filter(Number.isFinite);
 $('chart-stats').innerHTML='<span>Latest<strong>'+value(latest.speed)+' kt</strong></span><span>From<strong>'+esc(latest.direction||'—')+'</strong></span><span>Peak gust<strong>'+value(gusts.length?Math.max(...gusts):null)+' kt</strong></span>'+trendBadge(d);
 if(!points.some(p=>p.speed!==null||p.gust!==null)){
  $('chart').innerHTML='<div style="padding:50px 15px;text-align:center;color:var(--muted)">No observations in this time window.<br><small>Last observation: '+esc(fullTime(latest.time))+'</small></div>';return;
 }
 const width=$('chart').getBoundingClientRect().width,w=Math.max(320,Math.round(width)||1100),h=300,left=39,right=20,top=26,bottom=47,plotW=w-left-right,plotH=h-top-bottom;
 const vals=points.flatMap(p=>[p.speed,p.gust]).filter(Number.isFinite),max=Math.max(20,Math.ceil((Math.max(...vals,0)+2)/5)*5);
 const x=p=>left+(p.stamp-start)/(now-start)*plotW,y=v=>top+plotH-(v/max)*plotH;
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" tabindex="0" aria-describedby="chart-caption" aria-label="'+esc(s.name)+' wind speed, direction and gusts over the last '+hours+' hours. Use left and right arrow keys to inspect readings."><title>'+esc(s.name)+' wind history</title><desc>Coloured arrows sit at the measured average wind speed. Their direction shows where the wind is going. The dashed line shows gusts. Data gaps are left blank.</desc>';
 const tickStep=Math.max(5,Math.ceil(max/6/5)*5);
 for(let v=0;v<=max;v+=tickStep)svg+='<line x1="'+left+'" y1="'+y(v)+'" x2="'+(w-right)+'" y2="'+y(v)+'" stroke="#dde6e4" stroke-dasharray="2 4"/><text x="'+(left-8)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="#60767b">'+v+'</text>';
 svg+='<text x="'+left+'" y="14" fill="#60767b" font-size="11">kt</text>';
 for(const segment of windHistorySegments(points,'gust'))svg+='<path class="wind-gust-line" d="'+segment.map((p,i)=>(i?'L':'M')+x(p).toFixed(1)+','+y(p.gust).toFixed(1)).join(' ')+'" fill="none" stroke="#849498" stroke-width="1.6" stroke-dasharray="5 4" stroke-linecap="round"/>';
 for(const segment of windHistorySegments(points,'speed')){
  for(let i=1;i<segment.length;i++){
   const a=segment[i-1],b=segment[i],c=windBand(b.speed);
   svg+='<line class="wind-speed-line" x1="'+x(a).toFixed(1)+'" y1="'+y(a.speed).toFixed(1)+'" x2="'+x(b).toFixed(1)+'" y2="'+y(b.speed).toFixed(1)+'" stroke="'+c.color+'" stroke-width="2" stroke-opacity=".65"/>';
  }
 }
 const ticks=w<600?3:6;
 for(let i=0;i<=ticks;i++){
  const stamp=start+(now-start)*i/ticks;
  svg+='<text x="'+(left+plotW*i/ticks)+'" y="'+(top+plotH+24)+'" text-anchor="'+(i===0?'start':i===ticks?'end':'middle')+'" font-size="11" fill="#60767b">'+esc(tf.format(new Date(stamp)))+'</text>';
 }
 const arrows=sampleWindArrows(points,Math.max(12,Math.floor(plotW/19)));
 for(const p of arrows){
  const band=windBand(p.speed),directional=p.speed>0&&Number.isFinite(p.degrees);
  const label=time(p.time)+': '+value(p.speed)+' kt'+(directional?', from '+(p.direction||p.degrees+'°'):p.speed===0?', calm':', direction unavailable');
  svg+='<g class="wind-history-glyph" data-speed="'+p.speed+'" data-band="'+band.id+'" transform="translate('+x(p).toFixed(1)+' '+y(p.speed).toFixed(1)+')'+(directional?' rotate('+(p.degrees+180)+')':'')+'"><title>'+esc(label)+'</title>'+(directional?'<path d="'+WIND_ARROW_PATH+'" transform="translate(-12 -12)" fill="'+band.color+'" stroke="'+band.edge+'" stroke-width="1.15" stroke-linejoin="round"/>':'<circle r="4" fill="'+band.color+'" stroke="'+band.edge+'" stroke-width="1.2"/>')+'</g>';
 }
 svg+='</svg><div class="tooltip" id="chart-tooltip" role="tooltip"></div>';$('chart').innerHTML=svg;
 const svgEl=$('chart').querySelector('svg'),tip=$('chart-tooltip');let active=points.length-1;
 const show=(point,pixel)=>{
  const r=svgEl.getBoundingClientRect();
  tip.innerHTML=esc(fullTime(point.time))+'<br>Average '+value(point.speed)+' kt · gust '+value(point.gust)+' kt<br>From '+esc(point.direction||(point.speed===0?'Calm':'unavailable'));
  tip.style.display='block';tip.style.left=Math.max(4,Math.min(pixel+12,r.width-220))+'px';tip.style.top='12px';
 };
 const inspect=event=>{
  const r=svgEl.getBoundingClientRect(),cursor=(event.clientX-r.left)/r.width*w,stamp=start+(cursor-left)/plotW*(now-start);
  active=points.reduce((best,p,i)=>Math.abs(p.stamp-stamp)<Math.abs(points[best].stamp-stamp)?i:best,0);
  show(points[active],event.clientX-r.left);
 };
 svgEl.onpointermove=inspect;svgEl.onpointerdown=inspect;
 svgEl.onpointerleave=event=>{if(event.pointerType!=='touch')tip.style.display='none';};
 svgEl.onfocus=()=>show(points[active],x(points[active])/w*svgEl.getBoundingClientRect().width);
 svgEl.onblur=()=>tip.style.display='none';
 svgEl.onkeydown=event=>{
  if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key))return;
  event.preventDefault();if(event.key==='Escape'){tip.style.display='none';return;}
  active=event.key==='Home'?0:event.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,active+(event.key==='ArrowLeft'?-1:1)));
  show(points[active],x(points[active])/w*svgEl.getBoundingClientRect().width);
  svgEl.setAttribute('aria-label',s.name+', '+fullTime(points[active].time)+', average '+value(points[active].speed)+' knots, gust '+value(points[active].gust)+' knots, from '+(points[active].direction||'unavailable')+'. Use left and right arrows to inspect readings.');
 };
}
`;
