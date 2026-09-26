// Pestaña "Logros" de la ficha. La lista viene del gist (definida en el C# de Streamer.bot)
function achievementList(viewer, achievements) {
  const earned = Object.fromEntries((viewer.achievements || []).map(a => [a.id, a.obtained]));
  const earnedCount = achievements.filter(a => earned[a.id]).length;

  const cards = achievements.map(a => {
    const date = earned[a.id] ? `<span class="achievement-date">${formatDate(earned[a.id])}</span>` : '';
    return `
      <div class="achievement${earned[a.id] ? '' : ' locked'}">
        <img src="${iconUrl(a.icon)}" alt="">
        <span>
          <strong>${escapeHtml(a.name)}</strong>
          <small>${escapeHtml(a.description)}</small>
          ${date}
        </span>
      </div>`;
  });

  return `
    <p class="hint">${earnedCount} de ${achievements.length} logros</p>
    <div class="achievements">${cards.join('') || '<p class="status">Todavía no hay logros.</p>'}</div>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
