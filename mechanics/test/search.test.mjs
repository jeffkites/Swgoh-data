import assert from 'node:assert/strict';
import test from 'node:test';
import { dataUrl, makeLibrary, matches, resolveBase } from '../app.mjs';

test('matches display names or base IDs across common variations and ship filters', () => {
  const units = [
    { id: 'IG_11', name: 'IG-11', kind: 'character' },
    { id: 'TEST_FLEET', name: 'Igèle', kind: 'ship' }
  ];
  assert.deepEqual(matches(units, 'Ig 11', ''), [units[0]]);
  assert.deepEqual(matches(units, 'ig', 'ship'), [units[1]]);
  assert.deepEqual(matches(units, 'test fleet', ''), [units[1]]);
  assert.deepEqual(matches(units, 'igele', ''), [units[1]]);
  assert.deepEqual(matches(units, 'missing', ''), []);
});

test('resolves an immutable hosted revision and a project-relative local dataset', async () => {
  const sha = 'ac'.repeat(20);
  const base = await resolveBase(new URL('https://jeffkites.github.io/Swgoh-data/mechanics/'), async url => {
    assert.match(url, /\/git\/ref\/heads\/mechanics-db-v1$/);
    return { object: { sha } };
  });
  assert.equal(String(base), 'https://raw.githubusercontent.com/jeffkites/Swgoh-data/' + sha + '/');
  await assert.rejects(resolveBase(new URL('https://jeffkites.github.io/'), async () => ({object:{sha:'main'}})));
  const local = await resolveBase(new URL('http://localhost:8010/site/mechanics/?q=abc'), () => {
    throw Error('Local previews should not contact GitHub');
  });
  assert.equal(String(local), 'http://localhost:8010/site/mechanics/data/');
});

test('only permits JSON documents beneath the selected database root', () => {
  const base = new URL('https://example.org/revision/');
  assert.equal(String(dataUrl(base, 'tables/skills/0c.json')), base + 'tables/skills/0c.json');
  for (const path of ['../data/player.json', '/data/player.json', '//other.example/a.json',
    'https://other.example/a.json', '%2e%2e/secret.json', 'record.json?x=.json']) {
    assert.throws(() => dataUrl(base, path));
  }
});

test('deduplicates concurrent shard reads, retries failures and preserves missing records', async () => {
  const manifest = { datasets: { skills: { buckets: 1, path:'tables/skills/{bucket}.json' } } };
  let calls = 0;
  const client = makeLibrary(new URL('https://example.org/db/'), manifest, async url => {
    assert.equal(String(url), 'https://example.org/db/tables/skills/00.json');
    if (++calls === 1) throw Error('Temporary failure');
    return { KNOWN: { id: 'KNOWN' } };
  });
  await assert.rejects(client.record('skills', 'KNOWN'));
  const [found, missing, inherited] = await Promise.all(
    ['KNOWN', 'ABSENT', 'constructor'].map(id => client.record('skills', id))
  );
  assert.deepEqual(found, { id: 'KNOWN' });
  assert.equal(missing, null);
  assert.equal(inherited, null);
  assert.equal(await client.record('absent-table', 'KNOWN'), null);
  assert.equal(calls, 2);
});
