import { recordPath } from './lookup.mjs';

const PAGES_HOST = 'jeffkites.github.io';
const REPOSITORY = 'jeffkites/Swgoh-data';
const DATA_BRANCH = 'mechanics-db-v1';
const byId = id => document.getElementById(id);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}

function link(label, url, className) {
  const anchor = element('a', label, className);
  anchor.href = url;
  return anchor;
}

async function getJson(url) {
  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}

export async function resolveBase(page, read = getJson) {
  if (page.hostname !== PAGES_HOST) return new URL('./data/', page);
  const ref = await read('https://api.github.com/repos/' + REPOSITORY + '/git/ref/heads/' + DATA_BRANCH);
  if (!/^[a-f0-9]{40}$/.test(ref?.object?.sha)) throw new Error('Invalid dataset revision');
  return new URL('https://raw.githubusercontent.com/' + REPOSITORY + '/' + ref.object.sha + '/');
}

export function dataUrl(base, path) {
  if (typeof path !== 'string' || !/^[a-z0-9_./-]+\.json$/i.test(path) ||
      path.startsWith('/') || path.split('/').some(part => part === '.' || part === '..' || !part)) {
    throw new Error('Invalid dataset path');
  }
  return new URL(path, base);
}

export function makeLibrary(base, manifest, fetchJson = getJson) {
  const cache = new Map();
  const read = path => {
    if (!cache.has(path)) {
      cache.set(path, fetchJson(dataUrl(base, path)).catch(error => {
        cache.delete(path);
        throw error;
      }));
    }
    return cache.get(path);
  };
  return {
    base, manifest, read,
    async record(table, id) {
      const dataset = manifest.datasets?.[table];
      if (!dataset || typeof id !== 'string') return null;
      const shard = await read(recordPath(dataset, id));
      return Object.hasOwn(shard, id) ? shard[id] : null;
    }
  };
}

function searchKey(value) {
  return String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matches(units, query, kind) {
  const term = searchKey(query);
  return units.filter(unit => (!kind || String(unit.kind).toLowerCase() === kind) &&
    (searchKey(unit.name).includes(term) || searchKey(unit.id).includes(term)));
}

function humanLabel(key) {
  const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function display(value) {
  if (value === null || value === undefined) return 'Unavailable';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function disclosure(label, value) {
  const details = element('details');
  details.append(element('summary', label));
  details.addEventListener('toggle', () => {
    if (details.open && details.children.length === 1) {
      details.append(element('pre', JSON.stringify(value, null, 2)));
    }
  });
  return details;
}

function fields(object, omit = []) {
  const list = element('dl');
  for (const [key, value] of Object.entries(object)) {
    if (omit.includes(key)) continue;
    const row = element('div', undefined, 'field');
    const datum = element('dd');
    if (Array.isArray(value)) {
      if (value.length) datum.append(disclosure(value.length + (value.length === 1 ? ' entry' : ' entries'), value));
      else datum.textContent = '0 entries';
    } else if (value && typeof value === 'object') {
      datum.append(disclosure('View fields', value));
    } else {
      datum.textContent = display(value);
    }
    row.append(element('dt', humanLabel(key)), datum);
    list.append(row);
  }
  return list;
}

function section(title) {
  const node = element('section', undefined, 'record-block');
  node.append(element('h3', title));
  return node;
}

function recordDisclosure(library, table, id, label, render) {
  const details = element('details');
  const summary = element('summary', label || id);
  const body = element('div');
  details.append(summary, body);
  let state = 'idle';
  details.addEventListener('toggle', async () => {
    if (!details.open || state !== 'idle') return;
    state = 'loading';
    body.textContent = 'Loading record…';
    try {
      const record = await library.record(table, id);
      body.replaceChildren();
      if (record) {
        render(record, body, summary);
        const dataset = library.manifest.datasets[table];
        if (dataset.confidence) body.append(element('p', 'Confidence · ' + dataset.confidence, 'muted'));
        body.append(link('Source shard (JSON)', dataUrl(library.base, recordPath(dataset, id)), 'data-link'));
      }
      else body.textContent = 'No matching record in this dataset.';
      state = 'done';
    } catch {
      state = 'idle';
      body.textContent = 'The record could not be loaded. Close and reopen to retry.';
    }
  });
  return details;
}

function renderEffect(record, body) {
  body.append(fields(record));
}

function renderLevels(levels, library) {
  const group = element('div');
  for (const level of levels) {
    const title = ['Level ' + level.level];
    if (level.cooldown != null) title.push('cooldown ' + level.cooldown);
    if (level.isZetaTier) title.push('Zeta');
    if (level.isOmicronTier) title.push('Omicron');
    const details = element('details');
    details.append(element('summary', title.join(' · ')));
    details.append(fields(level, ['level', 'effects']));
    for (const ref of level.effects ?? []) {
      const id = typeof ref === 'string' ? ref : ref.id;
      if (id) details.append(recordDisclosure(library, 'effects', id, 'Effect · ' + id, renderEffect));
    }
    group.append(details);
  }
  return group;
}

function renderAbility(record, body, summary, library) {
  if (record.name) summary.textContent = record.name;
  body.append(fields(record, ['levels']));
  if (record.allyTargetingRuleId) {
    body.append(recordDisclosure(library, 'targetingRules', record.allyTargetingRuleId,
      'Ally targeting rule', (rule, target) => target.append(fields(rule))));
  }
  if (record.levels?.length) {
    body.append(element('h4', 'Ability levels and cooldowns'), renderLevels(record.levels, library));
  }
}

function skillDetails(library, id, label) {
  return recordDisclosure(library, 'skills', id, label, (skill, body) => {
    body.append(fields(skill, ['levels', 'abilityId']));
    if (skill.levels?.length) {
      body.append(element('h4', 'Skill upgrades'), renderLevels(skill.levels, library));
    }
    if (skill.abilityId) {
      body.append(recordDisclosure(library, 'abilities', skill.abilityId, 'Ability · ' + skill.abilityId,
        (record, target, summary) => renderAbility(record, target, summary, library)));
    }
  });
}

function renderUnit(unit, row, library) {
  const result = document.createDocumentFragment();
  const skills = section('Skills and abilities');
  if (unit.skillIds?.length) {
    for (const id of unit.skillIds) skills.append(skillDetails(library, id, unit.skillLabels?.[id] ?? id));
  } else {
    skills.append(element('p', 'No skill references in this unit record.', 'muted'));
  }
  result.append(skills);
  const attributes = fields(unit, ['id', 'name', 'kind', 'skillIds', 'skillLabels', 'provenance']);
  if (attributes.childElementCount) {
    const block = section('Unit data');
    block.append(attributes);
    result.append(block);
  }
  const source = section('Provenance');
  const provenance = unit.provenance ?? library.manifest.datasets?.units ?? {};
  const metadata = {};
  for (const key of ['sourceFiles', 'sourceCommit', 'gameVersion', 'retrievedAt', 'confidence']) {
    const value = provenance[key] ?? library.manifest[key];
    if (value !== undefined) metadata[key] = value;
  }
  const commit = library.manifest.source?.commit;
  if (/^[a-f0-9]{40}$/.test(commit)) {
    source.append(link('Source revision on GitHub', 'https://github.com/swgoh-utils/gamedata/tree/' + commit));
  }
  source.append(fields(metadata), link('Unit record (JSON)', dataUrl(library.base, row.path), 'data-link'));
  result.append(source);
  return result;
}

async function start() {
  const query = byId('query');
  const kind = byId('kind');
  const list = byId('results');
  const status = byId('profile-status');
  const detail = byId('detail');
  const profile = byId('profile');
  const title = byId('profile-title');
  let request = 0;
  try {
    const base = await resolveBase(new URL(location.href));
    byId('index-link').href = dataUrl(base, 'index.json');
    byId('manifest-link').href = dataUrl(base, 'manifest.json');
    const [index, manifest] = await Promise.all([getJson(dataUrl(base, 'index.json')), getJson(dataUrl(base, 'manifest.json'))]);
    if (index.schemaVersion !== 1 || !Array.isArray(index.units)) throw new Error('Unknown unit index');
    const library = makeLibrary(base, manifest);
    const units = [...index.units].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const unitIndex = new Map(units.map(row => [row.id, row]));
    const nameCounts = new Map();
    for (const unit of units) nameCounts.set(unit.name, (nameCounts.get(unit.name) ?? 0) + 1);
    byId('version').textContent = ['Game version ' + (index.gameVersion ?? 'unavailable'), 'Retrieved ' +
      (index.retrievedAt ?? 'date unavailable')].join(' · ');
    const selectedId = () => new URLSearchParams(location.hash.slice(1)).get('unit') ?? units[0]?.id;
    function renderSearch() {
      const selection = selectedId();
      const rows = matches(units, query.value, kind.value);
      const items = document.createDocumentFragment();
      for (const row of rows) {
        const item = element('li');
        const anchor = link(row.name, '#' + new URLSearchParams({unit: row.id}));
        if (row.id === selection) anchor.setAttribute('aria-current', 'true');
        const caption = nameCounts.get(row.name) > 1 ? humanLabel(row.kind) + ' · ' + row.id : humanLabel(row.kind);
        anchor.append(element('small', caption));
        item.append(anchor);
        items.append(item);
      }
      list.replaceChildren(items);
      byId('count').textContent = rows.length ? rows.length + (rows.length === 1 ? ' match' : ' matches') : 'No matching units.';
    }
    async function renderSelection() {
      const current = ++request;
      const row = unitIndex.get(selectedId());
      detail.replaceChildren();
      title.textContent = row?.name ?? 'Unit details';
      if (!row) {
        status.textContent = units.length ? 'This unit ID is absent from the index.' : 'The index contains no units.';
        profile.setAttribute('aria-busy', 'false');
        return;
      }
      profile.setAttribute('aria-busy', 'true');
      status.textContent = 'Loading unit record…';
      try {
        const unit = await library.read(row.path);
        if (current !== request) return;
        if (unit.id !== row.id) throw new Error('Unit ID mismatch');
        status.textContent = humanLabel(unit.kind) + ' · ' + unit.id;
        detail.append(renderUnit(unit, row, library));
      } catch {
        if (current !== request) return;
        status.textContent = 'The unit record could not be loaded. ';
        const retry = element('button', 'Retry');
        retry.type = 'button';
        retry.addEventListener('click', renderSelection);
        status.append(retry);
      } finally {
        if (current === request) profile.setAttribute('aria-busy', 'false');
      }
    }
    query.addEventListener('input', renderSearch);
    kind.addEventListener('change', renderSearch);
    window.addEventListener('hashchange', () => {
      renderSearch();
      renderSelection();
      title.focus({preventScroll: !window.matchMedia('(max-width: 44rem)').matches});
    });
    renderSearch();
    await renderSelection();
  } catch {
    query.disabled = true;
    kind.disabled = true;
    byId('count').textContent = 'Unit index unavailable.';
    status.textContent = 'The mechanics database could not be opened. ';
    const retry = element('button', 'Reload');
    retry.type = 'button';
    retry.addEventListener('click', () => location.reload());
    status.append(retry);
    profile.setAttribute('aria-busy', 'false');
  }
}

if (typeof document !== 'undefined') start();
