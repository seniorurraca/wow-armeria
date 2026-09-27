// Oro en cobre, como el juego: 1 oro = 100 plata = 10.000 cobre (mismas reglas que Money/ParseMoney en wow-armeria.cs)
const COPPER_PER_SILVER = 100;
const COPPER_PER_GOLD = 10000;
const COINS = [['gold', COPPER_PER_GOLD], ['silver', COPPER_PER_SILVER], ['copper', 1]];

function coinAmounts(copper) {
  return COINS.map(([coin, value], i) => [coin, Math.floor(copper % (i ? COINS[i - 1][1] : Infinity) / value)]);
}

// 125050 → 12 🟡 50 ⚪ (monedas dibujadas con CSS, ver subasta.css)
function moneyHtml(copper) {
  const shown = coinAmounts(copper).filter(([, amount]) => amount > 0);
  const coins = shown.length ? shown : [['copper', 0]];
  return `<span class="money">${coins.map(([coin, amount]) => `<span class="coin ${coin}">${amount.toLocaleString('es')}</span>`).join('')}</span>`;
}

// Para los comandos del chat: 120000 → "12", 125050 → "12g50s50c"
function moneyCommand(copper) {
  const amounts = coinAmounts(copper);
  if (copper % COPPER_PER_GOLD === 0) return String(amounts[0][1]);
  return amounts.filter(([, amount]) => amount > 0).map(([coin, amount]) => amount + coin[0]).join('');
}
