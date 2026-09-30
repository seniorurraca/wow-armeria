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

// Con ?u=nick se muestra la ficha de ese espectador; sin parámetro, la landing con el ranking
const viewerLogin = (new URLSearchParams(location.search).get('u') || '').toLowerCase();
// Con ?subasta, la casa de subastas (ver subasta.js)
const auctionMode = new URLSearchParams(location.search).has('subasta');

// En la ficha, de la landing solo queda "Cómo participar" debajo del personaje; en la subasta, nada
if (viewerLogin || auctionMode) {
  const landing = document.getElementById('landing');
  const landingOnly = '.hero, #redes, #armeria, #roadmap, #noticias, #preguntas, #sugerencias';
  landing.querySelectorAll(auctionMode ? `${landingOnly}, #participar` : landingOnly).forEach(section => section.hidden = true);
  landing.before(app);
  app.hidden = false;
  showStatus('Cargando la armería...');
}

// sessionReady (sesion.js, carga después): la ficha se dibuja sabiendo si el que mira inició sesión.
// La subasta la pide con el login de la sesión, así que espera a saberlo
document.addEventListener('DOMContentLoaded', () => {
  const armoryReady = auctionMode ? sessionReady.then(loadArmory) : loadArmory();
  armoryReady
    .then(armory => sessionReady.then(() => render(armory)))
    .catch(err => {
      console.log('[Armería] No se pudo cargar', err);
      const text = 'No se pudo cargar la armería. Prueba de nuevo en un rato.';
      if (viewerLogin || auctionMode) showStatus(text);
      else renderRankingStatus(text);
    });
});

async function loadArmory() {
  const path = auctionMode ? 'auction' : viewerLogin ? 'viewer' : 'ranking';
  const login = auctionMode ? auctionLogin() : viewerLogin;
  const res = await fetch(`${API_URL}/${path}?u=${encodeURIComponent(login)}`);
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
            ${framedPortrait(viewer, portrait(viewer), 'portrait')}
            <h1>${escapeHtml(titledName(viewer))}${roleIcon(viewer.role)}</h1>
            <p class="subtitle">${levelText(viewer)} ${cls.name}</p>
            ${xpBar(viewer)}
            ${titlePicker(viewer)}
            ${framePicker(viewer)}
            ${rolePicker(viewer)}
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
        <a class="back" href="./?subasta">Ir a la casa de subastas</a>
        <a class="back" href="./#armeria">Ver todos los aventureros</a>
      </div>
      <div class="chat-panel">${renderChatArea()}</div>
    </div>`;

  app.querySelectorAll('.tabs button').forEach(button =>
    button.addEventListener('click', () => showTab(button.dataset.tab)));
  setupSpellbook(viewer);
  setupReforge(viewer);
  setupEquipButtons(viewer);
  setupTabards(viewer);
  setupSellButtons(viewer);
  setupPagedLists(app);
  setupTitlePicker(viewer);
  setupFramePicker(viewer);
  setupRolePicker(viewer);
  initChat();
  // Se mide con Personaje a la vista: oculta mide 0 (al redibujar parado en Inventario las armas tapaban las pestañas)
  fixPanelHeight(app.querySelector('.frame'));
  showTab(tab);
}

function showTab(tab) {
  app.querySelectorAll('.panel').forEach(panel => panel.hidden = panel.dataset.tab !== tab);
  app.querySelectorAll('.tabs button').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
}

function paperdoll(viewer, itemsById) {
  const column = (side) => `<div class="slots ${side}">${PAPERDOLL[side].map(slot => slotHtml(slot, itemsById[viewer.equipped[slot]], viewer)).join('')}</div>`;
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
        ${silhouette(viewer, itemsById)}
        <dl class="stats">
          ${stats.map(([label, value]) => `<div><dt>${label}:</dt><dd>${value}</dd></div>`).join('')}
        </dl>
      </div>
      ${column('right')}
      ${column('bottom')}
    </div>`;
}

function slotHtml(slot, item, viewer) {
  if (slot === 'tabard' && viewer.tabards?.length) return tabardSlotHtml(viewer);
  if (!item) {
    return `<span class="slot empty" title="${SLOTS[slot].label}"><img src="${iconUrl(`inventoryslot_${SLOTS[slot].icon}`)}" alt=""></span>`;
  }
  return `<span class="worn-slot"><a class="slot" data-rarity="${item.rarity}" href="${itemUrl(item.id)}"><img src="${escapeHtml(item.icon)}" alt=""></a>${wornFlyout(item, slot, viewer)}</span>`;
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
