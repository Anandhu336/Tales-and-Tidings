/* Blooms by Bincy: what every page in blooms/ shares.
   - the Tales & Blooms header and footer (from ../assets/tb/chrome.js, the same ones as the home page),
   - a Blooms by Bincy sub-menu under the header (NAV below),
   - the floating WhatsApp button, and WhatsApp/Instagram links.
   Each page has <header id="bb-header"></header> and <footer id="bb-footer"></footer>; this file swaps them for the real ones.
   Shop details come from blooms/shop-data.js. */
(function () {
  'use strict';
  const S = window.BLOOMS || {};
  const TB = window.TB;
  const ASSETS = '../assets/blooms/';

  // The Blooms by Bincy sub-menu (the flower and name on its left go to index.html). These pages arrive in Phase 2.
  const NAV = [
    ['bouquets.html', 'Bouquets'],
    ['how-to-order.html', 'How to order'],
    ['about.html', 'About Bincy'],
    ['faq.html', 'FAQ'],
    ['contact.html', 'Contact']
  ];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waLink = text => TB.waLink(text || S.whatsappHello);
  const igLink = TB.igLink;
  window.BloomsSite = { waLink, igLink };

  const ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>'
  };
  window.BloomsSite.ICON = ICON;

  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* signed in to the invitations side in this browser? then the header says "My dashboard" */
  const signedIn = () => { try { const s = JSON.parse(localStorage.getItem('ks.session') || 'null'); return !!(s && s.access_token); } catch (_) { return false; } };

  function header() {
    const ph = document.getElementById('bb-header'); if (!ph) return;
    const h = TB.header({ base: '../', active: 'bouquets', account: { label: signedIn() ? 'My dashboard' : 'Sign in' },
      cta: { href: waLink(), label: 'Order a bouquet', external: true } });
    const sub = document.createElement('nav');
    sub.className = 'bb-sub'; sub.setAttribute('aria-label', 'Blooms by Bincy');
    sub.innerHTML = '<div class="bb-sub-in">' +
      '<a class="bb-sub-brand" href="index.html"><img src="' + ASSETS + 'icons/blooms-flower.svg" alt="" width="22" height="22">Blooms by Bincy</a>' +
      '<div class="bb-sub-links">' + NAV.map(([href, label]) => '<a href="' + href + '"' + (href === here ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>').join('') + '</div>' +
      '</div>';
    ph.replaceWith(h, sub);
  }

  function footer() {
    const ph = document.getElementById('bb-footer'); if (!ph) return;
    ph.replaceWith(TB.footer({ base: '../' }));
  }

  /* floating WhatsApp button, bottom right, on every bouquet page */
  function floatingWa() {
    if (document.querySelector('.bb-wa-float')) return;
    const a = document.createElement('a');
    a.className = 'bb-wa-float'; a.target = '_blank'; a.rel = 'noopener';
    a.href = waLink(document.body.dataset.wa || '');
    a.setAttribute('aria-label', 'Chat with us on WhatsApp');
    a.innerHTML = ICON.wa + '<span>WhatsApp</span>';
    document.body.append(a);
  }

  /* any link with data-wa="message" opens WhatsApp with that message; data-wa="" uses the default hello */
  function wireWaLinks() {
    document.querySelectorAll('a[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
    document.querySelectorAll('a[data-ig]').forEach(a => { a.href = igLink(); a.target = '_blank'; a.rel = 'noopener'; });
  }

  header(); footer(); floatingWa(); wireWaLinks();
})();
