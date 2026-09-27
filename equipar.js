// Botón "Equipar" (pestaña Inventario): abre una ventana con el objeto brillando y "!equipar nombre"
// (botón directo con la sesión de Twitch, o el comando para pegar en el chat). La API lo equipa si su clase lo puede usar

// Solo objetos que se equipan, que su clase puede usar y que no lleva puestos
function equipButton(item, viewer) {
  if (!item.slot || !classCanUse(item, viewer.class) || Object.values(viewer.equipped).includes(item.id)) return '';
  return `<button class="wow-button equip-button" type="button" data-id="${escapeHtml(item.id)}">Equipar</button>`;
}

function setupEquipButtons(viewer) {
  const itemsById = Object.fromEntries(viewer.items.map(item => [item.id, item]));
  app.querySelectorAll('.equip-button').forEach(button =>
    button.addEventListener('click', () => openEquipWindow(itemsById[button.dataset.id])));
}

function openEquipWindow(item) {
  const command = `!equipar ${item.name}`;
  const overlay = showOverlay(`
    <div class="overlay-window equip-window" data-rarity="${item.rarity}">
      <div class="equip-showcase">
        <div class="rays"></div>
        <span class="slot equip-icon"><img src="${escapeHtml(item.icon)}" alt=""></span>
      </div>
      <a class="item-name equip-name" href="${itemUrl(item.id)}" target="_blank" rel="noopener">[${escapeHtml(item.name)}]</a>
      ${commandBlock(command, 'equipártelo', 'Equipar')}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);

  setupCommand(overlay, () => overlay.remove());
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}
