// Gist donde Streamer.bot publica armory.json (ver streamerbot/README.md)
const GIST_ID = 'daaf25602c520509b37eaf0b8e560a9a';
const GIST_FILE = 'armory.json';

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
const TABS = { character: 'Personaje', inventory: 'Inventario', spells: 'Hechizos', achievements: 'Logros' };
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

// En la ficha, de la landing solo queda "Cómo participar" debajo del personaje
if (viewerLogin) {
  const landing = document.getElementById('landing');
  landing.querySelectorAll('.hero, #redes, #armeria').forEach(section => section.hidden = true);
  landing.before(app);
  app.hidden = false;
  showStatus('Cargando la armería...');
}

loadArmory()
  .then(render)
  .catch(err => {
    console.log('[Armería] No se pudo cargar', err);
    const text = 'No se pudo cargar la armería. Prueba de nuevo en un rato.';
    if (viewerLogin) showStatus(text);
    else renderRankingStatus(text);
  });

async function loadArmory() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
  const gist = await res.json();
  return JSON.parse(gist.files[GIST_FILE].content);
}

function render(armory) {
  if (!viewerLogin) renderRanking(armory);
  else if (armory.viewers[viewerLogin]) renderViewer(armory.viewers[viewerLogin], armory.achievements || []);
  else showStatus(`${viewerLogin} todavía no tiene botín. ¡Canjea un cofre en el stream!`, true);
}

function showStatus(text, withBack) {
  const back = withBack ? '<a class="back" href="./#armeria">Ver todos los aventureros</a>' : '';
  app.innerHTML = `<p class="status">${escapeHtml(text)}</p>${back}`;
}

// ---------- Personaje ----------

function renderViewer(viewer, achievements) {
  const cls = classOf(viewer);
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));

  app.innerHTML = `
    <section class="frame" style="--class-color:${cls.color}">
      <header class="frame-title">
        <img class="portrait" src="${portrait(viewer)}" alt="">
        <h1>${escapeHtml(viewer.name)}</h1>
        <p class="subtitle">${cls.name}</p>
      </header>
      <div class="panel" data-tab="character">${paperdoll(viewer, itemsById)}</div>
      <div class="panel" data-tab="inventory" hidden>${inventory(viewer)}</div>
      <div class="panel" data-tab="spells" hidden>${spellbook()}</div>
      <div class="panel" data-tab="achievements" hidden>${achievementList(viewer, achievements)}</div>
    </section>
    <nav class="tabs">
      ${Object.entries(TABS).map(([key, label]) => `<button data-tab="${key}">${label}</button>`).join('')}
    </nav>
    <a class="back" href="./#armeria">Ver todos los aventureros</a>`;

  app.querySelectorAll('.tabs button').forEach(button =>
    button.addEventListener('click', () => showTab(button.dataset.tab)));
  setupSpellbook(viewer);
  showTab('character');
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
    ['Objetos', items.length],
    ['Equipados', Object.keys(viewer.equipped).length],
    ['Épicos', countRarity(items, 'epic')],
    ['Legendarios', countRarity(items, 'legendary')],
    ['Hechizos', viewer.spells.length]
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
  return `<a class="slot" data-rarity="${item.rarity}" href="${itemUrl(item.id)}"><img src="${escapeHtml(item.icon)}" alt=""></a>`;
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
  const equipped = new Set(Object.values(viewer.equipped));
  const items = uniqueItems(viewer).sort((a, b) =>
    RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || a.name.localeCompare(b.name));

  const rows = items.map(item => `
    <a class="row" data-rarity="${item.rarity}" href="${itemUrl(item.id)}">
      <span class="row-icon slot"><img src="${escapeHtml(item.icon)}" alt="">${item.count > 1 ? `<b class="count">${item.count}</b>` : ''}</span>
      <span class="row-name item-name">${escapeHtml(item.name)}</span>
      ${equipped.has(item.id) ? '<span class="row-meta equipped">Equipado</span>' : ''}
    </a>`);

  return `
    <p class="hint">Equipa un objeto escribiendo <code>!equipar nombre</code> en el chat.</p>
    <div class="list two-columns">${rows.join('') || '<p class="status">La mochila está vacía.</p>'}</div>`;
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
