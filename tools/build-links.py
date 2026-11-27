"""Enlaces directos a cada título en las plataformas (data/links.json).

TMDB no da el enlace directo a cada plataforma y JustWatch no permite consultarlo desde una página web (CORS),
así que se arma acá, desde la API pública de JustWatch, y la app lee el archivo. Es lo mismo que hace JustWatch
cuando tocás el logo de una plataforma: el enlace al título exacto, que en el iPhone abre la app.

Incluye los títulos de data/universes.json y lo más popular de cada plataforma en Uruguay.
Para actualizarlo:  python3 tools/build-links.py   (no usa ninguna clave).
Es una API no documentada: si algún día cambia, la app sigue funcionando con las búsquedas."""
import json, subprocess, time

COUNTRY = 'UY'
PAGES = 7            # páginas de 100 por plataforma
# código -> (paquete de JustWatch, prefijo del enlace)
PROV = {
    'n': ('nfx', 'https://www.netflix.com/title/'),
    'd': ('dnp', 'https://www.disneyplus.com/browse/'),
    'h': ('mxx', 'https://play.hbomax.com/'),
    'p': ('prv', 'https://app.primevideo.com/'),
    'a': ('atp', 'https://tv.apple.com/'),
    'c': ('pmp', 'https://www.paramountplus.com/'),
}
BY_SHORT = {v[0]: k for k, v in PROV.items()}
FIELDS = ('objectType content(country: $c, language: $l) { title externalIds { tmdbId } } '
          'offers(country: $c, platform: WEB) { monetizationType package { shortName } standardWebURL }')
Q_POP = ('query($c: Country!, $l: Language!, $n: Int!, $after: String, $f: TitleFilter) { popularTitles(country: $c, first: $n, after: $after, filter: $f, sortBy: POPULAR) '
         '{ pageInfo { endCursor hasNextPage } edges { node { ' + FIELDS + ' } } } }')
Q_SEARCH = 'query($c: Country!, $l: Language!, $f: TitleFilter) { popularTitles(country: $c, first: 6, filter: $f) { edges { node { ' + FIELDS + ' } } } }'
out = {}


def gql(query, variables):
    body = json.dumps({'query': query, 'variables': variables})
    for _ in range(3):
        r = subprocess.run(['curl', '-s', '-m', '40', '-X', 'POST', '-H', 'Content-Type: application/json', '-H', 'User-Agent: Mozilla/5.0',
                            '--data', body, 'https://apis.justwatch.com/graphql'], capture_output=True, text=True).stdout
        try:
            return json.loads(r).get('data') or {}
        except Exception:
            time.sleep(1.5)
    return {}


def take(node):
    tmdb = (node['content']['externalIds'] or {}).get('tmdbId')
    if not tmdb:
        return
    key = ('movie' if node['objectType'] == 'MOVIE' else 'tv') + ':' + str(tmdb)
    for o in node['offers']:
        code = BY_SHORT.get(o['package']['shortName'])
        if o['monetizationType'] != 'FLATRATE' or not code:
            continue
        url = o['standardWebURL'].replace('?utm_source=universal_search', '').replace('&utm_source=universal_search', '')
        pre = PROV[code][1]
        out.setdefault(key, {})[code] = url[len(pre):] if url.startswith(pre) else url


# 1) lo más popular de cada plataforma
for code, (short, _) in PROV.items():
    after, n = None, 0
    for _ in range(PAGES):
        d = (gql(Q_POP, {'c': COUNTRY, 'l': 'es', 'n': 100, 'after': after, 'f': {'packages': [short], 'objectTypes': ['MOVIE', 'SHOW']}}).get('popularTitles') or {})
        for e in d.get('edges', []):
            take(e['node']); n += 1
        pi = d.get('pageInfo') or {}
        if not pi.get('hasNextPage'):
            break
        after = pi.get('endCursor'); time.sleep(0.4)
    print(short, n)

# 2) los títulos de los universos, por si alguno no está entre los populares
D = json.load(open('data/universes.json'))
for u in D['universes']:
    for i in u['items']:
        key = i['k'] + ':' + str(i['id'])
        if key in out:
            continue
        for term in (i['t'], i['t'].split(':')[0]):
            edges = (gql(Q_SEARCH, {'c': COUNTRY, 'l': 'es', 'f': {'searchQuery': term}}).get('popularTitles') or {}).get('edges', [])
            hit = next((e['node'] for e in edges if str((e['node']['content']['externalIds'] or {}).get('tmdbId')) == str(i['id'])), None)
            if hit:
                take(hit); break
            time.sleep(0.3)

json.dump({'region': COUNTRY, 'prefix': {k: v[1] for k, v in PROV.items()}, 'links': out}, open('data/links.json', 'w'), ensure_ascii=False, separators=(',', ':'))
cnt = {k: sum(1 for v in out.values() if k in v) for k in PROV}
uni = [i['k'] + ':' + str(i['id']) for u in D['universes'] for i in u['items']]
print(len(out), 'títulos con enlace |', cnt, '| universos cubiertos:', sum(1 for k in set(uni) if k in out), 'de', len(set(uni)))
