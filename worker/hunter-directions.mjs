export const COMPASS_POINTS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

// Ranges follow the shorter arc. Opposite endpoints need an intermediate point
// to state which half of the compass is intended; otherwise match endpoints only.
export function parseWindDirections(value) {
 const text=String(value??'').toUpperCase().replace(/\([^)]*\)/g,' ');
 if(/\b(?:NOT|EXCEPT|AVOID|OFFSHORE|UNSUITABLE)\b/.test(text))return {points:[],ambiguous:false,unknown:true};
 const tokens=[...text.matchAll(/(?<![A-Z0-9'’])(?:NNE|ENE|ESE|SSE|SSW|WSW|WNW|NNW|NE|SE|SW|NW|N|E|S|W)(?![A-Z0-9'’])/g)];
 const points=new Set(tokens.map(token=>token[0]));let ambiguous=false;
 for(let i=1;i<tokens.length;i++){
  const previous=tokens[i-1],current=tokens[i],separator=text.slice(previous.index+previous[0].length,current.index).trim();
  if(!/^(?:[-–—−→]+|TO|THROUGH)$/.test(separator))continue;
  const start=COMPASS_POINTS.indexOf(previous[0]),end=COMPASS_POINTS.indexOf(current[0]),clockwise=(end-start+16)%16;
  if(clockwise===8){ambiguous=true;continue;}
  const step=clockwise<8?1:-1;
  for(let point=start;point!==end;point=(point+step+16)%16)points.add(COMPASS_POINTS[point]);
 }
 return {points:COMPASS_POINTS.filter(point=>points.has(point)),ambiguous,unknown:points.size===0};
}

export function matchesSiteWind(guide,direction) {
 if(!direction)return true;
 const wind=guide.ownerReview?guide.ownerReview.wind:guide.wind;
 return parseWindDirections(wind).points.includes(direction);
}

export const DIRECTION_FILTER_HTML='<label class="wind-direction-field" for="spot-wind">Wind from<select id="spot-wind" aria-describedby="spot-wind-help"><option value="">Any direction</option>'+COMPASS_POINTS.map(point=>'<option value="'+point+'">'+point+'</option>').join('')+'</select></label>';
export const DIRECTION_SCRIPT='const COMPASS_POINTS='+JSON.stringify(COMPASS_POINTS)+';\n'+parseWindDirections.toString()+'\n'+matchesSiteWind.toString();
