/* Tales & Blooms: the header and footer shared by the whole site.
   The home page (js/app.js) and every bouquet page (blooms/js/site.js) call these, so the menu and footer are edited here, once.
     TB.header({ base, active, account, cta })   cta: {href,label,external} or false. base: '' on the home page, '../' inside blooms/
     TB.footer({ base })
   Pages and parts of the site: "#/invitations", "#/letters", "#/how" (on the invitations page), "#/packages" and "#/faq" (on the home page); js/app.js handles them.
   Shop details (WhatsApp number, Instagram) come from blooms/shop-data.js when the page has loaded it. */
(function () {
  'use strict';
  const S = () => window.BLOOMS || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* a WhatsApp chat link. Not wa.me: its redirect turns emoji into "�" (same reason as js/core.js) */
  const waLink = text => {
    const p = String(S().whatsapp || '').replace(/[^\d]/g, '');
    return 'https://api.whatsapp.com/send?' + (p ? 'phone=' + p + '&' : '') + 'text=' + encodeURIComponent(text || S().whatsappHello || 'Hello Tales & Blooms!');
  };
  const igLink = () => 'https://www.instagram.com/' + encodeURIComponent(S().instagram || 'blooms_by_bincy') + '/';

  const ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  /* the wordmark: words, not a picture, so it stays sharp and loads instantly */
  const wordmark = href => '<a class="tb-logo" href="' + esc(href) + '" aria-label="Tales and Blooms, home"><span>Tales</span><i>&amp;</i><span>Blooms</span></a>';

  function header(o) {
    o = o || {}; const base = o.base || '';
    const home = base || './';
    const link = (key, href, label) => '<a href="' + esc(href) + '"' + (o.active === key ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
    const acct = o.account === false ? '' : '<a class="tb-acct" href="' + esc(base + '#/account') + '">' + esc((o.account && o.account.label) || 'Sign in') + '</a>';
    const cta = o.cta === false ? null : (o.cta || { href: base + '#/invitations', label: 'Create an invitation' }); // false: no button (the bouquet pages have their own)
    const h = document.createElement('header');
    h.className = 'tb-header';
    h.innerHTML =
      '<div class="tb-in">' + wordmark(home) +
        '<button class="tb-menu-btn" type="button" aria-expanded="false" aria-controls="tb-nav">' + ICON.menu + '<span>Menu</span></button>' +
        '<nav id="tb-nav" class="tb-nav" aria-label="Main">' +
          link('invitations', base + '#/invitations', 'Invitations') +
          link('bouquets', base + 'blooms/', 'Bouquets') +
          link('packages', base + '#/packages', 'Wedding packages') +
          acct +
          (cta ? '<a class="tb-btn" href="' + esc(cta.href) + '"' + (cta.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(cta.label) + '</a>' : '') +
        '</nav>' +
      '</div>';
    const btn = h.querySelector('.tb-menu-btn'), nav = h.querySelector('.tb-nav');
    const setOpen = open => { btn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); }); // close after choosing (same-page links don't reload)
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
    return h;
  }

  function footer(o) {
    o = o || {}; const base = o.base || '';
    const s = S();
    const a = (href, label, ext) => '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>';
    const f = document.createElement('footer');
    f.className = 'tb-footer';
    f.innerHTML =
      '<div class="tb-in tb-foot-grid">' +
        '<div class="tb-foot-brand">' + wordmark(base || './') +
          '<p>Wedding invitations and handmade bouquets, from ' + esc(s.place || 'Adimali, Idukki, Kerala') + '.</p>' +
          '<p class="tb-family"><b>Tales &amp; Tidings</b> digital invitations<br><b>Blooms by Bincy</b> handmade bouquets</p>' +
        '</div>' +
        '<div><h4>Invitations</h4>' + a(base + '#/invitations', 'Wedding invitations') + a(base + '#/letters', 'Birthdays and letters') + a(base + '#/how', 'How it works') + a(base + '#/account', 'Sign in / My dashboard') + '</div>' +
        '<div><h4>Bouquets</h4>' + a(base + 'blooms/', 'Our bouquets') + a(base + 'blooms/how-to-order.html', 'How to order') + a(waLink(), 'Order on WhatsApp', true) + a(igLink(), '@' + (s.instagram || 'blooms_by_bincy'), true) + '</div>' +
        '<div><h4>Help</h4>' + a(base + '#/packages', 'Wedding packages') + a(base + '#/faq', 'FAQ') + a(base + 'blooms/contact.html', 'Contact') + '</div>' +
      '</div>' +
      '<div class="tb-in tb-foot-base"><span>© ' + new Date().getFullYear() + ' Tales &amp; Blooms</span><span>Made with love in Kerala</span></div>';
    return f;
  }

  window.TB = { header, footer, waLink, igLink };
})();
