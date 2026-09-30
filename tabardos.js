// Casillero Tabardo (pestaña Personaje): el tabardo elegido y, en la flechita, los que ya desbloqueó con logros.
// Son cosméticos (la API los calcula en viewer.tabards); se ponen con !tabardo, igual que el título
const NO_TABARD = 'ninguno';

const chosenTabard = viewer => (viewer.tabards || []).find(t => t.id === viewer.tabard) || null;
// Con la forma de un objeto, para la ventana de equipar (ícono con URL completa)
const tabardItem = tabard => ({ ...tabard, icon: iconUrl(tabard.icon) });

function tabardSlotHtml(viewer) {
  const chosen = chosenTabard(viewer);
  const others = (viewer.tabards || []).filter(t => t !== chosen);
  const slot = chosen
    ? `<a class="slot" data-rarity="${chosen.rarity}" href="${itemUrl(chosen.id)}"><img src="${iconUrl(chosen.icon)}" alt=""></a>`
    : `<span class="slot empty" title="${SLOTS.tabard.label}"><img src="${iconUrl('inventoryslot_tabard')}" alt=""></span>`;
  if (!chosen && !others.length) return slot;

  const remove = chosen ? '<button class="unequip-button tabard-remove" type="button">Quitar tabardo</button>' : '';
  const choices = others.length ? `<div class="swap-choices">${others.map(t =>
    `<a class="slot tabard-option" data-rarity="${t.rarity}" data-id="${t.id}" href="${itemUrl(t.id)}"><img src="${iconUrl(t.icon)}" alt=""></a>`).join('')}</div>` : '';
  return `<span class="worn-slot">${slot}<button class="flyout-arrow" type="button" aria-label="Tabardos"></button><div class="flyout-menu">${remove}${choices}</div></span>`;
}

function setupTabards(viewer) {
  const byId = Object.fromEntries((viewer.tabards || []).map(t => [t.id, t]));
  app.querySelectorAll('.tabard-option').forEach(option => option.addEventListener('click', event => {
    event.preventDefault();
    const tabard = byId[option.dataset.id];
    openItemWindow(tabardItem(tabard), `!tabardo ${tabard.name}`, 'ponértelo', 'Ponerme este tabardo');
  }));
  app.querySelectorAll('.tabard-remove').forEach(button => button.addEventListener('click', () =>
    openItemWindow(tabardItem(chosenTabard(viewer)), `!tabardo ${NO_TABARD}`, 'sacártelo', 'Quitar tabardo')));
}
