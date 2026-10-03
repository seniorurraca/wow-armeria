// "Iniciar sesión con Twitch": la API hace el intercambio con Twitch y vuelve con #sesion=... en la URL.
// La sesión (30 días) queda en este navegador; se verifica contra la API al abrir la página
const SESSION_KEY = 'armeriaSesion';
// Quien inició sesión ({ login, name, avatar }), cuando la API lo confirma
let signedInUser = null;

function storedSession() {
  try { return localStorage.getItem(SESSION_KEY); } catch (err) { return null; }
}

function storeSession(token) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch (err) { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
}

// La sesión llega en el #hash para no quedar en el historial ni en los logs del servidor
function takeSessionFromUrl() {
  const match = location.hash.match(/^#sesion=(.+)$/);
  if (!match) return null;
  history.replaceState(null, '', location.pathname + location.search);
  storeSession(match[1]);
  return match[1];
}

async function sessionUser(token) {
  if (!token) return null;
  const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (res && res.status === 401) storeSession(null);
  return res && res.ok ? res.json() : null;
}

function renderSession(user) {
  const pill = document.getElementById('session-pill');
  const logout = document.getElementById('session-logout');
  if (user) {
    pill.href = `./?u=${encodeURIComponent(user.login)}`;
    pill.innerHTML = `<img src="${escapeHtml(user.avatar || '')}" alt=""><span>${escapeHtml(user.name)}</span>`;
    pill.title = 'Mi personaje';
  } else {
    pill.href = loginUrl();
    pill.innerHTML = 'Entrar<span class="session-long"> con Twitch</span>';
    pill.removeAttribute('title');
  }
  pill.classList.toggle('logged-in', !!user);
  pill.hidden = false;
  logout.hidden = !user;
  renderProfileMenu(user);
  // Registro de actividad (logs.html): solo el streamer; la API tampoco se lo da a nadie más
  document.getElementById('session-logs').hidden = !user || user.login !== CHANNEL;
}

function loginUrl() {
  return `${API_URL}/auth/login?return=${encodeURIComponent(location.origin + location.pathname + location.search)}`;
}

// "!equipar Espada" → la API lo hace con quien inició sesión. { ok, problems }
async function runCommand(command) {
  const [name, ...input] = command.split(' ');
  const res = await fetch(`${API_URL}/action`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: name, input: input.join(' ') })
  }).catch(() => null);
  if (!res) return { ok: false, problems: ['no se pudo conectar con la armería. Prueba de nuevo.'] };
  if (res.status === 401) {
    signOut();
    return { ok: false, problems: ['tu sesión venció: vuelve a entrar con Twitch.'] };
  }
  return res.json();
}

function signOut() {
  storeSession(null);
  signedInUser = null;
  renderSession(null);
}

const sessionToken = takeSessionFromUrl() || storedSession();
const sessionReady = sessionUser(sessionToken).then(user => {
  signedInUser = user;
  renderSession(user);
  if (user) showSessionFrame(user);
  setupQuartersEntry(user);
});
