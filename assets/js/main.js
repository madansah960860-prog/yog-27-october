/* Thistledown Kitchen — the only JavaScript on this site.
   Four jobs: the mobile menu, the consent banner, the FAQ accordions, and the
   print button. No tracking, no third-party code, no network requests.
   Everything degrades: with JS off the menu is visible, the FAQ answers are open,
   and the print button is hidden because it is created here. */
(function () {
  'use strict';

  var STORE = 'tk-consent';

  /* ---------------------------------------------------------------- menu */
  function menu() {
    var btn = document.querySelector('[data-menu-toggle]');
    var nav = document.getElementById('site-nav');
    if (!btn || !nav) { return; }

    function narrow() { return window.matchMedia('(max-width: 767px)').matches; }

    function sync() {
      if (narrow()) {
        var open = btn.getAttribute('aria-expanded') === 'true';
        nav.hidden = !open;
      } else {
        nav.hidden = false;
        btn.setAttribute('aria-expanded', 'false');
      }
    }

    btn.setAttribute('aria-expanded', 'false');
    sync();

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      nav.hidden = open;
    });

    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && narrow()) {
        btn.setAttribute('aria-expanded', 'false');
        nav.hidden = true;
        btn.focus();
      }
    });

    window.addEventListener('resize', sync);
  }

  /* ------------------------------------------------------------- consent */
  function readChoice() {
    try { return JSON.parse(localStorage.getItem(STORE) || 'null'); }
    catch (e) { return null; }
  }

  function saveChoice(value, source) {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        ads: value, at: new Date().toISOString(), via: source
      }));
    } catch (e) { /* private mode: the banner simply reappears next visit */ }
  }

  function gpcOn() {
    return navigator.globalPrivacyControl === true;
  }

  function applyChoice(value) {
    /* When a Google tag is switched on in SETUP.md, this is where consent is
       forwarded to it. Until then there is nothing to forward, because no
       advertising or analytics script is loaded on this site. */
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: value ? 'granted' : 'denied',
        ad_user_data: value ? 'granted' : 'denied',
        ad_personalization: value ? 'granted' : 'denied',
        analytics_storage: value ? 'granted' : 'denied'
      });
    }
    document.documentElement.setAttribute('data-ads-consent', value ? 'granted' : 'denied');
  }

  function consent() {
    var bar = document.getElementById('consent');
    if (!bar) { return; }

    /* A Global Privacy Control signal is a legally valid opt-out in the states
       that recognise it, so it is honoured without asking and the banner is not
       shown at all. */
    if (gpcOn()) {
      saveChoice(false, 'gpc');
      applyChoice(false);
      document.documentElement.setAttribute('data-gpc', 'detected');
      return;
    }

    var stored = readChoice();
    if (stored && typeof stored.ads === 'boolean') {
      applyChoice(stored.ads);
      return;
    }

    bar.hidden = false;

    bar.addEventListener('click', function (e) {
      var action = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (action !== 'accept' && action !== 'reject') { return; }
      var value = action === 'accept';
      saveChoice(value, 'banner');
      applyChoice(value);
      bar.hidden = true;
    });
  }

  /* ----------------------------------------------------------- accordions */
  function faq() {
    var items = document.querySelectorAll('.faq__item');
    Array.prototype.forEach.call(items, function (item, i) {
      var q = item.querySelector('.faq__q');
      var a = item.querySelector('.faq__a');
      if (!q || !a) { return; }
      if (!a.id) { a.id = 'faq-a-' + (i + 1); }
      q.setAttribute('aria-expanded', 'false');
      q.setAttribute('aria-controls', a.id);
      a.hidden = true;
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', String(!open));
        a.hidden = open;
      });
    });
  }

  /* ---------------------------------------------------------------- print */
  function printButton() {
    var hosts = document.querySelectorAll('[data-print-host]');
    Array.prototype.forEach.call(hosts, function (host) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--ghost';
      b.textContent = host.getAttribute('data-print-label') || 'Print Recipe';
      b.addEventListener('click', function () { window.print(); });
      host.appendChild(b);
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () { menu(); consent(); faq(); printButton(); });
}());
