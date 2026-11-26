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
| `js/taste.js` | Gusto: qué sugerir según tu historial |
| `css/design.css`, `css/screens.css` | Estilos de la ficha y de las demás pantallas |
| `js/extras.js` | Comunidad adentro de la app: tráiler (YouTube), reseñas de TMDB y artículo de Wikipedia (vía Wikidata) |
| `data/universes.json` | Universos curados (IDs de TMDB) |
| `tools/build-universes.mjs` | Regenera `universes.json`: `TMDB_KEY=xxxx node tools/build-universes.mjs` |
| `sw.js` | Service worker: app y datos guardados sin conexión |

## Diseño

Las cinco pantallas comparten un lenguaje: la imagen del título (póster sin texto de TMDB) es el fondo de toda la
pantalla, nítida arriba y desenfocada al bajar; poco texto, una acción principal y lo demás en filas sin cajas.

- **Inicio:** portadas a pantalla completa que rotan al azar. Mezclan lo que tenés en curso (Retomar, Anteriormente)
  con sugerencias según tu gusto (Ver ficha, Mi lista, No me interesa).
- **Universos:** un universo por pantalla; adentro, la lista arranca en "Estoy aquí".
- **Buscar:** tendencia a pantalla completa, y al escribir la imagen del primer resultado queda de fondo.
- **Ajustes:** filas cortas; cada una abre una hoja con el detalle.

El gusto (`js/taste.js`) se calcula en el teléfono con lo que seguís, puntuaste y terminaste.

## Probar en local

```bash
python3 -m http.server 8000
```

Abrí `http://localhost:8000`. El service worker solo funciona en `localhost` o HTTPS.

## Créditos

Datos e imágenes: [TMDB](https://www.themoviedb.org). Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.
Disponibilidad de plataformas: JustWatch, vía TMDB.
