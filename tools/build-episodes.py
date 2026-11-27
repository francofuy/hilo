"""Enlaces directos a cada EPISODIO en las plataformas (data/episodes.json), para las series de data/universes.json.

Es lo que hace JustWatch cuando abrís un episodio: cada episodio tiene su propio enlace en cada plataforma
(Netflix /watch/<id>, Disney+ /play/<id>, HBO Max /video/watch/<id>, Prime Video /watch?gti=<id>), y en el iPhone abre la app
reproduciendo ese episodio. La app no puede consultarlo en vivo (CORS), así que se arma acá y la app lee el archivo.
Para actualizarlo:  python3 tools/build-episodes.py   (no usa ninguna clave; API no documentada de JustWatch)."""
import json, subprocess, time

COUNTRY = 'UY'
PROV = {  # código -> (paquete de JustWatch, prefijo del enlace)
    'n': ('nfx', 'https://www.netflix.com/watch/'),
    'd': ('dnp', 'https://www.disneyplus.com/play/'),
    'h': ('mxx', 'https://play.hbomax.com/video/watch/'),
    'p': ('prv', 'https://app.primevideo.com/watch?gti='),
    'c': ('pmp', 'https://www.paramountplus.com/'),
    'a': ('atp', 'https://tv.apple.com/'),
}
BY_SHORT = {v[0]: k for k, v in PROV.items()}
Q_SEARCH = 'query($c: Country!, $l: Language!, $f: TitleFilter) { popularTitles(country: $c, first: 6, filter: $f) { edges { node { id content(country: $c, language: $l) { externalIds { tmdbId } } } } } }'
Q_EPS = ('query($id: ID!, $c: Country!, $l: Language!) { node(id: $id) { ... on Show { seasons { content(country: $c, language: $l) { seasonNumber } '
         'episodes(limit: 100) { content(country: $c, language: $l) { episodeNumber } offers(country: $c, platform: WEB) { monetizationType package { shortName } deeplinkURL(platform: IOS) } } } } } }')


def gql(query, variables):
    body = json.dumps({'query': query, 'variables': variables})
    for _ in range(3):
        r = subprocess.run(['curl', '-s', '-m', '90', '-X', 'POST', '-H', 'Content-Type: application/json', '-H', 'User-Agent: Mozilla/5.0',
                            '--data', body, 'https://apis.justwatch.com/graphql'], capture_output=True, text=True).stdout
        try:
            return json.loads(r).get('data') or {}
        except Exception:
            time.sleep(1.5)
    return {}


D = json.load(open('data/universes.json'))
out, seen = {}, set()
for u in D['universes']:
    for i in u['items']:
        if i['k'] != 'tv' or i['id'] in seen:
            continue
        seen.add(i['id'])
        node = None
        for term in (i['t'], i['t'].split(':')[0]):
            edges = (gql(Q_SEARCH, {'c': COUNTRY, 'l': 'es', 'f': {'searchQuery': term}}).get('popularTitles') or {}).get('edges', [])
            node = next((e['node'] for e in edges if str((e['node']['content']['externalIds'] or {}).get('tmdbId')) == str(i['id'])), None)
            if node:
                break
            time.sleep(0.3)
        if not node:
            continue
        show = (gql(Q_EPS, {'id': node['id'], 'c': COUNTRY, 'l': 'es'}).get('node') or {})
        res = {}
        for s in show.get('seasons') or []:
            sn = (s['content'] or {}).get('seasonNumber')
            for e in s['episodes']:
                en = (e['content'] or {}).get('episodeNumber')
                if not sn or not en:
                    continue
                for o in e['offers']:
                    code = BY_SHORT.get(o['package']['shortName'])
                    url = o.get('deeplinkURL')
                    if o['monetizationType'] != 'FLATRATE' or not code or not url:
                        continue
                    url = url.split('?utm_source=')[0]
                    pre = PROV[code][1]
                    arr = res.setdefault(code, {}).setdefault(str(sn), [])
                    while len(arr) < en:
                        arr.append(None)
                    if arr[en - 1] is None:
                        arr[en - 1] = url[len(pre):] if url.startswith(pre) else url
        # solo sirve si los episodios tienen enlaces distintos entre sí (si no, es el enlace de la serie)
        res = {c: s for c, s in res.items() if len({x for a in s.values() for x in a if x}) > 1}
        if res:
            out['tv:' + str(i['id'])] = res
        time.sleep(0.3)

json.dump({'region': COUNTRY, 'prefix': {k: v[1] for k, v in PROV.items()}, 'eps': out}, open('data/episodes.json', 'w'), ensure_ascii=False, separators=(',', ':'))
cnt = {k: [0, 0] for k in PROV}
for sh in out.values():
    for c, seasons in sh.items():
        cnt[c][0] += 1
        cnt[c][1] += sum(1 for a in seasons.values() for x in a if x)
print(len(out), 'series con enlace por episodio |', {k: v for k, v in cnt.items() if v[0]}, '(series, episodios)')
