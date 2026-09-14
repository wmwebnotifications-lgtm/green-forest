const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '../public');
const origin = 'https://greenforest-pulawy.pl';
function walk(dir) { return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const files = walk(root).filter(f => f.endsWith('.html'));
const titles = new Set();
let links = 0, schemas = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const label = path.relative(root, file);
  assert(!html.includes('https://greenforest.pl'), `${label}: old domain`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${label}: H1`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${label}: missing/duplicate title`);
  titles.add(title);
  if (!html.includes('content="noindex')) {
    const route = '/' + label.replaceAll('\\', '/').replace(/index.html$/, '');
    assert(html.includes(`rel="canonical" href="${origin}${route}"`), `${label}: canonical`);
    assert(html.includes(`property="og:url" content="${origin}${route}"`), `${label}: OG URL`);
    assert(html.includes('name="description" content="'), `${label}: description`);
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { JSON.parse(match[1]); schemas++; }
  for (const match of html.matchAll(/(?:href|src)="([^"\s]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const url = new URL(href, origin);
    let dest = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) dest = path.join(dest, 'index.html');
    assert(fs.existsSync(dest), `${label}: missing ${href}`);
    if (url.hash && dest.endsWith('.html')) assert(fs.readFileSync(dest,'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${label}: missing anchor ${href}`);
    links++;
  }
}
const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for (const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
  assert(match[1].startsWith(origin+'/'));
  assert(fs.existsSync(path.join(root, new URL(match[1]).pathname, 'index.html')));
}
assert(fs.readFileSync(path.join(root,'robots.txt'),'utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
console.log(`OK: ${files.length} HTML pages, ${links} internal links/assets, ${schemas} JSON-LD blocks, sitemap and robots.txt`);
