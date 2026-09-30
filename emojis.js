// Emojis del chat: la barra rápida para reaccionar y el selector completo (emoji-picker-element, en español,
// se descarga la primera vez que alguien lo abre)
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const PICKER_CDN = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1';
const PICKER_DATA = 'https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/es/cldr/data.json';
const POPUP_MARGIN = 8;

let pickerI18n = null;

function closeEmojiPopups() {
  document.querySelectorAll('.emoji-popup').forEach(popup => popup.remove());
}

document.addEventListener('click', event => {
  if (!event.target.closest('.emoji-popup, .emoji-trigger')) closeEmojiPopups();
});

// Encima del botón que la abrió, sin salirse de la pantalla
function showPopup(anchor, content) {
  closeEmojiPopups();
  const popup = document.createElement('div');
  popup.className = 'emoji-popup';
  popup.append(content);
  document.body.append(popup);
  const from = anchor.getBoundingClientRect();
  const size = popup.getBoundingClientRect();
  popup.style.left = `${Math.max(POPUP_MARGIN, Math.min(from.right - size.width, innerWidth - size.width - POPUP_MARGIN))}px`;
  popup.style.top = `${Math.max(POPUP_MARGIN, from.top - size.height - POPUP_MARGIN)}px`;
  return popup;
}

async function openEmojiPicker(anchor, onPick) {
  if (!pickerI18n) {
    await import(`${PICKER_CDN}/index.js`);
    pickerI18n = (await import(`${PICKER_CDN}/i18n/es.js`)).default;
  }
  const picker = document.createElement('emoji-picker');
  picker.className = 'dark';
  picker.locale = 'es';
  picker.dataSource = PICKER_DATA;
  picker.i18n = pickerI18n;
  picker.addEventListener('emoji-click', event => {
    closeEmojiPopups();
    onPick(event.detail.unicode);
  });
  showPopup(anchor, picker);
}

function openQuickReactions(anchor, onPick) {
  const bar = document.createElement('div');
  bar.className = 'quick-reactions';
  bar.innerHTML = QUICK_REACTIONS.map(emoji => `<button type="button" data-emoji="${emoji}">${emoji}</button>`).join('')
    + '<button type="button" class="more-emojis emoji-trigger" title="Más emojis">➕</button>';
  bar.querySelectorAll('[data-emoji]').forEach(button => button.addEventListener('click', () => {
    closeEmojiPopups();
    onPick(button.dataset.emoji);
  }));
  bar.querySelector('.more-emojis').addEventListener('click', () => openEmojiPicker(anchor, onPick));
  showPopup(anchor, bar);
}
