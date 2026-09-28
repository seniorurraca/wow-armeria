// Noticias de WoW Forever (la API lee el RSS de Wowhead). Solo en la landing
if (!viewerLogin && !auctionMode) showNews();

async function showNews() {
  const list = document.getElementById('news-list');
  const res = await fetch(`${API_URL}/news`).catch(() => null);
  const items = res && res.ok ? (await res.json()).items : null;
  if (!items || !items.length) {
    list.innerHTML = '<p class="status">No se pudieron cargar las noticias. Míralas en <a class="text-link" href="https://www.wowhead.com/news" target="_blank" rel="noopener">Wowhead</a>.</p>';
    return;
  }
  list.innerHTML = items.map(newsCard).join('');
}

function newsCard(item) {
  const date = new Date(item.date).toLocaleDateString('es', { day: 'numeric', month: 'long' });
  const image = item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">` : '';
  return `
    <a class="news-card" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">
      ${image}
      <span class="news-body">
        <small>${escapeHtml(date)}</small>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.summary)}</span>
      </span>
    </a>`;
}
