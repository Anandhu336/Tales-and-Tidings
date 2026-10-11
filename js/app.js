/* Tales & Tidings app: decides what to show.
     ?p=ID         -> a published page (what visitors see)
     ?preview=1    -> the live preview inside the builder
     otherwise     -> the builder (home, editor, publish)                                           */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el, $ = u.$, B = KS.backend;
  const IDS = ['garden', 'birthday', 'wedding', 'wedding-hindu', 'wedding-muslim', 'wedding-christian', 'wedding-modern', 'celestial'];
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
    addEventListener('message', async e => {
      const m = e.data; if (e.source !== parent || !m || m.type !== 'ks-render') return;
      const y = scrollY;
      try { await mountPage({ t: m.t, d: m.d, m: m.m }, { preview: !m.live }); if (!m.live) scrollTo(0, y); } catch (_) {}
    });
    parent.postMessage({ type: 'ks-ready' }, '*');
  }

  /* ---------------- builder ---------------- */
  const stripBlobs = v => JSON.parse(JSON.stringify(v, (k, x) => (u.isBlobUrl(x) ? '' : x)));
  const hasBlobs = v => JSON.stringify(v).includes('"blob:');
  let teardown = null;

  async function loadAll() { await Promise.all(IDS.map(id => KS.loadTemplate(id))); }

  function brand() {
    return el('div', { class: 'brand', html: '<svg viewBox="0 0 28 24" fill="none" stroke="#7b2d5b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="15" rx="2"/><path d="M2.6 7L12 14L21.4 7"/><path d="M12 19.2s-2.6-1.6-2.6-3.3c0-.9.7-1.5 1.4-1.5.5 0 .9.3 1.2.7.3-.4.7-.7 1.2-.7.7 0 1.4.6 1.4 1.5 0 1.7-2.6 3.3-2.6 3.3z" fill="#7b2d5b" stroke="none"/><path d="M24 1.5V5.5M22 3.5H26" stroke="#d9a441"/></svg>' }, el('span', { html: 'Tales <em>&amp;</em> Tidings' }));
  }

  /* ---------------- home (landing page) ---------------- */
  const LP_ICON = {
    wedding: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22C18 15 26 12 32 12S46 15 56 22"/><path d="M8 22H56V27H8Z"/><path d="M12 27V56M52 27V56M6 56H58"/><path d="M12 27C17 36 21 42 23 54M52 27C47 36 43 42 41 54"/><circle cx="32" cy="16" r="3.5"/><path d="M32 36C29 32 23 34 24 39C25 43 32 47 32 47S39 43 40 39C41 34 35 32 32 36Z"/></svg>',
    birthday: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 56V40C10 37 12 35 15 35H49C52 35 54 37 54 40V56"/><path d="M14 35V26H50V35"/><path d="M10 46C15 50 19 42 24 46S33 50 37 46 45 42 54 46"/><path d="M6 56H58M24 26V18M32 26V18M40 26V18"/><path d="M24 12C22 14 22 16 24 17C26 16 26 14 24 12ZM32 12C30 14 30 16 32 17C34 16 34 14 32 12ZM40 12C38 14 38 16 40 17C42 16 42 14 40 12Z"/></svg>',
    letter: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 24L32 8L56 24V54H8Z"/><path d="M8 24L32 40L56 24"/><path d="M32 30C29 26 23 28 24 33C25 37 32 41 32 41"/><path d="M32 30C35 26 41 28 40 33C39 37 32 41 32 41"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.5L11 15.5L16.5 9.5"/></svg>',
    step1: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="6" y="9" width="36" height="30" rx="3"/><path d="M6 17H42M6 34L17 24L26 32L32 27L42 35"/></svg>',
    step2: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="24" r="16"/><path d="M24 8V40M8 24H40M12.7 12.7L35.3 35.3M35.3 12.7L12.7 35.3"/><circle cx="24" cy="24" r="6" fill="currentColor" fill-opacity=".2"/></svg>',
    step3: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M38 26V40H8V10H22"/><path d="M33 6L42 15L24 33H15V24Z"/></svg>',
    step4: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="24" r="5"/><circle cx="36" cy="11" r="5"/><circle cx="36" cy="37" r="5"/><path d="M16.5 21.5L31.5 13.5M16.5 26.5L31.5 34.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21S5 14.5 5 9.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };
  const OCCASIONS = { 'Wedding invitations': ['wedding', 'Wedding Invitations', 'Celebrate your love with elegant digital wedding invites.'], 'Letters and birthdays': ['birthday', 'Birthdays and Letters', 'Birthday surprises, love letters and heartfelt notes.'] };
  const FAQ = [
    ['Can I customise my digital invitation?', 'Yes. Change the names, dates, events, photos, colours, lettering and music. The preview updates as you type, so you see exactly what your guests will see.'],
    ['How do I share my invitation with guests?', 'When you publish, you get one short link. Send it on WhatsApp, by text or email, or post it on social media. It opens on any phone or computer.'],
    ['Do my guests need to sign up or install anything?', 'No. Guests just tap the link. There is nothing to download and no account to create.'],
    ['Can guests reply or send wishes?', 'Yes. Wedding designs include an RSVP form and a "Send Greetings" button. Replies arrive on your WhatsApp.'],
    ['Can I add music, a video or a live stream?', 'Yes. Pick one of our songs, upload your own or paste a YouTube link. Wedding designs also take a YouTube video and a live-stream link.'],
    ['Can I edit it after publishing?', 'Yes. Your pages are listed on this home screen on the device you made them on. Open one, make changes and publish again.']
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

  function home() {
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.title = 'Tales & Tidings: stories and invitations for the people you love'; document.body.className = 'is-app is-lp'; window.scrollTo(0, 0);
    u.font('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700&display=swap');
    const mine = B.myPages();
    const go = sel => e => { if (e) e.preventDefault(); const t = document.querySelector(sel); if (t) t.scrollIntoView({ behavior: u.RM ? 'auto' : 'smooth' }); };
    const card = id => { const T = KS.templates[id];
      return el('button', { class: 'tcard', type: 'button', onclick: () => { location.hash = '#/new/' + id; } },
        el('div', { class: 'thumb', html: T.thumb || '' }),
        el('div', { class: 'tinfo' }, el('h3', {}, T.name), el('p', {}, T.tagline), el('small', {}, T.for || ''), el('span', { class: 'go' }, 'Start with this →'))); };
    const groups = []; // templates can name a group; the home screen shows one heading and one grid per group
    IDS.forEach(id => { const g = KS.templates[id].group || ''; let x = groups.find(y => y.g === g); if (!x) groups.push(x = { g, ids: [] }); x.ids.push(id); });
    groups.sort((a, b) => (b.g === 'Wedding invitations') - (a.g === 'Wedding invitations')); // invitations lead on the landing page
    const gid = i => 'grp-' + i;
    const sections = groups.map((x, i) => el('section', { class: 'grp', id: gid(i) }, x.g ? el('h2', {}, x.g) : null, el('div', { class: 'cards' }, x.ids.map(card))));
    const checks = list => el('ul', { class: 'lp-checks' }, list.map(t => el('li', { html: LP_ICON.check }, t)));
    const h2 = (a, b, c) => el('h2', { class: 'lp-h2', html: `${a}<br>${b ? `<b>${b}</b>` : ''}${c || ''}` });
    const createBtn = () => el('a', { class: 'lp-btn', href: '#lp-collection', onclick: go('#lp-collection') }, 'Create Now');
    const device = (cls, id) => el('div', { class: 'lp-dev ' + cls }, el('div', { class: 'scr', html: (KS.templates[id] || {}).thumb || '' }));

    /* live phone preview in the hero: the Celestial design playing its sample */
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
        const w = pv.contentWindow; if (!w || !heroOn || document.hidden) return;
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
      el('div', { class: 'lp-strip' }, el('div', { class: 'lp-in' }, el('span', {}, 'Stories and invitations for the people you love'),
        el('nav', {}, el('a', { href: '#lp-how', onclick: go('#lp-how') }, 'How it works'), el('a', { href: '#lp-faq', onclick: go('#lp-faq') }, 'FAQ')))),
      el('header', { class: 'lp-nav' }, el('div', { class: 'lp-in' }, brand(),
        el('nav', {}, el('a', { href: '#lp-collection', onclick: go('#lp-collection') }, 'Invitations'), mine.length ? el('a', { href: '#lp-mine', onclick: go('#lp-mine') }, 'My pages') : null,
          el('a', { href: '#lp-faq', onclick: go('#lp-faq'), class: 'hide-s' }, 'FAQ'), createBtn()))),

      el('section', { class: 'lp-hero' }, el('div', { class: 'lp-in' },
        el('div', { class: 'lp-copy' },
          el('h1', { class: 'lp-rot', 'aria-live': 'polite' }, el('span', { html: HEADLINES[0] })),
          el('p', {}, 'Create elegant, fully customisable e-invites with your photos, venues, countdown and music. Share one link that opens beautifully on every phone.'),
          el('div', { class: 'lp-cta' }, createBtn(), el('a', { class: 'lp-link', href: '#lp-collection', onclick: go('#lp-collection') }, 'View Invitations')),
          el('p', { class: 'lp-quote' }, el('span', {}, '“' + QUOTES[0][0] + '”', el('cite', {}, QUOTES[0][1]))),
          B.configured() ? null : el('div', { class: 'notice', html: '<b>Publishing is not switched on yet.</b> You can design and preview everything now. To share pages, connect a free Supabase project: open <code>SETUP.md</code> in this folder and follow the steps.' })),
        el('div', { class: 'lp-art' }, el('div', { class: 'lp-blob' }), ['a', 'b', 'c', 'd', 'e', 'f'].map(k => el('i', { class: 'lp-spark ' + k }, '✦')),
          el('div', { class: 'lp-phone' }, el('i', { class: 'notch' }), el('div', { class: 'scr' }, pv)),
          el('div', { class: 'lp-chip', html: `<span>${LP_ICON.pin}</span>Find your venue<br>with maps` })))),

      el('section', { class: 'lp-stats' }, el('div', { class: 'lp-in' },
        [[String(IDS.length), 'Designs to choose from'], ['Free', 'To create and preview'], ['1', 'Link to share anywhere'], ['0', 'Apps for guests to install'], ['Any', 'Language and script']]
          .map(([n, l]) => el('div', {}, el('b', { 'data-n': /^\d+$/.test(n) ? n : null }, n), el('span', {}, l))))),

      el('section', { class: 'lp-sec' }, el('div', { class: 'lp-in' }, h2('Find the Perfect', 'Invitation', ' for Every Occasion'),
        el('div', { class: 'lp-occ' }, groups.map((x, i) => { const o = OCCASIONS[x.g] || ['letter', x.g || 'More designs', ''];
          return el('a', { href: '#' + gid(i), onclick: go('#' + gid(i)) }, el('span', { html: LP_ICON[o[0]] }), el('h3', {}, o[1]), el('p', {}, o[2]), el('small', {}, x.ids.length + (x.ids.length === 1 ? ' design' : ' designs'))); })))),

      el('section', { class: 'lp-sec lp-split' }, el('div', { class: 'lp-in' },
        el('div', {}, el('h2', { class: 'lp-h2 left', html: 'Features That<br>Make Your <b>Invitations</b><br>Truly Unforgettable' }),
          el('p', { class: 'lp-p' }, 'Make your day unforgettable with interactive invitation features. From the couple\'s profiles to live streaming, everything brings your celebration closer to your guests, wherever they are.'),
          checks(['Bride and groom profiles', 'Photo gallery', 'Venue location maps', 'Event date countdown', 'RSVP and wishes on WhatsApp', 'YouTube video or live stream', 'Background music', 'Easy social sharing']), createBtn()),
        el('div', { class: 'lp-devs' }, el('div', { class: 'lp-circle blue' }), device('tab', showId), device('ph', 'wedding-hindu')))),

      el('div', { class: 'lp-marq', 'aria-hidden': 'true' }, el('div', {}, [0, 1].map(() => el('span', { html: ['Photo Gallery', 'Venue Map', 'Countdown', 'Music', 'RSVP', 'Live Stream'].map(w => `${w}<i>*</i>`).join('') })))),

      el('section', { class: 'lp-coll', id: 'lp-collection' }, el('div', { class: 'lp-panel' },
        h2('Discover Our', '', 'Collection of <b>Elegant</b> E-invites'), sections,
        el('div', { class: 'lp-cta2' }, el('p', {}, 'Browse, customise and share a stunning invitation in minutes.'), createBtn()))),

      mine.length ? el('section', { class: 'lp-sec mine', id: 'lp-mine' }, el('div', { class: 'lp-in' }, el('h2', { class: 'lp-h2' }, 'Your pages'), mine.map(p => myRow(p)))) : null,

      el('section', { class: 'lp-steps', id: 'lp-how' }, el('div', { class: 'lp-in' },
        [['Choose a Template', 'Pick a wedding, birthday or letter design you love.'], ['Personalise', 'Add your names, words, colours and a song.'], ['Add Event Details', 'Enter venues, dates, timings, photos and notes.'], ['Share Instantly', 'Publish and send one link on WhatsApp, email or social media.']]
          .map(([t, d], i) => el('div', {}, el('span', { class: 'ic', html: LP_ICON['step' + (i + 1)] }, el('em', {}, '0' + (i + 1))), el('h3', {}, t), el('p', {}, d))))),

      el('section', { class: 'lp-sec lp-split rev' }, el('div', { class: 'lp-in' },
        el('div', { class: 'lp-devs' }, el('div', { class: 'lp-circle pink' }), device('tab', 'wedding'), device('ph', 'birthday')),
        el('div', {}, el('h2', { class: 'lp-h2 left', html: 'Reasons to Go<br>Digital with <b>Tales &amp; Tidings</b>' }),
          el('p', { class: 'lp-p' }, 'Digital invitations are the modern, simple way to announce your day. They save time and money, and reach every guest instantly. With music, wishes and maps, your invite becomes more than a card: it is a little celebration of its own.'),
          checks(['Eco-friendly and paperless', 'No printing or postage costs', 'Easy to share on WhatsApp and social media', 'Guests can reply and send wishes instantly', 'Fully customisable with photos, music and themes']), createBtn()))),

      reviewsSection(h2),

      el('section', { class: 'lp-sec', id: 'lp-faq' }, el('div', { class: 'lp-in narrow' }, h2('Things You', '', 'Might Want to <b>Know</b>'),
        el('div', { class: 'lp-faq' }, FAQ.map(([q, a], i) => el('details', {}, el('summary', { html: `<b>Q${i + 1}:</b> ${u.esc(q)}` }), el('p', {}, a)))),
        el('div', { class: 'lp-cta2' }, el('p', {}, 'Browse, customise and share a stunning invitation in minutes.'), createBtn()))),

      el('footer', { class: 'lp-foot' }, el('div', { class: 'lp-in' },
        el('div', {}, brand(), el('p', {}, 'Share your tales, send your tidings. Wedding invitations, birthday surprises and heartfelt letters for the people you love, shared with one link.')),
        el('div', {}, el('h4', {}, 'Invitations'), groups.map((x, i) => el('a', { href: '#' + gid(i), onclick: go('#' + gid(i)) }, x.g || 'Designs'))),
        el('div', {}, el('h4', {}, 'Help'), el('a', { href: '#lp-how', onclick: go('#lp-how') }, 'How it works'), el('a', { href: '#lp-faq', onclick: go('#lp-faq') }, 'FAQ'))),
        el('div', { class: 'lp-copyr' }, el('div', { class: 'lp-in' }, '© ' + new Date().getFullYear() + ' Tales & Tidings. Share your tales, send your tidings.')))));
    lpMotion();
  }

  /* landing page motion: things fade up as they scroll in (siblings one after another) and the numbers count up */
  function lpMotion() {
    const root = $('.lp'); if (!root) return;
    /* headline and quote take turns: fade out, swap, fade in */
    const swap = (box, i, html) => { const sp = box.firstElementChild; sp.classList.add('out'); setTimeout(() => { if (typeof html === 'string') sp.innerHTML = html; else { sp.textContent = ''; sp.append(...html); } sp.classList.remove('out'); }, 450); };
    const h1 = $('.lp-rot', root), qt = $('.lp-quote', root); let hi = 0, qi = 0;
    lpTimers.push(setInterval(() => { if (document.hidden) return; hi = (hi + 1) % HEADLINES.length; swap(h1, hi, HEADLINES[hi]); }, 4800));
    lpTimers.push(setInterval(() => { if (document.hidden) return; qi = (qi + 1) % QUOTES.length; swap(qt, qi, ['“' + QUOTES[qi][0] + '”', el('cite', {}, QUOTES[qi][1])]); }, 7000));
    /* reviews glide one card at a time, pausing while someone is reading */
    const track = $('.lp-revs', root);
    if (track && track.children.length > 1 && !u.RM) {
      let hold = false; ['mouseenter', 'focusin', 'touchstart'].forEach(ev => track.addEventListener(ev, () => { hold = true; }, { passive: true }));
      ['mouseleave', 'focusout'].forEach(ev => track.addEventListener(ev, () => { hold = false; }));
      lpTimers.push(setInterval(() => { if (hold || document.hidden) return; const c = track.firstElementChild, w = c.offsetWidth + 24;
        track.scrollTo({ left: track.scrollLeft + w > track.scrollWidth - track.clientWidth + 4 ? 0 : track.scrollLeft + w, behavior: 'smooth' }); }, 4500));
    }
    const hero = $('.lp-hero', root);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroVisible(es[0].isIntersecting); }).observe(hero);
    }
    if (u.RM || !('IntersectionObserver' in window)) return;
    const groups = ['.lp-sec .lp-h2', '.lp-coll .lp-h2', '.lp-occ > a', '.lp-split .lp-in > *', '.lp-checks li', '.lp-panel .tcard', '.lp-cta2', '.lp-steps .lp-in > div', '.lp-faq details', '.lp-reviews .lp-h2', '.lp-revs', '.lp-ig', '.lp-foot > .lp-in > div', '.lp-stats .lp-in > div', '.lp .mrow'];
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

  async function editor(tplId, editing) {
    await loadAll();
    const T = KS.templates[tplId]; if (!T) return (location.hash = '#/');
    if (teardown) { teardown(); teardown = null; }
    unmount(); document.body.className = 'is-app'; window.scrollTo(0, 0); document.title = 'Editing: ' + T.name;

    const blankMusic = () => Object.assign({ type: 'none', id: '', src: '', name: '' }, u.clone(T.defaultMusic || {}));
    const draftKey = 'ks.draft.' + T.id;
    let data, music, restored = false;
    if (editing) { data = Object.assign(u.clone(T.sample), editing.page.d || {}); music = Object.assign(blankMusic(), editing.page.m || {}); }
    else {
      try { const dr = JSON.parse(localStorage.getItem(draftKey) || 'null'); if (dr && dr.d) { data = Object.assign(u.clone(T.sample), dr.d); music = Object.assign(blankMusic(), dr.m || {}); restored = true; } } catch (_) {}
      if (!data) { data = u.clone(T.sample); music = blankMusic(); }
    }

    if (T.migrate) T.migrate(data); // lets a template upgrade fields saved by an older version

    /* preview iframe */
    let ready = false, live = false, timer = 0, saveT = 0;
    const iframe = el('iframe', { src: location.pathname + '?preview=1', title: 'Preview' });
    const send = () => { if (ready && !live) iframe.contentWindow.postMessage({ type: 'ks-render', t: T.id, d: data, m: music, live: false }, '*'); };
    const onMsg = e => { if (e.source === iframe.contentWindow && e.data && e.data.type === 'ks-ready') { ready = true; send(); } };
    addEventListener('message', onMsg);
    const changed = () => {
      clearTimeout(timer); timer = setTimeout(send, 220);
      if (!editing) { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify({ d: stripBlobs(data), m: stripBlobs(music) })); } catch (_) {} }, 700); }
    };

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
    const root = el('div', { class: 'ed', 'data-tab': 'edit' },
      el('div', { class: 'ed-top' },
        el('button', { type: 'button', class: 'btn ghost', onclick: () => { if (confirm('Leave the editor? Your work is saved as a draft on this device (photos and songs will need adding again).')) location.hash = '#/'; } }, '← Back'),
        el('div', { class: 'ttl' }, T.name, el('small', {}, editing ? 'editing a published page' : 'draft saved automatically')), tabs, pubBtn),
      el('div', { class: 'ed-main' },
        el('div', { class: 'ed-form' },
          restored ? el('div', { class: 'draftbar' }, el('span', {}, 'Restored your last draft.'), el('button', { class: 'link', type: 'button', onclick: () => { try { localStorage.removeItem(draftKey); } catch (_) {} editor(tplId); } }, 'Start over')) : null,
          formHost, el('details', { class: 'sec' }, el('summary', {}, 'Music'), el('div', { class: 'secbody' }, musicHost))),
        el('div', { class: 'ed-pv' }, el('div', { class: 'pvbar' }, dev, liveBtn, el('button', { class: 'btn ghost', type: 'button', onclick: () => { ready && (live = false, liveBtn.textContent = '▶ Play as a visitor', send()); } }, '↻ Refresh')), el('div', { class: 'pvstage' }, frame))));
    app().textContent = ''; app().append(root);

    KS.buildEditor(formHost, T.schema, data, changed);
    const me = KS.buildMusicEditor(musicHost, music, changed);
    teardown = () => { removeEventListener('message', onMsg); clearTimeout(timer); clearTimeout(saveT); me.stop(); };

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

      const bar = el('i'), msg = el('p', {}, 'Getting things ready…');
      show(el('h2', {}, editing ? 'Saving your page…' : 'Publishing…'), msg, el('div', { class: 'bar' }, bar));
      try {
        const id = editing ? editing.id : B.newId(), key = editing ? editing.key : B.newKey();
        const out = await B.uploadBlobs(payload, id, (d, n) => { msg.textContent = n ? 'Uploading photos and music (' + d + ' of ' + n + ')…' : 'Saving…'; bar.style.width = (n ? Math.round(d / n * 80) : 30) + '%'; });
        if (JSON.stringify(out).length > 280000) throw new Error('There is too much text on this page. Try shortening it.');
        msg.textContent = 'Saving…'; bar.style.width = '92%';
        if (editing) await B.updatePage(id, key, out); else await B.createPage(id, key, out);
        bar.style.width = '100%';
        B.rememberPage({ id, key, t: T.id, title: T.title ? T.title(out.d) : T.name, created: Date.now() });
        if (!editing) { try { localStorage.removeItem(draftKey); } catch (_) {} editing = { id, key, page: out }; pubBtn.textContent = 'Save changes'; }
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
            el('button', { class: 'btn ghost', type: 'button', onclick: () => { close(); location.hash = '#/'; } }, 'Done')),
          el('p', { class: 'help', style: 'margin-top:14px' }, 'You can come back and fix or change anything from "Your pages" on the home screen, on this device.'));
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
    if (h[0] === 'edit' && h[1]) {
      const rec = B.myPages().find(p => p.id === h[1]);
      if (!rec) { u.toast('You can only edit pages made on this device.'); location.hash = '#/'; return; }
      try { const page = await B.getPage(rec.id); if (!page) throw new Error('missing'); return editor(page.t, { id: rec.id, key: rec.key, page }); }
      catch (_) { u.toast('Could not load that page right now.'); location.hash = '#/'; return; }
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
    addEventListener('hashchange', route);
    route();
  }
  boot();
})();
