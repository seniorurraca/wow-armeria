// Mochila de 16 casillas + hasta 4 bolsas: mismas reglas que BagItems/BagCapacity en streamerbot/wow-armeria.cs.
// Lo que llega con la mochila llena viene marcado "pending" y no se muestra hasta que se libera lugar
const BACKPACK_SLOTS = 16;
const MAX_BAGS = 4;
const BACKPACK_ICON = 'inv_misc_bag_08';

// Copias visibles que ocupan casilla: las primeras de cada objeto equipado son las que lleva puestas
function bagItems(viewer) {
  const worn = {};
  Object.values(viewer.equipped).forEach(id => worn[id] = (worn[id] || 0) + 1);
  return viewer.items.filter(item => {
    if (item.pending) return false;
    if (!worn[item.id]) return true;
    worn[item.id]--;
    return false;
  });
}

function bagCapacity(viewer) {
  return BACKPACK_SLOTS + (viewer.bags || []).reduce((sum, bag) => sum + bag.bagSlots, 0);
}

function bagBar(viewer, used) {
  const bags = viewer.bags || [];
  const free = Math.max(0, bagCapacity(viewer) - used);
  const waiting = viewer.items.filter(item => item.pending).length;
  const bagSlot = (icon, slots, rarity, id) =>
    `<span class="slot bag-slot" data-rarity="${rarity}"${id ? ` data-id="${escapeHtml(id)}"` : ''} title="${slots} casillas${id ? ' · toca para venderla' : ''}"><img src="${escapeHtml(icon)}" alt=""><b class="count">${slots}</b></span>`;
  const emptySlots = Array.from({ length: MAX_BAGS - bags.length },
    () => `<span class="slot bag-slot empty" title="Casillero de bolsa vacío"><img src="${iconUrl('inventoryslot_bag')}" alt=""></span>`);

  return `
    <div class="bag-bar">
      <div class="bag-slots">
        ${bagSlot(iconUrl(BACKPACK_ICON), BACKPACK_SLOTS, 'common')}
        ${bags.map(bag => bagSlot(bag.icon, bag.bagSlots, bag.rarity, bag.id)).join('')}
        ${emptySlots.join('')}
      </div>
      <span class="bag-free${free === 0 ? ' full' : ''}">Huecos libres: <b>${free}</b> / ${bagCapacity(viewer)}</span>
    </div>
    ${waiting ? `<p class="hint bag-waiting">🎒 Mochila llena: ${waiting === 1 ? '1 objeto espera' : `${waiting} objetos esperan`} lugar. Aparece${waiting === 1 ? '' : 'n'} cuando liberes espacio (equipar o reforjar) o consigas otra bolsa.</p>` : ''}`;
}
