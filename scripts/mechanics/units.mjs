import assert from 'node:assert/strict';

function enumDecoder(enums) {
  if (!enums) return (_type, code) => code ?? null;
  const lookup = Object.fromEntries(Object.entries(enums).map(([type, values]) => [
    type, new Map(Object.entries(values).map(([name, code]) => [code, name])),
  ]));
  return (type, code) => lookup[type]?.get(code) ?? code ?? null;
}

export function buildUnits(collections) {
  assert.ok(collections && Array.isArray(collections.units), 'Missing units collection');
  const decode = enumDecoder(collections.enums);
  const loc = collections['Loc_ENG_US.txt'] || {};

  // Group by baseId and select the highest rarity definition
  const byBaseId = new Map();
  for (const raw of collections.units) {
    if (!raw.baseId) continue;
    const existing = byBaseId.get(raw.baseId);
    if (!existing || (raw.rarity ?? 0) > (existing.rarity ?? 0)) {
      byBaseId.set(raw.baseId, raw);
    }
  }

  const units = [];
  for (const raw of byBaseId.values()) {
    const kind = raw.combatType === 2 ? 'ship' : 'character';
    const rawName = loc[raw.nameKey];
    const name = (typeof rawName === 'string' ? rawName.replace(/\[(?:\/?c|[\da-f]{6}|-)\]/gi, '').trim() : '') || raw.baseId;

    const directSkills = (raw.skillReference ?? []).map(s => s.skillId);
    const crewSkills = (raw.crew ?? []).flatMap(c => (c.skillReference ?? []).map(s => s.skillId));
    const skillIds = Array.from(new Set([...directSkills, ...crewSkills].filter(Boolean)));

    const unit = {
      id: raw.baseId,
      name,
      kind,
      skillIds,
      combatType: decode('CombatType', raw.combatType),
      forceAlignment: decode('ForceAlignment', raw.forceAlignment),
      unitClass: decode('UnitClass', raw.unitClass),
      categories: Array.isArray(raw.categoryId) ? raw.categoryId : [],
    };

    if (raw.primaryStat != null) {
      unit.primaryStat = decode('UnitStat', raw.primaryStat);
    }
    if (raw.crew?.length) {
      unit.crew = raw.crew.map(c => ({
        unitId: c.unitId,
        slot: c.slot,
      }));
    }
    if (raw.capitalUnlockKey) {
      unit.capitalUnlockKey = raw.capitalUnlockKey;
    }
    if (raw.legend) {
      unit.legend = true;
    }

    units.push(unit);
  }

  return { units, datasets: {} };
}
