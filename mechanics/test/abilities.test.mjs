import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAbilities } from '../../scripts/mechanics/abilities.mjs';

// Synthetic identifiers and values exercise the source wire format.
function sample() {
  const target = {
    unitSelect: 2, battleSide: 3, healthState: 2, battleDeploymentState: 2,
    unitClass: [], forceAlignment: [], statValue: [], activeEffectTagCriteria: [],
    requiredActiveEffectTagCriteria: [], category: null, requiredCategory: null,
  };
  const effect = {
    id: 'hit', type: 1, applyType: 1, damageType: 3, chance: 90, maxBonusMoves: 0, param: ['ABILITY_POWER'],
    multiplierAmountDecimal: 13500, contextMultiplierDecimal: 5000, additiveAmountDecimal: '0', resultVarianceDecimal: 500,
    effectReference: [], infiniteCycleEffect: [], effectDefinition: [], summonEffect: [], contextIndex: [],
    triggerCondition: [], expirationCondition: [], descriptiveTag: [], effectedTag: [], target: [target],
  };
  const ref = { id: 'hit', contextIndex: [], maxBonusMove: 1 };
  return {
    enums: {
      EffectType: { DAMAGE: 1, MODIFY_STAT: 8 }, EffectDamageType: { ATTACK_DAMAGE: 2, ABILITY_POWER: 3 },
      EffectApplyType: { UNAVOIDABLE: 1 }, EffectTargetUnitSelect: { SELECTED_TARGET: 2 },
      EffectTargetBattleSide: { ENEMY_SIDE: 3 }, ConditionType: { START_OF_TURN: 25 },
    },
    effect: [effect, {
      ...effect, id: 'status', type: 8, param: ['COUNTER_ATTACK_RATING'], persistentLocKey: 'statusKey',
      descriptiveTag: [{ tag: 'buff', exclude: false }], effectReference: [ref],
    }],
    ability: [{
      id: 'ability', nameKey: 'nameKey', cooldownType: 1, cooldown: 4, abilityType: 8,
      triggerCondition: [{ conditionType: 25, conditionValue: '', priority: 2 }],
      tier: [{ effectReference: [ref, { ...ref, contextIndex: [0] }], cooldownMaxOverride: 3, interactsWithTag: [] }],
      effectReference: [{ ...ref, id: 'status' }], descriptiveTag: [], interactsWithTag: [], ultimateChargeRequired: [],
      allyTargetingRuleId: 'target',
    }],
    battleTargetingRule: [{ ...target, id: 'target' }], table: [],
    skill: [{
      id: 'skill', abilityReference: 'ability', skillType: 1, isZeta: true, omicronMode: 8,
      tier: [{ requiredUnitLevel: 80, isZetaTier: true, isOmicronTier: false }],
    }],
    units: [{ leaderAbilityRef: { abilityId: 'ability' } }],
    'Loc_ENG_US.txt': { nameKey: 'Sample', statusKey: '[c][ffff33]Sample Buff:[-][/c] Example text intentionally omitted.' },
  };
}

test('base and upgrade levels preserve cooldown, cost tier, order and context', () => {
  const { abilities, skills } = buildAbilities(sample()).datasets;
  assert.deepEqual(abilities.ability.roles, ['leader']);
  assert.equal(abilities.ability.triggerConditions[0].type, 'START_OF_TURN');
  assert.equal(abilities.ability.levels[0].cooldown, 4);
  assert.equal(abilities.ability.levels[1].cooldown, 3);
  assert.deepEqual(abilities.ability.levels[1].effects.map(e => [e.id, e.contextIndex]), [['hit', []], ['hit', [0]]]);
  assert.equal(skills.skill.abilityId, 'ability');
  assert.deepEqual(skills.skill.levels[0], { level: 1 });
  assert.equal(skills.skill.levels[1].level, 2);
  assert.equal(skills.skill.levels[1].isZetaTier, true);
  const changed = sample();
  changed.ability[0].tier[0].cooldownMaxOverride = 0;
  const tier = buildAbilities(changed).datasets.abilities.ability.levels[1];
  assert.equal(tier.cooldownMaxOverride, 0);
  assert.equal(tier.cooldown, null);
  changed.ability[0].tier[0].cooldownMaxOverride = -1;
  const unsupported = buildAbilities(changed).datasets.abilities.ability.levels[1];
  assert.equal(unsupported.cooldownMaxOverride, -1);
  assert.equal(unsupported.cooldown, null);
});

test('damage uses damageType independently from applyType and preserves raw context operands', () => {
  const { effects, statusEffects } = buildAbilities(sample()).datasets;
  assert.equal(effects.hit.applyType, 'UNAVOIDABLE');
  assert.equal(effects.hit.damageClass, 'special');
  assert.deepEqual(effects.hit.damageCoefficients, { multiplier: 1.35, contextMultiplier: 0.5, variance: 0.05 });
  assert.equal(effects.hit.contextMultiplierDecimal, 5000);
  assert.equal(effects.status.damageClass, null);
  assert.deepEqual(effects.status.mechanics, ['buff', 'stat_change', 'counterattack_rating']);
  assert.deepEqual(statusEffects.statusKey, { id: 'statusKey', name: 'Sample Buff', classifications: ['buff'], effectIds: ['status'] });
  assert.equal(effects.hit.targeting[0].unitSelect, 'SELECTED_TARGET');
});

test('a new opcode stays retrievable without fabricated semantics; inline overrides survive', () => {
  const data = sample();
  data.effect[0].type = 900;
  data.effect[1].summonEffect = [{ ...data.effect[0], chance: 12 }];
  const { effects } = buildAbilities(data).datasets;
  assert.equal(effects.hit.operation, 900);
  assert.equal(effects.hit.damageClass, null);
  assert.equal(effects.hit.chance, 90);
  assert.equal(effects.status.summonEffects[0].chance, 12);
});

test('replacement tables retain tag order and repeated replacement targets', () => {
  const data = sample();
  data.effect[0].replaceTableId = 'replace';
  data.table = [{ id: 'replace', row: [{ key: 'one', value: 'status' }, { key: 'two', value: 'status' }] }];
  const { effectReplacements, effects } = buildAbilities(data).datasets;
  assert.equal(effects.hit.replaceTableId, 'replace');
  assert.deepEqual(effectReplacements.replace.rows, [{ tag: 'one', effectId: 'status' }, { tag: 'two', effectId: 'status' }]);
});

test('an unmarked status description and an excluded buff tag do not fabricate labels', () => {
  const data = sample();
  data.effect[1].descriptiveTag[0].exclude = true;
  data['Loc_ENG_US.txt'].statusKey = 'Unstructured text: arbitrary content';
  const { statusEffects } = buildAbilities(data).datasets;
  assert.equal(statusEffects.statusKey.name, null);
  assert.deepEqual(statusEffects.statusKey.classifications, []);
});

test('duplicate identities, broken edges and invalid numeric operands cannot publish', () => {
  for (const mutate of [
    data => data.skill.push(data.skill[0]),
    data => { data.skill[0].abilityReference = 'missing'; },
    data => { data.ability[0].allyTargetingRuleId = 'missing'; },
    data => { data.ability[0].tier[0].effectReference[0].id = 'missing'; },
    data => { data.effect[0].infiniteCycleEffect.push('missing'); },
    data => { data.effect[0].multiplierAmountDecimal = null; },
    data => { data.effect[0].replaceTableId = 'missing'; },
    data => {
      data.effect[0].replaceTableId = 'replace';
      data.table = [{ id: 'replace', row: [{ key: 'buff', value: 'missing' }] }];
    },
  ]) {
    const data = sample();
    mutate(data);
    assert.throws(() => buildAbilities(data));
  }
});
