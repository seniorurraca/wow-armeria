// Menú del retrato de arriba: cada pestaña de tu propia ficha (?u=tu_nick&tab=...) y el botón Salir con confirmación
const profileMenu = document.getElementById('session-menu');
const ownTabUrl = (user, tab) => `./?u=${encodeURIComponent(user.login)}&tab=${tab}`;
const onOwnSheet = () => !!signedInUser && viewerLogin === signedInUser.login && !!app.querySelector('.tabs');

// ?tab=inventory abre la ficha en esa pestaña; ?cuartel, en el Cuartel
function requestedTab() {
  const tab = quartersRoute ? 'quarters' : new URLSearchParams(location.search).get('tab');
  if (!Object.hasOwn(TABS, tab)) return 'character';
  return tab !== 'quarters' || quartersOpen() ? tab : 'character';
}

function renderProfileMenu(user) {
  closeProfileMenu();
  profileMenu.innerHTML = user ? Object.entries(TABS)
    .filter(([key]) => key !== 'quarters' || quartersOpen())
    .map(([key, label]) => `<a href="${ownTabUrl(user, key)}" data-tab="${key}">${label}</a>`)
    .join('') : '';
}

function closeProfileMenu() {
  profileMenu.hidden = true;
}

function confirmSignOut() {
  const overlay = showOverlay(`
    <div class="overlay-window">
      <p class="title-preview">¿Seguro que quieres salir?</p>
      <div class="confirm-buttons">
        <button class="wow-button confirm-sign-out" type="button">Salir</button>
        <button class="wow-button close-button" type="button">Cancelar</button>
      </div>
    </div>`);
  overlay.querySelector('.confirm-sign-out').addEventListener('click', () => {
    overlay.remove();
    signOut();
  });
  overlay.querySelector('.close-button').addEventListener('click', () => overlay.remove());
}

document.getElementById('session-pill').addEventListener('click', event => {
  if (!signedInUser) return;
  event.preventDefault();
  profileMenu.hidden = !profileMenu.hidden;
});

// En tu propia ficha cambia de pestaña sin recargar
profileMenu.addEventListener('click', event => {
  const link = event.target.closest('a[data-tab]');
  if (!link || !onOwnSheet()) return;
  event.preventDefault();
  history.replaceState(null, '', link.href);
  showTab(link.dataset.tab);
  closeProfileMenu();
});

document.addEventListener('click', event => {
  if (!event.target.closest('.session')) closeProfileMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeProfileMenu();
});
document.getElementById('session-logout').addEventListener('click', confirmSignOut);
