// Source collection relationships: https://github.com/swgoh-utils/swgoh-comlink/wiki/Game-Data
// Resolve symbolic names against enums from the same revision as these tables.
// An unrecognised numeric enum is returned as its code; it never gets a guessed label.
function enumDecoder(enums) {
  const lookup = Object.fromEntries(Object.entries(enums).map(([type, values]) => [
    type, new Map(Object.entries(values).map(([name, code]) => [code, name])),
  ]));
  return (type, code) => lookup[type]?.get(code) ?? code ?? null;
}

function keyed(rows, project) {
  if (!Array.isArray(rows)) throw new Error('Missing mechanics collection');
  const table = Object.create(null);
  for (const source of rows) {
    if (typeof source.id !== 'string' || !source.id || Object.hasOwn(table, source.id)) {
      throw new Error('Missing or duplicate mechanics row ID');
    }
    table[source.id] = project(source);
  }
  return table;
}

function tags(values) {
  return values.map(({ tag, exclude }) => ({ tag, exclude }));
}

function conditions(values, decode) {
  return values.map(({ conditionType, conditionValue, priority }) => ({
    type: decode('ConditionType', conditionType), value: conditionValue, priority,
  }));
}

function categoryPredicate(group) {
  if (!group) return null;
  return {
    exclude: group.exclude,
    categoryIds: group.categoryId,
    categories: group.category.map(({ categoryId, exclude }) => ({ categoryId, exclude })),
  };
}

function bound(value) {
  return value && { value: value.value, inclusive: value.inclusive };
}

function targetRule(raw, decode) {
  const row = {
    unitSelect: decode('EffectTargetUnitSelect', raw.unitSelect),
    battleSide: decode('EffectTargetBattleSide', raw.battleSide),
    healthState: decode('UnitHealthState', raw.healthState),
    deploymentState: decode('BattleDeploymentState', raw.battleDeploymentState),
  };
  if (raw.id) row.id = raw.id;
  if (raw.excludeSelf) row.excludeSelf = true;
  if (raw.excludeSelectedTarget) row.excludeSelectedTarget = true;
  if (raw.category) row.category = categoryPredicate(raw.category);
  if (raw.requiredCategory) row.requiredCategory = categoryPredicate(raw.requiredCategory);
  if (raw.activeEffectTagCriteria.length) row.activeEffectTags = tags(raw.activeEffectTagCriteria);
  if (raw.requiredActiveEffectTagCriteria.length) row.requiredActiveEffectTags = tags(raw.requiredActiveEffectTagCriteria);
  if (raw.unitClass.length) row.unitClasses = raw.unitClass.map(code => decode('UnitClass', code));
  if (raw.forceAlignment.length) row.alignments = raw.forceAlignment.map(code => decode('ForceAlignment', code));
  if (raw.statValue.length) {
    row.statRanges = raw.statValue.map(({ stat, battleStat, min, max }) => ({
      statCode: stat, battleStat: decode('BattleUnitStateStat', battleStat), min: bound(min), max: bound(max),
    }));
  }
  return row;
}

function assertReference(table, id, relation) {
  if (!Object.hasOwn(table, id)) throw new Error(`Unresolved ${relation} reference`);
  return id;
}

function effectRefs(references, effects) {
  // Repeated refs and their order matter: contextIndex addresses earlier effects.
  return references.map(({ id, contextIndex, maxBonusMove }) => ({
    id: assertReference(effects, id, 'effect'), contextIndex, maxBonusMove,
  }));
}

function mechanicFacets(operation, raw) {
  const facets = [];
  const marked = new Set(raw.descriptiveTag.filter(t => !t.exclude).map(t => t.tag));
  if (marked.has('buff') || marked.has('clearable_buff') || raw.param.includes('FORCE_BUFF')) facets.push('buff');
  if (marked.has('debuff') || marked.has('clearable_debuff') || raw.param.includes('FORCE_DEBUFF')) facets.push('debuff');
  if (operation === 'REVIVE_UNIT') facets.push('revive');
  if (operation === 'DESTROY') facets.push('instant_defeat');
  if (operation === 'MODIFY_STAT') facets.push('stat_change');
  if (raw.param.includes('COUNTER_ATTACK_RATING')) facets.push('counterattack_rating');
  if (raw.param.includes('NO_COUNTER_ATTACK')) facets.push('counterattack_prevention');
  if (operation === 'RECOVER' && raw.param.includes('SPEED_FILL')) facets.push('turn_meter_change');
  if (operation === 'QUERY_UNIT_VALUE' && raw.param.includes('SPEED_FILL')) facets.push('turn_meter_query');
  if (operation === 'BONUS_MOVE' && raw.target.some(t =>
    [...t.activeEffectTagCriteria, ...t.requiredActiveEffectTagCriteria].some(c => c.tag === 'no_assist' && c.exclude))) {
    facets.push('assist');
  }
  return facets;
}

const damageClasses = new Map([['ATTACK_DAMAGE', 'physical'], ['ABILITY_POWER', 'special'], ['UNMITIGABLE', 'unmitigable']]);

function coefficient(value) {
  if (!Number.isSafeInteger(value)) throw new Error('Invalid fixed-point damage coefficient');
  return value / 10000;
}

function effectRow(raw, decode, effects) {
  const operation = decode('EffectType', raw.type);
  const damageType = decode('EffectDamageType', raw.damageType);
  const row = {
    id: raw.id, operation, damageType, applyType: decode('EffectApplyType', raw.applyType),
    damageClass: operation === 'DAMAGE' ? damageClasses.get(damageType) ?? null : null,
    mechanics: mechanicFacets(operation, raw), targeting: raw.target.map(t => targetRule(t, decode)),
    chance: raw.chance, parameters: raw.param,
    multiplierAmountDecimal: raw.multiplierAmountDecimal, contextMultiplierDecimal: raw.contextMultiplierDecimal,
    additiveAmountDecimal: raw.additiveAmountDecimal, resultVarianceDecimal: raw.resultVarianceDecimal,
    effects: effectRefs(raw.effectReference, effects),
  };
  if (operation === 'DAMAGE') {
    // Confirmed by the 5000/10000 context values on the two Culling Blade level 8
    // damage branches and the corresponding 50%/100% localized tier description.
    // These are operands. Context, target and preceding effects determine their use.
    row.damageCoefficients = {
      multiplier: coefficient(raw.multiplierAmountDecimal),
      contextMultiplier: coefficient(raw.contextMultiplierDecimal),
      variance: coefficient(raw.resultVarianceDecimal),
    };
  }
  if (raw.contextIndex.length) row.contextIndex = raw.contextIndex;
  if (raw.maxBonusMoves !== 0) row.maxBonusMoves = raw.maxBonusMoves;
  if (raw.descriptiveTag.length) row.tags = tags(raw.descriptiveTag);
  if (raw.effectedTag.length) row.affectedTags = tags(raw.effectedTag);
  if (raw.triggerCondition.length) row.triggerConditions = conditions(raw.triggerCondition, decode);
  if (raw.expirationCondition.length) row.expirationConditions = conditions(raw.expirationCondition, decode);
  if (raw.triggerOnApplication) row.triggerOnApplication = true;
  if (raw.expireOnApplication) row.expireOnApplication = true;
  if (raw.blackboardName) row.blackboardName = raw.blackboardName;
  if (raw.blackboardCompareName) row.blackboardCompareName = raw.blackboardCompareName;
  if (raw.replaceTableId) row.replaceTableId = raw.replaceTableId;
  if (raw.applyEffectEnabled) row.applyEffectEnabled = true;
  if (raw.applyEffectLabel) row.applyEffectLabel = raw.applyEffectLabel;
  if (raw.persistentLocKey) row.statusNameKey = raw.persistentLocKey;
  if (raw.summonId) {
    row.summon = {
      unitId: raw.summonId, level: raw.summonLevel, tier: raw.summonTier, rarity: raw.summonRarity,
      squadIncrease: raw.summonSquadIncrease, count: raw.summonCount, eraLevel: raw.summonEraLevel,
      markerIndex: raw.summonMarkerIndex,
    };
  }
  // Inline definitions sometimes override a top-level effect bearing the very same ID.
  if (raw.summonEffect.length) row.summonEffects = raw.summonEffect.map(e => effectRow(e, decode, effects));
  if (raw.effectDefinition.length) row.inlineEffects = raw.effectDefinition.map(e => effectRow(e, decode, effects));
  if (raw.infiniteCycleEffect.length) row.cycleEffectIds = raw.infiniteCycleEffect.map(id => assertReference(effects, id, 'cycle effect'));
  return row;
}

function statusTable(effects, localization) {
  const statuses = Object.create(null);
  for (const effect of Object.values(effects)) {
    const id = effect.statusNameKey;
    if (!id) continue;
    if (!Object.hasOwn(statuses, id)) {
      // Only the initial marked-up heading is a status name. Some localization
      // entries are objectives, or prose without an explicit heading.
      const heading = localization[id]?.match(/^(?:\[c\])?\[[\da-f]{6}\]([^\[\]\r\n:]{1,80}):?\[-\]/i);
      statuses[id] = { id, name: heading?.[1].trim() || null, classifications: [], effectIds: [] };
    }
    const status = statuses[id];
    status.effectIds.push(effect.id);
    for (const facet of effect.mechanics) {
      if ((facet === 'buff' || facet === 'debuff') && !status.classifications.includes(facet)) status.classifications.push(facet);
    }
  }
  for (const status of Object.values(statuses)) {
    status.classifications.sort();
    status.effectIds.sort();
  }
  return statuses;
}

function replacementTables(source, effects) {
  const referenced = new Set();
  function collect(effect) {
    if (effect.replaceTableId) referenced.add(effect.replaceTableId);
    effect.summonEffects?.forEach(collect);
    effect.inlineEffects?.forEach(collect);
  }
  Object.values(effects).forEach(collect);
  const tables = keyed(source.filter(t => referenced.has(t.id)), t => ({
    id: t.id,
    rows: t.row.map(({ key, value }) => ({ tag: key, effectId: assertReference(effects, value, 'replacement effect') })),
  }));
  for (const id of referenced) assertReference(tables, id, 'replacement table');
  return tables;
}

function abilityRoles(units) {
  const roles = new Map();
  for (const unit of units) {
    for (const [field, role] of [
      ['basicAttackRef', 'basic'], ['limitBreakRef', 'special'],
      ['leaderAbilityRef', 'leader'], ['uniqueAbilityRef', 'unique'],
    ]) {
      const list = Array.isArray(unit[field]) ? unit[field] : [unit[field]];
      for (const ref of list) {
        if (!ref?.abilityId) continue;
        if (!roles.has(ref.abilityId)) roles.set(ref.abilityId, new Set());
        roles.get(ref.abilityId).add(role);
      }
    }
  }
  return roles;
}

function abilityLevel(tier, level, baseCooldown, effects) {
  const override = level === 1 ? null : tier.cooldownMaxOverride;
  if (!Number.isInteger(baseCooldown) || (level > 1 && !Number.isInteger(override))) {
    throw new Error('Missing or invalid ability cooldown');
  }
  // No positive-base ability in the verified snapshot has a zero override.
  // Preserve a future ambiguous zero explicitly without interpreting a sentinel.
  const selected = override ?? baseCooldown;
  const cooldown = selected < 0 || (override === 0 && baseCooldown > 0) ? null : selected;
  const row = { level, cooldown, cooldownMaxOverride: override, effects: effectRefs(tier.effectReference, effects) };
  if (tier.blockingEffectId) row.blockingEffectId = assertReference(effects, tier.blockingEffectId, 'blocking effect');
  if (tier.interactsWithTag.length) row.interactsWithTags = tags(tier.interactsWithTag);
  return row;
}

function skillRow(skill, abilities, decode) {
  return {
    id: skill.id, abilityId: assertReference(abilities, skill.abilityReference, 'skill ability'),
    skillType: decode('SkillType', skill.skillType), isZeta: skill.isZeta,
    omicronMode: decode('OmicronMode', skill.omicronMode),
    levels: [{ level: 1 }, ...skill.tier.map((tier, index) => ({
      level: index + 2, recipeId: tier.recipeId, requiredUnitLevel: tier.requiredUnitLevel,
      requiredUnitRarity: tier.requiredUnitRarity, requiredUnitTier: tier.requiredUnitTier,
      requiredUnitRelicTier: tier.requiredUnitRelicTier, isZetaTier: tier.isZetaTier, isOmicronTier: tier.isOmicronTier,
    }))],
  };
}

export function buildAbilities(collections) {
  const decode = enumDecoder(collections.enums);
  const rawEffects = keyed(collections.effect, source => source);
  const effects = keyed(collections.effect, source => effectRow(source, decode, rawEffects));
  const targetingRules = keyed(collections.battleTargetingRule, rule => targetRule(rule, decode));
  const roles = abilityRoles(collections.units);
  const localization = collections['Loc_ENG_US.txt'];
  const statusEffects = statusTable(effects, localization);
  const effectReplacements = replacementTables(collections.table, effects);
  const abilities = keyed(collections.ability, ability => ({
    id: ability.id, nameKey: ability.nameKey,
    name: /_DESC$/.test(ability.nameKey) ? null : localization[ability.nameKey]?.replace(/\[(?:\/?c|[\da-f]{6}|-)\]/gi, '').trim() || null,
    roles: [...(roles.get(ability.id) ?? [])].sort(), abilityType: decode('AbilityType', ability.abilityType),
    baseCooldown: ability.cooldown, cooldownType: decode('AbilityCooldownType', ability.cooldownType),
    triggerConditions: conditions(ability.triggerCondition, decode),
    tags: tags(ability.descriptiveTag), ultimateChargeRequired: ability.ultimateChargeRequired,
    allyTargetingRuleId: ability.allyTargetingRuleId ? assertReference(targetingRules, ability.allyTargetingRuleId, 'targeting rule') : null,
    levels: [
      abilityLevel(ability, 1, ability.cooldown, effects),
      ...ability.tier.map((tier, i) => abilityLevel(tier, i + 2, ability.cooldown, effects)),
    ],
  }));
  const skills = keyed(collections.skill, skill => skillRow(skill, abilities, decode));
  return { datasets: { skills, abilities, effects, targetingRules, statusEffects, effectReplacements } };
}
