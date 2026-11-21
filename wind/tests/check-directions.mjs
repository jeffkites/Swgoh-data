import assert from 'node:assert/strict';
import {COMPASS_POINTS,parseWindDirections,matchesSiteWind} from '../../worker/hunter-directions.mjs';

const cases=[
 ['N–SE',['N','NNE','NE','ENE','E','ESE','SE']],
 ['n to se',['N','NNE','NE','ENE','E','ESE','SE']],
 ['S–NE',['NE','ENE','E','ESE','SE','SSE','S']],
 ['W–NW',['W','WNW','NW']],
 ['S–SW',['S','SSW','SW']],
 ['SSW TO SE',['SE','SSE','S','SSW']],
 ['NNW–NNE',['N','NNE','NNW']],
 ['NE · S (parts only) · SE',['NE','SE','S']],
 ['N/SE',['N','SE']],
 ['N NNE NE ENE E ESE SE',['N','NNE','NE','ENE','E','ESE','SE']],
 ['SW–NE',['NE','SW']],
 ['SW–S–NE',['NE','ENE','E','ESE','SE','SSE','S','SSW','SW']],
 ['SW–W–NE',['N','NNE','NE','SW','WSW','W','WNW','NW','NNW']],
 ['N–SE (blog range)',['N','NNE','NE','ENE','E','ESE','SE']],
 ['Newcastle / Ham’s Beach',[]],
 ['Wind and launch not yet reviewed',[]],
 ['NE except E',[]],
 ['',[]], [null,[]]
];
for(const [input,points] of cases)assert.deepEqual(parseWindDirections(input).points,points,String(input));
assert.equal(COMPASS_POINTS.length,16);
assert.equal(parseWindDirections('SW–NE').ambiguous,true);
assert.equal(parseWindDirections('SW–S–NE').ambiguous,false);
assert.equal(parseWindDirections('SW–W–NE').ambiguous,false);
assert.equal(parseWindDirections('Unknown').unknown,true);
assert.equal(matchesSiteWind({wind:'N–SE'},'ENE'),true);
assert.equal(matchesSiteWind({wind:'S–NE'},'W'),false,'S–NE must not include the westerly arc');
assert.equal(matchesSiteWind({wind:'W–NW',ownerReview:{wind:'N–SE'}},'NE'),true,'Published local notes take priority');
assert.equal(matchesSiteWind({wind:'W–NW',ownerReview:{wind:'N–SE'}},'W'),false);
assert.equal(matchesSiteWind({wind:'W–NW',ownerReview:{wind:''}},'W'),false,'A cleared published direction must not revive the old range');
assert.equal(matchesSiteWind({wind:null},'NE'),false);
assert.equal(matchesSiteWind({wind:null},''),true,'Any direction retains unconfirmed sites');
console.log('Passed: 16 compass points, inclusive ranges, wraparound, lists, opposite-endpoint handling and published local-note priority.');
