/* Tales & Tidings app: decides what to show.
     ?p=ID         -> a published page (what visitors see)
     ?preview=1    -> the live preview inside the builder
     otherwise     -> the builder (home, editor, publish)                                           */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el, $ = u.$, B = KS.backend;
  const IDS = ['garden', 'quest', 'ask-date', 'ask-sorry', 'birthday', 'wedding', 'wedding-hindu', 'wedding-muslim', 'wedding-christian', 'wedding-modern', 'celestial'];
  const stage = () => $('#stage'), app = () => $('#app');
  let current = null; // the template currently on screen

  function unmount() {
    if (current) { try { current.ctl && current.ctl.destroy(); } catch (_) {} current.music.destroy(); current = null; }
    stage().textContent = ''; stage().className = ''; stage().style.cssText = '';
  }
  async function mountPage(page, opts) {
    const T = await KS.loadTemplate(page.t);
    unmount();
    const music = KS.createMusic(opts.preview ? null : page.m);
    const ctx = { preview: !!opts.preview, music, start: () => music.start() };
    const data = page.d || {};
    document.title = (T.title ? T.title(data) : '') || 'Tales & Tidings';
    current = { music, ctl: T.mount(stage(), data, ctx) };
    if (!opts.preview) music.autoplay();
  }

  /* ---------------- visitor view ---------------- */
  async function viewer(id) {
    stage().append(el('div', { class: 'center' }, 'Opening…'));
    let page = null;
    try {
      if (!B.configured()) throw new Error('setup');
      page = await B.getPage(id);
    } catch (e) {
      stage().textContent = '';
      return stage().append(el('div', { class: 'center' }, e.message === 'setup' ? 'This site is not connected to its database yet.' : 'We could not open this page. Please check your connection and try again.'));
    }
    if (!page || !page.t) { stage().textContent = ''; return stage().append(el('div', { class: 'center' }, 'This page could not be found. The link may be wrong or the page may have been removed.')); }
    try { await mountPage(page, { preview: false }); } catch (e) { stage().textContent = ''; stage().append(el('div', { class: 'center' }, 'Sorry, this page could not be shown.')); }
  }

  /* ---------------- live preview (inside the builder) ---------------- */
  function previewMode() {
    let last = null; // the latest render message: data, and which builder tools are on
    addEventListener('message', async e => {
      const m = e.data; if (e.source !== parent || !m) return;
      if (m.type === 'ks-show') return showPage(m.page);
      if (m.type !== 'ks-render') return;
      const y = scrollY;
      finishEdit(true);
      try { await mountPage({ t: m.t, d: m.d, m: m.m }, { preview: !m.live }); if (!m.live) scrollTo(0, y); } catch (_) {}
      last = m.live ? null : m;
      markTools();
    });
    parent.postMessage({ type: 'ks-ready' }, '*');

    /* builder tools inside the preview: tap a page to find its settings, tap words to type new ones */
    document.head.append(el('style', {}, `
      .ks-jump [data-ks-page],.ks-jump [data-ks-say]{cursor:pointer}
      .ks-jump [data-ks-page]:hover{outline:2px dashed rgba(180,71,95,.45);outline-offset:-4px;border-radius:14px}
      .ks-tap [data-ks-edit]{cursor:text;border-radius:6px;transition:box-shadow .15s}
      .ks-tap [data-ks-edit]:hover{box-shadow:0 0 0 2px rgba(180,71,95,.6)}
      [data-ks-edit].ks-hide{visibility:hidden}
      .ks-flash{animation:ksflash 1.4s ease}
      @keyframes ksflash{30%{box-shadow:inset 0 0 0 4px rgba(180,71,95,.55)}}
      .ks-inbox{position:absolute;z-index:9999;box-sizing:border-box;margin:0;border:0;outline:2px solid #b4475f;outline-offset:2px;border-radius:8px;background:rgba(255,255,255,.96);
        resize:none;overflow:hidden;padding:2px 4px;box-shadow:0 10px 30px rgba(0,0,0,.2);min-width:140px}
      .ks-inbox::placeholder{color:#999}`));
    const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
    const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
    function markTools() {
      const root = stage(), t = last && last.tools;
      root.classList.toggle('ks-jump', !!(t && t.jump)); root.classList.toggle('ks-tap', !!(t && (t.inline || t.jump)));
      if (!t || !(t.inline || t.jump)) return;
      // what the guide says, on each page
      root.querySelectorAll('.k-bub>span').forEach(sp => { const h = sp.closest('[data-ks-say],[data-ks-page]'); if (h) sp.dataset.ksEdit = 'say:' + (h.dataset.ksSay || h.dataset.ksPage); });
      // designs without marks: find words on the page that match a text box in the form
      if (![...root.querySelectorAll('[data-ks-edit]')].some(n => !n.closest('.k-bub'))) {
        const leaves = [...root.querySelectorAll('h1,h2,h3,h4,h5,p,span,b,strong,em,i,small,blockquote,figcaption,li,div,a,button,time,label,td')]
          .filter(n => n.childElementCount === [...n.children].filter(c => c.tagName === 'BR').length && norm(n.textContent));
        (t.fields || []).forEach(([path, v]) => {
          const want = norm(v); if (want.length < 2) return;
          leaves.forEach(n => { if (!n.dataset.ksEdit && norm(n.textContent) === want) { n.dataset.ksEdit = path; if (/\n/.test(v)) n.dataset.ksMulti = ''; } });
        });
      }
    }
    function showPage(id) {
      const n = stage().querySelector('[data-ks-page="' + CSS.escape(id) + '"]'); if (!n) return;
      n.scrollIntoView({ behavior: u.RM ? 'auto' : 'smooth', block: 'start' });
      n.classList.remove('ks-flash'); void n.offsetWidth; n.classList.add('ks-flash');
    }

    let cur = null; // { node, box, path }
    function startEdit(n) {
      finishEdit();
      const path = n.dataset.ksEdit, multi = n.hasAttribute('data-ks-multi');
      const raw = path.startsWith('say:') ? ((last.tools.say || {})[path.slice(4)] || '') : get(last.d, path);
      const r = n.getBoundingClientRect(), cs = getComputedStyle(n);
      const box = el('textarea', { class: 'ks-inbox', rows: 1, 'aria-label': 'Type here', placeholder: norm(n.innerText) || 'Type here' });
      box.value = typeof raw === 'string' ? raw : '';
      ['font', 'letterSpacing', 'textAlign', 'textTransform', 'color', 'lineHeight', 'wordSpacing'].forEach(k => { box.style[k] = cs[k]; });
      if (/rgba?\(255, 255, 255/.test(cs.color)) box.style.color = '#2b2320'; // white words would vanish on the white box
      const w = Math.max(r.width, 160);
      Object.assign(box.style, { left: Math.max(4, r.left + scrollX - (w - r.width) / 2) + 'px', top: r.top + scrollY + 'px', width: Math.min(w, innerWidth - 8) + 'px' });
      document.body.append(box);
      const grow = () => { box.style.height = 'auto'; box.style.height = Math.max(r.height, box.scrollHeight) + 'px'; };
      grow(); n.classList.add('ks-hide');
      cur = { node: n, box, path, multi };
      box.addEventListener('input', () => { if (!multi && /\n/.test(box.value)) box.value = box.value.replace(/\n+/g, ' '); grow(); parent.postMessage({ type: 'ks-edit', path, value: box.value }, '*'); });
      box.addEventListener('keydown', e => { if (e.key === 'Escape' || (e.key === 'Enter' && !multi)) { e.preventDefault(); finishEdit(); } });
      box.addEventListener('blur', () => finishEdit());
      box.focus(); box.setSelectionRange(box.value.length, box.value.length);
      parent.postMessage({ type: 'ks-edit-start', path }, '*');
    }
    function finishEdit(quiet) {
      if (!cur) return; const c = cur; cur = null;
      c.box.remove(); c.node.classList.remove('ks-hide');
      if (!quiet) parent.postMessage({ type: 'ks-edit-done', path: c.path }, '*');
    }
    stage().addEventListener('click', e => {
      const t = last && last.tools; if (!t) return;
      const w = (t.inline || t.jump) && e.target.closest('[data-ks-edit]');
      if (w) {
        e.preventDefault(); e.stopPropagation();
        if (t.inline) startEdit(w); else parent.postMessage({ type: 'ks-pick', path: w.dataset.ksEdit }, '*');
        return;
      }
      const pg = t.jump && e.target.closest('[data-ks-page],[data-ks-say]');
      if (pg) parent.postMessage({ type: 'ks-pick', page: pg.dataset.ksPage || pg.dataset.ksSay }, '*');
    }, true);
  }

  /* ---------------- builder ---------------- */
  const stripBlobs = v => JSON.parse(JSON.stringify(v, (k, x) => (u.isBlobUrl(x) ? '' : x)));
  const hasBlobs = v => JSON.stringify(v).includes('"blob:');
  let teardown = null;

  async function loadAll() { await Promise.all(IDS.map(id => KS.loadTemplate(id))); }

  function brand() {
    return el('div', { class: 'brand', html: '<svg viewBox="0 0 28 24" fill="none" stroke="#7b2d5b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="15" rx="2"/><path d="M2.6 7L12 14L21.4 7"/><path d="M12 19.2s-2.6-1.6-2.6-3.3c0-.9.7-1.5 1.4-1.5.5 0 .9.3 1.2.7.3-.4.7-.7 1.2-.7.7 0 1.4.6 1.4 1.5 0 1.7-2.6 3.3-2.6 3.3z" fill="#7b2d5b" stroke="none"/><path d="M24 1.5V5.5M22 3.5H26" stroke="#d9a441"/></svg>' }, el('span', { html: 'Tales <em>&amp;</em> Tidings' }));
  }

  /* ---------------- Tales & Blooms: the whole site's front door ----------------
     The home page now introduces both parts: Tales & Tidings (these invitations) and Blooms by Bincy (the bouquet shop in blooms/).
     The shared header and footer come from assets/tb/chrome.js; the bouquet pages use the same ones. */
  const BLOOMS_URL = 'blooms/';
  const TB = () => window.TB;
  const waHref = text => TB() ? TB().waLink(text) : u.waLink('', text);
  /* "#/designs", "#/packages"... from the header and footer: parts of the home page */
  const SECTIONS = { packages: '#lp-packages', faq: '#lp-faq', bouquets: '#lp-blooms' };

  const tbHero = thumbId => el('section', { class: 'tb-hero' }, el('div', { class: 'lp-in' },
    el('p', { class: 'tb-eyebrow' }, 'Tales & Blooms · Adimali, Kerala'),
    el('h1', { html: 'Everything for your <em>wedding day</em>' }),
    el('p', { class: 'tb-lead' }, 'Digital invitations your guests open with one tap, and handmade bouquets made for your dress and your colours.'),
    el('div', { class: 'tb-choices' },
      el('a', { class: 'tb-choice', href: '#/invitations' },
        el('div', { class: 'tb-pic thumb', html: (KS.templates[thumbId] || {}).thumb || '' }),
        el('div', { class: 'tb-txt' }, el('small', {}, 'Tales & Tidings'), el('h2', {}, 'Digital invitations'),
          el('p', {}, 'Wedding invites, birthdays and letters with photos, maps and music. Free to create and preview.'),
          el('span', { class: 'tb-go' }, 'Create yours →'))),
      el('a', { class: 'tb-choice bq', href: BLOOMS_URL },
        el('div', { class: 'tb-pic' }, el('img', { src: 'assets/blooms/photos/cascade-hero-540.jpg', alt: 'A handmade cascade bouquet', width: '540', height: '675' })),
        el('div', { class: 'tb-txt' }, el('small', {}, 'Blooms by Bincy'), el('h2', {}, 'Handmade bouquets'),
          el('p', {}, 'Bridal, cascade and round bouquets for Kerala Christian weddings, made to order in Adimali, Idukki.'),
          el('span', { class: 'tb-go' }, 'See the bouquets →')))),
    el('a', { class: 'tb-pack-link', href: '#/packages' }, el('b', {}, 'Planning both?'), ' Ask about a wedding package →')));

  const packagesSection = () => el('section', { class: 'tb-pack', id: 'lp-packages' }, el('div', { class: 'lp-in' },
    el('div', { class: 'tb-pack-card' },
      el('p', { class: 'tb-eyebrow' }, 'Wedding packages'),
      el('h2', {}, 'Your invitation and your flowers, planned together'),
      el('p', {}, 'One conversation for both: we match the bouquets to your invitation’s colours and save your date for the flowers.'),
      el('ul', {}, ['A digital wedding invitation, set up with you', 'The bride’s bouquet in your colours', 'Bridesmaid bouquets and flower girl baskets', 'Groom’s buttonhole to match'].map(t => el('li', {}, t))),
      el('div', { class: 'tb-pack-cta' },
        el('a', { class: 'tb-pack-btn', href: waHref('Hello Tales & Blooms! I would like to ask about a wedding package (invitation + bouquets). Our wedding date is: '), target: '_blank', rel: 'noopener' }, 'Ask about a package on WhatsApp'),
        el('a', { class: 'tb-pack-more', href: '#/invitations' }, 'Or start with the invitation')))));

  /* little bouquet-style icons in the Blooms by Bincy look (like its Instagram highlight covers): mist shapes on dusty blue */
  const MIST = '#F2F5F8', DUSTY = '#5B7895';
  const flower = (cx, cy, r, petal, centre) => [0, 1, 2, 3, 4, 5].map(k => { const a = k * Math.PI / 3;
    return `<circle cx="${(cx + Math.cos(a) * r * .56).toFixed(1)}" cy="${(cy + Math.sin(a) * r * .56).toFixed(1)}" r="${(r * .44).toFixed(1)}" fill="${petal}"/>`; }).join('') +
    `<circle cx="${cx}" cy="${cy}" r="${(r * .3).toFixed(1)}" fill="${centre}"/>`;
  const svg64 = inner => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
  const BOUQUET_STYLES = [
    ['Bridal', 'For the bride', svg64(flower(32, 32, 22, MIST, DUSTY))],
    ['Cascade', 'Flowing and graceful', svg64(`<path d="M32 6C24 17 14 29 14 40a18 18 0 0 0 36 0C50 29 40 17 32 6Z" fill="${MIST}"/>` + flower(32, 40, 11, DUSTY, MIST))],
    ['Round', 'Soft and timeless', svg64(flower(23, 26, 12, MIST, DUSTY) + flower(41, 26, 12, MIST, DUSTY) + flower(32, 42, 12, MIST, DUSTY))],
    ['Bridesmaids', 'Matched to the bride’s', svg64(flower(22, 36, 13, MIST, DUSTY) + flower(44, 28, 9, MIST, DUSTY))],
    ['Flower girl', 'Little baskets', svg64(`<path d="M20 33a12 13 0 0 1 24 0" fill="none" stroke="${MIST}" stroke-width="3.5" stroke-linecap="round"/><path d="M13 33h38l-4.5 17a4 4 0 0 1-3.9 3H21.4a4 4 0 0 1-3.9-3Z" fill="${MIST}"/>` + flower(32, 42, 8, DUSTY, MIST))],
    ['Baptism', 'For a baby’s day', svg64(`<path d="M32 10v30M22 20h20" stroke="${MIST}" stroke-width="4" stroke-linecap="round"/>` + flower(40, 46, 10, MIST, DUSTY))]
  ];
  const bloomsSection = () => el('section', { class: 'lp-blooms', id: 'lp-blooms' }, el('div', { class: 'lp-in' },
    el('div', { class: 'lpb-copy' },
      el('img', { class: 'lpb-logo', src: 'assets/blooms/logo/logo.svg', alt: 'Blooms by Bincy', width: '180', height: '94', loading: 'lazy' }),
      el('h2', {}, 'Bouquets for your big day'),
      el('p', {}, 'Handmade bouquets for Kerala Christian weddings, made to order in Adimali, Idukki, in the colours of your day.'),
      el('div', { class: 'lpb-cta' }, el('a', { class: 'lpb-btn', href: BLOOMS_URL }, 'See the bouquets'),
        el('a', { class: 'lpb-link', href: BLOOMS_URL + 'how-to-order.html' }, 'How to order'))),
    el('ul', { class: 'lpb-styles', 'aria-label': 'Bouquet styles' }, BOUQUET_STYLES.map(([name, note, icon]) =>
      el('li', {}, el('a', { href: BLOOMS_URL }, el('span', { class: 'lpb-ic', html: icon }), el('b', {}, name), el('small', {}, note)))))));

  /* ---------------- the swipeable panel on the home page: invitations first, then Blooms by Bincy ----------------
     Swipe on a phone, or use the arrows and labelled tabs. It moves on by itself (a line fills in the tab)
     until someone touches it, and waits while it is off screen or under the mouse. */
  const BLUSH = '#E9B9C4', SKY = '#DCE6EF', LEAF = '#9BB08C', LEAF_D = '#7E9670', WHITE = '#fff';
  const petals = (cx, cy, r, fill, off) => [0, 1, 2, 3, 4, 5].map(k => { const a = k * Math.PI / 3 + off;
    return `<circle cx="${(cx + Math.cos(a) * r * .56).toFixed(1)}" cy="${(cy + Math.sin(a) * r * .56).toFixed(1)}" r="${(r * .44).toFixed(1)}" fill="${fill}"/>`; }).join('');
  /* one flower (two rings of petals) that blooms in after d seconds; leaves grow out the same way */
  const bloom = (cx, cy, r, petal, inner, centre, d) => `<g class="fl" style="--d:${d}s">${petals(cx, cy, r, petal, 0)}${petals(cx, cy, r * .62, inner, Math.PI / 6)}<circle cx="${cx}" cy="${cy}" r="${(r * .2).toFixed(1)}" fill="${centre}"/></g>`;
  const leaves = (cx, cy, rad, angles, d, size) => angles.map((a, i) => { const t = a * Math.PI / 180, x = (cx + Math.cos(t) * rad).toFixed(1), y = (cy + Math.sin(t) * rad).toFixed(1);
    return `<g class="lf" style="--d:${(d + i * .04).toFixed(2)}s"><ellipse cx="${x}" cy="${y}" rx="${size * .32}" ry="${size}" fill="${i % 2 ? LEAF_D : LEAF}" transform="rotate(${a + 90} ${x} ${y})"/></g>`; }).join('');
  const bow = (x, y) => `<path d="M${x} ${y}c-30-22-46-6-34 8 8 9 22 2 34-8zm0 0c30-22 46-6 34 8-8 9-22 2-34-8z" fill="${BLUSH}"/><path d="M${x} ${y + 2}l-22 70M${x} ${y + 2}l20 72" stroke="${BLUSH}" stroke-width="6" stroke-linecap="round"/>`;
  const artSvg = inner => `<svg viewBox="0 0 360 420" aria-hidden="true"><g class="bq-sway">${inner}</g></svg>`;
  /* the bride's bouquet: a full round of white, blush and sky flowers on a ribbon-wrapped handle */
  const bridalArt = () => artSvg(
    leaves(180, 165, 112, [-165, -138, -112, -86, -60, -34, -8, 172, 198, 18], 0, 36) +
    `<path d="M163 240L170 395Q180 405 190 395L197 240Z" fill="${SKY}" stroke="${DUSTY}" stroke-opacity=".3" stroke-width="2"/><path d="M166 318h28M167 340h26M168 362h24" stroke="${BLUSH}" stroke-width="6" opacity=".7"/>` + bow(180, 292) +
    bloom(180, 92, 30, MIST, WHITE, DUSTY, .15) + bloom(110, 132, 34, WHITE, MIST, BLUSH, .25) + bloom(250, 132, 34, WHITE, MIST, BLUSH, .3) +
    bloom(94, 202, 27, SKY, WHITE, DUSTY, .4) + bloom(266, 202, 27, SKY, WHITE, DUSTY, .45) +
    bloom(138, 236, 30, BLUSH, '#F6DDE3', WHITE, .5) + bloom(222, 236, 30, BLUSH, '#F6DDE3', WHITE, .55) +
    bloom(180, 170, 50, WHITE, '#F7F3EE', DUSTY, .65) + bloom(136, 106, 20, BLUSH, WHITE, DUSTY, .75) + bloom(224, 106, 20, BLUSH, WHITE, DUSTY, .8) +
    [[72, 160], [288, 160], [128, 66], [232, 66], [180, 238], [60, 232], [300, 232]].map(([x, y], i) => `<g class="fl" style="--d:${(.9 + i * .06).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="5" fill="${WHITE}"/><circle cx="${x}" cy="${y}" r="1.8" fill="${DUSTY}"/></g>`).join(''));
  /* the rest of the bridal party: two bridesmaid posies, a flower girl basket and the groom's buttonhole */
  const posy = (x, y, d) => `<path d="M${x - 7} ${y + 30}L${x - 4} ${y + 118}Q${x} ${y + 124} ${x + 4} ${y + 118}L${x + 7} ${y + 30}Z" fill="${SKY}" stroke="${DUSTY}" stroke-opacity=".3" stroke-width="2"/><path d="M${x - 6} ${y + 70}h12M${x - 5} ${y + 86}h10" stroke="${BLUSH}" stroke-width="5" opacity=".7"/>` +
    leaves(x, y + 4, 52, [-160, -125, -90, -55, -20, 160, 20], d, 22) +
    bloom(x - 30, y - 4, 20, WHITE, MIST, BLUSH, d + .1) + bloom(x + 30, y - 4, 20, WHITE, MIST, BLUSH, d + .15) + bloom(x, y - 30, 18, SKY, WHITE, DUSTY, d + .2) +
    bloom(x - 16, y + 24, 18, BLUSH, '#F6DDE3', WHITE, d + .25) + bloom(x + 16, y + 24, 18, BLUSH, '#F6DDE3', WHITE, d + .3) + bloom(x, y + 2, 28, WHITE, '#F7F3EE', DUSTY, d + .35);
  const partyArt = () => artSvg(
    posy(78, 150, .1) + posy(282, 150, .25) +
    leaves(180, 82, 26, [-150, -30, 200, -20], .5, 16) + `<path d="M180 96l-4 44" stroke="${LEAF_D}" stroke-width="4" stroke-linecap="round"/>` + bloom(180, 80, 20, WHITE, BLUSH, DUSTY, .6) +
    `<path d="M128 300a52 62 0 0 1 104 0" fill="none" stroke="${DUSTY}" stroke-width="7" stroke-linecap="round"/>` +
    leaves(180, 300, 54, [-175, -150, -30, -5, 190], .7, 20) +
    bloom(144, 294, 22, BLUSH, '#F6DDE3', WHITE, .8) + bloom(216, 294, 22, BLUSH, '#F6DDE3', WHITE, .85) + bloom(180, 284, 26, WHITE, MIST, DUSTY, .9) +
    `<path d="M114 302h132l-15 74a8 8 0 0 1-8 6h-86a8 8 0 0 1-8-6Z" fill="${SKY}"/><path d="M120 322h120M124 342h112M128 362h104" stroke="${DUSTY}" stroke-width="2.5" opacity=".45"/>`);
  const bqArt = (art, chipIcon, chipHtml) => el('div', { class: 'lp-art' }, el('div', { class: 'lp-blob' }), ['a', 'b', 'c', 'd', 'e', 'f'].map(k => el('i', { class: 'lp-spark ' + k }, '✦')),
    [8, 24, 46, 62, 78, 90].map((x, i) => el('i', { class: 'bq-petal', style: `left:${x}%;--d:${-i * 1.6}s;--x:${i % 2 ? -50 : 60}px` + (i % 3 ? '' : ';background:#fff') })),
    el('div', { class: 'bq-art', html: art }),
    el('div', { class: 'lp-chip', html: `<span>${chipIcon}</span>${chipHtml}` }));
  const bqCopy = (eyebrow, title, text, points, second) => el('div', { class: 'lp-copy' },
    el('p', { class: 'tb-eyebrow' }, eyebrow),
    el('h2', { class: 'lp-ttl', html: title }),
    el('p', {}, text),
    el('ul', { class: 'bq-points' }, points.map(t => el('li', {}, t))),
    el('div', { class: 'lp-cta' }, el('a', { class: 'lp-btn', href: BLOOMS_URL }, 'See the bouquets'), second));
  const bloomsSlides = () => [
    { cls: 'bq', label: 'Bouquets', node: el('div', { class: 'lp-in' },
      bqCopy('Blooms by Bincy · Handmade bouquets', 'Every love story deserves to <b>bloom</b>.',
        'Bridal, cascade and round bouquets, handmade in Adimali, Idukki for Kerala Christian weddings.',
        ['Made to order for your date', 'Matched to your dress and colours', 'Delivery across Idukki'],
        el('a', { class: 'lp-link', href: waHref('Hello Blooms by Bincy! I would like to order a wedding bouquet. Our wedding date is: '), target: '_blank', rel: 'noopener' }, 'Order on WhatsApp')),
      bqArt(bridalArt(), BOUQUET_STYLES[0][2], 'Matched to your<br>dress colours')) },
    { cls: 'bq party', label: 'Bridal party', node: el('div', { class: 'lp-in' },
      bqCopy('Blooms by Bincy · For the whole party', 'Flowers for your <b>bridesmaids</b>, flower girls and groom.',
        'Bridesmaid bouquets to match the bride’s, little flower girl baskets and a buttonhole for the groom. Baptism sets too.',
        ['Bridesmaid bouquets', 'Flower girl baskets', 'Bride and groom sets'],
        el('a', { class: 'lp-link', href: BLOOMS_URL + 'how-to-order.html' }, 'How to order')),
      bqArt(partyArt(), BOUQUET_STYLES[4][2], 'Bridesmaids, flower<br>girl and groom')) }
  ];
  const SHOW_MS = [11000, 7000, 7000]; // how long each slide stays: the invitation phone is playing, so it gets longer
  function heroShow(slides) {
    let cur = 0, t = 0, auto = !u.RM, hover = false, seen = true;
    const track = el('div', { class: 'lp-track' }, slides.map((x, i) => el('div', { class: 'lp-slide ' + x.cls + (i ? '' : ' on'), role: 'group', 'aria-roledescription': 'slide', 'aria-label': (i + 1) + ' of ' + slides.length + ': ' + x.label }, x.node)));
    const go = i => track.scrollTo({ left: i * track.clientWidth, behavior: u.RM ? 'auto' : 'smooth' });
    const stop = () => { auto = false; sec.classList.add('still'); };
    const dots = slides.map((x, i) => el('button', { class: 'lp-dot' + (i ? '' : ' on'), type: 'button', 'aria-label': 'Show ' + x.label, onclick: () => { stop(); go(i); } }, el('span', {}, x.label), el('i')));
    const arrow = (d, label, txt) => el('button', { class: 'lp-arr ' + (d < 0 ? 'prev' : 'next'), type: 'button', 'aria-label': label, onclick: () => { stop(); go((cur + d + slides.length) % slides.length); } }, txt);
    const sec = el('section', { class: 'lp-hero lp-show', 'aria-roledescription': 'carousel', 'aria-label': 'Invitations and bouquets' },
      el('div', { class: 'lp-dots' }, dots), track, arrow(-1, 'Previous slide', '‹'), arrow(1, 'Next slide', '›'));
    const set = i => { if (i === cur || !track.children[i]) return; cur = i; t = 0;
      [...track.children].forEach((x, k) => x.classList.toggle('on', k === i)); dots.forEach((x, k) => { x.classList.toggle('on', k === i); x.style.setProperty('--p', 0); }); };
    track.addEventListener('scroll', () => set(Math.round(track.scrollLeft / track.clientWidth)), { passive: true });
    ['pointerdown', 'keydown'].forEach(ev => track.addEventListener(ev, stop, { passive: true }));
    track.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });
    sec.addEventListener('mouseenter', () => { hover = true; }); sec.addEventListener('mouseleave', () => { hover = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(sec);
    if (auto) lpTimers.push(setInterval(() => {
      if (!auto || hover || !seen || document.hidden) return;
      const ms = SHOW_MS[cur] || 7000; t += 100; dots[cur].style.setProperty('--p', Math.min(1, t / ms).toFixed(3));
      if (t >= ms) go((cur + 1) % slides.length);
    }, 100));
    return sec;
  }

  /* ---------------- design cards, shared by the home page and the letters page ---------------- */
  const WEDDING = 'Wedding invitations';
  const designCard = id => { const T = KS.templates[id];
    return el('button', { class: 'tcard', type: 'button', onclick: () => { location.hash = '#/new/' + id; } },
      el('div', { class: 'thumb', html: T.thumb || '' }),
      el('div', { class: 'tinfo' }, el('h3', {}, T.name), el('p', {}, T.tagline), el('small', {}, T.for || ''), el('span', { class: 'go' }, 'Start with this →'))); };
  /* templates name a group; one heading and one grid per group, weddings first */
  function designGroups() {
    const groups = [];
    IDS.forEach(id => { const g = KS.templates[id].group || ''; let x = groups.find(y => y.g === g); if (!x) groups.push(x = { g, ids: [] }); x.ids.push(id); });
    return groups.sort((a, b) => (b.g === WEDDING) - (a.g === WEDDING));
  }
  /* on the home page, instead of the letters and birthdays grid: one card that opens their page */
  const moreDesignsCard = x => el('a', { class: 'lp-more', href: '#/letters' },
    el('div', { class: 'lp-more-thumbs', 'aria-hidden': 'true' }, x.ids.slice(0, 3).map(id => el('div', { class: 'thumb', html: KS.templates[id].thumb || '' }))),
    el('div', { class: 'lp-more-txt' }, el('small', {}, x.ids.length + ' designs'), el('h3', {}, x.g || 'More designs'),
      el('p', {}, 'Love letters, date asks, sorry notes, little quests and birthday pages.'), el('span', { class: 'go' }, 'Browse them →')));
  const tbHeader = active => TB() ? TB().header({ base: '', active,
    account: B.configured() ? { label: B.signedIn() ? 'My dashboard' : 'Sign in' } : false, cta: { href: '#/invitations', label: 'Create an invitation' } }) : null;

  /* ---------------- letters and birthdays: their own page (#/letters) ---------------- */
  function lettersPage() {
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.title = 'Letters and Birthdays | Tales & Blooms'; document.body.className = 'is-app is-lp'; window.scrollTo(0, 0);
    u.font('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');
    const others = designGroups().filter(x => x.g !== WEDDING);
    app().textContent = '';
    app().append(el('div', { class: 'lp' },
      tbHeader('invitations'),
      el('section', { class: 'lp-coll lp-page' }, el('div', { class: 'lp-panel' },
        el('a', { class: 'lp-back', href: '#/' }, '← Home'),
        el('h1', { class: 'lp-h2', html: 'Letters and <b>Birthdays</b>' }),
        el('p', { class: 'lp-page-lead' }, 'Little pages for the people you love: a letter under the stars, a date ask with a runaway “No” button, a sorry note, a love quest or a birthday party. Make one, then share it with one link.'),
        others.map(x => el('section', { class: 'grp' }, others.length > 1 && x.g ? el('h2', {}, x.g) : null, el('div', { class: 'cards' }, x.ids.map(designCard)))),
        el('div', { class: 'lp-cta2' }, el('p', {}, 'Planning a wedding instead?'), el('a', { class: 'lp-btn', href: '#/invitations' }, 'See wedding invitations')))),
      TB() ? TB().footer({ base: '' }) : null));
  }

  /* ---------------- home (landing page) ---------------- */
  const LP_ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.5L11 15.5L16.5 9.5"/></svg>',
    step1: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="6" y="9" width="36" height="30" rx="3"/><path d="M6 17H42M6 34L17 24L26 32L32 27L42 35"/></svg>',
    step2: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="24" r="16"/><path d="M24 8V40M8 24H40M12.7 12.7L35.3 35.3M35.3 12.7L12.7 35.3"/><circle cx="24" cy="24" r="6" fill="currentColor" fill-opacity=".2"/></svg>',
    step3: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M38 26V40H8V10H22"/><path d="M33 6L42 15L24 33H15V24Z"/></svg>',
    step4: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="24" r="5"/><circle cx="36" cy="11" r="5"/><circle cx="36" cy="37" r="5"/><path d="M16.5 21.5L31.5 13.5M16.5 26.5L31.5 34.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21S5 14.5 5 9.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };
  const FAQ = [
    ['Can I customise my digital invitation?', 'Yes. Change the names, dates, events, photos, colours, lettering and music. The preview updates as you type, so you see exactly what your guests will see.'],
    ['How do I share my invitation with guests?', 'When you publish, you get one short link. Send it on WhatsApp, by text or email, or post it on social media. It opens on any phone or computer.'],
    ['Do my guests need to sign up or install anything?', 'No. Guests just tap the link. There is nothing to download and no account to create.'],
    ['Can guests reply or send wishes?', 'Yes. Wedding designs include an RSVP form and a "Send Greetings" button. Replies arrive on your WhatsApp.'],
    ['Can I add music, a video or a live stream?', 'Yes. Pick one of our songs, upload your own or paste a YouTube link. Wedding designs also take a YouTube video and a live-stream link.'],
    ['Can I edit it after publishing?', 'Yes. Create a free account and every page you publish is saved to your dashboard. Sign in from any phone or computer, open a page, change anything and save. The link stays the same.'],
    ['Do you make wedding bouquets too?', 'Yes. Blooms by Bincy, our bouquet studio in Adimali, Idukki, handmakes bridal, cascade and round bouquets, bridesmaid bouquets, flower girl baskets and baptism sets. Each one is made to order in your colours.'],
    ['Can I get my invitation and bouquets together?', 'Yes. Ask about a wedding package: we set up your digital invitation and match the bride’s and bridesmaids’ bouquets to its colours. Message us on WhatsApp with your wedding date.']
  ];

  let heroOn = true, heroVisible = () => {}, lpObs = null, lpTimers = [];
  // the hero headline changes every few seconds; the highlighted words are in <b>
  const HEADLINES = [
    'Celebrate your<br><b>love story</b> in a stunning digital invitation.',
    'Invite your family to your <b>big day</b> with one beautiful link.',
    'Wish them a <b>happy birthday</b> they will never forget.',
    'Write the <b>letter</b> you have always wanted to send.',
    'Share your <b>tales</b>, send your tidings to the people you love.'
  ];
  const QUOTES = [
    ['Whatever our souls are made of, his and mine are the same.', 'Emily Brontë'],
    ['Love does not consist in gazing at each other, but in looking outward together in the same direction.', 'Antoine de Saint-Exupéry'],
    ['Grow old along with me! The best is yet to be.', 'Robert Browning'],
    ['To love and be loved is to feel the sun from both sides.', 'David Viscott']
  ];
  // shown only on your own computer while there are no real reviews, so the design can be checked; always labelled "Example"
  const EXAMPLE_REVIEWS = [
    { name: 'Couple name', place: 'City, Country', stars: 5, text: 'This is an example. A real couple\'s words about making their wedding invitation will appear here, once you add them in reviews.js.' },
    { name: 'Customer name', place: 'City, Country', stars: 5, text: 'Another example card. Short reviews and longer ones both fit; the card grows to hold the text.' },
    { name: 'Family name', place: 'City, Country', stars: 5, text: 'Example: a birthday page or letter review would go here. You can also paste links to real Instagram posts in reviews.js.' }
  ];
  const isLocal = () => location.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  const IG_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;

  function reviewsSection(h2) {
    const R = window.TT_REVIEWS || {};
    const real = (R.reviews || []).filter(r => r && String(r.text || '').trim());
    const ig = (R.instagram || []).map(x => String(x || '').trim()).filter(x => IG_RE.test(x));
    const list = real.length ? real : (!ig.length && isLocal() ? EXAMPLE_REVIEWS.map(r => Object.assign({ example: true }, r)) : []);
    if (!list.length && !ig.length) return null;
    const card = r => el('figure', { class: 'lp-rev' },
      el('div', { class: 'stars', 'aria-label': (r.stars || 5) + ' out of 5' }, '★'.repeat(u.clamp(Math.round(r.stars || 5), 1, 5))),
      r.example ? el('span', { class: 'ex' }, 'Example') : null,
      r.date ? el('small', { class: 'when' }, u.fmtDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })) : null,
      el('blockquote', {}, r.text),
      el('figcaption', {}, el('span', { class: 'av', style: r.photo ? `background-image:url("${encodeURI(r.photo)}")` : null }, r.photo ? '' : String(r.name || '?').trim()[0] || '?'),
        el('span', {}, el('b', {}, r.name || ''), el('small', {}, r.place || ''))));
    const track = list.length ? el('div', { class: 'lp-revs', tabindex: '0', 'aria-label': 'Reviews' }, list.map(card)) : null;
    const nav = track && list.length > 1 ? el('div', { class: 'lp-revnav' },
      el('button', { type: 'button', 'aria-label': 'Previous review', onclick: () => track.scrollBy({ left: -track.clientWidth * .9, behavior: 'smooth' }) }, '‹'),
      el('button', { type: 'button', 'aria-label': 'Next review', onclick: () => track.scrollBy({ left: track.clientWidth * .9, behavior: 'smooth' }) }, '›')) : null;
    const igWrap = ig.length ? el('div', { class: 'lp-ig' }, ig.map(url => el('blockquote', { class: 'instagram-media', 'data-instgrm-permalink': url, 'data-instgrm-version': '14' }, el('a', { href: url, target: '_blank', rel: 'noopener' }, 'View this post on Instagram')))) : null;
    if (igWrap) u.loadScript('https://www.instagram.com/embed.js').then(() => { try { window.instgrm && window.instgrm.Embeds.process(); } catch (_) {} }).catch(() => {});
    return el('section', { class: 'lp-reviews', id: 'lp-reviews' }, el('div', { class: 'lp-in' }, h2('Love Stories', '', 'Shared by Celebrating <b>Hearts</b>'), track, nav, igWrap,
      list[0] && list[0].example ? el('p', { class: 'lp-exnote' }, 'Only you can see these example cards (on this computer). Add real reviews or Instagram links in reviews.js and they will show to everyone.') : null));
  }

  /* pieces shared by the home page and the invitations page */
  const lpGo = sel => e => { if (e) e.preventDefault(); const t = document.querySelector(sel); if (t) t.scrollIntoView({ behavior: u.RM ? 'auto' : 'smooth' }); };
  const lpChecks = list => el('ul', { class: 'lp-checks' }, list.map(t => el('li', { html: LP_ICON.check }, t)));
  const lpH2 = (a, b, c) => el('h2', { class: 'lp-h2', html: `${a}<br>${b ? `<b>${b}</b>` : ''}${c || ''}` });
  const lpDevice = (cls, id) => el('div', { class: 'lp-dev ' + cls }, el('div', { class: 'scr', html: (KS.templates[id] || {}).thumb || '' }));
  const lpFaq = list => el('div', { class: 'lp-faq' }, list.map(([q, a], i) => el('details', {}, el('summary', { html: `<b>Q${i + 1}:</b> ${u.esc(q)}` }), el('p', {}, a))));
  const lpFont = () => u.font('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');
  const FEATURED = ['wedding-christian', 'celestial', 'wedding']; // the three wedding designs shown on the home page
  const HOME_FAQ = [1, 2, 5, 6, 7]; // which FAQ answers the home page shows (the invitations page shows the invitation ones)

  /* the home page: a front door to both parts. Details live on #/invitations, #/letters and in blooms/ */
  function home() {
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.title = 'Tales & Blooms | Wedding Invitations and Handmade Bouquets, Kerala'; document.body.className = 'is-app is-lp'; window.scrollTo(0, 0);
    lpFont();
    const mine = B.signedIn() ? [] : B.myPages(); // signed in: pages live in the dashboard instead

    /* live phone preview: the Celestial design playing its sample */
    const showId = KS.templates.celestial ? 'celestial' : IDS[0];
    const pv = el('iframe', { src: location.pathname + '?preview=1', title: 'Sample invitation', tabindex: '-1', loading: 'lazy' });
    // played "as a visitor" (animations on, no opening card) and scrolled slowly from top to bottom, on a loop
    const onMsg = e => {
      if (e.source !== pv.contentWindow || !e.data || e.data.type !== 'ks-ready') return;
      const d = Object.assign(u.clone(KS.templates[showId].sample), { cover: false, petals: false });
      pv.contentWindow.postMessage({ type: 'ks-render', t: showId, d, m: { type: 'none' }, live: true }, '*');
      if (!u.RM) setTimeout(startTour, 1200);
    };
    addEventListener('message', onMsg);
    let raf = 0;
    heroVisible = on => { heroOn = on; };
    const startTour = () => {
      let y = 0, hold = 2600, last = 0, phase = 'top';
      const step = t => {
        raf = requestAnimationFrame(step);
        const dt = last ? Math.min(t - last, 60) : 0; last = t;
        const w = pv.contentWindow; if (!w || !heroOn || document.hidden || !pv.closest('.lp-slide.on')) return; // only while its slide is showing
        const max = w.document.documentElement.scrollHeight - w.innerHeight;
        if (phase === 'top' || phase === 'bottom') { hold -= dt; if (hold > 0) return;
          if (phase === 'bottom') { y = 0; w.scrollTo({ top: 0, behavior: 'smooth' }); phase = 'top'; hold = 3200; return; }
          phase = 'down'; }
        y = Math.min(max, y + dt * .075); w.scrollTo(0, y);
        if (y >= max) { phase = 'bottom'; hold = 2200; }
      };
      raf = requestAnimationFrame(step);
    };
    teardown = () => { removeEventListener('message', onMsg); cancelAnimationFrame(raf); lpTimers.forEach(clearInterval); lpTimers = []; if (lpObs) { lpObs.disconnect(); lpObs = null; } heroVisible = () => {}; };

    app().textContent = '';
    app().append(el('div', { class: 'lp' },
      tbHeader(),
      tbHero('wedding-christian'),

      heroShow([{ cls: 'inv', label: 'Invitations', node: el('div', { class: 'lp-in' },
        el('div', { class: 'lp-copy' },
          el('p', { class: 'tb-eyebrow' }, 'Tales & Tidings · Digital invitations'),
          el('h2', { class: 'lp-rot', 'aria-live': 'polite' }, el('span', { html: HEADLINES[0] })),
          el('p', {}, 'Create elegant, fully customisable e-invites with your photos, venues, countdown and music. Share one link that opens beautifully on every phone.'),
          el('div', { class: 'lp-cta' }, el('a', { class: 'lp-btn', href: '#/invitations' }, 'See all invitations'), el('a', { class: 'lp-link', href: '#/how' }, 'How it works')),
          el('p', { class: 'lp-quote' }, el('span', {}, '“' + QUOTES[0][0] + '”', el('cite', {}, QUOTES[0][1]))),
          B.configured() ? null : el('div', { class: 'notice', html: '<b>Publishing is not switched on yet.</b> You can design and preview everything now. To share pages, connect a free Supabase project: open <code>SETUP.md</code> in this folder and follow the steps.' })),
        el('div', { class: 'lp-art' }, el('div', { class: 'lp-blob' }), ['a', 'b', 'c', 'd', 'e', 'f'].map(k => el('i', { class: 'lp-spark ' + k }, '✦')),
          el('div', { class: 'lp-phone' }, el('i', { class: 'notch' }), el('div', { class: 'scr' }, pv)),
          el('div', { class: 'lp-chip', html: `<span>${LP_ICON.pin}</span>Find your venue<br>with maps` }))) }, ...bloomsSlides()]),

      el('section', { class: 'lp-sec lp-featured' }, el('div', { class: 'lp-in' },
        lpH2('Popular', 'Wedding', ' Designs'),
        el('div', { class: 'cards' }, FEATURED.filter(id => KS.templates[id]).map(designCard)),
        el('div', { class: 'lp-cta2' }, el('p', {}, IDS.length + ' designs for weddings, birthdays and letters.'), el('a', { class: 'lp-btn', href: '#/invitations' }, 'See all invitations')))),

      bloomsSection(),
      packagesSection(),

      mine.length ? el('section', { class: 'lp-sec mine', id: 'lp-mine' }, el('div', { class: 'lp-in' }, el('h2', { class: 'lp-h2' }, 'Your pages'),
        B.configured() ? el('p', { class: 'help top' }, 'These are saved in this browser only. ', el('a', { href: '#/account' }, 'Create a free account'), ' to keep them safe and edit them from any device.') : null,
        mine.map(p => myRow(p)))) : null,

      reviewsSection(lpH2),

      el('section', { class: 'lp-sec', id: 'lp-faq' }, el('div', { class: 'lp-in narrow' }, lpH2('Things You', '', 'Might Want to <b>Know</b>'),
        lpFaq(HOME_FAQ.map(i => FAQ[i])))),

      TB() ? TB().footer({ base: '' }) : null));
    lpMotion();
  }

  /* ---------------- invitations: every design and all the detail (#/invitations) ---------------- */
  function invitationsPage() {
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.title = 'Digital Wedding Invitations | Tales & Blooms'; document.body.className = 'is-app is-lp'; window.scrollTo(0, 0);
    lpFont();
    teardown = () => { lpTimers.forEach(clearInterval); lpTimers = []; if (lpObs) { lpObs.disconnect(); lpObs = null; } };
    const groups = designGroups();
    // the wedding designs in full; the other groups have their own page (#/letters) and a card that links to it
    const sections = groups.map(x => x.g === WEDDING
      ? el('section', { class: 'grp' }, el('h2', {}, x.g), el('div', { class: 'cards' }, x.ids.map(designCard)))
      : moreDesignsCard(x));
    const toTop = () => el('a', { class: 'lp-btn', href: '#lp-collection', onclick: lpGo('#lp-collection') }, 'Choose a design');

    app().textContent = '';
    app().append(el('div', { class: 'lp' },
      tbHeader('invitations'),

      el('section', { class: 'lp-coll lp-page', id: 'lp-collection' }, el('div', { class: 'lp-panel' },
        el('a', { class: 'lp-back', href: '#/' }, '← Home'),
        el('h1', { class: 'lp-h2', html: 'Digital Wedding <b>Invitations</b>' }),
        el('p', { class: 'lp-page-lead' }, 'Pick a design, add your names, dates, venues, photos and a song, then share one link on WhatsApp. Free to create and preview.'),
        sections)),

      el('section', { class: 'lp-steps', id: 'lp-how' }, el('div', { class: 'lp-in' },
        [['Choose a Template', 'Pick a wedding, birthday or letter design you love.'], ['Personalise', 'Add your names, words, colours and a song.'], ['Add Event Details', 'Enter venues, dates, timings, photos and notes.'], ['Share Instantly', 'Publish and send one link on WhatsApp, email or social media.']]
          .map(([t, d], i) => el('div', {}, el('span', { class: 'ic', html: LP_ICON['step' + (i + 1)] }, el('em', {}, '0' + (i + 1))), el('h3', {}, t), el('p', {}, d))))),

      el('section', { class: 'lp-sec lp-split' }, el('div', { class: 'lp-in' },
        el('div', {}, el('h2', { class: 'lp-h2 left', html: 'Features That<br>Make Your <b>Invitations</b><br>Truly Unforgettable' }),
          el('p', { class: 'lp-p' }, 'Make your day unforgettable with interactive invitation features. From the couple\'s profiles to live streaming, everything brings your celebration closer to your guests, wherever they are.'),
          lpChecks(['Bride and groom profiles', 'Photo gallery', 'Venue location maps', 'Event date countdown', 'RSVP and wishes on WhatsApp', 'YouTube video or live stream', 'Background music', 'Easy social sharing']), toTop()),
        el('div', { class: 'lp-devs' }, el('div', { class: 'lp-circle blue' }), lpDevice('tab', 'celestial'), lpDevice('ph', 'wedding-hindu')))),

      el('section', { class: 'lp-sec lp-split rev' }, el('div', { class: 'lp-in' },
        el('div', { class: 'lp-devs' }, el('div', { class: 'lp-circle pink' }), lpDevice('tab', 'wedding'), lpDevice('ph', 'birthday')),
        el('div', {}, el('h2', { class: 'lp-h2 left', html: 'Reasons to Go<br>Digital with <b>Tales &amp; Tidings</b>' }),
          el('p', { class: 'lp-p' }, 'Digital invitations are the modern, simple way to announce your day. They save time and money, and reach every guest instantly. With music, wishes and maps, your invite becomes more than a card: it is a little celebration of its own.'),
          lpChecks(['Eco-friendly and paperless', 'No printing or postage costs', 'Easy to share on WhatsApp and social media', 'Guests can reply and send wishes instantly', 'Fully customisable with photos, music and themes']), toTop()))),

      el('section', { class: 'lp-sec', id: 'lp-inv-faq' }, el('div', { class: 'lp-in narrow' }, lpH2('Invitation', '', '<b>Questions</b>'),
        lpFaq(FAQ.slice(0, 6)),
        el('div', { class: 'lp-cta2' }, el('p', {}, 'Browse, customise and share a stunning invitation in minutes.'), toTop()))),

      TB() ? TB().footer({ base: '' }) : null));
    lpMotion();
  }

  /* landing page motion: things fade up as they scroll in (siblings one after another) and the numbers count up */
  function lpMotion() {
    const root = $('.lp'); if (!root) return;
    /* headline and quote take turns: fade out, swap, fade in */
    const swap = (box, i, html) => { const sp = box.firstElementChild; sp.classList.add('out'); setTimeout(() => { if (typeof html === 'string') sp.innerHTML = html; else { sp.textContent = ''; sp.append(...html); } sp.classList.remove('out'); }, 450); };
    const h1 = $('.lp-rot', root), qt = $('.lp-quote', root); let hi = 0, qi = 0;
    if (h1) lpTimers.push(setInterval(() => { if (document.hidden) return; hi = (hi + 1) % HEADLINES.length; swap(h1, hi, HEADLINES[hi]); }, 4800));
    if (qt) lpTimers.push(setInterval(() => { if (document.hidden) return; qi = (qi + 1) % QUOTES.length; swap(qt, qi, ['“' + QUOTES[qi][0] + '”', el('cite', {}, QUOTES[qi][1])]); }, 7000));
    /* reviews glide one card at a time, pausing while someone is reading */
    const track = $('.lp-revs', root);
    if (track && track.children.length > 1 && !u.RM) {
      let hold = false; ['mouseenter', 'focusin', 'touchstart'].forEach(ev => track.addEventListener(ev, () => { hold = true; }, { passive: true }));
      ['mouseleave', 'focusout'].forEach(ev => track.addEventListener(ev, () => { hold = false; }));
      lpTimers.push(setInterval(() => { if (hold || document.hidden) return; const c = track.firstElementChild, w = c.offsetWidth + 24;
        track.scrollTo({ left: track.scrollLeft + w > track.scrollWidth - track.clientWidth + 4 ? 0 : track.scrollLeft + w, behavior: 'smooth' }); }, 4500));
    }
    const hero = $('.lp-hero', root);
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroVisible(es[0].isIntersecting); }).observe(hero);
    }
    if (u.RM || !('IntersectionObserver' in window)) return;
    const groups = ['.lp-sec .lp-h2', '.lp-coll .lp-h2', '.lp-split .lp-in > *', '.lp-checks li', '.lp-panel .tcard', '.lp-featured .tcard', '.lp-featured .lp-h2', '.lp-cta2', '.lp-steps .lp-in > div', '.lp-faq details', '.lp-reviews .lp-h2', '.lp-revs', '.lp-ig', '.lp-foot > .lp-in > div', '.lp .mrow'];
    const items = [];
    groups.forEach(sel => u.$$(sel, root).forEach(n => { const i = [...n.parentNode.children].indexOf(n); n.classList.add('lp-rv'); n.style.transitionDelay = Math.min(i, 8) * 90 + 'ms'; items.push(n); }));
    const count = b => { const to = +b.dataset.n, t0 = performance.now(); if (!to) return; const f = t => { const k = Math.min(1, (t - t0) / 1100); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; b.textContent = '0'; requestAnimationFrame(f); };
    lpObs = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); lpObs.unobserve(e.target); const b = e.target.querySelector && e.target.querySelector('b[data-n]'); if (b) count(b); }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(n => lpObs.observe(n));
  }

  function myRow(p) {
    const T = KS.templates[p.t];
    return el('div', { class: 'mrow' },
      el('div', { class: 'mt' }, el('b', {}, p.title || 'Untitled'), el('small', {}, (T ? T.name : p.t) + ' · ' + new Date(p.created).toLocaleDateString())),
      el('a', { class: 'btn', href: B.pageLink(p.id), target: '_blank', rel: 'noopener' }, 'View'),
      el('button', { class: 'btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(B.pageLink(p.id)); u.toast('Link copied'); } catch (_) { u.toast(B.pageLink(p.id)); } } }, 'Copy link'),
      el('button', { class: 'btn', type: 'button', onclick: () => { location.hash = '#/edit/' + p.id; } }, 'Edit'),
      el('button', { class: 'link', type: 'button', onclick: () => { if (confirm('Remove this from your list? The page itself stays online.')) { B.forgetPage(p.id); home(); } } }, 'Remove from list'));
  }

  /* ---------------- accounts: sign in, and the dashboard of your pages ---------------- */
  function shell(title, ...kids) {
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.body.className = 'is-app'; window.scrollTo(0, 0); document.title = title + ' · Tales & Tidings';
    app().textContent = '';
    app().append(el('div', { class: 'acct' },
      el('header', { class: 'acct-top' }, el('a', { href: '#/', class: 'acct-home' }, brand()),
        el('nav', {}, el('a', { class: 'btn ghost', href: '#/' }, 'Home'),
          B.signedIn() ? el('button', { class: 'btn ghost', type: 'button', onclick: async () => { await B.signOut(); u.toast('Signed out'); location.hash = '#/'; } }, 'Sign out') : null)),
      el('main', { class: 'acct-main' }, ...kids)));
  }

  function account() {
    if (!B.configured()) return shell('Account', el('div', { class: 'acct-card' }, el('h1', {}, 'Accounts are not switched on yet'),
      el('p', { class: 'help', html: 'Connect a free Supabase project first: open <code>SETUP.md</code> and follow the steps.' })));
    return B.signedIn() ? dashboard() : signIn();
  }

  function signIn(mode) {
    mode = mode || 'in';
    const email = el('input', { type: 'email', required: true, autocomplete: 'email', placeholder: 'you@example.com', id: 'ac-email' });
    const pass = el('input', { type: 'password', required: true, minlength: '6', autocomplete: mode === 'up' ? 'new-password' : 'current-password', id: 'ac-pass' });
    const msg = el('p', { class: 'acct-msg', role: 'status' });
    const btn = el('button', { class: 'btn primary big', type: 'submit' }, mode === 'up' ? 'Create account' : 'Sign in');
    const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('err', !!bad); };
    const form = el('form', { class: 'acct-form', novalidate: true, onsubmit: async e => {
      e.preventDefault();
      const em = email.value.trim(), pw = pass.value;
      if (!/^\S+@\S+\.\S+$/.test(em)) return say('Please enter your email address.', true);
      if (pw.length < 6) return say('Your password needs at least 6 characters.', true);
      btn.disabled = true; say(mode === 'up' ? 'Creating your account…' : 'Signing in…');
      try {
        const s = mode === 'up' ? await B.signUp(em, pw) : await B.signIn(em, pw);
        if (!s) { btn.disabled = false; return say('Almost there: we sent a link to ' + em + '. Open it to confirm your email, and you will be signed in.'); }
        await B.claimDevicePages();
        u.toast(mode === 'up' ? 'Welcome! Your account is ready.' : 'Welcome back');
        if (location.hash === '#/account') dashboard(); else location.hash = '#/account';
      } catch (err) { btn.disabled = false; say(err.message || 'Something went wrong.', true); }
    } },
      el('label', { for: 'ac-email' }, 'Email'), email,
      el('label', { for: 'ac-pass' }, 'Password'), pass, mode === 'up' ? el('p', { class: 'help' }, 'At least 6 characters.') : null,
      btn, msg);
    const forgot = el('button', { class: 'link', type: 'button', onclick: async () => {
      const em = email.value.trim(); if (!/^\S+@\S+\.\S+$/.test(em)) { email.focus(); return say('Type your email above, then tap "Forgot password" again.', true); }
      try { await B.resetPassword(em); say('If there is an account for ' + em + ', a link to choose a new password is on its way.'); } catch (err) { say(err.message, true); }
    } }, 'Forgot password?');
    const local = B.myPages().length;
    shell(mode === 'up' ? 'Create account' : 'Sign in', el('div', { class: 'acct-card' },
      el('h1', {}, mode === 'up' ? 'Create your free account' : 'Sign in'),
      el('p', { class: 'acct-sub' }, 'Keep every invitation, letter and birthday page you publish in one place, and edit them from any phone or computer.'),
      local ? el('div', { class: 'notice' }, 'The ' + (local === 1 ? 'page' : local + ' pages') + ' you published in this browser will move into your account when you sign in.') : null,
      form,
      el('div', { class: 'acct-alt' }, mode === 'up'
        ? el('span', {}, 'Already have an account? ', el('button', { class: 'link', type: 'button', onclick: () => signIn('in') }, 'Sign in'))
        : el('span', {}, 'New here? ', el('button', { class: 'link', type: 'button', onclick: () => signIn('up') }, 'Create an account')),
        mode === 'in' ? forgot : null)));
    email.focus();
  }

  async function dashboard() {
    const list = el('div', { class: 'dash-list' }, el('p', { class: 'help' }, 'Loading your pages…'));
    const who = (B.user() || {}).email || '';
    shell('My dashboard',
      el('div', { class: 'dash-head' }, el('div', {}, el('h1', {}, 'My pages'), who ? el('p', { class: 'help' }, 'Signed in as ' + who) : null),
        el('a', { class: 'btn primary', href: '#/invitations' }, '+ Create a new page')),
      list);
    let pages, drafts;
    try { await B.claimDevicePages(); [pages, drafts] = await Promise.all([B.accountPages(), B.accountDrafts()]); }
    catch (e) {
      if (!B.signedIn()) { u.toast('Please sign in again.'); return signIn(); }
      list.textContent = ''; return list.append(el('p', { class: 'err' }, e.message || 'Could not load your pages.'), el('button', { class: 'btn', type: 'button', onclick: dashboard }, 'Try again'));
    }
    if (location.hash.replace(/^#\/?/, '') !== 'account') return; // moved on while loading
    list.textContent = '';
    if (!pages.length && !drafts.length) return list.append(el('div', { class: 'dash-empty' }, el('h2', {}, 'No pages yet'), el('p', {}, 'Pick a design and make it yours. Your work saves here as you go, and stays ready to edit after you publish.'), el('a', { class: 'btn primary', href: '#/invitations' }, 'Choose a design')));
    if (drafts.length) list.append(el('h2', { class: 'dash-sub' }, 'Drafts', el('small', {}, ' · not published yet')), ...drafts.map(p => dashRow(p, true)));
    if (pages.length) list.append(el('h2', { class: 'dash-sub' }, 'Published'), ...pages.map(p => dashRow(p)));
  }

  function dashRow(p, isDraft) {
    const d = p.data || {}, T = KS.templates[d.t];
    let title = ''; try { title = T && T.title ? T.title(d.d || {}) : ''; } catch (_) {}
    const link = B.pageLink(p.id), day = x => new Date(x).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const row = el('div', { class: 'dash-row' },
      el('div', { class: 'dash-thumb', html: (T && T.thumb) || '' }),
      el('div', { class: 'dash-info' }, el('b', {}, title || (T ? T.name : 'Untitled')),
        el('small', {}, (T ? T.name : d.t || '') + (isDraft ? ' · saved ' : ' · updated ') + day(p.updated_at) + (p.updated_at !== p.created_at ? ' · started ' + day(p.created_at) : ''))),
      el('div', { class: 'dash-act' },
        isDraft ? el('a', { class: 'btn primary', href: '#/draft/' + p.id }, 'Continue') : [
          el('a', { class: 'btn primary', href: '#/edit/' + p.id }, 'Edit'),
          el('a', { class: 'btn', href: link, target: '_blank', rel: 'noopener' }, 'View'),
          el('button', { class: 'btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); u.toast('Link copied'); } catch (_) { u.toast(link); } } }, 'Copy link')],
        el('button', { class: 'link danger', type: 'button', onclick: async () => {
          if (!confirm(isDraft ? 'Delete this draft and its photos? This cannot be undone.' : 'Delete "' + (title || 'this page') + '" and its photos and songs? The link will stop working for everyone. This cannot be undone.')) return;
          try {
            if (isDraft) await B.deleteDraft(p.id, d); else { await B.deletePage(p.id, d); B.forgetPage(p.id); }
            const head = row.previousElementSibling; row.remove();
            if (head && head.matches('.dash-sub') && !(head.nextElementSibling && head.nextElementSibling.matches('.dash-row'))) head.remove();
            u.toast(isDraft ? 'Draft deleted' : 'Page deleted'); if (!$('.dash-row')) dashboard();
          } catch (e) { u.toast(e.message); }
        } }, 'Delete')));
    return row;
  }

  function resetPassword() {
    if (!B.signedIn()) { u.toast('That link has expired. Ask for a new one.'); return signIn(); }
    const pass = el('input', { type: 'password', minlength: '6', autocomplete: 'new-password', id: 'rp-pass' });
    const msg = el('p', { class: 'acct-msg', role: 'status' }), btn = el('button', { class: 'btn primary big', type: 'submit' }, 'Save new password');
    shell('New password', el('div', { class: 'acct-card' }, el('h1', {}, 'Choose a new password'),
      el('form', { class: 'acct-form', novalidate: true, onsubmit: async e => {
        e.preventDefault();
        if (pass.value.length < 6) { msg.textContent = 'At least 6 characters, please.'; msg.classList.add('err'); return; }
        btn.disabled = true;
        try { await B.setPassword(pass.value); u.toast('Password changed'); location.hash = '#/account'; }
        catch (err) { btn.disabled = false; msg.textContent = err.message; msg.classList.add('err'); }
      } }, el('label', { for: 'rp-pass' }, 'New password'), pass, btn, msg)));
    pass.focus();
  }

  /* editing: a published page { id, key, page }. draft: a draft saved in the account { id, data } */
  /* editor settings, per device */
  const EDP = 'ks.editor';
  function edPrefs() { let p = {}; try { p = JSON.parse(localStorage.getItem(EDP) || '{}') || {}; } catch (_) {} return Object.assign({ layout: 'page', jump: true, inline: true }, p); }
  function saveEdPrefs(p) { try { localStorage.setItem(EDP, JSON.stringify(p)); } catch (_) {} }

  async function editor(tplId, editing, draft) {
    await loadAll();
    const T = KS.templates[tplId]; if (!T) return (location.hash = '#/');
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.body.className = 'is-app'; window.scrollTo(0, 0); document.title = 'Editing: ' + T.name;

    const blankMusic = () => Object.assign({ type: 'none', id: '', src: '', name: '' }, u.clone(T.defaultMusic || {}));
    const draftKey = 'ks.draft.' + T.id;
    const cloud = !editing && B.configured() && B.signedIn(); // signed in: drafts (with photos and songs) are saved to the account
    let draftId = draft ? draft.id : '', fromDevice = false;
    let data, music, restored = false;
    if (editing) { data = Object.assign(u.clone(T.sample), editing.page.d || {}); music = Object.assign(blankMusic(), editing.page.m || {}); }
    else if (draft) { data = Object.assign(u.clone(T.sample), draft.data.d || {}); music = Object.assign(blankMusic(), draft.data.m || {}); }
    else {
      try { const dr = JSON.parse(localStorage.getItem(draftKey) || 'null'); if (dr && dr.d) { data = Object.assign(u.clone(T.sample), dr.d); music = Object.assign(blankMusic(), dr.m || {}); restored = true; fromDevice = cloud; } } catch (_) {}
      if (!data) { data = u.clone(T.sample); music = blankMusic(); }
    }

    if (T.migrate) T.migrate(data); // lets a template upgrade fields saved by an older version

    /* preview iframe */
    let ready = false, live = false, timer = 0, saveT = 0, typing = false, ed = null;
    const prefs = edPrefs();
    const iframe = el('iframe', { src: location.pathname + '?preview=1', title: 'Preview' });
    // the text boxes in the form, so the preview can match words on designs that do not mark them
    const textPaths = () => T.schema.flatMap(sec => sec.fields.flatMap(f => {
      const isT = x => x.type === 'text' || x.type === 'textarea';
      if (isT(f)) return typeof data[f.key] === 'string' ? [[f.key, data[f.key]]] : [];
      if (f.type === 'repeater' && Array.isArray(data[f.key])) return data[f.key].flatMap((it, i) => f.fields.filter(isT).filter(sf => typeof it[sf.key] === 'string').map(sf => [f.key + '.' + i + '.' + sf.key, it[sf.key]]));
      return [];
    }));
    const send = () => {
      if (!ready || live || typing) return; // never redraw under someone typing in the preview
      iframe.contentWindow.postMessage({ type: 'ks-render', t: T.id, d: data, m: music, live: false,
        tools: { jump: prefs.jump, inline: prefs.inline, say: ed ? ed.sayMap() : {}, fields: prefs.jump || prefs.inline ? textPaths() : [] } }, '*');
    };
    const narrow = () => matchMedia('(max-width: 900px)').matches;
    const showTab = t => { root.dataset.tab = t; [...tabs.children].forEach((b, i) => b.setAttribute('aria-selected', String((i === 0) === (t === 'edit')))); };
    const onMsg = e => {
      if (e.source !== iframe.contentWindow || !e.data) return;
      const m = e.data;
      if (m.type === 'ks-ready') { ready = true; send(); }
      else if (m.type === 'ks-pick') { if (narrow()) showTab('edit'); ed.reveal(m.page ? { page: m.page } : { path: m.path }); }
      else if (m.type === 'ks-edit-start') { typing = true; if (!narrow()) ed.reveal({ path: m.path }); }
      else if (m.type === 'ks-edit') ed.setValue(m.path, m.value);
      else if (m.type === 'ks-edit-done') { typing = false; send(); }
    };
    addEventListener('message', onMsg);
    /* drafts: saved a moment after each change, to the account when signed in, otherwise to this browser */
    const status = el('small', {}, editing ? 'editing a published page' : cloud ? (draft ? 'draft saved to your account' : 'draft saves to your account') : 'draft saved on this device');
    let dirty = false, saving = false, again = false;
    const saveLocal = () => { try { localStorage.setItem(draftKey, JSON.stringify({ d: stripBlobs(data), m: stripBlobs(music) })); } catch (_) {} };
    async function saveCloud() {
      if (saving) { again = true; return; }
      saving = true; dirty = false; status.textContent = 'Saving…';
      try {
        if (!draftId) { draftId = B.newId(); if (location.hash.startsWith('#/new/')) history.replaceState(null, '', '#/draft/' + draftId); }
        const found = await B.uploadBlobMap({ d: data, m: music }, 'drafts/' + draftId);
        B.swapUrls(data, found); B.swapUrls(music, found); // photos now live online, so the draft keeps them
        if (editing) { saving = false; return; } // published meanwhile: no draft needed any more
        await B.saveDraft(draftId, { v: 1, t: T.id, d: stripBlobs(data), m: stripBlobs(music) });
        if (fromDevice) { try { localStorage.removeItem(draftKey); } catch (_) {} fromDevice = false; }
        status.textContent = 'Saved to your account';
      } catch (e) { dirty = true; status.textContent = 'Not saved yet: ' + (e.message || 'try again'); }
      saving = false;
      if (again && !editing) { again = false; saveCloud(); }
    }
    const saveNow = () => { clearTimeout(saveT); if (!dirty || editing) return; if (cloud) saveCloud(); else { dirty = false; saveLocal(); } };
    const changed = () => {
      clearTimeout(timer); timer = setTimeout(send, 220);
      if (!editing) { dirty = true; clearTimeout(saveT); saveT = setTimeout(saveNow, cloud ? 1500 : 700); }
    };
    const onLeave = e => { if (cloud && (dirty || saving)) { saveNow(); e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', onLeave);

    /* layout */
    const formHost = el('div'), musicHost = el('div');
    const liveBtn = el('button', { type: 'button', class: 'btn', onclick: () => {
      live = !live; liveBtn.textContent = live ? '■ Stop' : '▶ Play as a visitor';
      if (live) iframe.contentWindow.postMessage({ type: 'ks-render', t: T.id, d: data, m: music, live: true }, '*'); else send();
    } }, '▶ Play as a visitor');
    const frame = el('div', { class: 'pvframe' }, iframe);
    const dev = el('div', { class: 'seg dev' }, ['Phone', 'Desktop'].map((n, i) => el('button', { type: 'button', 'aria-pressed': String(i === 0), onclick: e => {
      frame.classList.toggle('desktop', i === 1); [...e.target.parentNode.children].forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    } }, n)));
    const tabs = el('div', { class: 'tabs', role: 'tablist' }, ['edit', 'preview'].map(t => el('button', { role: 'tab', type: 'button', 'aria-selected': String(t === 'edit'), onclick: e => {
      root.dataset.tab = t; [...tabs.children].forEach(b => b.setAttribute('aria-selected', String(b === e.currentTarget)));
    } }, t === 'edit' ? 'Edit' : 'Preview')));
    const pubBtn = el('button', { type: 'button', class: 'btn primary', onclick: () => publish() }, editing ? 'Save changes' : 'Publish');
    /* how the editor works: form arranged by page or by topic, tap-to-find, type in the preview. Remembered on this device. */
    const setPanel = el('div', { class: 'edset', hidden: true, role: 'dialog', 'aria-label': 'Editor settings' });
    const drawSettings = () => {
      const opt = (k, title, help) => { const c = el('input', { type: 'checkbox' }); c.checked = !!prefs[k];
        c.addEventListener('change', () => { prefs[k] = c.checked; saveEdPrefs(prefs); send(); });
        return el('label', { class: 'es-row' }, c, el('span', {}, el('b', {}, title), el('small', {}, help))); };
      setPanel.textContent = '';
      setPanel.append(el('h3', {}, 'How the editor works'),
        el('div', { class: 'es-blk' }, el('b', {}, 'Arrange the form'),
          T.pagesOf ? el('div', { class: 'seg' }, [['page', 'By page'], ['topic', 'By topic']].map(([v, l]) => el('button', { type: 'button', 'aria-pressed': String(prefs.layout === v),
            onclick: () => { prefs.layout = v; saveEdPrefs(prefs); buildForm(); drawSettings(); } }, l))) : null,
          el('small', {}, T.pagesOf ? (prefs.layout === 'page' ? 'One card per page your visitor sees, with its words, guide and photos together.' : 'Grouped by kind of setting, the classic way.')
            : 'This design is one long page, so its settings are grouped by topic.')),
        opt('jump', 'Tap the preview to find a setting', 'Tap a page or any words in the preview and the form opens right there.'),
        opt('inline', 'Type straight into the preview', 'Tap any words in the preview and type over them. The form updates too.'),
        el('div', { class: 'dact' }, el('button', { type: 'button', class: 'btn', onclick: () => { setPanel.hidden = true; } }, 'Done')));
    };
    const setBtn = el('button', { type: 'button', class: 'btn ghost', 'aria-label': 'Editor settings', 'aria-expanded': 'false', onclick: () => {
      setPanel.hidden = !setPanel.hidden; setBtn.setAttribute('aria-expanded', String(!setPanel.hidden)); if (!setPanel.hidden) drawSettings();
    } }, '⚙', el('span', { class: 'hide-s' }, ' Settings'));
    const root = el('div', { class: 'ed', 'data-tab': 'edit' },
      el('div', { class: 'ed-top' },
        el('button', { type: 'button', class: 'btn ghost', onclick: () => {
          if (editing ? confirm('Leave the editor? Changes you have not saved will be lost.') : cloud || confirm('Leave the editor? Your work is saved as a draft on this device (photos and songs will need adding again).')) location.hash = B.signedIn() ? '#/account' : '#/';
        } }, '← Back'),
        el('div', { class: 'ttl' }, T.name, status), tabs, el('div', { class: 'edset-wrap' }, setBtn, setPanel), pubBtn),
      el('div', { class: 'ed-main' },
        el('div', { class: 'ed-form' },
          restored || draft ? el('div', { class: 'draftbar' }, el('span', {}, draft ? 'Carrying on with your draft.' : 'Restored your last draft.'), el('button', { class: 'link', type: 'button', onclick: () => {
            if (!confirm('Start over from the sample? This draft will be deleted.')) return;
            dirty = false; clearTimeout(saveT); try { localStorage.removeItem(draftKey); } catch (_) {}
            if (draftId) B.deleteDraft(draftId, { d: data, m: music }).catch(() => {});
            if (location.hash === '#/new/' + T.id) editor(tplId); else location.hash = '#/new/' + T.id;
          } }, 'Start over')) : null,
          formHost, el('details', { class: 'sec' }, el('summary', {}, 'Music'), el('div', { class: 'secbody' }, musicHost))),
        el('div', { class: 'ed-pv' }, el('div', { class: 'pvbar' }, dev, liveBtn, el('button', { class: 'btn ghost', type: 'button', onclick: () => { ready && (live = false, liveBtn.textContent = '▶ Play as a visitor', send()); } }, '↻ Refresh')), el('div', { class: 'pvstage' }, frame))));
    app().textContent = ''; app().append(root);

    function buildForm() {
      ed = KS.buildEditor(formHost, T.schema, data, changed, { emoji: !!T.emoji, layout: T.pagesOf ? prefs.layout : 'topic', pagesOf: T.pagesOf || null, sayHint: T.sayHint || null,
        onPage: id => { if (prefs.jump && ready && !live) iframe.contentWindow.postMessage({ type: 'ks-show', page: id }, '*'); } });
      send();
    }
    buildForm();
    const me = KS.buildMusicEditor(musicHost, music, changed);
    teardown = () => { removeEventListener('message', onMsg); removeEventListener('beforeunload', onLeave); clearTimeout(timer); saveNow(); me.stop(); };
    if (fromDevice) { dirty = true; saveNow(); } // a draft from before signing in moves into the account

    /* publishing */
    async function publish() {
      const ov = el('div', { class: 'ov' }), dlg = el('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true' }); ov.append(dlg); document.body.append(ov);
      const close = () => ov.remove();
      const show = (...kids) => { dlg.textContent = ''; dlg.append(...kids); };

      if (!B.configured()) {
        return show(el('h2', {}, 'One setup step left'), el('p', {}, 'Publishing needs a free Supabase project to store your page, photos and song. It takes about five minutes.'),
          el('p', { html: 'Open <code>SETUP.md</code> in your project folder and follow the steps, then come back. Your draft is saved.' }), el('div', { class: 'dact' }, el('button', { class: 'btn primary', type: 'button', onclick: close }, 'OK')));
      }
      const payload = { v: 1, t: T.id, d: u.clone(data), m: u.clone(music) };
      if (payload.m.type === 'upload' && !payload.m.src) payload.m = { type: 'none' };
      if (payload.m.type === 'youtube' && !u.youtubeId(payload.m.src)) payload.m = { type: 'none' };
      if (payload.m.type === 'library' && !KS.trackOf(payload.m.id)) payload.m = { type: 'none' };
      if (payload.m.type === 'none') payload.m = { type: 'none' };

      clearTimeout(saveT);
      for (let i = 0; saving && i < 150; i++) await new Promise(r => setTimeout(r, 100)); // let a draft save finish first
      const bar = el('i'), msg = el('p', {}, 'Getting things ready…');
      show(el('h2', {}, editing ? 'Saving your page…' : 'Publishing…'), msg, el('div', { class: 'bar' }, bar));
      try {
        const id = editing ? editing.id : B.newId(), key = editing ? editing.key : B.newKey();
        const out = await B.uploadBlobs(payload, id, (d, n) => { msg.textContent = n ? 'Uploading photos and music (' + d + ' of ' + n + ')…' : 'Saving…'; bar.style.width = (n ? Math.round(d / n * 80) : 30) + '%'; });
        if (JSON.stringify(out).length > 280000) throw new Error('There is too much text on this page. Try shortening it.');
        msg.textContent = 'Saving…'; bar.style.width = '92%';
        if (editing) await B.updatePage(id, key, out); else await B.createPage(id, key, out);
        bar.style.width = '100%';
        if (key) B.rememberPage({ id, key, t: T.id, title: T.title ? T.title(out.d) : T.name, created: Date.now(), claimed: B.signedIn() ? B.user().id : undefined });
        if (!editing) {
          try { localStorage.removeItem(draftKey); } catch (_) {} editing = { id, key, page: out }; pubBtn.textContent = 'Save changes'; status.textContent = 'editing a published page'; dirty = false;
          if (draftId) { B.deleteDraft(draftId, null, true).catch(() => {}); draftId = ''; } // published now: the draft is done, its photos stay (the page uses them)
          if (/^#\/(new|draft)\//.test(location.hash)) history.replaceState(null, '', '#/edit/' + id);
        }
        // published pictures now have permanent addresses: use them in the editor from here on
        Object.keys(out.d).forEach(k => { if (JSON.stringify(out.d[k]) !== JSON.stringify(data[k]) && hasBlobs(data[k])) data[k] = out.d[k]; });
        if (out.m && out.m.src && u.isBlobUrl(music.src)) music.src = out.m.src;
        const link = B.pageLink(id);
        const box = el('input', { type: 'text', readonly: true, value: link, 'aria-label': 'Your link' }); box.addEventListener('focus', () => box.select());
        show(el('h2', {}, 'It is live ✨'), el('p', {}, 'Send this link to anyone. It opens on any phone or computer.'),
          el('div', { class: 'linkbox' }, box, el('button', { class: 'btn primary', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); u.toast('Link copied'); } catch (_) { box.select(); u.toast('Press Cmd/Ctrl+C to copy'); } } }, 'Copy')),
          el('div', { class: 'dact' },
            el('a', { class: 'btn', href: link, target: '_blank', rel: 'noopener' }, 'Open it'),
            navigator.share ? el('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ title: document.title, url: link }).catch(() => {}) }, 'Share…') : null,
            el('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Keep editing'),
            el('button', { class: 'btn ghost', type: 'button', onclick: () => { close(); location.hash = B.signedIn() ? '#/account' : '#/'; } }, 'Done')),
          B.signedIn() ? el('p', { class: 'help', style: 'margin-top:14px' }, 'Saved to your account. Change it any time from your dashboard, on any device.')
            : el('p', { class: 'help', style: 'margin-top:14px' }, 'To edit it later from any device, ', el('a', { href: '#/account', target: '_blank', rel: 'noopener' }, 'create a free account'), '. This page moves into it automatically. Without an account, you can only edit it from this browser.'));
      } catch (e) {
        show(el('h2', {}, 'That did not work'), el('p', { class: 'err' }, e.message || 'Something went wrong.'), el('p', {}, 'Your work is still here. Check your connection and try again.'),
          el('div', { class: 'dact' }, el('button', { class: 'btn primary', type: 'button', onclick: () => { close(); publish(); } }, 'Try again'), el('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Close')));
      }
    }
  }

  async function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    await loadAll();
    if (h[0] === 'new' && KS.templates[h[1]]) return editor(h[1]);
    if (h[0] === 'account') return account();
    if (h[0] === 'letters') return lettersPage();
    if (h[0] === 'invitations' || h[0] === 'designs') return invitationsPage(); // "designs" was the old address
    if (h[0] === 'how') { // "how it works" lives on the invitations page
      invitationsPage(); history.replaceState(null, '', location.pathname + location.search + '#/invitations');
      const c = $('#lp-how'); if (c) c.scrollIntoView(); return;
    }
    if (h[0] === 'reset') return resetPassword();
    if (SECTIONS[h[0]]) { // a part of the home page: scroll there, then drop the "#/..." so the same link works again
      const was = !!$('.lp'); if (!was) home();
      const c = $(SECTIONS[h[0]]); history.replaceState(null, '', location.pathname + location.search);
      if (c) c.scrollIntoView({ behavior: was && !u.RM ? 'smooth' : 'auto' });
      return;
    }
    if (h[0] === 'draft' && h[1]) {
      if (!B.signedIn()) { u.toast('Sign in to open your drafts.'); location.hash = '#/account'; return; }
      try { const d = await B.getDraft(h[1]); if (!d || !KS.templates[d.t]) throw new Error('missing'); return editor(d.t, null, { id: h[1], data: d }); }
      catch (_) { u.toast('Could not open that draft.'); location.hash = '#/account'; return; }
    }
    if (h[0] === 'edit' && h[1]) {
      const rec = B.myPages().find(p => p.id === h[1]);
      if (!rec && !B.signedIn()) { u.toast('Sign in to edit your pages.'); location.hash = '#/account'; return; }
      try { const page = await B.getPage(h[1]); if (!page) throw new Error('missing'); return editor(page.t, { id: h[1], key: rec ? rec.key : '', page }); }
      catch (_) { u.toast('Could not load that page right now.'); location.hash = B.signedIn() ? '#/account' : '#/'; return; }
    }
    home();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    const q = new URLSearchParams(location.search);
    if (q.has('p')) return viewer(q.get('p'));
    if (q.has('preview')) return previewMode();
    u.font('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');
    document.body.classList.add('is-app');
    // coming back from an email link (confirm account, reset password)
    B.takeSessionFromUrl().then(r => {
      if (r && r.error) { u.toast(r.error); history.replaceState(null, '', location.pathname + location.search + '#/account'); }
      else if (r) history.replaceState(null, '', location.pathname + location.search + (r.type === 'recovery' ? '#/reset' : '#/account'));
    }, () => {}).then(() => { addEventListener('hashchange', route); route(); });
  }
  boot();
})();
