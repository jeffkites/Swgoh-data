const $ = id => document.getElementById(id);
const rosterRepository = 'jeffkites/Swgoh-data';
const rosterPath = 'data/dashboard.json';
const onGitHubPages = location.hostname === 'jeffkites.github.io';
const githubContentsUrl = `https://api.github.com/repos/${rosterRepository}/contents/${rosterPath}?ref=main`;
const rawSnapshotUrl = `https://raw.githubusercontent.com/${rosterRepository}/main/${rosterPath}`;
let snapshot;

const farmGoals = {
  // Complete Executor prerequisites; incomplete targets are shown first.
  executor: [
    {id:'VADER',name:'Darth Vader',track:'relic',target:7,goal:'R7'},
    {id:'ADMIRALPIETT',name:'Admiral Piett',track:'relic',target:8,goal:'R8'},
    {id:'BOBAFETT',name:'Boba Fett',track:'relic',target:8,goal:'R8'},
    {id:'RAZORCREST',name:'Razor Crest',track:'stars',target:7,goal:'7★'},
    {id:'IG2000',name:'IG-2000',track:'stars',target:7,goal:'7★'},
    {id:'TIEBOMBERIMPERIAL',name:'Imperial TIE Bomber',track:'stars',target:7,goal:'7★'},
    {id:'DENGAR',name:'Dengar',track:'relic',target:5,goal:'R5'},
    {id:'IG88',name:'IG-88',track:'relic',target:5,goal:'R5'},
    {id:'BOSSK',name:'Bossk',track:'relic',target:5,goal:'R5'},
    {id:'TIEFIGHTERPILOT',name:'TIE Fighter Pilot',track:'relic',target:5,goal:'R5'},
    {id:'SLAVE1',name:'Slave I',track:'stars',target:7,goal:'7★'},
    {id:'HOUNDSTOOTH',name:"Hound's Tooth",track:'stars',target:7,goal:'7★'},
    {id:'TIEADVANCED',name:'TIE Advanced x1',track:'stars',target:7,goal:'7★'},
    {id:'TIEFIGHTERIMPERIAL',name:'Imperial TIE Fighter',track:'stars',target:7,goal:'7★'}
  ],
  // Fleet targets support Executor and First Order; they are not all journey prerequisites.
  fleet: [
    {id:'PUNISHINGONE',name:'Punishing One · near-term fleet boost',track:'stars',target:7,goal:'7★'},
    {id:'FIRSTORDERTIEECHELON',name:'TIE Echelon · Finalizer backup project',track:'stars',target:7,goal:'7★'},
    {id:'TIEBOMBERIMPERIAL',name:'Imperial TIE Bomber · completed',track:'stars',target:7,goal:'7★'}
  ],
  slkrBuild: [
    {id:'SUPREMELEADERKYLOREN',name:'SLKR · unlock relics',track:'gear',target:13,goal:'G13'},
    {id:'SUPREMELEADERKYLOREN',name:'SLKR · first milestone',track:'relic',target:5,goal:'R5'},
    {id:'SUPREMELEADERKYLOREN',name:'SLKR · main target',track:'relic',target:7,goal:'R7'},
    {id:'SUPREMELEADERKYLOREN',name:'SLKR · normal abilities complete',track:'manual',goal:'Complete',status:'Owner reports SLKR finished and all six exported normal skill rows now share the upgraded state. No further zeta budget is planned.'},
    {id:'SUPREMELEADERKYLOREN',name:'SLKR · ultimate confirmation only',track:'manual',goal:'Check in game',status:'The public purchased-ability field remains empty, so the ultimate still cannot be independently proved from this export.'}
  ],
  inquisitors: [
    {id:'NINTHSISTER',name:'Ninth Sister · tank token',track:'relic',target:5,goal:'R5'},
    {id:'EIGHTHBROTHER',name:'Eighth Brother · completed attacker token',track:'relic',target:5,goal:'R5'},
    {id:'SECONDSISTER',name:'Second Sister · completed attacker token',track:'relic',target:5,goal:'R5'},
    {id:'SEVENTHSISTER',name:'Seventh Sister · healer token',track:'relic',target:5,goal:'R5'},
    {id:'FIFTHBROTHER',name:'Fifth Brother · completed support token',track:'relic',target:5,goal:'R5'}
  ],
  tokenCandidates: [
    {id:'GREEFKARGA',name:'Greef Karga · Support priority',track:'relic',target:5,goal:'R5'},
    {id:'DAKA',name:'Old Daka · Healer alternative',track:'relic',target:5,goal:'R5'},
    {id:'CT210408',name:'501st Echo · post-GAS Support option',track:'relic',target:5,goal:'R5'},
    {id:'ROYALGUARD',name:'Royal Guard · lower-priority Tank option',track:'relic',target:5,goal:'R5'}
  ],
  // Keep completed unlock requirements available for reference.
  slkr: [
    {id:'KYLORENUNMASKED',name:'Kylo Ren (Unmasked)',track:'relic',target:7,goal:'R7'},
    {id:'FIRSTORDERTROOPER',name:'First Order Stormtrooper',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDEROFFICERMALE',name:'First Order Officer',track:'relic',target:5,goal:'R5'},
    {id:'KYLOREN',name:'Kylo Ren',track:'relic',target:7,goal:'R7'},
    {id:'PHASMA',name:'Captain Phasma',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDEREXECUTIONER',name:'First Order Executioner',track:'relic',target:5,goal:'R5'},
    {id:'SMUGGLERHAN',name:'Veteran Smuggler Han Solo',track:'relic',target:3,goal:'R3'},
    {id:'FOSITHTROOPER',name:'Sith Trooper',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDERSPECIALFORCESPILOT',name:'First Order SF TIE Pilot',track:'relic',target:3,goal:'R3'},
    {id:'GENERALHUX',name:'General Hux',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDERTIEPILOT',name:'First Order TIE Pilot',track:'relic',target:3,goal:'R3'},
    {id:'EMPERORPALPATINE',name:'Emperor Palpatine',track:'relic',target:7,goal:'R7'},
    {id:'CAPITALFINALIZER',name:'Finalizer',track:'stars',target:5,goal:'5★'}
  ],
  era: [
    // The R8 Hutt/Smuggler bundle makes Jabba the best long-term GL after Executor.
    {id:'KRRSANTAN',name:'Krrsantan',track:'relic',target:5,goal:'R5'},
    {id:'HANSOLO',name:'Han Solo',track:'relic',target:8,goal:'R8'},
    {id:'GAMORREANGUARD',name:'Gamorrean Guard',track:'relic',target:3,goal:'R3'},
    {id:'OUTRIDER',name:'Outrider',track:'stars',target:7,goal:'7★'},
    {id:'GREEDO',name:'Greedo',track:'relic',target:6,goal:'R6'},
    {id:'UNDERCOVERLANDO',name:'Skiff Guard',track:'relic',target:5,goal:'R5'},
    {id:'JEDIKNIGHTLUKE',name:'Jedi Knight Luke · major prerequisite tree',track:'relic',target:7,goal:'R7'},
    {id:'JAWA',name:'Jawa',track:'relic',target:3,goal:'R3'},
    {id:'URORRURRR',name:"URoRRuR'R'R",track:'relic',target:4,goal:'R4'},
    {id:'C3POLEGENDARY',name:'C-3PO',track:'relic',target:7,goal:'R7'},
    {id:'BOUSHH',name:'Boushh',track:'relic',target:5,goal:'R5'},
    {id:'AURRA_SING',name:'Aurra Sing',track:'relic',target:6,goal:'R6'},
    {id:'FENNECSHAND',name:'Fennec Shand',track:'relic',target:7,goal:'R7'},
    {id:'BOBAFETT',name:'Boba Fett',track:'relic',target:7,goal:'R7'},
    {id:'HUMANTHUG',name:'Mob Enforcer',track:'relic',target:3,goal:'R3'}
  ]
};
function renderGoalList(containerId, goals) {
  const container = $(containerId);
  const evaluated = goals.map(goal => {
    const unit = snapshot.units.find(u => u.id === goal.id);
    const current = !unit || goal.track === 'manual' ? null
      : goal.track === 'relic' ? (unit.relic ?? 0)
      : goal.track === 'gear' ? (unit.gear ?? 0) : (unit.stars ?? 0);
    return {goal, unit, current, complete:current !== null && current >= goal.target};
  });
  const makeCard = ({goal, unit, current, complete}) => {
    const card = document.createElement('div');
    card.className = 'farm-target';
    const line = document.createElement('div');
    line.className = 'farm-target-line';
    const name = document.createElement('span');
    name.className = 'farm-target-name';
    name.textContent = goal.name;
    const target = document.createElement('span');
    target.className = 'farm-target-goal';
    target.textContent = goal.goal;
    line.append(name, target);
    const status = document.createElement('div');
    status.className = 'farm-target-current' + (complete ? ' done' : '');
    status.textContent = goal.track === 'manual'
      ? (goal.status || 'Check in game · not established by this roster snapshot')
      : !unit ? (goal.releaseDate && new Date() < new Date(goal.releaseDate + 'T00:00:00-07:00')
          ? 'Marquee begins 3 Nov 2026'
          : 'Not unlocked in saved roster')
      : goal.track === 'relic'
        ? (unit.gear != null && unit.gear < 13 ? 'G' + unit.gear + ' · ' : '') + 'R' + current + ' of ' + goal.goal
        : goal.track === 'gear' ? 'G' + current + ' of ' + goal.goal
        : unit.stars + '★ of ' + goal.goal;
    card.append(line, status);
    if (unit && goal.track !== 'manual') {
      const progress = document.createElement('progress');
      progress.max = goal.target;
      progress.value = Math.min(current, goal.target);
      progress.setAttribute('aria-label', goal.name + ' progress to ' + goal.goal);
      card.append(progress);
    }
    return card;
  };
  const outstanding = evaluated.filter(item => !item.complete);
  const completed = evaluated.filter(item => item.complete);
  container.replaceChildren(...outstanding.map(makeCard));
  if (!outstanding.length) {
    const message = document.createElement('p');
    message.className = 'muted plan-note';
    message.textContent = 'All tracked targets complete.';
    container.append(message);
  }
  if (completed.length) {
    const details = document.createElement('details');
    details.className = 'completed-goals';
    const summary = document.createElement('summary');
    summary.textContent = 'Completed targets (' + completed.length + ')';
    details.append(summary, ...completed.map(makeCard));
    container.append(details);
  }
  const summaryNode = $(containerId.replace('-targets', '-summary'));
  const tracked = evaluated.filter(item => item.goal.track !== 'manual').length;
  if (summaryNode) summaryNode.textContent =
    completed.length + ' of ' + tracked + ' tracked targets complete' +
    (evaluated.length > tracked ? ' · ' + (evaluated.length - tracked) + ' manual target' : '');
}
function slkrProgressText(unit) {
  const milestone = (unit.gear ?? 0) < 13 ? 'Finish G13, then R5 and R7.'
    : (unit.relic ?? 0) < 7 ? 'G13 complete; R' + unit.relic + ' saved. Finish R7.'
    : 'R7 target complete. Reserve further relic spending for Executor.';
  return 'SLKR is unlocked. ' + milestone + ' The owner reports the build finished and all exported normal skill rows are upgraded. Only the ultimate remains an in-game verification; SLKR is not the active resource farm.';
}
function modReadiness(unit) {
  if (!unit || !Array.isArray(unit.modLevels)) return null;
  return unit.modLevels.filter(level => level < 15).length;
}
function renderFarmPlan() {
  renderGoalList('executor-targets', farmGoals.executor);
  renderGoalList('fleet-targets', farmGoals.fleet);
  renderGoalList('slkr-targets', farmGoals.slkr);
  renderGoalList('slkr-build-targets', farmGoals.slkrBuild);
  renderGoalList('inquisitor-targets', farmGoals.inquisitors);
  renderGoalList('grievous-targets', farmGoals.tokenCandidates);
  renderGoalList('era-targets', farmGoals.era);
  const unlocked = snapshot.units.some(u => u.name === 'Supreme Leader Kylo Ren');
  const slkrReady = farmGoals.slkr.every(goal => {
    const unit = snapshot.units.find(u => u.id === goal.id);
    return unit && (goal.track === 'relic' ? (unit.relic ?? 0) : unit.stars) >= goal.target;
  });
  $('slkr-status').textContent = unlocked
    ? slkrProgressText(snapshot.units.find(u => u.id === 'SUPREMELEADERKYLOREN'))
    : slkrReady
      ? 'All 13 prerequisites met — you can start Heir to the Dark Side. Earn Dark Side tickets and complete the unlock tiers.'
      : 'Complete the outstanding prerequisites below before beginning the SLKR event.';
  const date = new Date(snapshot.refreshedAt);
  $('farm-freshness').textContent = Number.isFinite(date.getTime())
    ? 'Character and ship progress uses the saved roster · refreshed ' + date.toLocaleString()
    : 'Character and ship progress uses the saved roster.';
}
function render() {
  const query = $('search').value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  const filter = $('filter').value;
  const sort = $('sort').value;
  const shown = snapshot.units.filter(u =>
    (u.name + u.id).toLocaleLowerCase().replace(/[^a-z0-9]/g, '').includes(query) &&
    (filter === 'all' || (filter === 'characters' && u.type === 'Character') ||
     (filter === 'ships' && u.type === 'Ship') || (filter === 'seven' && u.stars === 7) ||
     (filter === 'relic' && u.relic !== null)));
  shown.sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) :
    sort === 'stars' ? b.stars-a.stars || a.name.localeCompare(b.name) :
    (b.relic ?? -1)-(a.relic ?? -1) || (b.gear ?? 0)-(a.gear ?? 0) || a.name.localeCompare(b.name));
  $('count').textContent = shown.length + ' of ' + snapshot.units.length + ' units';
  $('rows').replaceChildren(...shown.map(u => {
    const tr = document.createElement('tr');
    const cells = [u.name, u.type, u.stars + '★', u.level,
      u.type === 'Ship' ? '—' : u.relic !== null ? 'R' + u.relic : u.gear !== null ? 'G' + u.gear : '—',
      u.mods ?? '—'];
    for (const value of cells) {
      const td = document.createElement('td'); td.textContent = String(value); tr.append(td);
    }
    tr.firstChild.title = u.id;
    return tr;
  }));
  $('empty').hidden = shown.length > 0;
  renderFarmPlan();
  renderSquads('5v5');
  renderSquads('3v3');
}
async function fetchSnapshot(url) {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(url + separator + 'v=' + Date.now(), {cache:'no-store'});
  if (!response.ok) throw Error('Roster unavailable (HTTP ' + response.status + ')');
  let data = await response.json();
  if (data.encoding === 'base64') {
    const bytes = Uint8Array.from(atob(data.content), char => char.charCodeAt(0));
    data = JSON.parse(new TextDecoder().decode(bytes));
  }
  if (data.allyCode !== '843153117' || !Array.isArray(data.units) || !data.units.length ||
      !Number.isFinite(Date.parse(data.refreshedAt))) throw Error('Unexpected roster response');
  return data;
}

async function readSnapshot() {
  if (!onGitHubPages) return fetchSnapshot(rosterPath);
  // The raw branch URL can lag behind a successful commit, even with a cache-busting query.
  try {
    return await fetchSnapshot(githubContentsUrl);
  } catch {
    return fetchSnapshot(rawSnapshotUrl);
  }
}

function showSnapshot(data) {
  if (snapshot && Date.parse(data.refreshedAt) < Date.parse(snapshot.refreshedAt)) return;
  snapshot = data;
  $('name').textContent = data.name;
  $('guild').textContent = data.guild;
  $('ally').textContent = data.allyCode;
  $('total').textContent = data.units.length;
  $('seven').textContent = data.units.filter(u => u.stars === 7).length;
  $('g13').textContent = data.units.filter(u => u.type === 'Character' && u.gear === 13).length;
  $('fleet').textContent = data.arena['2'] ? '#' + data.arena['2'] : '—';
  const date = new Date(data.refreshedAt);
  const valid = date.getTime() <= Date.now() + 300000;
  const old = valid && Date.now() - date.getTime() > 86400000;
  $('freshness').textContent = valid
    ? 'Saved ' + date.toLocaleString() + (old ? ' · More than 24 hours old' : '')
    : 'Refresh time unavailable';
  $('freshness').classList.toggle('warning', !valid || old);
  render();
}

async function load() {
  $('reload').disabled = true;
  try {
    showSnapshot(await readSnapshot());
    $('status').textContent = '';
    return true;
  } catch (error) {
    $('status').textContent = (snapshot ? 'Keeping the previous view. ' : '') +
      error.message + '. Try reloading the saved roster.';
    return false;
  } finally {
    $('reload').disabled = false;
  }
}
$('search').addEventListener('input', () => snapshot && render());
$('filter').addEventListener('change', () => snapshot && render());
$('sort').addEventListener('change', () => snapshot && render());
$('reload').addEventListener('click', async () => {
  const prior = snapshot?.refreshedAt;
  if (!await load()) return;
  if (snapshot?.refreshedAt && snapshot.refreshedAt !== prior) {
    $('refresh-status').textContent = 'New roster loaded · ' +
      new Date(snapshot.refreshedAt).toLocaleString();
  } else if (snapshot?.refreshedAt) {
    $('refresh-status').textContent = 'Saved roster unchanged · ' +
      new Date(snapshot.refreshedAt).toLocaleString();
  }
});

const privateApiBase = 'https://swgoh-data.mrfaberzen.workers.dev';
// A Pages site cannot securely dispatch GitHub Actions itself. The Worker holds
// the server-side GitHub credential and authenticates the dashboard access token.
const pollDelayMs = 15000;
const pollMaximumMs = 10 * 60 * 1000;

// Read-only workflow status, so the mobile dashboard can diagnose a failed
// GitHub action without requiring navigation to GitHub or a browser token.
async function checkRefreshStatus() {
  const button = $('check-refresh');
  const status = $('workflow-status');
  button.disabled = true;
  status.textContent = 'Checking GitHub refresh status…';
  try {
    const response = await fetch(privateApiBase + '/api/roster/status', {cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Status request failed (HTTP ' + response.status + ')');
    // Prefer the newest workflow run. An older failed manual run must not
    // conceal a newer successful automatic roster refresh.
    const run = data.active || data.latest || data.latestManual;
    if (!run) {
      status.textContent = 'No roster refresh runs found.';
      return;
    }
    const when = run.createdAt && Number.isFinite(Date.parse(run.createdAt))
      ? new Date(run.createdAt).toLocaleString() : 'unknown time';
    const trigger = run.event === 'workflow_dispatch' ? 'Button/manual refresh'
      : run.event === 'schedule' ? 'Scheduled refresh'
      : run.event === 'push' ? 'Automatic code-change refresh' : 'Roster refresh';
    const state = run.status !== 'completed'
      ? 'currently ' + String(run.status).replaceAll('_',' ')
      : run.conclusion === 'success' ? 'completed successfully'
      : run.conclusion === 'failure' ? 'failed' : 'finished: ' + (run.conclusion || 'unknown');
    status.textContent = trigger + ' · ' + when + ' · ' + state +
      (run.conclusion === 'failure' && data.failedStep ? ' · Failed step: ' + data.failedStep : '') +
      (run.conclusion === 'success' ? '. Reload saved roster to see the latest snapshot.' : '.');
  } catch (error) {
    status.textContent = 'Could not check the workflow: ' + error.message;
  } finally {
    button.disabled = false;
  }
}
$('check-refresh').addEventListener('click', checkRefreshStatus);

async function refreshFromGame() {
  const button = $('trigger-refresh');
  const status = $('refresh-status');
  const previousRefreshAt = snapshot ? Date.parse(snapshot.refreshedAt) : 0;
  button.disabled = true;
  status.textContent = 'Sending secure roster refresh request…';
  try {
    const response = await fetch(privateApiBase + '/api/roster/refresh', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: '{}',
      cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok) {
      throw Error(result.error || 'Roster refresh was not accepted (HTTP ' + response.status + ')');
    }
    if (result.recentlyRequested) {
      await load();
      status.textContent = result.message || 'A roster refresh is already running or was requested recently.';
      return;
    }
    if (!result.queued) throw Error('Roster refresh response was not recognized.');
    status.textContent = 'Refresh requested. Checking for the updated roster automatically…';
    const began = Date.now();
    while (Date.now() - began < pollMaximumMs) {
      await new Promise(resolve => setTimeout(resolve, pollDelayMs));
      let data;
      try {
        data = await readSnapshot();
      } catch {
        continue;
      }
      if (Date.parse(data.refreshedAt) > previousRefreshAt) {
        showSnapshot(data);
        $('status').textContent = '';
        status.textContent = 'Roster refreshed from the game · ' +
          new Date(snapshot.refreshedAt).toLocaleString();
        return;
      }
    }
    status.textContent = 'Refresh requested, but no newer snapshot was found within 10 minutes. Try Reload saved roster or check the manual GitHub fallback for workflow errors.';
  } catch (error) {
    status.textContent = 'Could not start roster refresh: ' + error.message;
  } finally {
    button.disabled = false;
  }
}
$('trigger-refresh').addEventListener('click', refreshFromGame);

// Keep a standard password form for Android password-manager autofill.
// The secret is not persisted to browser storage by site code.
$('private-key-form').addEventListener('submit', event => event.preventDefault());

async function readTwUnitCatalog() {
  try {
    const response = await fetch('data/unit-catalog.json');
    return response.ok ? (await response.json()).units : null;
  } catch {
    return null;
  }
}

function formatTwSnapshot(data, loadedAt, catalog) {
  const war = data?.data;
  const zones = war?.awayGuild?.conflictStatus;
  if (!Array.isArray(zones)) return '';

  const rosterNames = new Map((snapshot?.units ?? []).map(unit => [unit.id, unit.name]));
  const unitName = unit => {
    const id = unit?.unitDefId?.split(':')[0];
    return catalog?.[id]?.name ?? rosterNames.get(id) ?? id ?? 'Unknown unit';
  };
  const rarities = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];
  const describeDefender = cell => {
    const stats = cell.unitBattleStat ?? {};
    const rarity = cell.unitDefId?.split(':')[1]?.replace('_STAR', '');
    const stars = rarities.indexOf(rarity) + 1;
    const details = [];
    if (stars && (stars < 7 || cell.squadUnitType === 3 || stats.tier === 1)) details.push(stars + '★');
    if (stats.unitRelicTier >= 2) details.push('R' + (stats.unitRelicTier - 2));
    else if (stats.tier > 1) details.push('G' + stats.tier);

    const state = cell.unitState ?? {};
    const health = Number.parseFloat(state.healthPercent);
    const protection = Number.parseFloat(state.shieldPercent);
    const turnMeter = Number.parseFloat(state.turnPercent);
    if (state.hasFled) details.push('fled');
    else if (health === 0) details.push('defeated');
    else {
      if (health < 100) details.push('HP ' + Math.round(health) + '%');
      if (protection < 100) details.push('prot ' + Math.round(protection) + '%');
      if (turnMeter > 0) details.push('TM ' + Math.round(turnMeter) + '%');
    }
    const role = cell.squadUnitType === 2 ? ' (lead)' : '';
    return [unitName(cell) + role, ...details].join(' ');
  };

  const localTime = date => date.toLocaleString('en-AU', {timeZoneName:'short'});
  const lines = [
    'SWGOH Territory War — ' + (war.homeGuild?.profile?.name ?? 'Home guild') +
      ' vs ' + (war.awayGuild?.profile?.name ?? 'Unknown opponent'),
    'Loaded ' + localTime(loadedAt)
  ];
  if (+war.currentRoundEndTime > 0) {
    lines.push('Current phase ends ' + localTime(new Date(+war.currentRoundEndTime)));
  }
  // Zone state 3 is open for attack. Defeated squads (status 3) remain in the response.
  const openZones = zones.filter(zone => zone.zoneStatus?.zoneState === 3);
  if (!openZones.length) lines.push('', 'No open enemy territories in this snapshot.');
  for (const zone of openZones) {
    const remaining = (zone.warSquad ?? []).filter(squad => squad.squadStatus !== 3);
    const zoneId = zone.zoneStatus.zoneId?.match(/phase(\d+)_conflict(\d+)$/);
    const title = zoneId
      ? 'Row ' + Number(zoneId[1]) + ', territory ' + Number(zoneId[2])
      : zone.zoneStatus.zoneId ?? 'Open territory';
    lines.push('', title + ' | ' + (zone.squadCount ?? remaining.length) + ' remaining' +
      (zone.squadCapacity ? ' / ' + zone.squadCapacity + ' slots' : ''));
    if (zone.zoneStatus.commandMessage) lines.push('Guild order — ' + zone.zoneStatus.commandMessage);
    for (const squad of remaining) {
      const cells = [...(squad.squad?.cell ?? [])].sort((a, b) => a.cellIndex - b.cellIndex);
      const starters = cells.filter(cell => cell.squadUnitType !== 5).map(describeDefender);
      const reinforcements = cells.filter(cell => cell.squadUnitType === 5).map(describeDefender);
      const power = squad.power == null ? 'GP unknown' : Number(squad.power).toLocaleString('en-AU') + ' GP';
      const row = [power, squad.playerName, starters.join(', ')];
      if (reinforcements.length) row.push('reinforcements ' + reinforcements.join(', '));
      if (squad.successfulDefends) row.push('holds ' + squad.successfulDefends);
      if (squad.lockName) row.push('engaged by ' + squad.lockName);
      const datacron = squad.squad?.datacron;
      if (datacron) {
        const abilities = (datacron.affix ?? []).map(affix => affix.abilityId).filter(Boolean);
        row.push(['datacron ' + (datacron.templateId || datacron.setId), ...abilities].join(', '));
      }
      const upgrades = cells.flatMap(cell => (cell.unitBattleStat?.skill ?? [])
        .filter(skill => skill.tier >= 6)
        .map(skill => skill.id + ' L' + (+skill.tier + 2)));
      if (upgrades.length) row.push('abilities ' + upgrades.join(', '));
      lines.push('- ' + row.filter(Boolean).join(' | '));
    }
  }

  if (Array.isArray(war.playerStatus?.unitStatus)) {
    const roster = new Map((war.playerStatus.warRoster ?? []).map(unit => [unit.unitId, unit]));
    const defenceIds = new Set((war.homeGuild?.conflictStatus ?? [])
      .flatMap(zone => (zone.warSquad ?? [])
        .flatMap(squad => (squad.squad?.cell ?? []).map(cell => cell.unitId))));
    const defence = [];
    const attack = [];
    for (const status of war.playerStatus.unitStatus) {
      const used = defenceIds.has(status.unitId) ? defence : attack;
      used.push(unitName(roster.get(status.unitId)));
    }
    lines.push('', 'My units on defence — ' + (defence.sort().join(', ') || 'None shown'),
      'My units spent on attack — ' + (attack.sort().join(', ') || 'None shown'));
  }
  return lines.join('\n');
}

const twCopyText = $('tw-copy-text');
const twCopyStatus = $('tw-copy-status');

function showTwCopy(text) {
  twCopyText.value = text;
  twCopyText.hidden = true;
  twCopyStatus.textContent = '';
  $('tw-copy-controls').hidden = !text;
}

$('copy-tw-snapshot').addEventListener('click', async () => {
  const text = twCopyText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (twCopyText.value !== text) return;
    twCopyText.hidden = true;
    twCopyStatus.textContent = 'Copied. Paste the snapshot into ChatGPT.';
  } catch {
    if (twCopyText.value !== text) return;
    twCopyText.hidden = false;
    twCopyText.focus();
    twCopyText.select();
    twCopyStatus.textContent = 'Copy the selected text, then paste it into ChatGPT.';
  }
});

async function loadPrivateData(resource, button) {
  const token = $('access-token').value;
  const status = $('private-status');
  const output = $('private-output');
  if (!token) {
    status.textContent = 'Enter the Cloudflare dashboard access token first.';
    $('access-token').focus();
    return;
  }
  showTwCopy('');
  button.disabled = true;
  status.textContent = 'Requesting ' + resource.toUpperCase() + ' data…';
  try {
    const catalog = resource === 'tw' ? readTwUnitCatalog() : null;
    const response = await fetch(privateApiBase + '/api/private/' + encodeURIComponent(resource), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: '{}',
      cache: 'no-store'
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Request failed (HTTP ' + response.status + ')');
    const loadedAt = new Date();
    const copyText = resource === 'tw' ? formatTwSnapshot(data, loadedAt, await catalog) : '';
    output.textContent = JSON.stringify(data, null, 2);
    if (resource === 'gac' && window.GacScout?.renderLive) window.GacScout.renderLive(data);
    showTwCopy(copyText);
    status.textContent = resource.toUpperCase() + ' data loaded at ' + loadedAt.toLocaleTimeString() +
      (response.headers.get('X-Snapshot-Saved') === 'true'
        ? ' and saved to your private GitHub repository.'
        : '. Live data is shown below, but the private GitHub snapshot was not saved. ' +
          (response.headers.get('X-Snapshot-Error') || 'Try loading again to retry the save.'));
  } catch (error) {
    status.textContent = 'Could not load ' + resource.toUpperCase() + ': ' + error.message;
  } finally {
    button.disabled = false;
  }
}
document.querySelectorAll('[data-private]').forEach(button => {
  button.addEventListener('click', () => loadPrivateData(button.dataset.private, button));
});

load();

// Each tab has a stable hash, so links and Back work on mobile.
function activateDashboardTab(id, updateHash = true) {
  if (![...document.querySelectorAll('[data-tab]')].some(button => button.dataset.tab === id)) id = 'farm-plan';
  document.querySelectorAll('[data-tab]').forEach(button => {
    const selected = button.dataset.tab === id;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll('.tab-panel').forEach(panel => { panel.hidden = panel.id !== id; });
  if (updateHash && location.hash !== '#' + id) location.hash = id;
}
function activateGoalTab(id) {
  document.querySelectorAll('[data-goal-tab]').forEach(button => {
    const selected = button.dataset.goalTab === id;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    $('goal-' + button.dataset.goalTab).hidden = !selected;
  });
}
function wireTabs(selector, activate) {
  const buttons = [...document.querySelectorAll(selector)];
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault(); buttons[next].focus(); activate(buttons[next]);
    });
  });
}
wireTabs('[data-tab]', button => activateDashboardTab(button.dataset.tab));
wireTabs('[data-goal-tab]', button => activateGoalTab(button.dataset.goalTab));
window.addEventListener('hashchange', () => activateDashboardTab(location.hash.slice(1), false));
activateDashboardTab(location.hash.slice(1), false);

function squadElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function renderSquads(mode) {
  const container = $('squad-list-' + mode);
  const query = $('squad-search-' + mode).value.trim().toLocaleLowerCase();
  const filter = $('squad-filter-' + mode).value;
  const plans = squadPlans[mode];
  const assigned = new Map();
  plans.filter(s => !s.project).forEach(s => s.members.forEach(id => assigned.set(id, s.name)));
  const openNames = new Set([...container.querySelectorAll('details[open]')].map(d => d.dataset.squad));
  container.replaceChildren();
  let rank = 0, shown = 0, projectHeading = false;
  plans.forEach(squad => {
    if (!squad.project) rank++;
    const members = squad.members.map(id => snapshot.units.find(u => u.id === id));
    const names = members.map((u,i) => u?.name || squad.members[i]);
    if (filter === 'main' && squad.project || filter === 'project' && !squad.project) return;
    if (!(squad.name + ' ' + names.join(' ')).toLocaleLowerCase().includes(query)) return;
    if (squad.project && !projectHeading) {
      container.append(squadElement('h3','squad-section-title','Needs work / alternative allocations'));
      projectHeading = true;
    }
    shown++;
    const missing = members.filter(u => !u).length;
    const modGaps = members.reduce((sum,u) => sum + (u ? Math.max(0, 6 - (u.mods ?? 0)) : 0), 0);
    const lowMods = members.reduce((sum,u) => sum + (modReadiness(u) ?? 0), 0);
    const unknownMods = members.some(u => u && modReadiness(u) === null);
    const lowGear = members.filter(u => u && (u.gear ?? 0) < 12).length;
    const card = squadElement('details','squad-card'); card.dataset.squad = squad.name;
    card.open = openNames.has(squad.name);
    const summary = squadElement('summary');
    const top = squadElement('div','squad-top');
    top.append(squadElement('span','squad-rank',squad.project ? '↗' : '#' + rank), squadElement('span','squad-title',squad.name),squadElement('span','squad-open','+'));
    summary.append(top,squadElement('p','squad-members', names.map((name,i) => name + (i === 0 ? ' (L)' : '')).join(' · ')));
    const tags = squadElement('div','squad-tags');
    tags.append(squadElement('span','badge',squad.role));
    tags.append(squadElement('span','badge' + (modGaps || missing ? ' warn' : ''),missing ? missing + ' not unlocked' : modGaps ? modGaps + ' empty mod slots' : 'Full mod slots · verify quality'));
    if (lowMods) tags.append(squadElement('span','badge warn',lowMods + ' mods below level 15'));
    if (unknownMods) tags.append(squadElement('span','badge warn','Mod levels unavailable'));
    if (lowGear) tags.append(squadElement('span','badge warn',lowGear + ' below G12'));
    summary.append(tags); card.append(summary);
    const detail = squadElement('div','squad-detail');
    detail.append(squadElement('p','',squad.note),squadElement('p','warning','Before battle: ' + squad.check));
    if (squad.project) {
      const overlaps = [...new Set(squad.members.map(id => assigned.get(id)).filter(Boolean))];
      if (overlaps.length) detail.append(squadElement('p','warning','Shares characters with: ' + overlaps.join(', ') + '. Choose one allocation; these are not extra independent squads.'));
    }
    members.forEach((unit,i) => {
      const row = squadElement('div','unit-line');
      row.append(squadElement('span','',names[i] + (i === 0 ? ' · Leader' : '')));
      row.append(squadElement('span','',unit ? unit.stars + '★ · ' + (unit.relic !== null ? 'R' + unit.relic : 'G' + unit.gear) + ' · ' + unit.mods + '/6 mods' + (modReadiness(unit) === null ? ' · levels unknown' : ' · ' + modReadiness(unit) + ' below level 15') : 'Not unlocked in saved roster'));
      detail.append(row);
    });
    card.append(detail); container.append(card);
  });
  if (!shown) container.append(squadElement('p','squad-empty','No squads match. Try another character or show all squads.'));
  $('squad-count-' + mode).textContent = shown + ' of ' + plans.length + ' squads shown';
  $('squad-freshness-' + mode).textContent = 'Order reviewed 24 Nov 2026 · live roster ' + new Date(snapshot.refreshedAt).toLocaleString();
}
['5v5','3v3'].forEach(mode => {
  $('squad-search-' + mode).addEventListener('input', () => snapshot && renderSquads(mode));
  $('squad-filter-' + mode).addEventListener('change', () => snapshot && renderSquads(mode));
});
