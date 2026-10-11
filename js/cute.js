/* Tales & Tidings cute kit: shared by the playful designs (Will you go out with me?, I'm sorry, Little love quest).
   Colour themes with custom colours, cute fonts, the little guide with a speech bubble, and heart confetti. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, esc = u.esc;
  const C = KS.cute = {};

  /* ---------- colours ---------- */
  const rgb = c => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').trim()); return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : null; };
  const hex = a => '#' + a.map(v => Math.round(u.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return x && y ? hex(x.map((v, i) => v + (y[i] - v) * t)) : a; };
  const alpha = (c, a) => { const x = rgb(c); return x ? `rgba(${x.join(',')},${a})` : c; };
  const T = (l, bg1, bg2, ink, pop, more) => Object.assign({ l, bg1, bg2, ink, pop, card: '#ffffff' }, more || {});
  C.THEMES = {
    strawberry: T('Strawberry milk', '#fff4f6', '#ffd7e0', '#5a1a2b', '#ff5277'),
    pink:       T('Bubblegum', '#fff0f6', '#ffcfe3', '#4a1630', '#ff3d8b'),
    lavender:   T('Lavender', '#f8f4ff', '#e3d8ff', '#352457', '#8f6bff'),
    peach:      T('Peach', '#fff7ef', '#ffd9c2', '#4a2614', '#ff7a45'),
    honey:      T('Honey', '#fffaec', '#ffe3ad', '#4d3210', '#f28c00'),
    lemon:      T('Lemonade', '#fffde8', '#fff1a6', '#45400f', '#e0a800'),
    mint:       T('Mint', '#f1fdf8', '#cdf2e1', '#123e33', '#14a277'),
    sky:        T('Baby blue', '#f2f9ff', '#cfe7ff', '#14304d', '#2f8cff'),
    coral:      T('Coral', '#fff5f2', '#ffd3c9', '#4f1d14', '#ff5a4e'),
    grape:      T('Grape soda', '#fbf3ff', '#efd2ff', '#3b1450', '#b23cff'),
    night:      T('Starry night', '#2c1b4a', '#140d26', '#fff6ff', '#ff7aa8', { card: '#2f2152', muted: '#cbb8ee' }),
    cocoa:      T('Hot cocoa', '#3a2620', '#1f1411', '#fff2e6', '#ff9f68', { card: '#4a312a', muted: '#d9b9a2' })
  };
  /* final colours for a page: the theme, plus any colours the maker picked */
  C.theme = (d, def) => {
    const t = Object.assign({}, C.THEMES[d.theme] || C.THEMES[def] || C.THEMES.strawberry);
    if (rgb(d.c_pop)) t.pop = d.c_pop;
    if (rgb(d.c_bg)) { t.bg2 = d.c_bg; t.bg1 = mix(d.c_bg, '#ffffff', .55); }
    if (rgb(d.c_ink)) t.ink = d.c_ink;
    const dark = (rgb(t.bg2) || [255, 255, 255]).reduce((a, b) => a + b, 0) < 300;
    if (rgb(d.c_bg)) t.card = dark ? mix(t.bg2, '#ffffff', .12) : '#ffffff';
    t.muted = t.muted && !rgb(d.c_ink) && !rgb(d.c_bg) ? t.muted : mix(t.ink, t.bg2, .42);
    t.pop2 = dark ? mix(t.pop, '#000000', .35) : mix(t.pop, '#ffffff', .62);
    t.dot = alpha(t.pop, dark ? .16 : .13);
    t.cols = [t.pop, mix(t.pop, '#ffffff', .5), '#ffd166', '#b28dff', '#5fd3c4', '#ff9a76'];
    return t;
  };
  C.vars = t => `--bg1:${t.bg1};--bg2:${t.bg2};--dot:${t.dot};--ink:${t.ink};--muted:${t.muted};--pop:${t.pop};--pop2:${t.pop2};--card:${t.card}`;

  /* ---------- fonts ---------- */
  const F = (l, fam, q, w, fb) => ({ l, fam, q, w, fb });
  C.TITLE_FONTS = {
    chewy: F('Chewy', 'Chewy', 'Chewy', 400, 'cursive'), fredoka: F('Fredoka', 'Fredoka', 'Fredoka:wght@600;700', 700, 'sans-serif'),
    baloo: F('Baloo', 'Baloo 2', 'Baloo+2:wght@700;800', 800, 'sans-serif'), pacifico: F('Pacifico', 'Pacifico', 'Pacifico', 400, 'cursive'),
    sniglet: F('Sniglet', 'Sniglet', 'Sniglet:wght@800', 800, 'sans-serif'), grand: F('Grandstander', 'Grandstander', 'Grandstander:wght@800', 800, 'sans-serif'),
    bubblegum: F('Bubblegum', 'Bubblegum Sans', 'Bubblegum+Sans', 400, 'cursive'), gummy: F('Sour Gummy', 'Sour Gummy', 'Sour+Gummy:wght@700', 700, 'sans-serif'),
    lobster: F('Lobster', 'Lobster', 'Lobster', 400, 'cursive'), gochi: F('Gochi Hand', 'Gochi Hand', 'Gochi+Hand', 400, 'cursive'),
    comfortaa: F('Comfortaa', 'Comfortaa', 'Comfortaa:wght@700', 700, 'sans-serif')
  };
  C.BODY_FONTS = {
    nunito: F('Nunito', 'Nunito', 'Nunito:wght@600;800', 800, 'system-ui,sans-serif'), fredoka: F('Fredoka', 'Fredoka', 'Fredoka:wght@500;600', 600, 'system-ui,sans-serif'),
    quicksand: F('Quicksand', 'Quicksand', 'Quicksand:wght@600;700', 700, 'system-ui,sans-serif'), comfortaa: F('Comfortaa', 'Comfortaa', 'Comfortaa:wght@600;700', 700, 'system-ui,sans-serif'),
    mali: F('Mali', 'Mali', 'Mali:wght@500;600', 600, 'system-ui,sans-serif'), itim: F('Itim', 'Itim', 'Itim', 400, 'system-ui,sans-serif'),
    patrick: F('Patrick Hand', 'Patrick Hand', 'Patrick+Hand', 400, 'cursive'), delius: F('Delius', 'Delius', 'Delius', 400, 'system-ui,sans-serif')
  };
  const fontUrl = list => 'https://fonts.googleapis.com/css2?' + [...new Set(list)].map(q => 'family=' + q).join('&') + '&display=swap';
  /* loads the chosen title + text fonts (and Caveat for handwriting); returns the CSS variables */
  C.fonts = (d, defT, defB) => {
    const t = C.TITLE_FONTS[d.titleFont] || C.TITLE_FONTS[defT] || C.TITLE_FONTS.chewy, b = C.BODY_FONTS[d.bodyFont] || C.BODY_FONTS[defB] || C.BODY_FONTS.nunito;
    u.font(fontUrl([t.q, b.q, 'Caveat:wght@700', 'Noto+Color+Emoji'])); // the emoji font matches the animated stickers' style
    return `--disp:'${t.fam}',${t.fb};--dw:${t.w};--body:'${b.fam}',${b.fb};--bw:${b.w};--hand:'Caveat',cursive`;
  };
  /* the builder shows every font in its own lettering */
  C.allFontsUrl = () => fontUrl([...Object.values(C.TITLE_FONTS), ...Object.values(C.BODY_FONTS)].map(f => f.q));

  /* ---------- builder fields ---------- */
  const CKEYS = ['c_pop', 'c_bg', 'c_ink'];
  C.lookFields = (defTheme, defT, defB) => [
    { key: 'theme', type: 'choice', label: 'Colours', resets: CKEYS, options: Object.entries(C.THEMES).map(([v, t]) => ({ v, l: t.l, c: `linear-gradient(135deg,${t.bg2} 50%,${t.pop} 50%)` })), default: defTheme },
    { key: 'c_pop', type: 'color', label: 'Main colour (buttons, titles)', default: d => C.theme(d, defTheme).pop },
    { key: 'c_bg', type: 'color', label: 'Background', default: d => C.theme(d, defTheme).bg2 },
    { key: 'c_ink', type: 'color', label: 'Text colour', default: d => C.theme(d, defTheme).ink },
    { type: 'reset', label: 'Back to the theme colours', keys: CKEYS },
    { key: 'titleFont', type: 'choice', label: 'Title lettering', fonts: true, options: Object.entries(C.TITLE_FONTS).map(([v, f]) => ({ v, l: f.l, f: `'${f.fam}',${f.fb}` })), default: defT },
    { key: 'bodyFont', type: 'choice', label: 'Text lettering', fonts: true, options: Object.entries(C.BODY_FONTS).map(([v, f]) => ({ v, l: f.l, f: `'${f.fam}',${f.fb}` })), default: defB }
  ];
  /* stickers a maker can pick as their guide */
  C.GUIDES = ['🐻', '🐱', '🐼', '🐇', '🐥', '🐣', '🐧', '🦊', '🐸', '🦄', '🦋', '🐌', '😺', '😸', '😻', '😽', '😼', '😹', '🙀', '😿', '🥺', '🥹', '🥰', '😍', '😊', '🤩', '🤭', '😏', '🫠', '😘', '💖', '💗', '💝', '💘', '💞', '🌸', '🍓', '🌈'];
  /* the sticker picker next to text boxes in the builder, by group (only stickers we have) */
  C.STICKER_GROUPS = [
    ['Cute', '🐻 🐱 🐼 🐇 🐕 🐥 🐣 🐧 🦊 🐸 🦄 🦋 🐌 🐾 😺 😸 😻 😽 😼 😹 🙀 😿 😾'],
    ['Faces', '🥺 🥹 🥰 😍 😊 😘 🤩 🤭 😏 😜 🫠 😳 😮 🤔 😤 😢 😭 🤗 🥳 🙈 🙏 👏'],
    ['Hearts', '💖 💗 💝 💘 💞 ❤️ 💔 🫶 🫂 💌 💯 ♾️ ✨ 🔥 🌹 🌸 💐 🌈'],
    ['Food', '🍿 🍕 🍔 🍜 🌮 🌯 🥗 🥞 🍓 🍦 🍩 🍪 🎂 🧋 ☕ 🍷 🍻'],
    ['Fun', '🎉 🎡 🎲 🎳 🎶 📸 📚 🌅 🌊 🚲 🚗 ✈️ 🔋']
  ].map(([l, e]) => [l, e.split(' ').filter(x => u.stkFile(x))]);
  C.guideFields = (def, linesLabel, linesHelp) => [
    { key: 'guide', type: 'sticker', label: 'Your little guide', options: C.GUIDES, default: def, help: 'An animated buddy who talks to them in a speech bubble.' },
    { key: 'guideLines', type: 'textarea', label: linesLabel || 'Things your guide says', rows: 4, help: linesHelp || 'One per line.' }
  ];

  /* "Page by page": for any page, a different guide, what the guide says there, and photos.
     pagesOf(data) -> [[id, label], ...] lists the pages this design currently has. */
  C.pageFields = pagesOf => {
    let names = {};
    const opts = d => { const l = pagesOf(d); names = Object.fromEntries(l); return l.map(([v, l2]) => ({ v, l: l2 })); };
    return [{ key: 'pages', type: 'repeater', label: '', max: 24, addLabel: 'Add something to a page', itemLabel: 'Page extra',
      title: i => [names[i.at] || '', i.caption || i.say || ''].filter(Boolean).join(' · '),
      blank: { at: '', guide: '', say: '', photo: '', caption: '' },
      help: 'Pick a page, then give it its own guide, change what the guide says there, or add a photo. Add as many as you like, even several photos on one page.',
      fields: [
        { key: 'at', type: 'choice', label: 'Which page', options: opts },
        { key: 'guide', type: 'sticker', label: 'Guide on this page', options: C.GUIDES, none: 'Same as main' },
        { key: 'say', type: 'text', label: 'What the guide says when this page opens (optional)', max: 90 },
        { key: 'photo', type: 'image', label: 'Photo on this page (optional)' },
        { key: 'caption', type: 'text', label: 'Photo caption (optional)', max: 60 }
      ] }];
  };
  /* what each page should show: { id: { guide, say, photos: [{src, cap}] } } */
  C.extras = d => {
    const m = {};
    (d.pages || []).forEach(x => {
      if (!x || !x.at) return;
      const e = m[x.at] = m[x.at] || { guide: '', say: '', photos: [] };
      if (!e.guide && x.guide) e.guide = x.guide;
      if (!e.say && (x.say || '').trim()) e.say = x.say.trim();
      if (x.photo) e.photos.push({ src: x.photo, cap: (x.caption || '').trim() });
    });
    return m;
  };
  /* drop each page's photos in under its title */
  C.placePhotos = (pageEl, ex) => {
    if (!ex || !ex.photos.length || !pageEl) return;
    const box = document.createElement('div'); box.className = 'k-photos' + (ex.photos.length > 1 ? ' two' : '');
    box.innerHTML = ex.photos.map((p, i) => `<figure class="k-photo" style="--r:${[-2.5, 2, -1, 3][i % 4]}deg"><img src="${esc(p.src)}" alt="${esc(p.cap || 'Photo')}" loading="lazy" decoding="async">${p.cap ? `<figcaption>${esc(p.cap)}</figcaption>` : ''}</figure>`).join('');
    const h = pageEl.querySelector('h1,h2');
    if (h) h.after(box); else pageEl.prepend(box);
  };

  /* ---------- shared styles ---------- */
  C.css = `
  .k-guide{display:flex;flex-direction:column;align-items:center;margin:0 0 10px}
  .k-bub{position:relative;background:var(--card);color:var(--ink);border-radius:22px;padding:12px 18px;font:var(--bw) clamp(16px,4.4vw,19px)/1.35 var(--body);max-width:330px;text-align:center;box-shadow:0 5px 0 var(--pop2);margin:0 0 16px}
  .k-bub::after{content:'';position:absolute;left:50%;bottom:-11px;width:22px;height:22px;background:var(--card);transform:translateX(-50%) rotate(45deg);border-radius:0 0 6px 0;box-shadow:4px 4px 0 var(--pop2)}
  .k-bub span{position:relative;z-index:1;display:block}
  .k-bub.pop{animation:kpop .4s cubic-bezier(.2,1.5,.4,1)}
  .k-pet{position:relative;width:clamp(108px,31vw,136px);aspect-ratio:1;animation:kbob 2.4s ease-in-out infinite}
  .k-pet>.stk{width:100%;height:100%;display:block}.k-pet>.stk-t{font-size:92px;line-height:1;display:block;text-align:center}
  .k-pet.pic{border-radius:50%;background:var(--card) center/cover no-repeat;border:4px solid var(--card);box-shadow:0 8px 0 var(--pop2)}
  .k-pet.pic>.stk,.k-pet.pic>.stk-t{position:absolute;right:-12px;bottom:-10px;width:56px;height:56px;font-size:42px;line-height:56px}
  .k-react{position:absolute;right:-28px;top:-8px;width:56px;height:56px;opacity:0;transform:scale(.3);pointer-events:none}
  .k-react .stk{width:100%;height:100%}.k-react .stk-t{font-size:42px}
  .k-react.on{animation:kreact 1.6s cubic-bezier(.2,1.4,.4,1) both}
  @keyframes kreact{0%{opacity:0;transform:scale(.3) rotate(-20deg)}15%{opacity:1;transform:scale(1.1) rotate(8deg)}25%{transform:scale(1) rotate(0)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.6) translateY(-10px)}}
  @keyframes kbob{50%{transform:translateY(-7px) rotate(-2deg)}}
  @keyframes kpop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
  .k-pet>.stk.swap,.k-pet>.stk-t.swap{animation:kswap .5s cubic-bezier(.2,1.5,.4,1)}
  @keyframes kswap{0%{transform:scale(.2) rotate(-25deg);opacity:0}100%{transform:none;opacity:1}}
  .k-photos{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin:2px 0 22px;width:100%}
  .k-photo{margin:0;background:#fff;padding:10px 10px 8px;border-radius:6px;box-shadow:0 10px 24px rgba(0,0,0,.14);transform:rotate(var(--r));max-width:min(80vw,300px);animation:kpop .5s cubic-bezier(.2,1.4,.4,1) both}
  .k-photos.two .k-photo{max-width:min(42vw,220px)}
  .k-photo img{display:block;width:100%;height:auto;max-height:44vh;object-fit:cover;border-radius:3px}
  .k-photo figcaption{font:700 clamp(19px,5vw,23px)/1.2 var(--hand);color:#3b2a1a;padding:8px 2px 2px;text-align:center}
  /* emoji with no animated version still move: a gentle bounce and wiggle */
  .stk.still{transform-origin:50% 85%;animation:kemo 2.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.37s)}
  .stk-t{display:inline-block;font-family:'Noto Color Emoji',sans-serif;font-style:normal;transform-origin:50% 85%;animation:kemo 2.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.37s)}
  @keyframes kemo{0%,100%{transform:translateY(0) rotate(0) scale(1)}20%{transform:translateY(-8%) rotate(-7deg) scale(1.06)}40%{transform:translateY(0) rotate(0) scale(.98)}60%{transform:translateY(-4%) rotate(6deg) scale(1.04)}80%{transform:translateY(0) rotate(0) scale(1)}}
  .k-conf{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60}
  .ks-credit{font:600 10px var(--body);color:var(--muted);opacity:.7;margin:26px 0 0}.ks-credit a{color:inherit}
  .is-static .k-pet{animation:none}
  @media(prefers-reduced-motion:reduce){.k-pet,.k-bub.pop,.k-react.on,.stk-t,.stk.still{animation:none}}`;

  /* ---------- the little guide ---------- */
  C.guide = (pet, first, photo) => {
    const el = document.createElement('div'); el.className = 'k-guide';
    el.innerHTML = `<div class="k-bub" aria-live="polite"><span>${esc(first || '')}</span></div><div class="k-pet${photo ? ' pic' : ''}"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${u.stk(pet)}<div class="k-react"></div></div>`;
    const bub = el.firstChild, react = el.querySelector('.k-react'), petEl = el.querySelector('.k-pet');
    let cur = pet;
    return {
      el,
      /* switch to another sticker (a page can have its own guide) */
      setPet(e) {
        e = e || pet; if (e === cur) return; cur = e;
        const old = petEl.querySelector(':scope>.stk,:scope>.stk-t'); const t = document.createElement('span'); t.innerHTML = u.stk(e);
        const n = t.firstChild; n.classList.add('swap'); if (old) old.replaceWith(n); else petEl.prepend(n);
      },
      say(t, re) {
        bub.innerHTML = `<span>${esc(t)}</span>`; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop');
        if (re) { react.innerHTML = u.stk(re); react.classList.remove('on'); void react.offsetWidth; react.classList.add('on'); }
      }
    };
  };

  /* ---------- confetti with little hearts ---------- */
  C.confetti = (cv, cols) => {
    const cx = cv.getContext('2d'); let parts = [], raf = 0, W = 0, H = 0, D = 1, dead = false;
    const fit = () => { D = u.dpr(); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; };
    fit(); const off = u.onResize(fit);
    const heart = s => { const h = s / 2; cx.beginPath(); cx.moveTo(0, h * .7); cx.bezierCurveTo(-h * 1.7, -h * .4, -h * .5, -h * 1.5, 0, -h * .4); cx.bezierCurveTo(h * .5, -h * 1.5, h * 1.7, -h * .4, 0, h * .7); cx.fill(); };
    function step() {
      cx.setTransform(D, 0, 0, D, 0, 0); cx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.vy += .2; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
        if (p.y > H + 30 || p.life > 230) { parts.splice(i, 1); continue; }
        const c = Math.cos(p.rot) * D, s = Math.sin(p.rot) * D;
        cx.setTransform(c, s, -s, c, p.x * D, p.y * D); cx.globalAlpha = Math.min(1, (230 - p.life) / 50); cx.fillStyle = p.c;
        if (p.t === 0) heart(p.s * 1.3); else if (p.t === 1) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 6.283); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      }
      cx.setTransform(D, 0, 0, D, 0, 0); cx.globalAlpha = 1;
      raf = parts.length && !dead ? requestAnimationFrame(step) : 0;
      if (!parts.length) cx.clearRect(0, 0, W, H);
    }
    const burst = (x, y, n) => {
      if (u.RM || dead) return; n = Math.round(n * (u.LITE ? .55 : 1));
      for (let i = 0; i < n; i++) { const a = u.rand(-Math.PI, 0), v = u.rand(4, 12); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, c: cols[i % cols.length], s: u.rand(7, 13), rot: u.rand(0, 6), vr: u.rand(-.25, .25), t: i % 3, life: 0 }); }
      if (!raf) raf = requestAnimationFrame(step);
    };
    const timers = [];
    return {
      burst,
      at: (el, n) => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n); },
      rain: () => { for (let k = 0; k < 5; k++) timers.push(setTimeout(() => burst(u.rand(W * .1, W * .9), H * .3, 36), k * 170)); },
      destroy: () => { dead = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); off(); }
    };
  };
})();
