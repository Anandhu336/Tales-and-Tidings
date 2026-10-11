/* Template: Celestial traditional wedding.
   A cream page over a gold lotus lattice, rose florals and hanging lanterns, crimson accents and Gloock lettering.
   Opens on an invitation card (monogram, both photos, the main event), then: hero, countdown, the couple,
   quick-action tiles, events, gallery, video, dress code, RSVP and a thank-you. All artwork is drawn in SVG here. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el, esc = u.esc;

  /* ---------------- colour helpers ---------------- */
  const rgb = c => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return null; let h = m[1]; if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = a => '#' + a.map(v => Math.round(u.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return x && y ? toHex(x.map((v, i) => v + (y[i] - v) * t)) : a; };

  const PALETTES = {
    crimson:  { name: 'Crimson and gold',  pri: '#c2324f', bg: '#fff4e3', gold: '#d6ab52' },
    maroon:   { name: 'Maroon and gold',   pri: '#7f1d2d', bg: '#fbf0de', gold: '#c99a3c' },
    marigold: { name: 'Marigold',          pri: '#c9571a', bg: '#fff6e6', gold: '#e0a83a' },
    peacock:  { name: 'Peacock green',     pri: '#0f6a66', bg: '#f4f5ea', gold: '#c9a24a' },
    royal:    { name: 'Royal purple',      pri: '#5b2a86', bg: '#f8f1f7', gold: '#c9a24a' },
    rose:     { name: 'Rose pink',         pri: '#d0567a', bg: '#fff3f1', gold: '#d6ab52' }
  };
  const theme = d => {
    const p = Object.assign({}, PALETTES[d.palette] || PALETTES.crimson);
    if (rgb(d.c_pri)) p.pri = d.c_pri; if (rgb(d.c_bg)) p.bg = d.c_bg; if (rgb(d.c_gold)) p.gold = d.c_gold;
    p.priD = mix(p.pri, '#000000', .16); p.priL = mix(p.pri, '#ffffff', .82);
    return p;
  };

  const FONTS = 'https://fonts.googleapis.com/css2?family=Gloock&family=Roboto:wght@400;500;700&family=Playfair+Display:ital,wght@1,500&family=Allura&display=swap';
  const svgUri = s => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const cssUrl = s => 'url("' + String(s).replace(/["\\\n\r]/g, c => encodeURIComponent(c)) + '")';

  /* ---------------- artwork ---------------- */
  // lotus inside each diamond of a double-lined lattice; flowers sit on the tile edges so neighbours complete them
  const lotus = (x, y, c) => {
    const pet = (n, r, w, rot) => Array.from({ length: n }, (_, i) => `<path transform="rotate(${rot + i * 360 / n})" d="M0 -${r}C${w} -${r * .7} ${w} -${r * .32} 0 -${r * .2}C-${w} -${r * .32} -${w} -${r * .7} 0 -${r}Z"/>`).join('');
    return `<g transform="translate(${x} ${y})" stroke="${c}" fill="none" stroke-width="1.6">${pet(8, 40, 12, 22.5)}${pet(8, 30, 10, 0)}<circle r="9"/>` +
      [0, 90, 180, 270].map(a => `<g transform="rotate(${a})"><path d="M0 -12V-27"/><circle cy="-30" r="2.4"/></g>`).join('') + '</g>';
  };
  const latticeTile = c => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g stroke="${c}" stroke-width="1.6" fill="none">
    <path d="M-4 -4L164 164M-4 4L156 164M4 -4L164 156M164 -4L-4 164M164 4L4 164M156 -4L-4 156"/></g>${lotus(80, 0, c)}${lotus(80, 160, c)}${lotus(0, 80, c)}${lotus(160, 80, c)}</svg>`;

  // a single rose seen from above, then a cluster of roses, buds and leaves for the corners
  const rose = (x, y, r, a, b, rot) => {
    const ring = (n, rr, pw, col, op, off) => Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="${-rr}" rx="${pw}" ry="${pw * 1.15}" transform="rotate(${off + i * 360 / n})" fill="${col}" fill-opacity="${op}"/>`).join('');
    return `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${r / 40})">${ring(7, 24, 18, a, .95, 0)}${ring(6, 15, 13, b, .9, 30)}${ring(5, 8, 9, a, .95, 10)}` +
      `<path d="M-6 -2C-6 -10 8 -10 8 -1C8 6 -3 8 -4 2C-5 -3 3 -4 3 0" fill="none" stroke="${b}" stroke-width="2.2" stroke-linecap="round"/></g>`;
  };
  const leafy = (x, y, l, rot, c) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0C${l * .25} -${l * .3} ${l * .7} -${l * .28} ${l} 0C${l * .7} ${l * .28} ${l * .25} ${l * .3} 0 0Z" fill="${c}"/>`;
  const fern = (x, y, l, rot, c) => `<g transform="translate(${x} ${y}) rotate(${rot})" fill="${c}"><path d="M0 0Q${l * .5} -${l * .08} ${l} 0" stroke="${c}" stroke-width="1.4" fill="none"/>` +
    Array.from({ length: 8 }, (_, i) => { const t = (i + 1) / 9 * l; return leafy(t, -1, l * .2 * (1 - i / 12), -55, c) + leafy(t, 1, l * .2 * (1 - i / 12), 55, c); }).join('') + '</g>';
  const cornerFlora = () => '<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">' +
    fern(10, 120, 150, -8, '#b48a7a') + fern(110, 6, 140, 70, '#b48a7a') + fern(40, 40, 170, 38, '#c99a86') +
    leafy(70, 150, 70, 20, '#8f2142') + leafy(150, 70, 70, 60, '#a8294f') + leafy(30, 170, 60, 80, '#c3486b') +
    rose(54, 58, 54, '#c21f55', '#7e0f33', 10) + rose(128, 30, 34, '#e7739a', '#b83563', -20) + rose(26, 132, 32, '#e7739a', '#b83563', 30) +
    rose(108, 104, 22, '#9b1640', '#5e0a24', 0) + '<g fill="#f2a6c0"><circle cx="160" cy="118" r="4"/><circle cx="172" cy="108" r="3"/><circle cx="96" cy="160" r="3.5"/><circle cx="182" cy="40" r="3"/></g></svg>';
  const bottomFlora = () => '<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">' + fern(0, 200, 160, -60, '#b48a7a') + fern(20, 196, 150, -30, '#c99a86') +
    leafy(70, 170, 70, -40, '#a8294f') + rose(40, 168, 46, '#c21f55', '#7e0f33', 0) + rose(112, 186, 30, '#e7739a', '#b83563', 20) + rose(12, 110, 26, '#e7739a', '#b83563', 0) + '</svg>';

  const lantern = () => '<svg viewBox="0 0 60 170" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="clg" x1="0" x2="1"><stop offset="0" stop-color="#b9862d"/><stop offset=".5" stop-color="#f6d27a"/><stop offset="1" stop-color="#a8761f"/></linearGradient>' +
    '<radialGradient id="clw"><stop offset="0" stop-color="#fff6cf"/><stop offset=".6" stop-color="#ffd772" stop-opacity=".85"/><stop offset="1" stop-color="#f0b443" stop-opacity=".35"/></radialGradient></defs>' +
    '<path d="M30 0V40" stroke="#b9862d" stroke-width="1.6"/><circle cx="30" cy="44" r="4" fill="none" stroke="url(#clg)" stroke-width="2"/><path d="M14 58C14 48 46 48 46 58L42 64H18Z" fill="url(#clg)"/>' +
    '<path d="M18 64H42L46 120H14Z" fill="url(#clw)"/><path d="M18 64L14 120M42 64L46 120M30 64V120M24 64L22 120M36 64L38 120" stroke="url(#clg)" stroke-width="1.6"/>' +
    '<path d="M12 120H48L42 132H18Z" fill="url(#clg)"/><path d="M30 132V150" stroke="#b9862d" stroke-width="1.6"/><path d="M26 150H34L32 164H28Z" fill="url(#clg)"/></svg>';

  const flourish = '<svg viewBox="0 0 160 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M68 18C52 6 34 26 18 14C12 10 10 16 14 18C18 20 20 14 16 12"/><path d="M92 18C108 6 126 26 142 14C148 10 150 16 146 18C142 20 140 14 144 12"/><path d="M4 20C22 24 40 24 64 20M156 20C138 24 120 24 96 20"/>' +
    '<g fill="currentColor" fill-opacity=".25"><circle cx="80" cy="16" r="3"/>' + [0, 72, 144, 216, 288].map(a => `<ellipse cx="80" cy="9" rx="3.4" ry="5" transform="rotate(${a} 80 16)"/>`).join('') + '</g></svg>';
  const wave = c => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 12"><path d="M0 6Q10 0 20 6T40 6" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`);
  const laurel = '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="42" stroke-dasharray="1 3"/>' +
    '<g fill="currentColor" fill-opacity=".55" stroke="none">' + Array.from({ length: 9 }, (_, i) => { const a = (200 + i * 15) * Math.PI / 180, b = (340 - i * 15) * Math.PI / 180, R = 44; return [a, b].map(t => `<ellipse cx="${(50 + R * Math.cos(t)).toFixed(1)}" cy="${(50 + R * Math.sin(t)).toFixed(1)}" rx="1.6" ry="3.6" transform="rotate(${(t * 180 / Math.PI + 90).toFixed(0)} ${(50 + R * Math.cos(t)).toFixed(1)} ${(50 + R * Math.sin(t)).toFixed(1)})"/>`).join(''); }).join('') + '</g></svg>';

  const ICONS = {
    mandap: '<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 40C30 30 46 26 60 26S90 30 106 40"/><path d="M14 40H106V48H14Z"/><path d="M22 48V104M98 48V104M10 104H110V110H10Z"/><path d="M22 48C30 64 38 72 42 100M98 48C90 64 82 72 78 100"/><circle cx="60" cy="32" r="7"/><path d="M60 62C54 54 42 58 44 68C46 76 60 84 60 84S74 76 76 68C78 58 66 54 60 62Z" fill="#e2b04a" stroke="none"/></svg>',
    dining: '<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><circle cx="60" cy="60" r="30"/><circle cx="60" cy="60" r="20"/><path d="M16 22V48C16 54 26 54 26 48V22M21 22V104M100 22C92 28 92 50 100 56V104"/><path d="M60 64C56 58 48 60 49 66C50 71 60 76 60 76S70 71 71 66C72 60 64 58 60 64Z" fill="#e2b04a" stroke="none"/></svg>',
    rings: '<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="3.4"><circle cx="46" cy="70" r="24"/><circle cx="74" cy="70" r="24"/><path d="M38 40L46 30L54 40L46 46Z" fill="#e2b04a" stroke="#e2b04a" stroke-linejoin="round"/></svg>',
    music: '<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M46 84V30L90 20V74"/><circle cx="36" cy="86" r="10" fill="#e2b04a" stroke="none"/><circle cx="80" cy="76" r="10" fill="#e2b04a" stroke="none"/><path d="M46 44L90 34"/></svg>',
    henna: '<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M40 110V70C40 60 32 54 32 44V30C32 26 38 26 38 30V52M38 30V20C38 16 44 16 44 20V50M44 22V14C44 10 50 10 50 14V50M50 18C50 14 56 14 56 18V56C60 48 70 44 74 50C68 58 64 70 60 80V110"/><circle cx="48" cy="72" r="6" fill="#e2b04a" stroke="none"/></svg>'
  };
  const UI = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 10L12 4L21 10V20H3Z"/><path d="M3 10L12 15L21 10"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.5-8.6-9C2.2 7.6 4.4 5 7.2 5c1.9 0 3.4 1 4.8 2.8C13.4 6 14.9 5 16.8 5c2.8 0 5 2.6 3.8 6C19 15.5 12 20 12 20z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 7.5C2 5.6 3.4 4.4 5.2 4.3 7.8 4.1 9.9 4 12 4s4.2.1 6.8.3C20.6 4.4 22 5.6 22 7.5v9c0 1.9-1.4 3.1-3.2 3.2-2.6.2-4.7.3-6.8.3s-4.2-.1-6.8-.3C3.4 19.6 2 18.4 2 16.5z"/><path d="M10 9V15L15 12Z" fill="#fff"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="4"/><path d="M1.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5z"/><path d="M15.5 12l2.2 2.2L22 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7L15.4 6.6M8.6 13.3L15.4 17.4" stroke="currentColor" stroke-width="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6H20M4 12H20M4 18H20"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9H7L12 5V19L7 15H3Z"/><path d="M16 8.5C17.5 10 17.5 14 16 15.5M18.6 6C21.4 8.8 21.4 15.2 18.6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9H7L12 5V19L7 15H3Z"/><path d="M16 9L22 15M22 9L16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6L12 11L17 6M7 13L12 18L17 13"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>'
  };

  /* ---------------- styles ---------------- */
  const CSS = `
  .tpl-celestial{--head:'Gloock',Georgia,serif;--body:'Roboto',system-ui,sans-serif;--h:#333;--t:#676d7f;background:var(--bg);color:var(--h);font-family:var(--body);min-height:100vh;overflow-x:hidden;position:relative}
  .tpl-celestial *{box-sizing:border-box}
  .tpl-celestial a{color:inherit}
  .tpl-celestial .c-btn,.tpl-celestial .c-tile,.tpl-celestial .c-wa{color:#fff}
  .c-bgfix{position:fixed;inset:0;z-index:0;pointer-events:none;background:var(--lattice) 0 0/160px 160px repeat;opacity:.34;transform:translateZ(0)}
  .c-main{position:relative;z-index:1}
  .c-wrap{width:min(1000px,100%);margin:0 auto;padding:0 16px}
  .c-sec{padding:56px 0 30px;text-align:center;position:relative}
  .c-sec::after{content:'';display:block;height:14px;margin:56px 0 0;background:var(--wave) repeat-x center/40px 12px}
  .c-sec.last::after{display:none}
  .c-fl{display:block;width:150px;margin:0 auto 4px;color:var(--pri)}
  .c-h2{font:400 clamp(38px,9vw,56px)/1.05 var(--head);color:var(--h);margin:0 0 32px;letter-spacing:-.01em}
  .c-om{position:absolute;left:0;right:0;top:-8px;font:400 clamp(30px,8vw,48px)/1.1 'Allura',cursive;color:var(--gold);opacity:.22;pointer-events:none}
  .c-rv{opacity:0;transform:translateY(24px);transition:opacity .9s ease,transform .9s ease}
  .c-rv.in,.is-static .c-rv{opacity:1;transform:none}
  .c-btn{appearance:none;border:0;cursor:pointer;text-decoration:none;display:inline-block;background:var(--pri);color:#fff;font:500 15px var(--body);padding:10px 22px;border-radius:2px;transition:filter .2s}
  .c-btn:hover{filter:brightness(1.1)}
  .c-pill{border-radius:99px;font:700 10px var(--body);letter-spacing:.3em;text-transform:uppercase;padding:12px 36px;box-shadow:0 4px 16px color-mix(in srgb,var(--pri) 40%,transparent)}

  /* top-right bar + floating WhatsApp */
  .c-bar{position:fixed;top:0;right:0;z-index:40;display:flex}
  .c-bar button{appearance:none;border:0;border-left:1px solid rgba(255,255,255,.25);width:46px;height:46px;background:var(--pri);color:#fff;display:grid;place-items:center;cursor:pointer}
  .c-bar button svg{width:19px;height:19px}
  .c-wa{position:fixed;right:14px;bottom:14px;z-index:40;width:52px;height:52px;border-radius:50%;background:var(--pri);color:#fff;display:grid;place-items:center;box-shadow:0 6px 18px rgba(0,0,0,.25)}
  .c-wa svg{width:26px;height:26px}
  .c-nav{position:fixed;inset:0;z-index:45;background:rgba(20,10,12,.45);display:none}
  .c-nav.open{display:block}
  .c-nav ul{list-style:none;margin:0;padding:64px 0 20px;position:absolute;top:0;right:0;width:min(300px,82vw);height:100%;background:var(--bg);box-shadow:-10px 0 30px rgba(0,0,0,.2)}
  .c-nav a{display:block;padding:14px 26px;font:500 16px var(--body);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--gold) 30%,transparent)}
  .c-nav a:hover{color:var(--pri)}
  .ks-music{display:none!important}

  /* hero */
  .c-hero{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 16px 150px;position:relative;overflow:hidden}
  .c-flora{position:absolute;width:min(46vw,300px);pointer-events:none}
  .c-flora svg{display:block;width:100%;height:auto}
  .c-flora.tl{top:-14px;left:-14px}.c-flora.tr{top:-14px;right:-14px;transform:scaleX(-1)}
  .c-flora.bl{bottom:-10px;left:-10px}.c-flora.br{bottom:-10px;right:-10px;transform:scaleX(-1)}
  .c-lan{position:absolute;top:0;width:38px;transform-origin:50% 0;animation:csway 5s ease-in-out infinite alternate;will-change:transform}
  .c-lan svg{display:block;width:100%;height:auto;filter:drop-shadow(0 0 10px rgba(255,200,90,.55))}
  .c-lan.a{left:calc(50% - min(44vw,330px));top:110px}.c-lan.b{right:calc(50% - min(44vw,330px));top:110px;animation-delay:-2.5s}
  .c-lan.c{left:calc(50% - min(40vw,300px) - 6px);top:250px;width:44px;animation-delay:-1.2s}.c-lan.d{right:calc(50% - min(40vw,300px) - 6px);top:250px;width:44px;animation-delay:-3.6s}
  @keyframes csway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
  .c-mono{width:96px;aspect-ratio:1;position:relative;display:grid;place-items:center;color:var(--gold);margin:0 auto 18px}
  .c-mono svg{position:absolute;inset:0;width:100%;height:100%}
  .c-mono b{font:400 40px/1 var(--head);letter-spacing:-.06em;background:linear-gradient(160deg,#8a6420,var(--gold) 45%,#7a561b);-webkit-background-clip:text;background-clip:text;color:transparent}
  .c-mono.sm{width:64px;margin-bottom:10px}.c-mono.sm b{font-size:26px}
  .c-hero h6{font:700 clamp(15px,4vw,19px)/1.3 var(--body);text-transform:uppercase;margin:0 0 14px;color:var(--h);max-width:260px}
  .c-names{font:400 clamp(30px,8vw,46px)/1.05 var(--head);color:var(--pri);text-transform:uppercase;letter-spacing:.02em;margin:0;display:flex;flex-direction:column;align-items:center}
  .c-names i{font:italic 500 .55em/1.3 'Playfair Display',serif;text-transform:none}
  .c-date{display:flex;align-items:center;justify-content:center;margin:18px 0 22px}
  .c-date span{font:500 clamp(15px,4vw,18px) var(--body);text-transform:uppercase;min-width:110px}
  .c-date b{font:700 clamp(40px,11vw,52px)/1 var(--body);color:var(--pri);padding:6px 18px;border-left:1px solid color-mix(in srgb,var(--h) 22%,transparent);border-right:1px solid color-mix(in srgb,var(--h) 22%,transparent)}
  .c-time{font:700 13px var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--pri)}
  .c-hin>*{opacity:0;transform:translateY(16px);animation:cin 1.1s ease forwards}
  @keyframes cin{to{opacity:1;transform:none}}
  .is-static .c-hin>*{animation:none;opacity:1;transform:none}

  /* countdown */
  .c-count{position:relative;max-width:620px;margin:-70px auto 0;background:var(--pri);color:#fff;border-radius:3px;padding:24px 20px 46px;box-shadow:0 18px 40px color-mix(in srgb,var(--pri) 25%,transparent);z-index:2}
  .c-count p{margin:0;font:400 18px var(--body)}
  .c-count h3{margin:2px 0 18px;font:400 clamp(32px,8vw,40px)/1.15 var(--head)}
  .c-cd{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .c-cd div{background:color-mix(in srgb,#000 13%,var(--pri));border-radius:3px;padding:12px 2px 10px}
  .c-cd b{display:block;font:700 clamp(26px,7vw,34px)/1 var(--body)}
  .c-cd span{font:500 12px var(--body)}
  .c-cdbig{font:400 30px var(--head)}
  .c-down{position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;background:var(--bg);color:var(--pri);display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.12);text-decoration:none}
  .c-down svg{width:20px;height:20px}

  /* couple */
  .c-ph{width:min(64vw,250px);aspect-ratio:1;border-radius:50%;margin:0 auto 22px;background:var(--priL) center/cover no-repeat;display:grid;place-items:center;font:400 72px var(--head);color:var(--pri)}
  .c-person h4{font:500 22px var(--body);margin:0 0 10px}
  .c-person p{font:400 16px/1.5 var(--body);color:var(--t);margin:0}
  .c-amp{font:italic 500 40px/1 'Playfair Display',serif;color:var(--pri);margin:18px 0}
  .c-couple{display:grid;grid-template-columns:1fr;align-items:center}
  @media(min-width:860px){.c-couple{grid-template-columns:1fr auto 1fr;gap:30px}.c-amp{margin:0}}
  .c-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,130px));justify-content:center;gap:20px;margin:40px auto 0}
  @media(min-width:700px){.c-tiles{grid-template-columns:repeat(4,130px)}}
  .c-tile{appearance:none;border:0;cursor:pointer;text-decoration:none;background:var(--pri);color:#fff;border-radius:3px;padding:16px 8px;aspect-ratio:.84;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:700 15px/1.2 var(--body);transition:transform .2s}
  .c-tile:hover{transform:translateY(-3px)}
  .c-tile i{width:80px;height:80px;border-radius:50%;background:color-mix(in srgb,#000 14%,var(--pri));display:grid;place-items:center}
  .c-tile svg{width:26px;height:26px}

  /* events */
  .c-events{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:36px}
  .c-ev .pic{aspect-ratio:400/260;background:var(--pri) center/cover no-repeat;border-radius:3px;display:grid;place-items:center;margin-bottom:22px}
  .c-ev .pic svg{width:46%;max-width:150px;height:auto}
  .c-ev h4{font:500 22px var(--body);margin:0 0 10px}
  .c-ev p{font:400 16px/1.75 var(--body);color:var(--t);margin:0}
  .c-ev p b{font-weight:700}
  .c-ev .c-btn{margin-top:16px}

  /* gallery, video, dress */
  .c-gal{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  @media(min-width:800px){.c-gal{grid-template-columns:repeat(4,1fr)}}
  .c-gal button{appearance:none;border:0;padding:0;cursor:zoom-in;aspect-ratio:19/16;background:var(--priL) center 25%/cover no-repeat}
  .c-video{position:relative;aspect-ratio:16/9;background:#000;max-width:800px;margin:0 auto}
  .c-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  .c-dress p{font:500 17px/1.5 var(--body);color:var(--t);margin:0 0 12px;white-space:pre-line}
  .c-sw{display:flex;gap:10px;justify-content:center}
  .c-sw i{width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}

  /* rsvp + modal */
  .c-form{max-width:460px;margin:0 auto;text-align:left;display:grid;gap:14px}
  .c-form label.f{font:500 14px var(--body);color:var(--t);display:grid;gap:6px}
  .c-form input,.c-form textarea{font:400 16px var(--body);padding:12px 14px;border:2px solid color-mix(in srgb,var(--gold) 35%,#e5e5e5);border-radius:10px;background:#fff;color:var(--h);width:100%}
  .c-form input:focus,.c-form textarea:focus{outline:none;border-color:var(--pri)}
  .c-att{display:flex;gap:12px}
  .c-att label{flex:1;cursor:pointer;position:relative}
  .c-att input{position:absolute;opacity:0;width:0;height:0}
  .c-att span{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 10px;border:2px solid color-mix(in srgb,var(--gold) 35%,#e5e5e5);border-radius:10px;font:500 15px var(--body);background:#fff;transition:all .2s}
  .c-att input:checked+span{border-color:var(--pri);background:var(--priL);color:var(--pri)}
  .c-att input:focus-visible+span{outline:2px solid var(--pri);outline-offset:2px}
  .c-form .c-btn{justify-self:center;margin-top:6px}
  .c-modal{position:fixed;inset:0;z-index:70;background:rgba(15,8,10,.6);display:grid;place-items:center;padding:16px;animation:cin .25s ease}
  .c-modal>div{background:var(--bg);border-radius:6px;padding:28px 20px;width:min(460px,100%);position:relative;text-align:center}
  .c-modal h3{font:400 30px var(--head);margin:0 0 18px}
  .c-x{position:absolute;top:8px;right:8px;appearance:none;border:0;background:none;font-size:22px;cursor:pointer;color:var(--h);width:40px;height:40px}
  .c-lb{position:fixed;inset:0;z-index:70;background:rgba(10,6,8,.92);display:grid;place-items:center;padding:16px}
  .c-lb img{max-width:min(94vw,900px);max-height:86vh;border-radius:4px}
  .c-lb button{position:absolute;appearance:none;border:0;background:rgba(255,255,255,.16);color:#fff;width:46px;height:46px;border-radius:50%;font-size:22px;cursor:pointer}
  .c-lb .x{top:14px;right:14px}.c-lb .p{left:10px;top:50%}.c-lb .n{right:10px;top:50%}

  /* thank you */
  .c-thanks{padding:40px 16px 110px;text-align:center;position:relative}
  .c-thanks h2{font:400 clamp(70px,20vw,120px)/.9 'Allura',cursive;color:var(--pri);margin:0}
  .c-thanks p{font:500 clamp(15px,4vw,19px) var(--body);letter-spacing:.14em;color:var(--t);margin:6px 0 0}
  .c-thanks .tag{font:700 13px var(--body);letter-spacing:.2em;color:var(--pri);margin-top:22px}

  /* cover card */
  .c-cover{position:fixed;inset:0;z-index:60;background:var(--bg);overflow-y:auto;display:flex;align-items:center;justify-content:center;padding:40px 16px;transition:opacity .6s ease}
  .c-cover.inline{position:relative;inset:auto;min-height:100vh;z-index:1;border-bottom:1px solid color-mix(in srgb,var(--gold) 40%,transparent)}
  .c-cover.gone{opacity:0;pointer-events:none}
  .c-cover::before{content:'';position:absolute;left:0;right:0;top:0;height:min(48vw,260px);background:var(--lattice) center top/120px 120px repeat;opacity:.6;-webkit-mask:radial-gradient(60% 70% at 50% 100%,transparent 99%,#000 100%);mask:radial-gradient(60% 70% at 50% 100%,transparent 99%,#000 100%)}
  .c-arc{position:absolute;left:0;right:0;top:0;height:min(48vw,260px);pointer-events:none}.c-arc svg{display:block;width:100%;height:100%}
  .c-cover .c-flora{width:min(34vw,200px)}
  .c-card{position:relative;z-index:1;text-align:center;width:min(520px,100%)}
  .c-card .lbl{font:700 9px var(--body);letter-spacing:.4em;text-transform:uppercase;color:var(--pri);margin:0}
  .c-rule{display:flex;align-items:center;gap:8px;color:var(--pri);margin:14px 0}
  .c-rule::before,.c-rule::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--h) 25%,transparent))}
  .c-rule::after{transform:scaleX(-1)}
  .c-rule i{width:5px;height:5px;background:currentColor;transform:rotate(45deg)}
  .c-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
  .c-pair .av{width:76px;height:76px;border-radius:50%;margin:0 auto 8px;background:var(--priL) center/cover no-repeat;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--pri);display:grid;place-items:center;font:400 28px var(--head);color:var(--pri)}
  .c-pair b{display:block;font:500 17px var(--body)}
  .c-pair small{font:700 8px var(--body);letter-spacing:.3em;text-transform:uppercase;color:var(--pri)}
  .c-pair .h{color:var(--pri);width:16px}
  .c-card .when{font:700 15px var(--body);margin:8px 0 4px}
  .c-card .tm{font:700 10px var(--body);letter-spacing:.2em;color:var(--pri);text-transform:uppercase;margin:0}

  .c-petal{position:fixed;top:-30px;z-index:65;width:14px;height:18px;border-radius:70% 0 70% 0;background:linear-gradient(135deg,#f6a3be,#c2324f);pointer-events:none;animation:cfall linear forwards}
  @keyframes cfall{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),110vh) rotate(540deg);opacity:0}}
  .is-static .c-lan{animation:none}
  @media(prefers-reduced-motion:reduce){.c-rv,.c-hin>*{transition:none;animation:none;opacity:1;transform:none}.c-lan{animation:none}.c-petal{display:none}}
  `;

  /* ---------------- helpers ---------------- */
  const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const place = (name, address) => ({ name, address, url: '' });
  const digits = s => String(s || '').replace(/[^\d]/g, '');
  const timeLine = (t, suffix) => [u.fmtTime(t), (suffix || '').trim()].filter(Boolean).join(' ');

  /* ---------------- editor form ---------------- */
  const PKEYS = ['c_pri', 'c_bg', 'c_gold'];
  const SCHEMA = [
    { id: 'look', title: 'Design and colours', open: true, fields: [
      { key: 'palette', type: 'choice', label: 'Colours', resets: PKEYS, options: Object.entries(PALETTES).map(([v, p]) => ({ v, l: p.name, c: `linear-gradient(135deg,${p.bg} 50%,${p.pri} 50%)` })) },
      { key: 'c_pri', type: 'color', label: 'Main colour (names, buttons, countdown)', default: d => theme(d).pri },
      { key: 'c_bg', type: 'color', label: 'Page background', default: d => theme(d).bg },
      { key: 'c_gold', type: 'color', label: 'Gold (pattern, monogram, lanterns glow)', default: d => theme(d).gold },
      { type: 'reset', label: 'Back to the palette colours', keys: PKEYS },
      { key: 'florals', type: 'toggle', label: 'Show roses in the corners' },
      { key: 'lanterns', type: 'toggle', label: 'Show hanging lanterns' },
      { key: 'cover', type: 'toggle', label: 'Start with the invitation card', help: 'Guests tap "View invitation" to open the page. This is also when the music starts.' },
      { key: 'petals', type: 'toggle', label: 'Rose petals fall when it opens' }
    ] },
    { id: 'couple', title: 'The couple', open: true, fields: [
      { key: 'name1', type: 'text', label: 'Groom: short name', max: 24, placeholder: 'e.g. Akhil' },
      { key: 'full1', type: 'text', label: 'Groom: full name', max: 40, placeholder: 'e.g. Akhil Menon' },
      { key: 'about1', type: 'text', label: 'Groom: family line', max: 100, placeholder: 'e.g. Son of Mr. Ajay and Mrs. Deepa Menon' },
      { key: 'photo1', type: 'image', label: 'Groom: photo' },
      { key: 'name2', type: 'text', label: 'Bride: short name', max: 24, placeholder: 'e.g. Veena' },
      { key: 'full2', type: 'text', label: 'Bride: full name', max: 40 },
      { key: 'about2', type: 'text', label: 'Bride: family line', max: 100 },
      { key: 'photo2', type: 'image', label: 'Bride: photo' },
      { key: 'label1', type: 'text', label: 'Label under the first name', max: 14, placeholder: 'Groom' },
      { key: 'label2', type: 'text', label: 'Label under the second name', max: 14, placeholder: 'Bride' }
    ] },
    { id: 'hero', title: 'Cover and date', fields: [
      { key: 'coverTitle', type: 'text', label: 'Line on the invitation card', max: 40, placeholder: 'You are invited' },
      { key: 'coverEvent', type: 'text', label: 'Event named on the card', max: 30, placeholder: 'e.g. Reception' },
      { key: 'heroTitle', type: 'text', label: 'Line above the names', max: 40, placeholder: 'We are getting married' },
      { key: 'date', type: 'date', label: 'Main date', help: 'Shown on the cover and used for the countdown.' },
      { key: 'time', type: 'time', label: 'Time' },
      { key: 'timeSuffix', type: 'text', label: 'Word after the time', max: 20, placeholder: 'Onwards' },
      { key: 'blessing', type: 'text', label: 'Faint blessing behind headings', max: 40, placeholder: 'Om Shree Ganeshaya Namah' }
    ] },
    { id: 'count', title: 'Countdown', fields: [
      { key: 'showCountdown', type: 'toggle', label: 'Show the countdown' },
      { key: 'countTop', type: 'text', label: 'Small line', max: 40, show: d => d.showCountdown },
      { key: 'countTitle', type: 'text', label: 'Big line', max: 30, show: d => d.showCountdown }
    ] },
    { id: 'events', title: 'When and where', fields: [
      { key: 'events', type: 'repeater', label: '', max: 8, addLabel: 'Add an event', itemLabel: 'Event', title: i => [i.title, i.date].filter(Boolean).join('  ·  '),
        blank: { title: '', icon: 'mandap', photo: '', date: '', time: '', suffix: '', place: { name: '', address: '', url: '' }, contact: '' },
        help: 'Muhurtham, reception, haldi, mehndi... shown in date order. Leave the date empty to use the main date.',
        fields: [
          { key: 'title', type: 'text', label: 'Name of the event', max: 40 },
          { key: 'icon', type: 'choice', label: 'Picture on the card', options: [{ v: 'mandap', l: 'Mandap' }, { v: 'dining', l: 'Dinner' }, { v: 'rings', l: 'Rings' }, { v: 'music', l: 'Music' }, { v: 'henna', l: 'Mehndi' }] },
          { key: 'photo', type: 'image', label: 'Or a photo of the venue (optional)' },
          { key: 'date', type: 'date', label: 'Date' }, { key: 'time', type: 'time', label: 'Time' },
          { key: 'suffix', type: 'text', label: 'Word after the time (optional)', max: 20, placeholder: 'Onwards' },
          { key: 'place', type: 'place', label: 'Where' },
          { key: 'contact', type: 'text', label: 'Contact number (optional)', max: 30 }
        ] }
    ] },
    { id: 'gallery', title: 'Photo gallery', fields: [
      { key: 'gallery', type: 'repeater', label: '', max: 16, addLabel: 'Add a photo', itemLabel: 'Photo', blank: { img: '' }, fields: [{ key: 'img', type: 'image', label: 'Photo' }] }
    ] },
    { id: 'media', title: 'Invitation card, video and live stream', fields: [
      { key: 'card', type: 'image', label: 'Printed invitation card (optional)', help: 'Adds an "Invitation Card" button that shows this picture.' },
      { key: 'video', type: 'text', label: 'YouTube video link (optional)', max: 200, help: 'Shown in "Our Video".' },
      { key: 'live', type: 'text', label: 'Live stream link (optional)', max: 200, help: 'Adds a "Live Streaming" button.' }
    ] },
    { id: 'dress', title: 'Dress code', fields: [
      { key: 'dressText', type: 'textarea', label: 'Dress code', rows: 2, help: 'Leave empty to hide this section.' },
      { key: 'dressColors', type: 'repeater', label: 'Colours', max: 6, addLabel: 'Add a colour', itemLabel: 'Colour', blank: { c: '#6a1b9a' }, fields: [{ key: 'c', type: 'color', label: 'Colour', default: '#6a1b9a' }] }
    ] },
    { id: 'rsvp', title: 'RSVP and greetings', fields: [
      { key: 'rsvpOn', type: 'toggle', label: 'Ask guests to RSVP' },
      { key: 'wishOn', type: 'toggle', label: 'Let guests send greetings' },
      { key: 'whatsapp', type: 'text', label: 'WhatsApp number for replies', max: 30, placeholder: 'e.g. +91 98765 43210', help: 'Full number with country code. RSVPs and greetings arrive here as WhatsApp messages.' }
    ] },
    { id: 'end', title: 'Thank you', fields: [
      { key: 'thanks', type: 'text', label: 'Big words', max: 24 },
      { key: 'thanksSub', type: 'text', label: 'Line underneath', max: 50 },
      { key: 'hashtag', type: 'text', label: 'Wedding hashtag (optional)', max: 40 }
    ] }
  ];

  /* ---------------- the page ---------------- */
  function mount(root, data, ctx) {
    const preview = !!ctx.preview, th = theme(data);
    u.font(FONTS);
    const style = el('style', {}, CSS); document.head.append(style);
    const prevBg = document.body.style.background, prevOv = document.body.style.overflow;
    document.body.style.background = th.bg;
    root.className = 'tpl-celestial' + (preview ? ' is-static' : '');
    const vars = { pri: th.pri, priD: th.priD, priL: th.priL, bg: th.bg, gold: th.gold, lattice: svgUri(latticeTile(th.gold)), wave: wave(th.pri) };
    root.style.cssText = Object.entries(vars).map(([k, v]) => `--${k}:${v}`).join(';');

    const n1 = (data.name1 || '').trim(), n2 = (data.name2 || '').trim();
    const pair = [n1, n2].filter(Boolean), pairTxt = pair.join(' & ') || 'Our wedding';
    const init = (n1[0] || '') + (n2[0] || '');
    const date = data.date || '', when = u.parseDate(date, data.time);
    const dt = u.parseDate(date);
    const tLine = timeLine(data.time, data.timeSuffix);
    const wa = digits(data.whatsapp);
    const shareUrl = preview ? '' : location.href;
    const om = (data.blessing || '').trim();
    const flower = `<span class="c-fl">${flourish}</span>`;
    const head = (t, id) => `${om ? `<div class="c-om" aria-hidden="true">${esc(om)}</div>` : ''}${flower}<h2 class="c-h2"${id ? ` id="${id}"` : ''}>${esc(t)}</h2>`;
    const photo = (src, letter, cls) => `<div class="${cls}" ${src ? `style="background-image:${esc(cssUrl(src))}"` : ''}>${src ? '' : esc(letter || '')}</div>`;
    const mono = sm => init ? `<div class="c-mono${sm ? ' sm' : ''}">${laurel}<b>${esc(init)}</b></div>` : '';
    const florals = data.florals !== false, lanterns = data.lanterns !== false;

    /* events, in date order */
    const events = (data.events || []).filter(e => e && (e.title || e.time || (e.place && (e.place.name || e.place.address))))
      .map((e, i) => Object.assign({ _i: i }, e, { date: e.date || date }))
      .sort((a, b) => ((a.date || '9') + (a.time || '99')).localeCompare((b.date || '9') + (b.time || '99')) || a._i - b._i);
    const coverEv = (data.coverEvent || '').trim();

    /* cover card */
    const coverHtml = inline => `<div class="c-cover${inline ? ' inline' : ''}" id="cCover"><div class="c-arc"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 100A60 70 0 0 1 110 100" fill="none" stroke="var(--gold)" stroke-width="3" vector-effect="non-scaling-stroke" opacity=".7"/></svg></div>
      ${florals ? `<div class="c-flora tl">${cornerFlora()}</div><div class="c-flora tr">${cornerFlora()}</div><div class="c-flora bl">${bottomFlora()}</div><div class="c-flora br">${bottomFlora()}</div>` : ''}
      <div class="c-card">${mono(true)}<p class="lbl">${esc((data.coverTitle || '').trim() || 'You are invited')}</p>
        <div class="c-rule"><i></i></div>
        <div class="c-pair"><div>${photo(data.photo1, n1[0], 'av')}<b>${esc(n1 || 'Groom')}</b><small>${esc((data.label1 || '').trim() || 'Groom')}</small></div>
          <span class="h">${UI.heart.replace('fill="none"', 'fill="currentColor"')}</span>
          <div>${photo(data.photo2, n2[0], 'av')}<b>${esc(n2 || 'Bride')}</b><small>${esc((data.label2 || '').trim() || 'Bride')}</small></div></div>
        <div class="c-rule"><i></i></div>
        ${coverEv ? `<p class="lbl">${esc(coverEv)}</p>` : ''}
        ${dt ? `<p class="when">${esc(u.fmtDate(date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}</p>` : ''}
        ${tLine ? `<p class="tm">${esc(tLine)}</p>` : ''}
        <div class="c-rule"><i></i></div>
        ${inline ? '' : '<button class="c-btn c-pill" id="cOpen" type="button">View invitation</button>'}</div></div>`;

    const S = [], nav = [['cHome', 'Home']];
    /* hero */
    S.push(`<header class="c-hero" id="cHome">
      ${florals ? `<div class="c-flora tl">${cornerFlora()}</div><div class="c-flora tr">${cornerFlora()}</div><div class="c-flora bl">${bottomFlora()}</div><div class="c-flora br">${bottomFlora()}</div>` : ''}
      ${lanterns ? ['a', 'b', 'c', 'd'].map(k => `<div class="c-lan ${k}">${lantern()}</div>`).join('') : ''}
      <div class="c-hin">${mono()}
        <h6 style="animation-delay:.15s">${esc((data.heroTitle || '').trim() || 'We are getting married')}</h6>
        <h1 class="c-names" style="animation-delay:.35s">${pair.length === 2 ? `<span>${esc(n1)}</span><i>&amp;</i><span>${esc(n2)}</span>` : `<span>${esc(pair[0] || 'Your names')}</span>`}</h1>
        ${dt ? `<div class="c-date" style="animation-delay:.55s"><span>${esc(dt.toLocaleDateString(undefined, { month: 'long' }))}</span><b>${String(dt.getDate()).padStart(2, '0')}</b><span>${dt.getFullYear()}</span></div>` : ''}
        ${tLine ? `<p class="c-time" style="animation-delay:.7s">${esc(tLine)}</p>` : ''}</div></header>`);

    /* countdown */
    if (data.showCountdown !== false && when) S.push(`<div class="c-wrap"><div class="c-count c-rv"><p>${esc(data.countTop || '')}</p><h3>${esc(data.countTitle || '')}</h3><div id="cCd"></div><a class="c-down" href="#cCouple" aria-label="Scroll down">${UI.down}</a></div></div>`);

    /* couple + tiles */
    const tiles = [];
    if (data.card) tiles.push(`<button class="c-tile" type="button" data-act="card"><i>${UI.mail}</i>Invitation Card</button>`);
    if (data.wishOn) tiles.push(`<button class="c-tile" type="button" data-act="wish"><i>${UI.heart}</i>Send Greetings</button>`);
    const live = u.safeUrl(data.live);
    if (live) tiles.push(`<a class="c-tile" href="${esc(live)}" target="_blank" rel="noopener"><i>${UI.play}</i>Live Streaming</a>`);
    if (data.rsvpOn) tiles.push(`<a class="c-tile" href="#cRsvp"><i>${UI.user}</i>RSVP</a>`);
    const person = (n, full, about, ph) => `<div class="c-person c-rv">${photo(ph, n[0], 'c-ph')}<h4>${esc(full || n)}</h4>${about ? `<p>${esc(about)}</p>` : ''}</div>`;
    if (pair.length) {
      nav.push(['cCouple', 'Happy Couple']);
      S.push(`<section class="c-sec" id="cCouple"><div class="c-wrap">${head('Happy Couple')}<div class="c-couple">
        ${n1 ? person(n1, data.full1, data.about1, data.photo1) : ''}${pair.length === 2 ? '<div class="c-amp">&amp;</div>' : ''}${n2 ? person(n2, data.full2, data.about2, data.photo2) : ''}</div>
        ${tiles.length ? `<div class="c-tiles c-rv">${tiles.join('')}</div>` : ''}</div></section>`);
    }

    /* events */
    if (events.length) {
      nav.push(['cWhen', 'When & Where']);
      S.push(`<section class="c-sec" id="cWhen"><div class="c-wrap">${head('When & Where')}<div class="c-events">${events.map(e => {
        const map = u.mapsUrl(e.place), p = e.place || {}, d = u.fmtDate(e.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }), comma = d.indexOf(',');
        const dateHtml = d ? (comma > 0 ? `${esc(d.slice(0, comma + 1))} <b>${esc(d.slice(comma + 1).trim())}${e.time ? ', ' + esc(timeLine(e.time, e.suffix)) : ''}</b>` : `<b>${esc(d)}</b>`) : (e.time ? `<b>${esc(timeLine(e.time, e.suffix))}</b>` : '');
        return `<div class="c-ev c-rv"><div class="pic" ${e.photo ? `data-bg="${esc(cssUrl(e.photo))}"` : ''}>${e.photo ? '' : (ICONS[e.icon] || ICONS.mandap)}</div>
          <h4>${esc(e.title || 'Celebration')}</h4>${dateHtml ? `<p>${dateHtml}</p>` : ''}
          ${p.name || p.address ? `<p>${esc([p.name, p.address].filter(Boolean).join(', '))}</p>` : ''}
          ${e.contact ? `<p>Contact: <a href="tel:${esc(e.contact.replace(/[^\d+]/g, ''))}">${esc(e.contact)}</a></p>` : ''}
          ${map ? `<a class="c-btn" href="${esc(map)}" target="_blank" rel="noopener">See Location</a>` : ''}</div>`;
      }).join('')}</div></div></section>`);
    }

    /* gallery */
    const gal = (data.gallery || []).filter(g => g && g.img);
    if (gal.length) {
      nav.push(['cGal', 'Gallery']);
      S.push(`<section class="c-sec" id="cGal"><div class="c-wrap">${head('Gallery')}<div class="c-gal c-rv">${gal.map((g, i) => `<button type="button" data-i="${i}" aria-label="Open photo ${i + 1}" data-bg="${esc(cssUrl(g.img))}"></button>`).join('')}</div></div></section>`);
    }

    /* video */
    const yt = u.youtubeId(data.video);
    if (yt) {
      nav.push(['cVid', 'Video']);
      S.push(`<section class="c-sec" id="cVid"><div class="c-wrap">${head('Our Video')}<div class="c-video c-rv"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${yt}" title="Our video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div></section>`);
    }

    /* dress code */
    if ((data.dressText || '').trim()) {
      nav.push(['cDress', 'Dress Code']);
      const sw = (data.dressColors || []).filter(x => x && rgb(x.c));
      S.push(`<section class="c-sec" id="cDress"><div class="c-wrap c-dress c-rv">${head('Dress Code')}<p>${esc(data.dressText)}</p>${sw.length ? `<div class="c-sw">${sw.map(x => `<i style="background:${esc(x.c)}"></i>`).join('')}</div>` : ''}</div></section>`);
    }

    /* rsvp */
    if (data.rsvpOn) {
      nav.push(['cRsvp', 'RSVP']);
      S.push(`<section class="c-sec" id="cRsvp"><div class="c-wrap">${head('RSVP')}<form class="c-form c-rv" id="cRsvpForm">
        <label class="f">Your name<input name="name" required maxlength="60" autocomplete="name"></label>
        <div class="c-att"><label><input type="radio" name="att" value="yes" checked><span>✓ Will attend</span></label><label><input type="radio" name="att" value="no"><span>✕ Can't attend</span></label></div>
        <label class="f">Number of guests<input name="count" type="number" min="1" max="20" value="1" inputmode="numeric"></label>
        <label class="f">Message (optional)<textarea name="msg" rows="3" maxlength="400"></textarea></label>
        <button class="c-btn c-pill" type="submit">Send RSVP</button></form></div></section>`);
    }

    /* thank you */
    S.push(`<footer class="c-thanks c-rv">${om ? `<div class="c-om" aria-hidden="true" style="top:0">${esc(om)}</div>` : ''}<h2>${esc((data.thanks || '').trim() || 'Thank You')}</h2>${(data.thanksSub || '').trim() ? `<p>${esc(data.thanksSub)}</p>` : ''}${data.hashtag ? `<p class="tag">${esc(data.hashtag)}</p>` : ''}</footer>`);
    if (S.length) S[S.length - 2] = S[S.length - 2].replace('class="c-sec"', 'class="c-sec last"');

    const useCover = !preview && data.cover !== false;
    root.innerHTML = `<div class="c-bgfix"></div>` + (preview && data.cover !== false ? coverHtml(true) : '') +
      `<div class="c-main">${S.join('')}</div>` +
      `<div class="c-bar"><button type="button" id="cSnd" aria-label="Music on or off">${UI.soundOff}</button><button type="button" id="cShare" aria-label="Share">${UI.share}</button><button type="button" id="cMenu" aria-label="Menu">${UI.menu}</button></div>` +
      `<nav class="c-nav" id="cNav"><ul>${nav.map(([id, l]) => `<li><a href="#${id}">${esc(l)}</a></li>`).join('')}</ul></nav>` +
      `<a class="c-wa" id="cWa" href="${esc(u.waLink('', 'You are invited to ' + pairTxt + "'s wedding! " + shareUrl))}" target="_blank" rel="noopener" aria-label="Share on WhatsApp"${useCover ? ' hidden' : ''}>${UI.wa}</a>` +
      (useCover ? coverHtml(false) : '');

    const $ = s => root.querySelector(s);
    const timers = [], cleanups = [];
    const on = (t, ev, fn) => { t.addEventListener(ev, fn); cleanups.push(() => t.removeEventListener(ev, fn)); };

    const lazy = u.lazyBg(root, preview);

    /* reveal on scroll */
    let io = null;
    if (!preview && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
      root.querySelectorAll('.c-rv').forEach(n => io.observe(n));
    } else root.querySelectorAll('.c-rv').forEach(n => n.classList.add('in'));

    /* countdown */
    const cd = $('#cCd');
    if (cd) {
      let nums = null;
      const draw = () => {
        const ms = when - new Date();
        if (ms <= 0) { cd.innerHTML = `<p class="c-cdbig">${u.daysUntil(date) === 0 ? 'Today is the day!' : 'Just married!'}</p>`; nums = null; return; }
        const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60].map(x => String(x).padStart(2, '0'));
        if (!nums) { cd.innerHTML = `<div class="c-cd">${['Days', 'Hours', 'Minutes', 'Seconds'].map(l => `<div><b></b><span>${l}</span></div>`).join('')}</div>`; nums = [...cd.querySelectorAll('b')]; }
        nums.forEach((b, i) => { if (b.textContent !== v[i]) b.textContent = v[i]; });
      };
      draw(); timers.push(setInterval(draw, preview ? 30000 : 1000));
    }

    /* top bar: music, share, menu */
    const snd = $('#cSnd'), music = ctx.music;
    let sndOn = null; const drawSnd = () => { const on = !!(music && music.playing); if (on !== sndOn) { sndOn = on; snd.innerHTML = on ? UI.soundOn : UI.soundOff; } };
    if (!music || !music.has) snd.hidden = true;
    on(snd, 'click', () => { if (music.playing) music.toggle(); else { music.muted = false; music.start(); } setTimeout(drawSnd, 300); });
    timers.push(setInterval(drawSnd, 1500));
    on($('#cShare'), 'click', async () => {
      const url = preview ? '' : location.href;
      try { if (navigator.share) await navigator.share({ title: pairTxt, text: 'You are invited to ' + pairTxt + "'s wedding", url }); else { await navigator.clipboard.writeText(url); u.toast('Link copied'); } } catch (_) {}
    });
    const navEl = $('#cNav');
    on($('#cMenu'), 'click', () => navEl.classList.add('open'));
    on(navEl, 'click', e => {
      const a = e.target.closest('a'); navEl.classList.remove('open');
      if (a) { e.preventDefault(); const t = root.querySelector(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: u.RM ? 'auto' : 'smooth' }); }
    });
    root.querySelectorAll('a[href^="#c"]:not(.c-nav a)').forEach(a => on(a, 'click', e => { const t = root.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: u.RM ? 'auto' : 'smooth' }); } }));

    /* lightbox (gallery + invitation card) */
    let lb = null;
    const closeLb = () => { if (lb) { lb.remove(); lb = null; } };
    const openLb = (list, i) => {
      closeLb(); const src = list[i]; if (!src) return;
      lb = el('div', { class: 'c-lb', onclick: e => { if (e.target === lb) closeLb(); } }, el('img', { src, alt: '' }),
        el('button', { class: 'x', type: 'button', 'aria-label': 'Close', onclick: closeLb }, '✕'),
        list.length > 1 ? el('button', { class: 'p', type: 'button', 'aria-label': 'Previous', onclick: () => openLb(list, (i - 1 + list.length) % list.length) }, '‹') : null,
        list.length > 1 ? el('button', { class: 'n', type: 'button', 'aria-label': 'Next', onclick: () => openLb(list, (i + 1) % list.length) }, '›') : null);
      root.append(lb);
    };
    const galSrc = gal.map(g => g.img);
    root.querySelectorAll('.c-gal button').forEach(b => on(b, 'click', () => openLb(galSrc, +b.dataset.i)));
    on(window, 'keydown', e => { if (e.key === 'Escape') { closeLb(); closeModal(); navEl.classList.remove('open'); } });

    /* greetings modal + rsvp -> WhatsApp */
    const sendWa = text => { if (!wa) return u.toast('Add a WhatsApp number in the editor to receive replies.'); window.open(u.waLink(wa, text), '_blank', 'noopener'); };
    let modal = null;
    const closeModal = () => { if (modal) { modal.remove(); modal = null; } };
    const openWish = () => {
      closeModal();
      const name = el('input', { name: 'name', required: true, maxlength: 60, autocomplete: 'name' }), msg = el('textarea', { name: 'msg', rows: 4, required: true, maxlength: 500 });
      const form = el('form', { class: 'c-form', onsubmit: e => { e.preventDefault(); sendWa(`Wishes for ${pairTxt} from ${name.value.trim()}:\n${msg.value.trim()}`); closeModal(); } },
        el('label', { class: 'f' }, 'Your name', name), el('label', { class: 'f' }, 'Your wishes', msg), el('button', { class: 'c-btn c-pill', type: 'submit' }, 'Send wish'));
      modal = el('div', { class: 'c-modal', onclick: e => { if (e.target === modal) closeModal(); } },
        el('div', {}, el('button', { class: 'c-x', type: 'button', 'aria-label': 'Close', onclick: closeModal }, '✕'), el('h3', {}, 'Send Greetings'), form));
      root.append(modal); name.focus();
    };
    root.querySelectorAll('[data-act]').forEach(b => on(b, 'click', () => { if (b.dataset.act === 'card') openLb([data.card], 0); else openWish(); }));
    const rf = $('#cRsvpForm');
    if (rf) on(rf, 'submit', e => {
      e.preventDefault(); const f = new FormData(rf), yes = f.get('att') === 'yes';
      sendWa(`RSVP for ${pairTxt}'s wedding\nName: ${String(f.get('name')).trim()}\n${yes ? 'Will attend' : "Can't attend"}${yes ? `\nGuests: ${f.get('count') || 1}` : ''}${String(f.get('msg') || '').trim() ? '\nMessage: ' + String(f.get('msg')).trim() : ''}`);
    });

    /* cover card */
    if (useCover) {
      document.body.style.overflow = 'hidden';
      const cover = $('#cCover');
      on($('#cOpen'), 'click', () => {
        ctx.start(); setTimeout(drawSnd, 400);
        cover.classList.add('gone'); document.body.style.overflow = prevOv;
        const w = $('#cWa'); if (w) w.hidden = false;
        if (data.petals !== false && !u.RM) for (let i = 0, n = u.LITE ? 20 : 34; i < n; i++) {
          const p = el('span', { class: 'c-petal' });
          p.style.cssText = `left:${u.rand(0, 100)}vw;animation-duration:${u.rand(4, 8)}s;animation-delay:${u.rand(0, 2.5)}s;--dx:${u.rand(-60, 60)}px;transform:scale(${u.rand(.6, 1.2)})`;
          root.append(p); timers.push(setTimeout(() => p.remove(), 11000));
        }
        timers.push(setTimeout(() => cover.remove(), 700));
      });
    }

    return {
      destroy() {
        timers.forEach(t => { clearInterval(t); clearTimeout(t); }); cleanups.forEach(f => f()); if (io) io.disconnect(); if (lazy) lazy.disconnect(); closeLb(); closeModal();
        style.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg; document.body.style.overflow = prevOv;
      }
    };
  }

  /* ---------------- home-screen card ---------------- */
  const thumb = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#fff4e3"/>
    <g opacity=".45" transform="scale(.75)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}<g transform="translate(160 0)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(320 0)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
    <g transform="translate(0 160)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(160 160)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(320 160)">${latticeTile('#d6ab52').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>
    <g transform="translate(-20 -20) scale(.62)">${cornerFlora().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(420 -20) scale(-.62 .62)">${cornerFlora().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
    <text x="200" y="104" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="13" fill="#333">WE ARE GETTING MARRIED</text>
    <text x="200" y="146" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#c2324f">AKHIL</text>
    <text x="200" y="170" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="18" fill="#c2324f">&amp;</text>
    <text x="200" y="206" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#c2324f">VEENA</text>
    <rect x="120" y="226" width="160" height="40" rx="2" fill="#c2324f"/><text x="200" y="251" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="13" letter-spacing="2" fill="#fff">113 · 23 · 38 · 29</text></svg>`;

  KS.registerTemplate({
    id: 'celestial', group: 'Wedding invitations', name: 'Celestial traditional wedding',
    tagline: 'Gold lotus lattice, roses, glowing lanterns and crimson. Opens on an invitation card, with countdown, couple, events, gallery, video and WhatsApp RSVP.',
    for: 'Kerala and South Indian weddings, muhurtham, reception',
    title: d => (d.name1 || d.name2 ? [d.name1, d.name2].filter(Boolean).join(' & ') + ' Wedding Invitation' : 'Wedding Invitation'),
    defaultMusic: { type: 'library', id: 'g1' },
    schema: SCHEMA, thumb, mount,
    sample: {
      palette: 'crimson', florals: true, lanterns: true, cover: true, petals: true,
      name1: 'Akhil', full1: 'Akhil Menon', about1: 'Son of Mr. Ajay Ramesh and Mrs. Deepa Menon', photo1: '',
      name2: 'Veena', full2: 'Veena Nair', about2: 'Daughter of Mr. Hari Nair and Mrs. Deepa Nair', photo2: '',
      label1: 'Groom', label2: 'Bride',
      coverTitle: 'You are invited', coverEvent: 'Muhurtham', heroTitle: 'We are getting married',
      date: inDays(113), time: '10:45', timeSuffix: 'Onwards', blessing: 'Om Shree Ganeshaya Namah',
      showCountdown: true, countTop: 'We are waiting for.....', countTitle: 'The Adventure',
      events: [
        { title: 'Muhurtham', icon: 'mandap', photo: '', date: '', time: '10:45', suffix: '', place: place('Bolgatty Island', 'Adjacent to Grand Hyatt, Bolgatty, Kochi'), contact: '+91 98765 43210' },
        { title: 'Reception', icon: 'dining', photo: '', date: '', time: '12:30', suffix: 'Onwards', place: place('Bolgatty Island', 'Adjacent to Grand Hyatt, Bolgatty, Kochi'), contact: '+91 98765 43210' }
      ],
      gallery: [], card: '', video: '', live: '',
      dressText: 'Dress to Impress', dressColors: [{ c: '#6a1b9a' }, { c: '#6b6b70' }, { c: '#ece8f4' }],
      rsvpOn: true, wishOn: true, whatsapp: '',
      thanks: 'Thank You', thanksSub: 'for being with us', hashtag: ''
    }
  });
})();
