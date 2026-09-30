// Chat de la armería: todos leen, solo quien entró con Twitch escribe y reacciona (emojis.js). Se guarda en la API
const CHAT_RECONNECT_MS = 3000;
const CHAT_MAX_MESSAGES = 200;
const MEDIA_URL = /^https?:\/\/\S+\.(gif|png|jpe?g|webp)(\?\S*)?$/i;
const LINK_URL = /^https?:\/\/\S+$/i;
let chatMessages = [];
let chatStarted = false;

function renderChatArea() {
  const compose = signedInUser
    ? `<input type="text" class="chat-input" maxlength="500" placeholder="Escribe o pega el link de un gif...">
       <button class="chat-emoji emoji-trigger" type="button" title="Emojis">😊</button>
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
  setupReactions();
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
    const { message, reactions } = JSON.parse(event.data);
    if (reactions) return updateReactions(reactions);
    if (!message) return;
    chatMessages = [...chatMessages, message].slice(-CHAT_MAX_MESSAGES);
    renderChatMessages();
  });
  socket.addEventListener('close', () => setTimeout(() => {
    connectChatSocket();
    loadChatHistory();
  }, CHAT_RECONNECT_MS));
}

// Un mensaje nuevo baja hasta el final; una reacción deja el chat donde estaba
function renderChatMessages(keepScroll = false) {
  const list = document.querySelector('.chat-messages');
  if (!list) return;
  const scroll = list.scrollTop;
  list.innerHTML = chatMessages.map(chatMessageHtml).join('') || '<p class="chat-login-prompt">Todavía no hay mensajes.</p>';
  list.scrollTop = keepScroll ? scroll : list.scrollHeight;
}

function updateReactions({ id, list }) {
  chatMessages = chatMessages.map(message => (message.id === id ? { ...message, reactions: list } : message));
  renderChatMessages(true);
}

function chatMessageHtml(message) {
  return `
    <div class="chat-message" data-id="${message.id}">
      <span class="chat-message-avatar">${message.avatar ? `<img src="${escapeHtml(message.avatar)}" alt="">` : ''}</span>
      <div class="chat-message-content">
        <div class="chat-message-author">
          <span class="chat-message-name">${escapeHtml(message.name)}</span>
          ${roleIcon(message.role)}
          <span class="chat-message-time">${chatTime(message.created)}</span>
        </div>
        <div class="chat-message-text">${chatTextHtml(message.text)}</div>
        ${reactionsHtml(message.reactions || [])}
      </div>
      ${signedInUser ? '<button class="chat-react emoji-trigger" type="button" title="Reaccionar">☺</button>' : ''}
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

// 😂 3: al pasar el mouse, quiénes; la propia resaltada (tocarla la saca)
function reactionsHtml(reactions) {
  if (!reactions.length) return '';
  const mine = reaction => signedInUser && reaction.logins.includes(signedInUser.login);
  return `<div class="chat-reactions">${reactions.map(reaction => `
    <button class="chat-reaction${mine(reaction) ? ' mine' : ''}" type="button" data-emoji="${escapeHtml(reaction.emoji)}" title="${escapeHtml(reaction.names.join(', '))}">
      ${escapeHtml(reaction.emoji)} <span>${reaction.logins.length}</span>
    </button>`).join('')}</div>`;
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
    const res = await postToChat('chat', { text });
    input.disabled = send.disabled = false;
    if (res && res.ok) input.value = '';
    input.focus();
  };

  // El emoji va donde estaba el cursor
  document.querySelector('.chat-emoji').addEventListener('click', event => openEmojiPicker(event.currentTarget, emoji => {
    const at = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, at) + emoji + input.value.slice(input.selectionEnd ?? at);
    input.focus();
    input.selectionStart = input.selectionEnd = at + emoji.length;
  }));
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') sendMessage();
  });
}

// Tocar una reacción la pone o la saca; el botón de cada mensaje abre la barra rápida (y el ➕, todos los emojis)
function setupReactions() {
  const list = document.querySelector('.chat-messages');
  if (!list || !signedInUser) return;
  const react = (button, emoji) => postToChat('chat/react', { id: Number(button.closest('.chat-message').dataset.id), emoji });
  list.addEventListener('click', event => {
    const chip = event.target.closest('.chat-reaction');
    if (chip) return react(chip, chip.dataset.emoji);
    const open = event.target.closest('.chat-react');
    if (open) openQuickReactions(open, emoji => react(open, emoji));
  });
}

async function postToChat(path, body) {
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => null);
  if (res && res.status === 401) signOut();
  return res;
}
