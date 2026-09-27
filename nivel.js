// Nivel, barra de experiencia, marco del retrato y títulos. Los calcula Streamer.bot (wow-armeria.cs) y vienen
// en la API; acá solo se pintan y se arma el comando "!titulo" para pegar en el chat
const MAX_LEVEL = 60;
const NO_TITLE = 'ninguno';

// Marco del retrato con el color de calidad según el nivel; con estrellas, además brilla
const LEVEL_FRAMES = [[60, 'legendary'], [45, 'epic'], [30, 'rare'], [20, 'uncommon'], [10, 'common'], [0, 'poor']];

const levelOf = viewer => viewer.level || 1;
const levelFrame = viewer => LEVEL_FRAMES.find(([from]) => levelOf(viewer) >= from)[1];
const levelText = viewer => `Nivel ${levelOf(viewer)}${viewer.stars ? ` ★${viewer.stars}` : ''}`;
const frameAttributes = viewer => `data-rarity="${levelFrame(viewer)}"${viewer.stars ? ' data-starred' : ''}`;

// "Gran mariscal %s" → "Gran mariscal" (mismo texto que espera !titulo en wow-armeria.cs)
const titleLabel = title => title.replace('%s', '').trim();
const titledName = viewer => viewer.title ? viewer.title.replace('%s', viewer.name) : viewer.name;

function xpBar(viewer) {
  const current = viewer.levelXp || 0;
  const needed = viewer.levelXpNeeded || 0;
  const next = levelOf(viewer) === MAX_LEVEL ? `★${(viewer.stars || 0) + 1}` : `nivel ${levelOf(viewer) + 1}`;
  const percent = needed ? Math.min(100, current / needed * 100) : 0;
  return `
    <div class="xp-bar" title="Experiencia para ${next}">
      <span style="width:${percent}%"></span>
      <small>${current.toLocaleString('es')} / ${needed.toLocaleString('es')} XP</small>
    </div>`;
}

function titlePicker(viewer) {
  const titles = viewer.titles || [];
  if (!titles.length) return '<p class="hint title-hint">Sube de nivel en las mazmorras para ganar títulos.</p>';

  const options = [['', 'Sin título'], ...titles.map(title => [title, titleLabel(title)])]
    .map(([value, label]) => `<option value="${escapeHtml(value)}"${value === (viewer.title || '') ? ' selected' : ''}>${escapeHtml(label)}</option>`);
  return `<label class="title-picker">Título: <select class="title-select">${options.join('')}</select></label>`;
}

// Elegir no cambia nada: abre la ventana con el comando y el desplegable vuelve al título actual
function setupTitlePicker(viewer) {
  const select = app.querySelector('.title-select');
  if (!select) return;
  select.addEventListener('change', () => {
    openTitleWindow(viewer, select.value);
    select.value = viewer.title || '';
  });
}

function openTitleWindow(viewer, title) {
  const command = `!titulo ${title ? titleLabel(title) : NO_TITLE}`;
  const overlay = showOverlay(`
    <div class="overlay-window title-window">
      <p class="title-preview">${escapeHtml(title ? title.replace('%s', viewer.name) : viewer.name)}</p>
      ${commandBlock(command, title ? 'usar este título' : 'quitarte el título', title ? 'Usar título' : 'Quitar título')}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);

  setupCommand(overlay, () => overlay.remove());
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}
