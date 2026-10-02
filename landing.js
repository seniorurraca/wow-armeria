const CHANNEL = 'seniorurraca';

// Fondos del hero; con más de uno rotan como carrusel
const HERO_IMAGES = [
  'img/hero-horda.jpg',
  'img/hero-valle.jpg',
  'img/hero-alianza.jpg',
  'img/hero-isla.jpg',
  'img/hero-ciudad.jpg'
];
const HERO_INTERVAL_MS = 7000;

// DecAPI: servicio público que responde el estado del canal sin credenciales
const LIVE_URL = `https://decapi.me/twitch/uptime/${CHANNEL}`;
const AVATAR_URL = `https://decapi.me/twitch/avatar/${CHANNEL}`;

startHeroSlides();
showLiveStatus();
showChannelAvatar();

function startHeroSlides() {
  const container = document.getElementById('hero-slides');
  container.innerHTML = HERO_IMAGES.map((src, i) =>
    `<div class="hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${src}')"></div>`).join('');
  if (HERO_IMAGES.length < 2) return;

  const slides = [...container.children];
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, HERO_INTERVAL_MS);
}

async function showLiveStatus() {
  const text = await fetch(LIVE_URL).then(r => r.text()).catch(() => '');
  if (!text) return;
  const live = !/offline/i.test(text);
  document.querySelectorAll('[data-live]').forEach(el => el.dataset.live = live ? 'on' : 'off');
  document.querySelectorAll('.live-label').forEach(el => el.textContent = live ? 'En vivo' : 'Offline');
  document.querySelectorAll('.live-cta').forEach(el => el.textContent = live ? '¡Estoy en vivo! Entrar' : 'Ver en Twitch');
}

async function showChannelAvatar() {
  const url = (await fetch(AVATAR_URL).then(r => r.text()).catch(() => '')).trim();
  if (!url.startsWith('https://')) return;
  document.getElementById('brand-avatar').src = url;
  document.getElementById('favicon').href = url;
}

// ---------- Ranking de la armería ----------

const RANKING_PER_PAGE = 15;
let showRankingPage = null;

// Por GearScore del equipo puesto; desempata por legendarios y épicos
function renderRanking(armory) {
  const ranked = Object.entries(armory.viewers)
    .map(([login, viewer]) => {
      const items = uniqueItems(viewer);
      return { login, viewer, score: gearScore(viewer), epic: countRarity(items, 'epic'), legendary: countRarity(items, 'legendary') };
    })
    .sort((a, b) => b.score - a.score || b.legendary - a.legendary || b.epic - a.epic || a.viewer.name.localeCompare(b.viewer.name));

  if (!ranked.length) return renderRankingStatus('Nadie tiene botín todavía. ¡Sé el primero en abrir un cofre!');

  const list = document.getElementById('ranking-list');
  showRankingPage ??= fixedPages(list, RANKING_PER_PAGE, (page, offset) => {
    list.innerHTML = page.map((entry, i) => rankingRow(entry, offset + i + 1)).join('');
  });
  showRankingPage(ranked);
}

function rankingRow({ login, viewer, score, epic, legendary }, rank) {
  return `
    <a class="row" href="?u=${encodeURIComponent(login)}">
      <span class="rank">${rank}</span>
      <span class="row-portrait">
        ${framedPortrait(viewer, portrait(viewer), 'row-icon')}
        <span class="level-badge" title="${levelText(viewer)}">${levelOf(viewer)}</span>
      </span>
      ${roleIcon(viewer.role) || '<span class="role-icon"></span>'}
      <span class="row-name" style="color:${classOf(viewer).color}">${escapeHtml(titledName(viewer))}</span>
      <span class="row-meta">
        <span data-rarity="legendary" class="item-name">${legendary} leg.</span> ·
        <span data-rarity="epic" class="item-name">${epic} ép.</span>
      </span>
      <span class="row-score">${coloredGearScore(score)}<small>GS</small></span>
    </a>`;
}

function renderRankingStatus(text) {
  document.getElementById('ranking-list').innerHTML = `<p class="status">${escapeHtml(text)}</p>`;
}
