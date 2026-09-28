// Visitas a la armería: cada navegador cuenta una por día, en cualquier página (ficha, subasta, landing).
// La landing muestra el total, las de los últimos 14 días y de qué países llegan (el país lo pone Cloudflare; no se guarda la IP)
const VISIT_KEY = 'armeriaVisita';
const COUNTRIES_SHOWN = 8;
const onLanding = !viewerLogin && !auctionMode;

countVisit();

async function countVisit() {
  const today = new Date().toLocaleDateString('en-CA');
  let counted = null;
  try { counted = localStorage.getItem(VISIT_KEY); } catch (e) {}
  const isNew = counted !== today;
  if (!isNew && !onLanding) return;

  const res = await fetch(`${API_URL}/${isNew ? 'visit' : 'visits'}`, isNew ? { method: 'POST' } : undefined).catch(() => null);
  if (res && res.ok && isNew) {
    try { localStorage.setItem(VISIT_KEY, today); } catch (e) {}
  }
  if (!onLanding) return;
  if (!res || !res.ok) {
    document.getElementById('visits').innerHTML = '<p class="status">No se pudieron cargar las visitas.</p>';
    return;
  }
  renderVisits(await res.json());
}

const formatCount = n => n.toLocaleString('es');
const visitWord = n => (n === 1 ? 'visita' : 'visitas');

function renderVisits({ total, today, week, days, countries }) {
  document.getElementById('visits').innerHTML = `
    <div class="visit-stats">
      ${visitStat(total, 'en total')}
      ${visitStat(today, 'hoy')}
      ${visitStat(week, 'últimos 7 días')}
    </div>
    <div class="visit-panels">
      <div class="visit-panel">
        <h3>Últimos ${days.length} días</h3>
        ${visitChart(days)}
      </div>
      <div class="visit-panel">
        <h3>Países</h3>
        ${countryList(countries)}
      </div>
    </div>`;
}

function visitStat(value, label) {
  return `<div class="visit-stat"><strong>${formatCount(value)}</strong><span>${label}</span></div>`;
}

// Una barra por día, relativa al día con más visitas; el número exacto al pasar el mouse (o con el teclado)
function visitChart(days) {
  const top = Math.max(1, ...days.map(d => d.count));
  const bars = days.map(({ day, count }) => {
    const date = new Date(`${day}T12:00:00Z`);
    const label = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    const tip = `${label}: ${formatCount(count)} ${visitWord(count)}`;
    return `
      <div class="visit-day" tabindex="0" data-tip="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}">
        <span class="visit-column"><span class="visit-bar" style="height:${(100 * count) / top}%"></span></span>
        <small>${date.getUTCDate()}</small>
      </div>`;
  }).join('');
  return `<div class="visit-chart">${bars}</div>`;
}

const regionNames = (() => {
  try { return new Intl.DisplayNames(['es'], { type: 'region' }); } catch (e) { return null; }
})();

function countryName(code) {
  if (code === 'XX' || code === 'T1') return 'Desconocido';
  try { return (regionNames && regionNames.of(code)) || code; } catch (e) { return code; }
}

// Los que más visitan, y el resto sumado en "Otros"
function countryList(countries) {
  if (!countries.length) return '<p class="status">Todavía no hay visitas.</p>';
  const shown = countries.slice(0, COUNTRIES_SHOWN);
  const others = countries.slice(COUNTRIES_SHOWN).reduce((sum, c) => sum + c.count, 0);
  if (others) shown.push({ country: null, count: others });
  const top = Math.max(...shown.map(c => c.count));
  return `<ol class="visit-countries">${shown.map(({ country, count }) => {
    const known = country && country !== 'XX' && country !== 'T1';
    const flag = known ? `<img src="https://flagcdn.com/w40/${country.toLowerCase()}.png" alt="" loading="lazy">` : '<span class="visit-flag-empty"></span>';
    return `
      <li>
        ${flag}
        <span class="visit-country-name">${escapeHtml(country ? countryName(country) : 'Otros')}</span>
        <span class="visit-country-bar"><span style="width:${(100 * count) / top}%"></span></span>
        <span class="visit-country-count">${formatCount(count)}</span>
      </li>`;
  }).join('')}</ol>`;
}
