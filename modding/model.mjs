export const stats = [
  {key: 'speed', id: 5, label: 'Speed'},
  {key: 'health', id: 1, label: 'Health'},
  {key: 'protection', id: 28, label: 'Protection'},
  {key: 'physicalDamage', id: 6, label: 'Physical damage'},
  {key: 'specialDamage', id: 7, label: 'Special damage'},
  {key: 'potency', id: 17, label: 'Potency', percent: true},
  {key: 'tenacity', id: 18, label: 'Tenacity', percent: true},
  {key: 'armor', id: 8, label: 'Armor', percent: true},
  {key: 'resistance', id: 9, label: 'Resistance', percent: true},
  {key: 'physicalCritChance', id: 14, label: 'Physical crit chance', percent: true},
  {key: 'specialCritChance', id: 15, label: 'Special crit chance', percent: true},
  {key: 'critDamage', id: 16, label: 'Crit damage', percent: true},
  {key: 'critAvoidance', id: 39, label: 'Physical crit avoidance', percent: true},
];

export const setNames = {1: 'Health', 2: 'Offense', 3: 'Defense', 4: 'Speed',
  5: 'Crit chance', 6: 'Crit damage', 7: 'Potency', 8: 'Tenacity'};
export const slotNames = {2: 'Square', 3: 'Arrow', 4: 'Diamond', 5: 'Triangle', 6: 'Circle', 7: 'Cross'};
const modLabels = {1: 'Health', 5: 'Speed', 8: 'Armor', 9: 'Resistance', 16: 'Crit damage',
  17: 'Potency', 18: 'Tenacity', 28: 'Protection', 41: 'Offense', 42: 'Defense',
  48: 'Offense', 49: 'Defense', 53: 'Crit chance', 54: 'Crit avoidance', 55: 'Health', 56: 'Protection', 57: 'Speed'};
const flatModStats = new Set([1, 5, 8, 9, 28, 41, 42]);
export const modStatLabel = id => modLabels[id] ?? 'Stat ' + id;
export const modStatIsPercent = id => !flatModStats.has(id);

export function formatStat(value, percent = false, delta = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Unknown';
  const display = percent ? value * 100 : value;
  const formatted = new Intl.NumberFormat('en-AU', {maximumFractionDigits: percent ? 2 : 0}).format(display);
  return (delta && value > 0 ? '+' : '') + formatted + (percent ? (delta ? ' pp' : '%') : '');
}

const searchKey = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function selectCharacters(characters, {query = '', filter = '', sort = 'speed'} = {}) {
  const term = searchKey(query);
  const rows = characters.filter(u => (searchKey(u.name).includes(term) || searchKey(u.id).includes(term)) &&
    (!filter || (filter === 'relic' && u.relic !== null) ||
      (filter === 'gaps' && (u.mods.length < 6 || u.mods.some(m => m.level < 15))) ||
      (filter === 'unmodded' && u.mods.length === 0)));
  return rows.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const av = sort === 'modSpeed' ? a.stats.fromMods.speed : a.stats.equipped[sort];
    const bv = sort === 'modSpeed' ? b.stats.fromMods.speed : b.stats.equipped[sort];
    return (bv ?? -Infinity) - (av ?? -Infinity) || a.name.localeCompare(b.name);
  });
}

// Continuous first-fill comparison only. No battle events or kit effects are inferred.
export function openingOrder(characters, settings = {}) {
  const rows = characters.map(unit => {
    const options = settings[unit.id] ?? {};
    const planned = options.speed === undefined || options.speed === '' ? unit.stats.equipped.speed : Number(options.speed);
    const bonus = options.bonus === undefined || options.bonus === '' ? 0 : Number(options.bonus);
    const tm = options.tm === undefined || options.tm === '' ? 0 : Number(options.tm);
    const valid = Number.isFinite(planned) && planned > 0 && planned <= 10000 &&
      Number.isFinite(bonus) && Math.abs(bonus) <= 10000 && planned + bonus > 0 &&
      Number.isFinite(tm) && tm >= 0 && tm <= 100;
    const speed = valid ? planned + bonus : null;
    return {unit, speed, planned, bonus, tm, time: valid ? (1 - tm / 100) / speed : null};
  }).sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity) || a.unit.name.localeCompare(b.unit.name));
  for (const row of rows) {
    row.tie = row.time !== null && rows.some(other => other !== row && other.time !== null && Math.abs(other.time - row.time) < 1e-12);
    row.rank = row.time === null ? null : 1 + rows.filter(other => other.time !== null && other.time < row.time - 1e-12).length;
  }
  return rows;
}

export function rosterCsv(characters) {
  const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const headers = ['Character', 'Unit ID', 'Stars', 'Level', 'Gear', 'Relic', 'Mods',
    ...stats.map(s => s.label + (s.percent ? ' (%)' : '')), 'Speed without mods', 'Speed from mods'];
  const rows = characters.map(u => [u.name, u.id, u.stars, u.level, u.gear, u.relic, u.mods.length,
    ...stats.map(s => u.stats.equipped[s.key] === null ? '' : (s.percent ? Number((u.stats.equipped[s.key] * 100).toFixed(4)) : u.stats.equipped[s.key])),
    u.stats.withoutMods.speed, u.stats.fromMods.speed]);
  return '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
