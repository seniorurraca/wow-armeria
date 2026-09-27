// Qué objetos puede usar cada clase: mismas reglas que SlotsFor en streamerbot/wow-armeria.cs.
// Los que su clase no puede equipar se tiñen de rojo en Inventario y Botín, como en el juego

const CLASSES_BY_ITEM_TYPE = {
  'Leather': ['warrior', 'paladin', 'hunter', 'rogue', 'shaman', 'druid'],
  'Mail': ['warrior', 'paladin', 'hunter', 'shaman'],
  'Plate': ['warrior', 'paladin'],
  'Shield': ['warrior', 'paladin', 'shaman'],
  'Dagger': ['warrior', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'],
  'Fist Weapon': ['warrior', 'hunter', 'rogue', 'shaman', 'druid'],
  'Axe': ['warrior', 'paladin', 'hunter', 'shaman'],
  'Axe 2H': ['warrior', 'paladin', 'hunter', 'shaman'],
  'Mace': ['warrior', 'paladin', 'rogue', 'priest', 'shaman', 'druid'],
  'Mace 2H': ['warrior', 'paladin', 'shaman', 'druid'],
  'Sword': ['warrior', 'paladin', 'hunter', 'rogue', 'mage', 'warlock'],
  'Sword 2H': ['warrior', 'paladin', 'hunter'],
  'Polearm 2H': ['warrior', 'paladin', 'hunter'],
  'Staff 2H': ['warrior', 'hunter', 'priest', 'shaman', 'mage', 'warlock', 'druid'],
  'Bow': ['warrior', 'hunter', 'rogue'],
  'Crossbow': ['warrior', 'hunter', 'rogue'],
  'Gun': ['warrior', 'hunter', 'rogue'],
  'Thrown': ['warrior', 'hunter', 'rogue'],
  'Wand': ['priest', 'mage', 'warlock'],
  'Libram': ['paladin'],
  'Idol': ['druid'],
  'Totem': ['shaman']
};
const DUAL_WIELD_CLASSES = ['warrior', 'hunter', 'rogue'];

function classCanUse(item, classKey) {
  if (!item.slot || !CLASSES[classKey]) return true;
  const typeKey = item.type + (item.slot === 'Two-Hand' ? ' 2H' : '');
  const classes = CLASSES_BY_ITEM_TYPE[typeKey];
  if (classes && !classes.includes(classKey)) return false;
  return !(item.slot === 'Off Hand' && item.type !== 'Shield' && !DUAL_WIELD_CLASSES.includes(classKey));
}

const unusableClass = (item, viewer) => classCanUse(item, viewer.class) ? '' : ' unusable';
