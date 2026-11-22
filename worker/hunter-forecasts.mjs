// Supplied by Seabreeze's public widget builder, verified 22 November 2026.
// https://www.seabreeze.com.au/Help/Weather/Can-I-put-your-weather-on-my-website
// Only the official iframe is embedded. Its forecast data/images are not read,
// copied, proxied or redrawn by Hunter Wind.
export const SEABREEZE_FORECASTS=[
 {id:'newcastle',name:'Newcastle',location:'newc'},
 {id:'norah',name:'Norah Head',location:'nora'}
];

export const FORECAST_HTML=String.raw`
<section class="forecast-section" id="forecasts" aria-label="Wind and wave forecasts">
<details class="card" id="forecast-details"><summary><h2>Wind &amp; wave forecasts</h2><span>Seabreeze · Newcastle &amp; Norah Head</span></summary>
<div class="forecast-body">
<div class="forecast-toolbar"><div class="forecast-buttons" role="group" aria-label="Forecast location"><button type="button" data-forecast="newcastle" aria-pressed="true">Newcastle</button><button type="button" data-forecast="norah" aria-pressed="false">Norah Head</button></div><div class="forecast-buttons" role="group" aria-label="Forecast period"><button type="button" data-forecast-days="3" aria-pressed="true">3 days</button><button type="button" data-forecast-days="7" aria-pressed="false">7 days</button></div></div>
<p class="forecast-current" id="forecast-current" aria-live="polite">Newcastle · 3-day forecast</p>
<div class="forecast-stage" id="forecast-stage">
<!-- Official Seabreeze weather widget. Loaded when the forecast panel opens. -->
<iframe id="forecast-frame" title="Seabreeze wind and wave forecast for Newcastle" width="540" height="510" loading="lazy" scrolling="no" referrerpolicy="no-referrer-when-downgrade" style="border:0;max-width:100%;overflow:hidden"></iframe>
</div>
<div class="forecast-footer"><p>Forecast graphs supplied by Seabreeze, using Seabreeze’s colour scale.</p><div><button class="button secondary" id="forecast-reload" type="button">Refresh forecast</button><a class="button secondary" id="forecast-source" href="https://www.seabreeze.com.au/weather/shared/panel?panel=graph&amp;loc=newc&amp;size=m&amp;rev=0" target="_blank" rel="noopener noreferrer">Open forecast</a></div></div>
</div></details></section>
`;

export const FORECAST_CSS=String.raw`
.forecast-section{margin:24px 0 28px;scroll-margin-top:18px}.forecast-section summary{padding:20px 24px;cursor:pointer;font-size:18px;font-weight:650}.forecast-section summary h2{display:inline;font:inherit;margin:0}.forecast-section summary>span{display:block;font-size:13px;color:var(--muted);font-weight:400;margin:5px 0 0 19px}.forecast-body{padding:0 24px 20px}.forecast-toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.forecast-buttons{display:flex;gap:5px;padding:4px;background:#eef4f2;border-radius:10px}.forecast-buttons button{font:inherit;font-size:14px;min-height:40px;padding:7px 13px;border:0;border-radius:7px;color:var(--muted);background:transparent}.forecast-buttons button[aria-pressed="true"]{background:var(--ink);color:#fff}.forecast-current{font-size:14px;font-weight:600;margin:16px 0 8px}.forecast-stage{width:100%;max-width:540px;aspect-ratio:540/510;margin:0 auto;background:#fff}.forecast-stage iframe{display:block;width:100%;height:100%}.forecast-footer{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:12px}.forecast-footer p{font-size:12px;color:var(--muted);margin:0}.forecast-footer>div{display:flex;gap:8px;flex-wrap:wrap}.forecast-footer .button{font-size:13px;min-height:40px;padding:8px 12px}
@media(max-width:760px){header{height:auto;min-height:66px;flex-wrap:wrap;padding:12px 18px;gap:8px}header nav{flex:1 0 100%;justify-content:space-between;min-height:26px;font-size:13px}.forecast-section summary{padding:17px}.forecast-body{padding:0 14px 17px}.forecast-buttons button{font-size:13px;padding:7px 10px}.forecast-toolbar{gap:8px}.forecast-footer>div{width:100%}.forecast-footer .button{flex:1;text-align:center}}
`;

export const FORECAST_SCRIPT='const SEABREEZE_FORECASTS='+JSON.stringify(SEABREEZE_FORECASTS)+';\n'+String.raw`
let forecastPlace='newcastle',forecastDays=3,forecastLoaded='';
function forecastWidgetUrl(place=forecastPlace,days=forecastDays){
 const item=SEABREEZE_FORECASTS.find(p=>p.id===place);
 return item?'https://www.seabreeze.com.au/weather/shared/panel?panel=graph&loc='+item.location+'&size='+(days===7?'l':'m')+'&rev=0':null;
}
function renderForecast(load=false){
 const item=SEABREEZE_FORECASTS.find(p=>p.id===forecastPlace),url=forecastWidgetUrl(),wide=forecastDays===7,width=wide?620:540,height=wide?350:510;
 $('forecast-current').textContent=item.name+' · '+forecastDays+'-day forecast';
 $('forecast-source').href=url;$('forecast-frame').title='Seabreeze '+forecastDays+'-day wind and wave forecast for '+item.name;
 $('forecast-frame').setAttribute('width',String(width));$('forecast-frame').setAttribute('height',String(height));
 $('forecast-stage').style.maxWidth=width+'px';$('forecast-stage').style.aspectRatio=width+'/'+height;
 document.querySelectorAll('[data-forecast]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.forecast===forecastPlace)));
 document.querySelectorAll('[data-forecast-days]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.forecastDays)===forecastDays)));
 if(load&&$('forecast-details').open&&forecastLoaded!==url){$('forecast-frame').src=url;forecastLoaded=url;}
}
function setForecastPlace(id){if(!SEABREEZE_FORECASTS.some(p=>p.id===id))return;forecastPlace=id;renderForecast(true);}
function setForecastDays(days){if(days!==3&&days!==7)return;forecastDays=days;renderForecast(true);}
function openForecasts(){$('forecast-details').open=true;renderForecast(true);$('forecasts').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
function setupForecasts(){
 renderForecast(false);
 document.querySelectorAll('[data-forecast]').forEach(b=>b.onclick=()=>setForecastPlace(b.dataset.forecast));
 document.querySelectorAll('[data-forecast-days]').forEach(b=>b.onclick=()=>setForecastDays(Number(b.dataset.forecastDays)));
 $('forecast-details').ontoggle=()=>{if($('forecast-details').open)renderForecast(true);};
 $('forecast-nav').onclick=()=>{$('forecast-details').open=true;renderForecast(true);};
 $('forecast-reload').onclick=()=>{forecastLoaded='';renderForecast(true);};
}
`;
