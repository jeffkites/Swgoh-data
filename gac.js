// GAC scouting dashboard. Private snapshots remain behind the existing Worker token.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const API = 'https://swgoh-data.mrfaberzen.workers.dev';
  const OWN_ALLY = '843153117';
  let latest = null;
  let names = {};
  let currentOpponentName = '';

  const normalizeCode = value => String(value || '').replace(/\D/g, '');
  const codeIsValid = value => /^[0-9]{9}$/.test(normalizeCode(value));
  const humanDate = value => value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString('en-AU', {dateStyle:'medium',timeStyle:'short'}) : 'Unknown';
  const unitName = id => names[id]?.name || names[id] || String(id || 'Unknown').replaceAll('_', ' ');
  const unitLabel = unit => unitName(unit.id) +
    (unit.relic > 0 ? ' R' + unit.relic : unit.gear > 1 ? ' G' + unit.gear : '');
  const add = (parent, tag, text, css) => {
    const el = document.createElement(tag);
    if (css) el.className = css;
    el.textContent = text;
    parent.append(el);
    return el;
  };
  const savedCodeKey = name => 'gac-allycode:' + name.trim().toLowerCase();
  const notesKey = code => 'gac-scout-notes:' + code;

  function setLinks() {
    const code = normalizeCode($('gac-opp-code').value);
    const valid = codeIsValid(code);
    const links = [
      [$('gac-link-planner'), valid ? 'https://swgohtools.com/gac-planner/' + OWN_ALLY + '/' + code : 'https://swgohtools.com/gac-planner'],
      [$('gac-link-scout'), 'https://swgohtools.com/gac-scout'],
      [$('gac-link-history'), valid ? 'https://swgoh.gg/p/' + code + '/gac-history/' : 'https://swgoh.gg/']
    ];
    for (const [link, url] of links) {
      link.href = url;
      link.title = valid ? 'Opponent ' + code : 'Enter an opponent ally code first';
    }
    $('gac-code-status').textContent = valid
      ? 'Ready to scout ally code ' + code + '. Scout may ask you to paste the code.'
      : 'Enter the opponent’s 9-digit ally code to create player-specific links.';
  }

  function renderZones(containerId, zones, side) {
    const container = $(containerId);
    container.replaceChildren();
    if (!Array.isArray(zones) || !zones.length) {
      add(container, 'p', side === 'enemy'
        ? 'No opponent zones were included in this snapshot. Predictions are not confirmed defenders.'
        : 'No defence zones in this snapshot.', 'muted');
      return;
    }
    for (const [index, zone] of zones.entries()) {
      const box = add(container, 'article', '', 'gac-zone');
      const match = String(zone.id || '').match(/phase0?(\d+)_conflict0?(\d+)/);
      const area = match ? 'Row ' + Number(match[1]) + ' · zone ' + Number(match[2]) : 'Zone ' + (index + 1);
      const squads = zone.squads || [];
      const remaining = squads.filter(s => s.status !== 3);
      add(box, 'h4', area + ' · ' + remaining.length + ' remaining');
      const score = Number(zone.score || 0);
      add(box, 'div', 'Score ' + score + (zone.attemptCompleted ? ' · attempts completed' : ''), 'muted');
      if (!squads.length) {
        add(box, 'p', 'No squads reported', 'muted');
        continue;
      }
      for (const squad of squads) {
        const p = add(box, 'p', '', 'gac-squad-line');
        const lead = squad.units?.[0];
        add(p, 'strong', lead ? unitName(lead.id) : 'Unknown leader');
        const remainingNames = (squad.units || []).slice(1).map(unitLabel);
        if (remainingNames.length) add(p, 'span', ' · ' + remainingNames.join(', '));
        if (squad.status === 3) add(p, 'span', ' · defeated', 'muted');
        if (squad.successfulDefends) add(p, 'span', ' · ' + squad.successfulDefends + ' holds', 'gac-hold');
        if (squad.datacronId) add(p, 'span', ' · datacron', 'muted');
      }
    }
  }

  function renderSummary(value, fromLive = false) {
    latest = value;
    const opponent = value.opponent || {};
    $('gac-opponent-name').textContent = opponent.name || 'Opponent unknown';
    $('gac-round').textContent = 'Round ' + (value.round ?? '?') +
      ' · ' + (value.phase === 2 ? 'Attack' : value.phase === 5 ? 'Round transition / review' : 'Phase ' + (value.phase ?? '?'));
    $('gac-freshness').textContent = 'GAC data fetched ' + humanDate(value.sourceFetchedAt) +
      (fromLive ? ' · directly from the game' : ' · private GitHub summary');
    $('gac-guild').textContent = opponent.guild ? 'Guild: ' + opponent.guild : '';
    $('gac-end').textContent = value.matchEndsAt ? 'Match ends ' + humanDate(+value.matchEndsAt) : '';
    if (opponent.name !== currentOpponentName) {
      currentOpponentName = opponent.name || '';
      const storedCode = currentOpponentName && localStorage.getItem(savedCodeKey(currentOpponentName));
      // Avoid keeping the previous opponent's code when the matchup changes.
      $('gac-opp-code').value = storedCode || (currentOpponentName === 'Arcane SubZer0' ? '681756884' : '');
      setLinks();
      loadNotes();
    }
    renderZones('gac-enemy-zones', value.away?.zones, 'enemy');
    renderZones('gac-my-zones', value.home?.zones, 'home');
    $('gac-loading').textContent = 'Showing saved data. A new round may not expose enemy placements until attack opens.';
  }

  function compactLive(data) {
    const root = data?.data?.gacData || data?.gacData;
    if (!root) return null;
    const match = root.matchStatus?.[0] || {};
    const baseId = id => String(id || '').split(':')[0];
    const teams = raw => (raw?.duelStatus || []).map(zone => ({
      id: zone.zoneStatus?.zoneId, score: zone.zoneStatus?.score,
      attemptCompleted: zone.zoneAttemptCompleted,
      squads: (zone.warSquad || []).map(squad => ({
        status: squad.squadStatus, successfulDefends: squad.successfulDefends,
        datacronId: squad.squad?.datacron?.id,
        units: (squad.squad?.cell || []).map(cell => ({
          id: baseId(cell.unitDefId || cell.unitBaseId),
          gear: cell.unitBattleStat?.tier || 1,
          relic: Math.max(0, Number(cell.unitBattleStat?.unitRelicTier || 2) - 2)
        }))
      }))
    }));
    return {
      sourceFetchedAt: new Date().toISOString(), phase: match.matchState,
      round: match.currentRound, matchEndsAt: Number(root.currentMatchEndTime),
      opponent: { name: match.opponent?.name, guild: match.opponent?.guildName },
      home: {zones: teams(match.homeStatus)}, away: {zones: teams(match.awayStatus)}
    };
  }

  function renderLive(data) {
    const summary = compactLive(data);
    if (summary) renderSummary(summary, true);
  }

  function loadNotes() {
    const code = normalizeCode($('gac-opp-code').value);
    $('gac-scout-notes').value = codeIsValid(code) ? localStorage.getItem(notesKey(code)) || '' : '';
  }

  async function loadSavedGac() {
    const token = $('access-token').value;
    const status = $('gac-loading');
    if (!token) {
      status.textContent = 'Enter your dashboard key in the Private data tab first, then load the saved GAC.';
      return;
    }
    const button = $('gac-load');
    button.disabled = true;
    status.textContent = 'Loading private GAC summary…';
    try {
      const response = await fetch(API + '/api/private/gac-summary', {
        headers: {Authorization: 'Bearer ' + token}, cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'HTTP ' + response.status);
      if (result.kind !== 'gac') throw new Error('Unexpected GAC summary format');
      renderSummary(result);
    } catch (error) {
      status.textContent = 'Unable to load saved GAC: ' + error.message;
    } finally {
      button.disabled = false;
    }
  }

  $('gac-load').addEventListener('click', loadSavedGac);
  $('gac-refresh').addEventListener('click', () => {
    if (!$('access-token').value) {
      $('gac-loading').textContent = 'First enter your access key under Private data.';
      return;
    }
    if (typeof loadPrivateData === 'function') loadPrivateData('gac', $('gac-refresh'));
  });
  $('gac-opp-code').addEventListener('input', () => {setLinks(); loadNotes();});
  $('gac-save-code').addEventListener('click', () => {
    const code = normalizeCode($('gac-opp-code').value);
    if (!currentOpponentName || !codeIsValid(code)) {
      $('gac-code-status').textContent = 'Load a matchup and enter a valid 9-digit ally code first.';
      return;
    }
    localStorage.setItem(savedCodeKey(currentOpponentName), code);
    $('gac-code-status').textContent = 'Saved ally code for ' + currentOpponentName + ' on this device.';
  });
  $('gac-save-notes').addEventListener('click', () => {
    const code = normalizeCode($('gac-opp-code').value);
    if (!codeIsValid(code)) {
      $('gac-notes-status').textContent = 'Enter a valid opponent ally code first.';
      return;
    }
    localStorage.setItem(notesKey(code), $('gac-scout-notes').value.slice(0, 16000));
    $('gac-notes-status').textContent = 'Scouting notes saved on this device only; not synced to GitHub.';
  });
  $('gac-copy').addEventListener('click', async () => {
    if (!latest) {
      $('gac-loading').textContent = 'Load your GAC snapshot first.';
      return;
    }
    const code = normalizeCode($('gac-opp-code').value);
    const describe = (name, zones) => (zones || []).map(z =>
      String(z.id || '') + ': ' + (z.squads || []).map(s =>
        (s.units || []).map(unitLabel).join(' / ') +
        (s.status === 3 ? ' [defeated]' : '')).join('; ')).join('\n');
    const text = [
      'GAC snapshot ' + humanDate(latest.sourceFetchedAt),
      'Opponent: ' + (latest.opponent?.name || 'Unknown') + (codeIsValid(code) ? ' · ally code ' + code : ''),
      'Round ' + (latest.round ?? '?') + ' phase ' + (latest.phase ?? '?'),
      'Opponent zones (observed):\n' + describe('', latest.away?.zones),
      'My defence:\n' + describe('', latest.home?.zones),
      'External scouting notes (unverified):\n' + $('gac-scout-notes').value
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      $('gac-loading').textContent = 'GAC scouting summary copied for ChatGPT.';
    } catch {
      $('gac-loading').textContent = 'Clipboard unavailable. Use a supported browser or copy the visible details.';
    }
  });
  fetch('data/unit-catalog.json').then(r => r.ok ? r.json() : null)
    .then(data => {names = data?.units || {}; if (latest) renderSummary(latest);}).catch(() => {});
  setLinks();
  window.GacScout = {renderLive, loadSavedGac};
})();
