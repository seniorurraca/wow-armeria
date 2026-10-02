// Noticias de WoW Forever (la API lee el RSS de Wowhead) y, adelante, las del canal desde su fecha. Solo en la landing
if (!viewerLogin && !auctionMode) showNews();

const CHANNEL_NEWS = [
  {
    from: QUARTERS_LAUNCH,
    title: '¡Abrió El Cuartel de SeniorUrraca!',
    summary: 'Manda a tu avatar y a tus seguidores a misiones mientras el stream está apagado. Vuelven con reputación, oro y suministros para la próxima mazmorra. Entra con Twitch y ábrelo desde el botón Cuartel de arriba.',
    link: './?cuartel',
    image: 'img/hero-ciudad.jpg'
  }
];

function channelNewsCards() {
  return CHANNEL_NEWS.filter(post => Date.now() >= post.from).map(post => `
    <a class="news-card channel-news" href="${post.link}">
      <img src="${post.image}" alt="" loading="lazy">
      <span class="news-body">
        <small>Del canal · ${new Date(post.from).toLocaleDateString('es', { day: 'numeric', month: 'long' })}</small>
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.summary)}</span>
      </span>
    </a>`).join('');
}

async function showNews() {
  const list = document.getElementById('news-list');
  const res = await fetch(`${API_URL}/news`).catch(() => null);
  const items = res && res.ok ? (await res.json()).items : null;
  if (!items || !items.length) {
    list.innerHTML = channelNewsCards() + '<p class="status">No se pudieron cargar las noticias. Míralas en <a class="text-link" href="https://www.wowhead.com/news" target="_blank" rel="noopener">Wowhead</a>.</p>';
    return;
  }
  list.innerHTML = channelNewsCards() + items.map(newsCard).join('');
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
