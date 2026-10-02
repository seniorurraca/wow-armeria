// Caja de sugerencias: todos las leen, solo quien entró con Twitch escribe y vota (▲ / ▼ como en Reddit). Solo en la landing
if (!viewerLogin && !auctionMode) {
  loadSuggestions();
  setupVotes();
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

// POST con la sesión; si venció, la cierra y devuelve null
async function postWithSession(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => null);
  if (res && res.status === 401) {
    signOut();
    renderSuggestionForm();
    return null;
  }
  return res;
}

async function sendSuggestion(form) {
  const input = form.querySelector('.suggestion-input');
  const button = form.querySelector('button');
  const status = form.querySelector('.suggestion-status');
  const text = input.value.trim();
  if (!text) return;

  button.disabled = true;
  const res = await postWithSession('/suggestions', { text });
  button.disabled = false;

  if (!signedInUser) return;
  if (!res || !res.ok) {
    status.textContent = 'No se pudo enviar. Prueba de nuevo.';
    return;
  }
  input.value = '';
  status.textContent = '¡Gracias! Tu sugerencia quedó guardada.';
  loadSuggestions();
}

async function loadSuggestions() {
  const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
  const res = await fetch(`${API_URL}/suggestions`, { headers }).catch(() => null);
  if (!res || !res.ok) return;
  const { suggestions } = await res.json();
  document.getElementById('suggestion-list').innerHTML = suggestions.map(suggestionHtml).join('')
    || '<p class="section-text">Todavía no hay sugerencias. ¡Deja la primera!</p>';
}

function suggestionHtml(suggestion) {
  const date = new Date(suggestion.created).toLocaleDateString('es', { day: 'numeric', month: 'long' });
  const avatar = suggestion.avatar ? `<img src="${escapeHtml(suggestion.avatar)}" alt="">` : '';
  return `
    <div class="suggestion" data-id="${suggestion.id}">
      <div class="suggestion-votes" data-vote="${suggestion.myVote}">
        <button class="vote-up" type="button" data-value="1" aria-label="Voto a favor">▲</button>
        <span class="vote-score">${suggestion.score}</span>
        <button class="vote-down" type="button" data-value="-1" aria-label="Voto en contra">▼</button>
      </div>
      ${avatar}
      <div class="suggestion-body">
        <p class="suggestion-author"><strong>${escapeHtml(suggestion.name)}</strong> <small>${escapeHtml(date)}</small></p>
        <p class="suggestion-text">${escapeHtml(suggestion.text)}</p>
        <p class="suggestion-vote-login" hidden><a href="${escapeHtml(loginUrl())}">Entra con Twitch</a> para votar.</p>
      </div>
    </div>`;
}

function setupVotes() {
  document.getElementById('suggestion-list').addEventListener('click', event => {
    const button = event.target.closest('.suggestion-votes button');
    if (button) vote(button.closest('.suggestion'), Number(button.dataset.value));
  });
}

async function vote(card, value) {
  const askLogin = () => card.querySelector('.suggestion-vote-login').hidden = false;
  if (!signedInUser) return askLogin();

  const votes = card.querySelector('.suggestion-votes');
  votes.querySelectorAll('button').forEach(b => b.disabled = true);
  const res = await postWithSession('/suggestions/vote', { id: Number(card.dataset.id), value });
  votes.querySelectorAll('button').forEach(b => b.disabled = false);

  if (!signedInUser) return askLogin();
  if (!res || !res.ok) return;
  const { score, myVote } = await res.json();
  votes.dataset.vote = myVote;
  votes.querySelector('.vote-score').textContent = score;
}
