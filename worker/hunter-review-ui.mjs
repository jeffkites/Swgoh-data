export const REVIEW_UI_HTML=String.raw`
<section class="card review-desk" id="review-desk" aria-labelledby="review-desk-title">
<details id="review-desk-details"><summary id="review-desk-title">Owner review desk · edit drafts and publish</summary>
<div class="review-desk-content"><p>Read the researched sources, edit your local notes, then save a private draft or approve it for the public map. Original author credits stay attached.</p>
<form id="review-unlock" class="review-unlock"><label for="review-key">Owner access key <small>Use your existing SWGOH dashboard key.</small></label><input id="review-key" name="password" type="password" autocomplete="current-password" required><button class="button" type="submit">Unlock review desk</button></form>
<p id="review-owner-status" class="review-status" role="status" aria-live="polite"></p>
<div id="review-workspace" hidden>
<div class="review-owner-toolbar"><span id="review-queue-count"></span><div><button id="review-reload" class="button secondary" type="button">Reload queue</button><button id="review-lock" class="button secondary" type="button">Lock</button></div></div>
<label for="review-select">Site to review</label><select id="review-select"></select>
<div id="review-research" class="review-research"></div>
<form id="review-edit"><div class="review-fields">
<label>Site name<input id="review-name" maxlength="180" required></label>
<label>Alternative names<input id="review-aliases" placeholder="Separate names with commas" maxlength="2000"></label>
<label>Wind directions<input id="review-wind" placeholder="N–SE or W, NW · blank if unknown" maxlength="180" aria-describedby="review-wind-help"><small class="review-help" id="review-wind-help">Ranges include the points on the shorter arc. For opposite ends, add a middle point: SW–S–NE.</small><span id="review-wind-preview" class="review-help" role="status"></span></label>
<label>Water / riding<input id="review-water" maxlength="180"></label>
<label>Rider level<input id="review-level" maxlength="180"></label>
<label>Region<select id="review-region"><option value="lake">Lake Mac &amp; Newcastle</option><option value="nelson">Nelson Bay</option><option value="central">Central Coast</option></select></label>
<label class="review-wide">Access and launch notes<textarea id="review-access" rows="3" maxlength="4000"></textarea></label>
<label class="review-wide">Hazards<textarea id="review-hazards" rows="3" maxlength="4000" placeholder="One item per line"></textarea></label>
<label class="review-wide">Your review notes<textarea id="review-notes" rows="4" maxlength="6000"></textarea></label>
</div>
<details class="review-map-fields"><summary>Map position</summary><p>Choose the area on the site map, or enter coordinates. A location is required to publish a new site.</p><div class="review-fields"><label>Latitude<input id="review-lat" type="number" step="any" min="-34.5" max="-31.5"></label><label>Longitude<input id="review-lon" type="number" step="any" min="150.5" max="153"></label></div><button id="review-pick-location" class="button secondary" type="button">Pick position on site map</button></details>
<div class="review-save-actions"><button class="button secondary" id="review-save-draft" type="submit">Save private draft</button><button class="button" id="review-publish" type="button">Approve &amp; publish</button><button class="button secondary" id="review-unpublish" type="button">Remove my published notes</button></div>
<p class="review-help">Drafts are saved privately and are available on your other devices after signing in. Approve &amp; publish makes your notes visible to visitors.</p>
</form></div></div></details></section>
`;

export const REVIEW_UI_CSS=String.raw`
.spot-search{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin:0 2px 14px}.spot-search label{display:flex;flex-direction:column;gap:5px;flex:1 1 260px;font-weight:600;font-size:14px}.spot-search input,.spot-search select{font:inherit;font-weight:400;font-size:16px;background:#fff;border:1px solid var(--line);border-radius:9px;padding:10px 12px;min-width:0;width:100%}.spot-search .wind-direction-field{flex:0 1 160px}.spot-search select{min-height:44px;color:var(--ink)}.spot-filter-help{font-size:14px;color:var(--muted);margin:-4px 2px 12px}.spot-search .button{min-height:44px}.spot-search-status{font-size:14px;color:var(--muted);margin:5px 2px 14px;min-height:20px}.spot-shortcuts{display:flex;gap:8px;flex-wrap:wrap;margin:0 2px 14px}.spot-shortcuts button{font:inherit;font-size:14px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 12px;color:var(--teal);font-weight:600;min-height:42px}.review-desk-link{color:var(--teal);font-size:14px;font-weight:600;margin-left:auto}.review-desk{margin-top:26px;scroll-margin-top:20px}.review-desk>details>summary{padding:20px 24px;font-size:18px;font-weight:650;cursor:pointer}.review-desk-content{padding:0 24px 24px;font-size:16px}.review-unlock{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:16px;background:#eef5f3;border-radius:12px}.review-unlock label{flex:1 1 220px}.review-unlock small{display:block;font-size:14px;font-weight:400;color:var(--muted);margin-top:4px}.review-unlock input{flex:1 1 200px}.review-desk label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600}.review-desk input,.review-desk textarea,.review-desk select{font:inherit;font-size:16px;color:var(--ink);background:#fff;border:1px solid #c7d7d3;border-radius:8px;padding:10px 12px;min-width:0;width:100%}.review-desk textarea{resize:vertical}.review-desk input:focus-visible,.review-desk textarea:focus-visible,.review-desk select:focus-visible{outline:3px solid #e0b44f;outline-offset:2px}.review-status{white-space:pre-wrap;font-size:14px;min-height:21px;color:var(--muted)}.review-owner-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0;font-size:14px}.review-owner-toolbar>div{display:flex;gap:8px;flex-wrap:wrap}.review-research{margin:16px 0;padding:16px 18px;border:1px solid var(--line);background:#f3f7f5;border-radius:12px;font-size:14px;overflow-wrap:anywhere}.review-research h3{margin:0 0 8px;font-size:16px}.review-research ul{padding-left:20px;margin:8px 0}.review-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}.review-wide{grid-column:1/-1}.review-map-fields{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-top:16px;font-size:14px}.review-map-fields summary{cursor:pointer;font-weight:600}.review-map-fields .button{margin-top:14px}.review-save-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.review-help{font-size:14px;color:var(--muted)}.owner-review-block{padding:18px;border:1px solid #b7d8ce;background:#eff8f4;border-radius:12px;margin:18px 0}.owner-review-block h3{margin-top:0;font-size:18px}.owner-review-block p{white-space:pre-wrap;margin:10px 0}.review-reference-list{font-size:14px;line-height:1.65;overflow-wrap:anywhere}.reviewed-label{font-size:13px;color:var(--teal);font-weight:600}.nomination-label{font-size:13px;color:#8d622a;font-weight:600}.review-location-status{font-size:14px;color:var(--teal);padding:0 18px;white-space:pre-wrap}.spot-area-label{display:block;font-size:13px;color:var(--muted);font-weight:400;margin-top:5px}@media(max-width:760px){.review-desk>details>summary{padding:17px}.review-desk-content{padding:0 17px 20px}.review-fields{grid-template-columns:1fr}.review-wide{grid-column:auto}.review-unlock{padding:13px}.review-save-actions .button{flex:1 1 150px}.spot-search{align-items:stretch}.spot-search label{flex-basis:100%}.spot-search .wind-direction-field{flex:1 1 140px}.review-desk-link{margin-left:0;width:100%}}
`;

export const REVIEW_UI_SCRIPT=String.raw`
const REVIEW_API='/api/wind/reviews';
const originalGuides=JSON.parse(JSON.stringify(BOOT.spotGuides));
const originalLocations=JSON.parse(JSON.stringify(BOOT.spotLocations));
const originalSources=JSON.parse(JSON.stringify(BOOT.guideSources));
let reviewQuery='',windDirection='',ownerStore=null,ownerRevision=null,ownerKey='',ownerEpoch=0,ownerRequestedId='belmont-south-squids',ownerPick=false,ownerDraftPin=null,publishedLoad=0;
const editorFields=['name','aliases','wind','water','level','region','access','hazards','notes','lat','lon'];
function foldSearch(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function matchesReviewQuery(g){const terms=foldSearch(reviewQuery).split(/\s+/).filter(Boolean),haystack=foldSearch([g.name,...(g.aliases||[]),g.mapsQuery||'',guideAuthor(g)].join(' '));return terms.every(term=>haystack.includes(term));}
function reviewRegion(id){return spotLocations.find(p=>p.guideId===id)?.region||'lake';}
function ownerReviewBlock(g){
 const r=g.ownerReview;if(!r)return '';
 let html='<section class="owner-review-block"><h3>Jeff’s reviewed site notes</h3><p class="reviewed-label">Approved '+esc(fullTime(r.publishedAt))+'</p>';
 for(const [key,label] of [['wind','Wind directions'],['water','Water / riding'],['level','Rider level'],['access','Access and launch'],['hazards','Hazards'],['notes','Local review']])if(r[key])html+='<p><strong>'+label+'</strong><br>'+esc(r[key])+'</p>';
 return html+'</section>';
}
function referenceList(refs){return (refs||[]).map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title||s.url)+'</a> · '+esc(s.author||'Author not stated')+(s.date?' · '+esc(s.date):'')+(s.kind?'<br><small>'+esc(s.kind)+'</small>':'')+'</li>').join('');}
function reviewSourcesBlock(g){const refs=g.ownerReview?.sources||g.references||[];return refs.length?'<h3>Credited research sources</h3><ul class="review-reference-list">'+referenceList(refs)+'</ul>':'';}
function openOwnerReview(id){ownerRequestedId=id||ownerRequestedId;$('review-desk-details').open=true;$('review-desk').scrollIntoView({behavior:'smooth',block:'start'});if(ownerStore){renderOwnerSelect(ownerRequestedId);fillOwnerForm();}else $('review-key').focus();}
function baseOwnerReview(id){
 const g=spotGuides.find(g=>g.id===id),p=spotLocations.find(p=>p.guideId===id),r=g?.ownerReview;
 return {name:r?.name||g?.name||'',aliases:r?.aliases||g?.aliases||[],region:r?.region||p?.region||region,
  lat:r?.lat??p?.lat??null,lon:r?.lon??p?.lon??null,wind:r?.wind??g?.wind??'',water:r?.water??g?.water??'',
  level:r?.level??g?.level??'',access:r?.access??g?.access??'',hazards:r?.hazards??(g?.hazards||[]).join('\n'),notes:r?.notes||''};
}
function showWindDirectionPreview(){const parsed=parseWindDirections($('review-wind').value);$('review-wind-preview').textContent=(parsed.points.length?'Search matches: '+parsed.points.join(', ')+'.':'No confirmed directions to match yet.')+(parsed.ambiguous?' Opposite endpoints match only those endpoints. Add a middle point to include the range.':'');}
function ownerRecord(id){return ownerStore?.records.find(r=>r.id===id);}
function renderOwnerSelect(requested){
 if(!ownerStore)return;
 const choices=new Map(spotGuides.map(g=>[g.id,{id:g.id,name:g.name}]));
 for(const r of ownerStore.records)choices.set(r.id,{id:r.id,name:r.draft?.name||r.published?.name||r.id});
 $('review-select').innerHTML=[...choices.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>{const r=ownerRecord(c.id),status=r?.published?'Published':r?.draft?'Draft':'Source guide';return '<option value="'+esc(c.id)+'">'+esc(status+' · '+c.name)+'</option>';}).join('')+'<option value="__new">Add a new site…</option>';
 $('review-select').value=choices.has(requested)?requested:[...choices.keys()][0];
 const pending=ownerStore.records.filter(r=>r.draft&&(!r.published||r.savedAt>r.publishedAt)).length;
 $('review-queue-count').textContent=pending+' drafts awaiting review · '+ownerStore.records.filter(r=>r.published).length+' published local reviews';
}
function fillOwnerForm(){
 const id=$('review-select').value,record=ownerRecord(id),r=record?.draft||record?.published||baseOwnerReview(id==='__new'?'':id);
 for(const field of editorFields){const value=r[field];$('review-'+field).value=field==='aliases'?(value||[]).join(', '):value??'';}
 showWindDirectionPreview();
 $('review-unpublish').hidden=!record?.published;
 $('review-research').innerHTML='<h3>Research to review</h3><p>'+esc(record?.researchNotes||'Compare the credited source guide with your local experience before approving your notes.')+'</p><ul>'+referenceList(record?.sourceRefs||(()=>{const g=spotGuides.find(g=>g.id===id),s=g&&guideSource(g);return s?[{title:s.title,author:s.author,url:s.url,date:s.date,kind:s.kind}]:[];})())+'</ul>';
}
function readOwnerForm(){
 const value={};for(const field of editorFields){const raw=$('review-'+field).value.trim();value[field]=field==='aliases'?raw.split(',').map(x=>x.trim()).filter(Boolean):field==='lat'||field==='lon'?(raw===''?null:Number(raw)):raw;}
 return value;
}
function ownerMessage(message){$('review-owner-status').textContent=message;}
function setOwnerBusy(busy){for(const id of ['review-save-draft','review-publish','review-unpublish','review-reload','review-select','review-pick-location',...editorFields.map(f=>'review-'+f)])$(id).disabled=busy;$('review-pick-location').disabled=busy||!siteMap;}
async function ownerRequest(method,body){
 const response=await fetch(REVIEW_API+'/manage',{method,cache:'no-store',signal:AbortSignal.timeout(25000),
  headers:{Authorization:'Bearer '+ownerKey,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let result;try{result=await response.json();}catch{throw new Error('The review desk returned an unreadable response. Your form has not been cleared.');}
 if(!response.ok)throw new Error(result.error||'The review request failed. Your form has not been cleared.');
 return result;
}
async function loadOwnerQueue(){
 const epoch=ownerEpoch;ownerMessage('Loading your private review queue…');setOwnerBusy(true);
 try{const result=await ownerRequest('GET');if(epoch!==ownerEpoch)return;if(!Array.isArray(result.records))throw new Error('The review queue is unavailable.');ownerStore=result;ownerRevision=result.revision;
  $('review-workspace').hidden=false;$('review-unlock').hidden=true;renderOwnerSelect(ownerRequestedId);fillOwnerForm();ownerMessage('Choose a researched draft or an existing site. Save draft keeps it private; approve & publish makes it public.');
 }catch(error){if(epoch===ownerEpoch)ownerMessage(error.message||'The review queue could not load.');}finally{if(epoch===ownerEpoch)setOwnerBusy(false);}
}
async function saveOwnerReview(action){
 if(!ownerStore||!ownerKey)return;
 const review=readOwnerForm();let id=$('review-select').value;
 if(id==='__new')id=foldSearch(review.name).replace(/\s+/g,'-').slice(0,80);
 if(!id||!review.name){ownerMessage('Enter a site name first.');return;}
 const epoch=ownerEpoch;setOwnerBusy(true);ownerMessage(action==='publish'?'Publishing your approved notes…':action==='unpublish'?'Removing your published notes…':'Saving a private draft…');
 try{const result=await ownerRequest('POST',{id,action,review,revision:ownerRevision});if(epoch!==ownerEpoch)return;
  ownerStore=result;ownerRevision=result.revision;ownerRequestedId=id;renderOwnerSelect(id);fillOwnerForm();
  if(action==='save-draft')ownerMessage('Private draft saved. It is not visible to visitors.');
  else{const updated=await loadPublishedReviews();if(epoch!==ownerEpoch)return;ownerMessage((action==='publish'?'Approved and published.':'Your published notes were removed.')+(updated?' The public map is up to date.':' The public map could not reload yet; refresh it to check your saved changes.'));}
 }catch(error){if(epoch===ownerEpoch)ownerMessage(error.message||'The review could not save. Your form has not been cleared.');}finally{if(epoch===ownerEpoch)setOwnerBusy(false);}
}
function applyPublishedReviews(reviews){
 spotGuides.splice(0,spotGuides.length,...JSON.parse(JSON.stringify(originalGuides)));
 spotLocations.splice(0,spotLocations.length,...JSON.parse(JSON.stringify(originalLocations)));
 guideSources.splice(0,guideSources.length,...JSON.parse(JSON.stringify(originalSources)));
 for(const r of reviews){
  if(!r||typeof r.id!=='string'||typeof r.name!=='string'||!mapRegions.some(area=>area.id===r.region)||!Number.isFinite(r.lat)||!Number.isFinite(r.lon))continue;
  let g=spotGuides.find(g=>g.id===r.id),place=spotLocations.find(p=>p.guideId===r.id);
  if(!g){g={id:r.id,name:r.name,sourceId:'jeff-reviewed',externalReview:true,ownerOnly:true,wind:null,water:null,level:null,summary:'',access:null,hazards:[],mapsQuery:r.name+' NSW',stationIds:[mapRegions.find(a=>a.id===r.region).stationIds[0]]};spotGuides.push(g);
   if(!guideSources.some(s=>s.id==='jeff-reviewed'))guideSources.push({id:'jeff-reviewed',author:'Jeff',publisher:'Hunter Wind',title:'Local site review',url:'https://jeffkites.github.io/wind/#spots',date:'',kind:'Owner-reviewed local notes'});}
  g.ownerReview=r;g.name=r.name;g.aliases=r.aliases||[];
  if(!place){place={guideId:r.id};spotLocations.push(place);}
  Object.assign(place,{name:r.name,region:r.region,lat:r.lat,lon:r.lon});
 }
 renderSpotCards();renderSpotMap(false);
}
async function loadPublishedReviews(){
 const request=++publishedLoad;
 try{const response=await fetch(REVIEW_API,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Review feed unavailable');const result=await response.json();if(!Array.isArray(result.reviews))throw new Error('Invalid review feed');if(request!==publishedLoad)return false;applyPublishedReviews(result.reviews);$('review-feed-status').textContent='';return true;}
 catch{if(request===publishedLoad)$('review-feed-status').textContent='Local review updates are temporarily unavailable. Credited source guides are still shown.';return false;}
}
function setupReviewDesk(){
 $('spot-search').oninput=()=>{reviewQuery=$('spot-search').value;guideFilter='all';renderSpotCards();renderSpotMap(true);};
 $('spot-wind').onchange=()=>{windDirection=$('spot-wind').value;renderSpotCards();renderSpotMap(true);};
 $('spot-search-clear').onclick=()=>{reviewQuery='';windDirection='';guideFilter='all';$('spot-search').value='';$('spot-wind').value='';renderSpotCards();renderSpotMap(true);};
 $('review-wind').oninput=showWindDirectionPreview;
 document.querySelectorAll('[data-quick-spot]').forEach(b=>b.onclick=()=>{reviewQuery='';windDirection='';$('spot-search').value='';$('spot-wind').value='';guideFilter='all';openSpotGuide(b.dataset.quickSpot,b);});
 document.querySelectorAll('a[href="#review-desk"]').forEach(a=>a.onclick=event=>{event.preventDefault();openOwnerReview();});
 $('review-unlock').onsubmit=event=>{event.preventDefault();ownerEpoch++;ownerKey=$('review-key').value;loadOwnerQueue();};
 $('review-select').onchange=()=>{ownerRequestedId=$('review-select').value;fillOwnerForm();};
 $('review-edit').onsubmit=event=>{event.preventDefault();saveOwnerReview('save-draft');};
 $('review-publish').onclick=()=>saveOwnerReview('publish');$('review-unpublish').onclick=()=>saveOwnerReview('unpublish');
 $('review-reload').onclick=()=>{ownerRequestedId=$('review-select').value;loadOwnerQueue();};
 $('review-lock').onclick=()=>{ownerEpoch++;ownerKey='';ownerStore=null;ownerRevision=null;ownerPick=false;$('review-key').value='';$('review-workspace').hidden=true;$('review-unlock').hidden=false;$('review-research').innerHTML='';$('review-select').innerHTML='';for(const field of editorFields)$('review-'+field).value='';ownerMessage('Review desk locked.');if(ownerDraftPin&&siteMap){siteMap.removeLayer(ownerDraftPin);ownerDraftPin=null;}};
 $('review-pick-location').onclick=()=>{if(!ownerStore)return;setRegion($('review-region').value);ownerPick=true;$('review-location-status').textContent='Click the site map to choose this draft’s position. It will not be public until you approve & publish.';$('spots').scrollIntoView({behavior:'smooth',block:'start'});};
 if(siteMap)siteMap.on('click',event=>{if(!ownerPick||!ownerStore)return;ownerPick=false;$('review-lat').value=event.latlng.lat.toFixed(6);$('review-lon').value=event.latlng.lng.toFixed(6);$('review-location-status').textContent='Draft position selected. Save the draft or approve & publish from the review desk.';if(ownerDraftPin)siteMap.removeLayer(ownerDraftPin);ownerDraftPin=L.marker([event.latlng.lat,event.latlng.lng],{icon:L.divIcon({className:'site-marker-holder',iconSize:[32,36],iconAnchor:[16,30],html:'<span class="site-pin"><span>+</span></span>'}),title:'Private draft position'}).addTo(siteMap);$('review-desk').scrollIntoView({behavior:'smooth',block:'start'});});
}
`;
