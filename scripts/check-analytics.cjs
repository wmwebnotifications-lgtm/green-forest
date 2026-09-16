const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../public/analytics.js'), 'utf8');
function browser(options = {}) {
  const listeners = {}, controls = {}, scripts = [], cookieWrites = [];
  const storage = new Map();
  if (options.choice) storage.set('greenforest-analytics-consent-v1', JSON.stringify({value: options.choice, at: options.at ?? Date.now()}));
  if (options.internal) storage.set('greenforest-internal-traffic', '1');
  function control(name) { return controls[name] ||= { addEventListener: (type, fn) => { controls[name][type] = fn; }, focus() {} }; }
  const panel = { hidden: true, querySelector: control };
  const document = {
    getElementById: id => id === 'analytics-consent' ? panel : {},
    querySelectorAll: () => [control('settings')],
    addEventListener: (name, fn) => { listeners[name] = fn; },
    createElement: () => ({}), head: { appendChild: script => scripts.push(script) },
    referrer: 'https://example.com/?email=private@example.com'
  };
  Object.defineProperty(document, 'cookie', {get: () => '_ga=old; _ga_6GWRFWXP2H=old', set: value => cookieWrites.push(value)});
  const location = { hostname: options.local ? 'localhost' : 'greenforest-pulawy.pl', protocol: options.local ? 'http:' : 'https:', origin: 'https://greenforest-pulawy.pl', pathname: '/kontakt/', reload: () => { result.reloaded = true; } };
  const window = { addEventListener: (name, fn) => { listeners[name] = fn; } };
  const result = { window, scripts, controls, panel, listeners, cookieWrites, storage, reloaded: false };
  vm.runInNewContext(code, { window, document, location, URL, localStorage: {getItem: key => {if(options.blockStorage)throw Error('blocked'); return storage.get(key) || null;},setItem: (key,value) => {if(options.blockStorage)throw Error('blocked');storage.set(key,value);}} });
  result.accept = () => controls['[data-analytics-accept]'].click();
  result.reject = () => controls['[data-analytics-reject]'].click();
  result.events = () => (window.dataLayer || []).filter(args => args[0] === 'event');
  return result;
}
test('no analytics script or event before consent; rejection persists', () => {
  const b = browser(); assert.equal(b.scripts.length, 0); assert.equal(b.events().length, 0); assert.equal(b.panel.hidden, false);
  b.reject(); assert.equal(b.scripts.length, 0); assert.equal(JSON.parse(b.storage.get('greenforest-analytics-consent-v1')).value, 'denied');
});
test('acceptance loads the specified tag once and strips sensitive URL parameters', () => {
  const b = browser(); b.accept(); b.accept();
  assert.equal(b.scripts.length, 1); assert.match(b.scripts[0].src, /G-6GWRFWXP2H$/);
  assert.equal(b.events().filter(e => e[1] === 'page_view').length, 1);
  assert.equal(b.events()[0][2].page_referrer, 'https://example.com/');
  assert(!JSON.stringify(b.window.dataLayer).includes('private@example.com'));
});
test('revocation disables collection, removes cookies and reloads', () => {
  const b = browser({choice: 'granted'}); b.reject();
  assert.equal(b.window['ga-disable-G-6GWRFWXP2H'], true); assert.equal(b.reloaded, true);
  assert(b.cookieWrites.some(v => v.startsWith('_ga=; Max-Age=0')));
  const count = b.events().length; b.listeners['greenforest:lead-sent'](); assert.equal(b.events().length, count);
});
test('saved rejection, expired/future consent, localhost and internal visits send no analytics', () => {
  for (const options of [{choice:'denied'}, {choice:'granted',at:0}, {choice:'granted',at:Date.now()+86400000}, {choice:'granted',local:true}, {choice:'granted',internal:true}]) assert.equal(browser(options).scripts.length, 0);
});
test('contact events include method only; form success emits a lead', () => {
  const b = browser({choice:'granted'});
  b.listeners.click({target:{closest:()=>({getAttribute:()=> 'tel:+48694757680'})}});
  b.listeners['greenforest:lead-sent']();
  assert.equal(b.events()[1][1], 'contact_click'); assert.equal(b.events()[1][2].contact_method, 'phone');
  assert.equal(b.events()[2][1], 'generate_lead'); assert(!JSON.stringify(b.events()).includes('694757680'));
});
test('unavailable localStorage does not bypass consent or break controls', () => {
  const b = browser({blockStorage:true}); assert.equal(b.scripts.length,0); b.accept(); assert.equal(b.scripts.length,1);
});
