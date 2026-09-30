// Botón "Equipar" (pestaña Inventario) y "Desequipar objeto" sobre lo equipado (pestaña Personaje): abren una ventana con el objeto
// brillando y "!equipar nombre" / "!desequipar nombre" (botón directo con la sesión de Twitch, o el comando para el chat)

// Solo objetos que se equipan, que su clase puede usar y que no lleva puestos
function equipButton(item, viewer) {
  if (!item.slot || !classCanUse(item, viewer.class) || Object.values(viewer.equipped).includes(item.id)) return '';
  return `<button class="wow-button equip-button" type="button" data-id="${escapeHtml(item.id)}">Equipar</button>`;
}

// Al costado de cada objeto equipado: una flechita que despliega "Desequipar objeto" y lo de la mochila que va en ese casillero
function wornFlyout(item, slot, viewer) {
  return `<button class="flyout-arrow" type="button" aria-label="Opciones"></button>
    <div class="flyout-menu">
      <button class="unequip-button" type="button" data-id="${escapeHtml(item.id)}">Desequipar objeto</button>
      ${swapChoices(slot, viewer)}
    </div>`;
}

// "#2" le dice a la API en cuál de los dos casilleros va (anillos, abalorios, mano izquierda)
function swapChoices(slot, viewer) {
  const worn = Object.values(viewer.equipped);
  const choices = uniqueItems({ items: bagItems(viewer) })
    .filter(item => !worn.includes(item.id) && slotsFor(item, viewer.class).includes(slot))
    .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || a.name.localeCompare(b.name));
  if (!choices.length) return '';

  const command = item => {
    const slots = slotsFor(item, viewer.class);
    return `!equipar ${item.name}${slots.length > 1 ? ` #${slots.indexOf(slot) + 1}` : ''}`;
  };
  return `<div class="swap-choices">${choices.map(item =>
    `<a class="slot swap-choice" data-rarity="${item.rarity}" data-id="${escapeHtml(item.id)}" data-command="${escapeHtml(command(item))}" href="${itemUrl(item.id)}"><img src="${escapeHtml(item.icon)}" alt=""></a>`).join('')}</div>`;
}

function closeFlyouts(except) {
  app.querySelectorAll('.worn-slot.open').forEach(slot => slot !== except && slot.classList.remove('open'));
}

document.addEventListener('click', event => {
  if (!event.target.closest('.flyout-arrow')) closeFlyouts();
});

function setupEquipButtons(viewer) {
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));
  app.querySelectorAll('.equip-button').forEach(button => button.addEventListener('click', () => {
    const item = itemsById[button.dataset.id];
    openItemWindow(item, `!equipar ${item.name}`, 'equipártelo', 'Equipar');
  }));
  app.querySelectorAll('.flyout-arrow').forEach(arrow => arrow.addEventListener('click', () => {
    const slot = arrow.parentElement;
    closeFlyouts(slot);
    slot.classList.toggle('open');
  }));
  app.querySelectorAll('.unequip-button[data-id]').forEach(button => button.addEventListener('click', () => {
    const item = itemsById[button.dataset.id];
    openItemWindow(item, `!desequipar ${item.name}`, 'pasarlo a la bolsa', 'Mover a la bolsa');
  }));
  app.querySelectorAll('.swap-choice').forEach(choice => choice.addEventListener('click', event => {
    event.preventDefault();
    openItemWindow(itemsById[choice.dataset.id], choice.dataset.command, 'equipártelo', 'Equipar');
  }));
}
