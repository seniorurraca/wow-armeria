// Casa de subastas (./?subasta, con &u=nick muestra tu oro y tus subastas) y ventana "Vender" del Inventario.
// La página arma "!vender id precio" y "!comprar n°" para pegar en el chat; Streamer.bot (wow-armeria.cs) mueve oro y objetos
const AUCTION_HOURS = 24;
const AUCTION_DEPOSIT_PERCENT = 5;
const AUCTION_RARITIES = ['uncommon', 'rare', 'epic'];
const AUCTIONEER_ICON = 'inv_misc_coin_02';
const MAX_AUCTION_GOLD = 100000;
const RARITY_NAMES = { uncommon: 'Poco común', rare: 'Raro', epic: 'Épico' };

// Tipo de Wowhead → categoría de la columna izquierda, como en el juego
const AUCTION_CATEGORIES = [
  { key: 'all', label: 'Todo' },
  { key: 'weapon', label: 'Armas' },
  { key: 'armor', label: 'Armadura' },
  { key: 'Cloth', label: 'Tela', sub: true },
  { key: 'Leather', label: 'Cuero', sub: true },
  { key: 'Mail', label: 'Malla', sub: true },
  { key: 'Plate', label: 'Placas', sub: true },
  { key: 'Shield', label: 'Escudos', sub: true },
  { key: 'bag', label: 'Contenedores' },
  { key: 'other', label: 'Joyería y otros' }
];
const ARMOR_TYPES = ['Cloth', 'Leather', 'Mail', 'Plate', 'Shield'];
const WEAPON_TYPES = ['Dagger', 'Fist Weapon', 'Axe', 'Mace', 'Sword', 'Polearm', 'Staff', 'Bow', 'Crossbow', 'Gun', 'Thrown', 'Wand', 'Fishing Pole'];

// Tiempo restante con los tramos del juego
const TIME_LEFT = [[30, 'Corto'], [120, 'Medio'], [720, 'Largo'], [Infinity, 'Muy largo']];

const AUCTION_COLUMNS = [
  { key: 'name', label: 'Objeto', value: a => a.item.name },
  { key: 'level', label: 'Nivel', value: a => a.item.itemLevel || 0 },
  { key: 'time', label: 'Tiempo', value: a => new Date(a.expires) },
  { key: 'seller', label: 'Vendedor', value: a => a.sellerName },
  { key: 'price', label: 'Precio', value: a => a.price }
];

const canAuction = item => item.bagSlots > 0 || AUCTION_RARITIES.includes(item.rarity);
const auctionDeposit = price => Math.max(1, Math.floor(price * AUCTION_DEPOSIT_PERCENT / 100));
const minutesLeft = auction => (new Date(auction.expires) - Date.now()) / 60000;
const activeAuctions = armory => (armory.auctions || []).filter(a => minutesLeft(a) > 0);

function itemCategory(item) {
  if (item.bagSlots) return 'bag';
  if (ARMOR_TYPES.includes(item.type)) return item.type;
  if (WEAPON_TYPES.includes(item.type)) return 'weapon';
  return 'other';
}

function matchesCategory(item, category) {
  if (category === 'all') return true;
  if (category === 'armor') return ARMOR_TYPES.includes(item.type);
  return itemCategory(item) === category;
}

// Precio de referencia para arrancar: más calidad y más nivel, más caro
function suggestedPrice(item) {
  if (item.bagSlots) return item.bagSlots * COPPER_PER_GOLD;
  const silverPerLevel = { uncommon: 10, rare: 40, epic: 200 }[item.rarity];
  return Math.max(1, Math.round((item.itemLevel || 10) * silverPerLevel / 100)) * COPPER_PER_GOLD;
}

// ---------- Casa de subastas ----------

function renderAuctionHouse(armory) {
  const viewer = armory.viewers[viewerLogin];
  const state = { name: '', rarity: '', category: 'all', usable: false, sort: 'price', dir: 1, selected: null };

  app.innerHTML = `
    <section class="frame auction-house">
      <header class="frame-title">
        <img class="portrait" src="${iconUrl(AUCTIONEER_ICON)}" alt="">
        <h1>Casa de subastas</h1>
        <p class="subtitle">Duran ${AUCTION_HOURS} h · depósito del ${AUCTION_DEPOSIT_PERCENT}%, no se devuelve</p>
      </header>
      <div class="panel" data-tab="browse">
        <form class="ah-search">
          <label>Nombre<input class="ah-name" type="search" placeholder="Buscar objeto…"></label>
          <label>Calidad
            <select class="ah-rarity">
              <option value="">Todas</option>
              ${AUCTION_RARITIES.map(r => `<option value="${r}">${RARITY_NAMES[r]}</option>`).join('')}
            </select>
          </label>
          ${viewer ? '<label class="ah-check"><input class="ah-usable" type="checkbox">Utilizable</label>' : ''}
          <button class="wow-button ah-refresh" type="button">Actualizar</button>
        </form>
        <div class="ah-body">
          <nav class="ah-categories">
            ${AUCTION_CATEGORIES.map(c => `<button type="button" data-category="${c.key}"${c.sub ? ' class="sub"' : ''}>${c.label}</button>`).join('')}
          </nav>
          <div class="ah-results"></div>
        </div>
        <footer class="ah-footer">
          ${viewer ? `<span class="ah-gold">Tu oro: ${moneyHtml(viewer.gold ?? 0)}</span>` : '<span></span>'}
          <button class="wow-button ah-buy" type="button" disabled>Comprar</button>
        </footer>
      </div>
      <div class="panel" data-tab="mine" hidden>${myAuctions(armory, viewer)}</div>
    </section>
    <nav class="tabs">
      <button data-tab="browse">Explorar</button>
      <button data-tab="mine">Mis subastas</button>
    </nav>
    <a class="back" href="${viewer ? `./?u=${encodeURIComponent(viewerLogin)}` : './#armeria'}">${viewer ? 'Volver a mi armería' : 'Ver todos los aventureros'}</a>`;

  const results = app.querySelector('.ah-results');
  const buy = app.querySelector('.ah-buy');
  const auctions = activeAuctions(armory);

  const show = () => {
    const shown = auctions.filter(a => auctionMatches(a, state, viewer)).sort(auctionSorter(state));
    if (!shown.some(a => a.id === state.selected)) state.selected = null;
    results.innerHTML = auctionTable(shown, armory, state);
    const selected = auctions.find(a => a.id === state.selected);
    buy.disabled = !selected || selected.seller === viewerLogin;
    app.querySelectorAll('.ah-categories button').forEach(b => b.classList.toggle('active', b.dataset.category === state.category));
    if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
  };

  app.querySelector('.ah-search').addEventListener('submit', event => event.preventDefault());
  app.querySelector('.ah-name').addEventListener('input', event => { state.name = event.target.value.trim().toLowerCase(); show(); });
  app.querySelector('.ah-rarity').addEventListener('change', event => { state.rarity = event.target.value; show(); });
  app.querySelector('.ah-usable')?.addEventListener('change', event => { state.usable = event.target.checked; show(); });
  app.querySelector('.ah-refresh').addEventListener('click', () => loadArmory().then(render));
  app.querySelector('.ah-categories').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) { state.category = button.dataset.category; show(); }
  });
  results.addEventListener('click', event => {
    const header = event.target.closest('th[data-sort]');
    const row = event.target.closest('tr[data-id]');
    if (header) {
      state.dir = state.sort === header.dataset.sort ? -state.dir : 1;
      state.sort = header.dataset.sort;
    } else if (row) {
      event.preventDefault();
      state.selected = Number(row.dataset.id);
    }
    show();
  });
  buy.addEventListener('click', () => openBuyWindow(auctions.find(a => a.id === state.selected), viewer));
  app.querySelectorAll('.tabs button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  setupNickForm();

  show();
  showTab('browse');
}

function auctionMatches(auction, state, viewer) {
  const item = auction.item;
  return item.name.toLowerCase().includes(state.name)
    && (!state.rarity || item.rarity === state.rarity)
    && matchesCategory(item, state.category)
    && (!state.usable || classCanUse(item, viewer.class));
}

function auctionSorter(state) {
  const column = AUCTION_COLUMNS.find(c => c.key === state.sort);
  return (a, b) => {
    const x = column.value(a), y = column.value(b);
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * state.dir;
  };
}

function auctionTable(auctions, armory, state) {
  if (!auctions.length) return '<p class="status">No hay subastas con esos filtros.</p>';
  const arrow = key => state.sort === key ? (state.dir > 0 ? ' ▲' : ' ▼') : '';
  return `
    <table class="ah-table">
      <thead><tr>${AUCTION_COLUMNS.map(c => `<th class="col-${c.key}" data-sort="${c.key}">${c.label}${arrow(c.key)}</th>`).join('')}</tr></thead>
      <tbody>${auctions.map(a => auctionRow(a, armory, state)).join('')}</tbody>
    </table>`;
}

function auctionRow(auction, armory, state) {
  const item = auction.item;
  const seller = armory.viewers[auction.seller];
  const color = seller ? classOf(seller).color : NO_CLASS.color;
  return `
    <tr data-id="${auction.id}" data-rarity="${item.rarity}"${auction.id === state.selected ? ' class="selected"' : ''}>
      <td class="col-name">
        <a class="row-link" href="${itemUrl(item.id)}">
          <span class="row-icon slot"><img src="${escapeHtml(item.icon)}" alt=""></span>
          <span class="item-name">${escapeHtml(item.name)}<small>N° ${auction.id}</small></span>
        </a>
      </td>
      <td class="col-level">${item.bagSlots ? `${item.bagSlots} casillas` : item.itemLevel || '—'}</td>
      <td class="col-time" title="${timeLeftText(auction)}">${TIME_LEFT.find(([max]) => minutesLeft(auction) < max)[1]}</td>
      <td class="col-seller" style="color:${color}">${escapeHtml(auction.sellerName)}</td>
      <td class="col-price">${moneyHtml(auction.price)}</td>
    </tr>`;
}

function timeLeftText(auction) {
  const minutes = Math.max(0, Math.round(minutesLeft(auction)));
  return `Quedan ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function openBuyWindow(auction, viewer) {
  const item = auction.item;
  const command = `!comprar ${auction.id}`;
  const short = viewer && (viewer.gold ?? 0) < auction.price;
  const overlay = showOverlay(`
    <div class="overlay-window equip-window" data-rarity="${item.rarity}">
      <div class="equip-showcase">
        <div class="rays"></div>
        <span class="slot equip-icon"><img src="${escapeHtml(item.icon)}" alt=""></span>
      </div>
      <a class="item-name equip-name" href="${itemUrl(item.id)}" target="_blank" rel="noopener">[${escapeHtml(item.name)}]</a>
      <p>Precio: ${moneyHtml(auction.price)}</p>
      ${short ? `<p class="ah-warning">Te falta oro: tienes ${moneyHtml(viewer.gold ?? 0)}</p>` : ''}
      <p>Pega esto en el chat del stream para comprarlo:</p>
      ${commandBox(command)}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);
  setupCopyButton(overlay, command);
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}

// ---------- Mis subastas ----------

function myAuctions(armory, viewer) {
  if (!viewerLogin) {
    return `
      <form class="ah-nick">
        <p class="hint">Escribe tu nombre de Twitch para ver tu oro y tus subastas.</p>
        <input class="ah-nick-input" type="text" placeholder="Tu nombre de Twitch" required>
        <button class="wow-button" type="submit">Ver</button>
      </form>`;
  }
  const mine = activeAuctions(armory).filter(a => a.seller === viewerLogin);
  const rows = mine.map(a => `
    <div class="row" data-rarity="${a.item.rarity}">
      <a class="row-link" href="${itemUrl(a.item.id)}">
        <span class="row-icon slot"><img src="${escapeHtml(a.item.icon)}" alt=""></span>
        <span class="row-name item-name">${escapeHtml(a.item.name)}</span>
      </a>
      <span class="row-meta">N° ${a.id} · ${timeLeftText(a)}</span>
      ${moneyHtml(a.price)}
    </div>`);
  return `
    <p class="hint">Para vender, entra a <a class="ah-link" href="./?u=${encodeURIComponent(viewerLogin)}">tu armería</a> → Inventario → <b>Vender</b>. Si nadie la compra en ${AUCTION_HOURS} h, el objeto vuelve a tu mochila (el depósito no).</p>
    <div class="list history">${rows.join('') || '<p class="status">No tienes subastas activas.</p>'}</div>`;
}

function setupNickForm() {
  const form = app.querySelector('.ah-nick');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    location.search = `?subasta&u=${encodeURIComponent(form.querySelector('.ah-nick-input').value.trim().toLowerCase())}`;
  });
}

// ---------- Vender desde el Inventario ----------

function auctionButton(item) {
  if (!canAuction(item)) return '';
  return `<button class="wow-button auction-button" type="button" data-id="${escapeHtml(item.id)}">Vender</button>`;
}

// Filas del Inventario y casilleros de bolsa (las bolsas se venden tocándolas)
function setupAuctionButtons(viewer) {
  const byId = Object.fromEntries([...viewer.items, ...(viewer.bags || [])].map(item => [item.id, item]));
  app.querySelectorAll('.auction-button, .bag-slot[data-id]').forEach(el =>
    el.addEventListener('click', () => openSellWindow(byId[el.dataset.id], viewer)));
}

function openSellWindow(item, viewer) {
  const gold = viewer.gold ?? 0;
  const start = suggestedPrice(item);
  const overlay = showOverlay(`
    <div class="overlay-window equip-window sell-window" data-rarity="${item.rarity}">
      <div class="equip-showcase">
        <div class="rays"></div>
        <span class="slot equip-icon"><img src="${escapeHtml(item.icon)}" alt=""></span>
      </div>
      <a class="item-name equip-name" href="${itemUrl(item.id)}" target="_blank" rel="noopener">[${escapeHtml(item.name)}]</a>
      <div class="sell-price">
        <label><input class="sell-gold" type="number" min="0" max="${MAX_AUCTION_GOLD}" value="${Math.floor(start / COPPER_PER_GOLD)}"><span class="coin gold"></span></label>
        <label><input class="sell-silver" type="number" min="0" max="99" value="0"><span class="coin silver"></span></label>
      </div>
      <dl class="sell-summary">
        <div><dt>Duración:</dt><dd>${AUCTION_HOURS} horas</dd></div>
        <div><dt>Depósito (${AUCTION_DEPOSIT_PERCENT}%):</dt><dd class="sell-deposit"></dd></div>
        <div><dt>Tu oro:</dt><dd>${moneyHtml(gold)}</dd></div>
      </dl>
      <p class="ah-warning sell-warning" hidden></p>
      <p>Pega esto en el chat del stream para subastarlo:</p>
      <div class="sell-command"></div>
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);

  const update = () => {
    const goldInput = Math.min(MAX_AUCTION_GOLD, Math.max(0, Math.floor(overlay.querySelector('.sell-gold').value) || 0));
    const silverInput = Math.min(99, Math.max(0, Math.floor(overlay.querySelector('.sell-silver').value) || 0));
    const price = goldInput * COPPER_PER_GOLD + silverInput * COPPER_PER_SILVER;
    const deposit = auctionDeposit(price);
    const warning = overlay.querySelector('.sell-warning');
    warning.hidden = price > 0 && gold >= deposit;
    warning.textContent = price === 0 ? 'Ponle un precio.' : 'No te alcanza el oro para el depósito.';
    overlay.querySelector('.sell-deposit').innerHTML = moneyHtml(price ? deposit : 0);
    const box = overlay.querySelector('.sell-command');
    const command = `!vender ${item.id} ${moneyCommand(price)}`;
    box.innerHTML = commandBox(command);
    setupCopyButton(box, command);
  };

  overlay.querySelectorAll('.sell-price input').forEach(input => input.addEventListener('input', update));
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
  update();
}
