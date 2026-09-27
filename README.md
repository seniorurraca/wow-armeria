# Armería y landing del canal

Página pública del canal (`https://seniorurraca.github.io/wow-armeria/`):

- **Sin parámetro → landing**: barra con indicador *En vivo / Offline*, hero con carrusel de arte de WoW Forever, el ranking de la armería por GearScore, cómo participar (canjes y comandos) y los links a Twitch / YouTube / Discord.
- **`?u=nick` → ficha del personaje** (el link que da `!inventario`), estilo ventana de personaje de WoW Classic.

| Archivo | Qué hace |
|---|---|
| `index.html` | Contenido de la landing (textos, links, secciones) |
| `landing.css` / `landing.js` | Estilos de la landing, carrusel, estado en vivo, avatar y ranking |
| `armeria.css` / `armeria.js` | Ficha del personaje; lee el `armory.json` que publica [Streamer.bot](../streamerbot) en un Gist |
| `gearscore.js` | Colores del GearScore (el número lo calcula Streamer.bot) |
| `logros.js` | Pestaña "Logros" de la ficha (la lista viene del gist) |
| `botin.js` | Pestaña "Botín" de la ficha (historial de objetos) |
| `img/` | Fondos del carrusel (arte de WoW Forever achicado a 1920 px) |

## Landing

- **En vivo / Offline**: lo consulta a [DecAPI](https://decapi.me) (`/twitch/uptime/seniorurraca`), un servicio público sin credenciales. El logo de arriba es tu avatar de Twitch, también por DecAPI.
- **Carrusel**: las imágenes están en `HERO_IMAGES` al principio de `landing.js`, rotan cada 7 segundos. Para sumar una, achicarla a 1920 px de ancho (pesan 5–30 MB originales) y agregarla a la lista.
- **Textos y links**: se editan directamente en `index.html`.

## Ficha del personaje

| Pestaña | Contenido |
|---|---|
| Personaje | Casilleros de equipo alrededor de una silueta con el brillo del color de clase, y el resumen (GearScore, objetos, épicos, legendarios, hechizos) |
| Inventario | Todos los objetos con su calidad, cantidad y cuáles están equipados |
| Botín | Cada objeto ganado, del más nuevo al más viejo, con origen (cofre o loot de raid) y fecha. Los guardados antes de registrar la fecha van al final |
| Hechizos | Libro de hechizos en pergamino, 12 por página, en orden alfabético |
| Logros | Los conseguidos (con fecha) y los que faltan en gris, con cómo conseguirlos |

- El retrato es la foto de perfil de Twitch. Si todavía no se guardó, se usa el ícono de la clase.
- Al pasar el mouse por un objeto o hechizo aparece el tooltip real de Wowhead.
- Fuente: Friz Quadrata (la de WoW) si el espectador la tiene instalada, si no Marcellus de Google Fonts. Friz es comercial y no se puede subir al repo.

## GearScore

El GearScore lo calcula Streamer.bot (`wow-armeria.cs`) y viene en el gist; `gearscore.js` solo lo pinta. La fórmula es la del addon GearScore para objetos de nivel ≤ 120 (todos los de Classic): `((nivel - A) / B) × peso del casillero × 1.8618 × escala de calidad`. Solo cuenta lo equipado. Las armas a dos manos pesan 2, cabeza/pecho/piernas/armas a una mano 1, y anillos, cuello, capa y abalorios 0.5625. Los legendarios valen ×1.3 y los blancos o grises casi nada.

El número se pinta como en TacoTip, con degradé entre tramos de 200: gris (0) → blanco (200) → verde (400) → azul (600) → morado (800) → naranja (1000+). Un personaje full T3 ronda los 1100.

## Publicar en GitHub Pages

Este repo es privado, así que la página vive en el repo público [`wow-armeria`](https://github.com/seniorurraca/wow-armeria).

Primera vez:

1. Crear el repo público `wow-armeria` en GitHub.
2. Copiar ahí todo el contenido de esta carpeta menos este README (`GIST_ID` en `armeria.js` ya tiene el ID del gist).
3. Repo → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
4. Guardar la URL en la variable `wowArmoryPageUrl` de Streamer.bot.

Para actualizarla: editar acá, copiar los archivos cambiados al repo `wow-armeria`, commit y push. En uno o dos minutos se publica; recargar con Ctrl+F5.

Los datos nuevos se ven al recargar: la página consulta la API de GitHub cada vez que se abre (límite de 60 consultas por hora por espectador).

## Probar en local

Abrir `index.html` con un servidor local (no con doble clic, porque los scripts no corren desde `file://`). Lee el gist real.

El arte de World of Warcraft es © Blizzard Entertainment; el pie de la página lo aclara.
