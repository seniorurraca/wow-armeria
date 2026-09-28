// API donde Streamer.bot publica la armería (ver api/README.md)
const API_URL = 'https://wow-armeria-api.wow-armeria-api.workers.dev';
const RECONNECT_MS = 3000;
let viewerAchievements = [];

const CLASSES = {
  warrior: { name: 'Guerrero',  color: '#C79C6E' },
  paladin: { name: 'Paladín',   color: '#F58CBA' },
  hunter:  { name: 'Cazador',   color: '#ABD473' },
  rogue:   { name: 'Pícaro',    color: '#FFF569' },
  priest:  { name: 'Sacerdote', color: '#FFFFFF' },
  shaman:  { name: 'Chamán',    color: '#0070DE' },
  mage:    { name: 'Mago',      color: '#69CCF0' },
  warlock: { name: 'Brujo',     color: '#9482C9' },
  druid:   { name: 'Druida',    color: '#FF7D0A' }
};
const NO_CLASS = { name: 'Aventurero', color: '#FFD100' };

// Casillero → icono de casillero vacío de Wowhead (inventoryslot_*) y nombre
const SLOTS = {
  head:     { icon: 'head',     label: 'Cabeza' },
  neck:     { icon: 'neck',     label: 'Cuello' },
  shoulder: { icon: 'shoulder', label: 'Hombros' },
  back:     { icon: 'chest',    label: 'Espalda' },
  chest:    { icon: 'chest',    label: 'Pecho' },
  shirt:    { icon: 'shirt',    label: 'Camisa' },
  tabard:   { icon: 'tabard',   label: 'Tabardo' },
  wrist:    { icon: 'wrists',   label: 'Muñecas' },
  hands:    { icon: 'hands',    label: 'Manos' },
  waist:    { icon: 'waist',    label: 'Cintura' },
  legs:     { icon: 'legs',     label: 'Piernas' },
  feet:     { icon: 'feet',     label: 'Pies' },
  finger1:  { icon: 'finger',   label: 'Dedo' },
  finger2:  { icon: 'finger',   label: 'Dedo' },
  trinket1: { icon: 'trinket',  label: 'Abalorio' },
  trinket2: { icon: 'trinket',  label: 'Abalorio' },
  mainHand: { icon: 'mainhand', label: 'Mano derecha' },
  offHand:  { icon: 'offhand',  label: 'Mano izquierda' },
  ranged:   { icon: 'ranged',   label: 'A distancia' }
};
const PAPERDOLL = {
  left: ['head', 'neck', 'shoulder', 'back', 'chest', 'shirt', 'tabard', 'wrist'],
  right: ['hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'],
  bottom: ['mainHand', 'offHand', 'ranged']
};

const RARITIES = ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
const TABS = { character: 'Personaje', inventory: 'Inventario', loot: 'Botín', spells: 'Hechizos', achievements: 'Logros' };
const SPELLS_PER_PAGE = 12;

const app = document.getElementById('app');
const iconUrl = icon => `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;
const itemUrl = id => `https://www.wowhead.com/classic/item=${id}`;
const spellUrl = id => `https://www.wowhead.com/classic/mx/spell=${id}`;
const classOf = viewer => CLASSES[viewer.class] || NO_CLASS;
const classIcon = viewer => iconUrl(CLASSES[viewer.class] ? `classicon_${viewer.class}` : 'inv_misc_questionmark');
const portrait = viewer => viewer.avatar ? escapeHtml(viewer.avatar) : classIcon(viewer);

// Silueta de personaje con armadura y capa; hombrera, brazo y pierna se dibujan una vez y se espejan
const SILHOUETTE = `
  <svg class="silhouette" viewBox="0 0 200 420" aria-hidden="true">
    <defs>
      <linearGradient id="silhouette-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1e1e1e"/>
        <stop offset="1" stop-color="#070707"/>
      </linearGradient>
      <g id="silhouette-side">
        <path d="M60 82 C40 80 24 92 22 110 C22 122 30 128 38 126 C46 118 58 114 70 112 L74 96 C72 88 68 84 60 82 Z"/>
        <path d="M34 94 L18 70 L44 88 Z"/>
        <path d="M36 120 L58 116 L55 188 L32 188 Z"/>
        <path d="M28 184 L58 184 L55 242 L31 242 Z"/>
        <circle cx="43" cy="253" r="13"/>
        <path d="M72 262 L98 262 L97 318 L74 318 Z"/>
        <ellipse cx="85" cy="318" rx="15" ry="11"/>
        <path d="M72 322 L98 322 L98 380 L100 402 L64 402 C56 402 56 393 65 389 L72 380 Z"/>
      </g>
    </defs>
    <path fill="#050505" d="M52 96 L148 96 L166 300 L176 398 L150 388 L128 402 L100 392 L72 402 L50 388 L24 398 L34 300 Z"/>
    <g fill="url(#silhouette-fill)">
      <path d="M100 12 C114 12 124 22 125 38 L126 56 C126 66 118 74 112 78 L88 78 C82 74 74 66 74 56 L75 38 C76 22 86 12 100 12 Z"/>
      <rect x="88" y="70" width="24" height="18"/>
      <path d="M62 104 C80 98 120 98 138 104 L134 150 C132 168 128 180 124 190 L76 190 C72 180 68 168 66 150 Z"/>
      <path d="M72 186 L128 186 L130 206 L70 206 Z"/>
      <path d="M72 204 L128 204 L136 272 L116 280 L100 272 L84 280 L64 272 Z"/>
      <use href="#silhouette-side"/>
      <use href="#silhouette-side" transform="translate(200 0) scale(-1 1)"/>
    </g>
  </svg>`;

// Con ?u=nick se muestra la ficha de ese espectador; sin parámetro, la landing con el ranking
const viewerLogin = (new URLSearchParams(location.search).get('u') || '').toLowerCase();
// Con ?subasta, la casa de subastas (ver subasta.js)
const auctionMode = new URLSearchParams(location.search).has('subasta');

// En la ficha, de la landing solo queda "Cómo participar" debajo del personaje; en la subasta, nada
if (viewerLogin || auctionMode) {
  const landing = document.getElementById('landing');
  landing.querySelectorAll(auctionMode ? '.hero, #redes, #armeria, #participar' : '.hero, #redes, #armeria').forEach(section => section.hidden = true);
  landing.before(app);
  app.hidden = false;
  showStatus('Cargando la armería...');
}

// sessionReady (sesion.js): la ficha se dibuja sabiendo si el que mira inició sesión
loadArmory()
  .then(armory => sessionReady.then(() => render(armory)))
  .catch(err => {
    console.log('[Armería] No se pudo cargar', err);
    const text = 'No se pudo cargar la armería. Prueba de nuevo en un rato.';
    if (viewerLogin || auctionMode) showStatus(text);
    else renderRankingStatus(text);
  });

async function loadArmory() {
  const path = auctionMode ? 'auction' : viewerLogin ? 'viewer' : 'ranking';
  const res = await fetch(`${API_URL}/${path}?u=${encodeURIComponent(viewerLogin)}`);
  if (!res.ok) throw new Error(`La API respondió ${res.status}`);
  return res.json();
}

// La API avisa al instante cada vez que Streamer.bot cambia la ficha de este espectador.
// Si se corta, se reconecta y recarga por si algo cambió mientras tanto
const viewerListeners = new Set();

function connectViewerSocket() {
  const socket = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws?u=${encodeURIComponent(viewerLogin)}`);
  socket.addEventListener('message', event => {
    const viewer = JSON.parse(event.data).viewer;
    viewerListeners.forEach(listener => listener(viewer));
  });
  socket.addEventListener('close', () => setTimeout(() => {
    connectViewerSocket();
    loadArmory().then(armory => armory.viewers[viewerLogin] && refreshViewer(armory.viewers[viewerLogin])).catch(() => {});
  }, RECONNECT_MS));
}

function watchViewer(onChange) {
  viewerListeners.add(onChange);
  return () => viewerListeners.delete(onChange);
}

if (viewerLogin && !auctionMode) {
  connectViewerSocket();
  watchViewer(refreshViewer);
}

function render(armory) {
  if (auctionMode) renderAuctionHouse(armory);
  else if (!viewerLogin) renderRanking(armory);
  else if (armory.viewers[viewerLogin]) {
    viewerAchievements = armory.achievements || [];
    renderViewer(armory.viewers[viewerLogin]);
  }
  else showStatus(`${viewerLogin} todavía no tiene botín. ¡Canjea un cofre en el stream!`, true);
}

// Vuelve a dibujar la ficha con lo nuevo sin sacar al espectador de la pestaña donde está
function refreshViewer(viewer) {
  const activeTab = app.querySelector('.tabs button.active');
  renderViewer(viewer, activeTab ? activeTab.dataset.tab : 'character');
}

function showStatus(text, withBack) {
  const back = withBack ? '<a class="back" href="./#armeria">Ver todos los aventureros</a>' : '';
  app.innerHTML = `<p class="status">${escapeHtml(text)}</p>${back}`;
}

// ---------- Personaje ----------

function renderViewer(viewer, tab = 'character') {
  const cls = classOf(viewer);
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));

  app.innerHTML = `
    <div class="chat-viewer-container">
      <div>
        <section class="frame" style="--class-color:${cls.color}">
          <header class="frame-title">
            <img class="portrait" ${frameAttributes(viewer)} src="${portrait(viewer)}" alt="">
            <h1>${escapeHtml(titledName(viewer))}</h1>
            <p class="subtitle">${levelText(viewer)} ${cls.name}</p>
            ${xpBar(viewer)}
            ${titlePicker(viewer)}
          </header>
          <div class="panel" data-tab="character">${paperdoll(viewer, itemsById)}</div>
          <div class="panel" data-tab="inventory" hidden>${inventory(viewer)}</div>
          <div class="panel" data-tab="loot" hidden>${lootHistory(viewer)}</div>
          <div class="panel" data-tab="spells" hidden>${spellbook()}</div>
          <div class="panel" data-tab="achievements" hidden>${achievementList(viewer, viewerAchievements)}</div>
        </section>
        <nav class="tabs">
          ${Object.entries(TABS).map(([key, label]) => `<button data-tab="${key}">${label}</button>`).join('')}
        </nav>
        <a class="back" href="./?subasta&u=${encodeURIComponent(viewerLogin)}">Ir a la casa de subastas</a>
        <a class="back" href="./#armeria">Ver todos los aventureros</a>
      </div>
      <div class="chat-panel">${renderChatArea()}</div>
    </div>`;

  app.querySelectorAll('.tabs button').forEach(button =>
    button.addEventListener('click', () => showTab(button.dataset.tab)));
  setupSpellbook(viewer);
  setupReforge(viewer);
  setupEquipButtons(viewer);
  setupSellButtons(viewer);
  setupPagedLists(app);
  setupTitlePicker(viewer);
  initChat();
  showTab(tab);
  fixPanelHeight(app.querySelector('.frame'));
}

function showTab(tab) {
  app.querySelectorAll('.panel').forEach(panel => panel.hidden = panel.dataset.tab !== tab);
  app.querySelectorAll('.tabs button').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
}

function paperdoll(viewer, itemsById) {
  const column = (side) => `<div class="slots ${side}">${PAPERDOLL[side].map(slot => slotHtml(slot, itemsById[viewer.equipped[slot]])).join('')}</div>`;
  const items = uniqueItems(viewer);
  const stats = [
    ['GearScore', coloredGearScore(gearScore(viewer))],
    ['Oro', moneyHtml(viewer.gold ?? 0)],
    ['Objetos', items.length],
    ['Equipados', Object.keys(viewer.equipped).length],
    ['Épicos', countRarity(items, 'epic')],
    ['Legendarios', countRarity(items, 'legendary')],
    ['Hechizos', viewer.spells.length],
    ['Duelos', `${viewer.duelWins || 0} V · ${viewer.duelLosses || 0} D`]
  ];

  return `
    <div class="paperdoll">
      ${column('left')}
      <div class="model">
        ${SILHOUETTE}
        <dl class="stats">
          ${stats.map(([label, value]) => `<div><dt>${label}:</dt><dd>${value}</dd></div>`).join('')}
        </dl>
      </div>
      ${column('right')}
      ${column('bottom')}
    </div>`;
}

function slotHtml(slot, item) {
  if (!item) {
    return `<span class="slot empty" title="${SLOTS[slot].label}"><img src="${iconUrl(`inventoryslot_${SLOTS[slot].icon}`)}" alt=""></span>`;
  }
  return `<span class="worn-slot"><a class="slot" data-rarity="${item.rarity}" href="${itemUrl(item.id)}"><img src="${escapeHtml(item.icon)}" alt=""></a>${unequipButton(item)}</span>`;
}

// ---------- Inventario y hechizos ----------

function uniqueItems(viewer) {
  const byId = new Map();
  viewer.items.forEach(item => {
    const entry = byId.get(item.id) || { ...item, count: 0 };
    entry.count++;
    byId.set(item.id, entry);
  });
  return [...byId.values()];
}

function coloredGearScore(score) {
  return `<span style="color:${gearScoreColor(score)}">${score}</span>`;
}

function countRarity(items, rarity) {
  return items.filter(item => item.rarity === rarity).length;
}

function inventory(viewer) {
  const items = bagItems(viewer).sort((a, b) =>
    RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || a.name.localeCompare(b.name));

  const rows = items.map(item => `
    <div class="row" data-rarity="${item.rarity}" data-id="${escapeHtml(item.id)}">
      <a class="row-link" href="${itemUrl(item.id)}">
        <span class="row-icon slot${unusableClass(item, viewer)}"><img src="${escapeHtml(item.icon)}" alt=""></span>
        <span class="row-name item-name">${escapeHtml(item.name)}</span>
      </a>
      ${equipButton(item, viewer)}
      ${sellButton(item)}
    </div>`);

  return `
    ${bagBar(viewer, items.length)}
    <p class="hint">${canActHere() ? 'Toca <b>Equipar</b> o <b>Vender</b> y listo' : 'Toca <b>Equipar</b> y pega el comando en el chat del stream (o escribe <code>!equipar nombre</code>), o entra con Twitch y hazlo con un clic'}. <b>Vender</b> lo da al vendedor o a la casa de subastas; las bolsas se venden tocándolas.</p>
    ${reforgeBar()}
    <div class="list two-columns bag-list">${rows.join('') || '<p class="status">La mochila está vacía.</p>'}</div>`;
}

function spellbook() {
  return `
    <div class="spellbook">
      <div class="spell-grid"></div>
      <div class="spell-pager">
        <button class="page-prev" aria-label="Página anterior">◀</button>
        <span class="page-label"></span>
        <button class="page-next" aria-label="Página siguiente">▶</button>
      </div>
    </div>`;
}

function setupSpellbook(viewer) {
  const book = app.querySelector('.spellbook');
  const spells = [...viewer.spells].sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(spells.length / SPELLS_PER_PAGE));
  const prev = book.querySelector('.page-prev');
  const next = book.querySelector('.page-next');
  let page = 0;

  const show = () => {
    const shown = spells.slice(page * SPELLS_PER_PAGE, (page + 1) * SPELLS_PER_PAGE);
    book.querySelector('.spell-grid').innerHTML = shown.map(spell => `
      <a class="spell" href="${spellUrl(spell.id)}">
        <span class="spell-icon"><img src="${escapeHtml(spell.icon)}" alt=""></span>
        <span class="spell-name">${escapeHtml(spell.name)}</span>
      </a>`).join('') || '<p class="spell-empty">Todavía no aprendió ningún hechizo.</p>';
    book.querySelector('.page-label').textContent = `Página ${page + 1}`;
    prev.disabled = page === 0;
    next.disabled = page === pages - 1;
    if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
  };

  prev.addEventListener('click', () => { page--; show(); });
  next.addEventListener('click', () => { page++; show(); });
  show();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
