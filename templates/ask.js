/* Templates: Little questions. A playful page that asks one thing, where the "No" button runs away from their finger.
   ask-date  -> "Will you go out with me?" then cute planning pages and the plan (when, where, add to calendar)
   ask-sorry -> "I'm sorry, forgive me?" then sorry coupons they can tap to claim
   A little guide (any animated sticker) comments in a speech bubble. Every escape attempt changes the No button's words,
   the guide reacts and Yes grows; after the last line No gives up and becomes a Yes. Colours, fonts and guide come from js/cute.js. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, C = KS.cute, esc = u.esc, rand = u.rand, stk = u.stk;

  const MODES = {
    date: {
      guide: '😺', theme: 'pink', faces: ['🥺', '🙀', '😿', '😾', '😭', '💔', '🙏', '🥹'], happy: '😻',
      first: (to, from) => `Psst… ${from ? from + ' has' : 'I have'} a question for you${to ? ', ' + to : ''} 👀`,
      lines: 'Hey! Wrong button 😳\nTry the other one 👉\nMy heart… 💔\nPleeease? 🥺\nThey practised this all day 😿\nI’m telling everyone 😾\nOkay, this is getting sad 😭',
      gaveUp: 'See? Even the button agrees 😌', yay: 'Yaaay!! 🎉', pickLines: ['Ooh, good question 🤔', 'Pick one, pookie 🐾', 'Choose wisely 😼', 'I vote snacks 🍿'], end: 'It’s official!! 🥳',
      noLines: 'No\nAre you sure?\nReally sure??\nThink again 🤔\nPretty please?\nWith extra fries?\nI’ll pay for dessert!\nYou’re breaking my heart 💔\nOkay, this button is broken now',
      sample: {
        to: 'Maya', question: 'Will you go on a date with me?', sub: 'I’ve been wanting to ask for a while…', theme: 'pink', photo: '', guide: '😺', guideLines: '',
        yesText: 'Yes!', yayTitle: 'Yaaay! 😻', yayLine: 'You just made this kitty the happiest in the whole world', planBtn: 'Let’s plan it, pookie 🐾',
        steps: [
          { q: 'Okay pookie, what are we doing?', options: '🍿 Movie night\n🍕 Pizza date\n☕ Cozy café\n🍦 Ice cream walk\n🌅 Sunset somewhere pretty\n🎡 Fun fair' },
          { q: 'And what are we eating, my little kitty?', options: '🍕 Pizza\n🍔 Burgers\n🍜 Noodles\n🍿 Snacks & a movie\n🍦 Only dessert\n🧋 Bubble tea' },
          { q: 'When are you free, cutie?', options: '✨ This weekend\n🌅 Tomorrow!\n🥳 Right now!\n💌 You pick, I’ll be there' }
        ],
        endTitle: 'It’s a date, pookie! 💖', message: 'I can’t wait.\nI promise it’ll be fun (and there will be snacks).', from: 'Arjun',
        planOn: true, planTitle: 'Here’s the plan', planDate: '', planTime: '19:30', planPlace: { name: '', address: '', url: '' }, planNote: 'Wear something comfy. I’ll pick you up 🚗',
        whatsapp: '', replyText: 'YES! 💖 I’d love to go on a date with you.'
      }
    },
    sorry: {
      guide: '🐻', theme: 'lavender', faces: ['🥺', '😿', '🥹', '😭', '🙏', '😾', '💔', '🫠'], happy: '🥰',
      first: (to, from) => `${from || 'Someone'} has something to say${to ? ' to you, ' + to : ''}… 🥺`,
      lines: 'Ouch 😿\nThey really mean it 🥺\nLook at this face 🥹\nEveryone makes mistakes 🙏\nOne more chance? 💗\nThe button is crying now 😭',
      gaveUp: 'Forgiveness accepted by the button too 😌', yay: 'Yaaay, hug time! 🫂', end: 'Friends again!! 💞',
      noLines: 'No\nPlease?\nI said sorry 🥺\nI’ll buy you snacks\nAnd do the dishes\nFor a whole week!\nOkay, two weeks\nFine, I’m crying now 😭',
      sample: {
        to: 'Sam', question: 'I’m really sorry. Forgive me?', sub: 'I was wrong, and I miss you already.', theme: 'lavender', photo: '', guide: '🐻', guideLines: '',
        yesText: 'Okay, forgiven', yayTitle: 'Thank you! 🤍', message: 'I’ll do better. Here are a few things I owe you, claim them whenever you like.', from: 'Alex',
        coupons: [{ text: 'One free hug, any time' }, { text: 'I do the dishes for a week' }, { text: 'Your pick of movie, no complaints' }, { text: 'Unlimited snacks, on me' }],
        whatsapp: '', replyText: 'Okay okay, you’re forgiven 🤗'
      }
    }
  };

  const CSS = `
  .tpl-ask{font-family:var(--body);color:var(--ink);min-height:100vh;overflow-x:hidden;position:relative}
  .tpl-ask *{box-sizing:border-box}
  .tpl-ask::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;transform:translateZ(0);
    background:radial-gradient(var(--dot) 2.4px,transparent 3px) 0 0/30px 30px,radial-gradient(120% 80% at 50% 0%,var(--bg1),var(--bg2))}
  .a-hearts{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .a-hearts i{position:absolute;bottom:-50px;font-style:normal;color:var(--pop);opacity:.2;font-size:var(--s);animation:afloat var(--d) linear var(--l) infinite}
  @keyframes afloat{to{transform:translateY(calc(-100vh - 100px)) rotate(30deg)}}
  .a-scr{position:relative;z-index:2;min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 20px calc(70px + env(safe-area-inset-bottom))}
  .a-q{transition:opacity .45s ease,transform .45s ease}
  .a-q.gone{opacity:0;transform:scale(.96);pointer-events:none}
  .a-to{font:700 clamp(28px,7.6vw,36px)/1 var(--hand);color:var(--pop);margin:4px 0 8px}
  .a-qh{font:var(--dw) clamp(30px,8.6vw,52px)/1.1 var(--disp);margin:0 0 12px;max-width:640px;text-wrap:balance}
  .a-sub{font:var(--bw) clamp(16px,4.2vw,19px)/1.5 var(--body);color:var(--muted);margin:0 0 30px;max-width:460px;white-space:pre-line}
  .a-btns{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:80px}
  .a-btn{appearance:none;border:0;cursor:pointer;font:var(--bw) clamp(18px,4.8vw,22px) var(--body);border-radius:999px;padding:14px 34px;-webkit-user-select:none;user-select:none;touch-action:manipulation;text-decoration:none;display:inline-block}
  .a-yes{background:var(--pop);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 60%,#000);position:relative;z-index:3;transition:transform .3s cubic-bezier(.3,1.5,.5,1)}
  .a-yes.jelly{animation:ajelly 1.6s ease-in-out infinite}
  @keyframes ajelly{0%,70%,100%{scale:1}78%{scale:1.08 .92}86%{scale:.95 1.05}93%{scale:1.02 .98}}
  .a-no{background:var(--card);color:var(--ink);box-shadow:0 6px 0 var(--pop2);white-space:nowrap;z-index:50}
  .a-no.fly{position:fixed;left:0;top:0;margin:0;transition:transform .32s cubic-bezier(.3,1.4,.5,1);will-change:transform}
  .a-ph{display:inline-block;visibility:hidden}
  .a-enter{animation:aenter .5s cubic-bezier(.2,1,.4,1) both}
  @keyframes aenter{from{opacity:0;transform:translateY(26px)}}
  .a-yay{font:var(--dw) clamp(34px,10vw,60px)/1.05 var(--disp);color:var(--pop);margin:0 0 14px;text-wrap:balance}
  .a-yline{font:700 clamp(23px,6.2vw,30px)/1.3 var(--hand);margin:0 0 26px;max-width:480px}
  .a-msg{font:700 clamp(24px,6.4vw,32px)/1.3 var(--hand);max-width:540px;margin:0 auto 26px;white-space:pre-line}
  .a-card{background:var(--card);border-radius:22px;padding:22px 20px;width:min(100%,440px);box-shadow:0 10px 0 var(--pop2);margin:0 auto 24px}
  .a-card h3{margin:0 0 12px;font:var(--dw) 22px var(--disp);color:var(--pop)}
  .a-when{font:var(--bw) 19px/1.35 var(--body);margin:0}
  .a-where{font:var(--bw) 17px var(--body);margin:10px 0 0}.a-addr{font:15px var(--body);color:var(--muted);margin:2px 0 0}
  .a-note{font:700 23px/1.3 var(--hand);margin:12px 0 0;white-space:pre-line}
  .a-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
  .a-sm{font-size:15px;padding:11px 20px}
  .a-alt{background:transparent;color:var(--pop);box-shadow:inset 0 0 0 2px var(--pop)}
  .a-coups{display:grid;gap:12px;width:min(100%,440px);margin:0 auto 24px}
  .a-coup{position:relative;display:flex;align-items:center;gap:14px;text-align:left;width:100%;appearance:none;cursor:pointer;background:var(--card);color:var(--ink);
    border:2px dashed color-mix(in srgb,var(--pop) 55%,transparent);border-radius:16px;padding:14px 16px;font:var(--bw) 17px/1.35 var(--body);touch-action:manipulation}
  .a-coup .ic{font-size:28px;flex:none}
  .a-coup b{display:block;font:var(--bw) 11px var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--pop);margin-bottom:2px}
  .a-coup::after{content:'CLAIMED ✓';position:absolute;right:12px;top:50%;transform:translateY(-50%) rotate(-12deg) scale(1.6);font:var(--bw) 13px var(--body);letter-spacing:.08em;color:var(--pop);
    border:2px solid var(--pop);border-radius:6px;padding:3px 7px;background:var(--card);opacity:0;transition:opacity .2s,transform .3s cubic-bezier(.3,1.6,.5,1);pointer-events:none}
  .a-coup.used::after{opacity:1;transform:translateY(-50%) rotate(-12deg) scale(1)}
  .a-tap{font:700 20px var(--hand);color:var(--muted);margin:-12px 0 22px}
  .a-sign{font:700 clamp(30px,8vw,42px) var(--hand);color:var(--pop);margin:14px 0 0}
  .a-paws{display:flex;gap:8px;justify-content:center;margin:0 0 10px;font-size:20px}
  .a-paws i{font-style:normal;opacity:.22}.a-paws i.on{opacity:1}
  .a-step h2{font:var(--dw) clamp(26px,7.4vw,40px)/1.15 var(--disp);margin:0 0 22px;max-width:560px;text-wrap:balance}
  .a-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:min(100%,460px)}
  .a-opt{appearance:none;cursor:pointer;border:3px solid transparent;background:var(--card);color:var(--ink);border-radius:20px;padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:8px;
    font:var(--bw) 16px/1.25 var(--body);box-shadow:0 6px 0 var(--pop2);transition:transform .15s,border-color .15s;touch-action:manipulation;animation:kpop .45s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--i) * 70ms + .1s)}
  .a-opt .stk,.a-opt .stk-t{width:64px;height:64px;font-size:46px;line-height:64px;text-align:center}
  .a-opt:active{transform:scale(.96)}
  .a-opt.sel{border-color:var(--pop);transform:scale(1.04)}
  .a-back{appearance:none;border:0;background:none;color:var(--muted);font:700 21px var(--hand);margin-top:22px;cursor:pointer;padding:8px}
  .a-picks{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:0 auto 24px;max-width:480px}
  .a-pick{display:flex;align-items:center;gap:6px;background:var(--card);border-radius:999px;padding:6px 14px 6px 6px;font:var(--bw) 15px var(--body);box-shadow:0 4px 0 var(--pop2)}
  .a-pick .stk,.a-pick .stk-t{width:32px;height:32px;font-size:24px;line-height:32px;text-align:center}
  .a-pv{position:relative;z-index:2;text-align:center;font:var(--bw) 12px var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);padding:14px 0;border-top:2px dashed color-mix(in srgb,var(--muted) 40%,transparent);margin:0 20px}
  .is-static .a-hearts i,.is-static .a-enter,.is-static .a-opt,.is-static .a-yes.jelly{animation:none}
  @media(prefers-reduced-motion:reduce){.a-hearts i,.a-enter,.a-opt,.a-yes.jelly{animation:none}.a-no.fly,.a-yes{transition:none}}
  `;

  const field = (key, type, label, more) => Object.assign({ key, type, label }, more || {});
  const stepsOf = (mode, d) => (mode === 'date' ? d.steps || [] : []).map(st => ({ q: (st && st.q || '').trim(), opts: String(st && st.options || '').split('\n').map(u.splitEmoji).filter(o => o.e || o.l) })).filter(st => st.opts.length);
  /* the pages a visitor goes through, for "Page by page" */
  const pagesOf = (mode, d) => {
    const st = stepsOf(mode, d);
    return [['q', 'The question'], ['yes', 'After they say yes'], ...st.map((x, i) => ['s' + (i + 1), 'Planning page ' + (i + 1) + (x.q ? ': ' + x.q : '')]), ...(st.length ? [['end', 'Last page']] : [])];
  };
  const schema = mode => [
    { id: 'ask', title: mode === 'date' ? 'The question' : 'Your apology', open: true, fields: [
      field('to', 'text', 'Their name', { max: 30 }),
      field('question', 'text', 'The big question', { max: 80 }),
      field('sub', 'textarea', 'A line underneath (optional)', { rows: 2 }),
      field('from', 'text', 'Your name', { max: 30 })
    ] },
    { id: 'guide', title: 'Little guide', fields: [
      ...C.guideFields(MODES[mode].guide, 'What your guide says each time they try No', 'One per line, in order. Leave empty for the built-in lines.'),
      field('photo', 'image', 'Your photo instead (optional)', { help: 'Shows your photo in a circle with the guide as a little badge.' })
    ] },
    { id: 'look', title: 'Colours and lettering', fields: C.lookFields(MODES[mode].theme, 'fredoka', 'fredoka') },
    { id: 'pages', title: 'Page by page: guides and photos', fields: C.pageFields(d => pagesOf(mode, d)) },
    { id: 'trick', title: 'The runaway No button', fields: [
      field('yesText', 'text', 'Words on the Yes button', { max: 24 }),
      field('noLines', 'textarea', 'What the No button says', { rows: 9, help: 'One per line. Each time they try to tap No, it runs away and shows the next line while Yes gets bigger. After the last line it gives up and turns into another Yes.' })
    ] },
    { id: 'yes', title: 'After they say yes', fields: [
      field('yayTitle', 'text', 'Big happy line', { max: 60 }),
      ...(mode === 'date' ? [
        field('yayLine', 'text', 'Cute line under it', { max: 90 }),
        field('planBtn', 'text', 'Button to start the planning pages', { max: 40 }),
        { key: 'steps', type: 'repeater', label: 'Cute planning pages', max: 6, addLabel: 'Add a question page', itemLabel: 'Page', title: i => i.q, blank: { q: '', options: '' },
          help: 'Each page asks one fun question with choices to tap. Start a choice with an emoji (🍿 🍕 😻 💖 …) and it shows as an animated sticker. Their picks are sent back to you.',
          fields: [field('q', 'text', 'Question', { max: 80 }), field('options', 'textarea', 'Choices, one per line', { rows: 6, placeholder: '🍿 Movie night' })] },
        field('endTitle', 'text', 'Title on the last page', { max: 60 })
      ] : []),
      field('message', 'textarea', 'Your message', { rows: 4 }),
      ...(mode === 'date' ? [
        field('planOn', 'toggle', 'Show the date plan'),
        field('planTitle', 'text', 'Heading', { max: 40, show: d => d.planOn }),
        field('planDate', 'date', 'Date', { show: d => d.planOn }),
        field('planTime', 'time', 'Time', { show: d => d.planOn }),
        field('planPlace', 'place', 'Where', { show: d => d.planOn }),
        field('planNote', 'textarea', 'Anything to know', { rows: 2, show: d => d.planOn })
      ] : [
        { key: 'coupons', type: 'repeater', label: '', max: 8, addLabel: 'Add a sorry coupon', itemLabel: 'Coupon', title: i => i.text, blank: { text: '' },
          help: 'Little promises they can tap to claim, like "one free hug" or "I cook dinner".', fields: [field('text', 'text', 'The promise', { max: 70 })] }
      ]),
      field('whatsapp', 'text', 'Your WhatsApp number (optional)', { max: 30, placeholder: 'e.g. +91 98765 43210', emoji: false, help: 'Adds a button so they can send you their answer. Leave it empty and they choose who to send it to.' }),
      field('replyText', 'text', 'Message they send back', { max: 120 })
    ] }
  ];

  function mount(root, data, ctx, mode) {
    const M = MODES[mode], th = C.theme(data, M.theme), preview = !!ctx.preview;
    const style = u.el('style', {}, C.css + CSS); document.head.append(style);
    const prevBg = document.body.style.background;
    document.body.style.background = th.bg2;
    root.className = 'tpl-ask' + (preview ? ' is-static' : '');
    root.style.cssText = C.vars(th) + ';' + C.fonts(data, 'fredoka', 'fredoka');

    const NO = (data.noLines || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (!NO.length) NO.push(...M.noLines.split('\n'));
    const SAY = ((data.guideLines || '').trim() || M.lines).split('\n').map(s => s.trim()).filter(Boolean);
    const yesText = (data.yesText || '').trim() || 'Yes';
    const to = (data.to || '').trim(), from = (data.from || '').trim();
    const pet = (data.guide || '').trim() || M.guide;
    const steps = stepsOf(mode, data), EX = C.extras(data), ids = pagesOf(mode, data).map(x => x[0]), ex = id => EX[id] || {};

    /* after-yes content */
    const A = [];
    if (mode === 'date' && data.planOn) {
      const pl = data.planPlace || {}, hasPl = !!(pl.name || pl.address), maps = hasPl ? u.mapsUrl(pl) : '';
      const when = [u.fmtDate(data.planDate), u.fmtTime(data.planTime)].filter(Boolean).join(' at ');
      const ics = data.planDate ? u.ics({ title: from ? 'Date with ' + from : 'Our date', date: data.planDate, time: data.planTime, place: hasPl ? pl : null, note: data.planNote }) : '';
      A.push(`<div class="a-card"><h3>${esc(data.planTitle || 'Here’s the plan')}</h3>${when ? `<p class="a-when">${esc(when)}</p>` : ''}
        ${hasPl ? `<p class="a-where">📍 ${esc(pl.name || pl.address)}</p>${pl.name && pl.address ? `<p class="a-addr">${esc(pl.address)}</p>` : ''}` : ''}
        ${data.planNote ? `<p class="a-note">${esc(data.planNote)}</p>` : ''}
        ${maps || ics ? `<div class="a-row">${maps ? `<a class="a-btn a-yes a-sm" href="${esc(maps)}" target="_blank" rel="noopener">Directions</a>` : ''}${ics ? `<a class="a-btn a-alt a-sm" href="${ics}" download="our-date.ics">Add to calendar</a>` : ''}</div>` : ''}</div>`);
    }
    const coupons = mode === 'sorry' ? (data.coupons || []).filter(c => c && (c.text || '').trim()) : [];
    if (coupons.length) {
      const ic = ['🤗', '🍽️', '🎬', '🍫', '💐', '☕', '🍕', '💌'];
      A.push(`<p class="a-tap">tap one to claim it ✨</p><div class="a-coups">${coupons.map((c, i) => `<button class="a-coup" type="button"><span class="ic">${ic[i % ic.length]}</span><span><b>Sorry coupon</b>${esc(c.text)}</span></button>`).join('')}</div>`);
    }
    const wa = String(data.whatsapp || '').replace(/[^\d]/g, ''), reply = (data.replyText || '').trim();
    const waHref = extra => `https://wa.me/${wa}?text=${encodeURIComponent(reply + (extra ? '\n\n' + extra : ''))}`;
    if (reply) A.push(`<div class="a-row"><a class="a-btn a-yes" id="aWa" href="${esc(waHref(''))}" target="_blank" rel="noopener">${esc(from ? 'Tell ' + from : 'Send your answer')} 💬</a></div>`);

    const nH = u.LITE ? 7 : 11;
    const hearts = preview ? '' : Array.from({ length: nH }, (_, i) =>
      `<i style="left:${(i / nH * 100 + rand(0, 8)).toFixed(1)}%;--s:${Math.round(rand(16, 34))}px;--d:${Math.round(rand(12, 22))}s;--l:-${Math.round(rand(0, 20))}s">${mode === 'date' && i % 3 === 1 ? '🐾' : '♥'}</i>`).join('');
    const pv = t => preview ? `<p class="a-pv">↓ ${t} ↓</p>` : '';
    const hid = preview ? '' : ' hidden';
    const sign = from ? `<p class="a-sign">— ${esc(from)}</p>` : '';
    const paws = i => `<div class="a-paws" aria-label="Page ${i + 1} of ${steps.length}">${steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}">🐾</i>`).join('')}</div>`;
    const stepHtml = steps.map((st, i) => `${pv('page ' + (i + 2))}<section class="a-scr a-step" data-step="${i}"${hid}>${paws(i)}
        <h2>${esc(st.q || 'Pick one, cutie')}</h2><div class="a-opts">${st.opts.map((o, k) => `<button class="a-opt" type="button" data-k="${k}" style="--i:${k}">${o.e ? stk(o.e) : ''}<span>${esc(o.l || o.e)}</span></button>`).join('')}</div>
        <button class="a-back" type="button">← back</button></section>`).join('');

    root.innerHTML = `<div class="a-hearts">${hearts}</div><canvas class="k-conf"></canvas>
      <main class="a-scr a-q" id="aQ">
        ${to ? `<p class="a-to">Hey ${esc(to)},</p>` : ''}
        <h1 class="a-qh">${esc(data.question || (mode === 'date' ? 'Will you go on a date with me?' : 'I’m sorry. Forgive me?'))}</h1>
        ${data.sub ? `<p class="a-sub">${esc(data.sub)}</p>` : ''}
        <div class="a-btns"><button class="a-btn a-yes" id="aYes" type="button">${esc(yesText)}</button><button class="a-btn a-no" id="aNo" type="button">${esc(NO[0])}</button></div></main>
      ${pv('after they say yes')}
      <section class="a-scr a-ans" id="aAns"${hid}>
        <h2 class="a-yay">${esc(data.yayTitle || 'Yay!')}</h2>${data.yayLine && steps.length ? `<p class="a-yline">${esc(data.yayLine)}</p>` : ''}
        ${steps.length ? `<button class="a-btn a-yes" id="aPlan" type="button">${esc(data.planBtn || 'Let’s plan it 🐾')}</button>`
          : `${data.message ? `<p class="a-msg">${esc(data.message)}</p>` : ''}${A.join('')}${sign}${u.STK_CREDIT}`}</section>
      ${stepHtml}
      ${steps.length ? `${pv('last page')}<section class="a-scr a-end" id="aEnd"${hid}><h2 class="a-yay">${esc(data.endTitle || 'It’s a date! 💖')}</h2>
        <div class="a-picks" id="aPicks"></div>${data.message ? `<p class="a-msg">${esc(data.message)}</p>` : ''}${A.join('')}${sign}${u.STK_CREDIT}</section>` : ''}`;

    const $ = s => root.querySelector(s), q = $('#aQ'), ans = $('#aAns'), yes = $('#aYes'), no = $('#aNo');
    const timers = [], T = (f, ms) => timers.push(setTimeout(f, ms));

    /* the guide lives at the top of whichever page is showing */
    const G = C.guide(ex('q').guide || pet, ex('q').say || M.first(to, from), data.photo);
    q.prepend(G.el);
    const say = (t, re) => G.say(t, re);
    M.faces.forEach((e, i) => T(() => u.preloadStk(e), 1200 + i * 80));

    const fx = C.confetti($('.k-conf'), th.cols);

    /* the runaway No button */
    let tries = 0, last = 0, flying = false, gaveUp = false, said = false, ph = null;
    function land() { if (ph) { ph.remove(); ph = null; } no.classList.remove('fly'); no.style.transform = ''; flying = false; }
    function giveUp() {
      gaveUp = true; land();
      no.textContent = yesText; no.className = 'a-btn a-yes jelly'; yes.classList.add('jelly');
      say(M.gaveUp, M.happy);
    }
    function dodge(px, py) {
      if (said || gaveUp) return;
      const now = performance.now(); if (now - last < 250) return; last = now;
      tries++;
      yes.style.transform = `scale(${Math.min(1 + tries * .1, 1.8).toFixed(2)})`;
      say(SAY[(tries - 1) % SAY.length], M.faces[Math.min(tries - 1, M.faces.length - 1)]);
      if (navigator.vibrate) navigator.vibrate(25);
      if (tries >= NO.length) return giveUp();
      no.textContent = NO[tries];
      if (!flying) { // lift it out of the row, leaving a gap so Yes doesn't jump
        const r = no.getBoundingClientRect();
        ph = document.createElement('span'); ph.className = 'a-ph'; ph.style.cssText = `width:${r.width}px;height:${r.height}px`; no.before(ph);
        no.classList.add('fly'); no.style.transform = `translate(${r.left}px,${r.top}px)`; void no.offsetWidth; flying = true;
        ph.style.transition = 'width .3s ease'; ph.style.width = '0px'; // then let Yes slide back to the middle
      }
      const w = no.offsetWidth, h = no.offsetHeight, vw = innerWidth, vh = innerHeight, yr = yes.getBoundingClientRect(), pad = 16 + yr.width * .3;
      const gr = G.el.getBoundingClientRect();
      let spot = null;
      for (let i = 0; i < 30; i++) {
        const x = rand(12, Math.max(12, vw - w - 12)), y = rand(Math.max(12, vh * .1), Math.max(12, vh - h - 28));
        const onYes = x < yr.right + pad && x + w > yr.left - pad && y < yr.bottom + pad && y + h > yr.top - pad;
        const onGuide = x < gr.right && x + w > gr.left && y < gr.bottom && y + h > gr.top;
        const far = px == null || Math.hypot(x + w / 2 - px, y + h / 2 - py) > Math.min(vw, vh) * .35;
        if (!onYes && !onGuide && far) { spot = [x, y]; break; }
        if (!onYes && !spot) spot = [x, y];
      }
      spot = spot || [12, vh - h - 28];
      no.style.transform = `translate(${spot[0].toFixed(0)}px,${spot[1].toFixed(0)}px)`;
    }
    no.addEventListener('pointerdown', e => { if (gaveUp) return; e.preventDefault(); dodge(e.clientX, e.clientY); });
    no.addEventListener('pointerenter', e => { if (!gaveUp && e.pointerType === 'mouse') dodge(e.clientX, e.clientY); });
    no.addEventListener('click', e => { if (gaveUp) return sayYes(e); if (performance.now() - last > 700) dodge(); }); // keyboard users get the joke too

    /* pages after yes: yay -> one page per question -> summary */
    const pages = [q, ans, ...root.querySelectorAll('.a-step')], end = $('#aEnd'), picks = [];
    if (end) pages.push(end);
    pages.forEach((pg, i) => C.placePhotos(pg, EX[ids[i]]));
    if (preview) pages.slice(1).forEach((pg, i) => pg.prepend(C.guide(ex(ids[i + 1]).guide || pet, ex(ids[i + 1]).say, data.photo).el)); // the builder shows every page at once
    let at = 0;
    const go = i => {
      if (preview) return;
      pages[at].hidden = true; at = i;
      const p = pages[at], my = ex(ids[at]); p.hidden = false; p.prepend(G.el); G.setPet(my.guide || pet); p.classList.remove('a-enter'); void p.offsetWidth; p.classList.add('a-enter'); scrollTo(0, 0);
      if (pages[at + 1]) pages[at + 1].querySelectorAll('img.stk').forEach(im => { new Image().src = im.src; }); // next page's stickers load while they choose
      if (p === ans) { say(my.say || M.yay, M.happy); fx.rain(); }
      else if (p === end) {
        say(my.say || M.end, '🥳');
        const got = picks.filter(Boolean);
        $('#aPicks').innerHTML = got.map(o => `<span class="a-pick">${o.e ? stk(o.e) : ''}${esc(o.l || o.e)}</span>`).join('');
        const w = $('#aWa'); if (w) w.href = waHref(got.map(o => [o.e, o.l].filter(Boolean).join(' ')).join('\n'));
        T(fx.rain, 200);
      } else if (my.say || M.pickLines) say(my.say || M.pickLines[(at - 2) % M.pickLines.length], steps[at - 2].opts[0].e || null);
    };

    function sayYes(e) {
      if (said) return;
      fx.at(e && e.currentTarget || yes, 160);
      if (preview) { ans.scrollIntoView({ behavior: 'smooth' }); return; }
      said = true; land(); no.hidden = true;
      q.classList.add('gone');
      T(() => { q.classList.remove('gone'); go(1); }, 450);
    }
    yes.addEventListener('click', sayYes);
    const plan = $('#aPlan'); if (plan) plan.addEventListener('click', () => go(2));
    if (!preview && pages[2]) T(() => pages[2].querySelectorAll('img.stk').forEach(im => { new Image().src = im.src; }), 2500);
    root.querySelectorAll('.a-step').forEach(sec => {
      const i = +sec.dataset.step;
      sec.querySelectorAll('.a-opt').forEach(b => b.addEventListener('click', () => {
        sec.querySelectorAll('.a-opt').forEach(x => x.classList.toggle('sel', x === b));
        picks[i] = steps[i].opts[+b.dataset.k];
        fx.at(b, 30); say(['Great choice! 😻', 'Ooh yes 🤩', 'Perfect 💖', 'Love that 🥰'][i % 4]);
        T(() => go(i + 3), 520);
      }));
      sec.querySelector('.a-back').addEventListener('click', () => go(i + 1));
    });
    root.querySelectorAll('.a-coup').forEach(c => c.addEventListener('click', () => {
      c.classList.toggle('used');
      if (c.classList.contains('used')) { const r = c.getBoundingClientRect(); fx.burst(r.right - 40, r.top + r.height / 2, 40); say('Claimed! No take-backs 😼', '🤩'); }
    }));

    return {
      destroy() {
        fx.destroy(); timers.forEach(clearTimeout);
        style.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg;
      }
    };
  }

  const thumb = (bg1, bg2, pop, pet, l1, l2, yesT, noT) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="ag${pop.slice(1)}" cx=".5" cy="0" r="1.1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></radialGradient></defs>
    <rect width="400" height="300" fill="url(#ag${pop.slice(1)})"/>
    <g fill="${pop}" opacity=".22" font-size="22" font-family="sans-serif"><text x="40" y="60">♥</text><text x="340" y="90">♥</text><text x="70" y="250">♥</text><text x="330" y="240">♥</text></g>
    <rect x="120" y="14" width="160" height="30" rx="14" fill="#fff"/><path d="M194 42l6 8 6-8z" fill="#fff"/><text x="200" y="34" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#3a1d33">Psst… 👀</text>
    <text x="200" y="102" text-anchor="middle" font-size="46">${pet}</text>
    <text x="200" y="148" text-anchor="middle" font-family="'Fredoka','Trebuchet MS',sans-serif" font-weight="700" font-size="25" fill="#3a1d33">${l1}</text>
    <text x="200" y="178" text-anchor="middle" font-family="'Fredoka','Trebuchet MS',sans-serif" font-weight="700" font-size="25" fill="#3a1d33">${l2}</text>
    <rect x="112" y="206" width="96" height="40" rx="20" fill="${pop}"/><text x="160" y="232" text-anchor="middle" font-family="'Fredoka','Trebuchet MS',sans-serif" font-weight="700" font-size="17" fill="#fff">${yesT}</text>
    <g transform="rotate(12 300 250)"><rect x="262" y="236" width="76" height="34" rx="17" fill="#fff"/><text x="300" y="258" text-anchor="middle" font-family="'Fredoka','Trebuchet MS',sans-serif" font-weight="700" font-size="15" fill="#3a1d33">${noT}</text></g>
    <path d="M232 226q18 6 26 16" fill="none" stroke="#3a1d33" stroke-width="2" stroke-dasharray="3 4" opacity=".5"/></svg>`;

  KS.registerTemplate({
    id: 'ask-date', emoji: true, group: 'Letters and birthdays', name: 'Will you go out with me?',
    tagline: 'Ask them out with a "No" button that runs away from their finger, a cute guide cheering you on, then plan the date together.',
    for: 'Asking someone out, proposals, Valentine’s, prom',
    title: d => (d.to ? d.to + ', I have a question…' : 'I have a question…'),
    defaultMusic: { type: 'library', id: 'g2' },
    schema: schema('date'), sample: Object.assign({ noLines: MODES.date.noLines }, MODES.date.sample),
    thumb: thumb('#fff0f6', '#ffcfe3', '#ff3d8b', '😺', 'Will you go on', 'a date with me?', 'Yes!', 'No'),
    mount: (r, d, c) => mount(r, d, c, 'date')
  });
  KS.registerTemplate({
    id: 'ask-sorry', emoji: true, group: 'Letters and birthdays', name: 'I’m sorry (please?)',
    tagline: 'Say sorry after a fight with a "No" button that refuses to be pressed, a guide begging for you, plus sorry coupons.',
    for: 'Making up after a fight, apologies, cheering someone up',
    title: d => (d.to ? d.to + ', I’m sorry' : 'I’m sorry'),
    defaultMusic: { type: 'library', id: 'g1' },
    schema: schema('sorry'), sample: Object.assign({ noLines: MODES.sorry.noLines }, MODES.sorry.sample),
    thumb: thumb('#f8f4ff', '#e3d8ff', '#8f6bff', '🐻', 'I’m really sorry.', 'Forgive me?', 'Okay', 'Never'),
    mount: (r, d, c) => mount(r, d, c, 'sorry')
  });
})();
