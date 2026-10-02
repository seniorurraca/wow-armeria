// Todas las pestañas de la ficha miden lo mismo que "Personaje". Las listas largas (Inventario, Botín, Logros)
// se parten en páginas con lo que entra en ese alto, y se recalculan si cambia el tamaño (ventana, panel de reforja)
const PAGED_LISTS = '.bag-list, .history, .achievements';

function fixPanelHeight(frame) {
  const character = frame.querySelector('.panel[data-tab="character"]');
  frame.style.setProperty('--panel-height', `${character.offsetHeight}px`);
  frame.classList.add('fixed-tabs');
}

function setupPagedLists(root) {
  root.querySelectorAll(PAGED_LISTS).forEach(paginate);
}

// ◀ Página x de y ▶ abajo de list: onStep(-1 o 1) al tocar una flecha; devuelve update(page, pages) para pintarlo
function addPager(list, onStep) {
  const pager = document.createElement('div');
  pager.className = 'spell-pager list-pager';
  pager.innerHTML = `
    <button class="page-prev" aria-label="Página anterior">◀</button>
    <span class="page-label"></span>
    <button class="page-next" aria-label="Página siguiente">▶</button>`;
  list.after(pager);

  const prev = pager.querySelector('.page-prev');
  const next = pager.querySelector('.page-next');
  prev.addEventListener('click', () => onStep(-1));
  next.addEventListener('click', () => onStep(1));

  return (page, pages) => {
    pager.querySelector('.page-label').textContent = `Página ${page + 1} de ${pages}`;
    prev.disabled = page === 0;
    next.disabled = page === pages - 1;
    pager.hidden = pages === 1;
    if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
  };
}

// Páginas de tamaño fijo (subasta, ranking): renderPage(los de la página, cuántos hay antes) pinta list.
// Devuelve show(items, keepPage): con keepPage sigue en la misma página, si no vuelve a la primera
function fixedPages(list, perPage, renderPage) {
  let items = [];
  let page = 0;
  const update = addPager(list, step => { page += step; paint(); });

  const paint = () => {
    const pages = Math.max(1, Math.ceil(items.length / perPage));
    page = Math.min(page, pages - 1);
    renderPage(items.slice(page * perPage, (page + 1) * perPage), page * perPage);
    update(page, pages);
  };

  return (newItems, keepPage = false) => {
    items = newItems;
    if (!keepPage) page = 0;
    paint();
  };
}

function paginate(list) {
  const items = [...list.children].filter(el => !el.matches('.status'));
  let page = 0;
  let perPage = items.length;
  const update = addPager(list, step => { page += step; show(); });

  const show = () => {
    const pages = Math.max(1, Math.ceil(items.length / perPage));
    page = Math.min(page, pages - 1);
    items.forEach((el, i) => el.hidden = Math.floor(i / perPage) !== page);
    update(page, pages);
  };

  // Con todo visible, cuenta cuántos entran enteros en el alto de la lista (en la pestaña oculta mide 0: se espera)
  const measure = () => {
    if (!list.clientHeight) return;
    items.forEach(el => el.hidden = false);
    const bottom = list.getBoundingClientRect().top + list.clientHeight + 1;
    perPage = Math.max(1, items.filter(el => el.getBoundingClientRect().bottom <= bottom).length);
    show();
  };

  new ResizeObserver(measure).observe(list);
}
