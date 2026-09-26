// Pestaña "Logros" de la ficha. La lista viene del gist (definida en el C# de Streamer.bot)
function achievementList(viewer, achievements) {
  const earned = Object.fromEntries((viewer.achievements || []).map(a => [a.id, a.obtained]));
  const earnedCount = achievements.filter(a => earned[a.id]).length;

  const cards = visibleAchievements(achievements, earned).map(a => {
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

// Logros con niveles ("intimidacion-1", "intimidacion-25"...): los conseguidos y solo el próximo
function visibleAchievements(achievements, earned) {
  const family = a => a.id.replace(/-\d+$/, '');
  const nextLocked = new Set();
  return achievements.filter(a => {
    if (earned[a.id] || !/-\d+$/.test(a.id)) return true;
    if (nextLocked.has(family(a))) return false;
    nextLocked.add(family(a));
    return true;
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
