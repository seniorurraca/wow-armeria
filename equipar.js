// Botón "Equipar" (pestaña Inventario) y "Desequipar objeto" sobre lo equipado (pestaña Personaje): abren una ventana con el objeto
// brillando y "!equipar nombre" / "!desequipar nombre" (botón directo con la sesión de Twitch, o el comando para el chat)

// Solo objetos que se equipan, que su clase puede usar y que no lleva puestos
function equipButton(item, viewer) {
  if (!item.slot || !classCanUse(item, viewer.class) || Object.values(viewer.equipped).includes(item.id)) return '';
  return `<button class="wow-button equip-button" type="button" data-id="${escapeHtml(item.id)}">Equipar</button>`;
}

// Al costado de cada objeto equipado: una flechita que despliega "Desequipar objeto"
function unequipButton(item) {
  return `<button class="flyout-arrow" type="button" aria-label="Opciones"></button>
    <button class="unequip-button" type="button" data-id="${escapeHtml(item.id)}">Desequipar objeto</button>`;
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
  app.querySelectorAll('.unequip-button').forEach(button => button.addEventListener('click', () => {
    const item = itemsById[button.dataset.id];
    openItemWindow(item, `!desequipar ${item.name}`, 'pasarlo a la bolsa', 'Mover a la bolsa');
  }));
}
