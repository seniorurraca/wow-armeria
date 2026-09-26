// Fórmula del addon GearScore para objetos de nivel ≤ 120 (todos los de Classic):
// ((nivel - A) / B) × peso del casillero × 1.8618 × escala de calidad
const GEARSCORE_SCALE = 1.8618;

const GEARSCORE_QUALITY = {
  uncommon: { a: 8, b: 2 },
  rare: { a: 0.75, b: 1.8 },
  epic: { a: 26, b: 1.2 }
};

// Calidades que el addon calcula como otra, con una escala aparte
const GEARSCORE_QUALITY_AS = {
  poor: { as: 'uncommon', scale: 0.005 },
  common: { as: 'uncommon', scale: 0.005 },
  legendary: { as: 'epic', scale: 1.3 }
};

// Tipo de casillero de Wowhead → peso
const GEARSCORE_SLOT_WEIGHT = {
  'Head': 1, 'Chest': 1, 'Legs': 1,
  'Shoulder': 0.75, 'Hands': 0.75, 'Waist': 0.75, 'Feet': 0.75,
  'Neck': 0.5625, 'Back': 0.5625, 'Wrist': 0.5625, 'Finger': 0.5625, 'Trinket': 0.5625,
  'One-Hand': 1, 'Main Hand': 1, 'Off Hand': 1, 'Held In Off-hand': 1,
  'Two-Hand': 2,
  'Ranged': 0.3164, 'Thrown': 0.3164, 'Relic': 0.3164
};

function itemGearScore(item) {
  const weight = GEARSCORE_SLOT_WEIGHT[item.slot] || 0;
  const mapped = GEARSCORE_QUALITY_AS[item.rarity] || { as: item.rarity, scale: 1 };
  const quality = GEARSCORE_QUALITY[mapped.as];
  if (!weight || !quality || !item.itemLevel) return 0;
  return Math.max(0, Math.floor((item.itemLevel - quality.a) / quality.b * weight * GEARSCORE_SCALE * mapped.scale));
}

function gearScore(viewer) {
  const byId = Object.fromEntries(viewer.items.map(item => [item.id, item]));
  return Object.values(viewer.equipped)
    .map(id => byId[id])
    .filter(Boolean)
    .reduce((sum, item) => sum + itemGearScore(item), 0);
}
