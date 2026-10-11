/* Template: Night garden letter. A quiet letter that fades in line by line under a starry sky while flowers bloom. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util;

  const SKIES = {
    night:  ['#04051a', '#0a0f30', '#171445', '#221a4c', '#3a2760'],
    dusk:   ['#1a0b2e', '#3b1650', '#7a2a6a', '#c2506b', '#ff9a76'],
    forest: ['#03130f', '#06251d', '#0b3a2c', '#12503a', '#1e6b4c'],
    dawn:   ['#0d1b3d', '#2b3a75', '#7a6fb0', '#d98ba6', '#ffd7a8']
  };
  const CSS = `/* ---------- sky ---------- */
.sky{position:fixed;inset:0;z-index:0;background:
  radial-gradient(120% 60% at 50% 105%,var(--s5) 0%,transparent 60%),
  linear-gradient(var(--s1) 0%,var(--s2) 45%,var(--s3) 78%,var(--s4) 100%)}
.moon{position:fixed;z-index:1;top:max(3.5vh,18px);right:6vw;width:clamp(54px,10vw,104px);aspect-ratio:1;border-radius:50%;
  background:
   radial-gradient(circle at 34% 30%,rgba(0,0,0,.10) 0 9%,transparent 10%),
   radial-gradient(circle at 62% 58%,rgba(0,0,0,.08) 0 12%,transparent 13%),
   radial-gradient(circle at 40% 72%,rgba(0,0,0,.07) 0 7%,transparent 8%),
   radial-gradient(circle at 38% 32%,#fffdf2,#f2ecd0 70%,#e2d9b4);
  box-shadow:0 0 40px 10px rgba(255,246,210,.22),0 0 120px 40px rgba(180,170,255,.16);opacity:.92;pointer-events:none}
canvas.fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
#fxBack{z-index:2}
#fxFront{z-index:6}

/* ---------- garden ---------- */
#garden{position:fixed;inset:0;z-index:3;overflow:hidden;--bedh:300px}
#msgwrap{position:absolute;z-index:4;left:50%;transform:translateX(-50%);top:max(86px,11vh);width:min(92vw,760px);text-align:center;
  max-height:calc(100dvh - var(--bedh) - max(86px,11vh) + 30px);overflow-y:auto;scrollbar-width:none;padding:6px 4px 14px;
  text-shadow:0 2px 22px rgba(5,6,26,.95),0 0 3px rgba(5,6,26,.7)}
#msgwrap::-webkit-scrollbar{display:none}
.occ{font:500 12px var(--sans);letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.to{margin:0 0 clamp(12px,2.4vh,24px);font:italic 500 clamp(34px,7vw,60px)/1.05 var(--serif);color:#ffe3ee}
.line{font:400 clamp(19px,2.7vw,27px)/1.42 var(--serif);margin:0 0 .55em;color:var(--ink)}
.from{margin-top:clamp(10px,2vh,20px);font:italic 500 clamp(20px,2.6vw,26px) var(--serif);color:var(--pink)}
.rv{opacity:0;transition:opacity 1.2s ease,transform 1.2s ease}
.rv:not(.gseg){transform:translateY(14px)}
.rv.on{opacity:1;transform:none}

#bed{position:absolute;z-index:3;left:0;right:0;bottom:0;height:var(--bedh)}
.fl{position:absolute;bottom:0;width:var(--w);height:calc(var(--w) * 2.3);margin-left:calc(var(--w) / -2);transform-origin:50% 100%}
.fl::before{content:'';position:absolute;left:50%;top:24%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;z-index:-1;
  background:radial-gradient(circle,var(--glow,rgba(255,120,170,.4)) 0,transparent 62%);opacity:0;pointer-events:none}
.fl.back{opacity:.6}
.play .fl::before{animation:fadein 1.2s ease both;animation-delay:calc(var(--d) + 1.6s)}
.fl svg{display:block;overflow:visible;width:100%;height:100%}
.stem{transform:scaleY(0)}
.head{transform:scale(0) rotate(-50deg)}
.play .stem{animation:grow 1.7s cubic-bezier(.3,.7,.3,1) both;animation-delay:var(--d)}
.play .head{animation:bloom 1.7s cubic-bezier(.2,1.35,.4,1) both;animation-delay:calc(var(--d) + 1.25s)}
.play .fl{animation:sway var(--sd) ease-in-out var(--sl) infinite alternate}
@keyframes grow{to{transform:scaleY(1)}}
@keyframes bloom{to{transform:scale(1) rotate(0)}}
@keyframes sway{from{transform:rotate(-1.7deg)}to{transform:rotate(1.9deg)}}
#grass{position:absolute;z-index:5;left:0;bottom:0;width:100%;height:clamp(46px,8vh,84px);pointer-events:none}
#ground{position:absolute;z-index:5;left:0;right:0;bottom:0;height:9vh;pointer-events:none;background:linear-gradient(rgba(3,4,15,0),rgba(3,4,15,.92) 88%)}

.replay{position:absolute;z-index:8;left:50%;bottom:calc(env(safe-area-inset-bottom) + 12px);transform:translateX(-50%);opacity:0;pointer-events:none}
.replay button{appearance:none;border:1px solid var(--line);background:rgba(10,10,40,.5);color:var(--muted);border-radius:999px;padding:7px 14px;font:500 12px var(--sans);letter-spacing:.06em;cursor:pointer}
.play .replay{animation:fadein 1.4s ease both;animation-delay:var(--endDelay);pointer-events:auto}
@keyframes fadein{to{opacity:1}}

/* ---------- intro ---------- */
#intro{position:fixed;inset:0;z-index:12;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;
  background:radial-gradient(90% 70% at 50% 60%,rgba(20,14,60,.55),rgba(5,6,26,.94));transition:opacity 1.2s ease}
#intro.gone{opacity:0;pointer-events:none}
.seed{width:16px;height:16px;border-radius:50%;background:#ffe3a3;box-shadow:0 0 18px 6px rgba(255,216,138,.65),0 0 60px 20px rgba(255,180,120,.3);animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.35);box-shadow:0 0 28px 10px rgba(255,216,138,.75),0 0 90px 30px rgba(255,180,120,.35)}}
#intro p{margin:0;font:italic 400 clamp(24px,5vw,34px)/1.25 var(--serif);max-width:520px}
#intro small{font:500 12px var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
#openBtn{margin-top:10px}

`;
  const MAX_LINES = 100;
  const START = 1.2, STAGGER = 0.09, CPS = 38, HOLD = 2.5;

  KS.registerTemplate({
    id: 'garden', group: 'Letters and birthdays',
    name: 'Night garden letter',
    tagline: 'A quiet letter that fades in under the stars while flowers bloom.',
    for: 'Apologies, thank-yous, love letters, goodbyes',
    title: d => (d.to ? 'A little garden for ' + d.to : 'A little garden for you'),
    defaultMusic: { type: 'library', id: 'g1' },

    sample: {
      occ: 'With love, from a distance', to: 'Alex', from: 'Sam', date: '',
      message: "I hope you find everything you're looking for.\nI hope you're happy, truly.\nI've made my peace, and I'm walking on lightly.\nTake good care of your heart.",
      flowers: 'r', sky: 'night', moon: true, photo: '', introText: ''
    },

    schema: [
      { id: 'letter', title: 'Your letter', open: true, fields: [
        { key: 'to', type: 'text', label: 'Who is it for?', max: 40, placeholder: 'Their name' },
        { key: 'occ', type: 'text', label: 'Small heading above their name', max: 60, placeholder: 'e.g. A quiet goodbye' },
        { key: 'message', type: 'textarea', label: 'Your message', rows: 9, lines: MAX_LINES, help: 'One line per row. Each row fades in as it scrolls into view. Up to 100 lines, and very long paragraphs work too.' },
        { key: 'from', type: 'text', label: 'Signed', max: 40, placeholder: 'Your name (optional)' },
        { key: 'date', type: 'date', label: 'Date (optional)', help: 'Shown quietly under your name.' }
      ] },
      { id: 'look', title: 'Look and feel', fields: [
        { key: 'flowers', type: 'choice', label: 'Flowers', options: [{ v: 'r', l: 'Roses' }, { v: 's', l: 'Sunflowers' }, { v: 't', l: 'Tulips' }, { v: 'rst', l: 'A mix' }] },
        { key: 'sky', type: 'choice', label: 'Sky', options: [{ v: 'night', l: 'Midnight', c: '#171445' }, { v: 'dusk', l: 'Dusk', c: '#c2506b' }, { v: 'forest', l: 'Forest', c: '#12503a' }, { v: 'dawn', l: 'Dawn', c: '#d98ba6' }] },
        { key: 'moon', type: 'toggle', label: 'Show the moon' },
        { key: 'photo', type: 'image', label: 'A small photo (optional)', help: 'Shown in a glowing circle above the letter.' },
        { key: 'introText', type: 'text', label: 'Words on the opening screen', max: 80, placeholder: 'A little garden for …' }
      ] }
    ],

    thumb: `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04051a"/><stop offset=".6" stop-color="#171445"/><stop offset="1" stop-color="#3a2760"/></linearGradient></defs><rect width="400" height="300" fill="url(#gs)"/>
      <g fill="#e4eaff"><circle cx="40" cy="40" r="1.6"/><circle cx="110" cy="70" r="1.2"/><circle cx="180" cy="30" r="1.6"/><circle cx="250" cy="80" r="1.2"/><circle cx="90" cy="120" r="1"/><circle cx="330" cy="130" r="1.4"/><circle cx="220" cy="140" r="1"/></g>
      <circle cx="330" cy="58" r="26" fill="#f2ecd0"/><circle cx="330" cy="58" r="46" fill="#f2ecd0" opacity=".12"/>
      <g fill="#ffd88a"><circle cx="70" cy="190" r="3"/><circle cx="300" cy="170" r="2.4"/><circle cx="160" cy="210" r="2.4"/></g>
      <text x="200" y="98" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-style="italic" font-size="34" fill="#ffe3ee">For you</text>
      <text x="200" y="130" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-size="17" fill="#f5f0ff">I hope you find everything</text>
      <text x="200" y="152" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-size="17" fill="#f5f0ff" opacity=".6">you are looking for.</text>
      <g stroke="#2f8a62" stroke-width="3" fill="none"><path d="M60 300c0-40 2-60 0-84"/><path d="M130 300c2-36-2-52 0-70"/><path d="M200 300c-2-44 2-64 0-90"/><path d="M270 300c2-34-2-50 0-66"/><path d="M340 300c-2-42 2-60 0-82"/></g>
      <g><circle cx="60" cy="210" r="16" fill="#e0507f"/><circle cx="60" cy="210" r="8" fill="#b02a5c"/><circle cx="130" cy="224" r="14" fill="#ffb3cc"/><circle cx="130" cy="224" r="7" fill="#dd6a97"/><circle cx="200" cy="204" r="17" fill="#c9a2ff"/><circle cx="200" cy="204" r="8" fill="#8a5fd8"/><circle cx="270" cy="228" r="14" fill="#e0507f"/><circle cx="340" cy="212" r="16" fill="#fff3f8"/><circle cx="340" cy="212" r="8" fill="#e0bdd2"/></g></svg>`,

    mount(root, data, ctx) {
      const $ = s => root.querySelector(s);
      const rand = u.rand, clamp = u.clamp, RM = u.RM;
      const preview = !!ctx.preview;
      const pal = SKIES[data.sky] || SKIES.night;
      const flowers = /^[rst]+$/.test(data.flowers || '') ? data.flowers : 'r';
      const lines = String(data.message || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, MAX_LINES);
      const cfg = { to: data.to || '', from: data.from || '', occ: data.occ || '', date: data.date || '', photo: data.photo || '' };

      u.font('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
      const style = u.el('style', {}, CSS); document.head.append(style);
      const prevBg = document.body.style.background; document.body.style.background = '#05061a';
      root.className = 'tpl-garden';
      root.style.cssText = `--ink:#f5f0ff;--muted:#a9a2c8;--line:rgba(255,255,255,.14);--pink:#f4a3c0;--gold:#ffd88a;--night:#05061a;--serif:'Cormorant Garamond',Georgia,serif;--sans:'Inter',system-ui,sans-serif;` +
        pal.map((c, i) => `--s${i + 1}:${c}`).join(';');
      root.innerHTML = `
        <div class="sky"></div>${data.moon === false ? '' : '<div class="moon"></div>'}
        <canvas class="fx" id="fxBack"></canvas>
        <section id="garden"${preview ? ' class="static"' : ''}>
          <div id="msgwrap"></div><div id="bed"></div>
          <svg id="grass" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"></svg><div id="ground"></div>
          <div class="replay"><button type="button" id="bReplay">Replay</button></div>
          <div id="intro"${preview ? ' hidden' : ''}><div class="seed"></div><small>Someone grew this for you</small><p id="introText"></p><button type="button" class="obtn" id="openBtn">Open</button></div>
        </section>
        <canvas class="fx" id="fxFront"></canvas>`;
      const extra = u.el('style', {}, `.tpl-garden .obtn{appearance:none;border:0;cursor:pointer;border-radius:999px;padding:13px 30px;font:600 15px var(--sans);color:#2a1030;background:linear-gradient(135deg,#f4a3c0,#ffd88a);margin-top:10px}
        .tpl-garden .photo{width:clamp(84px,14vh,124px);height:clamp(84px,14vh,124px);margin:0 auto 12px;border-radius:50%;background-size:cover;background-position:center;border:2px solid rgba(255,227,238,.75);box-shadow:0 0 30px 6px rgba(244,163,192,.35),0 0 90px 20px rgba(160,140,255,.22)}
        .tpl-garden .date{margin-top:6px;font:500 12px var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
        .tpl-garden .static .rv{transition:none!important;opacity:1;transform:none}
        .tpl-garden .static .stem,.tpl-garden .static .head{transform:none!important;animation:none!important}
        .tpl-garden .static .fl{animation:none!important}
        .tpl-garden .static .fl::before{animation:none!important;opacity:1}
        .tpl-garden .static #msgwrap{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent}
        .tpl-garden .static .replay{display:none}`);
      document.head.append(extra);

      /* ---------------- flowers ---------------- */
      /* ================= flower art ================= */
      const ROSE_PAL = [
        { c: ['#e0507f','#c93a6c','#b02a5c','#8f1f4b'], glow: 'rgba(255,90,140,.5)' },
        { c: ['#ffb3cc','#f28cb0','#dd6a97','#c04f7d'], glow: 'rgba(255,160,200,.5)' },
        { c: ['#c9a2ff','#a97ff0','#8a5fd8','#6c44b8'], glow: 'rgba(170,130,255,.5)' },
        { c: ['#fff3f8','#f2d9e6','#e0bdd2','#c79ab7'], glow: 'rgba(255,240,250,.45)' }
      ];
      const TULIP_PAL = [
        { c: ['#ff8fa8','#ff6f91','#e04a74'], glow: 'rgba(255,120,150,.45)' },
        { c: ['#c9a2ff','#a97ff0','#8a5fd8'], glow: 'rgba(170,130,255,.45)' },
        { c: ['#ffb38a','#ff9466','#e87142'], glow: 'rgba(255,170,120,.45)' }
      ];
      function roseHead(p) {
        const L = [{ n: 5, r: 20, rx: 17, ry: 22, rot: 0 }, { n: 5, r: 15, rx: 14, ry: 18, rot: 36 }, { n: 4, r: 10, rx: 11, ry: 14, rot: 20 }, { n: 3, r: 5, rx: 7, ry: 9, rot: 50 }];
        let s = '';
        L.forEach((l, k) => { for (let i = 0; i < l.n; i++) s += `<ellipse cx="0" cy="${-l.r}" rx="${l.rx}" ry="${l.ry}" fill="${p.c[k]}" stroke="rgba(255,255,255,.2)" stroke-width=".8" transform="rotate(${l.rot + i * 360 / l.n})"/>`; });
        return s + `<path d="M-4 -2C-4 -8 5 -8 5 -1C5 5 -6 5 -6 -3" fill="none" stroke="rgba(60,5,30,.55)" stroke-width="1.6" stroke-linecap="round"/>`;
      }
      function sunHead() {
        let s = '';
        for (let i = 0; i < 14; i++) s += `<ellipse cx="0" cy="-27" rx="6.5" ry="15" fill="#f6bd3a" transform="rotate(${i * 360 / 14})"/>`;
        for (let i = 0; i < 14; i++) s += `<ellipse cx="0" cy="-25" rx="6" ry="14" fill="#ffd95e" transform="rotate(${i * 360 / 14 + 12.86})"/>`;
        s += `<circle r="15" fill="#4e2c12"/>`;
        for (let i = 1; i < 46; i++) { const a = i * 2.39996, r = 1.95 * Math.sqrt(i); s += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="1" fill="${i % 3 ? '#8a5a25' : '#2b1608'}"/>`; }
        return s;
      }
      function tulipHead(p) {
        return `<g transform="translate(0 16)">` +
          `<path d="M-15 -6C-17 -28 -7 -38 0 -44C7 -38 17 -28 15 -6C9 8 -9 8 -15 -6Z" fill="${p.c[2]}"/>` +
          `<path d="M-16 -8C-20 -26 -9 -36 -2 -42C-4 -26 -2 -10 6 2C-8 4 -14 -1 -16 -8Z" fill="${p.c[0]}"/>` +
          `<path d="M16 -8C20 -26 9 -36 2 -42C4 -26 2 -10 -6 2C8 4 14 -1 16 -8Z" fill="${p.c[1]}"/>` +
          `<path d="M-9 -2C-9 -20 -3 -30 0 -34C3 -30 9 -20 9 -2C4 6 -4 6 -9 -2Z" fill="${p.c[1]}" opacity=".85"/></g>`;
      }
      function flowerSVG(type, pal) {
        const bend = rand(-8, 8), leaf = (y, flip, len) =>
          `<path transform="scale(${flip},1)" d="M0 ${y}C${len * .5} ${y - 18} ${len * .9} ${y - 10} ${len} ${y - 32}C${len * .55} ${y - 40} ${len * .1} ${y - 30} 0 ${y}Z" fill="${flip > 0 ? '#2c7a5a' : '#38916a'}"/>`;
        const stem = `<path d="M0 0C${-bend} -60 ${bend} -120 0 -175" fill="none" stroke="#2f8a62" stroke-width="4.5" stroke-linecap="round"/>` +
          leaf(-52, 1, rand(38, 54)) + leaf(-92, -1, rand(34, 50)) + leaf(-128, 1, rand(26, 40));
        const head = type === 's' ? sunHead() : type === 't' ? tulipHead(pal) : roseHead(pal);
        return `<svg viewBox="0 0 100 230" aria-hidden="true"><g transform="translate(50 230)"><g class="stem">${stem}</g></g><g transform="translate(50 55)"><g class="head">${head}</g></g></svg>`;
      }

      /* ---------------- message ---------------- */
      const state = { pend: [], petalsOn: false, timer: 0, timers: [], glide: 0, revealOn: false, raf: 0, dead: false };
      function buildMessage() {
        const wrap = $('#msgwrap'); wrap.textContent = '';
        const mk = (cls, tag, text) => { const e = document.createElement(tag); e.className = cls + ' rv'; e.textContent = text; wrap.appendChild(e); return e; };
        if (cfg.photo) { const p = document.createElement('div'); p.className = 'photo rv'; p.style.backgroundImage = `url("${String(cfg.photo).replace(/"/g, '%22')}")`; wrap.appendChild(p); }
        if (cfg.occ) mk('occ', 'div', cfg.occ);
        mk('to', 'h1', cfg.to ? 'For ' + cfg.to : 'For you');
        lines.forEach(t => {
          if (t.length <= 160) return mk('line', 'p', t);
          const p = document.createElement('p'); p.className = 'line';
          (t.match(/[^.!?…]+[.!?…]+["'”’)\]]*\s*|[^.!?…]+$/g) || [t]).forEach(s => { const sp = document.createElement('span'); sp.className = 'gseg rv'; sp.textContent = s; p.appendChild(sp); });
          wrap.appendChild(p);
        });
        if (cfg.from) mk('from', 'div', '— ' + cfg.from);
        if (cfg.date) mk('date', 'div', u.fmtDate(cfg.date, { day: 'numeric', month: 'long', year: 'numeric' }));
        state.pend = [...wrap.querySelectorAll('.rv')];
      }
      function reveal() {
        if (!state.revealOn || !state.pend.length) return;
        const w = $('#msgwrap'), limit = w.scrollTop + w.clientHeight - 6;
        const due = state.pend.filter(e => e.offsetTop < limit);
        if (!due.length) return;
        state.pend = state.pend.filter(e => !due.includes(e));
        due.forEach((e, k) => { e.style.transitionDelay = Math.min(k * STAGGER, 1.2).toFixed(2) + 's'; e.classList.add('on'); });
      }
      function buildBed() {
        const bed = $('#bed'); bed.textContent = '';
        const types = [...new Set([...flowers])];
        const vw = innerWidth, vh = innerHeight;
        const topOff = Math.max(86, vh * .11), textH = $('#msgwrap').scrollHeight || 0;
        const wFit = (vh - topOff - textH - 10) / (2.3 * 1.14);
        const w = clamp(Math.min(vw / 6.5, vh * .15, 132, wFit), 44, 132);
        $('#garden').style.setProperty('--bedh', Math.round(w * 2.3 * 1.14 + 6) + 'px');
        const n = clamp(Math.round(vw / (w * .85)), 5, 14), mid = (n - 1) / 2;
        const frag = document.createDocumentFragment();
        let k = Math.floor(Math.random() * 9);
        const add = (x, scale, back, delay) => {
          const type = types[k++ % types.length];
          const pl = type === 't' ? TULIP_PAL[Math.floor(Math.random() * TULIP_PAL.length)] : ROSE_PAL[Math.floor(Math.random() * ROSE_PAL.length)];
          const d = document.createElement('div');
          d.className = 'fl' + (back ? ' back' : '');
          d.style.left = x + '%';
          d.style.setProperty('--w', (w * scale).toFixed(1) + 'px');
          d.style.setProperty('--d', delay.toFixed(2) + 's');
          d.style.setProperty('--sd', rand(4, 7).toFixed(1) + 's');
          d.style.setProperty('--sl', '-' + rand(0, 5).toFixed(1) + 's');
          d.style.setProperty('--glow', type === 's' ? 'rgba(255,205,80,.5)' : pl.glow);
          d.innerHTML = flowerSVG(type, pl);
          frag.appendChild(d);
        };
        for (let j = 0; j < n - 1; j++) add((j + 1) / n * 100 + rand(-.25, .25) * 100 / n, rand(.66, .78), true, Math.abs(j + .5 - mid) * .22 + .4 + rand(0, .3));
        for (let i = 0; i < n; i++) add((i + .5) / n * 100 + rand(-.2, .2) * 100 / n, rand(.88, 1.14), false, Math.abs(i - mid) * .24 + rand(0, .3));
        bed.appendChild(frag);
        const g = $('#grass'); let d = '';
        for (let i = 0; i < 130; i++) {
          const x = rand(-5, 1005), h = rand(14, 54), lean = rand(-14, 14), wd = rand(2, 5);
          d += `M${(x - wd).toFixed(1)} 80Q${(x + lean * .3).toFixed(1)} ${(80 - h * .55).toFixed(1)} ${(x + lean).toFixed(1)} ${(80 - h).toFixed(1)}Q${(x + wd + lean * .3).toFixed(1)} ${(80 - h * .5).toFixed(1)} ${(x + wd).toFixed(1)} 80Z`;
        }
        g.innerHTML = `<path d="${d}" fill="#0d3a3a" opacity=".95"/>`;
      }
      function play() {
        const g = $('#garden'), w = $('#msgwrap');
        clearTimeout(state.timer); state.petalsOn = false;
        state.timers.forEach(clearTimeout); state.timers = []; const id = ++state.glide; state.revealOn = false;
        g.classList.remove('play');
        buildMessage(); buildBed(); w.scrollTop = 0;
        if (preview) { state.revealOn = true; state.pend.forEach(e => e.classList.add('on')); state.pend = []; return; }
        const start = RM ? 0 : START, dist = w.scrollHeight - w.clientHeight;
        const chars = w.textContent.length || 1, pxs = Math.min(90, Math.max(12, w.scrollHeight / chars * CPS));
        const scrolls = !RM && dist > 4;
        g.style.setProperty('--endDelay', (start + 1.5 + (scrolls ? HOLD + dist / pxs : 1)).toFixed(1) + 's');
        void g.offsetWidth; g.classList.add('play');
        state.timers.push(setTimeout(() => { state.revealOn = true; reveal(); }, start * 1000));
        if (scrolls) state.timers.push(setTimeout(() => {
          let pos = 0, last = performance.now();
          requestAnimationFrame(function step(now) {
            if (state.glide !== id || state.dead) return;
            pos = Math.min(dist, pos + Math.max(0, now - last) / 1000 * pxs); last = now; w.scrollTop = pos;
            if (pos < dist) requestAnimationFrame(step);
          });
        }, (start + HOLD) * 1000));
        if (!RM) state.timer = setTimeout(() => { state.petalsOn = true; }, 4200);
      }
      ['wheel', 'touchstart'].forEach(ev => $('#msgwrap').addEventListener(ev, () => { state.glide++; }, { passive: true }));
      $('#msgwrap').addEventListener('scroll', reveal, { passive: true });
      $('#bReplay').onclick = play;

      /* ---------------- sky particles ---------------- */
      const back = { cv: $('#fxBack') }, front = { cv: $('#fxFront') };
      back.ctx = back.cv.getContext('2d'); front.ctx = front.cv.getContext('2d');
      let W = 0, H = 0, DPR = 1, T = 0, last = 0, stars = [], flies = [], petals = [], shoot = null, nextShoot = rand(5, 10), frontDirty = false;
      const fly = document.createElement('canvas'); fly.width = fly.height = 64;
      (() => { const g = fly.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,236,150,1)'); gr.addColorStop(.25, 'rgba(255,216,110,.38)'); gr.addColorStop(1, 'rgba(255,200,90,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64); })();
      function seedFx() {
        DPR = u.dpr(); W = innerWidth; H = innerHeight;
        for (const L of [back, front]) { L.cv.width = W * DPR; L.cv.height = H * DPR; L.ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
        stars = Array.from({ length: clamp(Math.round(W * H / 7500), 60, u.LITE ? 120 : 220) }, () => ({ x: rand(0, W), y: rand(0, H * .8), r: rand(.4, 1.5), p: rand(0, 6.28), s: rand(.6, 2), b: rand(.5, 1) }));
        flies = Array.from({ length: RM ? 0 : clamp(Math.round(W / 50), u.LITE ? 8 : 10, u.LITE ? 14 : 26) }, () => ({ x: rand(0, W), y: rand(H * .4, H * .95), a: rand(0, 6.28), sp: rand(10, 26), ph: rand(0, 6.28), r: rand(9, 16) }));
      }
      function frame(now) {
        if (state.dead) return;
        const dt = Math.min(.05, ((now - last) / 1000) || .016); last = now; T += dt;
        const b = back.ctx, f = front.ctx;
        b.clearRect(0, 0, W, H); if (frontDirty) { f.clearRect(0, 0, W, H); frontDirty = false; }
        b.fillStyle = '#e4eaff';
        for (const s of stars) { b.globalAlpha = (RM ? .6 : .3 + .7 * (.5 + .5 * Math.sin(T * s.s + s.p))) * s.b; b.beginPath(); b.arc(s.x, s.y, s.r, 0, 6.283); b.fill(); }
        b.globalAlpha = 1;
        if (!RM) {
          nextShoot -= dt;
          if (nextShoot <= 0 && !shoot) { shoot = { x: rand(W * .1, W * .8), y: rand(0, H * .3), vx: rand(380, 520), vy: rand(150, 240), life: 0 }; nextShoot = rand(7, 15); }
          if (shoot) {
            shoot.life += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt;
            const a = Math.max(0, 1 - shoot.life / .9), len = .09;
            const gr = b.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * len, shoot.y - shoot.vy * len);
            gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
            b.strokeStyle = gr; b.lineWidth = 1.6; b.beginPath(); b.moveTo(shoot.x, shoot.y); b.lineTo(shoot.x - shoot.vx * len, shoot.y - shoot.vy * len); b.stroke();
            if (shoot.life > .9) shoot = null;
          }
          for (const q of flies) {
            q.a += (Math.random() - .5) * 2.2 * dt; q.x += Math.cos(q.a) * q.sp * dt; q.y += Math.sin(q.a) * q.sp * .6 * dt;
            if (q.x < -20) q.x = W + 20; if (q.x > W + 20) q.x = -20; if (q.y < H * .3) q.a = Math.abs(q.a); if (q.y > H) q.y = H * .5;
            const glow = Math.pow(.5 + .5 * Math.sin(T * 1.5 + q.ph), 2), R = q.r;
            b.globalAlpha = .15 + .85 * glow; b.drawImage(fly, q.x - R, q.y - R, R * 2, R * 2);
          }
          b.globalAlpha = 1;
          if (state.petalsOn && petals.length < (u.LITE ? 16 : 26) && Math.random() < dt * 1.6) petals.push({ x: rand(0, W), y: -20, vy: rand(24, 46), sw: rand(.6, 1.6), ph: rand(0, 6.28), rot: rand(0, 6.28), vr: rand(-1.2, 1.2), sz: rand(5, 9), h: Math.random() < .8 });
          for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i]; p.y += p.vy * dt; p.x += Math.sin(T * p.sw + p.ph) * 26 * dt; p.rot += p.vr * dt;
            if (p.y > H + 20) { petals.splice(i, 1); continue; }
            frontDirty = true; f.save(); f.translate(p.x, p.y); f.rotate(p.rot); f.scale(1, .6 + .4 * Math.abs(Math.sin(T + p.ph)));
            f.fillStyle = p.h ? 'rgba(248,160,192,.85)' : 'rgba(210,180,255,.8)';
            f.beginPath(); f.ellipse(0, 0, p.sz * .55, p.sz, 0, 0, 6.283); f.fill(); f.restore();
          }
        }
        state.raf = requestAnimationFrame(frame);
      }
      seedFx(); state.raf = requestAnimationFrame(frame);
      const offResize = u.onResize(() => { seedFx(); if ($('#intro').hidden) buildBed(); });

      /* ---------------- start ---------------- */
      $('#introText').textContent = data.introText || (cfg.to ? 'A little garden for ' + cfg.to : 'A little garden, just for you');
      if (preview) { play(); }
      else {
        buildMessage(); buildBed();
        $('#openBtn').onclick = () => { $('#intro').classList.add('gone'); setTimeout(() => { $('#intro').hidden = true; }, 1200); ctx.start(); play(); };
      }

      return {
        destroy() {
          state.dead = true; cancelAnimationFrame(state.raf); clearTimeout(state.timer); state.timers.forEach(clearTimeout); state.glide++;
          offResize(); style.remove(); extra.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg;
        }
      };
    }
  });
})();
