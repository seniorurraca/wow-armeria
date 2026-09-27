// Pestaña "Botín": cada objeto ganado, del más nuevo al más viejo, con su origen y fecha.
// Los guardados antes de registrar la fecha van al final, sin ella. Desde acá se eligen los objetos para reforjar
const ITEM_SOURCES = { cofre: 'Cofre', tirada: 'Loot de raid', mazmorra: 'Mazmorra', reforja: 'Reforja' };

function lootHistory(viewer) {
  const items = [...viewer.items].sort((a, b) => (b.obtained || '').localeCompare(a.obtained || ''));
  // Las copias equipadas no se pueden reforjar: se marcan tantas como casilleros ocupa ese objeto
  const worn = {};
  Object.values(viewer.equipped).forEach(id => worn[id] = (worn[id] || 0) + 1);

  const rows = items.map(item => {
    const equipped = worn[item.id] > 0;
    if (equipped) worn[item.id]--;
    const meta = [item.instance || ITEM_SOURCES[item.source], item.obtained && formatDate(item.obtained)].filter(Boolean).join(' · ');
    return `
      <a class="row${equipped ? ' locked' : ''}" data-rarity="${item.rarity}" data-id="${escapeHtml(item.id)}" href="${itemUrl(item.id)}">
        <span class="row-icon slot"><img src="${escapeHtml(item.icon)}" alt=""></span>
        <span class="row-name item-name">${escapeHtml(item.name)}</span>
        <span class="row-meta${equipped ? ' equipped' : ''}">${equipped ? 'Equipado' : meta}</span>
      </a>`;
  });

  return `${reforgeBar()}<div class="list loot-list">${rows.join('') || '<p class="status">Todavía no ganó botín.</p>'}</div>`;
}
