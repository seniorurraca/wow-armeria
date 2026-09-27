// Ventana encima de la página (equipar, reforjar) y el recuadro con el comando para pegar en el chat del stream
const COPIED_MS = 2500;

function showOverlay(markup) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = markup;
  document.body.appendChild(overlay);
  return overlay;
}

function commandBox(command) {
  return `
    <div class="command-box">
      <code class="command-text">${escapeHtml(command)}</code>
      <button class="wow-button copy-button" type="button">📋 Copiar</button>
    </div>`;
}

// Si el navegador no deja copiar, selecciona el comando para copiarlo a mano
function setupCopyButton(overlay, command) {
  const button = overlay.querySelector('.copy-button');
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(command)
      .then(() => {
        button.textContent = '✔ ¡Copiado!';
        setTimeout(() => { button.textContent = '📋 Copiar'; }, COPIED_MS);
      })
      .catch(() => window.getSelection().selectAllChildren(overlay.querySelector('.command-text')));
  });
}
