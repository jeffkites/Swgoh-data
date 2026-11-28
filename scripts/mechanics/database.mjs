import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { recordPath } from '../../mechanics/lookup.mjs';
import { digest, repository } from './source.mjs';

const locale = 'Loc_ENG_US.txt.json.br';
const statsSources = ['units.json.br', locale, 'enums.json', 'statProgression.json',
  'equipment.json', 'relicTierDefinition.json', 'table.json'];
const dependencies = {
  units: [...statsSources, 'skill.json', 'ability.json'],
  skills: ['skill.json', 'ability.json', 'enums.json'],
  abilities: ['ability.json', 'effect.json.br', 'units.json.br', 'battleTargetingRule.json', 'enums.json', locale],
  effects: ['effect.json.br', 'enums.json'], targetingRules: ['battleTargetingRule.json', 'enums.json'],
  statusEffects: ['effect.json.br', locale],
  datacronSets: ['datacronSet.json', locale], datacronTemplates: ['datacronTemplate.json', 'datacronSet.json', 'datacronAffixTemplateSet.json'],
  datacronAffixes: ['datacronAffixTemplateSet.json', 'ability.json', 'battleTargetingRule.json'],
};
const uncertain = new Set(['effects', 'abilities', 'statusEffects', 'datacronAffixes']);
const privateKeys = /^(allyCode|playerId|playerName|memberId|guildId|guildName|rosterUnit|roster|inventory|password|sessionToken|accessToken|authorization|credential|credentials|refreshToken)$/i;
const unitName = /^[A-Za-z0-9_-]+$/;
const shardTarget = 96 * 1024;
const chunk = obj => JSON.stringify(obj) + '\n';

function validateFields(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    assert.ok(!privateKeys.test(key), 'Player or credential field in normalized data');
    validateFields(obj[key]);
  }
}

function requireRow(rows, id, relation) {
  assert.ok(rows && Object.hasOwn(rows, id), 'Unresolved ' + relation + ': ' + id);
}

export function validateModel(units, datasets) {
  assert.ok(units.some(u => u.kind === 'ship') && units.some(u => u.kind === 'character'), 'Expected both unit kinds');
  const ids = new Set();
  for (const u of units) {
    assert.match(u.id, unitName);
    const id = u.id.toUpperCase();
    assert.ok(!ids.has(id) && ['character', 'ship'].includes(u.kind), 'Invalid or duplicate unit');
    ids.add(id);
    for (const skillId of u.skillIds) requireRow(datasets.skills, skillId, 'unit skill');
  }
  for (const t of Object.values(datasets.datacronTemplates)) {
    requireRow(datasets.datacronSets, t.setId, 'datacron set');
    if (t.referenceTemplateId) requireRow(datasets.datacronTemplates, t.referenceTemplateId, 'reference template');
    for (const tier of t.tiers) {
      for (const id of [...tier.affixSetIds, ...tier.initialAffixSetIds]) requireRow(datasets.datacronAffixes, id, 'affix set');
    }
  }
  for (const affix of Object.values(datasets.datacronAffixes).flatMap(row => row.options)) {
    if (affix.abilityId) requireRow(datasets.abilities, affix.abilityId, 'datacron ability');
    if (affix.targetingRuleId) requireRow(datasets.targetingRules, affix.targetingRuleId, 'datacron target');
  }
  for (const [name, table] of Object.entries(datasets)) {
    assert.match(name, /^[A-Za-z][A-Za-z0-9]*$/);
    assert.ok(Object.keys(table).length, 'Empty dataset: ' + name);
    for (const [id, row] of Object.entries(table)) {
      assert.equal(String(row.id), id, 'Key mismatch in ' + name);
      validateFields(row);
    }
  }
  units.forEach(validateFields);
}

export async function writeSnapshot(dir, input, model, buildKey) {
  const {provenance: p, license} = input;
  const {units, datasets} = model;
  validateModel(units, datasets);
  const checksums = Object.create(null);
  async function put(file, bytes) {
    checksums[file] = digest(bytes);
    await writeFile(path.join(dir, file), bytes);
  }
  const meta = (name, count) => ({
    count, gameVersion: p.gameVersion, localeVersion: p.localeVersion, sourceCommit: p.commit,
    retrievedAt: p.retrievedAt, sourceFiles: dependencies[name] ?? statsSources,
    confidence: uncertain.has(name) ? 'source-reported-with-unresolved-semantics' : 'source-reported',
  });
  const manifest = {
    schemaVersion: 1, buildKey, gameVersion: p.gameVersion, localeVersion: p.localeVersion,
    retrievedAt: p.retrievedAt, source: {repository, commit: p.commit, files: p.files},
    license: {mirror: 'GPL-3.0', path: 'SOURCE-LICENSE.txt', notice: 'NOTICE.txt'},
    datasets: {units: {...meta('units', units.length), index: 'index.json', path: 'units/{id}.json'}},
    checksums: 'checksums.json',
  };
  await mkdir(path.join(dir, 'units'), {recursive: true});
  const entries = [];
  for (const unit of units.sort((a, b) => a.id < b.id ? -1 : 1)) {
    const file = 'units/' + unit.id + '.json';
    const skillLabels = {};
    for (const id of unit.skillIds) {
      const name = datasets.abilities[datasets.skills[id].abilityId].name;
      if (name) skillLabels[id] = name;
    }
    await put(file, chunk({...unit, skillLabels}));
    entries.push({id: unit.id, name: unit.name, kind: unit.kind, path: file});
  }
  await put('index.json', chunk({schemaVersion: 1, gameVersion: p.gameVersion, retrievedAt: p.retrievedAt, units: entries}));
  for (const [name, rows] of Object.entries(datasets)) {
    const ids = Object.keys(rows).sort();
    const bytes = ids.reduce((n, id) => n + Buffer.byteLength(chunk(rows[id])) + Buffer.byteLength(id) + 4, 0);
    const buckets = 2 ** Math.max(0, Math.ceil(Math.log2(bytes / shardTarget)));
    const descriptor = {...meta(name, ids.length), buckets, path: 'tables/' + name + '/{bucket}.json'};
    manifest.datasets[name] = descriptor;
    const groups = new Map();
    for (const id of ids) {
      const file = recordPath(descriptor, id);
      if (!groups.has(file)) groups.set(file, Object.create(null));
      groups.get(file)[id] = rows[id];
    }
    await mkdir(path.join(dir, 'tables', name), {recursive: true});
    for (const [file, rows] of groups) await put(file, chunk(rows));
  }
  await put('SOURCE-LICENSE.txt', license);
  await put('NOTICE.txt', 'Mechanics facts normalized by the Swgoh-data project from swgoh-utils/gamedata.\n' +
    repository + '/tree/' + p.commit + '\nThe upstream repository includes the accompanying GNU GPL version 3.\n' +
    'Normalization source: https://github.com/jeffkites/Swgoh-data/tree/main/scripts/mechanics\n' +
    'Game names and third-party material retain their respective rights. This project is not endorsed by or affiliated with EA or its licensors.\n');
  await put('manifest.json', chunk(manifest));
  await writeFile(path.join(dir, 'checksums.json'), chunk(checksums));
  return manifest;
}

export async function verifySnapshot(dir) {
  const load = async file => JSON.parse(await readFile(path.join(dir, file)));
  const sums = await load('checksums.json');
  const m = await load('manifest.json');
  const idx = await load('index.json');
  assert.equal(m.schemaVersion, 1);
  assert.equal(idx.gameVersion, m.gameVersion);
  assert.equal(idx.retrievedAt, m.retrievedAt);
  assert.equal(m.source.repository, repository);
  assert.match(m.source.commit, /^[a-f0-9]{40}$/);
  const allowed = new Set(['checksums.json', 'manifest.json', 'index.json', 'SOURCE-LICENSE.txt', 'NOTICE.txt']);
  const units = new Map();
  for (const u of idx.units) {
    assert.match(u.id, unitName);
    assert.equal(u.path, 'units/' + u.id + '.json');
    assert.ok(!units.has(u.path));
    units.set(u.path, u);
    allowed.add(u.path);
  }
  assert.equal(units.size, m.datasets.units.count);
  const counts = new Map();
  for (const [file, sha] of Object.entries(sums)) {
    const shard = /^tables\/([A-Za-z][A-Za-z0-9]*)\/[0-9a-f]{2,8}\.json$/.exec(file);
    assert.ok(allowed.has(file) || (shard && Object.hasOwn(m.datasets, shard[1])), 'Unexpected output path');
    const bytes = await readFile(path.join(dir, file));
    assert.equal(digest(bytes), sha, 'Checksum mismatch: ' + file);
    if (shard) {
      allowed.add(file);
      const table = shard[1], rows = JSON.parse(bytes);
      for (const [id, row] of Object.entries(rows)) {
        assert.equal(String(row.id), id);
        assert.equal(recordPath(m.datasets[table], id), file);
      }
      counts.set(table, (counts.get(table) || 0) + Object.keys(rows).length);
    } else if (units.has(file)) {
      const record = JSON.parse(bytes), entry = units.get(file);
      for (const field of ['id', 'name', 'kind']) assert.equal(record[field], entry[field]);
    }
  }
  for (const file of allowed) if (file !== 'checksums.json') assert.ok(Object.hasOwn(sums, file), 'Missing checksum: ' + file);
  for (const [table, ds] of Object.entries(m.datasets)) {
    if (table !== 'units') assert.equal(counts.get(table), ds.count, 'Count mismatch: ' + table);
    assert.ok(ds.count > 0 && ds.sourceFiles.every(file => Object.hasOwn(m.source.files, file)));
  }
  async function walk(prefix) {
    for (const item of await readdir(path.join(dir, prefix), {withFileTypes: true})) {
      const file = prefix + item.name;
      if (item.isDirectory()) await walk(file + '/');
      else assert.ok(item.isFile() && allowed.has(file), 'Unexpected file in publish tree');
    }
  }
  await walk('');
  return m;
}
