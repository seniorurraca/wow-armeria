// Ventana encima de la página (equipar, reforjar, vender...) y cómo se confirma la acción:
// con la sesión de Twitch iniciada en su propia armería, un botón que lo hace directo por la API;
// si no, el comando para pegar en el chat del stream
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

// En la armería de otro se muestra el comando: la API siempre actúa sobre quien inició sesión
function canActHere() {
  return !!signedInUser && (!viewerLogin || viewerLogin === signedInUser.login);
}

// purpose: "equipártelo", "comprarlo"...; label: el texto del botón con sesión ("Equipar")
function commandBlock(command, purpose, label) {
  const action = canActHere()
    ? `<button class="wow-button action-button" type="button">${escapeHtml(label)}</button>
       <p class="ah-warning action-problem" hidden></p>`
    : `<p>Pega esto en el chat del stream para ${purpose}:</p>
       ${commandBox(command)}
       ${signedInUser ? '' : `<p class="hint">O <a href="${escapeHtml(loginUrl())}">entra con Twitch</a> y hazlo con un clic.</p>`}`;
  return `<div class="command-action" data-command="${escapeHtml(command)}">${action}</div>`;
}

// La subasta cambia el comando según el precio
function setCommand(container, command) {
  const block = container.querySelector('.command-action');
  block.dataset.command = command;
  const text = block.querySelector('.command-text');
  if (text) text.textContent = command;
}

// onDone: al terminar bien con el botón (cerrar la ventana, recargar...). La ficha se actualiza sola por WebSocket
function setupCommand(container, onDone = () => {}) {
  const block = container.querySelector('.command-action');
  const button = block.querySelector('.action-button');
  if (!button) return setupCopyButton(block);

  const problem = block.querySelector('.action-problem');
  button.addEventListener('click', async () => {
    button.disabled = true;
    problem.hidden = true;
    const result = await runCommand(block.dataset.command);
    button.disabled = false;
    if (result.ok) return onDone();
    problem.textContent = result.problems.map(capitalize).join(' ');
    problem.hidden = false;
  });
}

// Si el navegador no deja copiar, selecciona el comando para copiarlo a mano
function setupCopyButton(block) {
  const button = block.querySelector('.copy-button');
  const text = block.querySelector('.command-text');
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(text.textContent)
      .then(() => {
        button.textContent = '✔ ¡Copiado!';
        setTimeout(() => { button.textContent = '📋 Copiar'; }, COPIED_MS);
      })
      .catch(() => window.getSelection().selectAllChildren(text));
  });
}

// El objeto brillando con los rayos de su calidad (equipar, desequipar, vender, comprar)
function itemShowcase(item) {
  return `
    <div class="equip-showcase">
      <div class="rays"></div>
      <span class="slot equip-icon"><img src="${escapeHtml(item.icon)}" alt=""></span>
    </div>
    <a class="item-name equip-name" href="${itemUrl(item.id)}" target="_blank" rel="noopener">[${escapeHtml(item.name)}]</a>`;
}

// Ventana con el objeto y una sola acción (equipar, desequipar)
function openItemWindow(item, command, purpose, label) {
  const overlay = showOverlay(`
    <div class="overlay-window equip-window" data-rarity="${item.rarity}">
      ${itemShowcase(item)}
      ${commandBlock(command, purpose, label)}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);
  setupCommand(overlay, () => overlay.remove());
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}

const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
