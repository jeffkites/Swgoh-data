// Static export of Hunter Wind version 5, source commit
// 6d7372ae947d2466f89866ff7ce48e33697c438a. No ChatGPT runtime is used.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import hunterWind from '../worker/hunter-wind.mjs';

export const DATA_URL='https://swgoh-data.mrfaberzen.workers.dev/api/wind';
export async function buildWind() {
  const response=await hunterWind.fetch(new Request('https://static-export.example/'));
  if(!response.ok)throw new Error('Could not export the wind page');
  let html=await response.text();
  const route="fetch('/api/wind',";
  if(html.split(route).length!==2)throw new Error('Expected exactly one wind refresh route');
  html=html.replace(route,"fetch('"+DATA_URL+"',")
    .replaceAll('href="/"','href="./"')
    .replaceAll('href="/leaflet.css"','href="./leaflet.css"')
    .replaceAll('src="/leaflet.js"','src="./leaflet.js"')
    .replaceAll('href="/favicon.svg"','href="./favicon.svg"');
  await writeFile(new URL('./index.html',import.meta.url),html);
  for(const path of ['leaflet.js','leaflet.css','favicon.svg']) {
    const asset=await hunterWind.fetch(new Request('https://static-export.example/'+path));
    if(!asset.ok)throw new Error('Could not export '+path);
    await writeFile(new URL('./'+path,import.meta.url),(await asset.text()).replace(/\r\n/g,'\n'));
  }
  console.log('Built Hunter Wind at /Swgoh-data/wind/ with live data from '+DATA_URL);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildWind();
