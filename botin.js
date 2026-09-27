// Pestaña "Botín": historial de todo lo ganado (objetos y bolsas), del más nuevo al más viejo, con su origen y fecha.
// Los guardados antes de registrar la fecha van al final, sin ella. Solo se mira: equipar y reforjar van en Inventario
const ITEM_SOURCES = { cofre: 'Cofre', tirada: 'Loot de raid', mazmorra: 'Mazmorra', reforja: 'Reforja', subasta: 'Subasta' };

// Hasta que Streamer.bot guarde el historial, se muestra lo que tiene
function lootHistory(viewer) {
  const entries = [...(viewer.loot || viewer.items)].sort((a, b) => (b.obtained || '').localeCompare(a.obtained || ''));

  const rows = entries.map(item => {
    const meta = [
      item.bagSlots && `Bolsa de ${item.bagSlots}`,
      item.instance || ITEM_SOURCES[item.source],
      item.obtained && formatDate(item.obtained)
    ].filter(Boolean).join(' · ');
    return `
      <div class="row" data-rarity="${item.rarity}">
        <a class="row-link" href="${itemUrl(item.id)}">
          <span class="row-icon slot"><img src="${escapeHtml(item.icon)}" alt=""></span>
          <span class="row-name item-name">${escapeHtml(item.name)}</span>
        </a>
        <span class="row-meta">${meta}</span>
      </div>`;
  });

  return `<div class="list history">${rows.join('') || '<p class="status">Todavía no ganó botín.</p>'}</div>`;
}
