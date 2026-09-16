const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../public');
const origin = 'https://greenforest-pulawy.pl';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const clean = text => text.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m => [m[1].toLowerCase(), m[3]]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attrs(m[0]));
const nodes = data => Array.isArray(data) ? data.flatMap(nodes) : data && typeof data === 'object' ? [data, ...Object.values(data).flatMap(nodes)] : [];
const checks = [
  'Brakujące lub powielone tytuły', 'Tytuły dłuższe niż 60 znaków (cel redakcyjny)',
  'Brakujące lub powielone opisy', 'Opisy poza 70–160 znaków (cel redakcyjny)',
  'Brak lub więcej niż jeden H1', 'Błędne canonical', 'Niespójne Open Graph',
  'Błędy JSON-LD i adresów encji', 'FAQ niezgodne z widoczną treścią',
  'Niespójne dane firmy', 'Uszkodzone linki, kotwice lub zasoby',
  'Obrazy bez alt lub wymiarów', 'Błędy mapy witryny i noindex',
  'Strony nieosiągalne ze strony głównej', 'Błędny język lub viewport',
  'Niewłaściwa domena / HTTP w adresach wewnętrznych', 'Blokada indeksowania / robots.txt'
].map(name => ({ name, issues: [] }));
const fail = (n, text) => checks[n - 1].issues.push(text);
const allFiles = walk(root);
const pages = allFiles.filter(f => f.endsWith('.html')).map(file => {
  const html = fs.readFileSync(file, 'utf8');
  const label = path.relative(root, file).replaceAll('\\', '/');
  const route = '/' + label.replace(/index\.html$/, '');
  const meta = tags(html, 'meta');
  const get = name => meta.filter(m => (m.name || m.property) === name).map(m => m.content);
  return { file, html, label, route, url: origin + route, get, indexable: !get('robots').some(v => /noindex/i.test(v)), links: new Set() };
});
const byUrl = new Map(pages.map(p => [p.url, p]));
const titles = new Map(), descriptions = new Map();
let linkCount = 0, schemaCount = 0, imageCount = 0;
function asset(url, page, description) {
  let parsed;
  try { parsed = new URL(url, page.url); } catch { fail(11, `${page.label}: ${description} ${url}`); return; }
  if (parsed.origin !== origin) return;
  let dest;
  try { dest = path.resolve(root, '.' + decodeURIComponent(parsed.pathname)); } catch { fail(11, `${page.label}: ${url}`); return; }
  if (!dest.startsWith(root + path.sep) && dest !== root) { fail(11, `${page.label}: ${url}`); return; }
  if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) dest = path.join(dest, 'index.html');
  if (!fs.existsSync(dest) || !fs.statSync(dest).isFile()) { fail(11, `${page.label}: ${url}`); return; }
  linkCount++;
  const target = pages.find(p => p.file === dest);
  if (target) {
    page.links.add(target.url);
    if (parsed.hash && !tags(target.html, '[a-z][\\w:-]*').some(t => t.id === decodeURIComponent(parsed.hash.slice(1)))) fail(11, `${page.label}: kotwica ${url}`);
  }
}
for (const p of pages) {
  const { html, label, get } = p;
  const titleTags = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const title = clean(titleTags[0]?.[1] || '');
  if (titleTags.length !== 1 || !title || titles.has(title)) fail(1, label);
  titles.set(title, label);
  if (p.indexable && title.length > 60) fail(2, `${label}: ${title.length}`);
  if ([...html.matchAll(/<h1\b/gi)].length !== 1) fail(5, label);
  if (p.indexable) {
    const descriptionsHere = get('description'), desc = descriptionsHere[0] || '';
    if (descriptionsHere.length !== 1 || !desc || descriptions.has(desc)) fail(3, label);
    descriptions.set(desc, label);
    if (desc.length < 70 || desc.length > 160) fail(4, `${label}: ${desc.length}`);
    const canonical = tags(html, 'link').filter(t => t.rel === 'canonical');
    if (canonical.length !== 1 || canonical[0].href !== p.url) fail(6, label);
    if (get('og:url').length !== 1 || get('og:url')[0] !== p.url || get('og:title')[0] !== titleTags[0]?.[1] || get('og:description')[0] !== desc) fail(7, label);
    if (!get('robots').some(v => /\bindex\b/.test(v) && /\bfollow\b/.test(v))) fail(17, `${label}: brak jawnego index, follow`);
  }
  if (!/<html\b[^>]*lang=["']pl(?:-PL)?["']/i.test(html) || !get('viewport').some(v => /width=device-width/.test(v))) fail(15, label);
  const faqVisible = [...html.matchAll(/<details\b[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(m => ({ q: clean(m[1]), a: clean(m[2]) }));
  let faq = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(match[1]); schemaCount++; } catch { fail(8, `${label}: JSON`); continue; }
    if (data['@context'] !== 'https://schema.org') fail(8, `${label}: @context`);
    for (const node of nodes(data)) {
      if (node['@type'] === 'FAQPage') faq.push(...(node.mainEntity || []));
      if (['Service', 'Article', 'ContactPage', 'CollectionPage', 'WebPage'].includes(node['@type']) && node.url && node.url !== p.url) fail(8, `${label}: URL encji`);
      if (node['@type'] === 'LocalBusiness') {
        if (node.name !== 'Green Forest' || node.telephone?.replace(/\D/g, '') !== '48694757680' || node.email !== 'green.forest33@op.pl' || node.url !== origin + '/' || node['@id'] !== origin + '/#business') fail(10, `${label}: nazwa / telefon / email / URL / @id`);
        if (node.openingHours || node.openingHoursSpecification) fail(10, `${label}: godziny wymagają potwierdzenia właściciela`);
      }
      if (node['@type'] === 'BreadcrumbList') for (const [i, item] of (node.itemListElement || []).entries()) {
        if (item.position !== i + 1 || !byUrl.has(item.item)) fail(8, `${label}: breadcrumb ${item.item}`);
      }
    }
  }
  if (faq.length !== faqVisible.length || faq.some(q => !faqVisible.some(v => v.q === clean(q.name) && v.a === clean(q.acceptedAnswer?.text || '')))) fail(9, label);
  for (const t of tags(html, '(?:a|link|script|img|source|iframe)')) {
    if (t.href && !/^(?:tel:|mailto:|javascript:)/i.test(t.href)) asset(t.href, p, 'link');
    if (t.src) asset(t.src, p, 'src');
    if (t.srcset) for (const candidate of t.srcset.split(',')) asset(candidate.trim().split(/\s+/)[0], p, 'srcset');
  }
  for (const img of tags(html, 'img')) {
    imageCount++;
    if (!Object.hasOwn(img, 'alt') || (img.src && !(Number(img.width) > 0 && Number(img.height) > 0))) fail(12, `${label}: ${img.src || 'obraz dynamiczny'}`);
  }
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?greenforest(?:-pulawy)?\.pl[^\s"<>]*/g)) if (!m[0].startsWith(origin + '/')) fail(16, `${label}: ${m[0]}`);
}
for (const file of allFiles.filter(f => f.endsWith('.css') && !f.includes(path.sep + 'vendor' + path.sep))) {
  const css = fs.readFileSync(file, 'utf8').replace(/url\((["'])data:[\s\S]*?\1\)/g, '');
  for (const m of css.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g)) if (!m[1].startsWith('data:')) asset(m[1], { label: path.relative(root, file), url: origin + '/' + path.relative(root, file).replaceAll('\\', '/'), links: new Set() }, 'CSS');
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
for (const url of locations) if (!byUrl.get(url)?.indexable || locations.filter(x => x === url).length !== 1) fail(13, url);
for (const p of pages.filter(p => p.indexable)) if (!locations.includes(p.url)) fail(13, `${p.label}: brak w sitemap`);
const visited = new Set(), queue = [origin + '/'];
while (queue.length) { const url = queue.shift(); if (visited.has(url)) continue; visited.add(url); for (const next of byUrl.get(url)?.links || []) queue.push(next); }
for (const p of pages.filter(p => p.indexable)) if (!visited.has(p.url)) fail(14, p.label);
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`) || /^Disallow:\s*\/\s*$/m.test(robots)) fail(17, 'robots.txt');
const result = { date: new Date().toISOString(), pages: pages.length, indexablePages: pages.filter(p => p.indexable).length, links: linkCount, images: imageCount, schemas: schemaCount, checks: checks.map(c => ({ ...c, count: c.issues.length })), errors: checks.reduce((n, c) => n + c.issues.length, 0) };
if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
else {
  for (const [i, c] of result.checks.entries()) console.log(`${String(i + 1).padStart(2, '0')}. ${c.name}: ${c.count}${c.count ? '\n  ' + c.issues.join('\n  ') : ''}`);
  console.log(`${result.errors === 0 ? 'OK' : 'BŁĘDY'}: ${result.pages} stron HTML, ${result.indexablePages} indeksowalnych, ${linkCount} linków/zasobów, ${schemaCount} bloków JSON-LD; problemy: ${result.errors}`);
}
process.exitCode = result.errors ? 1 : 0;
