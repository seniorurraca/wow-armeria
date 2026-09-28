// Chat de la armería: todos leen, solo quien entró con Twitch escribe. Se guarda en la API
const CHAT_RECONNECT_MS = 3000;
const CHAT_MAX_MESSAGES = 200;
const MEDIA_URL = /^https?:\/\/\S+\.(gif|png|jpe?g|webp)(\?\S*)?$/i;
const LINK_URL = /^https?:\/\/\S+$/i;
let chatMessages = [];
let chatStarted = false;

function renderChatArea() {
  const compose = signedInUser
    ? `<input type="text" class="chat-input" maxlength="500" placeholder="Escribe o pega el link de un gif...">
       <button class="chat-send" type="button">Enviar</button>`
    : `<span class="chat-login-prompt"><a href="${escapeHtml(loginUrl())}">Entra con Twitch</a> para escribir en el chat</span>`;
  return `
    <div class="chat-header">Chat</div>
    <div class="chat-messages"></div>
    <div class="chat-input-area${signedInUser ? '' : ' not-logged'}">${compose}</div>`;
}

// La ficha se vuelve a dibujar con cada cambio: la conexión se abre una vez y el área se rearma
function initChat() {
  setupChatInput();
  renderChatMessages();
  if (chatStarted) return;
  chatStarted = true;
  loadChatHistory();
  connectChatSocket();
}

async function loadChatHistory() {
  const res = await fetch(`${API_URL}/chat`).catch(() => null);
  if (!res || !res.ok) return;
  chatMessages = (await res.json()).messages || [];
  renderChatMessages();
}

function connectChatSocket() {
  const socket = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws/chat`);
  socket.addEventListener('message', event => {
    const { message } = JSON.parse(event.data);
    if (!message) return;
    chatMessages = [...chatMessages, message].slice(-CHAT_MAX_MESSAGES);
    renderChatMessages();
  });
  socket.addEventListener('close', () => setTimeout(() => {
    connectChatSocket();
    loadChatHistory();
  }, CHAT_RECONNECT_MS));
}

function renderChatMessages() {
  const list = document.querySelector('.chat-messages');
  if (!list) return;
  list.innerHTML = chatMessages.map(chatMessageHtml).join('') || '<p class="chat-login-prompt">Todavía no hay mensajes.</p>';
  list.scrollTop = list.scrollHeight;
}

function chatMessageHtml(message) {
  return `
    <div class="chat-message">
      <span class="chat-message-avatar">${message.avatar ? `<img src="${escapeHtml(message.avatar)}" alt="">` : ''}</span>
      <div class="chat-message-content">
        <div class="chat-message-author">
          <span class="chat-message-name">${escapeHtml(message.name)}</span>
          <span class="chat-message-time">${chatTime(message.created)}</span>
        </div>
        <div class="chat-message-text">${chatTextHtml(message.text)}</div>
      </div>
    </div>`;
}

// Un link a imagen/gif se muestra como imagen; otros links, clicables; el resto, texto
function chatTextHtml(text) {
  return text.split(/(\s+)/).map(word => {
    if (MEDIA_URL.test(word)) return `<img src="${escapeHtml(word)}" alt="" loading="lazy">`;
    if (LINK_URL.test(word)) return `<a href="${escapeHtml(word)}" target="_blank" rel="noopener nofollow">${escapeHtml(word)}</a>`;
    return escapeHtml(word);
  }).join('');
}

function chatTime(ms) {
  return new Date(ms).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function setupChatInput() {
  const input = document.querySelector('.chat-input');
  const send = document.querySelector('.chat-send');
  if (!input || !send) return;

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.disabled = send.disabled = true;
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).catch(() => null);
    input.disabled = send.disabled = false;
    if (res && res.status === 401) return signOut();
    if (res && res.ok) input.value = '';
    input.focus();
  };

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') sendMessage();
  });
}
