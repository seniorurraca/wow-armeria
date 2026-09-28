// Rol por defecto en las mazmorras: se elige acá y se arma "!setrole" (con sesión, un clic). Sin elegir, el grupo lo infiere de sus hechizos.
// Solo los roles de su clase (misma regla que la API: api/src/dungeon/roles.js)
const ROLES = {
  dps: { label: 'DPS', command: 'dps' },
  tank: { label: 'Tanque', command: 'tanque', classes: ['warrior', 'druid', 'paladin'] },
  healer: { label: 'Sanador', command: 'sanador', classes: ['priest', 'druid', 'shaman', 'paladin'] }
};

const canPlay = (viewer, role) => !ROLES[role].classes || !viewer.class || ROLES[role].classes.includes(viewer.class);

function rolePicker(viewer) {
  const automatic = viewer.role ? '' : '<option value="" selected disabled>Automático (según sus hechizos)</option>';
  const options = Object.entries(ROLES)
    .filter(([role]) => canPlay(viewer, role))
    .map(([role, { label }]) => `<option value="${role}"${role === viewer.role ? ' selected' : ''}>${label}</option>`);
  return `<label class="title-picker">Rol en mazmorras: <select class="title-select role-select">${automatic}${options.join('')}</select></label>`;
}

// Elegir no cambia nada: abre la ventana con el comando y el desplegable vuelve al rol actual
function setupRolePicker(viewer) {
  const select = app.querySelector('.role-select');
  select.addEventListener('change', () => {
    openRoleWindow(select.value);
    select.value = viewer.role || '';
  });
}

function openRoleWindow(role) {
  const { label, command } = ROLES[role];
  const overlay = showOverlay(`
    <div class="overlay-window title-window">
      <p class="title-preview">${label}</p>
      ${commandBlock(`!setrole ${command}`, `ir de ${label.toLowerCase()} en las mazmorras`, 'Elegir rol')}
      <button class="wow-button close-button" type="button">Cerrar</button>
    </div>`);

  setupCommand(overlay, () => overlay.remove());
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}
