// Pestaña "Cuartel" de la ficha: El Cuartel de SeniorUrraca (api/src/quarters/). El estado viene en viewer.quarters
// y lo que existe (misiones, seguidores, suministros, facciones) en GET /quarters. Solo se juega desde la armería, con sesión
const QUARTERS_VIEWS = { board: 'Tablón', away: 'En misión', followers: 'Seguidores', reputation: 'Reputación', supplies: 'Suministros' };
const AVATAR = 'avatar';
const SUPPLY_FOR = { all: 'todo el grupo', tank: 'el tanque', healer: 'los sanadores', physical: 'cuerpo a cuerpo y cazadores', caster: 'los lanzadores' };
let quartersCatalog = null;
let quartersCatalogLoad = null;
let quartersView = 'board';
// Hasta el lanzamiento (Parche 1.1) la pestaña solo la ve el streamer, para probarla
const QUARTERS_LAUNCH = Date.parse('2026-10-09T00:00:00-03:00');
const quartersOpen = () => Date.now() >= QUARTERS_LAUNCH || signedInUser?.login === CHANNEL;

const loadQuartersCatalog = () => quartersCatalogLoad ||= fetch(`${API_URL}/quarters`).then(res => res.json()).then(c => { quartersCatalog = c; });
const catalogEntry = (list, id) => list.find(entry => entry.id === id);
const rankOf = q => quartersCatalog.ranks.filter(needed => q.successes >= needed).length;
const supplyUrl = id => (id.startsWith('spell-') ? spellUrl(id.slice(6)) : itemUrl(id));

function followerOf(viewer, id) {
  if (id === AVATAR) return { id, name: viewer.name, class: viewer.quarters.avatarClass };
  return catalogEntry(quartersCatalog.followers, id);
}

const ownedFollowers = viewer => [AVATAR, ...viewer.quarters.recruits].map(id => followerOf(viewer, id));
const busyIds = q => q.active.flatMap(a => a.followers);
const abilitiesOf = follower => quartersCatalog.classAbilities[follower.class] || [];
const abilityIcons = follower => abilitiesOf(follower).map(key =>
  `<img class="q-icon" src="${iconUrl(quartersCatalog.abilities[key].icon)}" alt="" title="${escapeHtml(quartersCatalog.abilities[key].name)}">`).join('');
const followerName = follower => `<span style="color:${CLASSES[follower.class]?.color || NO_CLASS.color}">${escapeHtml(follower.name)}</span>`;

// Igual que la API (src/quarters/missions.js): cada amenaza la contrarresta un seguidor distinto
function counteredCount(counters, abilitySets) {
  if (!counters.length) return 0;
  const [counter, ...rest] = counters;
  const withThis = abilitySets.map((abilities, i) =>
    (abilities.includes(counter) ? 1 + counteredCount(rest, abilitySets.filter((_, j) => j !== i)) : 0));
  return Math.max(counteredCount(rest, abilitySets), ...withThis);
}

function chanceOf(mission, followers) {
  if (!mission.threats.length) return 1;
  const done = counteredCount(mission.threats.map(key => quartersCatalog.threats[key].counter), followers.map(abilitiesOf));
  return quartersCatalog.baseSuccess + (1 - quartersCatalog.baseSuccess) * done / mission.threats.length;
}

function duration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes / 60} h`;
}

function remaining(ends) {
  const seconds = Math.max(0, Math.round((ends - Date.now()) / 1000));
  if (!seconds) return '¡Volvió!';
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------- Vistas ----------

function missionCard(viewer, missionId, free) {
  const mission = catalogEntry(quartersCatalog.missions, missionId);
  const slots = Math.max(1, mission.threats.length);
  const threats = mission.threats.map(key => quartersCatalog.threats[key])
    .map(t => `<img class="q-icon" src="${iconUrl(t.icon)}" alt="" title="${escapeHtml(t.name)}: la contrarresta ${escapeHtml(quartersCatalog.abilities[t.counter].name)}">`).join('');
  const options = free.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  const pickers = Array.from({ length: slots }, (_, i) =>
    `<select class="q-follower">${free.map((f, j) => `<option value="${f.id}"${j === i ? ' selected' : ''}>${escapeHtml(f.name)}</option>`).join('') || options}</select>`).join('');
  const rank = mission.rank - 1;
  const reward = [`+${quartersCatalog.reputationByRank[rank]} con ${quartersCatalog.factions[mission.faction].name}`,
    moneyHtml(quartersCatalog.goldByRank[rank]), `un suministro de nivel ${quartersCatalog.supplyTierByRank[rank]}`].join(' · ');
  const action = !canActHere() ? ''
    : free.length < slots ? `<p class="hint">Pide ${slots} seguidor(es) libres.</p>`
    : '<button class="wow-button q-send" type="button">Enviar</button>';

  return `
    <article class="q-mission" data-id="${mission.id}">
      <header><strong>${escapeHtml(mission.name)}</strong><span>⏱ ${duration(mission.minutes)}</span></header>
      <p class="q-place">${escapeHtml(mission.zone)}</p>
      ${threats ? `<p class="q-threats">Amenazas: ${threats}</p>` : ''}
      <p class="q-reward">${reward}</p>
      ${canActHere() && free.length >= slots ? `<div class="q-team">${pickers}<span class="q-chance"></span></div>` : ''}
      ${action}
      <p class="ah-warning q-problem" hidden></p>
    </article>`;
}

function boardView(viewer) {
  const q = viewer.quarters;
  const free = ownedFollowers(viewer).filter(f => !busyIds(q).includes(f.id));
  if (!q.offers.length) return '<p class="hint">No hay misiones en el tablón: espera a que vuelvan tus seguidores.</p>';
  return q.offers.map(id => missionCard(viewer, id, free)).join('');
}

function awayView(viewer) {
  const q = viewer.quarters;
  if (!q.active.length) return '<p class="hint">Nadie está de misión.</p>';
  const rows = q.active.map(entry => {
    const mission = catalogEntry(quartersCatalog.missions, entry.mission);
    const team = entry.followers.map(id => followerName(followerOf(viewer, id))).join(', ');
    return `<li><strong>${escapeHtml(mission.name)}</strong> · ${team} · ${Math.round(entry.chance * 100)} % de éxito · <span class="q-timer" data-ends="${entry.ends}">${remaining(entry.ends)}</span></li>`;
  }).join('');
  const claim = canActHere() ? '<button class="wow-button q-claim" type="button" disabled>Cobrar las que volvieron</button><p class="ah-warning q-problem" hidden></p>' : '';
  return `<ul class="q-list">${rows}</ul>${claim}`;
}

function followersView(viewer) {
  const q = viewer.quarters;
  const busy = busyIds(q);
  const next = quartersCatalog.recruitAt.find(n => n > q.successes);
  const rows = ownedFollowers(viewer).map(f =>
    `<li>${followerName(f)} ${abilityIcons(f)} <span class="q-state">${busy.includes(f.id) ? 'De misión' : 'Libre'}</span></li>`).join('');
  return `<ul class="q-list">${rows}</ul>${next ? `<p class="hint">Próximo seguidor a las ${next} misiones exitosas.</p>` : ''}`;
}

function reputationView(viewer) {
  const points = viewer.quarters.reputation;
  const { standings, factions } = quartersCatalog;
  const rows = Object.entries(factions).map(([key, faction]) => {
    const value = points[key] || 0;
    const level = standings.filter(s => value >= s.from).length - 1;
    const next = standings[level + 1];
    const percent = next ? 100 * (value - standings[level].from) / (next.from - standings[level].from) : 100;
    return `<li><span class="q-faction">${escapeHtml(faction.name)}</span>
      <span class="q-bar"><span style="width:${percent}%"></span><em>${standings[level].name}${next ? ` ${value - standings[level].from} / ${next.from - standings[level].from}` : ''}</em></span></li>`;
  }).join('');
  return `<ul class="q-list q-reputation">${rows}</ul><p class="hint">Exaltado da un título de la facción (y con Ventormenta o el Alba Argenta, su tabardo).</p>`;
}

function suppliesView(viewer) {
  const supplies = viewer.quarters.supplies.map(id => catalogEntry(quartersCatalog.supplies, id)).filter(Boolean);
  const rows = supplies.map(s => `<li><a href="${supplyUrl(s.id)}"><img class="q-icon" src="${iconUrl(s.icon)}" alt=""></a>
    <strong>${escapeHtml(s.name)}</strong>: ${escapeHtml(s.effect)} (para ${SUPPLY_FOR[s.to]})</li>`).join('');
  return `<p class="hint">En la próxima mazmorra del stream aportas el mejor que tengas: le sirve a todos los del grupo que lo usarían. ${supplies.length} / ${quartersCatalog.maxSupplies}.</p>
    ${rows ? `<ul class="q-list">${rows}</ul>` : '<p class="hint">Todavía no trajiste ninguno.</p>'}`;
}

const VIEW_RENDERERS = { board: boardView, away: awayView, followers: followersView, reputation: reputationView, supplies: suppliesView };

function quartersHeader(viewer) {
  const q = viewer.quarters;
  const rank = rankOf(q);
  const next = quartersCatalog.ranks[rank];
  const goldToday = q.gold.day === new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10) ? q.gold.copper : 0;
  return `<p class="q-rank">Rango ${rank} · ${q.successes} ${q.successes === 1 ? 'misión exitosa' : 'misiones exitosas'}${next !== undefined ? ` (rango ${rank + 1} a las ${next})` : ''} · Oro de hoy: ${moneyHtml(goldToday)} de ${moneyHtml(quartersCatalog.dailyGold)}</p>`;
}

function quartersContent(viewer) {
  if (!quartersCatalog) return '<p class="hint">Cargando el cuartel...</p>';
  if (!viewer.quarters) {
    return canActHere()
      ? '<p>Manda a tu avatar y a tus seguidores a misiones mientras el stream está apagado. Vuelven con reputación, oro y suministros para la próxima mazmorra.</p><button class="wow-button q-open" type="button">Entrar al cuartel</button>'
      : `<p class="hint">${escapeHtml(viewer.name)} todavía no abrió su cuartel.</p>`;
  }
  const nav = Object.entries(QUARTERS_VIEWS).map(([key, label]) =>
    `<button class="q-view${key === quartersView ? ' active' : ''}" data-view="${key}" type="button">${label}${key === 'away' && viewer.quarters.active.length ? ` (${viewer.quarters.active.length})` : ''}</button>`).join('');
  const login = canActHere() || signedInUser ? '' : `<p class="hint"><a href="${escapeHtml(loginUrl())}">Entra con Twitch</a> para mandar misiones desde tu armería.</p>`;
  return `${quartersHeader(viewer)}<nav class="q-views">${nav}</nav>${login}<div class="q-body">${VIEW_RENDERERS[quartersView](viewer)}</div>`;
}

function quartersPanel(viewer) {
  return `<div class="quarters">${quartersContent(viewer)}</div>`;
}

// ---------- Acciones ----------

async function quartersCommand(command, block) {
  const problem = block.querySelector('.q-problem');
  const button = block.querySelector('button');
  if (button) button.disabled = true;
  const result = await runCommand(command);
  if (result.ok) return;
  if (button) button.disabled = false;
  if (problem) {
    problem.textContent = result.problems.map(capitalize).join(' ');
    problem.hidden = false;
  }
}

function setupMissionCard(viewer, card) {
  const mission = catalogEntry(quartersCatalog.missions, card.dataset.id);
  const pickers = [...card.querySelectorAll('.q-follower')];
  const chance = card.querySelector('.q-chance');
  const team = () => pickers.map(p => p.value);
  const showChance = () => {
    if (chance) chance.textContent = `${Math.round(100 * chanceOf(mission, team().map(id => followerOf(viewer, id))))} % de éxito`;
  };
  pickers.forEach(p => p.addEventListener('change', showChance));
  showChance();
  card.querySelector('.q-send')?.addEventListener('click', () => quartersCommand(`!mision ${mission.id} ${team().join(' ')}`, card));
}

function setupQuarters(viewer) {
  const root = app.querySelector('.quarters');
  if (!root) return;
  if (!quartersCatalog) {
    loadQuartersCatalog().then(() => {
      root.innerHTML = quartersContent(viewer);
      setupQuarters(viewer);
    }).catch(() => { root.innerHTML = '<p class="hint">No se pudo cargar el cuartel.</p>'; });
    return;
  }
  root.querySelector('.q-open')?.addEventListener('click', () => quartersCommand('!cuartel', root));
  root.querySelectorAll('.q-view').forEach(button => button.addEventListener('click', () => {
    quartersView = button.dataset.view;
    root.innerHTML = quartersContent(viewer);
    setupQuarters(viewer);
  }));
  root.querySelectorAll('.q-mission').forEach(card => setupMissionCard(viewer, card));
  root.querySelector('.q-claim')?.addEventListener('click', () => quartersCommand('!cuartel', root.querySelector('.q-body')));
  tickQuarters();
  if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
}

// Cuenta regresiva de las misiones; "Cobrar" se habilita cuando alguna volvió
function tickQuarters() {
  const timers = [...app.querySelectorAll('.q-timer')];
  timers.forEach(timer => { timer.textContent = remaining(Number(timer.dataset.ends)); });
  const claim = app.querySelector('.q-claim');
  if (claim) claim.disabled = !timers.some(timer => Number(timer.dataset.ends) <= Date.now());
}

setInterval(tickQuarters, 1000);
