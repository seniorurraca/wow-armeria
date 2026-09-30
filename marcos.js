// Marcos del retrato: aros de metal hechos en CSS (marcos.css), el que eligió con !marco o, si no eligió, el último que desbloqueó (el más difícil).
// La API los manda en viewer.frames. Se ven en la ficha, el ranking y el avatar de sesión (en el chat no: serían demasiadas imágenes)
const AUTO_FRAME = 'automatico';

const shownFrame = viewer => {
  const frames = viewer.frames || [];
  return frames.find(f => f.id === viewer.frame) || frames[frames.length - 1] || null;
};

// Sin marcos (una ficha que todavía no pasó por la API nueva): el borde de color por nivel de antes
function framedPortrait(viewer, src, className, frame = shownFrame(viewer)) {
  if (!frame) return `<img class="${className}" ${frameAttributes(viewer)} src="${src}" alt="">`;
  return `<img class="${className} metal-ring" data-metal="${frame.id}"${viewer.stars ? ' data-starred' : ''} src="${src}" alt="" title="Marco: ${escapeHtml(frame.name)}">`;
}

// Arriba a la derecha, con la sesión iniciada: tu avatar con tu marco (una consulta de tu ficha)
async function showSessionFrame(user) {
  const res = await fetch(`${API_URL}/viewer?u=${encodeURIComponent(user.login)}`).catch(() => null);
  const viewer = res && res.ok ? (await res.json()).viewers?.[user.login] : null;
  const avatar = document.querySelector('#session-pill img');
  if (viewer && avatar) avatar.outerHTML = framedPortrait(viewer, escapeHtml(user.avatar || portrait(viewer)), 'session-avatar');
}

function framePicker(viewer) {
  const frames = viewer.frames || [];
  if (frames.length < 2) return '';
  const options = [['', `Automático (${frames[frames.length - 1].name})`], ...frames.map(f => [f.id, f.name])]
    .map(([value, label]) => `<option value="${value}"${value === (viewer.frame || '') ? ' selected' : ''}>${escapeHtml(label)}</option>`);
  return `<label class="title-picker">Marco: <select class="frame-select">${options.join('')}</select></label>`;
}

// Elegir no cambia nada: abre la ventana con el comando y el desplegable vuelve al marco actual
function setupFramePicker(viewer) {
  const select = app.querySelector('.frame-select');
  if (!select) return;
  select.addEventListener('change', () => {
    openFrameWindow(viewer, (viewer.frames || []).find(f => f.id === select.value));
    select.value = viewer.frame || '';
  });
}

function openFrameWindow(viewer, frame) {
  const command = `!marco ${frame ? frame.name : AUTO_FRAME}`;
  const overlay = showOverlay(`
    <div class="overlay-window title-window">
      <div class="frame-preview">${framedPortrait(viewer, portrait(viewer), 'frame-preview-portrait', frame || shownFrame({ frames: viewer.frames }))}</div>
      <p class="title-preview">${escapeHtml(frame ? frame.name : 'Automático: el mejor que tengas')}</p>
      ${commandBlock(command, 'usar este marco', 'Usar marco')}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);
  setupCommand(overlay, () => overlay.remove());
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}
