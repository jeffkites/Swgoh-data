import assert from 'node:assert/strict';

function table(rows, project) {
  assert.ok(Array.isArray(rows) && rows.length, 'Missing datacron collection');
  const result = Object.create(null);
  for (const row of rows) {
    assert.ok(row.id !== undefined && !Object.hasOwn(result, row.id), 'Invalid datacron ID');
    result[row.id] = project(row);
  }
  return result;
}

export function buildDatacrons(c) {
  const datacronSets = table(c.datacronSet, row => ({
    id: row.id, name: c['Loc_ENG_US.txt'][row.displayName] ?? null,
    expirationTimeMs: row.expirationTimeMs,
    tiers: row.tier.map(({id, scopeIdentifier}) => ({id, scopeIdentifier})),
    focusedTiers: row.focusedTier.map(({id, scopeIdentifier}) => ({id, scopeIdentifier})),
  }));
  const datacronAffixes = table(c.datacronAffixTemplateSet, row => ({
    id: row.id,
    options: row.affix.map(affix => ({
      tags: affix.tag, abilityId: affix.abilityId || null, targetingRuleId: affix.targetRule || null,
      statType: affix.statType, statValueMin: affix.statValueMin, statValueMax: affix.statValueMax,
      minTier: affix.minTier, maxTier: affix.maxTier,
    })),
  }));
  const datacronTemplates = table(c.datacronTemplate, row => ({
    id: row.id, setId: row.setId, fixedTags: row.fixedTag, focused: row.focused,
    referenceTemplateId: row.referenceTemplateId || null,
    initialTiers: row.initialTiers, allowReroll: row.allowReroll, maxRerolls: row.maxRerolls,
    tiers: row.tier.map(tier => ({
      id: tier.id, requiredUnitTier: tier.requiredUnitTier, requiredRelicTier: tier.requiredRelicTier,
      scopeOverride: tier.overrideScopeIdentifier, affixSetIds: tier.affixTemplateSetId,
      initialAffixSetIds: tier.initialAffixTemplateSetIds,
    })),
  }));
  return { datacronSets, datacronTemplates, datacronAffixes };
}
