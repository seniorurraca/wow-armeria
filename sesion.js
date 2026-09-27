// "Iniciar sesión con Twitch": la API hace el intercambio con Twitch y vuelve con #sesion=... en la URL.
// La sesión (30 días) queda en este navegador; se verifica contra la API al abrir la página
const SESSION_KEY = 'armeriaSesion';

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
    pill.title = 'Mi armería';
  } else {
    pill.href = `${API_URL}/auth/login?return=${encodeURIComponent(location.origin + location.pathname + location.search)}`;
    pill.innerHTML = 'Entrar<span class="session-long"> con Twitch</span>';
    pill.removeAttribute('title');
  }
  pill.classList.toggle('logged-in', !!user);
  pill.hidden = false;
  logout.hidden = !user;
}

const sessionToken = takeSessionFromUrl() || storedSession();
const currentUser = sessionUser(sessionToken);
currentUser.then(renderSession);

document.getElementById('session-logout').addEventListener('click', () => {
  storeSession(null);
  renderSession(null);
});
