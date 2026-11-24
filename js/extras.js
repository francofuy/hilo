// Contenido extra de la ficha, todo adentro de la app: tráiler, reseñas de usuarios (TMDB)
// y artículo de Wikipedia (argumento, producción, recepción, diferencias con el original).
import * as api from './api.js';

const cache = new Map();

function timeout(ms) { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; }
async function getJson(url) {
  const r = await fetch(url, { signal: timeout(10000) });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

/* ---------- tráiler ---------- */
function pickTrailer(d) {
  const vids = ((d.videos && d.videos.results) || []).filter((v) => v.site === 'YouTube');
  const score = (v) => (v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) + (v.official ? 2 : 0) + (v.iso_639_1 === 'es' ? 1.5 : v.iso_639_1 === 'en' ? 1 : 0);
  const best = vids.filter((v) => v.type === 'Trailer' || v.type === 'Teaser').sort((a, b) => score(b) - score(a))[0];
  return best ? { key: best.key, name: best.name } : null;
}

/* ---------- reseñas de TMDB ---------- */
async function loadReviews(type, id) {
  const r = await api.reviews(type, id);
  return (r.results || [])
    .filter((x) => x.content && x.content.length > 120)
    .slice(0, 8)
    .map((x) => ({ a: x.author, r: x.author_details && x.author_details.rating != null ? x.author_details.rating : null, d: (x.created_at || '').slice(0, 10), tx: x.content.replace(/\r?\n+/g, '\n\n').trim().slice(0, 1100) }));
}

/* ---------- Wikipedia (se llega desde el ID de Wikidata que ya trae TMDB) ---------- */
const USEFUL = [
  [/^(premise|plot|synopsis|premisa|argumento|sinopsis|resumen|story)/, 'Argumento'],
  [/^(production|producción|development|desarrollo)/, 'Producción'],
  [/^(reception|critical|recepción|crítica|critical response)/, 'Recepción'],
  [/(differences|diferencias|comparison|adaptation|adaptación|comic|cómic|source material)/, 'Diferencias con el original']
];
async function sitelinks(qid) {
  const j = await getJson('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' + qid + '&props=sitelinks&sitefilter=eswiki%7Cenwiki&format=json&origin=*');
  const sl = (j.entities && j.entities[qid] && j.entities[qid].sitelinks) || {};
  return { es: sl.eswiki && sl.eswiki.title, en: sl.enwiki && sl.enwiki.title };
}
async function article(lang, title) {
  const j = await getJson('https://' + lang + '.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&format=json&origin=*&titles=' + encodeURIComponent(title));
  const pages = j.query && j.query.pages, p = pages && Object.values(pages)[0];
  return (p && p.extract) || '';
}
function parse(text) {
  const parts = text.split(/^(={2,4})\s*(.+?)\s*\1\s*$/m);
  const out = []; let cur = null;
  for (let i = 1; i < parts.length; i += 3) {
    const level = parts[i].length, title = parts[i + 1].trim();
    const paras = parts[i + 2].split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 60);
    if (level === 2) { cur = { t: title, direct: paras, kids: [] }; out.push(cur); } else if (cur) cur.kids.push({ t: title, paras });
  }
  return { lead: parts[0], sections: out };
}
function sectionText(sec) {
  const kids = [...sec.kids].sort((a, b) => (/critical|crítica|response/i.test(a.t) ? 0 : 1) - (/critical|crítica|response/i.test(b.t) ? 0 : 1));
  return sec.direct.concat(...kids.map((k) => k.paras)).slice(0, 3).join('\n\n').slice(0, 1500);
}
async function loadWiki(d) {
  const qid = d.external_ids && d.external_ids.wikidata_id;
  if (!qid) return null;
  const links = await sitelinks(qid);
  const arts = {};
  for (const lang of ['es', 'en']) if (links[lang]) { try { arts[lang] = parse(await article(lang, links[lang])); } catch (e) { /* esa lengua no respondió */ } }
  const lang0 = arts.es ? 'es' : arts.en ? 'en' : null;
  if (!lang0) return null;
  const paras = arts[lang0].lead.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 80);
  const res = { lang: lang0, title: links[lang0], summary: (paras[0] || '').slice(0, 900), sections: [] };
  const seen = new Set();
  for (const lang of ['es', 'en']) {
    if (!arts[lang]) continue;
    for (const sec of arts[lang].sections) {
      for (const [re, label] of USEFUL) {
        if (seen.has(label) || !re.test(sec.t.toLowerCase())) continue;
        const tx = sectionText(sec); if (!tx) continue;
        seen.add(label); res.sections.push({ t: label, orig: sec.t, lang, tx }); break;
      }
    }
  }
  const order = USEFUL.map((u) => u[1]);
  res.sections.sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t));
  return res.summary || res.sections.length ? res : null;
}

/* ---------- API pública ---------- */
export async function community(type, id, d) {
  const key = type + ':' + id;
  if (cache.has(key)) return cache.get(key);
  const p = Promise.all([loadReviews(type, id).catch(() => []), loadWiki(d).catch(() => null)]).then(([reviews, wiki]) => ({ reviews, trailer: pickTrailer(d), wiki }));
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  return p;
}
