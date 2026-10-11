/* Template: Birthday party. A gift to open, balloons, a cake with candles to blow out, sticky-note wishes and polaroids. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el, esc = u.esc, rand = u.rand;

  const THEMES = {
    sunny:  { bg1: '#fff6d6', bg2: '#ffe0c2', ink: '#3b2a1a', muted: '#8a6a4a', pop: '#ff7a45', cols: ['#ff7a45', '#ffc233', '#ff5d8f', '#3ec6a8', '#7a6cf0'], card: '#ffffff' },
    bubble: { bg1: '#ffe9f3', bg2: '#e6deff', ink: '#3a2450', muted: '#7d6a92', pop: '#ff5c9d', cols: ['#ff6fa8', '#a78bfa', '#4fd1c0', '#ffc94d', '#6ea8ff'], card: '#ffffff' },
    ocean:  { bg1: '#dff6ff', bg2: '#c8f0e4', ink: '#0e3350', muted: '#4e7186', pop: '#1f9bd1', cols: ['#1f9bd1', '#2ec4b6', '#ff8a5b', '#ffc94d', '#7b8cff'], card: '#ffffff' },
    party:  { bg1: '#1b1040', bg2: '#42186f', ink: '#fff6ff', muted: '#c9b6e6', pop: '#ff4fa3', cols: ['#ff4fa3', '#ffd23f', '#39e0c4', '#8f7bff', '#ff8a3d'], card: '#2a1a5c', dark: true }
  };

  const CSS = `
  .tpl-birthday{--disp:'Baloo 2','Trebuchet MS',system-ui,sans-serif;--hand:'Caveat','Comic Sans MS',cursive;--body:'Nunito',system-ui,sans-serif;font-family:var(--body);color:var(--ink);min-height:100vh;overflow-x:hidden}
  .tpl-birthday::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(160deg,var(--bg1),var(--bg2));transform:translateZ(0)}
  .tpl-birthday *{box-sizing:border-box}
  .b-main{position:relative;z-index:2}
  .b-wrap{width:min(920px,100%);margin:0 auto;padding:0 20px}
  .b-sec{padding:clamp(44px,8vw,84px) 0;position:relative}
  .b-h2{font:800 clamp(30px,6.5vw,52px)/1.05 var(--disp);margin:0 0 10px;text-align:center}
  .b-h2 span{color:var(--pop)}
  .b-sub{text-align:center;margin:0 auto 30px;font:600 clamp(15px,2.6vw,19px) var(--body);color:var(--muted);max-width:520px}
  .b-rise{opacity:0;transform:translateY(26px) scale(.98);transition:opacity .7s ease,transform .7s cubic-bezier(.2,1.2,.4,1)}
  .b-rise.in{opacity:1;transform:none}
  .is-static .b-rise{opacity:1;transform:none;transition:none}
  #bConf{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40}

  /* balloons */
  .b-balloons{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .b-bal{position:absolute;bottom:-160px;width:var(--w);animation:bfloat var(--dur) linear var(--del) infinite;opacity:.9}
  .b-bal svg{width:100%;display:block;animation:bsway 4s ease-in-out infinite alternate;transform-origin:50% 100%}
  @keyframes bfloat{from{transform:translateY(0)}to{transform:translateY(calc(-100vh - 340px))}}
  @keyframes bsway{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
  .is-static .b-bal{animation:none;bottom:auto;top:var(--top)}

  /* hero */
  .b-hero{min-height:88vh;min-height:88svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px 40px;position:relative}
  .b-head{font:800 clamp(46px,13vw,120px)/.95 var(--disp);margin:0;letter-spacing:-.01em;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .28em}
  .b-word{display:inline-flex}
  .b-l{display:inline-block;color:var(--c);text-shadow:0 4px 0 color-mix(in srgb,var(--c) 45%,#000 0%);opacity:0;transform:translateY(40px) scale(.5) rotate(-8deg);animation:bpop .7s cubic-bezier(.2,1.5,.4,1) forwards;animation-delay:calc(var(--i) * 55ms + .2s)}
  @keyframes bpop{to{opacity:1;transform:none}}
  .is-static .b-l{animation:none;opacity:1;transform:none}
  .b-name{font:700 clamp(46px,12vw,104px)/1 var(--hand);color:var(--pop);margin:.1em 0 0;transform:rotate(-3deg);opacity:0;animation:bpop .8s cubic-bezier(.2,1.5,.4,1) .9s forwards}
  .is-static .b-name{animation:none;opacity:1}
  .b-tag{font:700 clamp(17px,3.2vw,24px)/1.4 var(--body);margin:14px auto 0;max-width:560px;opacity:0;animation:bpop .8s ease 1.2s forwards}
  .is-static .b-tag{animation:none;opacity:1}
  .b-pill{display:inline-block;margin-top:22px;background:var(--card);color:var(--pop);font:800 clamp(15px,2.6vw,19px) var(--disp);padding:10px 22px;border-radius:999px;box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 30%,transparent);opacity:0;animation:bpop .8s ease 1.4s forwards}
  .is-static .b-pill{animation:none;opacity:1}
  .b-age{position:absolute;right:max(4vw,14px);top:max(6vh,28px);width:clamp(84px,18vw,150px);aspect-ratio:1;display:grid;place-items:center;transform:rotate(12deg)}
  .b-age svg{position:absolute;inset:0;width:100%;height:100%;animation:bspin 18s linear infinite}
  .is-static .b-age svg{animation:none}
  @keyframes bspin{to{transform:rotate(360deg)}}
  .b-age b{position:relative;font:800 clamp(30px,7vw,60px)/1 var(--disp);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.18)}
  .b-age small{position:absolute;bottom:18%;font:800 clamp(8px,1.6vw,12px) var(--body);letter-spacing:.16em;color:#fff;text-transform:uppercase}
  .b-hint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font:700 13px var(--body);color:var(--muted);letter-spacing:.08em;animation:bbounce 1.6s ease-in-out infinite}
  .is-static .b-hint{animation:none}
  @keyframes bbounce{50%{transform:translate(-50%,8px)}}

  /* cake + letter */
  .b-cakewrap{display:flex;flex-direction:column;align-items:center;gap:18px}
  .b-cake{width:min(86vw,360px)}
  .b-cake svg{width:100%;display:block;overflow:visible}
  .b-flame{transform-origin:50% 100%;transform-box:fill-box;animation:bflick .35s ease-in-out infinite alternate;transition:opacity .5s,transform .5s}
  @keyframes bflick{from{transform:scale(1,1) rotate(-3deg)}to{transform:scale(.92,1.12) rotate(3deg)}}
  .b-cake.out .b-flame{opacity:0;transform:scale(.1)!important;animation:none}
  .b-smoke{opacity:0}
  .b-cake.out .b-smoke{animation:bsmoke 2s ease-out forwards}
  @keyframes bsmoke{0%{opacity:.7;transform:translateY(0) scale(.6)}100%{opacity:0;transform:translateY(-46px) scale(1.6)}}
  .b-btn{appearance:none;border:0;cursor:pointer;font:800 clamp(16px,3vw,20px) var(--disp);color:#fff;background:var(--pop);padding:14px 30px;border-radius:999px;box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 55%,#000);transition:transform .12s,box-shadow .12s;text-decoration:none;display:inline-block}
  .b-btn:hover{transform:translateY(-2px)}.b-btn:active{transform:translateY(4px);box-shadow:0 2px 0 color-mix(in srgb,var(--pop) 55%,#000)}
  .b-btn.alt{background:var(--card);color:var(--pop);box-shadow:0 6px 0 color-mix(in srgb,var(--pop) 30%,transparent)}
  .b-letter{max-width:600px;margin:12px auto 0;background:#fffdf3;color:#3b2a1a;border-radius:6px;padding:clamp(26px,5vw,40px);position:relative;box-shadow:0 18px 40px rgba(0,0,0,.16);transform:rotate(-1deg);max-height:0;opacity:0;overflow:hidden;padding-top:0;padding-bottom:0;
    transition:max-height 1.2s ease,opacity .8s ease .2s,padding .8s ease}
  .b-letter.show,.is-static .b-letter,.b-letter.always{max-height:2400px;opacity:1;padding-top:clamp(26px,5vw,40px);padding-bottom:clamp(26px,5vw,40px);overflow:visible}
  .b-letter::before,.b-letter::after{content:'';position:absolute;top:-12px;width:90px;height:26px;background:color-mix(in srgb,var(--pop) 35%,#fff);opacity:.8;transform:rotate(-6deg)}
  .b-letter::before{left:24px}.b-letter::after{right:24px;transform:rotate(5deg)}
  .b-letter p{font:600 clamp(24px,4.6vw,32px)/1.35 var(--hand);margin:0 0 .5em;white-space:pre-line}
  .b-letter .sig{font:700 clamp(28px,5vw,38px) var(--hand);color:var(--pop);text-align:right;margin-top:14px}

  /* wishes */
  .b-wishes{columns:2 260px;column-gap:18px;margin-top:8px}
  .b-wish{break-inside:avoid;margin:0 0 18px;padding:20px 20px 16px;border-radius:14px;background:color-mix(in srgb,var(--c) 22%,var(--card));border:2px solid color-mix(in srgb,var(--c) 55%,transparent);transform:rotate(var(--r));box-shadow:0 8px 0 color-mix(in srgb,var(--c) 22%,transparent)}
  .b-wish p{margin:0 0 8px;font:700 clamp(16px,2.6vw,19px)/1.5 var(--body);white-space:pre-line}
  .b-wish cite{display:block;font:700 26px/1 var(--hand);color:var(--c);filter:brightness(.8);font-style:normal;text-align:right}

  /* photos */
  .b-pols{display:flex;flex-wrap:wrap;justify-content:center;gap:26px 22px;margin-top:14px}
  .b-pol{background:#fff;padding:12px 12px 8px;width:min(46%,250px);min-width:150px;box-shadow:0 12px 26px rgba(0,0,0,.2);transform:rotate(var(--r));cursor:zoom-in;transition:transform .25s;border:0;font:inherit;color:#3b2a1a;text-align:center}
  .b-pol:hover{transform:rotate(0) scale(1.05) translateY(-4px);z-index:3}
  .b-pol i{display:block;aspect-ratio:1;background:#eee center/cover}
  .b-pol span{display:block;font:700 24px/1.1 var(--hand);padding:10px 2px 4px;min-height:38px}
  .b-lb{position:fixed;inset:0;z-index:90;background:rgba(15,8,30,.88);display:grid;place-items:center;padding:20px}
  .b-lb figure{margin:0;text-align:center;max-width:min(94vw,860px)}.b-lb img{max-width:100%;max-height:78vh;border:10px solid #fff;border-bottom-width:44px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
  .b-lb figcaption{color:#fff;font:700 28px var(--hand);margin-top:-34px;position:relative;color:#3b2a1a}
  .b-lb button{position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;border:0;background:#fff;font-size:20px;cursor:pointer}

  /* party ticket */
  .b-ticket{max-width:640px;margin:20px auto 0;background:var(--card);border-radius:22px;position:relative;display:grid;grid-template-columns:150px 1fr;overflow:hidden;box-shadow:0 14px 0 color-mix(in srgb,var(--pop) 24%,transparent),0 20px 40px rgba(0,0,0,.12)}
  @media(max-width:560px){.b-ticket{grid-template-columns:1fr}}
  .b-tdate{background:var(--pop);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 10px;text-align:center;position:relative}
  .b-tdate b{font:800 60px/1 var(--disp)}.b-tdate span{font:800 15px var(--disp);letter-spacing:.14em;text-transform:uppercase}.b-tdate small{font:700 13px var(--body);opacity:.9;margin-top:6px}
  .b-tinfo{padding:26px;border-left:3px dashed color-mix(in srgb,var(--pop) 40%,transparent)}
  @media(max-width:560px){.b-tinfo{border-left:0;border-top:3px dashed color-mix(in srgb,var(--pop) 40%,transparent)}}
  .b-tinfo h3{margin:0 0 10px;font:800 28px/1.1 var(--disp)}
  .b-tinfo p{margin:0 0 6px;font:700 17px/1.45 var(--body)}.b-tinfo p.m{color:var(--muted);font-weight:600}
  .b-tbtn{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .b-tbtn .b-btn{font-size:16px;padding:11px 20px}

  .b-foot{text-align:center;padding:50px 20px 120px}
  .b-foot .sign{font:700 clamp(40px,9vw,72px)/1.1 var(--hand);color:var(--pop);margin:0 0 20px;transform:rotate(-2deg)}

  /* gift gate */
  .b-gate{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px;cursor:pointer;
    background:radial-gradient(90% 70% at 50% 40%,var(--bg1),var(--bg2));transition:opacity .8s ease .2s,visibility .8s}
  .b-gate.gone{opacity:0;visibility:hidden}
  .b-gate h1{font:800 clamp(30px,8vw,52px)/1.05 var(--disp);margin:0;max-width:640px}
  .b-gate p{margin:0;font:800 13px var(--body);letter-spacing:.22em;text-transform:uppercase;color:var(--muted);animation:bbounce2 1.4s ease-in-out infinite}
  @keyframes bbounce2{50%{transform:translateY(-6px)}}
  .b-gift{width:min(56vw,230px);animation:bwob 2.4s ease-in-out infinite;transform-origin:50% 100%}
  @keyframes bwob{0%,100%{transform:rotate(0)}10%{transform:rotate(-5deg)}20%{transform:rotate(5deg)}30%{transform:rotate(-4deg)}40%{transform:rotate(0)}}
  .b-gift .lid{transition:transform .7s cubic-bezier(.3,1.4,.5,1),opacity .6s}
  .b-gate.opening .b-gift{animation:none}.b-gate.opening .lid{transform:translateY(-70px) rotate(-14deg);opacity:0}

  .b-fab{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom) + 12px);z-index:45;appearance:none;border:0;cursor:pointer;background:var(--pop);color:#fff;font:800 13px var(--disp);border-radius:999px;padding:10px 16px;box-shadow:0 4px 0 color-mix(in srgb,var(--pop) 55%,#000)}
  @media(prefers-reduced-motion:reduce){.b-l,.b-name,.b-tag,.b-pill{animation:none;opacity:1;transform:none}.b-bal,.b-bal svg,.b-gift,.b-age svg,.b-flame,.b-hint{animation:none}.b-rise{opacity:1;transform:none;transition:none}}
  `;

  const balloon = (c, o) => `<svg viewBox="0 0 80 150" aria-hidden="true"><path d="M40 4C18 4 6 22 6 42c0 26 20 46 34 52 14-6 34-26 34-52C74 22 62 4 40 4z" fill="${c}"/>
    <path d="M40 4C18 4 6 22 6 42c0 26 20 46 34 52 14-6 34-26 34-52C74 22 62 4 40 4z" fill="url(#g${o})" opacity=".35"/>
    <ellipse cx="26" cy="30" rx="7" ry="12" fill="#fff" opacity=".4" transform="rotate(25 26 30)"/><path d="M36 94l4 8 4-8z" fill="${c}"/>
    <path d="M40 102c-8 14 8 24 0 46" fill="none" stroke="#0003" stroke-width="1.6"/><defs><radialGradient id="g${o}" cx=".7" cy=".8"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs></svg>`;

  const burstShape = c => { let p = ''; for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, r = i % 2 ? 40 : 50; p += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (50 + r * Math.sin(a)).toFixed(1); } return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${p}Z" fill="${c}"/></svg>`; };

  function cakeSvg(n, cols) {
    const candles = []; const span = 130, step = n > 1 ? span / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      const x = n > 1 ? 85 + i * step : 150, c = cols[i % cols.length];
      candles.push(`<g><rect x="${x - 4}" y="62" width="8" height="34" rx="2" fill="${c}"/><rect x="${x - 4}" y="70" width="8" height="5" fill="#fff" opacity=".55"/><rect x="${x - 4}" y="82" width="8" height="5" fill="#fff" opacity=".55"/>
        <g class="b-flame" style="animation-delay:${(i * 0.07).toFixed(2)}s"><path d="M${x} 42c6 8 7 13 0 19-7-6-6-11 0-19z" fill="#ffb02e"/><path d="M${x} 49c3 4 3 7 0 10-3-3-3-6 0-10z" fill="#fff3a0"/></g>
        <circle class="b-smoke" cx="${x}" cy="50" r="5" fill="#9998"/></g>`);
    }
    return `<svg viewBox="0 0 300 270" aria-label="Birthday cake"><ellipse cx="150" cy="248" rx="132" ry="16" fill="#0002"/><ellipse cx="150" cy="240" rx="130" ry="18" fill="#fff"/>
      <rect x="40" y="170" width="220" height="70" rx="14" fill="${cols[2 % cols.length]}"/><path d="M40 184c14 16 24 0 38 14s24-2 38 12 24-6 38 10 26-6 40 8 26-8 40-2 26 4 26-14V170H40z" fill="#fff" opacity=".92"/>
      <rect x="66" y="112" width="168" height="66" rx="14" fill="${cols[1 % cols.length]}"/><path d="M66 128c12 14 22-2 34 10s22-2 34 12 22-4 34 8 22-6 34 6 22-8 32 0V112H66z" fill="#fff" opacity=".92"/>
      <rect x="86" y="96" width="128" height="22" rx="8" fill="${cols[0]}"/>${candles.join('')}
      <g fill="#fff" opacity=".85"><circle cx="70" cy="215" r="4"/><circle cx="110" cy="222" r="4"/><circle cx="160" cy="216" r="4"/><circle cx="205" cy="223" r="4"/><circle cx="240" cy="214" r="4"/></g></svg>`;
  }

  const giftSvg = cols => `<svg class="b-gift" viewBox="0 0 200 200" aria-hidden="true"><rect x="30" y="82" width="140" height="102" rx="8" fill="${cols[0]}"/><rect x="88" y="82" width="24" height="102" fill="${cols[1]}"/>
    <g class="lid"><rect x="20" y="56" width="160" height="34" rx="8" fill="${cols[2]}"/><rect x="88" y="56" width="24" height="34" fill="${cols[1]}"/>
    <path d="M100 56c-24-34-52-14-34 0 10 8 34 0 34 0zM100 56c24-34 52-14 34 0-10 8-34 0-34 0z" fill="${cols[1]}" stroke="#0002" stroke-width="2"/></g></svg>`;

  KS.registerTemplate({
    id: 'birthday', group: 'Letters and birthdays',
    name: 'Birthday party',
    tagline: 'A gift to open, balloons, confetti, a cake to blow out and a wall of wishes.',
    for: 'Birthdays, milestones, party invitations',
    title: d => (d.name ? 'Happy birthday, ' + d.name + '!' : 'Happy birthday!'),
    defaultMusic: { type: 'none' },

    sample: {
      theme: 'sunny', name: 'Sam', age: '25', headline: 'Happy Birthday', tagline: 'Wishing you a day as wonderful as you are!', date: '',
      gateText: '', candles: true, cakeNote: 'Close your eyes, make a wish, then blow out the candles!',
      message: "Another year older, another year more amazing.\nThank you for every laugh, every hug and every ridiculous adventure.\nI hope today is full of cake and joy.", from: 'Your friends',
      wishes: [{ from: 'Mia', text: 'Happy birthday! Here is to another year of great memories.' }, { from: 'Dad', text: 'So proud of you. Enjoy every minute of today.' }],
      photos: [],
      partyOn: false, partyTitle: 'Come celebrate with us!', partyDate: '', partyTime: '19:00', partyPlace: { name: '', address: '', url: '' }, partyNote: 'Bring your dancing shoes.'
    },

    schema: [
      { id: 'who', title: 'Who is celebrating', open: true, fields: [
        { key: 'name', type: 'text', label: 'Name', max: 30 },
        { key: 'age', type: 'text', label: 'Age or milestone (optional)', max: 10, placeholder: 'e.g. 25 or 1st', help: 'Shown in a star badge, and sets how many candles are on the cake (up to 8).' },
        { key: 'headline', type: 'text', label: 'Big headline', max: 30 },
        { key: 'tagline', type: 'text', label: 'Line under the name', max: 110 },
        { key: 'date', type: 'date', label: 'Birthday date (optional)', help: 'Adds a "days to go" badge until the day.' },
        { key: 'theme', type: 'choice', label: 'Colours', options: [{ v: 'sunny', l: 'Sunny', c: '#ff7a45' }, { v: 'bubble', l: 'Bubblegum', c: '#ff6fa8' }, { v: 'ocean', l: 'Ocean', c: '#1f9bd1' }, { v: 'party', l: 'Night party', c: '#42186f' }] },
        { key: 'gateText', type: 'text', label: 'Words on the gift screen', max: 80, placeholder: 'e.g. You have a surprise!', help: 'Guests tap the gift to open it. This is also when the music begins.' }
      ] },
      { id: 'cake', title: 'Cake and a message', fields: [
        { key: 'candles', type: 'toggle', label: 'Cake with candles to blow out' },
        { key: 'cakeNote', type: 'text', label: 'Words above the cake', max: 100, show: d => d.candles },
        { key: 'message', type: 'textarea', label: 'Your message', rows: 6, help: 'Revealed on a handwritten note after the candles go out.' },
        { key: 'from', type: 'text', label: 'Signed', max: 40 }
      ] },
      { id: 'wishes', title: 'Wishes from friends', fields: [
        { key: 'wishes', type: 'repeater', label: '', max: 20, addLabel: 'Add a wish', itemLabel: 'Wish', title: i => i.from, blank: { from: '', text: '' },
          help: 'Collect a few words from people who love them. Each shows up as a colourful note.',
          fields: [{ key: 'from', type: 'text', label: 'From', max: 30 }, { key: 'text', type: 'textarea', label: 'Their wish', rows: 3 }] }
      ] },
      { id: 'photos', title: 'Photos', fields: [
        { key: 'photos', type: 'repeater', label: '', max: 10, addLabel: 'Add a photo', itemLabel: 'Photo', title: i => i.caption, blank: { img: '', caption: '' },
          fields: [{ key: 'img', type: 'image', label: 'Photo' }, { key: 'caption', type: 'text', label: 'Caption (optional)', max: 50 }] }
      ] },
      { id: 'party', title: 'Party details', fields: [
        { key: 'partyOn', type: 'toggle', label: 'Add a party invitation' },
        { key: 'partyTitle', type: 'text', label: 'Heading', max: 50, show: d => d.partyOn },
        { key: 'partyDate', type: 'date', label: 'Date', show: d => d.partyOn },
        { key: 'partyTime', type: 'time', label: 'Time', show: d => d.partyOn },
        { key: 'partyPlace', type: 'place', label: 'Where', show: d => d.partyOn },
        { key: 'partyNote', type: 'textarea', label: 'Anything to know', rows: 2, show: d => d.partyOn }
      ] }
    ],

    mount(root, data, ctx) {
      const th = THEMES[data.theme] || THEMES.sunny, cols = th.cols, preview = !!ctx.preview;
      u.font('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Caveat:wght@600;700&family=Nunito:wght@600;700;800&display=swap');
      const style = u.el('style', {}, CSS); document.head.append(style);
      const prevBg = document.body.style.background, prevOv = document.body.style.overflow;
      document.body.style.background = th.bg1;
      root.className = 'tpl-birthday' + (preview ? ' is-static' : '');
      root.style.cssText = `--bg1:${th.bg1};--bg2:${th.bg2};--ink:${th.ink};--muted:${th.muted};--pop:${th.pop};--card:${th.card}`;

      const name = (data.name || '').trim(), age = (data.age || '').trim(), headline = (data.headline || 'Happy Birthday').trim();
      const days = data.date ? u.daysUntil(data.date) : null;
      const pill = days == null ? '' : days > 1 ? days + ' days to go' : days === 1 ? 'Tomorrow is the day!' : days === 0 ? 'It is today!' : '';
      const candleN = /^\d+$/.test(age) ? u.clamp(+age, 1, 8) : 5;
      const lines = (data.message || '').split('\n').map(s => s.trim()).filter(Boolean);
      let li = 0;
      const word = w => `<span class="b-word">${[...w].map(ch => `<span class="b-l" style="--i:${li++};--c:${cols[li % cols.length]}">${esc(ch)}</span>`).join('')}</span>`;

      const bal = Array.from({ length: 9 }, (_, i) => `<div class="b-bal" style="left:${(preview ? (i % 2 ? 84 + (i * 7) % 12 : 1 + (i * 5) % 9) : 4 + i * 11.5 + rand(-3, 3)).toFixed(1)}%;--w:${Math.round(rand(46, 84))}px;--dur:${Math.round(rand(16, 26))}s;--del:-${Math.round(rand(0, 22))}s;--top:${Math.round(rand(4, 70))}%">${balloon(cols[i % cols.length], i)}</div>`).join('');
      const S = [];
      S.push(`<header class="b-hero">${age ? `<div class="b-age">${burstShape(cols[2 % cols.length])}<b>${esc(age)}</b><small>${/^\d+$/.test(age) ? 'years' : 'birthday'}</small></div>` : ''}
        <h1 class="b-head">${headline.split(/\s+/).map(word).join('')}</h1>
        ${name ? `<div class="b-name">${esc(name)}!</div>` : ''}${data.tagline ? `<p class="b-tag">${esc(data.tagline)}</p>` : ''}${pill ? `<div class="b-pill">${esc(pill)}</div>` : ''}
        <div class="b-hint">scroll down</div></header>`);

      if (data.candles !== false) {
        S.push(`<section class="b-sec"><div class="b-wrap b-cakewrap b-rise"><h2 class="b-h2">Make a <span>wish</span></h2>${data.cakeNote ? `<p class="b-sub">${esc(data.cakeNote)}</p>` : ''}
          <div class="b-cake${preview ? '' : ''}" id="bCake">${cakeSvg(candleN, cols)}</div>
          <button class="b-btn" id="bBlow" type="button">${preview ? 'Blow out the candles' : 'Blow out the candles'}</button>
          <div class="b-letter${preview ? ' show' : ''}" id="bLetter">${lines.map(l => `<p>${esc(l)}</p>`).join('')}${data.from ? `<div class="sig">${esc(data.from)}</div>` : ''}</div></div></section>`);
      } else if (lines.length) {
        S.push(`<section class="b-sec"><div class="b-wrap b-rise"><h2 class="b-h2">A note for <span>${esc(name || 'you')}</span></h2><div class="b-letter always">${lines.map(l => `<p>${esc(l)}</p>`).join('')}${data.from ? `<div class="sig">${esc(data.from)}</div>` : ''}</div></div></section>`);
      }
      const wishes = (data.wishes || []).filter(w => w.text || w.from);
      if (wishes.length) S.push(`<section class="b-sec"><div class="b-wrap"><h2 class="b-h2 b-rise">Wishes for <span>${esc(name || 'you')}</span></h2><p class="b-sub b-rise">From people who love you</p><div class="b-wishes">${wishes.map((w, i) =>
        `<div class="b-wish b-rise" style="--c:${cols[i % cols.length]};--r:${((i % 3) - 1) * 1.4}deg"><p>${esc(w.text)}</p>${w.from ? `<cite>${esc(w.from)}</cite>` : ''}</div>`).join('')}</div></div></section>`);
      const photos = (data.photos || []).filter(p => p.img);
      if (photos.length) S.push(`<section class="b-sec"><div class="b-wrap"><h2 class="b-h2 b-rise">Good <span>times</span></h2><div class="b-pols">${photos.map((p, i) =>
        `<button class="b-pol b-rise" type="button" data-i="${i}" style="--r:${[-3, 2.5, -1.5, 3, -2.5][i % 5]}deg"><i data-bg="url('${esc(p.img)}')"></i><span>${esc(p.caption || '')}</span></button>`).join('')}</div></div></section>`);
      if (data.partyOn) {
        const pl = data.partyPlace || {}, hasPl = pl.name || pl.address, d = u.parseDate(data.partyDate), maps = hasPl ? u.mapsUrl(pl) : '';
        const ics = data.partyDate ? u.ics({ title: (name ? name + "'s birthday party" : 'Birthday party'), date: data.partyDate, time: data.partyTime, place: hasPl ? pl : null, note: data.partyNote }) : '';
        S.push(`<section class="b-sec"><div class="b-wrap"><h2 class="b-h2 b-rise">You are <span>invited</span></h2>
          <div class="b-ticket b-rise"><div class="b-tdate">${d ? `<span>${esc(d.toLocaleDateString(undefined, { month: 'short' }))}</span><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString(undefined, { weekday: 'long' }))}</small>` : '<b>Party</b>'}</div>
          <div class="b-tinfo"><h3>${esc(data.partyTitle || 'Come celebrate!')}</h3>${data.partyTime ? `<p>${esc(u.fmtTime(data.partyTime))}</p>` : ''}${hasPl ? `<p>${esc(pl.name || '')}</p><p class="m">${esc(pl.address || '')}</p>` : ''}${data.partyNote ? `<p class="m">${esc(data.partyNote)}</p>` : ''}
          <div class="b-tbtn">${maps ? `<a class="b-btn" href="${esc(maps)}" target="_blank" rel="noopener">Directions</a>` : ''}${ics ? `<a class="b-btn alt" href="${ics}" download="birthday-party.ics">Add to calendar</a>` : ''}</div></div></div></div></section>`);
      }
      S.push(`<footer class="b-foot b-rise">${data.from ? `<p class="sign">With love, ${esc(data.from)}</p>` : ''}<button class="b-btn" id="bParty" type="button">Party time!</button></footer>`);

      const useGate = !preview;
      root.innerHTML = `<div class="b-balloons">${bal}</div><canvas id="bConf"></canvas><main class="b-main">${S.join('')}</main>` +
        (useGate ? `<div class="b-gate" id="bGate">${giftSvg(cols)}<h1>${esc(data.gateText || (name ? name + ', you have a surprise!' : 'You have a surprise!'))}</h1><p>Tap to open</p></div>` : '');

      /* scroll reveal */
      let io = null;
      if (!preview && 'IntersectionObserver' in window) {
        io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
        root.querySelectorAll('.b-rise').forEach(n => io.observe(n));
      } else root.querySelectorAll('.b-rise').forEach(n => n.classList.add('in'));

      const lazy = u.lazyBg(root, preview);

      /* confetti */
      const cv = root.querySelector('#bConf'), cx = cv.getContext('2d'); let parts = [], raf = 0, W = 0, H = 0, dead = false;
      let D = 1; const fit = () => { D = u.dpr(); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; cx.setTransform(D, 0, 0, D, 0, 0); };
      fit(); const offResize = u.onResize(fit);
      function step() {
        cx.setTransform(D, 0, 0, D, 0, 0); cx.clearRect(0, 0, W, H);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]; p.vy += .22; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
          if (p.y > H + 30 || p.life > 260) { parts.splice(i, 1); continue; }
          const c = Math.cos(p.rot) * D, sn = Math.sin(p.rot) * D;
          cx.setTransform(c, sn, -sn, c, p.x * D, p.y * D); cx.globalAlpha = Math.min(1, (260 - p.life) / 50); cx.fillStyle = p.c;
          if (p.round) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 6.283); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        }
        cx.setTransform(D, 0, 0, D, 0, 0); cx.globalAlpha = 1;
        raf = parts.length && !dead ? requestAnimationFrame(step) : 0;
        if (!parts.length) cx.clearRect(0, 0, W, H);
      }
      function burst(x, y, n) {
        if (u.RM) return;
        n = Math.round((n || 90) * (u.LITE ? .55 : 1));
        for (let i = 0; i < n; i++) { const a = rand(-Math.PI, 0), v = rand(4, 13); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, c: cols[i % cols.length], s: rand(6, 12), rot: rand(0, 6), vr: rand(-.3, .3), round: Math.random() < .3, life: 0 }); }
        if (!raf) raf = requestAnimationFrame(step);
      }
      const rain = () => { for (let k = 0; k < 6; k++) setTimeout(() => { burst(rand(W * .1, W * .9), H * .35, 40); }, k * 160); };

      /* cake */
      const cake = root.querySelector('#bCake'), blow = root.querySelector('#bBlow'), letter = root.querySelector('#bLetter');
      if (blow) blow.addEventListener('click', () => {
        const out = cake.classList.toggle('out');
        blow.textContent = out ? 'Light them again' : 'Blow out the candles';
        if (out) { const r = cake.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .3, 120); rain(); if (letter) letter.classList.add('show'); }
      });
      const party = root.querySelector('#bParty'); if (party) party.addEventListener('click', () => { burst(W / 2, H * .6, 140); rain(); });

      /* photo lightbox */
      let lb = null; const closeLb = () => { if (lb) { lb.remove(); lb = null; } };
      root.querySelectorAll('.b-pol').forEach(b => b.addEventListener('click', () => {
        const p = photos[+b.dataset.i]; closeLb();
        lb = el('div', { class: 'b-lb', onclick: e => { if (e.target === lb) closeLb(); } }, el('figure', {}, el('img', { src: p.img, alt: p.caption || '' }), p.caption ? el('figcaption', {}, p.caption) : null), el('button', { type: 'button', 'aria-label': 'Close', onclick: closeLb }, '✕'));
        document.body.append(lb);
      }));
      const onKey = e => { if (lb && e.key === 'Escape') closeLb(); }; addEventListener('keydown', onKey);

      /* gift gate */
      if (useGate) {
        document.body.style.overflow = 'hidden';
        const gate = root.querySelector('#bGate');
        gate.addEventListener('click', () => {
          if (gate.classList.contains('opening')) return;
          ctx.start(); gate.classList.add('opening'); burst(W / 2, H * .5, 150); rain();
          setTimeout(() => { gate.classList.add('gone'); document.body.style.overflow = prevOv; }, 900);
          setTimeout(() => gate.remove(), 2200);
        });
      }

      return {
        destroy() {
          dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); closeLb(); removeEventListener('keydown', onKey); offResize(); if (lazy) lazy.disconnect();
          style.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg; document.body.style.overflow = prevOv;
        }
      };
    },

    thumb: `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#ffd9bd"/></linearGradient></defs><rect width="400" height="300" fill="url(#bg)"/>
      <g><ellipse cx="60" cy="70" rx="24" ry="30" fill="#ff5d8f"/><path d="M60 100c-8 20 8 30 0 60" stroke="#0003" fill="none"/><ellipse cx="340" cy="60" rx="22" ry="28" fill="#3ec6a8"/><path d="M340 88c-8 20 8 30 0 70" stroke="#0003" fill="none"/><ellipse cx="300" cy="110" rx="18" ry="23" fill="#7a6cf0"/><ellipse cx="102" cy="120" rx="18" ry="23" fill="#ffc233"/></g>
      <text x="200" y="118" text-anchor="middle" font-family="'Baloo 2','Trebuchet MS',sans-serif" font-weight="800" font-size="42" fill="#ff7a45">Happy</text>
      <text x="200" y="160" text-anchor="middle" font-family="'Baloo 2','Trebuchet MS',sans-serif" font-weight="800" font-size="42" fill="#3ec6a8">Birthday!</text>
      <g transform="translate(150 178)"><rect x="0" y="40" width="100" height="40" rx="8" fill="#ff5d8f"/><rect x="12" y="18" width="76" height="30" rx="8" fill="#ffc233"/><rect x="46" y="0" width="6" height="20" fill="#7a6cf0"/><path d="M49-12c5 6 5 9 0 13-5-4-5-7 0-13z" fill="#ff8a1f"/></g>
      <g fill="#ff7a45"><rect x="30" y="200" width="10" height="5" transform="rotate(30 30 200)"/><rect x="360" y="190" width="10" height="5" transform="rotate(-40 360 190)"/></g><g fill="#7a6cf0"><circle cx="340" cy="230" r="5"/><circle cx="60" cy="250" r="5"/></g></svg>`
  });
})();
