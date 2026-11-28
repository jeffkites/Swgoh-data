import assert from 'node:assert/strict';
import calculator from '@swgoh-utils/swgoh-stat-calc';
import {stats, setNames, slotNames} from '../../modding/model.mjs';

const value = n => typeof n === 'number' && Number.isFinite(n) ? n : null;
const project = values => Object.fromEntries(stats.map(s => [s.key, value(values?.[s.id])]));

export function readModStat(entry) {
  const raw = entry?.stat;
  const number = raw?.unscaledDecimalValue;
  return {id: raw?.unitStatId ?? null,
    value: number === null || number === undefined || number === '' ? null : value(Number(number) / 1e8)};
}

export function normalizeRoster(player, catalog, refreshedAt, collections, source) {
  assert.equal(String(player.allyCode), '843153117', 'Unexpected roster account');
  assert.ok(Array.isArray(player.rosterUnit) && player.rosterUnit.length, 'Empty roster');
  assert.ok(Number.isFinite(Date.parse(refreshedAt)), 'Missing roster timestamp');
  const game = collections.gameData;
  assert.ok(game?.unitData && game.modSetData && Array.isArray(collections.statMod), 'Incomplete stat definitions');
  calculator.setGameData(game);
  const modDefinitions = new Map(collections.statMod.map(row => [row.id, row]));
  const characters = [];
  const ids = new Set();
  for (const raw of player.rosterUnit) {
    const id = raw.definitionId?.split(':')[0];
    assert.match(id ?? '', /^[A-Za-z0-9_-]+$/, 'Invalid roster ID');
    if (catalog.units[id]?.combatType !== 1) continue;
    assert.ok(!ids.has(id), 'Duplicate roster character');
    ids.add(id);
    const mods = (raw.equippedStatMod ?? []).map(mod => {
      const def = modDefinitions.get(mod.definitionId);
      return {slot: def?.slot ?? null, setId: def?.setId ?? null, rarity: def?.rarity ?? null,
        level: mod.level ?? null, tier: mod.tier ?? null,
        primary: readModStat(mod.primaryStat), secondaries: (mod.secondaryStat ?? []).map(readModStat)};
    }).sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99));
    const sets = [...new Set(mods.map(m => m.setId).filter(Boolean))].map(setId => {
      const pieces = mods.filter(m => m.setId === setId);
      const required = game.modSetData[setId]?.count ?? null;
      return {id: setId, name: setNames[setId] ?? setId, pieces: pieces.length, required,
        complete: required ? Math.floor(pieces.length / required) : null,
        maxLevel: required ? Math.floor(pieces.filter(m => m.level === 15).length / required) : null};
    });
    let equipped = project(), withoutMods = project(), problem = null;
    const definition = game.unitData[id];
    const invalidMods = mods.length > 6 || new Set(mods.map(m => m.slot)).size !== mods.length ||
      mods.some(m => !slotNames[m.slot] || !game.modSetData[m.setId] ||
        !Number.isInteger(m.level) || m.level < 1 || m.level > 15 ||
        [m.primary, ...m.secondaries].some(s => s.id === null || s.value === null));
    const missingGear = (raw.equipment ?? []).some(g => !game.gearData[g.equipmentId]);
    const relicTier = raw.relic?.currentTier ?? 1;
    if (!definition?.gearLvl?.[raw.currentTier] || !definition?.growthModifiers?.[raw.currentRarity] ||
      (relicTier > 2 && !game.relicData[definition.relic?.[relicTier]]) || missingGear) {
      problem = 'Game definitions are incomplete for this character.';
    } else if (invalidMods) {
      problem = 'Equipped mod data is incomplete or unsupported.';
    } else {
      try {
        // The calculator mutates its argument; retain the original public roster unchanged.
        const current = structuredClone(raw), bare = structuredClone(raw);
        calculator.calcCharStats(current, {gameStyle: true});
        calculator.calcCharStats(bare, {gameStyle: true, withoutModCalc: true});
        equipped = project(current.stats?.final);
        withoutMods = project(bare.stats?.final);
        if (!(equipped.speed > 0 && withoutMods.speed > 0)) throw Error('Unknown speed');
      } catch {
        equipped = project(); withoutMods = project();
        problem = 'Stats could not be calculated from the saved character data.';
      }
    }
    const fromMods = Object.fromEntries(stats.map(s => [s.key,
      equipped[s.key] !== null && withoutMods[s.key] !== null
        ? Number((equipped[s.key] - withoutMods[s.key]).toFixed(10)) : null]));
    characters.push({id, name: catalog.units[id].name || id, stars: raw.currentRarity,
      level: raw.currentLevel, gear: raw.currentTier, relic: relicTier >= 2 ? relicTier - 2 : null,
      stats: {equipped, withoutMods, fromMods}, mods, sets, problem});
  }
  assert.ok(characters.length, 'No characters in roster');
  return {schemaVersion: 1, name: player.name, allyCode: '843153117', refreshedAt,
    source, characters: characters.sort((a, b) => a.id.localeCompare(b.id))};
}

export function validateRosterDatabase(data) {
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.allyCode, '843153117');
  assert.ok(data.characters.length > 0 && Number.isFinite(Date.parse(data.refreshedAt)));
  const ids = new Set();
  for (const unit of data.characters) {
    assert.ok(!ids.has(unit.id) && unit.name, 'Invalid or duplicate character');
    ids.add(unit.id);
    for (const section of ['equipped', 'withoutMods', 'fromMods']) {
      for (const {key} of stats) assert.ok(unit.stats[section][key] === null || Number.isFinite(unit.stats[section][key]), 'Invalid stat value');
    }
    for (const {key} of stats) {
      const final = unit.stats.equipped[key], bare = unit.stats.withoutMods[key], mods = unit.stats.fromMods[key];
      if (final !== null && bare !== null) assert.ok(Math.abs(final - bare - mods) < 1e-8, 'Stats do not reconcile');
    }
    // Public output deliberately omits instance IDs, gear inventory, raw player identifiers and credentials.
    assert.deepEqual(Object.keys(unit).sort(), ['id', 'name', 'stars', 'level', 'gear', 'relic', 'stats', 'mods', 'sets', 'problem'].sort());
  }
  return data;
}
