import {SPOT_GUIDES,GUIDE_SOURCES} from './hunter-wind.mjs';

// This route can read and write this one review file only. No caller-supplied
// repository, path, URL or game-data resource is ever used.
export const REVIEW_STORE_URL='https://api.github.com/repos/jeffkites/swgoh-private-data/contents/data/wind-reviews.json';
const ID=/^[a-z0-9][a-z0-9-]{0,79}$/;
const REGIONS=['lake','nelson','central'];
class ReviewError extends Error{constructor(status,message){super(message);this.status=status;}}
function text(value,max=2000){if(value==null)return '';if(typeof value!=='string'||value.length>max)throw new ReviewError(400,'A review field is too long or invalid.');return value.trim();}
function sources(value=[]){
 if(!Array.isArray(value)||value.length>12)throw new ReviewError(400,'Invalid review sources.');
 return value.map(s=>{
  const url=text(s.url,1500);let parsed;
  try{parsed=new URL(url);}catch{throw new ReviewError(400,'Source links must be valid HTTPS URLs.');}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new ReviewError(400,'Source links must be valid HTTPS URLs.');
  return {title:text(s.title,200),author:text(s.author,160),url:parsed.href,date:text(s.date,80),kind:text(s.kind,120)};
 });
}
function requiredSources(id){
 const guide=SPOT_GUIDES.find(g=>g.id===id),source=guide&&GUIDE_SOURCES.find(s=>s.id===guide.sourceId);
 return source?[{title:source.title,author:source.via?source.author+' · '+source.via:source.author,url:source.url,date:source.date,kind:source.kind}]:[];
}
function mergeSources(id,refs){const map=new Map();for(const ref of [...sources(refs),...requiredSources(id)])map.set(ref.url,ref);return [...map.values()];}
export function validateReview(value,{publish=false}={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ReviewError(400,'Review details are required.');
 const name=text(value.name,180),region=text(value.region,20);
 if(!name||!REGIONS.includes(region))throw new ReviewError(400,'Enter a site name and select a region.');
 const coordinate=(v,min,max)=>{if(v==null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new ReviewError(400,'Choose a valid map position in the Hunter or Central Coast.');return Number(v.toFixed(6));};
 const lat=coordinate(value.lat,-34.5,-31.5),lon=coordinate(value.lon,150.5,153);
 if(publish&&(lat===null||lon===null))throw new ReviewError(400,'Choose the map location before publishing.');
 if(!Array.isArray(value.aliases??[])||(value.aliases??[]).length>20)throw new ReviewError(400,'Use up to 20 alternative site names.');
 const aliases=[...new Set((value.aliases??[]).map(a=>text(a,120)).filter(Boolean))];
 return {name,aliases,region,lat,lon,wind:text(value.wind,180),water:text(value.water,180),level:text(value.level,180),
  access:text(value.access,4000),hazards:text(value.hazards,4000),notes:text(value.notes,6000)};
}
export function normalizeStore(value){
 if(!value||value.version!==1||!Array.isArray(value.records)||value.records.length>120)throw new ReviewError(503,'Review storage has an unsupported format.');
 const ids=new Set();
 const records=value.records.map(r=>{
  if(!r||typeof r.id!=='string'||!ID.test(r.id)||ids.has(r.id))throw new ReviewError(503,'Review storage has an invalid site identity.');
  ids.add(r.id);
  return {id:r.id,sourceRefs:mergeSources(r.id,r.sourceRefs??[]),researchNotes:text(r.researchNotes,4000),
   draft:r.draft?validateReview(r.draft):null,published:r.published?validateReview(r.published,{publish:true}):null,
   savedAt:text(r.savedAt,80),publishedAt:text(r.publishedAt,80),reviewedBy:r.published?'Jeff':null};
 });
 return {version:1,records};
}
export function publicReviews(store){
 return {version:1,reviews:store.records.filter(r=>r.published).map(r=>({id:r.id,...r.published,
  sources:r.sourceRefs,reviewedBy:'Jeff',publishedAt:r.publishedAt}))};
}
function utf8Decode(value){return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
function utf8Encode(value){const bytes=new TextEncoder().encode(value);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
async function github(env,method,body){
 if(!env.PRIVATE_DATA_GITHUB_TOKEN)throw new ReviewError(503,'Review storage is not configured.');
 let response;
 try{response=await fetch(REVIEW_STORE_URL+(method==='GET'?'?ref=main':''),{
  method,redirect:'manual',signal:AbortSignal.timeout(10000),cache:'no-store',
  headers:{Authorization:'Bearer '+env.PRIVATE_DATA_GITHUB_TOKEN,Accept:'application/vnd.github+json',
   'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'HunterWind-owner-reviews'},
  ...(body?{body:JSON.stringify(body)}:{})
 });}catch{throw new ReviewError(502,'Review storage could not be reached. Your form has not been cleared.');}
 if(method==='GET'&&response.status===404){await response.body?.cancel();return null;}
 if(response.status===409||response.status===422){await response.body?.cancel();throw new ReviewError(409,'Another edit changed these reviews. Keep your unsaved text and reload the queue before saving.');}
 if(!response.ok){const status=response.status;await response.body?.cancel();throw new ReviewError(502,'Review storage is unavailable (HTTP '+status+').');}
 try{return await response.json();}catch{throw new ReviewError(502,'Review storage returned an unreadable response.');}
}
async function loadStore(env){
 const file=await github(env,'GET');
 if(!file)return {store:{version:1,records:[]},revision:null};
 if(file.encoding!=='base64'||typeof file.content!=='string'||file.content.length>1200000||typeof file.sha!=='string')throw new ReviewError(503,'Review storage has an unsupported format.');
 try{return {store:normalizeStore(JSON.parse(utf8Decode(file.content))),revision:file.sha};}
 catch(error){if(error instanceof ReviewError)throw error;throw new ReviewError(503,'Review storage could not be decoded.');}
}
export async function handleWindReviews(request,env,{allowedOrigin,matchesToken}){
 const url=new URL(request.url),owner=url.pathname==='/api/wind/reviews/manage',origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':owner?'no-store, private':'no-store',
  'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Methods':owner?'GET, POST, OPTIONS':'GET, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if((owner&&origin!==allowedOrigin)||(!owner&&origin&&origin!==allowedOrigin))return reply({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!['GET',...(owner?['POST']:[])].includes(request.method))return reply({error:'Method not allowed'},405);
 const authorization=request.headers.get('Authorization')||'';
 if(owner&&!matchesToken(authorization.startsWith('Bearer ')?authorization.slice(7):'',env.DASHBOARD_ACCESS_TOKEN))return reply({error:'Owner access key required'},401);
 try{
  let change;
  if(request.method==='POST'){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ReviewError(415,'Send review details as JSON.');
   const body=await request.text();if(body.length>40000)throw new ReviewError(413,'This review is too long.');
   try{change=JSON.parse(body);}catch{throw new ReviewError(400,'Review details could not be read.');}
   if(!change||typeof change.id!=='string'||!ID.test(change.id)||!['save-draft','publish','unpublish'].includes(change.action))throw new ReviewError(400,'Choose a valid site and review action.');
   if(change.action!=='unpublish')change.review=validateReview(change.review,{publish:change.action==='publish'});
  }
  const loaded=await loadStore(env);
  if(!owner)return reply(publicReviews(loaded.store));
  if(!change)return reply({revision:loaded.revision,...loaded.store});
  if(change.revision!==loaded.revision)throw new ReviewError(409,'Another edit changed these reviews. Keep your unsaved text and reload the queue before saving.');
  let record=loaded.store.records.find(r=>r.id===change.id);
  if(!record){if(loaded.store.records.length>=120)throw new ReviewError(400,'The review queue is full.');record={id:change.id,sourceRefs:requiredSources(change.id),researchNotes:'',draft:null,published:null,savedAt:'',publishedAt:'',reviewedBy:null};loaded.store.records.push(record);}
  const now=new Date().toISOString();
  if(change.action==='unpublish'){record.published=null;record.publishedAt='';record.reviewedBy=null;}
  else{record.draft=change.review;record.savedAt=now;if(change.action==='publish'){record.published={...change.review};record.publishedAt=now;record.reviewedBy='Jeff';}}
  const saved=await github(env,'PUT',{message:(change.action==='publish'?'Publish':change.action==='unpublish'?'Unpublish':'Save draft of')+' Hunter Wind site review: '+change.id,
   content:utf8Encode(JSON.stringify(loaded.store,null,2)+'\n'),branch:'main',...(loaded.revision?{sha:loaded.revision}:{})});
  return reply({ok:true,action:change.action,revision:saved.content?.sha??null,...loaded.store});
 }catch(error){return reply({error:error instanceof ReviewError?error.message:'Review storage is unavailable. Your form has not been cleared.'},error instanceof ReviewError?error.status:502);}
}
