// Marcos del retrato (img/marcos/): el que eligió con !marco o, si no eligió, el último que desbloqueó (el más difícil).
// La API los manda en viewer.frames. Se ven en la ficha, el ranking y el avatar de sesión (en el chat no: serían demasiadas imágenes)
const AUTO_FRAME = 'automatico';
// Agujero de cada PNG (medido): centro x, centro y y diámetro en fracción del ancho; y alto / ancho de la imagen
const FRAME_HOLES = {
  aventurero: [0.497, 0.494, 0.792, 174 / 173],
  milicia: [0.497, 0.436, 0.593, 202 / 177],
  veterano: [0.489, 0.475, 0.537, 202 / 188],
  deadmines: [0.489, 0.500, 0.656, 216 / 186],
  escarlata: [0.486, 0.507, 0.536, 219 / 179],
  'roca-negra': [0.508, 0.485, 0.550, 266 / 189],
  'nucleo-de-magma': [0.497, 0.523, 0.519, 264 / 189],
  onyxia: [0.487, 0.551, 0.556, 265 / 189],
  alanegra: [0.479, 0.586, 0.500, 266 / 188],
  cenarion: [0.503, 0.537, 0.519, 268 / 187]
};
// El agujero queda un poco más chico que el retrato: el marco tapa su borde
const FRAME_OVERLAP = 0.9;

const shownFrame = viewer => {
  const frames = viewer.frames || [];
  return frames.find(f => f.id === viewer.frame) || frames[frames.length - 1] || null;
};

// Retrato redondo, disco oscuro detrás (así no se notan los bordes del recorte) y el marco encima, con su agujero sobre la cara.
// Sin marcos (una ficha que todavía no pasó por la API nueva): el borde de color por nivel de antes
function framedPortrait(viewer, src, className, frame = shownFrame(viewer)) {
  if (!frame || !FRAME_HOLES[frame.id]) return `<img class="${className}" ${frameAttributes(viewer)} src="${src}" alt="">`;
  const [x, y, hole, ratio] = FRAME_HOLES[frame.id];
  const width = 100 / hole * FRAME_OVERLAP;
  const style = `--frame-w:${width}%;--frame-left:${50 - x * width}%;--frame-top:${50 - y * width * ratio}%`;
  return `<span class="framed ${className}" style="${style}" title="Marco: ${escapeHtml(frame.name)}">
    <span class="frame-back"></span><img class="framed-avatar" src="${src}" alt=""><img class="frame-img" src="img/marcos/${frame.id}.png" alt="">
  </span>`;
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
