// Silueta de personaje con armadura y capa (pestaña Personaje). Cada parte se tiñe con la calidad de lo que lleva
// en ese casillero (data-rarity, como los casilleros); sin nada puesto queda negra. El tabardo elegido, con su color, sobre el pecho
function silhouette(viewer, itemsById) {
  const tabard = chosenTabard(viewer);
  const rarity = slot => {
    const item = itemsById[viewer.equipped[slot]];
    return item ? ` data-rarity="${item.rarity}"` : '';
  };
  // Hombrera, brazo y pierna de un lado; el otro es el mismo espejado
  const side = `
    <path${rarity('shoulder')} d="M60 82 C40 80 24 92 22 110 C22 122 30 128 38 126 C46 118 58 114 70 112 L74 96 C72 88 68 84 60 82 Z"/>
    <path${rarity('shoulder')} d="M34 94 L18 70 L44 88 Z"/>
    <path${rarity('chest')} d="M36 120 L58 116 L55 188 L32 188 Z"/>
    <path${rarity('wrist')} d="M28 184 L58 184 L55 242 L31 242 Z"/>
    <circle${rarity('hands')} cx="43" cy="253" r="13"/>
    <path${rarity('legs')} d="M72 262 L98 262 L97 318 L74 318 Z"/>
    <ellipse${rarity('legs')} cx="85" cy="318" rx="15" ry="11"/>
    <path${rarity('feet')} d="M72 322 L98 322 L98 380 L100 402 L64 402 C56 402 56 393 65 389 L72 380 Z"/>`;
  return `
  <svg class="silhouette" viewBox="0 0 200 420" aria-hidden="true">
    <defs>
      <linearGradient id="silhouette-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1e1e1e"/>
        <stop offset="1" stop-color="#070707"/>
      </linearGradient>
    </defs>
    <path fill="#050505"${rarity('back')} d="M52 96 L148 96 L166 300 L176 398 L150 388 L128 402 L100 392 L72 402 L50 388 L24 398 L34 300 Z"/>
    <g fill="url(#silhouette-fill)">
      <path${rarity('head')} d="M100 12 C114 12 124 22 125 38 L126 56 C126 66 118 74 112 78 L88 78 C82 74 74 66 74 56 L75 38 C76 22 86 12 100 12 Z"/>
      <rect${rarity('neck')} x="88" y="70" width="24" height="18"/>
      <path${rarity('chest')} d="M62 104 C80 98 120 98 138 104 L134 150 C132 168 128 180 124 190 L76 190 C72 180 68 168 66 150 Z"/>
      <path${rarity('legs')} d="M72 204 L128 204 L136 272 L116 280 L100 272 L84 280 L64 272 Z"/>
      ${tabard ? `<path class="tabard" fill="${tabard.color}" d="M82 104 L118 104 L120 272 L100 286 L80 272 Z"/>` : ''}
      <path${rarity('waist')} d="M72 186 L128 186 L130 206 L70 206 Z"/>
      <g>${side}</g>
      <g transform="translate(200 0) scale(-1 1)">${side}</g>
    </g>
  </svg>`;
}
