// Roadmap de la landing, estilo los de Blizzard. Plan interno y detalles en docs/roadmap.md
// kind: launch (pergamino, ya salió) · patch (azul) · event (fiesta) · forever (negro y dorado)
// Estaciones de Argentina (el canal es de acá): primavera del 21/09, verano del 21/12, otoño del 21/03, invierno del 21/06
const ROADMAP = [
  { season: 'Primavera', months: 'Sep – Dic', releases: [
    { kind: 'launch', title: 'Lanzamiento', date: '29 SEP', icon: 'achievement_dungeon_gloryofthehero', done: true,
      items: ['Armería y ranking', 'Mazmorras con el chat', 'Duelos', 'Tabardos y marcos de retrato', 'Chat de la armería'] },
    { kind: 'patch', title: 'Parche 1.0.1', subtitle: 'Preparados', date: '1 OCT', icon: 'spell_holy_wordfortitude', done: true,
      items: ['Bufos al entrar a la mazmorra', 'Contrajuego en los duelos: disipar, liberarse, escapar'] },
    { kind: 'patch', title: 'Parche 1.1', subtitle: 'La arena', date: '9 OCT', icon: 'achievement_arena_2v2_7',
      items: ['Ranking de duelistas', 'Efectos de hechizos en los duelos'] },
    { kind: 'event', title: 'Festival de la Linterna', date: '18 OCT', icon: 'achievement_halloween_witch_01',
      items: ['Mazmorra de Halloween', 'El Jinete decapitado', 'Recompensa del evento'] },
    { kind: 'forever', title: 'WoW Forever', date: '4 NOV', icon: 'inv_misc_head_orc_01',
      items: ['El stream pasa a WoW Forever', '9 mazmorras nuevas', 'Botín nuevo'] },
    { kind: 'event', title: 'Festival de Invierno', date: 'MED. DE DIC', icon: 'achievement_worldevent_merrymaker',
      items: ['Mazmorra de invierno', 'El Grinch abominable'] },
  ] },
  { season: 'Verano', months: 'Dic – Mar', releases: [
    { kind: 'patch', title: 'Parche 1.2', subtitle: 'El trono', date: 'ENE', icon: 'inv_misc_tournaments_banner_human',
      items: ['Rey de la colina: torneo de duelos', 'Apuestas en los duelos', 'Tabardo de campeón'] },
    { kind: 'event', title: 'Amor en el aire', date: 'FEB', icon: 'achievement_worldevent_valentine',
      items: ['El Boticario Hummel', 'Castillo de Colmillo Oscuro'] },
  ] },
  { season: 'Otoño', months: 'Mar – Jun', releases: [
    { kind: 'patch', title: 'Parche 1.3', subtitle: 'Jefe de mundo', date: 'ABR', icon: 'achievement_boss_ragnaros',
      items: ['Todo el chat contra un jefe gigante, una vez por stream'] },
  ] },
  { season: 'Invierno', months: 'Jun – Sep', releases: [
    { kind: 'event', title: 'Solsticio de verano', date: 'JUN', icon: 'spell_fire_masterofelements',
      items: ['Ahune, el Señor del Invierno'] },
  ] },
];

if (!viewerLogin && !auctionMode) showRoadmap();

function showRoadmap() {
  const nextRelease = ROADMAP.flatMap(season => season.releases).find(release => !release.done);
  document.getElementById('roadmap-list').innerHTML = ROADMAP.map(season => roadmapSeason(season, nextRelease)).join('');
}

function roadmapSeason(season, nextRelease) {
  const releases = season.releases.map(release => roadmapRelease(release, release === nextRelease)).join('');
  return `
    <div class="roadmap-season" style="--releases: ${season.releases.length}">
      <div class="roadmap-band">${escapeHtml(season.season)}<small>${escapeHtml(season.months)}</small></div>
      ${releases}
    </div>`;
}

function roadmapRelease(release, isNext) {
  const status = release.done ? 'Disponible' : isNext ? 'Lo próximo' : '';
  const subtitle = release.subtitle ? `<small>${escapeHtml(release.subtitle)}</small>` : '';
  const items = release.items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  return `
    <article class="roadmap-release ${release.kind}${isNext ? ' next' : ''}">
      <header class="roadmap-head">
        <img src="https://wow.zamimg.com/images/wow/icons/large/${release.icon}.jpg" alt="" loading="lazy">
        <strong>${escapeHtml(release.title)}</strong>
        ${subtitle}
        <span class="roadmap-date">${escapeHtml(release.date)}</span>
        ${status ? `<span class="roadmap-status">${status}</span>` : ''}
      </header>
      <ul class="roadmap-body">${items}</ul>
    </article>`;
}
