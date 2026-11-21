import assert from 'node:assert/strict';
import api from '../../worker/index.js';
import {REVIEW_STORE_URL,normalizeStore,publicReviews} from '../../worker/wind-reviews.mjs';

const origin='https://jeffkites.github.io',url='https://swgoh-data.mrfaberzen.workers.dev/api/wind/reviews';
const env={DASHBOARD_ACCESS_TOKEN:'owner-test-key',PRIVATE_DATA_GITHUB_TOKEN:'github-test-key'};
const initial={name:'Squids / Squid’s Ink',aliases:['Squids Ink'],region:'lake',lat:-33.0494,lon:151.6491,
 wind:'W–NW',water:'Flat water',level:'Local check needed',access:'Review the launch',hazards:'Razor clams',notes:'Unpublished private words'};
let document={version:1,records:[{id:'belmont-south-squids',sourceRefs:[],researchNotes:'PRIVATE RESEARCH',draft:initial,published:null,savedAt:'',publishedAt:''}]};
let revision='sha-1',calls=[],writes=0,upstreamError=null;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async (destination,options)=>{
 calls.push({destination,options});
 assert.ok(destination===REVIEW_STORE_URL||destination===REVIEW_STORE_URL+'?ref=main','Only the dedicated wind review file can be accessed');
 assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');
 assert.equal(options.headers.Authorization,'Bearer github-test-key');
 if(upstreamError)return new Response('SECRET UPSTREAM BODY',{status:upstreamError});
 if(options.method==='GET')return Response.json({sha:revision,encoding:'base64',content:Buffer.from(JSON.stringify(document)).toString('base64')});
 writes++;
 const body=JSON.parse(options.body);assert.equal(body.sha,revision);assert.equal(body.branch,'main');
 document=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));
 revision='sha-'+(writes+1);return Response.json({content:{sha:revision}});
};
function request({owner=false,method='GET',key='owner-test-key',body,siteOrigin=origin,query=''}={}){
 return api.fetch(new Request(url+(owner?'/manage':'')+query,{method,headers:{...(siteOrigin?{Origin:siteOrigin}:{}),...(owner&&key?{Authorization:'Bearer '+key}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
}
try{
 const publicResponse=await request();assert.equal(publicResponse.status,200);assert.match(publicResponse.headers.get('cache-control'),/no-store/);
 const projection=await publicResponse.text();assert.deepEqual(JSON.parse(projection),{version:1,reviews:[]});assert.ok(!projection.includes('PRIVATE'));assert.ok(!projection.includes('Unpublished'));
 calls=[];
 for(const key of ['', 'wrong-key'])assert.equal((await request({owner:true,key})).status,401);
 assert.equal((await request({owner:true,key:'',query:'?key=owner-test-key'})).status,401,'A URL key cannot authorize an owner request');
 assert.equal((await request({owner:true,siteOrigin:'https://other.example'})).status,403);
 assert.equal((await request({owner:true,siteOrigin:null})).status,403);
 assert.equal((await request({siteOrigin:'https://other.example'})).status,403);
 assert.equal((await request({method:'POST',body:{}})).status,405);
 assert.equal(calls.length,0,'Unauthorized callers never reach private storage');
 const preflight=await request({owner:true,method:'OPTIONS',key:''});assert.equal(preflight.status,204);assert.equal(calls.length,0);
 const queue=await(await request({owner:true})).json();assert.equal(queue.revision,'sha-1');assert.equal(queue.records[0].researchNotes,'PRIVATE RESEARCH');
 assert.equal(queue.records[0].sourceRefs[0].author,'Jordan Jensen','Baseline authorship must be retained');
 const perform=(action,review=initial,extra={})=>request({owner:true,method:'POST',body:{id:'belmont-south-squids',action,revision,review,...extra}});
 const edited={...initial,name:'Squids edited',notes:'Private revision two',sourceRefs:[{author:'FAKE',url:'https://fake.example'}],repository:'ignored',path:'data/inventory.json'};
 assert.equal((await perform('save-draft',edited)).status,200);
 assert.deepEqual((await(await request()).json()).reviews,[],'Saving a draft cannot publish it');
 assert.ok(!('sourceRefs' in document.records[0].draft));assert.equal(document.records[0].sourceRefs[0].author,'Jordan Jensen');
 assert.equal((await perform('publish',edited)).status,200);
 const published=(await(await request()).json()).reviews[0];assert.equal(published.notes,'Private revision two');assert.equal(published.reviewedBy,'Jeff');assert.equal(published.sources[0].author,'Jordan Jensen');assert.ok(published.publishedAt);
 assert.ok(!('draft' in published));assert.ok(!('researchNotes' in published));
 assert.equal((await perform('save-draft',{...edited,notes:'Unapproved third revision'})).status,200);
 assert.equal((await(await request()).json()).reviews[0].notes,'Private revision two','Later private edits must not replace approved text');
 const writeCount=writes;
 assert.equal((await perform('publish',edited,{revision:'stale-sha'})).status,409);assert.equal(writes,writeCount,'Stale edits must not overwrite another device');
 assert.equal((await perform('publish',{...initial,lat:null})).status,400);
 assert.equal((await perform('save-draft',initial,{id:'../../inventory'})).status,400);
 assert.equal((await perform('save-draft',initial,{id:undefined})).status,400);
 assert.equal((await perform('save-draft',{...initial,aliases:['a'.repeat(121)]})).status,400);
 assert.equal((await perform('save-draft',{...initial,lat:1})).status,400);
 assert.equal(writes,writeCount);
 assert.equal((await perform('unpublish')).status,200);assert.deepEqual((await(await request()).json()).reviews,[]);assert.equal(document.records[0].draft.notes,'Unapproved third revision');
 const forged=structuredClone(document);forged.records[0].sourceRefs=[{url:'https://www.escapeecoadventures.com.au/post/kitesurfing-in-newcastle',author:'Pretend author'}];
 assert.equal(normalizeStore(forged).records[0].sourceRefs[0].author,'Jordan Jensen');
 assert.throws(()=>normalizeStore({...document,records:[{...document.records[0],sourceRefs:[{url:'javascript:alert(1)'}]}]}));
 assert.deepEqual(publicReviews(normalizeStore(document)).reviews,[]);
 upstreamError=302;const error=await request({owner:true});assert.equal(error.status,502);
 const errorText=await error.text();assert.ok(!errorText.includes('SECRET'));assert.ok(!errorText.includes('github-test-key'));
 console.log('Passed: owner authentication and origin, private draft isolation, publish/unpublish lifecycle, immutable source credits, fixed storage path, validation, stale edit protection and safe upstream failures.');
}finally{globalThis.fetch=nativeFetch;}
