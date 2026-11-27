"""Enlaces directos a cada título en las plataformas (data/links.json), para los títulos de data/universes.json.

TMDB no da el enlace directo a cada plataforma y JustWatch no permite consultarlo desde una página web (CORS),
así que se arma acá, de una vez, desde la API pública de JustWatch, y la app lee el archivo.
Los enlaces son de Argentina. Para actualizarlos:  python3 tools/build-links.py
No usa ninguna clave. Es una API no documentada: si algún día cambia, la app sigue funcionando con las búsquedas."""
import json, subprocess, time, urllib.parse

COUNTRY = 'AR'
Q = ('query($c: Country!, $l: Language!, $f: TitleFilter) { popularTitles(country: $c, first: 6, filter: $f) { edges { node { objectType '
     'content(country: $c, language: $l) { title externalIds { tmdbId } } '
     'offers(country: $c, platform: WEB) { monetizationType package { clearName } standardWebURL } } } } }')
D = json.load(open('data/universes.json'))
out, miss = {}, []


def ask(term):
    body = json.dumps({'query': Q, 'variables': {'c': COUNTRY, 'l': 'es', 'f': {'searchQuery': term}}})
    r = subprocess.run(['curl', '-s', '-m', '25', '-X', 'POST', '-H', 'Content-Type: application/json', '-H', 'User-Agent: Mozilla/5.0',
                        '--data', body, 'https://apis.justwatch.com/graphql'], capture_output=True, text=True).stdout
    return ((json.loads(r).get('data') or {}).get('popularTitles') or {}).get('edges', [])


seen = set()
for u in D['universes']:
    for i in u['items']:
        key = i['k'] + ':' + str(i['id'])
        if key in seen:
            continue
        seen.add(key)
        hit = None
        for term in (i['t'], i['t'].split(':')[0]):
            try:
                edges = ask(term)
            except Exception:
                edges = []
            hit = next((e['node'] for e in edges if str((e['node']['content']['externalIds'] or {}).get('tmdbId')) == str(i['id'])), None)
            if hit:
                break
            time.sleep(0.3)
        if not hit:
            miss.append(i['t'])
            continue
        links = {}
        for o in hit['offers']:
            if o['monetizationType'] == 'FLATRATE' and o['package']['clearName'] not in links:
                links[o['package']['clearName']] = o['standardWebURL']
        if links:
            out[key] = links
        time.sleep(0.3)

json.dump({'region': COUNTRY, 'links': out}, open('data/links.json', 'w'), ensure_ascii=False, separators=(',', ':'))
names = {}
for v in out.values():
    for n in v:
        names[n] = names.get(n, 0) + 1
print(len(out), 'títulos con enlaces de', len(seen), '| sin encontrar:', len(miss), miss[:8])
print(names)
