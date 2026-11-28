import assert from 'node:assert/strict';
import {mkdir, readFile, rename, rm} from 'node:fs/promises';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {digest, openSource, readSource} from '../mechanics/source.mjs';
import {normalizeRoster, validateRosterDatabase} from './normalize.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = ['LICENSE', 'allVersions.json', 'gameData.json', 'statMod.json'];
const read = async filename => {const bytes = await readFile(filename); return {bytes, data: JSON.parse(bytes)};};

async function main() {
  const {values: opts} = parseArgs({options: {'source-repo': {type: 'string'}, revision: {type: 'string'},
    cache: {type: 'string'}, out: {type: 'string'}, verify: {type: 'boolean'}}});
  const out = path.resolve(opts.out ?? path.join(root, 'data/modding.json'));
  const [player, catalog, metadata] = await Promise.all(['player.json', 'unit-catalog.json', 'refresh.json'].map(f => read(path.join(root, 'data', f))));
  const inputs = {playerSha256: digest(player.bytes), catalogSha256: digest(catalog.bytes)};
  if (opts.verify) {
    const data = validateRosterDatabase((await read(out)).data);
    assert.equal(data.refreshedAt, metadata.data.refreshedAt, 'Stats use an older roster');
    for (const [key, hash] of Object.entries(inputs)) assert.equal(data.source[key], hash, 'Roster input changed');
    console.log('Verified', data.characters.length, 'personal character profiles at', data.refreshedAt);
    return;
  }
  const cache = path.resolve(opts.cache ?? path.join(root, '../.modding-raw'));
  assert.ok(!cache.startsWith(root), 'Keep raw definitions outside the repository');
  const upstream = await openSource(opts['source-repo'], opts.revision, files);
  const input = await readSource(upstream, cache, new Date().toISOString(), files);
  assert.equal(input.provenance.gameVersion, catalog.data.versions.latestGamedataVersion,
    'Game definitions differ from the saved roster catalog; retry after the mirror updates');
  const data = normalizeRoster(player.data, catalog.data, metadata.data.refreshedAt, input.collections, {
    ...inputs, repository: input.provenance.repository, commit: upstream.commit,
    gameVersion: input.provenance.gameVersion, files: input.provenance.files,
    calculator: '@swgoh-utils/swgoh-stat-calc@1.0.1',
  });
  validateRosterDatabase(data);
  await mkdir(path.dirname(out), {recursive: true});
  const temporary = out + '.' + process.pid + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify(data) + '\n');
    await rename(temporary, out);
  } finally {await rm(temporary, {force: true});}
  const unknown = data.characters.filter(u => u.problem).length;
  console.log('Built', data.characters.length, 'personal character profiles;', unknown, 'with unknown stats.');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;});
