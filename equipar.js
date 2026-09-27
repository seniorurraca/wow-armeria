// Botón "Equipar" (pestaña Inventario) y "Desequipar objeto" sobre lo equipado (pestaña Personaje): abren una ventana con el objeto
// brillando y "!equipar nombre" / "!desequipar nombre" (botón directo con la sesión de Twitch, o el comando para el chat)

// Solo objetos que se equipan, que su clase puede usar y que no lleva puestos
function equipButton(item, viewer) {
  if (!item.slot || !classCanUse(item, viewer.class) || Object.values(viewer.equipped).includes(item.id)) return '';
  return `<button class="wow-button equip-button" type="button" data-id="${escapeHtml(item.id)}">Equipar</button>`;
}

// Al costado de cada objeto equipado: se ve al pasar el mouse (en celular, una ✕ fija)
function unequipButton(item) {
  return `<button class="unequip-button" type="button" data-id="${escapeHtml(item.id)}">Desequipar objeto</button>`;
}

function setupEquipButtons(viewer) {
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));
  app.querySelectorAll('.equip-button').forEach(button => button.addEventListener('click', () => {
    const item = itemsById[button.dataset.id];
    openItemWindow(item, `!equipar ${item.name}`, 'equipártelo', 'Equipar');
  }));
  app.querySelectorAll('.unequip-button').forEach(button => button.addEventListener('click', () => {
    const item = itemsById[button.dataset.id];
    openItemWindow(item, `!desequipar ${item.name}`, 'pasarlo a la bolsa', 'Mover a la bolsa');
  }));
}
