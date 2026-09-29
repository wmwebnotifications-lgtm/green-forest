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

test('project workers.dev and version previews are noindex without changing content, status or cache headers', async () => {
  for (const host of ['green-forest.jakubszczerbawmwebsolutions.workers.dev', 'a1b2c3.green-forest.jakubszczerbawmwebsolutions.workers.dev']) {
    for (const status of [200, 404]) {
      const upstream = new Response('unchanged asset', { status, statusText: status === 200 ? 'OK' : 'Not Found', headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60', ETag: '"asset-hash"', 'X-Robots-Tag': 'nofollow' } });
      const r = await serve('https://' + host + '/', upstream);
      assert.equal(r.status, status);
      assert.equal(r.statusText, upstream.statusText);
      assert.equal(r.headers.get('content-type'), 'text/html; charset=utf-8');
      assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
      assert.equal(r.headers.get('etag'), '"asset-hash"');
      assert.equal(r.headers.get('x-robots-tag'), 'nofollow, noindex');
      assert.equal(upstream.headers.get('x-robots-tag'), 'nofollow');
      assert.equal(await r.text(), 'unchanged asset');
    }
  }
});

test('preview canonicalization retains noindex and request query', async () => {
  const host = 'green-forest.jakubszczerbawmwebsolutions.workers.dev';
  const r = await serve('https://' + host + '/kontakt?test=1', new Response(null, { status: 307, headers: { Location: '/kontakt/' } }));
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://' + host + '/kontakt/?test=1');
  assert.equal(r.headers.get('x-robots-tag'), 'noindex');
});

test('production, www redirects and localhost receive no preview indexing restriction', async () => {
  for (const url of ['https://greenforest-pulawy.pl/', 'https://www.greenforest-pulawy.pl/', 'http://localhost:8787/', 'https://green-forest.jakubszczerbawmwebsolutions.workers.dev.example.com/']) {
    const r = await serve(url);
    assert.equal(r.headers.get('x-robots-tag'), null);
    assert.equal(r.status, url.includes('://www.') ? 301 : 200);
  }
});
