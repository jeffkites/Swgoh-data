import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

export const repository = 'https://github.com/swgoh-utils/gamedata';
const api = 'https://api.github.com/repos/swgoh-utils/gamedata';
const raw = 'https://raw.githubusercontent.com/swgoh-utils/gamedata';
export const sourceFiles = [
  'LICENSE', 'allVersions.json', 'units.json.br', 'Loc_ENG_US.txt.json.br', 'enums.json',
  'skill.json', 'ability.json', 'effect.json.br', 'battleTargetingRule.json', 'equipment.json',
  'statProgression.json', 'relicTierDefinition.json', 'table.json', 'datacronSet.json',
  'datacronTemplate.json', 'datacronAffixTemplateSet.json',
];
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const gitBlob = bytes => createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
const sourceLimit = 80 * 1024 * 1024;

async function download(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90_000), redirect: 'error' });
      if (!response.ok) throw new Error('Game definition source returned HTTP ' + response.status);
      assert.ok(Number(response.headers.get('content-length')) <= sourceLimit, 'Unexpected input size');
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.length <= sourceLimit, 'Unexpected input size');
      return bytes;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 750 * 2 ** attempt));
    }
  }
}

export async function openSource(checkout, revision) {
  let commit, entries, readBlob;
  if (checkout) {
    const git = (...args) => execFileSync('git', ['-C', checkout, ...args], { maxBuffer: sourceLimit });
    const origin = git('remote', 'get-url', 'origin').toString().trim().replace(/\.git$/, '');
    assert.equal(origin, repository, 'Expected the public gamedata mirror');
    if (revision) assert.match(revision, /^[a-f0-9]{40}$/);
    commit = git('rev-parse', revision || 'HEAD').toString().trim();
    entries = git('ls-tree', commit).toString().trim().split('\n').map(line => {
      const [meta, name] = line.split('\t');
      return [name, meta.split(' ')[2]];
    });
    readBlob = async name => git('cat-file', 'blob', commit + ':' + name);
  } else {
    commit = revision ?? JSON.parse(await download(api + '/git/ref/heads/main')).object.sha;
    assert.match(commit, /^[a-f0-9]{40}$/);
    const tree = JSON.parse(await download(api + '/git/trees/' + commit));
    assert.equal(tree.truncated, false);
    entries = tree.tree.filter(entry => entry.type === 'blob').map(entry => [entry.path, entry.sha]);
    readBlob = name => download(raw + '/' + commit + '/' + name);
  }
  assert.match(commit, /^[a-f0-9]{40}$/);
  const tree = Object.fromEntries(entries);
  const blobs = Object.fromEntries(sourceFiles.map(name => {
    assert.match(tree[name] ?? '', /^[a-f0-9]{40}$/, 'Missing source file ' + name);
    return [name, tree[name]];
  }));
  return {commit, blobs, readBlob};
}

export function unwrap(name, bytes, versions) {
  const expected = name.startsWith('Loc_') ? versions.localeVersion : versions.gameVersion;
  assert.equal(versions[name], expected, 'Incomplete upstream update: ' + name);
  const decoded = name.endsWith('.br') ? brotliDecompressSync(bytes, {maxOutputLength: 256 * 1024 * 1024}) : bytes;
  const envelope = JSON.parse(decoded);
  assert.equal(envelope.version, expected, 'Version mismatch: ' + name);
  assert.ok(envelope.data && typeof envelope.data === 'object' && Object.keys(envelope.data).length, 'Empty collection: ' + name);
  return envelope.data;
}

export async function readSource(source, cacheDir, retrievedAt) {
  const objects = path.join(cacheDir, 'objects');
  await mkdir(objects, {recursive: true});
  const files = {};
  async function get(name) {
    const sha = source.blobs[name];
    const file = path.join(objects, sha);
    let bytes;
    try { bytes = await readFile(file); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!bytes || gitBlob(bytes) !== sha) {
      bytes = await source.readBlob(name);
      assert.equal(gitBlob(bytes), sha, 'Git blob mismatch: ' + name);
      const tmp = file + '.' + process.pid + '.tmp';
      await writeFile(tmp, bytes);
      await rename(tmp, file);
    }
    files[name] = {gitBlob: sha, sha256: digest(bytes), bytes: bytes.length};
    return bytes;
  }
  const versions = JSON.parse(await get('allVersions.json'));
  assert.ok(versions.gameVersion && versions.localeVersion, 'Missing completion sentinel');
  const collections = {};
  for (const name of sourceFiles.filter(n => n.endsWith('.json') || n.endsWith('.br'))) {
    if (name === 'allVersions.json') continue;
    collections[name.replace(/\.json(?:\.br)?$/, '')] = unwrap(name, await get(name), versions);
  }
  const license = await get('LICENSE');
  assert.match(license.toString(), /GNU GENERAL PUBLIC LICENSE\s+Version 3/);
  const provenance = {repository, commit: source.commit, gameVersion: versions.gameVersion,
    localeVersion: versions.localeVersion, retrievedAt, files};
  const manifests = path.join(cacheDir, 'snapshots');
  await mkdir(manifests, {recursive: true});
  await writeFile(path.join(manifests, source.commit + '.json'), JSON.stringify(provenance, null, 2));
  return {collections, provenance, license};
}
