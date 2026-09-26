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
const TABS = { character: 'Personaje', inventory: 'Inventario', spells: 'Hechizos' };

const app = document.getElementById('app');
const iconUrl = icon => `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;
const itemUrl = id => `https://www.wowhead.com/classic/item=${id}`;
const spellUrl = id => `https://www.wowhead.com/classic/mx/spell=${id}`;
const classOf = viewer => CLASSES[viewer.class] || NO_CLASS;
const classIcon = viewer => iconUrl(CLASSES[viewer.class] ? `classicon_${viewer.class}` : 'inv_misc_questionmark');

loadArmory()
  .then(render)
  .catch(err => {
    console.log('[Armería] No se pudo cargar', err);
    showStatus('No se pudo cargar la armería. Prueba de nuevo en un rato.');
  });

async function loadArmory() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
  const gist = await res.json();
  return JSON.parse(gist.files[GIST_FILE].content);
}

function render(armory) {
  const login = (new URLSearchParams(location.search).get('u') || '').toLowerCase();
  if (!login) renderRoster(armory);
  else if (armory.viewers[login]) renderViewer(armory.viewers[login]);
  else showStatus(`${login} todavía no tiene botín. ¡Canjea un cofre en el stream!`, true);
}

function showStatus(text, withBack) {
  const back = withBack ? '<a class="back" href="./">Ver todos los aventureros</a>' : '';
  app.innerHTML = `<p class="status">${escapeHtml(text)}</p>${back}`;
}

// ---------- Lista de aventureros ----------

function renderRoster(armory) {
  const viewers = Object.entries(armory.viewers)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  const rows = viewers.map(([login, viewer]) => `
    <a class="row" href="?u=${encodeURIComponent(login)}">
      <img class="row-icon" src="${classIcon(viewer)}" alt="">
      <span class="row-name" style="color:${classOf(viewer).color}">${escapeHtml(viewer.name)}</span>
      <span class="row-meta">${uniqueItems(viewer).length} objetos · ${viewer.spells.length} hechizos</span>
    </a>`);

  app.innerHTML = `
    <section class="frame">
      <header class="frame-title"><h1>Armería</h1></header>
      <div class="panel">
        <div class="list">${rows.join('') || '<p class="status">Nadie tiene botín todavía.</p>'}</div>
      </div>
    </section>`;
}

// ---------- Personaje ----------

function renderViewer(viewer) {
  const cls = classOf(viewer);
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));

  app.innerHTML = `
    <section class="frame" style="--class-color:${cls.color}">
      <header class="frame-title">
        <img class="portrait" src="${classIcon(viewer)}" alt="">
        <h1>${escapeHtml(viewer.name)}</h1>
        <p class="subtitle">${cls.name}</p>
      </header>
      <div class="panel" data-tab="character">${paperdoll(viewer, itemsById)}</div>
      <div class="panel" data-tab="inventory" hidden>${inventory(viewer)}</div>
      <div class="panel" data-tab="spells" hidden>${spellbook(viewer)}</div>
    </section>
    <nav class="tabs">
      ${Object.entries(TABS).map(([key, label]) => `<button data-tab="${key}">${label}</button>`).join('')}
    </nav>
    <a class="back" href="./">Ver todos los aventureros</a>`;

  app.querySelectorAll('.tabs button').forEach(button =>
    button.addEventListener('click', () => showTab(button.dataset.tab)));
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
  const count = rarity => items.filter(item => item.rarity === rarity).length;
  const stats = [
    ['Objetos', items.length],
    ['Equipados', Object.keys(viewer.equipped).length],
    ['Épicos', count('epic')],
    ['Legendarios', count('legendary')],
    ['Hechizos', viewer.spells.length]
  ];

  return `
    <div class="paperdoll">
      ${column('left')}
      <div class="model">
        <img class="crest" src="${classIcon(viewer)}" alt="">
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

function spellbook(viewer) {
  const rows = viewer.spells.map(spell => `
    <a class="row" href="${spellUrl(spell.id)}">
      <img class="row-icon" src="${escapeHtml(spell.icon)}" alt="">
      <span class="row-name spell-name">${escapeHtml(spell.name)}</span>
    </a>`);
  return `<div class="list two-columns">${rows.join('') || '<p class="status">Todavía no aprendió ningún hechizo.</p>'}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
