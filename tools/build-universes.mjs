// Resuelve los universos curados contra TMDB y genera data/universes.json.
// Uso:  TMDB_KEY=xxxx node tools/build-universes.mjs
// La key se usa solo durante esta ejecución y no se guarda en ningún archivo.
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.TMDB_KEY;
if (!KEY) { console.error('Falta TMDB_KEY'); process.exit(1); }
const BASE = 'https://api.themoviedb.org/3';

// [tipo, búsqueda en inglés, año de estreno, nota opcional]
const m = (q, y, rl) => ['movie', q, y, rl];
const t = (q, y, rl) => ['tv', q, y, rl];

const UNIVERSES = [
  { id: 'marvel', title: 'Marvel', sub: 'Camino a Avengers: Doomsday', modes: true, items: [
    m('Captain America: The First Avenger', 2011), t('Agent Carter', 2015), m('Captain Marvel', 2019),
    m('Iron Man', 2008), m('Iron Man 2', 2010), m('The Incredible Hulk', 2008), m('Thor', 2011),
    m('The Avengers', 2012), m('Thor: The Dark World', 2013), m('Iron Man 3', 2013),
    m('Captain America: The Winter Soldier', 2014), m('Guardians of the Galaxy', 2014),
    m('Guardians of the Galaxy Vol. 2', 2017), m('Avengers: Age of Ultron', 2015), m('Ant-Man', 2015),
    m('Captain America: Civil War', 2016), m('Black Widow', 2021), m('Black Panther', 2018),
    m('Spider-Man: Homecoming', 2017), m('Doctor Strange', 2016), m('Thor: Ragnarok', 2017),
    m('Ant-Man and the Wasp', 2018), m('Avengers: Infinity War', 2018), m('Avengers: Endgame', 2019),
    t('WandaVision', 2021), t('The Falcon and the Winter Soldier', 2021), t('Loki', 2021), t('What If...?', 2021),
    m('Shang-Chi and the Legend of the Ten Rings', 2021), m('Eternals', 2021), t('Hawkeye', 2021),
    m('Spider-Man: No Way Home', 2021), t('Moon Knight', 2022), m('Doctor Strange in the Multiverse of Madness', 2022),
    t('Ms. Marvel', 2022), m('Thor: Love and Thunder', 2022), m('Black Panther: Wakanda Forever', 2022),
    t('She-Hulk: Attorney at Law', 2022), m('Ant-Man and the Wasp: Quantumania', 2023),
    m('Guardians of the Galaxy Vol. 3', 2023), t('Secret Invasion', 2023), m('The Marvels', 2023),
    t('Echo', 2024), m('Deadpool & Wolverine', 2024), t('Agatha All Along', 2024),
    m('Captain America: Brave New World', 2025), t('Daredevil: Born Again', 2025), m('Thunderbolts*', 2025),
    t('Ironheart', 2025), m('The Fantastic Four: First Steps', 2025), m('Avengers: Doomsday', 2026)
  ]},
  { id: 'twd', title: 'The Walking Dead', sub: 'Series conectadas', modes: false, items: [
    t('The Walking Dead', 2010, 'Serie original'),
    t('Fear the Walking Dead', 2015, 'Compañera: arranca al inicio del brote'),
    t('The Walking Dead: World Beyond', 2020, 'Diez años después del brote'),
    t('Tales of the Walking Dead', 2022, 'Antología'),
    t('The Walking Dead: Dead City', 2023, 'Continuación de la historia'),
    t('The Walking Dead: Daryl Dixon', 2023, 'Continuación de la historia'),
    t('The Walking Dead: The Ones Who Live', 2024, 'Continuación de la historia')
  ]},
  { id: 'starwars', title: 'Star Wars', sub: 'La saga en orden de la historia', modes: true, items: [
    m('Star Wars: Episode I - The Phantom Menace', 1999), m('Star Wars: Episode II - Attack of the Clones', 2002),
    t('Star Wars: The Clone Wars', 2008), m('Star Wars: Episode III - Revenge of the Sith', 2005),
    t('Star Wars: The Bad Batch', 2021), m('Solo: A Star Wars Story', 2018), t('Obi-Wan Kenobi', 2022),
    t('Andor', 2022), m('Rogue One: A Star Wars Story', 2016), t('Star Wars Rebels', 2014),
    m('Star Wars', 1977), m('The Empire Strikes Back', 1980), m('Return of the Jedi', 1983),
    t('The Mandalorian', 2019), t('The Book of Boba Fett', 2021), t('Ahsoka', 2023),
    m('Star Wars: The Force Awakens', 2015), m('Star Wars: The Last Jedi', 2017), m('Star Wars: The Rise of Skywalker', 2019)
  ]},
  { id: 'breakingbad', title: 'Breaking Bad', sub: 'Albuquerque, antes y después', modes: true, items: [
    t('Better Call Saul', 2015, 'Precuela y continuación'), t('Breaking Bad', 2008, 'Serie original'), m('El Camino: A Breaking Bad Movie', 2019, 'Epílogo')
  ]},
  { id: 'got', title: 'Game of Thrones', sub: 'Westeros en orden de la historia', modes: true, items: [
    t('A Knight of the Seven Kingdoms', 2026), t('House of the Dragon', 2022, 'Precuela'), t('Game of Thrones', 2011, 'Serie original')
  ]},
  { id: 'wizarding', title: 'Mundo Mágico', sub: 'Harry Potter y Animales Fantásticos', modes: true, items: [
    m('Fantastic Beasts and Where to Find Them', 2016), m('Fantastic Beasts: The Crimes of Grindelwald', 2018),
    m('Fantastic Beasts: The Secrets of Dumbledore', 2022),
    m("Harry Potter and the Philosopher's Stone", 2001), m('Harry Potter and the Chamber of Secrets', 2002),
    m('Harry Potter and the Prisoner of Azkaban', 2004), m('Harry Potter and the Goblet of Fire', 2005),
    m('Harry Potter and the Order of the Phoenix', 2007), m('Harry Potter and the Half-Blood Prince', 2009),
    m('Harry Potter and the Deathly Hallows: Part 1', 2010), m('Harry Potter and the Deathly Hallows: Part 2', 2011)
  ]},
  { id: 'middleearth', title: 'Tierra Media', sub: 'El Hobbit, El Señor de los Anillos y más', modes: true, items: [
    t('The Lord of the Rings: The Rings of Power', 2022), m('The Hobbit: An Unexpected Journey', 2012),
    m('The Hobbit: The Desolation of Smaug', 2013), m('The Hobbit: The Battle of the Five Armies', 2014),
    m('The Lord of the Rings: The Fellowship of the Ring', 2001), m('The Lord of the Rings: The Two Towers', 2002),
    m('The Lord of the Rings: The Return of the King', 2003), m('The Lord of the Rings: The War of the Rohirrim', 2024)
  ]},
  { id: 'dune', title: 'Dune', sub: 'Arrakis, de las Bene Gesserit a Paul', modes: true, items: [
    t('Dune: Prophecy', 2024), m('Dune', 2021), m('Dune: Part Two', 2024)
  ]},
  { id: 'theboys', title: 'The Boys', sub: 'El universo de Vought', modes: false, items: [
    t('The Boys', 2019), t('Gen V', 2023)
  ]},
  { id: 'alien', title: 'Alien', sub: 'Nostromo y todo lo que vino después', modes: true, items: [
    m('Prometheus', 2012), m('Alien: Covenant', 2017), t('Alien: Earth', 2025), m('Alien', 1979),
    m('Alien: Romulus', 2024), m('Aliens', 1986), m('Alien 3', 1992), m('Alien Resurrection', 1997)
  ]}
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path, params = {}) {
  const u = new URL(BASE + path);
  u.searchParams.set('api_key', KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u);
    if (r.ok) return r.json();
    if (r.status === 429) { await sleep(1500); continue; }
    throw new Error(path + ' → ' + r.status);
  }
  throw new Error(path + ' → reintentos agotados');
}
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

async function resolve([k, q, y, rl]) {
  const key = k === 'movie' ? 'primary_release_year' : 'first_air_date_year';
  let res = (await get('/search/' + k, { query: q, [key]: y, language: 'en-US' })).results || [];
  if (!res.length) res = (await get('/search/' + k, { query: q, language: 'en-US' })).results || [];
  const nq = norm(q);
  const date = (r) => r.release_date || r.first_air_date || '';
  let best = res.find((r) => norm(r.title || r.name || '') === nq && Math.abs(+date(r).slice(0, 4) - y) <= 1)
          || res.find((r) => Math.abs(+date(r).slice(0, 4) - y) <= 1)
          || res[0];
  if (!best) return null;
  const es = await get('/' + k + '/' + best.id, { language: 'es-MX' });
  const item = { k, id: best.id, t: es.title || es.name || best.title || best.name, y: +date(best).slice(0, 4) || y,
    d: date(best) || null, p: es.poster_path || best.poster_path || null, b: es.backdrop_path || best.backdrop_path || null };
  if (k === 'tv') item.eps = es.number_of_episodes || 0;
  if (rl) item.rl = rl;
  item._match = norm(best.title || best.name || '') === nq;
  return item;
}

const out = [];
const warn = [];
for (const U of UNIVERSES) {
  const items = [];
  for (const spec of U.items) {
    try {
      const it = await resolve(spec);
      if (!it) { warn.push(`SIN RESULTADO  [${U.id}] ${spec[1]} (${spec[2]})`); continue; }
      if (!it._match) warn.push(`REVISAR  [${U.id}] "${spec[1]}" → "${it.t}" (${it.y}) id ${it.id}`);
      delete it._match;
      items.push(it);
    } catch (e) { warn.push(`ERROR  [${U.id}] ${spec[1]}: ${e.message}`); }
  }
  out.push({ id: U.id, title: U.title, sub: U.sub, modes: U.modes, items });
  console.log(`${U.id}: ${items.length}/${U.items.length}`);
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/universes.json', import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), universes: out }));
if (warn.length) console.log('\n' + warn.join('\n'));
