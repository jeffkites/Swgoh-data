import {stats, slotNames, setNames, selectCharacters, openingOrder, formatStat, modStatLabel, modStatIsPercent, rosterCsv} from './model.mjs';

const byId = id => document.getElementById(id);
const el = (tag, text, className) => {const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node;};
const presets = {
  inquisitors: ['FIFTHBROTHER', 'SEVENTHSISTER', 'EIGHTHBROTHER', 'SECONDSISTER', 'NINTHSISTER'],
  firstOrder: ['SUPREMELEADERKYLOREN', 'GENERALHUX', 'KYLORENUNMASKED', 'FOSITHTROOPER', 'FIRSTORDERTROOPER'],
  bountyHunters: ['BOSSK', 'GREEFKARGA', 'THEMANDALORIAN', 'BOBAFETT', 'DENGAR'],
};

export async function loadPublicFile(filename, page = new URL(location.href), request = fetch) {
  if (!['modding.json', 'refresh.json'].includes(filename)) throw Error('Unknown roster file');
  const paths = page.hostname === 'jeffkites.github.io'
    ? ['https://api.github.com/repos/jeffkites/Swgoh-data/contents/data/' + filename + '?ref=main',
      'https://raw.githubusercontent.com/jeffkites/Swgoh-data/main/data/' + filename]
    : [new URL('../data/' + filename, page)];
  for (const path of paths) {
    try {
      const response = await request(path, {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw Error('Roster unavailable');
      const data = await response.json();
      if (data.encoding === 'base64') return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), c => c.charCodeAt(0))));
      return data;
    } catch { /* Try the second public snapshot route, if present. */ }
  }
  throw Error('Saved character stats could not be loaded. Reload to try again.');
}

function modStat(stat) {return modStatLabel(stat.id) + ' ' + formatStat(stat.value, modStatIsPercent(stat.id));}
function progress(unit) {return unit.stars + '★ · ' + (unit.relic === null ? 'G' + unit.gear : 'R' + unit.relic) + ' · ' + unit.mods.length + '/6 mods';}

async function start() {
  let data;
  try {
    data = await loadPublicFile('modding.json');
    if (data.schemaVersion !== 1 || !Array.isArray(data.characters) || data.allyCode !== '843153117' ||
      !data.characters.length || !Number.isFinite(Date.parse(data.refreshedAt))) throw Error('Unknown character dataset.');
  } catch (error) {
    byId('freshness').textContent = error.message;
    for (const id of ['query', 'filter', 'sort', 'preset', 'clear']) byId(id).disabled = true;
    return;
  }
  const units = new Map(data.characters.map(u => [u.id, u]));
  let selected = [], settings = {}, filtered = [];
  let active = new URLSearchParams(location.hash.slice(1)).get('unit') ?? selectCharacters(data.characters)[0]?.id;
  byId('freshness').textContent = 'Saved roster · ' + new Date(data.refreshedAt).toLocaleString('en-AU', {dateStyle: 'medium', timeStyle: 'short'}) + ' · ' + data.name;
  function stale(message) {byId('stale').hidden = false; byId('stale').textContent = message;}
  if (Date.now() - Date.parse(data.refreshedAt) > 86400000) stale('This saved roster is more than 24 hours old. Refresh after moving mods to see the new stats.');
  loadPublicFile('refresh.json').then(latest => {
    if (Date.parse(latest.refreshedAt) > Date.parse(data.refreshedAt)) stale('A newer roster is saved. Stat calculation is still on the previous snapshot; these numbers may have changed.');
  }).catch(() => {});
  for (const [label, count] of [['characters', data.characters.length],
    ['with six level-15 mods', data.characters.filter(u => u.mods.length === 6 && u.mods.every(m => m.level === 15)).length],
    ['with mod gaps', data.characters.filter(u => u.mods.length < 6).length]]) {
    const chip = el('div', undefined, 'total'); chip.append(el('strong', count), label); byId('totals').append(chip);
  }
  byId('source').textContent = 'Calculated with ' + data.source.calculator + ' · game ' + data.source.gameVersion + ' · definitions ' + data.source.commit.slice(0, 7);

  function renderDetail() {
    const unit = units.get(active);
    byId('character-details').replaceChildren();
    byId('character-name').textContent = unit?.name ?? 'Choose a character';
    if (!unit) return;
    const body = byId('character-details');
    body.append(el('p', progress(unit) + ' · Level ' + unit.level, 'muted'));
    if (unit.problem) body.append(el('p', unit.problem, 'notice'));
    const tags = el('div', undefined, 'tags');
    for (const set of unit.sets) tags.append(el('span', set.name + ' · ' + set.pieces + ' pieces' +
      (set.complete ? ' · ' + set.complete + ' complete' : ' · incomplete') +
      (set.complete && set.maxLevel < set.complete ? ' · reduced bonus' : ''), 'tag'));
    if (!unit.mods.length) tags.append(el('span', 'No mods equipped', 'tag'));
    body.append(tags, el('h3', 'Stats at your current gear and relic'));
    const wrap = el('div', undefined, 'tablewrap'), table = el('table', undefined, 'stat-table');
    const head = el('thead'), hr = el('tr');
    for (const title of ['Stat', 'Without mods', 'From mods', 'Equipped']) {const th=el('th',title); th.scope='col'; hr.append(th);} head.append(hr); table.append(head);
    const rows = el('tbody');
    for (const stat of stats) {
      const row = el('tr'); row.append(el('th', stat.label)); row.firstChild.scope = 'row';
      row.append(el('td', formatStat(unit.stats.withoutMods[stat.key], stat.percent)),
        el('td', formatStat(unit.stats.fromMods[stat.key], stat.percent, true)),
        el('td', formatStat(unit.stats.equipped[stat.key], stat.percent)));
      rows.append(row);
    }
    table.append(rows); wrap.append(table); body.append(wrap,
      el('p', 'Mod totals include set bonuses. “pp” means percentage points.', 'muted help'), el('h3', 'Equipped mods'));
    for (const [slot, name] of Object.entries(slotNames)) {
      const mod = unit.mods.find(m => m.slot === Number(slot));
      if (!mod) {body.append(el('p', name + ' · Empty slot', 'mod-slot empty-slot')); continue;}
      const item = el('details', undefined, 'mod-slot'), summary = el('summary');
      summary.append(el('strong', name), ' · ' + (setNames[mod.setId] ?? 'Unknown set') + ' · ' + mod.rarity + ' dots · L' + mod.level);
      item.append(summary, el('p', 'Primary: ' + modStat(mod.primary)));
      const secondaries = el('ul');
      for (const stat of mod.secondaries) secondaries.append(el('li', modStat(stat)));
      if (!mod.secondaries.length) secondaries.append(el('li', 'No secondary stats recorded'));
      item.append(secondaries); body.append(item);
    }
  }

  function renderRoster() {
    filtered = selectCharacters(data.characters, {query: byId('query').value, filter: byId('filter').value, sort: byId('sort').value});
    const fragment = document.createDocumentFragment();
    for (const unit of filtered) {
      const row = el('tr'); row.dataset.unit = unit.id; row.setAttribute('aria-selected', String(unit.id === active));
      const pickCell = el('td'), pick = el('input'); pick.type = 'checkbox'; pick.checked = selected.includes(unit.id);
      pick.setAttribute('aria-label', 'Compare ' + unit.name);
      pick.addEventListener('change', () => {
        if (pick.checked && selected.length === 5) {pick.checked = false; byId('squad-message').textContent = 'Five selected. Remove a character before adding another.'; return;}
        selected = pick.checked ? [...selected, unit.id] : selected.filter(id => id !== unit.id);
        byId('preset').value = ''; renderPlanner();
      }); pickCell.append(pick); row.append(pickCell);
      const nameCell = el('td'), name = el('button', unit.name, 'unit-name'); name.type = 'button';
      name.addEventListener('click', () => {
        active = unit.id; history.replaceState(null, '', '#' + new URLSearchParams({unit: active}));
        for (const other of byId('rows').children) other.setAttribute('aria-selected', String(other.dataset.unit === active));
        renderDetail(); if (window.matchMedia('(max-width: 75rem)').matches) byId('character-name').focus();
      });
      nameCell.append(name, el('span', progress(unit), 'unit-meta')); row.append(nameCell);
      for (const [key, percent] of [['speed'], ['modSpeed'], ['health'], ['protection'], ['potency', true], ['tenacity', true]]) {
        row.append(el('td', key === 'modSpeed' ? formatStat(unit.stats.fromMods.speed, false, true) : formatStat(unit.stats.equipped[key], percent)));
      }
      fragment.append(row);
    }
    if (!filtered.length) {const row = el('tr'), cell = el('td', 'No characters match these filters.'); cell.colSpan = 8; row.append(cell); fragment.append(row);}
    byId('rows').replaceChildren(fragment);
    byId('count').textContent = filtered.length + ' of ' + data.characters.length + ' characters · select a name for details';
  }

  function updateOrder() {
    const rows = openingOrder(selected.map(id => units.get(id)), settings);
    const list = byId('opening-order'); list.replaceChildren();
    for (const row of rows) {
      const tr = [...byId('tuning').children].find(node => node.dataset.unit === row.unit.id);
      tr.querySelector('[data-speed]').textContent = formatStat(row.speed);
      tr.querySelector('[data-order]').textContent = row.rank === null ? 'Check inputs' : row.rank + (row.tie ? ' · tie' : '');
      list.append(el('li', (row.rank === null ? '?' : row.rank + (row.tie ? '=' : '')) + ' · ' + row.unit.name +
        ' · ' + formatStat(row.speed), row.rank === null || row.tie ? 'unknown' : ''));
    }
  }

  function renderPlanner() {
    byId('tuning').replaceChildren();
    byId('tuning-wrap').hidden = selected.length === 0;
    byId('copy').disabled = selected.length === 0;
    byId('squad-message').textContent = selected.length ? selected.length + ' of 5 characters selected.' : 'No characters selected yet.';
    for (const id of selected) {
      const unit = units.get(id), row = el('tr'); row.dataset.unit = id;
      const name = el('td', undefined, 'name-cell'), remove = el('button', 'Remove', 'remove'); remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + unit.name);
      remove.addEventListener('click', () => {selected = selected.filter(other => other !== id); byId('preset').value = ''; renderPlanner(); renderRoster();});
      name.append(el('div', unit.name), remove); row.append(name, el('td', formatStat(unit.stats.equipped.speed)));
      for (const [key, label] of [['speed', 'Planned speed'], ['bonus', 'Flat bonus'], ['tm', 'Starting TM %']]) {
        const cell = el('td'), input = el('input'); input.type = 'number'; input.step = '1';
        input.min = key === 'bonus' ? '-10000' : key === 'tm' ? '0' : '1'; input.max = key === 'tm' ? '100' : '10000';
        input.setAttribute('aria-label', label + ' for ' + unit.name);
        input.placeholder = key === 'speed' ? formatStat(unit.stats.equipped.speed) : '0';
        input.value = settings[id]?.[key] ?? '';
        input.addEventListener('input', () => {settings[id] ??= {}; settings[id][key] = input.validity.badInput ? 'invalid' : input.value; updateOrder();});
        cell.append(input); row.append(cell);
      }
      const speed = el('td'), rank = el('td'); speed.dataset.speed = ''; rank.dataset.order = ''; row.append(speed, rank); byId('tuning').append(row);
    }
    updateOrder();
  }

  for (const id of ['query', 'filter', 'sort']) byId(id).addEventListener(id === 'query' ? 'input' : 'change', renderRoster);
  byId('preset').addEventListener('change', () => {
    if (!presets[byId('preset').value]) return;
    selected = presets[byId('preset').value].filter(id => units.has(id)); settings = {};
    renderPlanner(); renderRoster();
  });
  byId('clear').addEventListener('click', () => {selected = []; settings = {}; byId('preset').value = ''; renderPlanner(); renderRoster();});
  byId('copy').addEventListener('click', async () => {
    const lines = ['My SWGOH character stats · roster ' + data.refreshedAt];
    const order = openingOrder(selected.map(id => units.get(id)), settings);
    for (const row of order) {
      const unit = row.unit;
      lines.push(unit.name + ' · ' + progress(unit) + '\n' + stats.map(s => s.label + ' ' + formatStat(unit.stats.equipped[s.key], s.percent)).join(' · ') +
        '\nSpeed without mods ' + formatStat(unit.stats.withoutMods.speed) + ' · from mods ' + formatStat(unit.stats.fromMods.speed, false, true) +
        '\nPlan: speed ' + formatStat(row.speed) + ', starting TM ' + formatStat(row.tm / 100, true) + ', opening order ' + (row.rank ?? 'unknown') + (row.tie ? ' (tie unresolved)' : ''));
    }
    try {await navigator.clipboard.writeText(lines.join('\n\n')); byId('copy-status').textContent = 'Squad stats copied.';}
    catch {byId('copy-status').textContent = 'Clipboard access is unavailable in this browser.';}
  });
  byId('csv').disabled = false;
  byId('csv').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([rosterCsv(filtered)], {type: 'text/csv;charset=utf-8'}));
    const anchor = el('a'); anchor.href = url; anchor.download = data.refreshedAt.slice(0, 10) + '-Character-Stats.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  renderRoster(); renderDetail(); renderPlanner();
}
if (typeof document !== 'undefined') start();
