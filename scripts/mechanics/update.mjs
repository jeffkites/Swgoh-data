import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildAbilities } from './abilities.mjs';
import { buildDatacrons } from './datacrons.mjs';
import { buildUnits } from './units.mjs';
import { verifySnapshot, writeSnapshot } from './database.mjs';
import { digest, openSource, readSource } from './source.mjs';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(moduleDir, '../..');

async function adapterDigest() {
  const files = (await readdir(moduleDir)).filter(name => name.endsWith('.mjs') && !name.endsWith('.test.mjs')).sort();
  files.push('../../mechanics/lookup.mjs');
  const hashes = await Promise.all(files.map(async file => [file, digest(await readFile(path.join(moduleDir, file)))]));
  return digest(JSON.stringify(hashes));
}

async function maybeManifest(file) {
  try { return JSON.parse(await readFile(file)); }
  catch (err) { if (err.code === 'ENOENT') return null; throw err; }
}

async function main() {
  const {values: opts} = parseArgs({options: {
    'source-repo': {type: 'string'}, revision: {type: 'string'}, cache: {type: 'string'},
    out: {type: 'string'}, 'previous-manifest': {type: 'string'}, verify: {type: 'boolean'},
  }});
  const out = path.resolve(opts.out ?? path.join(root, 'mechanics/data'));
  if (opts.verify) {
    const m = await verifySnapshot(out);
    console.log('Verified', m.datasets.units.count, 'unit profiles for', m.gameVersion);
    return;
  }
  const cache = path.resolve(opts.cache ?? path.join(root, '../.mechanics-raw'));
  const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);
  assert.ok(!inside(root, cache) && !inside(out, cache) && !inside(cache, out), 'Keep raw data outside the repository and output');
  assert.ok(!inside(out, root), 'Output cannot replace a repository or its parent');
  await mkdir(path.dirname(out), {recursive: true});
  // One writer per output. An interrupted process leaves its previous published snapshot intact.
  const lock = out + '.lock';
  await mkdir(lock);
  let stage;
  try {
    const current = await maybeManifest(path.join(out, 'manifest.json'));
    const existing = await stat(out).catch(err => { if (err.code !== 'ENOENT') throw err; return null; });
    if (existing && !current) assert.fail('Output already exists without a mechanics manifest');
    const previous = opts['previous-manifest'] ? await maybeManifest(opts['previous-manifest']) : current;
    const source = await openSource(opts['source-repo'], opts.revision);
    const buildKey = digest(JSON.stringify([await adapterDigest(), source.blobs]));
    if (previous?.buildKey === buildKey) {
      if (current) await verifySnapshot(out);
      console.log('Source collections and normalizer are unchanged.');
      return;
    }
    const input = await readSource(source, cache, new Date().toISOString());
    const {units, datasets: stats} = buildUnits(input.collections);
    const {datasets: combat} = buildAbilities(input.collections);
    const datasets = {...stats, ...combat, ...buildDatacrons(input.collections)};
    stage = await mkdtemp(out + '.staging-');
    await writeSnapshot(stage, input, {units, datasets}, buildKey);
    await verifySnapshot(stage);
    // Never replace an unrecognized directory or discard unrelated files added to old output.
    if (current) await verifySnapshot(out);
    const backup = current ? out + '.backup-' + randomUUID() : null;
    if (backup) await rename(out, backup);
    try { await rename(stage, out); stage = null; }
    catch (err) { if (backup) await rename(backup, out); throw err; }
    if (backup) await rm(backup, {recursive: true});
    console.log('Built and verified', units.length, 'unit profiles for', input.provenance.gameVersion);
  } finally {
    if (stage) await rm(stage, {recursive: true, force: true});
    await rm(lock, {recursive: true});
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
