// Botón "Equipar" (pestañas Inventario y Botín): abre una ventana con el objeto brillando y el comando
// "!equipar nombre" para pegar en el chat. Streamer.bot (wow-armeria.cs) lo equipa si su clase lo puede usar

// Solo objetos que se equipan y que no lleva puestos
function equipButton(item, viewer) {
  if (!item.slot || Object.values(viewer.equipped).includes(item.id)) return '';
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
      <p>Pega esto en el chat del stream para equipártelo:</p>
      ${commandBox(command)}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);

  setupCopyButton(overlay, command);
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}
