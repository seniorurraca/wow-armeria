// Caja de sugerencias: todos las leen, solo quien entró con Twitch escribe. Solo en la landing
if (!viewerLogin && !auctionMode) {
  loadSuggestions();
  sessionReady.then(renderSuggestionForm);
}

function renderSuggestionForm() {
  const form = document.getElementById('suggestion-form');
  if (!signedInUser) {
    form.innerHTML = `<p class="suggestion-login"><a class="button primary" href="${escapeHtml(loginUrl())}">Entra con Twitch</a> para dejar una sugerencia.</p>`;
    return;
  }
  form.innerHTML = `
    <textarea class="suggestion-input" maxlength="500" rows="3" placeholder="Tu idea para el canal o la armería..."></textarea>
    <div class="suggestion-actions">
      <span class="suggestion-status"></span>
      <button class="button primary" type="button">Enviar sugerencia</button>
    </div>`;
  form.querySelector('button').addEventListener('click', () => sendSuggestion(form));
}

async function sendSuggestion(form) {
  const input = form.querySelector('.suggestion-input');
  const button = form.querySelector('button');
  const status = form.querySelector('.suggestion-status');
  const text = input.value.trim();
  if (!text) return;

  button.disabled = true;
  const res = await fetch(`${API_URL}/suggestions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  }).catch(() => null);
  button.disabled = false;

  if (res && res.status === 401) {
    signOut();
    return renderSuggestionForm();
  }
  if (!res || !res.ok) {
    status.textContent = 'No se pudo enviar. Prueba de nuevo.';
    return;
  }
  input.value = '';
  status.textContent = '¡Gracias! Tu sugerencia quedó guardada.';
  loadSuggestions();
}

async function loadSuggestions() {
  const res = await fetch(`${API_URL}/suggestions`).catch(() => null);
  if (!res || !res.ok) return;
  const { suggestions } = await res.json();
  document.getElementById('suggestion-list').innerHTML = suggestions.map(suggestionHtml).join('')
    || '<p class="section-text">Todavía no hay sugerencias. ¡Deja la primera!</p>';
}

function suggestionHtml(suggestion) {
  const date = new Date(suggestion.created).toLocaleDateString('es', { day: 'numeric', month: 'long' });
  const avatar = suggestion.avatar ? `<img src="${escapeHtml(suggestion.avatar)}" alt="">` : '';
  return `
    <div class="suggestion">
      ${avatar}
      <div>
        <p class="suggestion-author"><strong>${escapeHtml(suggestion.name)}</strong> <small>${escapeHtml(date)}</small></p>
        <p class="suggestion-text">${escapeHtml(suggestion.text)}</p>
      </div>
    </div>`;
}
