// El GearScore lo calcula Streamer.bot (wow-armeria.cs) y viene en la API; acá solo se pinta.
// Colores estilo TacoTip, con degradé entre tramos. Escala de Classic: full T3 ronda los 1100
const GEARSCORE_COLORS = [
  [0, [157, 157, 157]],
  [200, [255, 255, 255]],
  [400, [30, 255, 0]],
  [600, [0, 112, 221]],
  [800, [163, 53, 238]],
  [1000, [255, 128, 0]]
];

function gearScoreColor(score) {
  const next = GEARSCORE_COLORS.findIndex(([from]) => score < from);
  if (next === -1) return `rgb(${GEARSCORE_COLORS[GEARSCORE_COLORS.length - 1][1]})`;
  const [fromScore, fromColor] = GEARSCORE_COLORS[next - 1];
  const [toScore, toColor] = GEARSCORE_COLORS[next];
  const t = (score - fromScore) / (toScore - fromScore);
  return `rgb(${fromColor.map((c, i) => Math.round(c + (toColor[i] - c) * t))})`;
}

function gearScore(viewer) {
  return viewer.gearScore || 0;
}
