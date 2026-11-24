# Hilo

App web instalable (PWA) para seguir series y películas: dónde te quedaste, resúmenes "Anteriormente",
universos conectados en orden (Marvel, Star Wars, The Walking Dead y más) y modo sin conexión.

Sin dependencias ni paso de compilación: HTML, CSS y JavaScript con módulos ES.

## Primer uso

1. Abrí la app (GitHub Pages) en Safari y tocá **Compartir → Agregar a inicio**.
2. Pegá tu **API key gratuita de TMDB** (themoviedb.org → Configuración → API). Se guarda solo en tu teléfono.

La key **nunca** forma parte del repositorio.

## Estructura

| Ruta | Qué hace |
|---|---|
| `index.html`, `css/app.css` | Estructura y estilos |
| `js/app.js` | Router por hash y navegación |
| `js/store.js` | Estado (localStorage): seguimiento, capítulos vistos, puntuaciones, respaldo |
| `js/api.js` | TMDB (es-MX con sinopsis en inglés de respaldo) |
| `js/progress.js` | "Siguiente capítulo" y "Anteriormente" |
| `js/home.js`, `detail.js`, `universe.js`, `search.js`, `settings.js` | Pantallas |
| `data/universes.json` | Universos curados (IDs de TMDB) |
| `tools/build-universes.mjs` | Regenera `universes.json`: `TMDB_KEY=xxxx node tools/build-universes.mjs` |
| `sw.js` | Service worker: app y datos guardados sin conexión |

## Probar en local

```bash
python3 -m http.server 8000
```

Abrí `http://localhost:8000`. El service worker solo funciona en `localhost` o HTTPS.

## Créditos

Datos e imágenes: [TMDB](https://www.themoviedb.org). Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.
Disponibilidad de plataformas: JustWatch, vía TMDB.
