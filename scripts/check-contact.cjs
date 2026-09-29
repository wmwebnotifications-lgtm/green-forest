const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const main = fs.readFileSync(path.join(__dirname, '../public/main.js'), 'utf8');
const analytics = fs.readFileSync(path.join(__dirname, '../public/analytics.js'), 'utf8');

function browser({ consent = 'granted', desktop = true } = {}) {
  const listeners = new Map(), requests = [], scripts = [];
  const button = { disabled: false, dataset: {}, textContent: 'Wyślij zapytanie' };
  const status = { textContent: '', style: {} };
  const phoneListeners = [];
  const phone = {
    getAttribute: () => 'tel:+48694757680',
    addEventListener: (name, callback) => { if (name === 'click') phoneListeners.push(callback); }
  };
  let onSubmit;
  const form = {
    resets: 0,
    addEventListener: (name, callback) => { if (name === 'submit') onSubmit = callback; },
    querySelector: selector => selector === '.form-status' ? status : selector === 'button[type="submit"]' ? button : null,
    getAttribute: () => 'https://form-test.invalid/submit',
    reset() { this.resets++; }
  };
  const control = { addEventListener() {}, focus() {} };
  const panel = { hidden: true, querySelector: () => control };
  const location = { hostname: 'greenforest-pulawy.pl', protocol: 'https:', origin: 'https://greenforest-pulawy.pl', pathname: '/kontakt/', href: 'https://greenforest-pulawy.pl/kontakt/' };
  const document = {
    cookie: '', referrer: '',
    querySelector: selector => selector === '.contact-form' ? form : null,
    querySelectorAll: selector => selector === 'form.contact-form' ? [form] : selector.includes('href^="tel:"') ? [phone] : [],
    getElementById: id => id === 'analytics-consent' ? panel : id === 'analytics-status' ? status : null,
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(callback); },
    dispatchEvent(event) { for (const callback of listeners.get(event.type) || []) callback(event); }
  };
  const window = {
    location,
    matchMedia: query => ({ matches: query.includes('pointer') ? desktop : true }),
    addEventListener() {}
  };
  const context = vm.createContext({
    document, window, location, URL,
    Event: class { constructor(type) { this.type = type; } },
    FormData: class { constructor(element) { this.form = element; } },
    localStorage: { getItem: key => key === 'greenforest-analytics-consent-v1' ? JSON.stringify({ value: consent, at: Date.now() }) : null },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }))
  });
  vm.runInContext(main, context);
  vm.runInContext(analytics, context);
  return {
    requests, scripts, button, status, form, location,
    submit() { onSubmit({ preventDefault() {} }); },
    clickPhone() {
      const event = { type: 'click', target: { closest: () => phone }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      for (const callback of phoneListeners) callback(event);
      document.dispatchEvent(event);
      return event;
    },
    leads: () => (window.dataLayer || []).filter(args => args[0] === 'event' && args[1] === 'generate_lead'),
    contacts: () => (window.dataLayer || []).filter(args => args[0] === 'event' && args[1] === 'contact_click')
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const response = (ok, success) => ({ ok, json: async () => ({ success }) });

test('phone links retain native dialing on desktop and touch; a click is not a lead', () => {
  for (const desktop of [true, false]) {
    const b = browser({ desktop });
    assert.equal(b.clickPhone().defaultPrevented, false);
    assert.equal(b.location.href, 'https://greenforest-pulawy.pl/kontakt/');
    assert.equal(b.contacts().length, 1);
    assert.equal(b.contacts()[0][2].contact_method, 'phone');
    assert.equal(b.leads().length, 0);
  }
});

test('repeated submit while pending sends one request and records one confirmed lead', async () => {
  const b = browser();
  b.submit(); b.submit();
  assert.equal(b.requests.length, 1);
  assert.equal(b.requests[0].options.method, 'POST');
  assert.equal(b.button.disabled, true);
  assert.equal(b.leads().length, 0);
  b.requests[0].resolve(response(true, true));
  await settle();
  assert.equal(b.leads().length, 1);
  assert.equal(b.leads()[0][2].contact_method, 'form');
  assert.equal(b.form.resets, 1);
  assert.match(b.status.textContent, /Wiadomość wysłana/);
  assert.equal(b.button.disabled, false);
  assert.equal(b.button.textContent, 'Wyślij zapytanie');
});

test('HTTP and service failures retain fields, emit no lead, and permit retry', async () => {
  for (const [ok, success] of [[false, true], [true, false]]) {
    const b = browser();
    b.submit(); b.requests[0].resolve(response(ok, success));
    await settle();
    assert.equal(b.leads().length, 0);
    assert.equal(b.form.resets, 0);
    assert.equal(b.button.disabled, false);
    assert.match(b.status.textContent, /Nie udało się wysłać/);
    b.submit();
    assert.equal(b.requests.length, 2);
    b.requests[1].resolve(response(true, true));
    await settle();
    assert.equal(b.leads().length, 1);
  }
});

test('network failure and invalid JSON emit no lead and re-enable submit', async () => {
  for (const invalidJson of [false, true]) {
    const b = browser();
    b.submit();
    if (invalidJson) b.requests[0].resolve({ ok: true, json: async () => { throw Error('Invalid JSON'); } });
    else b.requests[0].reject(Error('Offline'));
    await settle();
    assert.equal(b.leads().length, 0);
    assert.equal(b.form.resets, 0);
    assert.equal(b.button.disabled, false);
    assert.match(b.status.textContent, /Brak połączenia/);
  }
});

test('form delivery remains available without analytics consent and sends no analytics', async () => {
  const b = browser({ consent: 'denied' });
  b.clickPhone();
  b.submit(); b.requests[0].resolve(response(true, true));
  await settle();
  assert.equal(b.form.resets, 1);
  assert.equal(b.scripts.length, 0);
  assert.equal(b.contacts().length, 0);
  assert.equal(b.leads().length, 0);
});
