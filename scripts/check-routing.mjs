import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker.mjs';

const serve = (url, response = new Response('page'), method = 'GET') => worker.fetch(new Request(url, { method }), { ASSETS: { fetch: async () => response } });
test('HTTP becomes HTTPS without losing path or query', async () => {
  const r = await serve('http://greenforest-pulawy.pl/drewno-opalowe/?utm_source=test');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://greenforest-pulawy.pl/drewno-opalowe/?utm_source=test');
});
test('www and index.html normalize in one redirect', async () => {
  const r = await serve('http://www.greenforest-pulawy.pl/drewno-opalowe/index.html?a=1', new Response(null, { status: 307, headers: { Location: '/drewno-opalowe/' } }));
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://greenforest-pulawy.pl/drewno-opalowe/?a=1');
});
test('canonical URL serves the asset and 404 stays a real 404', async () => {
  const r = await serve('https://greenforest-pulawy.pl/');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'page');
  assert.equal((await serve('https://greenforest-pulawy.pl/missing/', new Response('404', { status: 404 }))).status, 404);
});
test('preview hosts are not redirected to production', async () => {
  assert.equal((await serve('http://localhost:8787/')).status, 200);
  assert.equal((await serve('https://green-forest.example.workers.dev/')).status, 200);
});
test('HTML redirects become permanent, retaining query parameters', async () => {
  const r = await serve('https://greenforest-pulawy.pl/kontakt?utm_source=test', new Response(null, { status: 307, headers: { Location: '/kontakt/' } }));
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://greenforest-pulawy.pl/kontakt/?utm_source=test');
});
test('HTTPS redirect preserves non-GET method semantics', async () => {
  assert.equal((await serve('http://greenforest-pulawy.pl/', new Response('page'), 'POST')).status, 308);
});
