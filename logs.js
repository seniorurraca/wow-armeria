// Registro de actividad (solo el streamer): la API lo devuelve con la sesión de Twitch de quien entra.
// Las fechas del filtro y de la tabla van en hora de Buenos Aires
const API_URL = 'https://wow-armeria-api.wow-armeria-api.workers.dev';
const SESSION_KEY = 'armeriaSesion';
const TIME_ZONE = 'America/Argentina/Buenos_Aires';
const UTC_OFFSET = '-03:00';
const DAY_MS = 86400000;
const OK_STATUS = 200;
const STATUS_TEXT = { 200: 'OK', 400: 'rechazado por el juego', 500: 'error de la API', 502: 'Twitch no pudo cobrar o devolver' };

const $ = id => document.getElementById(id);
let entries = [];

function storedSession() {
  try { return localStorage.getItem(SESSION_KEY); } catch (err) { return null; }
}

// Misma sesión que la armería: llega en #sesion= al volver de Twitch
function takeSession() {
  const match = location.hash.match(/^#sesion=(.+)$/);
  if (!match) return storedSession();
  history.replaceState(null, '', location.pathname + location.search);
  try { localStorage.setItem(SESSION_KEY, match[1]); } catch (err) { /* dura lo que la pestaña */ }
  return match[1];
}

const token = takeSession();

// "2026-10-01T21:30" en hora de Buenos Aires ↔ milisegundos
const inputToMs = value => Date.parse(`${value}:00${UTC_OFFSET}`);
const msToInput = ms => new Date(ms + Number(UTC_OFFSET.slice(0, 3)) * 3600000).toISOString().slice(0, 16);

const timeText = new Intl.DateTimeFormat('es-AR', {
  timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});

function setRange(range) {
  const now = Date.now();
  const from = {
    today: inputToMs(`${msToInput(now).slice(0, 10)}T00:00`),
    '24h': now - DAY_MS,
    '30d': now - 30 * DAY_MS
  }[range];
  $('from').value = msToInput(from);
  $('to').value = '';
}

function showStatus(text, withLogin) {
  $('status').textContent = text;
  $('status').hidden = !text;
  $('login').hidden = !withLogin;
  $('login').href = `${API_URL}/auth/login?return=${encodeURIComponent(location.origin + location.pathname)}`;
}

async function load() {
  if (!token) return showStatus('Entrá con tu cuenta de Twitch para ver el registro.', true);
  const params = new URLSearchParams({ from: inputToMs($('from').value) });
  if ($('to').value) params.set('to', inputToMs($('to').value) + 59999);
  showStatus('Cargando…');
  const res = await fetch(`${API_URL}/logs?${params}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (!res) return showStatus('No se pudo conectar con la API. Probá de nuevo.');
  if (res.status === 401) return showStatus('La sesión venció: volvé a entrar con Twitch.', true);
  if (res.status === 403) return showStatus('Este registro es solo para el streamer.');
  entries = (await res.json()).entries;
  showStatus('');
  $('panel').hidden = false;
  fillOptions('kind', entries.map(e => e.kind));
  fillOptions('action', entries.map(e => e.action));
  render();
}

// Las opciones de los desplegables salen de lo que hay en el rango; se mantiene la elegida
function fillOptions(id, values) {
  const select = $(id);
  const chosen = select.value;
  const first = select.options[0].outerHTML;
  select.innerHTML = first + [...new Set(values.filter(Boolean))].sort()
    .map(value => `<option>${escapeHtml(value)}</option>`).join('');
  select.value = [...select.options].some(o => o.value === chosen) ? chosen : '';
}

const failed = entry => entry.status !== OK_STATUS;

function visibleEntries() {
  const user = $('user').value.trim().toLowerCase();
  const kind = $('kind').value, action = $('action').value, onlyFailures = $('failures').checked;
  return entries.filter(entry =>
    (!user || entry.login.includes(user) || entry.name.toLowerCase().includes(user)) &&
    (!kind || entry.kind === kind) &&
    (!action || entry.action === action) &&
    (!onlyFailures || failed(entry)));
}

function pointsCell(entry) {
  if (!entry.points) return '';
  return `<span class="logs-points ${entry.pointsOk ? 'ok' : 'bad'}">${escapeHtml(entry.points)}</span>`;
}

function render() {
  const shown = visibleEntries();
  $('count').textContent = `${shown.length} de ${entries.length} registros`;
  $('rows').innerHTML = shown.map(entry => `
    <tr class="${failed(entry) ? 'failed' : ''}">
      <td class="logs-time">${timeText.format(entry.created)}</td>
      <td><span class="logs-dot ${failed(entry) ? 'bad' : 'ok'}" title="${escapeHtml(STATUS_TEXT[entry.status] || '')}"></span></td>
      <td class="logs-code" title="${escapeHtml(STATUS_TEXT[entry.status] || '')}">${entry.status}</td>
      <td>${escapeHtml(entry.name || entry.login)}</td>
      <td>${escapeHtml(entry.kind)}</td>
      <td>${escapeHtml(entry.action)}</td>
      <td>${escapeHtml(entry.input)}</td>
      <td class="logs-result">${escapeHtml(entry.result)}</td>
      <td>${pointsCell(entry)}</td>
    </tr>`).join('') || '<tr><td colspan="9" class="logs-empty">Nada en este rango.</td></tr>';
}

// Lo que se ve, como tabla de texto (columnas separadas por tab) para pegarla en un chat o una planilla
function copyText() {
  const header = ['Hora', 'Estado', 'Código', 'Usuario', 'Tipo', 'Qué', 'Escribió', 'Respuesta del juego', 'Puntos'];
  const rows = visibleEntries().map(entry => [
    timeText.format(entry.created), failed(entry) ? 'FALLO' : 'OK', entry.status, entry.name || entry.login,
    entry.kind, entry.action, entry.input, entry.result.replace(/\n/g, ' | '), entry.points || ''
  ]);
  return [header, ...rows].map(row => row.join('\t')).join('\n');
}

async function copyLog() {
  const button = $('copy');
  const label = button.textContent;
  const copied = await navigator.clipboard.writeText(copyText()).then(() => true, () => false);
  button.textContent = copied ? '¡Copiado!' : 'No se pudo copiar';
  setTimeout(() => { button.textContent = label; }, 2000);
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => {
  setRange(button.dataset.range);
  load();
}));
$('filters').addEventListener('submit', event => {
  event.preventDefault();
  load();
});
['user', 'kind', 'action', 'failures'].forEach(id => $(id).addEventListener('input', render));
$('copy').addEventListener('click', copyLog);

setRange('30d');
load();
