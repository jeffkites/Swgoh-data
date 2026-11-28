import assert from 'node:assert/strict';
import test from 'node:test';
import {stats, openingOrder, selectCharacters, formatStat, rosterCsv} from '../model.mjs';
import {loadPublicFile} from '../app.mjs';
import {normalizeRoster, validateRosterDatabase} from '../../scripts/modding/normalize.mjs';

// Synthetic game definitions exercise the real calculator, including the separate
// equipped-gear speed that must not receive the speed-set percentage bonus.
function sample() {
  const scaled = n => n * 1e8;
  const data = {gameData: {
    unitData: {TEST: {combatType: 1, primaryStat: 2,
      gearLvl: {1: {gear: [], stats: {1: scaled(1000), 2: 0, 3: 0, 4: 0, 5: scaled(100), 17: 0, 28: scaled(500)}}},
      growthModifiers: {7: {2: 0, 3: 0, 4: 0}}}},
    gearData: {speedGear: {stats: {5: scaled(10)}}}, relicData: {}, crTables: {}, gpTables: {},
    modSetData: {4: {id: 57, count: 4, value: 5000000}},
  }, statMod: [2, 3, 4, 5].map(slot => ({id: '45' + (slot - 1), slot, setId: '4', rarity: 5}))};
  const mod = (slot, speed) => ({definitionId: '45' + (slot - 1), level: 15, tier: 5,
    primaryStat: {stat: {unitStatId: 5, unscaledDecimalValue: String(scaled(speed))}}, secondaryStat: []});
  const player = {allyCode: 843153117, name: 'Synthetic', rosterUnit: [{definitionId: 'TEST:SEVEN_STAR',
    currentRarity: 7, currentLevel: 85, currentTier: 1, equipment: [{equipmentId: 'speedGear'}],
    skill: [], relic: {currentTier: 1}, equippedStatMod: [mod(2, 5), mod(3, 30), mod(4, 5), mod(5, 5)]}]};
  const catalog = {units: {TEST: {name: 'Test', combatType: 1}}};
  return {data, player, catalog};
}
const build = ({data, player, catalog}) => normalizeRoster(player, catalog, '2026-11-27T01:45:24Z', data, {});

test('equipped speed includes gear, four-piece level-15 speed set and flat mods exactly once', () => {
  const input = sample(), original = structuredClone(input.player);
  const result = validateRosterDatabase(build(input));
  const u = result.characters[0];
  assert.equal(u.stats.withoutMods.speed, 110);
  assert.equal(u.stats.fromMods.speed, 55); // 45 flat + 10% of 100; not 10% of 110.
  assert.equal(u.stats.equipped.speed, 165);
  assert.deepEqual(input.player, original, 'Never add calculated values to the raw roster');
  assert.equal(u.sets[0].complete, 1);
  assert.equal(u.sets[0].maxLevel, 1);
  input.player.rosterUnit[0].equippedStatMod[0].level = 12;
  assert.equal(build(input).characters[0].stats.equipped.speed, 160, 'Underlevelled set earns the reduced bonus');
});

test('missing definitions or malformed mods are unknown, while an empty mod loadout is valid', () => {
  for (const change of [
    input => {delete input.data.gameData.unitData.TEST;},
    input => {input.player.rosterUnit[0].equippedStatMod[0].primaryStat.stat.unscaledDecimalValue = null;},
    input => {input.player.rosterUnit[0].equipment[0].equipmentId = 'missing';},
    input => {input.player.rosterUnit[0].equippedStatMod[1].definitionId = '451';},
  ]) {
    const input = sample(); change(input);
    const unit = build(input).characters[0];
    assert.equal(unit.stats.equipped.speed, null);
    assert.ok(unit.problem);
  }
  const input = sample(); input.player.rosterUnit[0].equippedStatMod = [];
  const unit = build(input).characters[0];
  assert.equal(unit.stats.equipped.speed, 110);
  assert.equal(unit.stats.fromMods.speed, 0);
  assert.equal(unit.problem, null);
  assert.equal(formatStat(null), 'Unknown');
  assert.equal(formatStat(0), '0');
});

test('wrong accounts and duplicate characters cannot generate a personal database', () => {
  const input = sample(); input.player.allyCode = 1; assert.throws(() => build(input));
  input.player.allyCode = 843153117; input.player.rosterUnit.push(input.player.rosterUnit[0]);
  assert.throws(() => build(input));
});

function character(id, speed) {
  return {id, name: id, relic: 5, stars: 7, level: 85, gear: 13, mods: [],
    stats: {equipped: Object.fromEntries(stats.map(s => [s.key, s.key === 'speed' ? speed : 0])),
      withoutMods: {speed: 100}, fromMods: {speed: speed === null ? null : speed - 100}}};
}
test('speed comparisons respond to planned speed, flat bonuses and starting TM; ties stay unresolved', () => {
  const a = character('A', 300), b = character('B', 200), c = character('C', null);
  assert.deepEqual(openingOrder([b, a, c]).map(r => r.unit.id), ['A', 'B', 'C']);
  assert.equal(openingOrder([a, b], {B: {tm: 50}})[0].unit.id, 'B');
  const tie = openingOrder([a, b], {B: {bonus: 100}});
  assert.ok(tie.every(r => r.tie && r.rank === 1));
  assert.equal(openingOrder([a, b], {B: {speed: 301}})[0].unit.id, 'B');
  for (const options of [{tm: 101}, {tm: -1}, {bonus: -300}, {speed: 0}, {speed: 'invalid'}]) {
    assert.equal(openingOrder([a], {A: options})[0].rank, null);
  }
  assert.equal(openingOrder([a], {A: {tm: 100}})[0].time, 0);
});

test('filters, sorting and CSV preserve unknown stats and percentage units', () => {
  const a = character('A', 300), b = character('B', null);
  a.stats.equipped.potency = .5;
  assert.deepEqual(selectCharacters([b, a]).map(u => u.id), ['A', 'B']);
  assert.equal(selectCharacters([a, b], {query: 'missing'}).length, 0);
  assert.equal(selectCharacters([a, b], {filter: 'unmodded'}).length, 2);
  const csv = rosterCsv([a, b]);
  assert.match(csv, /Potency \(%\)/);
  assert.match(csv, /"50"/);
  assert.ok(!csv.includes('null'));
  a.name = '=example'; assert.ok(rosterCsv([a]).includes("'=example"));
});

test('public data loading supports a project subpath and safe GitHub fallback without credentials', async () => {
  const expected = {characters: [{name: 'Éxample'}]};
  let calls = 0;
  const data = await loadPublicFile('modding.json', new URL('https://jeffkites.github.io/Swgoh-data/modding/'), async (url, options) => {
    assert.equal(options.credentials, 'omit');
    if (++calls === 1) return new Response('', {status: 403});
    assert.match(String(url), /raw\.githubusercontent\.com/);
    return Response.json(expected);
  });
  assert.deepEqual(data, expected);
  await loadPublicFile('modding.json', new URL('http://localhost:3000/site/modding/'), async url => {
    assert.equal(String(url), 'http://localhost:3000/site/data/modding.json'); return Response.json(expected);
  });
  await loadPublicFile('modding.json', new URL('https://jeffkites.github.io/Swgoh-data/modding/'), async () =>
    Response.json({encoding: 'base64', content: Buffer.from(JSON.stringify(expected)).toString('base64')})).then(actual => assert.deepEqual(actual, expected));
});
