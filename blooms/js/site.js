/* Blooms by Bincy: what every page in blooms/ shares.
   - the Tales & Blooms header (from ../assets/tb/chrome.js, the same one as the home page),
   - the Blooms by Bincy menu under it (logo, NAV below, "Order a bouquet"), which stays at the top while scrolling,
   - the Blooms by Bincy footer, the floating WhatsApp button, and WhatsApp/Instagram links,
   - orderLink(): where "View & personalise" goes (one place to change when the order pages arrive).
   Each page has <header id="bb-header"></header> and <footer id="bb-footer"></footer>; this file swaps them for the real ones.
   Shop details come from blooms/shop-data.js. */
(function () {
  'use strict';
  const S = window.BLOOMS || {};
  const TB = window.TB;
  const ASSETS = '../assets/blooms/';
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const home = here === 'index.html' ? '' : 'index.html'; // on the bouquet home, menu links just scroll

  // The Blooms by Bincy menu
  const NAV = [
    [home + '#shop', 'Shop'],
    [home + '#how', 'How to order'],
    [home + '#story', 'Our story'],
    ['../#/faq', 'FAQ']
  ];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waLink = text => TB.waLink(text || S.whatsappHello);
  const igLink = TB.igLink;
  const rupees = n => '₹' + Number(n).toLocaleString('en-IN');

  /* "View & personalise". The order pages (choose size, colours, date, deposit) are not built yet,
     so for now this opens WhatsApp with the bouquet already named. Later: return 'order.html?b=' + p.id */
  const orderLink = p => waLink('Hello Blooms by Bincy! I would like to personalise No. ' + String(p.no).padStart(2, '0') + ', ' + p.name +
    ' (from ' + rupees(p.price) + (p.per ? ' ' + p.per : '') + '). Our wedding date is: ');

  window.BloomsSite = { waLink, igLink, rupees, orderLink, esc, ASSETS };

  /* signed in to the invitations side in this browser? then the header says "My dashboard" */
  const signedIn = () => { try { const s = JSON.parse(localStorage.getItem('ks.session') || 'null'); return !!(s && s.access_token); } catch (_) { return false; } };

  function header() {
    const ph = document.getElementById('bb-header'); if (!ph) return;
    const h = TB.header({ base: '../', active: 'bouquets', account: { label: signedIn() ? 'My dashboard' : 'Sign in' }, cta: false });
    const sub = document.createElement('div');
    sub.className = 'bb-sub';
    sub.innerHTML = '<div class="bb-wrap bb-sub-in">' +
      '<a class="bb-sub-logo" href="' + (home || '#main') + '" aria-label="Blooms by Bincy home"><img src="' + ASSETS + 'logo/logo.svg" alt="Blooms by Bincy" width="104" height="54"></a>' +
      '<nav aria-label="Blooms by Bincy">' + NAV.map(([href, label]) => '<a href="' + href + '">' + esc(label) + '</a>').join('') +
        '<a class="bb-btn bb-btn-solid" href="' + home + '#shop">Order a bouquet</a></nav>' +
      '</div>';
    ph.replaceWith(h, sub);
  }

  function footer() {
    const ph = document.getElementById('bb-footer'); if (!ph) return;
    const a = (href, label, ext) => '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>';
    const shop = (cat, label) => a(home + '?cat=' + cat + '#shop', label);
    const f = document.createElement('footer');
    f.className = 'bb-footer';
    f.innerHTML = '<div class="bb-wrap bb-foot-grid">' +
      '<div class="bb-foot-brand"><img src="' + ASSETS + 'logo/logo-on-dark.svg" alt="Blooms by Bincy" width="123" height="64" loading="lazy">' +
        '<p>Handmade wedding bouquets for Kerala Christian weddings. ' + esc((S.place || 'Adimali, Idukki').replace(/, Kerala$/, '')) + '.</p></div>' +
      '<div><h4>Shop</h4>' + shop('bridal', 'Bridal bouquets') + shop('cascade', 'Cascade bouquets') + shop('bridesmaids', 'Bridesmaids') + shop('flower-girls', 'Flower girls') + shop('baptism', 'Baptism sets') + '</div>' +
      '<div><h4>Help</h4>' + a(home + '#how', 'How to order') + a('../#/faq', 'Delivery areas') + a('../#/faq', 'FAQ') + a(waLink(), 'Contact', true) + '</div>' +
      '<div><h4>Tales &amp; Blooms</h4>' + a('../#/invitations', 'Wedding invitations') + a('../#/packages', 'Wedding packages') + a(igLink(), 'Instagram', true) + '</div>' +
      '<p class="bb-legal">© Blooms by Bincy · Part of Tales &amp; Blooms</p>' +
      '</div>';
    ph.replaceWith(f);
  }

  /* floating WhatsApp button, bottom right, on every bouquet page */
  function floatingWa() {
    if (document.querySelector('.bb-wa')) return;
    const a = document.createElement('a');
    a.className = 'bb-wa'; a.target = '_blank'; a.rel = 'noopener';
    a.href = waLink(document.body.dataset.wa || '');
    a.textContent = 'WhatsApp us';
    document.body.append(a);
  }

  /* any link with data-wa="message" opens WhatsApp with that message; data-wa="" uses the default hello */
  function wireWaLinks() {
    document.querySelectorAll('a[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
    document.querySelectorAll('a[data-ig]').forEach(a => { a.href = igLink(); a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* each section below the top drifts up softly the first time it scrolls into view.
     Only with IntersectionObserver and without "reduce motion", so the page never stays hidden. */
  function reveal() {
    if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const els = document.querySelectorAll('main > section:not(.bb-hero) > .bb-wrap');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { el.classList.add('bb-reveal'); io.observe(el); });
  }

  header(); footer(); floatingWa(); wireWaLinks(); reveal();
})();
