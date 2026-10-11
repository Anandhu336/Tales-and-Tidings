/* Template: Little love quest. A cute guide walks them through tiny levels:
   tap a heart open -> a silly quiz (wrong answers wobble) -> a love meter that refuses to go below 100%
   -> catch the falling hearts -> memory match -> scratch card secret -> hold to send a hug
   -> the big question (the No button shrinks away) -> a results page they can send back.
   Colours, fonts, guide and confetti come from js/cute.js. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, C = KS.cute, esc = u.esc, rand = u.rand, stk = u.stk;

  const REACT = { right: ['🥳', '🤩', '😍', '💯'], wrong: ['😹', '🙈', '😤', '🤔'] };
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const GOOD = ['💗', '💖', '💘', '💝', '💞'];

  const CSS = `
  .tpl-quest{font-family:var(--body);color:var(--ink);min-height:100vh;overflow-x:hidden;position:relative}
  .tpl-quest *{box-sizing:border-box}
  .tpl-quest::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;transform:translateZ(0);
    background:radial-gradient(var(--dot) 2.6px,transparent 3.2px) 0 0/28px 28px,linear-gradient(170deg,var(--bg1),var(--bg2))}
  .q-float{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .q-float i{position:absolute;bottom:-50px;font-style:normal;color:var(--pop);opacity:.22;font-size:var(--s);animation:qfloat var(--d) linear var(--l) infinite}
  @keyframes qfloat{to{transform:translateY(calc(-100vh - 100px)) rotate(40deg)}}
  .q-main{position:relative;z-index:2;min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;padding:22px 18px calc(80px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto}
  .q-prog{display:flex;gap:6px;justify-content:center;min-height:22px;margin-bottom:8px;font-size:18px;color:var(--pop)}
  .q-prog i{font-style:normal;opacity:.22;transition:opacity .3s,transform .3s}.q-prog i.on{opacity:1;transform:scale(1.15)}
  @keyframes qin{from{opacity:0;transform:translateY(26px) scale(.98)}}
  @keyframes qshake{20%,60%{transform:translateX(-9px) rotate(-2deg)}40%,80%{transform:translateX(9px) rotate(2deg)}}
  @keyframes qjelly{30%{transform:scale(1.1,.9)}50%{transform:scale(.94,1.06)}70%{transform:scale(1.03,.97)}100%{transform:none}}
  @keyframes qwig{0%,100%{transform:rotate(0) scale(1)}20%{transform:rotate(-7deg) scale(1.04)}40%{transform:rotate(6deg)}60%{transform:rotate(-3deg) scale(1.02)}}

  /* pages */
  .q-page{width:100%;display:flex;flex-direction:column;align-items:center;text-align:center}
  .q-page.in{animation:qin .5s cubic-bezier(.2,1,.4,1) both}
  .q-h{font:var(--dw) clamp(30px,8.4vw,44px)/1.1 var(--disp);margin:6px 0 20px;letter-spacing:.01em;text-wrap:balance}
  .q-sm{font:var(--bw) 15px var(--body);color:var(--muted);margin:0}
  .q-btn{appearance:none;border:0;cursor:pointer;font:var(--bw) 17px/1.3 var(--body);color:var(--ink);background:var(--card);border-radius:18px;padding:15px 20px;
    box-shadow:0 6px 0 var(--pop2);transition:transform .12s,box-shadow .12s,background .2s,color .2s;touch-action:manipulation;-webkit-user-select:none;user-select:none;text-decoration:none;display:inline-block}
  .q-btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--pop2)}
  .q-btn.main{background:var(--pop);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 60%,#000);font-size:19px;padding:16px 30px}
  .q-btn.main:active{box-shadow:0 2px 0 color-mix(in srgb,var(--pop) 60%,#000)}
  .q-next{margin-top:24px;animation:kpop .45s cubic-bezier(.2,1.5,.4,1) both}

  /* level 0: tap the heart */
  .q-heart{appearance:none;border:0;background:none;padding:0;cursor:pointer;width:min(56vw,230px);aspect-ratio:1;transition:transform .22s cubic-bezier(.3,1.7,.5,1);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  .q-heart i{display:block;width:100%;height:100%;animation:qwig 1.6s ease-in-out infinite}
  .q-heart .stk{width:100%;height:100%}.q-heart .stk-t{font-size:min(44vw,180px);line-height:1}
  .q-heart.hit i{animation:qjelly .35s ease}
  .q-taps{font:700 clamp(24px,6.4vw,30px) var(--hand);color:var(--muted);margin:14px 0 0;min-height:36px}

  /* quiz */
  .q-ans{display:grid;gap:12px;width:100%}
  .q-ans .q-btn{display:flex;align-items:center;gap:12px;text-align:left;width:100%;animation:kpop .45s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--i) * 90ms + .15s)}
  .q-ans .q-btn b{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--pop) 14%,var(--card));color:var(--pop);font:var(--dw) 18px var(--disp)}
  .q-ans .q-btn.bad{animation:qshake .45s ease;opacity:.45;text-decoration:line-through}
  .q-ans .q-btn.good{animation:qjelly .6s ease;background:var(--pop);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 60%,#000)}
  .q-ans .q-btn.good b{background:#fff}

  /* love meter */
  .q-num{font:var(--dw) clamp(70px,22vw,120px)/1 var(--disp);color:var(--pop);margin:0 0 18px;min-height:1em;font-variant-numeric:tabular-nums}
  .q-num.boom{animation:qjelly .6s ease}
  .q-range{-webkit-appearance:none;appearance:none;width:min(100%,380px);height:18px;border-radius:99px;outline:none;margin:6px 0 14px;touch-action:none;
    background:linear-gradient(90deg,var(--pop) var(--v,30%),color-mix(in srgb,var(--pop) 16%,var(--card)) var(--v,30%))}
  .q-range::-webkit-slider-thumb{-webkit-appearance:none;width:44px;height:44px;border-radius:50%;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-7-4.5-9-9.2C1.6 8 4 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3 0 5.4 3 4 6.8C19 16.5 12 21 12 21z' fill='%23ff5277'/%3E%3C/svg%3E") center/24px no-repeat;border:4px solid var(--pop);box-shadow:0 4px 10px rgba(0,0,0,.15);cursor:grab}
  .q-range::-moz-range-thumb{width:36px;height:36px;border-radius:50%;background:#fff;border:4px solid var(--pop);cursor:grab}

  /* catch the hearts */
  .q-sky{position:relative;width:100%;height:min(42vh,360px);border-radius:26px;overflow:hidden;background:color-mix(in srgb,var(--card) 55%,transparent);box-shadow:inset 0 0 0 3px var(--pop2);touch-action:manipulation}
  .q-fall{position:absolute;top:0;left:var(--x);width:64px;height:64px;margin-left:-32px;appearance:none;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;
    animation:qfall var(--dur) linear forwards;will-change:transform}
  .q-fall .stk,.q-fall .stk-t{width:100%;height:100%;font-size:50px;line-height:64px;pointer-events:none}
  @keyframes qfall{from{transform:translateY(-70px) rotate(-10deg)}to{transform:translateY(var(--h)) rotate(14deg)}}
  .q-fall.got{animation:qgot .35s ease-out forwards}
  @keyframes qgot{from{transform:translateY(var(--y))}to{transform:translateY(var(--y)) scale(1.8);opacity:0}}
  .q-count{font:var(--dw) clamp(30px,8vw,40px) var(--disp);color:var(--pop);margin:14px 0 0}
  .q-count.bump{animation:qjelly .4s ease}

  /* memory match */
  .q-cards{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:10px;width:100%;max-width:420px}
  .q-card{appearance:none;border:0;background:none;padding:0;cursor:pointer;aspect-ratio:3/4;perspective:700px;-webkit-tap-highlight-color:transparent;animation:kpop .4s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--i) * 60ms)}
  .q-cin{position:relative;display:block;width:100%;height:100%;transition:transform .45s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}
  .q-card.flip .q-cin,.q-card.done .q-cin{transform:rotateY(180deg)}
  .q-face{position:absolute;inset:0;border-radius:16px;display:grid;place-items:center;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 5px 0 var(--pop2)}
  .q-face.f{background:var(--pop);color:#fff;font:var(--dw) 34px var(--disp)}
  .q-face.b{background:var(--card);transform:rotateY(180deg)}
  .q-face.b .stk,.q-face.b .stk-t{width:76%;height:76%;font-size:44px;line-height:1}
  .q-card.done .q-face.b{box-shadow:0 5px 0 var(--pop),inset 0 0 0 3px var(--pop)}

  /* scratch card */
  .q-scratch{position:relative;width:min(100%,360px);aspect-ratio:1.55;border-radius:24px;overflow:hidden;background:var(--card);box-shadow:0 8px 0 var(--pop2);display:grid;place-items:center;padding:18px}
  .q-secret{font:700 clamp(28px,7.6vw,38px)/1.2 var(--hand);color:var(--pop);margin:0;white-space:pre-line}
  .q-scv{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;transition:opacity .6s}
  .q-scv.gone{opacity:0;pointer-events:none}

  /* hug */
  .q-hug{appearance:none;border:0;background:none;padding:0;cursor:pointer;position:relative;width:min(60vw,230px);aspect-ratio:1;touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
  .q-hug svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
  .q-hug circle{fill:none;stroke-width:10;stroke-linecap:round}
  .q-hug .bg{stroke:color-mix(in srgb,var(--pop) 16%,var(--card))}.q-hug .fg{stroke:var(--pop)}
  .q-hug .in{position:absolute;inset:14%;border-radius:50%;background:var(--card);display:grid;place-items:center;box-shadow:0 8px 0 var(--pop2);transition:transform .15s}
  .q-hug .in .stk{width:70%;height:70%}.q-hug .in .stk-t{font-size:80px}
  .q-hug.done .in{animation:qjelly .6s ease}

  /* big question */
  .q-yn{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:90px}
  .q-yn .yes{transition:transform .3s cubic-bezier(.3,1.5,.5,1)}
  .q-yn .no{transition:transform .3s cubic-bezier(.3,1.5,.5,1),opacity .3s}
  .q-yn .no.poof{transform:scale(0) rotate(30deg)!important;opacity:0;pointer-events:none}

  /* the end */
  .q-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:0 0 22px}
  .q-chip{display:flex;align-items:center;gap:8px;background:var(--card);border-radius:999px;padding:6px 16px 6px 6px;font:var(--bw) 15px var(--body);box-shadow:0 4px 0 var(--pop2);animation:kpop .5s cubic-bezier(.2,1.5,.4,1) both;animation-delay:calc(var(--i) * 140ms + .3s)}
  .q-chip .stk,.q-chip .stk-t{width:34px;height:34px;font-size:26px;line-height:34px;text-align:center}
  .q-msg{font:700 clamp(25px,6.6vw,32px)/1.3 var(--hand);margin:0 0 24px;white-space:pre-line}
  .q-sign{font:700 clamp(30px,8vw,40px) var(--hand);color:var(--pop);margin:18px 0 0}
  .q-pv{position:relative;z-index:2;width:100%;text-align:center;font:var(--bw) 11px var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);padding:12px 0;margin:30px 0 10px;border-top:2px dashed color-mix(in srgb,var(--muted) 40%,transparent)}
  .is-static .q-float i,.is-static .q-heart i,.is-static .q-page.in,.is-static .q-fall{animation:none}
  .is-static .q-fall{transform:translateY(calc(var(--x) * 2.4))}
  @media(prefers-reduced-motion:reduce){.q-float i,.q-heart i,.q-page.in,.q-ans .q-btn,.q-chip,.q-card{animation:none}.q-fall{animation-duration:calc(var(--dur) * 2)}}
  `;

  const F = (key, type, label, more) => Object.assign({ key, type, label }, more || {});
  const quizOf = d => (d.quiz || []).map(x => {
    const a = lines(x && x.answers).map(t => ({ ok: t.startsWith('*'), t: t.replace(/^\*\s*/, '') }));
    if (!a.some(z => z.ok)) a.forEach(z => { z.ok = true; });
    return { q: (x && x.q || '').trim(), a };
  }).filter(x => x.q && x.a.length);
  /* the levels, in order: { k: kind, id: for "Page by page", l: its name in the builder, bub: what the guide says, i: quiz index } */
  const levelsOf = (d, quiz) => {
    const to = (d.to || '').trim(), P = [{ k: 'intro', id: 'intro', l: 'First screen (tap the heart)', bub: (d.introBubble || '').trim() || `Psst, ${to || 'hey you'}! I have a tiny quest for you 💌` }];
    quiz.forEach((x, i) => P.push({ k: 'quiz', i, id: 'quiz' + (i + 1), l: `Quiz ${i + 1}: ${x.q}`, bub: quiz.length > 1 ? `Question ${i + 1} of ${quiz.length}! 🧠` : 'Quiz time! 🧠' }));
    if (d.meterOn !== false) P.push({ k: 'meter', id: 'meter', l: 'Love meter', bub: 'Be honest… 👀' });
    if (d.catchOn !== false) P.push({ k: 'catch', id: 'catch', l: 'Catch the hearts', bub: 'Quick! Catch them before they fall 💨' });
    if (d.memoryOn !== false) P.push({ k: 'memory', id: 'memory', l: 'Memory match', bub: 'Find the matching pairs 🧠' });
    if (d.scratchOn !== false) P.push({ k: 'scratch', id: 'scratch', l: 'Scratch card', bub: 'I wrote you a secret… 🤫' });
    if (d.hugOn !== false) P.push({ k: 'hug', id: 'hug', l: 'Hold to hug', bub: 'I really need one. Please? 🥺' });
    P.push({ k: 'final', id: 'final', l: 'The big question', bub: 'Last level! No pressure 😳' });
    P.push({ k: 'end', id: 'end', l: 'Results page', bub: (d.endBubble || '').trim() || 'Yaaay! You did it! 🎉' });
    return P;
  };
  const SCHEMA = [
    { id: 'who', title: 'Who it is for', open: true, fields: [
      F('to', 'text', 'Their name', { max: 30 }),
      F('from', 'text', 'Your name', { max: 30 }),
      F('introTitle', 'text', 'Title on the first screen', { max: 50 }),
      F('introBubble', 'text', 'What your guide says first', { max: 90, placeholder: 'Psst! I have a tiny quest for you 💌' }),
      F('endBubble', 'text', 'What your guide says on the results page', { max: 90, placeholder: 'Yaaay! You did it! 🎉' })
    ] },
    { id: 'guide', title: 'Little guide', fields: [
      { key: 'guide', type: 'sticker', label: 'Your little guide', options: C.GUIDES, default: '🐻', help: 'An animated buddy who talks to them and reacts to everything they do.' },
      F('photo', 'image', 'Your photo instead (optional)', { help: 'Shows your photo in a circle with the guide as a little badge.' })
    ] },
    { id: 'look', title: 'Colours and lettering', fields: C.lookFields('strawberry', 'chewy', 'nunito') },
    { id: 'pages', title: 'Page by page: guides and photos', fields: C.pageFields(d => levelsOf(d, quizOf(d)).map(p => [p.id, p.l])) },
    { id: 'quiz', title: 'Silly quiz', fields: [
      { key: 'quiz', type: 'repeater', label: '', max: 8, addLabel: 'Add a question', itemLabel: 'Question', title: i => i.q, blank: { q: '', answers: '' },
        help: 'Put a * in front of the right answers. Wrong ones wobble and your guide teases them. No * at all means every answer is right.',
        fields: [F('q', 'text', 'Question', { max: 90 }), F('answers', 'textarea', 'Answers, one per line', { rows: 4, placeholder: '*You, obviously 💖\nA potato 🥔' })] },
      F('rightLines', 'textarea', 'What your guide says for a right answer', { rows: 3, help: 'One per line, picked at random.' }),
      F('wrongLines', 'textarea', 'What your guide says for a wrong answer', { rows: 3 })
    ] },
    { id: 'games', title: 'Mini games', fields: [
      F('meterOn', 'toggle', 'Love meter (it never goes below 100%)'),
      F('meterQ', 'text', 'Love meter question', { max: 60, show: d => d.meterOn !== false }),
      F('catchOn', 'toggle', 'Catch the falling hearts'),
      F('catchTitle', 'text', 'Catch game title', { max: 60, show: d => d.catchOn !== false }),
      F('memoryOn', 'toggle', 'Memory match'),
      F('memoryTitle', 'text', 'Memory game title', { max: 60, show: d => d.memoryOn !== false }),
      F('memoryCards', 'text', 'Stickers on the cards (2 to 4)', { max: 40, show: d => d.memoryOn !== false, help: 'Type 2 to 4 emoji with spaces, e.g. 😻 💖 🍓 🐻' }),
      F('scratchOn', 'toggle', 'Scratch card secret'),
      F('scratchTitle', 'text', 'Scratch card title', { max: 60, show: d => d.scratchOn !== false }),
      F('scratchText', 'textarea', 'The secret under the scratch card', { rows: 2, show: d => d.scratchOn !== false }),
      F('hugOn', 'toggle', 'Hold-to-hug button'),
      F('hugText', 'text', 'Hug title', { max: 60, show: d => d.hugOn !== false })
    ] },
    { id: 'final', title: 'The big question', fields: [
      F('finalQ', 'text', 'The question', { max: 80 }),
      F('yesText', 'text', 'Yes button', { max: 30 }),
      F('noLines', 'textarea', 'What the No button says', { rows: 5, help: 'One per line. Every tap makes No smaller and Yes bigger. After the last line No disappears.' })
    ] },
    { id: 'end', title: 'The ending', fields: [
      F('endTitle', 'text', 'Big title', { max: 50 }),
      F('message', 'textarea', 'Your message', { rows: 4 }),
      F('whatsapp', 'text', 'Your WhatsApp number (optional)', { max: 30, placeholder: 'e.g. +91 98765 43210', emoji: false, help: 'Adds a button that sends you their results. Leave empty and they choose who to send it to.' }),
      F('replyText', 'text', 'Message they send back', { max: 120 })
    ] }
  ];

  function mount(root, data, ctx) {
    const th = C.theme(data, 'strawberry'), preview = !!ctx.preview;
    const style = u.el('style', {}, C.css + CSS); document.head.append(style);
    const prevBg = document.body.style.background; document.body.style.background = th.bg2;
    root.className = 'tpl-quest' + (preview ? ' is-static' : '');
    root.style.cssText = C.vars(th) + ';' + C.fonts(data, 'chewy', 'nunito');

    const to = (data.to || '').trim(), from = (data.from || '').trim();
    const pet = (data.guide || data.mascot || '').trim() || '🐻';
    const quiz = quizOf(data), EX = C.extras(data), ex = id => EX[id] || {};
    const RIGHT = lines(data.rightLines).length ? lines(data.rightLines) : ['Correct! 🎉', 'You know me so well 🥹', 'Smarty pants 😏'];
    const WRONG = lines(data.wrongLines).length ? lines(data.wrongLines) : ['Wrong! Try again, silly 😹', 'Hmm… nope 🙈', 'Are you even trying? 😤'];
    const NO = lines(data.noLines).length ? lines(data.noLines) : ['No', 'Are you sure?', 'Tiny no?', 'no…', 'n'];
    const yesText = (data.yesText || '').trim() || 'Yes 💖';
    const CATCH = 6;
    let memo = [...String(data.memoryCards || '').matchAll(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu)].map(m => m[0]);
    memo = [...new Set(memo)].slice(0, 4); if (memo.length < 2) memo = ['😻', '💖', '🍓'];

    const P = levelsOf(data, quiz);
    const levels = P.length - 2;

    const page = (p, n) => {
      let h = '';
      if (p.k === 'intro') h = `<h1 class="q-h">${esc(data.introTitle || (to ? 'A tiny quest for ' + to : 'A tiny quest for you'))}</h1>
        <button class="q-heart" type="button" id="qHeart" aria-label="Tap the heart"><i>${stk('💗')}</i></button><p class="q-taps" id="qTaps">tap the heart 5 times</p>`;
      if (p.k === 'quiz') { const x = quiz[p.i]; h = `<h2 class="q-h">${esc(x.q)}</h2><div class="q-ans">${x.a.map((a, j) =>
        `<button class="q-btn" type="button" data-ok="${a.ok ? 1 : 0}" style="--i:${j}"><b>${'ABCDEFGH'[j] || '•'}</b><span>${esc(a.t)}</span></button>`).join('')}</div>`; }
      if (p.k === 'meter') h = `<h2 class="q-h">${esc(data.meterQ || 'How much do you love me?')}</h2><p class="q-num" id="qNum">30%</p>
        <input class="q-range" id="qRange" type="range" min="0" max="100" value="30" aria-label="Love meter"><p class="q-sm" id="qMeterHint">slide it 👉</p>`;
      if (p.k === 'catch') h = `<h2 class="q-h">${esc(data.catchTitle || `Catch ${CATCH} falling hearts!`)}</h2><div class="q-sky" id="qSky">${preview ? GOOD.slice(0, 4).map((e, i) => `<span class="q-fall" style="--x:${18 + i * 22}%">${stk(e)}</span>`).join('') : ''}</div>
        <p class="q-count" id="qCount">0 / ${CATCH}</p><p class="q-sm">tap the hearts · not the broken one 💔</p>`;
      if (p.k === 'memory') { const deck = [...memo, ...memo]; for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        h = `<h2 class="q-h">${esc(data.memoryTitle || 'Find the matching pairs')}</h2><div class="q-cards" style="--cols:${deck.length > 6 ? 4 : 3}">${deck.map((e, i) =>
          `<button class="q-card" type="button" data-e="${esc(e)}" style="--i:${i}" aria-label="Card ${i + 1}"><span class="q-cin"><span class="q-face f">?</span><span class="q-face b">${stk(e)}</span></span></button>`).join('')}</div>`; }
      if (p.k === 'scratch') h = `<h2 class="q-h">${esc(data.scratchTitle || 'Scratch to reveal a secret')}</h2>
        <div class="q-scratch" id="qScratch"><p class="q-secret">${esc(data.scratchText || 'You owe me 100 kisses 😘')}</p>${preview ? '' : '<canvas class="q-scv" id="qScv" aria-label="Scratch here"></canvas>'}</div><p class="q-sm" style="margin-top:16px" id="qScHint">scratch with your finger ✨</p>`;
      if (p.k === 'hug') h = `<h2 class="q-h">${esc(data.hugText || 'Hold the button to send me a hug')}</h2>
        <button class="q-hug" type="button" id="qHug" aria-label="Hold to hug"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="54"/><circle class="fg" id="qRing" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="339.3"/></svg>
        <span class="in">${stk('🫂')}</span></button><p class="q-sm" id="qHugHint" style="margin-top:16px">press and hold</p>`;
      if (p.k === 'final') h = `<h2 class="q-h">${esc(data.finalQ || 'Will you be my pookie forever?')}</h2>
        <div class="q-yn"><button class="q-btn main yes" type="button" id="qYes">${esc(yesText)}</button><button class="q-btn no" type="button" id="qNo">${esc(NO[0])}</button></div>`;
      if (p.k === 'end') h = `<h2 class="q-h">${esc(data.endTitle || 'Quest complete! 🏆')}</h2><div class="q-chips" id="qChips"></div>
        ${data.message ? `<p class="q-msg">${esc(data.message)}</p>` : ''}
        ${(data.replyText || '').trim() ? `<a class="q-btn main" id="qWa" href="#" target="_blank" rel="noopener">${esc(from ? 'Send my results to ' + from : 'Send my results')} 💬</a>` : ''}
        ${from ? `<p class="q-sign">— ${esc(from)}</p>` : ''}${u.STK_CREDIT}`;
      return `${preview && n ? `<p class="q-pv">↓ level ${n} ↓</p>` : ''}<section class="q-page" data-n="${n}" data-k="${p.k}"${preview || !n ? '' : ' hidden'}>${h}</section>`;
    };

    const nF = u.LITE ? 7 : 11;
    const floaty = preview ? '' : Array.from({ length: nF }, (_, i) =>
      `<i style="left:${(i / nF * 100 + rand(0, 8)).toFixed(1)}%;--s:${Math.round(rand(16, 32))}px;--d:${Math.round(rand(13, 22))}s;--l:-${Math.round(rand(0, 20))}s">${'♥✿♡★'[i % 4]}</i>`).join('');
    root.innerHTML = `<div class="q-float">${floaty}</div><canvas class="k-conf"></canvas>
      <main class="q-main"><div class="q-prog" id="qProg" aria-hidden="true"></div><div id="qGuide"></div>${P.map(page).join('')}</main>`;

    const $ = s => root.querySelector(s), pages = [...root.querySelectorAll('.q-page')], timers = [], T = (f, ms) => timers.push(setTimeout(f, ms));
    const G = C.guide(ex('intro').guide || pet, ex('intro').say || P[0].bub, data.photo); $('#qGuide').replaceWith(G.el);
    pages.forEach((pg, n) => C.placePhotos(pg, EX[P[n].id]));
    const say = (t, re) => G.say(t, re);
    [...REACT.right, ...REACT.wrong, '😤', '♾️', '🥰', '🥺', '🔋', '😍', '🤭', '😿', ...GOOD, '💔', ...memo].forEach((e, i) => T(() => u.preloadStk(e), 1500 + i * 60));
    const fx = C.confetti($('.k-conf'), th.cols);
    let dead = false;

    /* moving between levels */
    let at = 0;
    const starts = {}; // things a level does when it appears
    const prog = () => { $('#qProg').innerHTML = at === 0 || at === P.length - 1 ? '' : Array.from({ length: levels }, (_, i) => `<i class="${i < at ? 'on' : ''}">♥</i>`).join(''); };
    const go = n => {
      if (preview) return;
      pages[at].hidden = true; at = n; const pg = pages[at];
      pg.hidden = false; pg.classList.remove('in'); void pg.offsetWidth; pg.classList.add('in');
      scrollTo(0, 0); prog(); G.setPet(ex(P[at].id).guide || pet); say(ex(P[at].id).say || P[at].bub);
      if (starts[P[at].k]) starts[P[at].k](pg);
      if (P[at].k === 'end') finish();
    };
    const nextBtn = (pg, label) => { if (pg.querySelector('.q-next')) return; pg.append(u.el('button', { class: 'q-btn main q-next', type: 'button', onclick: () => go(at + 1) }, label || 'Next level →')); };
    const pageOf = k => pages[P.findIndex(p => p.k === k)];
    const result = { score: 0, love: '', hug: false, caught: 0, memory: false, secret: false };

    /* level 0: tap the heart five times */
    const heartBtn = $('#qHeart'), taps = $('#qTaps'); let hits = 0;
    heartBtn.addEventListener('click', () => {
      ctx.start();
      if (hits >= 5) return; hits++;
      heartBtn.style.transform = `scale(${1 + hits * .09})`; heartBtn.classList.remove('hit'); void heartBtn.offsetWidth; heartBtn.classList.add('hit');
      fx.at(heartBtn, 14);
      taps.textContent = hits < 5 ? (5 - hits) + ' more…' : 'yay!';
      if (hits === 3) say('Keep going! 🥹', '🥺');
      if (hits === 5) { fx.at(heartBtn, 120); heartBtn.style.transform = 'scale(0)'; T(() => go(1), 650); }
    });

    /* quiz */
    pages.forEach((pg, n) => {
      if (P[n].k !== 'quiz') return;
      let missed = false, done = false;
      pg.querySelectorAll('.q-ans .q-btn').forEach(b => b.addEventListener('click', () => {
        if (done || b.classList.contains('bad')) return;
        if (b.dataset.ok === '1') {
          done = true; if (!missed) result.score++;
          b.classList.add('good'); fx.at(b, 50); say(pick(RIGHT), pick(REACT.right));
          T(() => go(n + 1), 1300);
        } else {
          missed = true; b.classList.add('bad'); say(pick(WRONG), pick(REACT.wrong));
          if (navigator.vibrate) navigator.vibrate(40);
        }
      }));
    });

    /* love meter: anything under 100 slides back up, then it overflows to infinity */
    const tween = (from, toV, ms, each, done) => { const t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); each(from + (toV - from) * e); if (k < 1 && !dead) requestAnimationFrame(f); else if (done && !dead) done(); })(t0); };
    const range = $('#qRange');
    if (range) {
      const num = $('#qNum'), hint = $('#qMeterHint'); let locked = false;
      const show = v => { num.textContent = Math.round(v) + '%'; range.style.setProperty('--v', v + '%'); };
      const overflow = () => {
        locked = true; range.disabled = true; hint.textContent = '';
        tween(100, 999, 1400, v => { num.textContent = Math.round(v) + '%'; }, () => {
          num.textContent = '∞'; num.classList.add('boom'); result.love = '∞'; fx.at(num, 110); say('Infinity?! I knew it 🥹', '♾️');
          nextBtn(pageOf('meter'));
        });
      };
      range.addEventListener('input', () => { if (!locked) { show(+range.value); if (+range.value >= 100) overflow(); } });
      const release = () => {
        if (locked || +range.value >= 100) return;
        locked = true; say(+range.value < 50 ? 'Excuse me?! 😤 Let me fix that…' : 'Hmm, not enough 😤', '😤');
        tween(+range.value, 100, 900, v => { range.value = v; show(v); }, overflow);
      };
      range.addEventListener('change', release); range.addEventListener('pointerup', release);
    }

    /* catch the falling hearts (and dodge the broken one) */
    starts.catch = pg => {
      const sky = $('#qSky'), count = $('#qCount'); let live = 0, done = false, iv = 0;
      sky.style.setProperty('--h', (sky.clientHeight + 140) + 'px');
      const spawn = () => {
        if (done || dead || live >= (u.LITE ? 4 : 5)) return;
        const bad = result.caught > 0 && Math.random() < .2, e = bad ? '💔' : pick(GOOD);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'q-fall'; b.setAttribute('aria-label', bad ? 'Broken heart' : 'Heart');
        b.style.cssText = `--x:${rand(12, 88).toFixed(0)}%;--dur:${rand(2.6, 4).toFixed(2)}s`; b.innerHTML = stk(e); live++;
        b.addEventListener('animationend', () => { if (!b.classList.contains('got')) { b.remove(); live--; } });
        b.addEventListener('pointerdown', ev => {
          ev.preventDefault(); if (done || b.classList.contains('got')) return;
          let y = 0; try { y = new DOMMatrix(getComputedStyle(b).transform).m42; } catch (_) {}
          b.style.setProperty('--y', y + 'px'); b.classList.add('got'); live--;
          b.addEventListener('animationend', () => b.remove(), { once: true });
          if (bad) { say('Not that one! 💔', '😿'); if (navigator.vibrate) navigator.vibrate(60); result.caught = Math.max(0, result.caught - 1); }
          else { result.caught++; fx.burst(ev.clientX, ev.clientY, 18); if (result.caught === 3) say('Halfway there! 🤩'); }
          count.textContent = `${result.caught} / ${CATCH}`; count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
          if (result.caught >= CATCH) {
            done = true; clearInterval(iv); sky.querySelectorAll('.q-fall:not(.got)').forEach(x => { x.style.transition = 'opacity .3s'; x.style.opacity = '0'; });
            say('You caught my heart 🥹', '🥰'); fx.at(count, 90); nextBtn(pg);
          }
        });
        sky.append(b);
      };
      spawn(); iv = setInterval(spawn, u.LITE ? 720 : 600); timers.push(iv);
    };

    /* memory match */
    starts.memory = pg => {
      let open = [], lock = false, found = 0;
      pg.querySelectorAll('.q-card').forEach(c => c.addEventListener('click', () => {
        if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
        c.classList.add('flip'); open.push(c);
        if (open.length < 2) return;
        const [a, b] = open; open = [];
        if (a.dataset.e === b.dataset.e) {
          a.classList.add('done'); b.classList.add('done'); found++; fx.at(b, 30);
          if (found === memo.length) { result.memory = true; T(() => { say('Memory master! 🤩', '🤩'); fx.rain(); nextBtn(pg); }, 400); }
          else say(pick(['A match! 💞', 'Yesss 🥳', 'Look at you go 😍']));
        } else {
          lock = true; say(pick(['Oops, try again 🙈', 'So close! 😹', 'Nope, not those 🤭']));
          T(() => { a.classList.remove('flip'); b.classList.remove('flip'); lock = false; }, 800);
        }
      }));
    };

    /* scratch card */
    starts.scratch = pg => {
      const cv = $('#qScv'); if (!cv) return;
      const box = $('#qScratch'), r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      const g = cv.getContext('2d', { willReadFrequently: true }); g.scale(d, d);
      const gr = g.createLinearGradient(0, 0, r.width, r.height); gr.addColorStop(0, th.pop); gr.addColorStop(1, th.pop2);
      g.fillStyle = gr; g.fillRect(0, 0, r.width, r.height);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.font = '16px sans-serif';
      for (let y = 14; y < r.height; y += 30) for (let x = (y / 30 % 2) * 15 + 10; x < r.width; x += 30) g.fillText('♥', x, y);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${Math.round(r.width / 9)}px Caveat, cursive`; g.fillText('scratch me ✨', r.width / 2, r.height / 2);
      g.globalCompositeOperation = 'destination-out'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = 46;
      let down = false, lx = 0, ly = 0, moves = 0, done = false;
      const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      const check = () => {
        const im = g.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0;
        for (let i = 3; i < im.length; i += 4 * 23) { n++; if (im[i] < 40) clear++; }
        if (clear / n > .5 && !done) {
          done = true; result.secret = true; cv.classList.add('gone'); T(() => cv.remove(), 700);
          $('#qScHint').textContent = ''; fx.at(box, 80); say('Hehe, now you know 🤭', '🤭'); nextBtn(pg);
        }
      };
      cv.addEventListener('pointerdown', e => { if (done) return; e.preventDefault(); down = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} [lx, ly] = pos(e); g.beginPath(); g.arc(lx, ly, 23, 0, 6.283); g.fill(); });
      cv.addEventListener('pointermove', e => {
        if (!down || done) return; const [x, y] = pos(e);
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y;
        if (++moves % 10 === 0) check();
      });
      const up = () => { if (down) { down = false; check(); } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    };

    /* hold to hug */
    const hug = $('#qHug');
    if (hug) {
      const ring = $('#qRing'), inner = hug.querySelector('.in'), hint = $('#qHugHint'), FULL = 339.3, MS = 1800;
      let p = 0, holding = false, last = 0, loop = 0, done = false;
      const draw = () => { ring.style.strokeDashoffset = (FULL * (1 - p)).toFixed(1); inner.style.transform = `scale(${(1 - .08 * p).toFixed(3)})`; };
      const tick = now => {
        const dt = now - last; last = now;
        p = Math.max(0, Math.min(1, p + (holding ? dt / MS : -dt / 500))); draw();
        if (p >= 1 && !done) {
          done = true; holding = false; hug.classList.add('done'); inner.style.transform = ''; result.hug = true;
          if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
          fx.at(hug, 130); say('Best. Hug. Ever. 🥰', '🥰'); hint.textContent = 'hug delivered 💌'; nextBtn(pageOf('hug')); loop = 0; return;
        }
        loop = (holding || p > 0) && !dead ? requestAnimationFrame(tick) : 0;
      };
      const down = e => { if (done) return; e.preventDefault(); ctx.start(); holding = true; hint.textContent = 'keep holding…'; last = performance.now(); if (!loop) loop = requestAnimationFrame(tick); };
      const up = () => { if (done || !holding) return; holding = false; if (p < 1) { say('Longer! Hugs need time 🫂', '🥺'); hint.textContent = 'press and hold'; } };
      hug.addEventListener('pointerdown', down);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => hug.addEventListener(ev, up));
      hug.addEventListener('contextmenu', e => e.preventDefault());
      hug.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
      hug.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
    }

    /* the big question: No shrinks every tap, then poofs */
    const yes = $('#qYes'), no = $('#qNo'); let nos = 0, said = false;
    no.addEventListener('click', () => {
      nos++;
      if (nos >= NO.length) { no.classList.add('poof'); say('Oops, the No button ran out of battery 🔋', '🔋'); yes.style.transform = 'scale(1.5)'; return; }
      no.textContent = NO[nos]; no.style.transform = `scale(${Math.pow(.8, nos).toFixed(2)})`; yes.style.transform = `scale(${(1 + nos * .12).toFixed(2)})`;
      say(['Wrong button 😳', 'Try the other one 👉', 'Hmm? 🥺', 'I can’t hear you 🙉'][(nos - 1) % 4], '🥺');
    });
    yes.addEventListener('click', () => { if (said && !preview) return; said = true; fx.at(yes, 150); fx.rain(); T(() => go(at + 1), 700); });

    /* the end: results to send back */
    function finish() {
      const chips = [];
      if (quiz.length) chips.push(result.score === quiz.length ? ['🤩', `Quiz ${quiz.length}/${quiz.length}, genius`] : ['😹', `Quiz ${result.score}/${quiz.length} (still cute)`]);
      if (result.love) chips.push(['💗', 'Love: ' + result.love]);
      if (result.caught) chips.push(['💘', `Caught ${result.caught} hearts`]);
      if (result.memory) chips.push(['🧠', 'Memory master']);
      if (result.secret) chips.push(['🤭', 'Secret found']);
      if (result.hug) chips.push(['🫂', 'Hug delivered']);
      chips.push(['💍', yesText]);
      $('#qChips').innerHTML = chips.map(([e, t], i) => `<span class="q-chip" style="--i:${i}">${stk(e)}${esc(t)}</span>`).join('');
      const wa = $('#qWa');
      if (wa) wa.href = u.waLink(data.whatsapp, (data.replyText || '').trim() + '\n\n' + chips.map(c => c.join(' ')).join('\n'));
      T(fx.rain, 300);
    }
    if (preview) finish();

    return {
      destroy() {
        dead = true; fx.destroy(); timers.forEach(t => { clearTimeout(t); clearInterval(t); });
        style.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg;
      }
    };
  }

  const thumb = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><pattern id="qd" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2.2" fill="#ff5277" opacity=".14"/></pattern>
    <linearGradient id="qg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4f6"/><stop offset="1" stop-color="#ffd7e0"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#qg)"/><rect width="400" height="300" fill="url(#qd)"/>
    <g fill="#ff5277"><text x="150" y="30" font-size="16">♥</text><text x="172" y="30" font-size="16">♥</text><text x="194" y="30" font-size="16" opacity=".3">♥</text><text x="216" y="30" font-size="16" opacity=".3">♥</text></g>
    <rect x="96" y="44" width="208" height="40" rx="18" fill="#fff"/><path d="M192 82l8 10 8-10z" fill="#fff"/>
    <text x="200" y="70" text-anchor="middle" font-family="'Nunito',sans-serif" font-weight="800" font-size="15" fill="#5a1a2b">Psst! A tiny quest for you 💌</text>
    <text x="200" y="146" text-anchor="middle" font-size="52">🐻</text>
    <path d="M200 268s-46-29-58-60c-9-24 6-44 26-44 13 0 23 7 32 20 9-13 19-20 32-20 20 0 35 20 26 44-12 31-58 60-58 60z" fill="#ff5277"/>
    <text x="200" y="226" text-anchor="middle" font-family="'Chewy','Trebuchet MS',cursive" font-size="22" fill="#fff">tap me!</text></svg>`;

  KS.registerTemplate({
    id: 'quest', emoji: true, group: 'Letters and birthdays', name: 'Little love quest',
    tagline: 'A cute guide takes them through mini games: tap a heart, a silly quiz, a love meter, catch the hearts, memory match, a scratch card, a hug, then the big question.',
    for: 'Valentine’s, anniversaries, “be my pookie”, cheering someone up',
    title: d => (d.to ? 'A tiny quest for ' + d.to : 'A tiny quest for you'),
    defaultMusic: { type: 'library', id: 'g2' },
    schema: SCHEMA, thumb, mount,
    sample: {
      to: 'Maya', from: 'Arjun', guide: '🐻', photo: '', theme: 'strawberry', titleFont: 'chewy', bodyFont: 'nunito', introTitle: '', introBubble: '',
      quiz: [
        { q: 'Who is the cutest person in the whole world?', answers: '*You, obviously 💖\nA random potato 🥔\nMe? 🤔\n*Also you 😌' },
        { q: 'What do I miss the most when you’re not around?', answers: 'The Wi-Fi 📶\n*Your laugh 😊\nPizza 🍕\n*Literally everything about you 💞' },
        { q: 'Where would I rather be right now?', answers: '*Next to you 🫂\nAt work 😩\nAt the gym 💪\nIn a meeting 📊' }
      ],
      rightLines: 'Correct! 🎉\nYou know me so well 🥹\nSmarty pants 😏\nPerfect answer 💯',
      wrongLines: 'Wrong! Try again, silly 😹\nHmm… nope 🙈\nAre you even trying? 😤\nThink harder, cutie 🤔',
      meterOn: true, meterQ: 'How much do you love me?',
      catchOn: true, catchTitle: '',
      memoryOn: true, memoryTitle: '', memoryCards: '😻 💖 🍓',
      scratchOn: true, scratchTitle: '', scratchText: 'You owe me 100 kisses 😘',
      hugOn: true, hugText: 'Hold the button to send me a hug',
      finalQ: 'Will you be my pookie forever?', yesText: 'Yes, forever 💖', noLines: 'No\nAre you sure?\nTiny no?\nno…\nn',
      endTitle: 'Quest complete! 🏆', message: 'You passed every level, and your prize is… me. Forever.\nNo refunds 😌',
      whatsapp: '', replyText: 'I finished your little quest 💖'
    }
  });
})();
