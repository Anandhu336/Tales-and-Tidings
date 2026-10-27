/* Blooms by Bincy home: the photo banner at the top, the category icons, the colour-story chips,
   the sort menu, the bouquet grid and the wedding-date checker. Everything comes from blooms/shop-data.js.
   Needs js/site.js first (BloomsSite). */
(function () {
  'use strict';
  const S = window.BLOOMS || {};
  const { esc, rupees, orderLink, waLink, ASSETS } = window.BloomsSite;
  const $ = id => document.getElementById(id);
  const products = S.products || [];
  const no = n => 'No. ' + String(n).padStart(2, '0');
  const dots = cs => '<span class="bb-dots">' + (cs || []).map(c => '<span style="background:' + esc(c) + '"></span>').join('') + '</span>';
  const price = p => 'From ' + rupees(p.price) + (p.per ? ' <small>' + esc(p.per) + '</small>' : '');
  const ext = ' target="_blank" rel="noopener"';

  /* ---------- the big photos at the top ---------- */
  const slides = S.heroSlides || [];
  const wide = name => ASSETS + 'photos/' + name + '-wide-800.jpg 800w, ' + ASSETS + 'photos/' + name + '-wide-1600.jpg 1600w';
  // the page starts with the bride photo (so it shows at once); if shop-data.js lists a different first photo, use that
  const firstImg = document.querySelector('.bb-hero-photos > img');
  if (firstImg && slides[0]) {
    if (!firstImg.src.includes('/' + slides[0].image + '-wide-')) {
      firstImg.srcset = wide(slides[0].image);
      firstImg.src = ASSETS + 'photos/' + slides[0].image + '-wide-800.jpg';
      firstImg.alt = slides[0].alt || '';
    }
    if (slides[0].focus) firstImg.style.objectPosition = slides[0].focus;
  }
  heroShow();

  /* more than one photo: fade between them every 6 seconds. The first photo is already in the page (it loads first);
     the others are added here. Waits while the tab is hidden or the photo is off screen; still for "reduce motion". */
  function heroShow() {
    const frame = document.querySelector('.bb-hero-photos'); if (!frame || slides.length < 2) return;
    const first = frame.querySelector('img');
    const imgs = [first].concat(slides.slice(1).map(s => {
      const img = document.createElement('img');
      img.className = 'bb-slide'; img.alt = s.alt || ''; img.width = 1600; img.height = 1000; img.loading = 'lazy'; img.decoding = 'async';
      img.src = ASSETS + 'photos/' + s.image + '-wide-800.jpg';
      img.srcset = wide(s.image);
      img.sizes = '100vw';
      if (s.focus) img.style.objectPosition = s.focus;
      img.setAttribute('aria-hidden', 'true');
      return img;
    }));
    // put the added photos right after the first one, in order
    imgs.slice(1).reverse().forEach(img => first.after(img));
    const nav = document.createElement('div');
    nav.className = 'bb-slide-dots';
    nav.innerHTML = slides.map((s, i) => '<button type="button" aria-label="Photo ' + (i + 1) + ' of ' + slides.length + '"' + (i ? '' : ' aria-current="true"') + '></button>').join('');
    frame.append(nav);
    let at = 0, seen = true, timer = 0;
    const show = i => {
      const was = imgs[at]; at = (i + slides.length) % slides.length; if (was === imgs[at]) return;
      // the old photo stays visible underneath while the new one fades in on top, then steps away
      imgs.forEach(img => img.classList.remove('was-on'));
      was.classList.add('was-on'); setTimeout(() => was.classList.remove('was-on'), 1300);
      imgs.forEach((img, k) => { img.classList.toggle('is-on', k === at); img.setAttribute('aria-hidden', String(k !== at)); });
      nav.querySelectorAll('button').forEach((b, k) => b.toggleAttribute('aria-current', k === at));
    };
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => { clearInterval(timer); if (!still) timer = setInterval(() => { if (seen && !document.hidden) show(at + 1); }, 6000); };
    nav.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; show([...nav.children].indexOf(b)); start(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(frame);
    start();
  }

  /* ---------- what is showing ---------- */
  const q = new URLSearchParams(location.search);
  const state = { cat: q.get('cat') || 'all', story: q.get('colour') || '', sort: 'featured' };

  /* category icons */
  const cats = $('bb-cats');
  cats.innerHTML = (S.categories || []).map(c =>
    '<button class="bb-cat" type="button" data-cat="' + esc(c.id) + '" aria-pressed="false">' +
    '<img src="' + ASSETS + 'icons/' + esc(c.icon) + '" alt="" width="84" height="84"><span>' + esc(c.name) + '</span></button>').join('');
  cats.addEventListener('click', e => { const b = e.target.closest('.bb-cat'); if (!b) return; state.cat = b.dataset.cat; draw(); });

  /* colour-story chips: tap again to show every colour */
  const stories = $('bb-stories');
  stories.insertAdjacentHTML('beforeend', (S.colourStories || []).map(s =>
    '<button class="bb-pal" type="button" data-story="' + esc(s.id) + '" aria-pressed="false">' + dots(s.colours) + esc(s.name) + '</button>').join(''));
  stories.addEventListener('click', e => { const b = e.target.closest('.bb-pal'); if (!b) return; state.story = state.story === b.dataset.story ? '' : b.dataset.story; draw(); });

  $('bb-sort').addEventListener('change', e => { state.sort = e.target.value; draw(); });

  const SORTS = {
    featured: (a, b) => a.no - b.no,
    'price-asc': (a, b) => a.price - b.price || a.no - b.no,
    'price-desc': (a, b) => b.price - a.price || a.no - b.no,
    newest: (a, b) => b.no - a.no
  };

  function card(p) {
    const href = orderLink(p);
    const media = p.image
      ? '<img src="' + ASSETS + 'photos/' + esc(p.image) + '-400.jpg" srcset="' + ASSETS + 'photos/' + esc(p.image) + '-400.jpg 400w, ' + ASSETS + 'photos/' + esc(p.image) + '-800.jpg 800w" sizes="(min-width: 981px) 280px, 46vw" width="400" height="500" loading="lazy" alt="' + esc(p.alt || p.name) + '">'
      : '<img class="bb-illus" src="' + ASSETS + 'illus/' + esc(p.illus) + '" width="400" height="400" loading="lazy" alt="Drawing of the ' + esc(p.name) + '"><span class="bb-soon">Photo coming soon</span>';
    return '<li class="bb-card"><a class="bb-card-media" href="' + href + '"' + ext + ' tabindex="-1" aria-hidden="true">' + (p.tag ? '<span class="bb-tag">' + esc(p.tag) + '</span>' : '') + media + '</a>' +
      '<div class="bb-card-body"><p class="bb-no">' + no(p.no) + ' · ' + esc(p.label) + '</p><h3>' + esc(p.name) + '</h3>' + dots(p.colours) +
      '<p class="bb-price">' + price(p) + '</p><a class="bb-view" href="' + href + '"' + ext + '>View &amp; personalise <span aria-hidden="true">→</span><span class="bb-sr"> the ' + esc(p.name) + '</span></a></div></li>';
  }

  function draw() {
    cats.querySelectorAll('.bb-cat').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
    stories.querySelectorAll('.bb-pal').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.story === state.story)));
    const list = products
      .filter(p => state.cat === 'all' || p.category === state.cat)
      .filter(p => !state.story || (p.stories || []).includes(state.story))
      .sort(SORTS[state.sort] || SORTS.featured);
    $('bb-grid').innerHTML = list.map(card).join('');
    $('bb-empty').hidden = list.length > 0;
  }
  draw();

  /* ---------- wedding date checker ----------
     Rules from shop-data.js: leadDays (book at least this many days ahead) and blockedDates.
     When the orders database arrives, only isOpen() needs to change. */
  const lead = S.leadDays || 14;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const nice = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  function isOpen(s) {
    const days = Math.round((new Date(s + 'T00:00:00') - today()) / 864e5);
    if (days < 0) return 'past';
    if (days < lead) return 'soon';
    if ((S.blockedDates || []).includes(s)) return 'full';
    return 'open';
  }
  const input = $('bb-date'), out = $('bb-date-result');
  input.min = iso(today());
  $('bb-date-note').textContent = 'Please book at least ' + (lead % 7 === 0 ? lead / 7 + ' weeks' : lead + ' days') + ' before your wedding.';
  $('bb-date-form').addEventListener('submit', e => {
    e.preventDefault();
    const s = input.value;
    if (!s) { out.hidden = false; out.textContent = 'Please choose your wedding date first.'; input.focus(); return; }
    const when = nice(s), r = isOpen(s);
    const wa = text => ' <a href="' + waLink(text) + '"' + ext + '>';
    out.hidden = false; out.className = 'bb-date-result is-' + r;
    out.innerHTML = r === 'open' ? '<b>Good news, ' + esc(when) + ' is open.</b>' + wa('Hello Blooms by Bincy! I would like to book a bouquet for my wedding on ' + when + '.') + 'Message Bincy on WhatsApp</a> to hold it.'
      : r === 'full' ? '<b>Sorry, ' + esc(when) + ' is fully booked.</b>' + wa('Hello Blooms by Bincy! My wedding is on ' + when + '. Is there any way you could fit in one more bouquet?') + 'Ask Bincy on WhatsApp</a>, she may still be able to help.'
      : r === 'soon' ? '<b>' + esc(when) + ' is less than ' + lead + ' days away.</b>' + wa('Hello Blooms by Bincy! My wedding is soon, on ' + when + '. Could you still make a bouquet?') + 'Message Bincy on WhatsApp</a> and she will see what she can do.'
      : 'That date has already passed. Please choose your wedding date.';
  });

  /* arriving from a footer link like ?cat=cascade#shop: the browser scrolls before the grid exists, so scroll again */
  if (location.hash === '#shop' && q.get('cat')) requestAnimationFrame(() => $('shop').scrollIntoView());
})();
