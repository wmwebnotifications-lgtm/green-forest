/* Basic consent mode: no Google request before explicit analytics consent. */
(function () {
  'use strict';
  var id = 'G-6GWRFWXP2H';
  var key = 'greenforest-analytics-consent-v1';
  var lifetime = 180 * 24 * 60 * 60 * 1000;
  var loaded = false;
  var choice = readChoice();
  var production = location.hostname === 'greenforest-pulawy.pl' && location.protocol === 'https:';
  var internal = false;
  try { internal = localStorage.getItem('greenforest-internal-traffic') === '1'; } catch (_) {}
  var panel = document.getElementById('analytics-consent');
  var status = document.getElementById('analytics-status');
  if (!panel) return;

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved && ['granted', 'denied'].indexOf(saved.value) !== -1 && Number.isFinite(saved.at) && saved.at <= Date.now() && Date.now() - saved.at < lifetime) return saved.value;
    } catch (_) {}
    return null;
  }
  function withoutQuery(value) {
    try { var url = new URL(value); return url.origin + url.pathname; } catch (_) { return ''; }
  }
  function track(name, params) {
    if (choice !== 'granted' || !loaded || internal) return;
    window.gtag('event', name, Object.assign({ page_location: location.origin + location.pathname, page_referrer: withoutQuery(document.referrer) }, params));
  }
  function start() {
    if (loaded || choice !== 'granted' || !production || internal) return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
      cookie_update: false,
      page_location: location.origin + location.pathname,
      page_referrer: withoutQuery(document.referrer)
    });
    track('page_view', {});
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);
  }
  function clearCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', location.hostname, '.' + location.hostname].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax; Secure';
      });
    });
  }
  function show() {
    panel.hidden = false;
    status.textContent = choice === 'granted' ? 'Statystyki są włączone. Możesz cofnąć zgodę.' : 'Statystyki są wyłączone.';
  }
  function save(value) {
    choice = value;
    try { localStorage.setItem(key, JSON.stringify({ value: value, at: Date.now() })); } catch (_) {}
    panel.hidden = true;
    if (choice === 'granted') start();
    else {
      window['ga-disable-' + id] = true;
      clearCookies();
      if (loaded) {
        window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        location.reload();
      }
    }
  }
  document.querySelectorAll('[data-analytics-settings]').forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', function () { show(); panel.querySelector('button').focus(); });
  });
  panel.querySelector('[data-analytics-accept]').addEventListener('click', function () { save('granted'); });
  panel.querySelector('[data-analytics-reject]').addEventListener('click', function () { save('denied'); });
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    var method = href.startsWith('tel:') ? 'phone' : href.startsWith('mailto:') ? 'email' : /^https:\/\/wa\.me\//.test(href) ? 'whatsapp' : null;
    if (method) track('contact_click', { contact_method: method });
  });
  document.addEventListener('greenforest:lead-sent', function () { track('generate_lead', { contact_method: 'form' }); });
  window.addEventListener('storage', function (event) {
    if (event.key === key && readChoice() !== choice) location.reload();
  });
  if (!choice) { clearCookies(); show(); }
  else if (choice === 'granted') start();
  else clearCookies();
})();
