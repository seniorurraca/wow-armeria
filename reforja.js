// Reforja: en la pestaña Inventario el espectador elige 3 objetos de su mochila y la página le arma
// "!reforjar id id id" para pegar en el chat. Streamer.bot (wow-armeria.cs) los funde en uno que su clase
// pueda usar; la página se entera al instante por la API y lo revela con animación y sonido.
const REFORGE_MATERIALS = 3;
const REFORGE_RARITY_NAMES = { uncommon: 'Poco común', rare: 'Raro', epic: 'Épico' };
// El botín de mazmorras va de verde a épico: las calidades fuera de ese rango caen en el borde (igual que wow-armeria.cs)
const REFORGE_MIN_RANK = 2, REFORGE_MAX_RANK = 4;
const REFORGE_WAIT_MS = 180000;
const REFORGE_REVEAL_SOUND = 'https://wow.zamimg.com/sound-ids/live/enus/13/642829/UI_EpicLoot_Toast_01.ogg';
// Golpes de martillo (ms desde que empieza la animación) y el momento en que se funden; coinciden con reforja.css
const HAMMER_HITS_MS = [250, 750, 1250];
const FUSE_MS = 2000;

let reforgeSelection = [];
let reforgeAudio = null;

function reforgeBar() {
  return `
    <div class="reforge-bar">
      <button class="wow-button reforge-toggle" type="button">⚒️ Reforjar objetos</button>
      <div class="reforge-panel" hidden>
        <p class="hint">Elige ${REFORGE_MATERIALS} objetos de tu mochila que no uses. Se funden en uno que <b>tu clase</b> sí puede usar, de calidad y nivel parecidos al promedio.</p>
        <div class="reforge-footer">
          <span class="reforge-status"></span>
          <button class="wow-button reforge-go" type="button" disabled>Reforjar</button>
        </div>
      </div>
    </div>`;
}

function setupReforge(viewer) {
  reforgeSelection = [];
  const panel = app.querySelector('.reforge-panel');
  const list = app.querySelector('.bag-list');
  if (!panel || !list) return;

  app.querySelector('.reforge-toggle').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    list.classList.toggle('picking', !panel.hidden);
    if (panel.hidden) clearReforgeSelection();
    updateReforgeStatus();
  });

  list.addEventListener('click', event => {
    const row = event.target.closest('.row');
    if (!row || !list.classList.contains('picking')) return;
    event.preventDefault();
    toggleReforgeRow(row);
  });

  app.querySelector('.reforge-go').addEventListener('click', () => startReforge(viewer));
  updateReforgeStatus();
}

function toggleReforgeRow(row) {
  if (row.classList.contains('picked')) {
    row.classList.remove('picked');
    reforgeSelection = reforgeSelection.filter(r => r !== row);
  } else if (reforgeSelection.length < REFORGE_MATERIALS) {
    row.classList.add('picked');
    reforgeSelection.push(row);
  }
  updateReforgeStatus();
}

function clearReforgeSelection() {
  reforgeSelection.forEach(row => row.classList.remove('picked'));
  reforgeSelection = [];
}

function updateReforgeStatus() {
  const status = app.querySelector('.reforge-status');
  const ready = reforgeSelection.length === REFORGE_MATERIALS;
  app.querySelector('.reforge-go').disabled = !ready;
  status.innerHTML = ready
    ? reforgeOdds(reforgeSelection.map(row => row.dataset.rarity))
    : `Elegidos: ${reforgeSelection.length}/${REFORGE_MATERIALS}`;
}

// Épico + 2 verdes = 2.67 → Raro 67% · Poco común 33%
function reforgeOdds(rarities) {
  const rank = rarities.reduce((sum, r) => sum + Math.max(0, RARITIES.indexOf(r)), 0) / rarities.length;
  const low = Math.floor(rank);
  const chances = {};
  [[low, 1 - (rank - low)], [low + 1, rank - low]].forEach(([r, p]) => {
    if (p <= 0) return;
    const rarity = RARITIES[Math.min(REFORGE_MAX_RANK, Math.max(REFORGE_MIN_RANK, r))];
    chances[rarity] = (chances[rarity] || 0) + p;
  });
  return Object.entries(chances)
    .sort((a, b) => RARITIES.indexOf(b[0]) - RARITIES.indexOf(a[0]))
    .map(([rarity, p]) => `<span class="item-name" data-rarity="${rarity}">${REFORGE_RARITY_NAMES[rarity]} ${Math.round(p * 100)}%</span>`)
    .join(' · ');
}

// ---------- Esperar a que Streamer.bot reforje ----------

function startReforge(viewer) {
  const materials = reforgeSelection.map(row => ({
    id: row.dataset.id, rarity: row.dataset.rarity, icon: row.querySelector('img').src
  }));
  const command = `!reforjar ${materials.map(m => m.id).join(' ')}`;
  reforgeAudio = reforgeAudio || new (window.AudioContext || window.webkitAudioContext)();

  const known = new Set(viewer.items.filter(i => i.source === 'reforja').map(i => i.obtained));
  const overlay = showOverlay(`
    <div class="overlay-window">
      <div class="forge-anvil">⚒️</div>
      ${commandBlock(command, 'reforjarlos', 'Reforjar')}
      <p class="hint forge-hint">Esperando a la forja…</p>
      <button class="wow-button forge-button" type="button">Cancelar</button>
    </div>`);
  setupCommand(overlay);

  const slowHint = setTimeout(() => {
    overlay.querySelector('.forge-hint').textContent = 'No llegó nada todavía. ¿Pegaste el comando en el chat?';
  }, REFORGE_WAIT_MS);
  const stopWaiting = () => { stopWatching(); clearTimeout(slowHint); overlay.remove(); };
  overlay.querySelector('.forge-button').addEventListener('click', stopWaiting);

  // La ficha ya se redibuja sola con el objeto nuevo (armeria.js); acá solo se revela y se vuelve a Inventario
  const stopWatching = watchViewer(updated => {
    const forged = updated.items.find(i => i.source === 'reforja' && !known.has(i.obtained));
    if (!forged) return;
    stopWaiting();
    revealForge(materials, forged, () => showTab('inventory'));
  });
}

// ---------- Revelación: 3 martillazos, se funden y aparece el objeto nuevo ----------

function revealForge(materials, item, onClose) {
  const overlay = showOverlay(`
    <div class="forge-stage" data-rarity="${item.rarity}">
      <div class="forge-materials">
        ${materials.map((m, i) => `<span class="slot forge-material" data-rarity="${m.rarity}" style="--i:${i}"><img src="${escapeHtml(m.icon)}" alt=""></span>`).join('')}
      </div>
      <div class="forge-flash"></div>
      <div class="forge-result">
        <div class="rays forge-rays"></div>
        <span class="slot forge-item"><img src="${escapeHtml(item.icon)}" alt=""></span>
        <p class="forge-title">¡Reforjado!</p>
        <a class="item-name forge-name" href="${itemUrl(item.id)}" target="_blank" rel="noopener">[${escapeHtml(item.name)}]</a>
        <button class="wow-button forge-button" type="button">Continuar</button>
      </div>
    </div>`);

  HAMMER_HITS_MS.forEach(ms => setTimeout(anvilClang, ms));
  setTimeout(() => {
    fusionBoom();
    const sound = new Audio(REFORGE_REVEAL_SOUND);
    sound.volume = .6;
    sound.play().catch(() => {});
  }, FUSE_MS);

  overlay.querySelector('.forge-button').addEventListener('click', () => { overlay.remove(); onClose(); });
}

// Martillazo sobre yunque: parciales metálicos inarmónicos que se apagan rápido
function anvilClang() {
  const ctx = reforgeAudio;
  if (!ctx) return;
  const now = ctx.currentTime;
  [[880, .35], [1415, .22], [2330, .14], [3570, .08]].forEach(([freq, gain]) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.value = freq * (0.98 + Math.random() * .04);
    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + .6);
    osc.connect(env).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + .6);
  });
}

// Golpe grave al fundirse
function fusionBoom() {
  const ctx = reforgeAudio;
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + .5);
  env.gain.setValueAtTime(.5, now);
  env.gain.exponentialRampToValueAtTime(0.001, now + .7);
  osc.connect(env).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + .7);
}
