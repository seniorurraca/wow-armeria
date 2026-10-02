// Botón "Ver modelo 3D" de la pestaña Personaje: abre el probador de Wowhead Classic con lo equipado.
// El personaje va en el hash del link, en el formato de Wowhead (versión 15 de su DressingRoom.js)
const DRESSING_ROOM_URL = 'https://www.wowhead.com/classic/dressing-room#';
const HASH_VERSION = 15;
const HASH_ALPHABET = '0zMcmVokRsaqbdrfwihuGINALpTjnyxtgevElBCDFHJKOPQSUWXYZ123456789';
const HASH_BASE = 58;
const FIELD_DELIMITER = '8';
const EMPTY_RUN_MARK = '7';
const CUSTOMIZATION_FIELDS = 100;
const MALE = 0;

// Raza y clase de Wowhead, las mismas razas del pixel art de los duelos
const MODEL_BY_CLASS = {
  warrior: { race: 2, class: 1 },  // orco
  paladin: { race: 1, class: 2 },  // humano
  hunter:  { race: 4, class: 3 },  // elfo de la noche
  rogue:   { race: 1, class: 4 },  // humano
  priest:  { race: 3, class: 5 },  // enano
  shaman:  { race: 8, class: 7 },  // trol
  mage:    { race: 7, class: 8 },  // gnomo
  warlock: { race: 2, class: 9 },  // orco
  druid:   { race: 6, class: 11 }  // tauren
};

// Casilleros del probador, en orden (los que no se ven en el modelo no van)
const MODEL_SLOTS = ['head', 'shoulder', 'back', 'chest', 'shirt', 'tabard', 'wrist', 'hands', 'waist', 'legs', 'feet', 'mainHand', 'offHand', 'ranged'];
const SLOTS_WITH_ENCHANT = ['mainHand', 'offHand'];

const hashDigit = n => HASH_ALPHABET[n];

// El tabardo no es un objeto equipado: es el cosmético elegido con !tabardo.
// Wowhead pone en la mano el arma a distancia (jabalina, arco) en vez de la principal: solo va si no hay principal
function slotItemId(viewer, slot) {
  if (slot === 'tabard') return viewer.tabard;
  if (slot === 'ranged' && viewer.equipped.mainHand) return null;
  return viewer.equipped[slot];
}

function hashNumber(n) {
  let digits = '';
  do {
    digits = hashDigit(n % HASH_BASE) + digits;
    n = Math.floor(n / HASH_BASE);
  } while (n > 0);
  return digits;
}

// Wowhead acorta las tiras de campos vacíos ("08" repetido) a una marca + cuántos son
function compressEmptyFields(hash) {
  return hash.replace(/(?:08){2,}/g, run => {
    let count = run.length / 2;
    let marks = '';
    for (; count >= HASH_BASE; count -= HASH_BASE) marks += EMPTY_RUN_MARK;
    return marks + EMPTY_RUN_MARK + hashDigit(count);
  });
}

function dressingRoomUrl(viewer) {
  const model = MODEL_BY_CLASS[viewer.class] || MODEL_BY_CLASS.warrior;
  const fields = [
    hashNumber(model.race),
    hashDigit(MALE) + hashDigit(model.class) + hashDigit(0) + hashNumber(MAX_LEVEL),
    '000',
    ...Array(CUSTOMIZATION_FIELDS).fill('0')
  ];
  MODEL_SLOTS.forEach(slot => {
    fields.push(hashNumber(Number(slotItemId(viewer, slot)) || 0), '0');
    if (SLOTS_WITH_ENCHANT.includes(slot)) fields.push('0');
  });
  fields.push('0', '0', '0');
  return DRESSING_ROOM_URL + hashDigit(HASH_VERSION) + compressEmptyFields(fields.join(FIELD_DELIMITER));
}

function model3dButton(viewer) {
  return `<a class="wow-button model-3d" href="${dressingRoomUrl(viewer)}" target="_blank" rel="noopener">Ver modelo 3D</a>`;
}

// Cada clic queda en el Registro de actividad, con quién lo hizo si inició sesión
function setupModel3d() {
  app.querySelector('.model-3d')?.addEventListener('click', () => {
    const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
    fetch(`${API_URL}/model3d?u=${encodeURIComponent(viewerLogin)}`, { method: 'POST', headers, keepalive: true }).catch(() => {});
  });
}
