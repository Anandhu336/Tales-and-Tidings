/* Template family: Wedding invitations.
   One engine, five designs (classic floral, Hindu, Muslim, Christian, modern). Each design is a card on the home screen,
   and the editor can switch design, palette, colours, lettering and photo shape at any time. Registers:
   wedding, wedding-hindu, wedding-muslim, wedding-christian, wedding-modern. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el, esc = u.esc;

  /* ---------------- colour helpers ---------------- */
  const rgb = c => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return null; let h = m[1]; if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = a => '#' + a.map(v => Math.round(u.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return x && y ? toHex(x.map((v, i) => v + (y[i] - v) * t)) : a; }; // t=0 gives a, t=1 gives b
  const lum = c => { const x = rgb(c); if (!x) return 0; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(x[0]) + .7152 * f(x[1]) + .0722 * f(x[2]); };
  const onColor = c => (lum(c) > .42 ? '#2a2119' : '#fffaf0');

  /* ---------------- colour palettes ---------------- */
  const PALETTES = {
    ivory:      { name: 'Ivory and gold',     bg: '#fbf7f0', paper: '#fffdf9', ink: '#3a332c', muted: '#8b7f73', accent: '#b8935a', soft: '#eadfc9', leaf: '#8a9a72', env: '#f1e6d0', env2: '#ead9b9', seal: '#8f2f3b' },
    blush:      { name: 'Blush and rose',     bg: '#fdf1f0', paper: '#fffaf9', ink: '#4a3a3c', muted: '#957f80', accent: '#c4787f', soft: '#f0d6d3', leaf: '#8fa78c', env: '#f7dcda', env2: '#f0c9c6', seal: '#8a3a4a' },
    midnight:   { name: 'Midnight and gold',  bg: '#10162b', paper: '#171e38', ink: '#efe8d8', muted: '#a8a3b8', accent: '#d9b56a', soft: '#2a3358', leaf: '#6f8c86', env: '#232c4d', env2: '#1c2440', seal: '#a3323f' },
    maroon:     { name: 'Maroon and gold',    bg: '#4a0f1c', paper: '#5b1626', ink: '#f8e9c8', muted: '#d8b98a', accent: '#e6b85c', soft: '#7d2a3a', leaf: '#f0a12a', env: '#7a1b2e', env2: '#631425', seal: '#e6b85c' },
    saffron:    { name: 'Saffron and cream',  bg: '#fff5e2', paper: '#fffcf4', ink: '#4b2a12', muted: '#93714d', accent: '#d4691a', soft: '#f4dcb4', leaf: '#e8a029', env: '#fbe0b0', env2: '#f3cd8c', seal: '#a3241a' },
    kasavu:     { name: 'Cream and kasavu',   bg: '#fbf5e6', paper: '#fffdf6', ink: '#3b2f17', muted: '#8a7a57', accent: '#b8912f', soft: '#ecdcae', leaf: '#2f6f4f', env: '#f3e6c1', env2: '#e8d59f', seal: '#2f6f4f' },
    emerald:    { name: 'Emerald and gold',   bg: '#0c2f27', paper: '#123c32', ink: '#f3ecd6', muted: '#a8c4b8', accent: '#d8b45f', soft: '#215747', leaf: '#d8b45f', env: '#17493c', env2: '#0f382e', seal: '#d8b45f' },
    pearl:      { name: 'Pearl and emerald',  bg: '#f5f2ea', paper: '#fffefb', ink: '#1f3a34', muted: '#6d837b', accent: '#1f7a5f', soft: '#d3e3da', leaf: '#4a9a7e', env: '#e2ece5', env2: '#cddcd2', seal: '#1f7a5f' },
    sage:       { name: 'Sage and cream',     bg: '#f6f5ee', paper: '#fffefa', ink: '#38402f', muted: '#7b8572', accent: '#6b8a62', soft: '#dde5d1', leaf: '#7c9a72', env: '#e9eede', env2: '#d8e0c8', seal: '#5f7d57' },
    dustyblue:  { name: 'Dusty blue',         bg: '#f2f5f8', paper: '#ffffff', ink: '#2a3949', muted: '#71859a', accent: '#587ba1', soft: '#d5e0eb', leaf: '#89a4b9', env: '#dfe8f0', env2: '#cad7e4', seal: '#46658a' },
    lavender:   { name: 'Lavender and plum',  bg: '#f7f3fa', paper: '#fffdff', ink: '#3c2e49', muted: '#897b98', accent: '#8560ad', soft: '#e3d8ef', leaf: '#a08cbc', env: '#ebe2f3', env2: '#dbcde9', seal: '#6b4791' },
    terracotta: { name: 'Terracotta',         bg: '#faf5ef', paper: '#fffdfa', ink: '#2b2420', muted: '#85786d', accent: '#c0674a', soft: '#ecdfd2', leaf: '#9fae8f', env: '#f0e3d6', env2: '#e3d0bf', seal: '#c0674a' },
    mono:       { name: 'Black and white',    bg: '#ffffff', paper: '#f7f7f7', ink: '#141414', muted: '#767676', accent: '#141414', soft: '#e3e3e3', leaf: '#8c8c8c', env: '#efefef', env2: '#dcdcdc', seal: '#141414' }
  };
  const dotOf = p => `linear-gradient(135deg,${p.bg} 50%,${p.accent} 50%)`;

  /* ---------------- lettering ---------------- */
  // ff family, w weight, fs style, ls letter-spacing, tt text-transform, k size of names, k2 size of smaller headings
  const FONTSETS = {
    script: { ff: "'Great Vibes',cursive",         css: 'Great+Vibes',                        w: 400, fs: 'normal', ls: '0',     tt: 'none',      k: 1,   k2: 1 },
    decor:  { ff: "'Cinzel Decorative',serif",     css: 'Cinzel+Decorative:wght@400;700',     w: 700, fs: 'normal', ls: '.04em', tt: 'none',      k: .5,  k2: .62 },
    amiri:  { ff: "'Amiri',serif",                 css: 'Amiri:ital,wght@0,400;0,700;1,400',  w: 400, fs: 'italic', ls: '0',     tt: 'none',      k: .8,  k2: .82 },
    pinyon: { ff: "'Pinyon Script',cursive",       css: 'Pinyon+Script',                      w: 400, fs: 'normal', ls: '0',     tt: 'none',      k: .95, k2: .95 },
    serif:  { ff: "'Cormorant Garamond',serif",    css: '',                                   w: 500, fs: 'italic', ls: '0',     tt: 'none',      k: .78, k2: .82 },
    caps:   { ff: "'Cinzel',serif",                css: 'Cinzel:wght@400;500;600',            w: 500, fs: 'normal', ls: '.08em', tt: 'uppercase', k: .5,  k2: .6 },
    sans:   { ff: "'Jost',sans-serif",             css: 'Jost:wght@300;400;500;600',          w: 300, fs: 'normal', ls: '.16em', tt: 'uppercase', k: .42, k2: .55 }
  };
  const SERIF = "'Cormorant Garamond','Noto Serif Devanagari','Noto Serif Malayalam','Noto Serif Tamil','Noto Serif Telugu','Noto Serif Kannada','Noto Serif Bengali','Noto Serif Gujarati','Noto Serif Gurmukhi','Amiri',Georgia,serif";
  const BASE_FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@500;600&display=swap';
  // regional scripts in their own request so a hiccup here can never take the main fonts down; the browser only downloads the ones the text uses
  const SCRIPT_FONTS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Malayalam:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&family=Noto+Serif+Telugu:wght@400;600&family=Noto+Serif+Kannada:wght@400;600&family=Noto+Serif+Bengali:wght@400;600&family=Noto+Serif+Gujarati:wght@400;600&family=Noto+Serif+Gurmukhi:wght@400;600&family=Amiri:wght@400;700&display=swap';

  /* ---------------- artwork ---------------- */
  const svgUri = s => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const star = (cx, cy, R, r, n) => Array.from({ length: n * 2 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; return (cx + d * Math.cos(a)).toFixed(2) + ',' + (cy + d * Math.sin(a)).toFixed(2); }).join(' ');
  const ring = (n, r, rx, ry, rot0) => Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="${-r}" rx="${rx}" ry="${ry}" transform="rotate(${(rot0 || 0) + i * 360 / n})"/>`).join('');

  // classic: slender leaves; christian: round eucalyptus leaves
  const SPRIG = round => '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M6 8C60 20 110 62 150 130" /><g fill="currentColor" fill-opacity="' + (round ? '.3' : '.22') + '">' +
    (round ? [[26, 14, -50], [44, 24, 40], [50, 32, -40], [68, 42, 46], [74, 52, -34], [92, 66, 50], [98, 78, -28], [114, 92, 54], [120, 104, -22], [134, 118, 58], [146, 130, -15]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="8.5" ry="10.5" transform="rotate(${r} ${x} ${y}) translate(${r > 0 ? 9 : -9} 0)"/>`).join('') :
      [[30, 18, 20, -30], [52, 30, 22, -20], [72, 46, 22, -8], [92, 66, 22, 6], [110, 88, 22, 20], [128, 112, 20, 34], [26, 26, 16, 60], [50, 42, 18, 68], [72, 62, 18, 76], [94, 86, 18, 86], [116, 112, 16, 96]]
        .map(([x, y, l, r]) => `<ellipse cx="${x}" cy="${y}" rx="${l * .32}" ry="${l * .78}" transform="rotate(${r} ${x} ${y}) translate(0 -${l * .6})"/>`).join('')) + '</g></svg>';

  const HEART = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9-9.2C1.6 8 4 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3 0 5.4 3 4 6.8C19 16.5 12 21 12 21z"/></svg>';
  const LOTUS = '<svg viewBox="0 0 60 34" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round">' +
    [[-72, .8], [72, .8], [-36, .92], [36, .92], [0, 1]].map(([a, s]) => `<path transform="rotate(${a} 30 30) translate(30 30) scale(${s}) translate(-30 -30)" d="M30 30C24 22 24 10 30 3C36 10 36 22 30 30Z"/>`).join('') + '</svg>';
  const STAR8 = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="' + star(12, 12, 11.5, 7.6, 8) + '"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3V33M4 12H20"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/></svg>';
  const DIAMOND = '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L10 5L5 10L0 5Z"/></svg>';
  const CRESCENT = '<svg viewBox="0 0 40 40" fill="currentColor"><path d="M26.31 8.73A14 14 0 1 0 26.31 31.27A11.5 11.5 0 1 1 26.31 8.73Z"/><polygon points="' + star(31.5, 20, 5.2, 2.2, 5) + '"/></svg>';

  const mandala = () => '<svg viewBox="-100 -100 200 200" fill="none" stroke="currentColor" stroke-width=".7">' +
    '<circle r="97"/><circle r="93" stroke-dasharray="1.2 3.4"/>' +
    '<g fill="currentColor">' + Array.from({ length: 36 }, (_, i) => `<circle cx="0" cy="-88" r="2" transform="rotate(${i * 10})"/>`).join('') + '</g>' +
    '<g>' + ring(24, 74, 5.5, 15) + '</g><g fill="currentColor" fill-opacity=".1">' + ring(16, 52, 8.5, 20, 11.25) + '</g><g>' + ring(12, 32, 8, 17) + '</g>' +
    '<g fill="currentColor" fill-opacity=".16">' + ring(8, 14, 6, 11, 22.5) + '</g><circle r="6" fill="currentColor" fill-opacity=".3"/></svg>';

  const lantern = () => '<svg viewBox="0 0 60 150" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M30 0V32"/><circle cx="30" cy="35" r="3"/><path d="M16 47C16 40 44 40 44 47L40 55H20Z" fill="currentColor" fill-opacity=".28"/>' +
    '<path d="M20 55C8 71 8 97 20 113H40C52 97 52 71 40 55Z" fill="currentColor" fill-opacity=".1"/><path d="M30 55V113M25 55C17 75 17 93 25 113M35 55C43 75 43 93 35 113" opacity=".55"/>' +
    '<ellipse cx="30" cy="84" rx="5" ry="10" fill="#ffd27a" stroke="none" opacity=".85"/><path d="M20 113L24 123H36L40 113" fill="currentColor" fill-opacity=".28"/><path d="M30 123V136"/><circle cx="30" cy="140" r="3" fill="currentColor"/></svg>';

  /* marigold garland tile for the Hindu design (natural colours on purpose: marigolds are always orange) */
  const marigold = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#e98b16"/>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${(r * .62 * Math.cos(i * Math.PI / 4)).toFixed(1)}" cy="${(r * .62 * Math.sin(i * Math.PI / 4)).toFixed(1)}" r="${(r * .42).toFixed(1)}" fill="#f6a91d"/>`).join('') + `<circle r="${(r * .4).toFixed(1)}" fill="#fbc94a"/><circle r="${(r * .16).toFixed(1)}" fill="#b45a08"/></g>`;
  const leaf = (x, y, h) => `<path d="M${x} ${y}c-5 ${h * .3} -5 ${h * .7} 0 ${h}c5 -${h * .3} 5 -${h * .7} 0 -${h}z" fill="#3f7d3a"/>`;
  const garlandTile = () => {
    const strand = (x, y0, flowers, r, end) => `<path d="M${x} ${y0}V${end}" stroke="#3f7d3a" stroke-width="1.6"/>` + flowers.map(([y, k]) => marigold(x, y, r * k)).join('') + leaf(x, end - 2, 16);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 150"><path d="M0 8Q44 24 88 8" fill="none" stroke="#3f7d3a" stroke-width="2"/>' +
      strand(22, 14, [[28, 1], [42, .95], [56, .9]], 7, 64) + strand(66, 14, [[28, 1], [42, .95], [56, .9]], 7, 64) +
      strand(44, 20, [[40, 1], [58, 1], [76, .92], [94, .85]], 8, 108) + marigold(0, 8, 8) + marigold(88, 8, 8) + marigold(44, 20, 9.5) + '</svg>';
  };
  const starTile = color => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${color}" stroke-opacity=".2" stroke-width="1"><rect x="14" y="14" width="36" height="36"/><rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)"/><circle cx="32" cy="32" r="7"/><circle cx="0" cy="0" r="9"/><circle cx="64" cy="0" r="9"/><circle cx="0" cy="64" r="9"/><circle cx="64" cy="64" r="9"/></svg>`;

  // corner brackets for cards: kind is the little jewel in the corner
  const cornerVars = (color, kind) => {
    const jewel = { spark: `<path d="M13 8C12 11 10 13 8 13C10 13 12 15 13 18C14 15 16 13 18 13C16 13 14 11 13 8Z" fill="${color}"/>`, star8: `<polygon points="${star(13, 13, 5.5, 3.4, 8)}" fill="${color}"/>`, dot: `<circle cx="12" cy="12" r="2" fill="${color}"/>` }[kind] || '';
    const one = rot => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"><g transform="rotate(${rot} 20 20)"><path d="M3 26V6Q3 3 6 3H26"/><path d="M8 21V11Q8 8 11 8H21" opacity=".55"/>${jewel}</g></svg>`);
    return { '--cn1': one(0), '--cn2': one(90), '--cn3': one(270), '--cn4': one(180), '--cs': '34px' };
  };

  /* ---------------- the five designs ---------------- */
  const DESIGNS = {
    classic: { name: 'Classic floral', c: '#b8935a', palette: 'ivory', font: 'script', shape: 'arch', rad: 20, amp: 'and', cer: 'Ceremony', rec: 'Reception', env: 'You are invited', blessing: '',
      divider: HEART, seal: 'initials',
      art: () => `<div class="w-sprig tl">${SPRIG(false)}</div><div class="w-sprig br">${SPRIG(false)}</div>` },
    hindu: { name: 'Hindu', c: '#e6b85c', palette: 'maroon', font: 'decor', shape: 'circle', rad: 6, amp: '&', cer: 'Wedding Ceremony', rec: 'Reception', env: 'Shubh Vivah', blessing: '॥ श्री गणेशाय नमः ॥',
      divider: LOTUS, seal: 'om', corners: 'spark',
      vars: () => ({ '--garland': svgUri(garlandTile()) }),
      art: () => `<div class="w-garland"></div><div class="w-mandala">${mandala()}</div>` },
    muslim: { name: 'Muslim (Nikah)', c: '#d8b45f', palette: 'emerald', font: 'amiri', shape: 'ogee', rad: 4, amp: '&', cer: 'Nikah', rec: 'Walima', env: 'Assalamu Alaikum', blessing: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      divider: STAR8, seal: 'crescent', corners: 'star8', emblem: CRESCENT,
      vars: th => ({ '--pat': svgUri(starTile(th.accent)), '--ps': '64px 64px' }),
      art: () => '<div class="w-arc"><svg class="line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1 100V52C1 34 16 27 30 18C42 11 47 5 50 1C53 5 58 11 70 18C84 27 99 34 99 52V100"/><path class="b" d="M4 100V54C4 38 18 31 31 22C42 15 47 9 50 4C53 9 58 15 69 22C82 31 96 38 96 54V100"/></svg>' +
        `<div class="w-lantern a">${lantern()}</div><div class="w-lantern b">${lantern()}</div></div>` },
    christian: { name: 'Christian', c: '#6b8a62', palette: 'sage', font: 'pinyon', shape: 'gothic', rad: 10, amp: '&', cer: 'Holy Matrimony', rec: 'Reception', env: 'You are invited', blessing: '“Love is patient, love is kind.”  1 Corinthians 13:4',
      divider: CROSS, seal: 'cross', corners: 'dot', emblem: CROSS,
      art: () => `<div class="w-sprig tl">${SPRIG(true)}</div><div class="w-sprig br">${SPRIG(true)}</div><div class="w-sprig tr sm">${SPRIG(true)}</div><div class="w-sprig bl sm">${SPRIG(true)}</div>` },
    modern: { name: 'Modern minimal', c: '#c0674a', palette: 'terracotta', font: 'sans', shape: 'square', rad: 0, amp: '&', cer: 'Ceremony', rec: 'Reception', env: 'You are invited', blessing: '',
      divider: DIAMOND, seal: 'initials',
      art: () => '<div class="w-box"></div>' }
  };
  const SHAPE_CLIP = { arch: 'M0,1V.4C0,.18 .22,0 .5,0S1,.18 1,.4V1Z', gothic: 'M0,1V.5C0,.3 .3,.14 .5,0C.7,.14 1,.3 1,.5V1Z', ogee: 'M0,1V.52C0,.34 .16,.27 .3,.18C.42,.11 .47,.05 .5,0C.53,.05 .58,.11 .7,.18C.84,.27 1,.34 1,.52V1Z' };
  const CLIPS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + Object.entries(SHAPE_CLIP).map(([k, d]) => `<clipPath id="wc-${k}" clipPathUnits="objectBoundingBox"><path d="${d}"/></clipPath>`).join('') + '</defs></svg>';

  /* ---------------- resolve palette + the user's own colours ---------------- */
  function resolveTheme(d, D) {
    D = D || DESIGNS[d.design] || DESIGNS.classic;
    const asked = d.palette && d.palette !== 'auto' ? d.palette : d.theme; // `theme` is what older pages saved
    const th = Object.assign({}, PALETTES[asked] || PALETTES[D.palette]);
    const own = { accent: d.c_accent, bg: d.c_bg, paper: d.c_paper, ink: d.c_ink, leaf: d.c_leaf, seal: d.c_seal };
    Object.keys(own).forEach(k => { if (!rgb(own[k])) delete own[k]; });
    Object.assign(th, own);
    if (own.ink || own.bg) th.muted = mix(th.ink, th.bg, .42);
    if (own.accent || own.bg) { th.soft = mix(th.bg, th.accent, .24); th.env = mix(th.bg, th.accent, .14); th.env2 = mix(th.bg, th.accent, .26); }
    if (!own.seal && own.accent) th.seal = mix(th.accent, '#000000', .22);
    th.sealink = onColor(th.seal); th.onacc = onColor(th.accent); th.dark = lum(th.bg) < .22;
    return th;
  }

  /* ---------------- styles ---------------- */
  const CSS = `
  .tpl-wedding{background:var(--bg);color:var(--ink);min-height:100vh;overflow-x:hidden;font-family:var(--serif)}
  .tpl-wedding *{box-sizing:border-box}
  .tpl-wedding a{color:inherit}
  .w-wrap{width:min(920px,100%);margin:0 auto;padding:0 22px}
  .w-sec{padding:clamp(48px,9vw,96px) 0;position:relative}
  .w-eyebrow{font:500 11.5px var(--sans);letter-spacing:.34em;text-transform:uppercase;color:var(--accent);text-align:center;margin:0 0 14px}
  .w-h2{font:italic 400 clamp(30px,6vw,46px)/1.1 var(--serif);text-align:center;margin:0 0 10px}
  .w-div{display:flex;align-items:center;justify-content:center;gap:14px;color:var(--accent);margin:18px auto;max-width:280px}
  .w-div::before,.w-div::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--accent))}
  .w-div::after{transform:scaleX(-1)}
  .w-div svg{width:18px;height:18px;flex:none}
  .w-reveal{opacity:0;transform:translateY(22px);transition:opacity 1s ease,transform 1s ease}
  .w-reveal.in{opacity:1;transform:none}
  .is-static .w-reveal{opacity:1;transform:none;transition:none}

  /* hero */
  .w-hero{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:70px 22px 90px;position:relative;overflow:hidden;
    background-image:var(--pat,none),radial-gradient(70% 50% at 50% 0%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 70%);background-size:var(--ps,auto),auto}
  .w-hero>*:not(.w-art):not(.w-scroll){position:relative;z-index:1}
  .w-art{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .w-sprig{position:absolute;width:min(46vw,300px);color:var(--leaf);opacity:.55;pointer-events:none}
  .w-sprig.tl{top:-6px;left:-10px}.w-sprig.br{bottom:-6px;right:-10px;transform:rotate(180deg)}
  .w-sprig.tr{top:-6px;right:-10px;transform:scaleX(-1)}.w-sprig.bl{bottom:-6px;left:-10px;transform:scale(-1,-1)}
  .w-sprig.sm{width:min(30vw,190px);opacity:.4}
  .w-bless{font:italic 400 clamp(16px,3.4vw,21px)/1.6 var(--serif);color:var(--accent);margin:0 0 20px;max-width:520px}
  .w-emb{width:46px;color:var(--accent);margin:0 0 16px;display:block}.w-emb svg{display:block;width:100%;height:auto}

  /* photo frame: three stacked shapes give an outline, a gap, then the picture */
  .w-frame{position:relative;width:min(56vw,250px);aspect-ratio:var(--ar,3/4);margin:0 auto 34px;background:var(--accent);clip-path:var(--clip,none)}
  .w-frame i{position:absolute;inset:1.5px;display:block;background:var(--bg);clip-path:var(--clip,none)}
  .w-frame i i{inset:5px;background:var(--soft) center/cover no-repeat}
  .sh-arch{--clip:url(#wc-arch)}.sh-gothic{--clip:url(#wc-gothic)}.sh-ogee{--clip:url(#wc-ogee)}
  .sh-oval{--clip:ellipse(50% 50% at 50% 50%);--ar:4/5}.sh-circle{--clip:circle(50% at 50% 50%);--ar:1}.sh-square{--clip:inset(0 round 3px);--ar:1}

  .w-top{font:500 11px var(--sans);letter-spacing:.38em;text-transform:uppercase;color:var(--muted);margin:0 0 6px;max-width:420px;line-height:1.9}
  .w-names{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(clamp(58px,15vw,118px)*var(--k));line-height:1.08;color:var(--accent);margin:8px 0 2px;display:flex;flex-direction:column;align-items:center;max-width:100%;overflow-wrap:anywhere}
  .w-names .amp{font:italic 400 clamp(24px,4.6vw,36px)/1 var(--serif);letter-spacing:0;text-transform:none;color:var(--muted);margin:10px 0 4px}
  .w-names .ab{font:italic 400 clamp(15px,2.9vw,18px)/1.4 var(--serif);letter-spacing:0;text-transform:none;color:var(--muted);margin:8px 0 0;max-width:440px}
  .w-married{font:italic 400 clamp(18px,3.4vw,24px) var(--serif);color:var(--muted);margin:10px 0 22px}
  .w-date{font:500 clamp(12px,2.6vw,15px) var(--sans);letter-spacing:.34em;text-transform:uppercase;border-top:1px solid var(--accent);border-bottom:1px solid var(--accent);padding:13px 22px;display:inline-block}
  .w-place{font:italic 400 19px var(--serif);color:var(--muted);margin-top:16px}
  .w-scroll{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font:500 10px var(--sans);letter-spacing:.3em;text-transform:uppercase;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1}
  .w-scroll i{width:1px;height:34px;background:linear-gradient(var(--accent),transparent);animation:wdrop 2s ease-in-out infinite}
  @keyframes wdrop{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
  .is-static .w-scroll i{animation:none}
  .w-hero .w-in{opacity:0;transform:translateY(18px);animation:win 1.2s ease forwards}
  @keyframes win{to{opacity:1;transform:none}}
  .is-static .w-hero .w-in{animation:none;opacity:1;transform:none}

  /* intro text */
  .w-intro{font:italic 400 clamp(20px,3.6vw,27px)/1.6 var(--serif);text-align:center;max-width:640px;margin:0 auto;color:var(--ink);white-space:pre-line}
  .w-verse{font:italic 400 clamp(17px,3vw,21px)/1.7 var(--serif);text-align:center;max-width:520px;margin:22px auto 0;color:var(--muted);white-space:pre-line}

  /* countdown */
  .w-count{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,2vw,16px);max-width:520px;margin:26px auto 0}
  .w-count div{background:var(--paper);border:1px solid var(--soft);border-radius:max(0px,calc(var(--rad) - 6px));padding:clamp(12px,3vw,20px) 4px;text-align:center}
  .w-count b{display:block;font:500 clamp(28px,7vw,44px)/1 var(--serif);color:var(--accent)}
  .w-count span{font:500 9.5px var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
  .w-big{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(clamp(30px,7vw,48px)*var(--k2));color:var(--accent);text-align:center;margin-top:20px}

  /* events */
  .w-events{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:22px;margin-top:30px}
  .w-card{background:var(--paper);border:1px solid var(--soft);border-radius:var(--rad);padding:clamp(24px,4vw,34px);text-align:center;position:relative;box-shadow:0 14px 40px var(--shadow)}
  .w-card::before,.w-rsvp::before{content:'';position:absolute;inset:8px;border:1px solid var(--soft);border-radius:max(0px,calc(var(--rad) - 6px));pointer-events:none}
  .w-card::after,.w-rsvp::after{content:'';position:absolute;inset:6px;pointer-events:none;background-image:var(--cn1,none),var(--cn2,none),var(--cn3,none),var(--cn4,none);background-repeat:no-repeat;background-size:var(--cs,34px);background-position:left top,right top,left bottom,right bottom}
  .w-card h3{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(34px*var(--k2));color:var(--accent);margin:0 0 6px;line-height:1.2}
  .w-card .when{font:500 12px var(--sans);letter-spacing:.2em;text-transform:uppercase;margin:8px 0 2px}
  .w-card .day{font:italic 400 18px var(--serif);color:var(--muted);margin:0 0 14px}
  .w-card .venue{font:600 21px var(--serif);margin:0}
  .w-card .addr{font:400 16.5px/1.5 var(--serif);color:var(--muted);margin:4px 0 0}
  .w-card .note{font:italic 400 17px/1.5 var(--serif);margin:14px 0 0;color:var(--ink)}
  .w-map{margin-top:16px;border-radius:max(0px,calc(var(--rad) - 8px));overflow:hidden;border:1px solid var(--soft);height:190px}.w-map iframe{width:100%;height:100%;border:0;filter:saturate(.85)}
  .w-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px}
  .w-btn{appearance:none;cursor:pointer;text-decoration:none;font:600 11px var(--sans);letter-spacing:.2em;text-transform:uppercase;padding:12px 18px;border-radius:var(--btn);border:1px solid var(--accent);color:var(--accent);background:transparent;transition:all .2s}
  .w-btn:hover{background:var(--accent);color:var(--onacc)}
  .w-btn.solid{background:var(--accent);color:var(--onacc)}.w-btn.solid:hover{filter:brightness(1.08)}

  /* schedule */
  .w-time{max-width:560px;margin:34px auto 0;position:relative;padding-left:0}
  .w-time::before{content:'';position:absolute;left:50%;top:6px;bottom:6px;width:1px;background:var(--soft)}
  .w-ti{display:grid;grid-template-columns:1fr 26px 1fr;gap:12px;align-items:start;margin-bottom:26px}
  .w-ti .t{text-align:right;font:600 13px var(--sans);letter-spacing:.14em;color:var(--accent);padding-top:3px}
  .w-ti .w-dot{width:11px;height:11px;border-radius:50%;background:var(--bg);border:2px solid var(--accent);margin:6px auto 0;position:relative;z-index:1}
  .w-ti .x b{display:block;font:600 20px var(--serif)}.w-ti .x span{font:italic 400 16.5px/1.4 var(--serif);color:var(--muted)}
  .w-ti:nth-child(even) .t{order:3;text-align:left}.w-ti:nth-child(even) .x{order:1;text-align:right}.w-ti:nth-child(even) .w-dot{order:2}

  /* story + gallery */
  .w-story{display:grid;grid-template-columns:1fr;gap:30px;align-items:center}
  .w-story.has-photo{grid-template-columns:1fr 1fr}
  @media(max-width:700px){.w-story.has-photo{grid-template-columns:1fr}}
  .w-story p{font:400 clamp(18px,3vw,21px)/1.75 var(--serif);margin:0 0 1em;white-space:pre-line}
  .w-story .w-frame{width:100%;max-width:340px;margin:0 auto}
  .w-story .sh-arch,.w-story .sh-gothic,.w-story .sh-ogee{--ar:4/5}
  .w-gal{columns:3 200px;column-gap:12px;margin-top:30px}
  .w-gal figure{margin:0 0 12px;break-inside:avoid;cursor:zoom-in;position:relative;overflow:hidden;border-radius:max(0px,calc(var(--rad) - 10px));background:var(--soft)}
  .w-gal img{width:100%;display:block;transition:transform .5s}.w-gal figure:hover img{transform:scale(1.04)}
  .w-gal figcaption{font:italic 400 15px var(--serif);padding:8px 10px;color:var(--muted);background:var(--paper)}
  .w-lb{position:fixed;inset:0;z-index:80;background:rgba(10,8,6,.9);display:grid;place-items:center;padding:20px;animation:win .25s ease}
  .w-lb figure{margin:0;max-width:min(94vw,900px);text-align:center}.w-lb img{max-width:100%;max-height:80vh;border-radius:8px}
  .w-lb figcaption{color:#eee;font:italic 400 19px var(--serif);margin-top:12px}
  .w-lb button{position:absolute;appearance:none;border:0;background:rgba(255,255,255,.14);color:#fff;width:46px;height:46px;border-radius:50%;font-size:22px;cursor:pointer}
  .w-lb .x{top:16px;right:16px}.w-lb .p{left:14px;top:50%}.w-lb .n{right:14px;top:50%}

  /* info + rsvp */
  .w-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:16px;margin-top:28px}
  .w-info div{background:var(--paper);border:1px solid var(--soft);border-radius:max(0px,calc(var(--rad) - 4px));padding:22px}
  .w-info b{display:block;font:italic 500 23px var(--serif);color:var(--accent);margin-bottom:6px}
  .w-info p{margin:0;font:400 17px/1.6 var(--serif);white-space:pre-line}
  .w-rsvp{background:var(--paper);border:1px solid var(--soft);border-radius:calc(var(--rad) + 4px);padding:clamp(28px,6vw,52px);text-align:center;max-width:620px;margin:0 auto;position:relative}
  .w-rsvp p{font:italic 400 20px/1.6 var(--serif);margin:0 0 6px}
  .w-by{font:600 12px var(--sans)!important;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-style:normal!important;margin:10px 0 18px!important}
  .w-close{text-align:center;padding:60px 22px 90px}
  .w-close .sign{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(clamp(34px,8vw,58px)*var(--k2));line-height:1.2;color:var(--accent);margin:0}
  .w-close .tag{font:500 12px var(--sans);letter-spacing:.3em;text-transform:uppercase;color:var(--muted);margin-top:14px}

  /* envelope */
  .w-env{position:fixed;inset:0;z-index:60;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;padding:22px;transition:opacity 1s ease,visibility 1s}
  .w-env.gone{opacity:0;visibility:hidden}
  .w-env .hint{font:500 11px var(--sans);letter-spacing:.32em;text-transform:uppercase;color:var(--muted);text-align:center;min-height:16px}
  .w-env h1{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(clamp(30px,8vw,46px)*var(--k2));color:var(--accent);margin:0;text-align:center;line-height:1.2}
  .env{width:min(88vw,430px);aspect-ratio:1.5;position:relative;perspective:1100px}
  .env>*{position:absolute}
  .env-back{inset:0;background:var(--env2);border-radius:calc(var(--rad)/3);box-shadow:0 22px 40px var(--shadow)}
  .env-back{z-index:1}
  .env-card{left:7%;right:7%;top:9%;bottom:9%;background:var(--paper);border-radius:calc(var(--rad)/5);z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;transition:transform 1.1s cubic-bezier(.3,.7,.2,1) .55s;border:1px solid var(--soft);padding:0 8px;will-change:transform}
  .env-card b{font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);letter-spacing:var(--sc-ls);text-transform:var(--sc-tt);font-size:calc(clamp(24px,7vw,36px)*var(--k2));line-height:1.1;color:var(--accent)}.env-card span{font:500 8.5px var(--sans);letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
  .env-front{inset:0;z-index:4;background:var(--env);clip-path:polygon(0 0,50% 54%,100% 0,100% 100%,0 100%);border-radius:calc(var(--rad)/3)}
  .env-flap{left:0;right:0;top:0;height:56%;background:var(--env);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;z-index:5;transition:transform .9s ease,z-index 0s .45s;backface-visibility:visible;will-change:transform}
  .env-flap::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,.03)}
  .seal{left:50%;top:54%;width:clamp(58px,15vw,74px);aspect-ratio:1;margin:calc(clamp(58px,15vw,74px)/-2) 0 0 calc(clamp(58px,15vw,74px)/-2);border-radius:50%;z-index:6;cursor:pointer;appearance:none;border:0;padding:0;
    background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--seal) 70%,#fff),var(--seal) 55%,color-mix(in srgb,var(--seal) 70%,#000));box-shadow:0 3px 8px rgba(0,0,0,.35),inset 0 0 0 3px color-mix(in srgb,var(--seal) 80%,#000);color:var(--sealink);font-family:var(--sc);font-weight:var(--sc-w);font-style:var(--sc-fs);font-size:calc(clamp(22px,6vw,30px)*var(--k2));display:grid;place-items:center;transition:transform .3s,opacity .5s;animation:wpulse 2.2s ease-in-out infinite}
  .seal svg{width:50%;height:auto;display:block}
  @keyframes wpulse{50%{transform:scale(1.07)}}
  .env.open .env-flap{transform:rotateX(180deg);z-index:2}
  .env.open .env-card{transform:translateY(-62%)}
  .env.open .seal{opacity:0;transform:scale(.5);animation:none;pointer-events:none}

  /* ---------- Hindu ---------- */
  .d-hindu .w-hero{padding-top:150px}
  .d-hindu .w-garland{position:absolute;top:0;left:0;right:0;height:134px;background:var(--garland) repeat-x center top/88px auto}
  .d-hindu .w-mandala{position:absolute;left:50%;top:50%;width:min(150vw,900px);aspect-ratio:1;transform:translate(-50%,-50%);color:var(--accent);opacity:.16}
  .d-hindu .w-mandala svg{display:block;width:100%;height:100%;animation:wspin 240s linear infinite}
  @keyframes wspin{to{transform:rotate(360deg)}}
  .d-hindu .w-bless{font-style:normal;letter-spacing:.06em;font-size:clamp(18px,4vw,24px)}
  .d-hindu .w-h2{font-style:normal;letter-spacing:.03em}
  .d-hindu .w-top{color:var(--accent)}

  /* ---------- Muslim ---------- */
  .d-muslim .w-hero{padding-top:160px;padding-bottom:110px}
  .d-muslim .w-arc{position:absolute;left:50%;top:22px;bottom:0;width:min(calc(100% - 26px),580px);transform:translateX(-50%);color:var(--accent)}
  .d-muslim .w-arc svg.line{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  .d-muslim .w-arc svg.line path{fill:none;stroke:currentColor;stroke-width:1.4;vector-effect:non-scaling-stroke}
  .d-muslim .w-arc svg.line path.b{opacity:.45}
  .d-muslim .w-lantern{position:absolute;top:-22px;transform-origin:50% 0;animation:wsway 5.5s ease-in-out infinite alternate;will-change:transform}
  .d-muslim .w-lantern svg{display:block;width:100%;height:auto;filter:drop-shadow(0 0 9px color-mix(in srgb,var(--accent) 65%,transparent))}
  .d-muslim .w-lantern.a{left:2px;width:46px}.d-muslim .w-lantern.b{right:2px;width:36px;animation-delay:-2.4s}
  @keyframes wsway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
  .d-muslim .w-bless{font:400 clamp(24px,6.2vw,36px)/1.7 'Amiri','Noto Serif Devanagari',serif;font-style:normal;color:var(--accent)}
  .d-muslim .w-h2{font-family:'Amiri',var(--serif);font-weight:400}

  /* ---------- Christian ---------- */
  .d-christian .w-emb{width:22px;margin-bottom:18px}
  .d-christian .w-div svg{width:12px;height:19px}
  .d-christian .w-bless{font-size:clamp(17px,3.6vw,22px)}

  /* ---------- Modern ---------- */
  .d-modern{--btn:0px}
  .d-modern .w-box{position:absolute;inset:18px;border:1px solid color-mix(in srgb,var(--ink) 28%,transparent)}
  .d-modern .w-hero{background-image:radial-gradient(70% 50% at 50% 0%,color-mix(in srgb,var(--accent) 9%,transparent),transparent 70%)}
  .d-modern .w-h2{font:300 clamp(24px,4.6vw,34px)/1.2 var(--sans);letter-spacing:.14em;text-transform:uppercase}
  .d-modern .w-div svg{width:8px;height:8px}
  .d-modern .w-div{gap:10px;max-width:120px}
  .d-modern .w-date{border-color:var(--ink)}
  .d-modern .w-top,.d-modern .w-eyebrow{font-family:var(--sans)}
  .d-modern .w-btn{font-family:var(--sans)}

  .is-static .w-mandala svg,.is-static .w-lantern{animation:none}
  @media(prefers-reduced-motion:reduce){.w-reveal,.w-hero .w-in{transition:none;animation:none;opacity:1;transform:none}.seal,.w-scroll i,.w-mandala svg,.w-lantern{animation:none}}
  `;

  const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const cssUrl = s => 'url("' + String(s).replace(/["\\\n\r]/g, c => encodeURIComponent(c)) + '")';

  /* ---------------- editor form (shared by all five) ---------------- */
  const COLOUR_KEYS = ['c_accent', 'c_bg', 'c_paper', 'c_ink', 'c_leaf', 'c_seal'];
  const eff = k => d => resolveTheme(d)[k];
  const designOptions = Object.entries(DESIGNS).map(([v, D]) => ({ v, l: D.name, c: D.c }));
  const paletteOptions = [{ v: 'auto', l: "The design's own" }].concat(Object.entries(PALETTES).map(([v, p]) => ({ v, l: p.name, c: dotOf(p) })));

  const SCHEMA = [
    { id: 'look', title: 'Design and colours', open: true, fields: [
      { key: 'design', type: 'choice', label: 'Design', options: designOptions, resets: COLOUR_KEYS, help: 'You can change this at any time. Your words and photos stay.' },
      { key: 'palette', type: 'choice', label: 'Colour palette', options: paletteOptions, resets: COLOUR_KEYS, help: 'Want a shade of your own? Open "Your own colours" below.' },
      { key: 'nameFont', type: 'choice', label: 'Lettering', options: [{ v: 'design', l: "The design's own" }, { v: 'script', l: 'Flowing script' }, { v: 'serif', l: 'Elegant serif' }, { v: 'caps', l: 'Classic capitals' }, { v: 'sans', l: 'Clean modern' }] },
      { key: 'shape', type: 'choice', label: 'Photo shape', options: [{ v: 'design', l: "The design's own" }, { v: 'arch', l: 'Round arch' }, { v: 'gothic', l: 'Pointed arch' }, { v: 'ogee', l: 'Ogee arch' }, { v: 'oval', l: 'Oval' }, { v: 'circle', l: 'Circle' }, { v: 'square', l: 'Square' }] },
      { key: 'showOrn', type: 'toggle', label: 'Show the decorative artwork', help: 'Florals, garlands, lanterns, patterns. Turn off for a plainer page.' },
      { key: 'envelope', type: 'toggle', label: 'Start with a closing envelope', help: 'Guests tap the seal to open it. This is also when the music begins.' },
      { key: 'sealStyle', type: 'choice', label: 'Seal on the envelope', options: [{ v: 'design', l: "The design's symbol" }, { v: 'initials', l: 'Our initials' }], show: d => d.envelope }
    ] },
    { id: 'colours', title: 'Your own colours', fields: [
      { key: 'c_accent', type: 'color', label: 'Main colour (names, lines, buttons)', default: eff('accent') },
      { key: 'c_bg', type: 'color', label: 'Page background', default: eff('bg') },
      { key: 'c_paper', type: 'color', label: 'Cards', default: eff('paper') },
      { key: 'c_ink', type: 'color', label: 'Text', default: eff('ink') },
      { key: 'c_leaf', type: 'color', label: 'Leaves and decorations', default: eff('leaf') },
      { key: 'c_seal', type: 'color', label: 'Envelope seal', default: eff('seal') },
      { type: 'reset', label: 'Back to the palette colours', keys: COLOUR_KEYS }
    ] },
    { id: 'couple', title: 'The couple', open: true, fields: [
      { key: 'name1', type: 'text', label: 'First name', max: 30 },
      { key: 'about1', type: 'text', label: 'About them (optional)', max: 90, placeholder: 'e.g. Son of Mr. and Mrs. Kumar' },
      { key: 'name2', type: 'text', label: 'Second name', max: 30 },
      { key: 'about2', type: 'text', label: 'About them (optional)', max: 90, placeholder: 'e.g. Daughter of Mr. and Mrs. Nair' },
      { key: 'blessingOn', type: 'toggle', label: 'Blessing line at the very top', help: 'Each design has its own traditional words. Type yours below to replace them.' },
      { key: 'blessing', type: 'text', label: 'Blessing words', max: 90, placeholder: "Leave empty for the design's own words", show: d => d.blessingOn },
      { key: 'top', type: 'text', label: 'Line above the names', max: 90, placeholder: 'e.g. Together with their families' },
      { key: 'tagline', type: 'text', label: 'Line under the names', max: 60, placeholder: 'are getting married' },
      { key: 'intro', type: 'textarea', label: 'Invitation words', rows: 3, help: 'Shown in italics below the cover.' },
      { key: 'verse', type: 'textarea', label: 'A verse or quote (optional)', rows: 2, help: 'A short prayer, verse or line of poetry. Any language works.' },
      { key: 'date', type: 'date', label: 'Wedding date' },
      { key: 'heroPhoto', type: 'image', label: 'Cover photo (optional)', help: 'Shown in a frame above your names.' }
    ] },
    { id: 'ceremony', title: 'Main ceremony', fields: [
      { key: 'cerTitle', type: 'text', label: 'Name of the ceremony', max: 40, placeholder: 'e.g. Muhurtham, Nikah, Holy Matrimony', help: "Leave empty to use the design's usual name." },
      { key: 'cerTime', type: 'time', label: 'Time' },
      { key: 'cerPlace', type: 'place', label: 'Where' },
      { key: 'cerNote', type: 'textarea', label: 'A note (optional)', rows: 2, placeholder: 'e.g. Doors open at 3pm' }
    ] },
    { id: 'reception', title: 'Reception or feast', fields: [
      { key: 'recOn', type: 'toggle', label: 'Include a second event' },
      { key: 'recTitle', type: 'text', label: 'Name of the event', max: 40, placeholder: 'e.g. Reception, Walima, Feast', show: d => d.recOn },
      { key: 'recTime', type: 'time', label: 'Time', show: d => d.recOn },
      { key: 'recPlace', type: 'place', label: 'Where', show: d => d.recOn },
      { key: 'recNote', type: 'textarea', label: 'A note (optional)', rows: 2, show: d => d.recOn },
      { key: 'showMap', type: 'toggle', label: 'Show small maps on the cards', help: 'Uses the address you typed. Turn off if the venue is hard to find on a map.' }
    ] },
    { id: 'extra', title: 'More events', fields: [
      { key: 'extra', type: 'repeater', label: '', max: 8, addLabel: 'Add an event', itemLabel: 'Event', title: i => [i.title, i.time].filter(Boolean).join('  ·  '), blank: { title: '', date: '', time: '', place: { name: '', address: '', url: '' }, note: '' },
        help: 'Mehndi, Haldi, Sangeet, engagement, rehearsal dinner... Each gets its own card, in date order. Leave the date empty to use the wedding day.',
        fields: [{ key: 'title', type: 'text', label: 'Name of the event', max: 40 }, { key: 'date', type: 'date', label: 'Date (optional)' }, { key: 'time', type: 'time', label: 'Time' }, { key: 'place', type: 'place', label: 'Where' }, { key: 'note', type: 'text', label: 'Small note (optional)', max: 120 }] }
    ] },
    { id: 'schedule', title: 'Schedule of the day', fields: [
      { key: 'schedule', type: 'repeater', label: '', max: 14, addLabel: 'Add a moment', itemLabel: 'Moment', title: i => [i.time, i.title].filter(Boolean).join('  ·  '), blank: { time: '', title: '', note: '' },
        fields: [{ key: 'time', type: 'time', label: 'Time' }, { key: 'title', type: 'text', label: 'What happens', max: 60 }, { key: 'note', type: 'text', label: 'Small note (optional)', max: 120 }] }
    ] },
    { id: 'story', title: 'Our story', fields: [
      { key: 'story', type: 'textarea', label: 'How it began', rows: 6, help: 'Optional. Leave empty to hide this section.' },
      { key: 'storyPhoto', type: 'image', label: 'Photo for the story' }
    ] },
    { id: 'photos', title: 'Photo gallery', fields: [
      { key: 'gallery', type: 'repeater', label: '', max: 12, addLabel: 'Add a photo', itemLabel: 'Photo', title: i => i.caption, blank: { img: '', caption: '' },
        fields: [{ key: 'img', type: 'image', label: 'Photo' }, { key: 'caption', type: 'text', label: 'Caption (optional)', max: 80 }] }
    ] },
    { id: 'info', title: 'Good to know', fields: [
      { key: 'info', type: 'repeater', label: '', max: 8, addLabel: 'Add a detail', itemLabel: 'Detail', title: i => i.title, blank: { title: '', text: '' },
        help: 'Dress code, gifts, hotels, parking, children, dietary needs...',
        fields: [{ key: 'title', type: 'text', label: 'Heading', max: 40 }, { key: 'text', type: 'textarea', label: 'Details', rows: 3 }] }
    ] },
    { id: 'rsvp', title: 'RSVP', fields: [
      { key: 'rsvpOn', type: 'toggle', label: 'Ask guests to reply' },
      { key: 'rsvpNote', type: 'text', label: 'Message', max: 140, show: d => d.rsvpOn },
      { key: 'rsvpBy', type: 'date', label: 'Reply by', show: d => d.rsvpOn },
      { key: 'rsvpMethod', type: 'choice', label: 'How should they reply?', options: [{ v: 'whatsapp', l: 'WhatsApp' }, { v: 'sms', l: 'Text message' }, { v: 'email', l: 'Email' }, { v: 'link', l: 'A web link' }], show: d => d.rsvpOn },
      { key: 'rsvpContact', type: 'text', label: 'Phone number, email or link', max: 120, placeholder: 'e.g. +44 7700 900123', show: d => d.rsvpOn, help: 'For WhatsApp use the full number with country code.' },
      { key: 'rsvpLabel', type: 'text', label: 'Button text', max: 24, show: d => d.rsvpOn }
    ] },
    { id: 'extras', title: 'Final touches', fields: [
      { key: 'showCountdown', type: 'toggle', label: 'Show a countdown to the day' },
      { key: 'closing', type: 'text', label: 'Closing words', max: 120 },
      { key: 'hashtag', type: 'text', label: 'Wedding hashtag (optional)', max: 40, placeholder: '#AmeliaAndJames' },
      { key: 'envTitle', type: 'text', label: 'Words on the envelope screen', max: 40, placeholder: "Leave empty for the design's own words", show: d => d.envelope }
    ] }
  ];

  /* ---------------- rendering ---------------- */
  function make(spec) {
    const own = spec.design;
    return {
      id: spec.id, group: 'Wedding invitations', name: spec.name, tagline: spec.tagline, for: spec.for,
      title: d => (d.name1 || d.name2 ? [d.name1, d.name2].filter(Boolean).join(' & ') + ' are getting married' : 'You are invited'),
      defaultMusic: { type: 'library', id: 'g1' },
      sample: spec.sample, schema: SCHEMA, thumb: spec.thumb,
      migrate(d) { if (d.theme) { if (PALETTES[d.theme] && (!d.palette || d.palette === 'auto')) d.palette = d.theme; delete d.theme; } },

      mount(root, data, ctx) {
        const D = DESIGNS[data.design] || DESIGNS[own], th = resolveTheme(data, D);
        const preview = !!ctx.preview;
        const fk = data.nameFont !== 'design' && FONTSETS[data.nameFont] ? data.nameFont : D.font, fs = FONTSETS[fk];
        const shape = ['arch', 'gothic', 'ogee', 'oval', 'circle', 'square'].includes(data.shape) ? data.shape : D.shape;
        const showArt = data.showOrn !== false;

        u.font(BASE_FONTS); u.font(SCRIPT_FONTS);
        if (fs.css) u.font('https://fonts.googleapis.com/css2?family=' + fs.css + '&display=swap');
        const style = u.el('style', {}, CSS); document.head.append(style);
        const prevBg = document.body.style.background, prevOv = document.body.style.overflow;
        document.body.style.background = th.bg;
        root.className = 'tpl-wedding d-' + (DESIGNS[data.design] ? data.design : own) + (preview ? ' is-static' : '');
        const usesJost = fk === 'sans' || D === DESIGNS.modern; // Jost also carries the small labels in the modern design
        if (usesJost) u.font('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap');
        const vars = {
          bg: th.bg, paper: th.paper, ink: th.ink, muted: th.muted, accent: th.accent, soft: th.soft, leaf: th.leaf, env: th.env, env2: th.env2, seal: th.seal, sealink: th.sealink, onacc: th.onacc,
          shadow: th.dark ? 'rgba(0,0,0,.35)' : `color-mix(in srgb,${th.ink} 8%,transparent)`,
          serif: SERIF, sans: D === DESIGNS.modern ? "'Jost',system-ui,sans-serif" : "'Montserrat',system-ui,sans-serif",
          sc: fs.ff, 'sc-w': fs.w, 'sc-fs': fs.fs, 'sc-ls': fs.ls, 'sc-tt': fs.tt, k: fs.k, k2: fs.k2, rad: D.rad + 'px', btn: D.rad === 0 ? '0px' : '999px'
        };
        // patterns and garlands belong to the artwork; the card corners stay even when the artwork is off
        Object.entries(Object.assign({}, showArt && D.vars ? D.vars(th) : {}, D.corners ? cornerVars(th.accent, D.corners) : {})).forEach(([k, v]) => { vars[k.replace(/^--/, '')] = v; });
        root.style.cssText = Object.entries(vars).map(([k, v]) => `--${k}:${v}`).join(';');

        const n1 = (data.name1 || '').trim(), n2 = (data.name2 || '').trim();
        const names = n1 && n2 ? [n1, n2] : [n1 || n2 || 'Your names'];
        const date = data.date || '', when = u.parseDate(date, data.cerTime);
        const shortDate = date ? u.fmtDate(date, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const initials = (n1[0] || '') + (n2 ? '&' + n2[0] : '');
        const hasPlace = p => p && (p.name || p.address);
        const mapsBtn = p => { const url = u.mapsUrl(p); return url ? `<a class="w-btn" href="${esc(url)}" target="_blank" rel="noopener">Get directions</a>` : ''; };
        const divider = () => `<div class="w-div">${D.divider}</div>`;
        const frame = (photo, cls, extra) => `<div class="w-frame sh-${shape} ${cls || ''}" ${extra || ''}><i><i style="background-image:${esc(cssUrl(photo))}"></i></i></div>`;

        function eventCard(ev) {
          const dt = ev.date || date, ics = dt ? u.ics({ title: names.join(' & ') + ' ' + ev.title, date: dt, time: ev.time, place: ev.place, note: ev.note }) : '';
          const embed = data.showMap && hasPlace(ev.place) ? u.mapsEmbed(ev.place) : '', day = u.fmtDate(dt);
          return `<div class="w-card w-reveal"><h3>${esc(ev.title)}</h3>
            ${ev.time ? `<p class="when">${esc(u.fmtTime(ev.time))}</p>` : ''}${day ? `<p class="day">${esc(day)}</p>` : ''}
            ${hasPlace(ev.place) ? `<p class="venue">${esc(ev.place.name || '')}</p><p class="addr">${esc(ev.place.address || '')}</p>` : ''}
            ${ev.note ? `<p class="note">${esc(ev.note)}</p>` : ''}
            ${embed ? `<div class="w-map"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(embed)}" title="Map"></iframe></div>` : ''}
            <div class="w-btns">${mapsBtn(ev.place)}${ics ? `<a class="w-btn" href="${ics}" download="${esc(String(ev.title).toLowerCase().replace(/\W+/g, '-') || 'event')}.ics">Add to calendar</a>` : ''}</div></div>`;
        }

        const sections = [];
        /* hero */
        const bless = data.blessingOn !== false ? (data.blessing || '').trim() || D.blessing : '';
        const heroTop = (data.top || '').trim();
        sections.push(`<header class="w-hero">
          ${showArt ? `<div class="w-art">${D.art()}</div>` : ''}
          ${bless ? `<p class="w-bless w-in" dir="auto" style="animation-delay:.05s">${esc(bless)}</p>` : ''}
          ${data.heroPhoto ? frame(data.heroPhoto, 'w-in', 'style="animation-delay:.1s"') : (D.emblem && showArt ? `<span class="w-emb w-in" style="animation-delay:.1s">${D.emblem}</span>` : '')}
          ${heroTop ? `<p class="w-top w-in" style="animation-delay:.25s">${esc(heroTop)}</p>` : ''}
          <h1 class="w-names w-in" style="animation-delay:.45s">${names.length === 2
            ? `<span>${esc(names[0])}</span>${data.about1 ? `<span class="ab">${esc(data.about1)}</span>` : ''}<span class="amp">${esc(D.amp)}</span><span>${esc(names[1])}</span>${data.about2 ? `<span class="ab">${esc(data.about2)}</span>` : ''}`
            : `<span>${esc(names[0])}</span>${data.about1 || data.about2 ? `<span class="ab">${esc(data.about1 || data.about2)}</span>` : ''}`}</h1>
          ${(data.tagline == null ? 'are getting married' : data.tagline) ? `<p class="w-married w-in" style="animation-delay:.7s">${esc(data.tagline == null ? 'are getting married' : data.tagline)}</p>` : ''}
          ${shortDate ? `<div class="w-in" style="animation-delay:.9s"><span class="w-date">${esc(shortDate)}</span></div>` : ''}
          ${hasPlace(data.cerPlace) && data.cerPlace.name ? `<p class="w-place w-in" style="animation-delay:1.05s">${esc(data.cerPlace.name)}</p>` : ''}
          <div class="w-scroll"><span>Scroll</span><i></i></div></header>`);
        /* invitation, verse + countdown */
        const verse = (data.verse || '').trim();
        sections.push((data.intro || verse || data.showCountdown) ? `<section class="w-sec"><div class="w-wrap">
          ${data.intro ? `<p class="w-intro w-reveal">${esc(data.intro)}</p>${divider()}` : ''}
          ${verse ? `<p class="w-verse w-reveal">${esc(verse)}</p>` : ''}
          ${data.showCountdown && when ? '<div id="wCount"></div>' : ''}</div></section>` : '');
        /* events: ceremony, reception, then any extra events, in date order */
        const events = [];
        if (hasPlace(data.cerPlace) || data.cerTime || data.cerNote) events.push({ title: (data.cerTitle || '').trim() || D.cer, date, time: data.cerTime, place: data.cerPlace, note: data.cerNote });
        if (data.recOn && (hasPlace(data.recPlace) || data.recTime || data.recNote)) events.push({ title: (data.recTitle || '').trim() || D.rec, date, time: data.recTime, place: data.recPlace, note: data.recNote });
        (data.extra || []).forEach(x => { if (x && (x.title || hasPlace(x.place) || x.time)) events.push({ title: (x.title || '').trim() || 'Celebration', date: x.date || date, time: x.time, place: x.place, note: x.note }); });
        const key = e => (e.date || '9999') + 'T' + (e.time || '99:99');
        events.map((e, i) => [e, i]).sort((a, b) => (key(a[0]) < key(b[0]) ? -1 : key(a[0]) > key(b[0]) ? 1 : a[1] - b[1])).forEach(([e], i) => { events[i] = e; });
        if (events.length) sections.push(`<section class="w-sec"><div class="w-wrap"><p class="w-eyebrow w-reveal">The day</p><h2 class="w-h2 w-reveal">Where and when</h2><div class="w-events">${events.map(eventCard).join('')}</div></div></section>`);
        /* schedule */
        const sched = (data.schedule || []).filter(s => s.title || s.time);
        if (sched.length) sections.push(`<section class="w-sec"><div class="w-wrap"><p class="w-eyebrow w-reveal">Timeline</p><h2 class="w-h2 w-reveal">The order of the day</h2><div class="w-time">${sched.map(s =>
          `<div class="w-ti w-reveal"><div class="t">${esc(u.fmtTime(s.time))}</div><div class="w-dot"></div><div class="x"><b>${esc(s.title)}</b>${s.note ? `<span>${esc(s.note)}</span>` : ''}</div></div>`).join('')}</div></div></section>`);
        /* story */
        if ((data.story || '').trim()) sections.push(`<section class="w-sec"><div class="w-wrap"><p class="w-eyebrow w-reveal">Our story</p><h2 class="w-h2 w-reveal">How it began</h2>${divider()}
          <div class="w-story ${data.storyPhoto ? 'has-photo' : ''} w-reveal"><div>${(data.story || '').split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}</div>${data.storyPhoto ? frame(data.storyPhoto) : ''}</div></div></section>`);
        /* gallery */
        const gal = (data.gallery || []).filter(g => g.img);
        if (gal.length) sections.push(`<section class="w-sec"><div class="w-wrap"><p class="w-eyebrow w-reveal">Moments</p><h2 class="w-h2 w-reveal">A few favourites</h2><div class="w-gal">${gal.map((g, i) =>
          `<figure class="w-reveal" data-i="${i}"><img loading="lazy" decoding="async" src="${esc(g.img)}" alt="${esc(g.caption || 'Photo')}">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div></section>`);
        /* info */
        const info = (data.info || []).filter(i => i.title || i.text);
        if (info.length) sections.push(`<section class="w-sec"><div class="w-wrap"><p class="w-eyebrow w-reveal">Good to know</p><h2 class="w-h2 w-reveal">Details</h2><div class="w-info">${info.map(i => `<div class="w-reveal"><b>${esc(i.title)}</b><p>${esc(i.text)}</p></div>`).join('')}</div></div></section>`);
        /* rsvp */
        if (data.rsvpOn) {
          const c = (data.rsvpContact || '').trim(), text = encodeURIComponent('Hello! Replying to the invitation for ' + names.join(' & ') + "'s wedding. ");
          let href = '';
          if (c) {
            if (data.rsvpMethod === 'whatsapp') { const digits = c.replace(/[^\d]/g, ''); if (digits) href = 'https://api.whatsapp.com/send?phone=' + digits + '&text=' + text; } // not wa.me: it breaks emoji
            else if (data.rsvpMethod === 'sms') href = 'sms:' + c.replace(/[^\d+]/g, '') + '?&body=' + text;
            else if (data.rsvpMethod === 'email') href = 'mailto:' + c + '?subject=' + encodeURIComponent('RSVP: ' + names.join(' & ')) + '&body=' + text;
            else href = u.safeUrl(c);
          }
          sections.push(`<section class="w-sec"><div class="w-wrap"><div class="w-rsvp w-reveal"><p class="w-eyebrow">Will you join us?</p>${data.rsvpNote ? `<p>${esc(data.rsvpNote)}</p>` : ''}
            ${data.rsvpBy ? `<p class="w-by">Please reply by ${esc(u.fmtDate(data.rsvpBy, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>` : ''}
            ${href ? `<a class="w-btn solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(data.rsvpLabel || 'RSVP')}</a>` : ''}</div></div></section>`);
        }
        /* closing */
        sections.push(`<footer class="w-close w-reveal">${divider()}<p class="sign">${esc(data.closing || '')}</p>${data.hashtag ? `<p class="tag">${esc(data.hashtag)}</p>` : ''}</footer>`);

        /* envelope seal: the design's symbol, or the couple's initials */
        const sym = data.sealStyle === 'initials' ? '' : D.seal;
        const sealInner = sym === 'om' ? 'ॐ' : sym === 'crescent' ? CRESCENT : sym === 'cross' ? CROSS : esc(initials || '♥');
        const useEnvelope = !preview && data.envelope !== false;
        root.innerHTML = CLIPS + sections.join('') +
          (useEnvelope ? `<div class="w-env" id="wEnv"><h1>${esc((data.envTitle || '').trim() || D.env)}</h1>
            <div class="env" id="env"><div class="env-back"></div>
              <div class="env-card"><b>${esc(names.join(' & '))}</b><span>${esc(shortDate || 'Save the date')}</span></div>
              <div class="env-front"></div><div class="env-flap"></div>
              <button class="seal" id="seal" type="button" aria-label="Open the invitation">${sealInner}</button></div>
            <div class="hint">Tap the seal to open</div></div>` : '');

        /* scroll reveal */
        let io = null;
        if (!preview && 'IntersectionObserver' in window) {
          io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
          root.querySelectorAll('.w-reveal').forEach(n => io.observe(n));
        } else root.querySelectorAll('.w-reveal').forEach(n => n.classList.add('in'));

        /* countdown */
        let tick = 0;
        const cd = root.querySelector('#wCount');
        if (cd && when) {
          let nums = null;
          const draw = () => {
            const ms = when - new Date();
            if (ms <= 0) { cd.innerHTML = `<p class="w-big">${u.daysUntil(date) === 0 ? 'Today is the day!' : 'Married!'}</p>`; nums = null; return; }
            const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60].map(x => String(x).padStart(2, '0'));
            if (!nums) { cd.innerHTML = `<div class="w-count w-reveal in">${['Days', 'Hours', 'Minutes', 'Seconds'].map(l => `<div><b></b><span>${l}</span></div>`).join('')}</div>`; nums = [...cd.querySelectorAll('b')]; }
            nums.forEach((b, i) => { if (b.textContent !== v[i]) b.textContent = v[i]; });
          };
          draw(); if (!preview) tick = setInterval(draw, 1000); else tick = setInterval(draw, 30000);
        }

        /* lightbox */
        let lb = null;
        const closeLb = () => { if (lb) { lb.remove(); lb = null; } };
        const openLb = i => {
          closeLb(); const g = gal[i]; if (!g) return;
          lb = el('div', { class: 'w-lb', onclick: e => { if (e.target === lb) closeLb(); } },
            el('figure', {}, el('img', { src: g.img, alt: g.caption || '' }), g.caption ? el('figcaption', {}, g.caption) : null),
            el('button', { class: 'x', type: 'button', 'aria-label': 'Close', onclick: closeLb }, '✕'),
            gal.length > 1 ? el('button', { class: 'p', type: 'button', 'aria-label': 'Previous', onclick: () => openLb((i - 1 + gal.length) % gal.length) }, '‹') : null,
            gal.length > 1 ? el('button', { class: 'n', type: 'button', 'aria-label': 'Next', onclick: () => openLb((i + 1) % gal.length) }, '›') : null);
          document.body.append(lb);
        };
        root.querySelectorAll('.w-gal figure').forEach(f => f.addEventListener('click', () => openLb(+f.dataset.i)));
        const onKey = e => { if (lb && e.key === 'Escape') closeLb(); };
        addEventListener('keydown', onKey);

        /* envelope */
        if (useEnvelope) {
          document.body.style.overflow = 'hidden';
          const envWrap = root.querySelector('#wEnv'), env = root.querySelector('#env');
          root.querySelector('#seal').addEventListener('click', () => {
            ctx.start(); env.classList.add('open'); const hint = root.querySelector('.hint'); if (hint) hint.textContent = '';
            setTimeout(() => { envWrap.classList.add('gone'); document.body.style.overflow = prevOv; }, 2300);
            setTimeout(() => envWrap.remove(), 3500);
          });
        }

        return {
          destroy() {
            clearInterval(tick); if (io) io.disconnect(); closeLb(); removeEventListener('keydown', onKey);
            style.remove(); root.textContent = ''; root.className = ''; root.style.cssText = ''; document.body.style.background = prevBg; document.body.style.overflow = prevOv;
          }
        };
      }
    };
  }

  /* ---------------- sample content + card thumbnails ---------------- */
  const base = () => ({
    design: 'classic', palette: 'auto', nameFont: 'design', shape: 'design', showOrn: true, envelope: true, sealStyle: 'design',
    name1: '', name2: '', about1: '', about2: '', blessingOn: true, blessing: '', top: '', tagline: 'are getting married', intro: '', verse: '',
    date: inDays(150), heroPhoto: '',
    cerTitle: '', cerTime: '15:30', cerPlace: { name: '', address: '', url: '' }, cerNote: '',
    recOn: true, recTitle: '', recTime: '18:00', recPlace: { name: '', address: '', url: '' }, recNote: '',
    extra: [], schedule: [], story: '', storyPhoto: '', gallery: [], info: [],
    rsvpOn: true, rsvpBy: '', rsvpMethod: 'whatsapp', rsvpContact: '', rsvpNote: 'We would love to know if you can join us.', rsvpLabel: 'RSVP',
    showCountdown: true, showMap: false, closing: 'We cannot wait to celebrate with you.', hashtag: '', envTitle: ''
  });
  const place = (name, address) => ({ name, address, url: '' });

  const thumbBase = (bg, inner) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="${bg}"/>${inner}</svg>`;
  const T = (x, y, txt, fill, size, extra) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" fill="${fill}" ${extra || ''}>${txt}</text>`;
  const thumbClassic = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#fbf7f0"/>
      <g fill="none" stroke="#8a9a72" stroke-width="1.6" opacity=".7"><path d="M-10 20C60 40 120 90 160 170"/><path d="M410 280C340 260 280 210 240 130"/></g>
      <g fill="#8a9a72" opacity=".35"><ellipse cx="40" cy="42" rx="7" ry="16" transform="rotate(-40 40 42)"/><ellipse cx="72" cy="70" rx="7" ry="16" transform="rotate(-25 72 70)"/><ellipse cx="100" cy="106" rx="7" ry="16" transform="rotate(-10 100 106)"/><ellipse cx="360" cy="258" rx="7" ry="16" transform="rotate(140 360 258)"/><ellipse cx="328" cy="230" rx="7" ry="16" transform="rotate(155 328 230)"/></g>
      <text x="200" y="118" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="54" fill="#b8935a">Amelia</text>
      <text x="200" y="146" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="17" fill="#8b7f73">and</text>
      <text x="200" y="196" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="54" fill="#b8935a">James</text>
      <line x1="130" y1="222" x2="270" y2="222" stroke="#b8935a"/><text x="200" y="245" text-anchor="middle" font-family="Georgia,serif" font-size="12" letter-spacing="4" fill="#3a332c">24 OCTOBER 2026</text></svg>`;
  const thumbHindu = thumbBase('#4a0f1c',
    '<g fill="none" stroke="#e6b85c" opacity=".3"><circle cx="200" cy="160" r="130"/><circle cx="200" cy="160" r="112" stroke-dasharray="3 6"/><circle cx="200" cy="160" r="84"/><circle cx="200" cy="160" r="56"/></g>' +
    '<path d="M0 12Q100 34 200 12T400 12" fill="none" stroke="#3f7d3a" stroke-width="2"/>' + Array.from({ length: 12 }, (_, i) => `<circle cx="${i * 36 + 4}" cy="${i % 2 ? 20 : 14}" r="10" fill="#f0a12a"/><circle cx="${i * 36 + 4}" cy="${i % 2 ? 20 : 14}" r="4" fill="#fbc94a"/>${i % 3 === 0 ? `<path d="M${i * 36 + 4} 26V${56 + (i % 2) * 14}" stroke="#3f7d3a" stroke-width="1.5"/><circle cx="${i * 36 + 4}" cy="${44 + (i % 2) * 14}" r="8" fill="#e98b16"/>` : ''}`).join('') +
    T(200, 108, '॥ श्री गणेशाय नमः ॥', '#e6b85c', 15) + T(200, 158, 'ARJUN', '#e6b85c', 34, 'letter-spacing="4"') + T(200, 184, '&amp;', '#d8b98a', 20, 'font-style="italic"') + T(200, 220, 'MEERA', '#e6b85c', 34, 'letter-spacing="4"') +
    '<line x1="140" y1="242" x2="260" y2="242" stroke="#e6b85c"/>' + T(200, 262, '14 FEBRUARY 2027', '#f8e9c8', 11, 'letter-spacing="3"'));
  const thumbMuslim = thumbBase('#0c2f27',
    '<path d="M60 300V150C60 110 100 96 130 70C160 50 190 30 200 14C210 30 240 50 270 70C300 96 340 110 340 150V300" fill="none" stroke="#d8b45f" stroke-width="1.6" opacity=".8"/><path d="M70 300V152C70 116 106 102 136 78C164 58 190 40 200 26C210 40 236 58 264 78C294 102 330 116 330 152V300" fill="none" stroke="#d8b45f" stroke-width="1" opacity=".4"/>' +
    [[86, 16, 1], [314, 10, .8]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#d8b45f" fill="none" stroke-width="1.4"><path d="M0 0V26"/><path d="M-9 34C-9 28 9 28 9 34L7 40H-7Z" fill="#d8b45f" fill-opacity=".3"/><path d="M-7 40C-15 52 -15 68 -7 80H7C15 68 15 52 7 40Z"/><ellipse cx="0" cy="58" rx="3" ry="7" fill="#ffd27a" stroke="none"/></g>`).join('') +
    '<path d="M209 60A12 12 0 1 0 209 84A9.6 9.6 0 1 1 209 60Z" transform="translate(-9 -6)" fill="#d8b45f"/>' +
    T(200, 128, 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '#d8b45f', 17) + T(200, 172, 'Ayaan', '#d8b45f', 38, 'font-style="italic"') + T(200, 196, '&amp;', '#a8c4b8', 18, 'font-style="italic"') + T(200, 236, 'Zara', '#d8b45f', 38, 'font-style="italic"') +
    T(200, 268, '22 NOVEMBER 2026', '#f3ecd6', 11, 'letter-spacing="3"'));
  const thumbChristian = thumbBase('#f6f5ee',
    '<g fill="none" stroke="#7c9a72" stroke-width="1.6" opacity=".8"><path d="M-10 14C50 30 100 70 140 130"/><path d="M410 286C350 270 300 230 260 170"/></g><g fill="#7c9a72" opacity=".4">' +
    [[28, 22, -50], [50, 38, 40], [72, 54, -40], [94, 76, 46], [116, 100, -34], [372, 278, 130], [350, 262, 220], [326, 240, 136], [304, 218, 226], [282, 194, 140]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="12" transform="rotate(${r} ${x} ${y})"/>`).join('') + '</g>' +
    '<g stroke="#6b8a62" stroke-width="2" stroke-linecap="round"><path d="M200 44V84M188 58H212"/></g>' +
    T(200, 128, 'Daniel', '#6b8a62', 46, 'font-style="italic"') + T(200, 154, '&amp;', '#7b8572', 18, 'font-style="italic"') + T(200, 200, 'Grace', '#6b8a62', 46, 'font-style="italic"') +
    '<line x1="150" y1="222" x2="250" y2="222" stroke="#6b8a62"/>' + T(200, 246, '6 JUNE 2027', '#38402f', 12, 'letter-spacing="4"'));
  const thumbModern = thumbBase('#faf5ef',
    '<rect x="22" y="22" width="356" height="256" fill="none" stroke="#2b2420" stroke-opacity=".3"/>' +
    `<text x="200" y="128" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="300" font-size="34" letter-spacing="10" fill="#c0674a">NOAH</text>` +
    T(200, 160, '&amp;', '#85786d', 20, 'font-style="italic"') +
    `<text x="200" y="204" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="300" font-size="34" letter-spacing="10" fill="#c0674a">ELLA</text>` +
    '<line x1="170" y1="232" x2="230" y2="232" stroke="#2b2420"/>' + `<text x="200" y="254" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10" letter-spacing="4" fill="#2b2420">12 SEPTEMBER 2026</text>`);

  const SPECS = [
    { id: 'wedding', design: 'classic', name: 'Classic floral wedding', tagline: 'An envelope opens onto an elegant invitation with your story, schedule, maps and RSVP.', for: 'Weddings, engagements, anniversaries, vow renewals', thumb: thumbClassic,
      sample: Object.assign(base(), { design: 'classic', name1: 'Amelia', name2: 'James', top: 'Together with their families', intro: 'request the pleasure of your company at the celebration of their marriage.',
        cerPlace: place("St. Mary's Chapel", '12 Church Lane, Riverside'), recPlace: place('The Rosewood Hall', '40 Garden Road, Riverside'), recNote: 'Dinner, dancing and cake to follow.',
        schedule: [{ time: '15:30', title: 'Ceremony', note: 'Please be seated by 15:15.' }, { time: '17:00', title: 'Cocktails and photos', note: '' }, { time: '18:00', title: 'Dinner and dancing', note: '' }],
        info: [{ title: 'Dress code', text: 'Formal. Soft pastels are welcome.' }, { title: 'Gifts', text: 'Your presence is the greatest gift.' }] }) },
    { id: 'wedding-hindu', design: 'hindu', name: 'Hindu wedding', tagline: 'Marigold garlands, a slowly turning mandala and gold on deep maroon. Ganesh blessing, muhurtham and every function.', for: 'Vivah, muhurtham, sangeet, mehndi, haldi, reception', thumb: thumbHindu,
      sample: Object.assign(base(), { design: 'hindu', name1: 'Arjun', name2: 'Meera', about1: 'Son of Mr. Ramesh Kumar and Mrs. Sunita Kumar', about2: 'Daughter of Mr. Suresh Nair and Mrs. Latha Nair', top: 'With the blessings of the Almighty and our elders',
        intro: 'joyfully invite you and your family to bless them on their wedding day.', cerTime: '09:00', recTime: '19:00',
        cerPlace: place('Sri Venkateswara Kalyana Mandapam', '45 Temple Street, Your City'), recPlace: place('The Grand Banquet Hall', '8 Lake Road, Your City'), recNote: 'Dinner and celebrations to follow.',
        extra: [{ title: 'Mehndi and Haldi', date: inDays(149), time: '16:00', place: place('Family home', '3 Garden Avenue, Your City'), note: 'Yellow and green are welcome.' }],
        schedule: [{ time: '08:00', title: 'Baraat welcome', note: '' }, { time: '09:00', title: 'Wedding rituals', note: 'The muhurtham is at 09:30.' }, { time: '12:30', title: 'Blessings and feast', note: '' }],
        info: [{ title: 'Dress code', text: 'Traditional Indian attire. Silks and bright colours are lovely.' }, { title: 'Blessings', text: 'Your presence and blessings are the finest gift.' }],
        closing: 'Your blessings will make our day complete.' }) },
    { id: 'wedding-muslim', design: 'muslim', name: 'Muslim wedding (Nikah)', tagline: 'Glowing lanterns, an ogee arch and gold on emerald. Bismillah, Nikah and Walima.', for: 'Nikah, Walima, mehendi, engagement', thumb: thumbMuslim,
      sample: Object.assign(base(), { design: 'muslim', name1: 'Ayaan', name2: 'Zara', about1: 'Son of Mr. and Mrs. Khan', about2: 'Daughter of Mr. and Mrs. Siddiqui', top: 'Together with their families',
        intro: 'invite you to celebrate their Nikah. Your presence and duas will make the day complete.', cerTime: '11:00', recTime: '19:00',
        cerPlace: place('Al Noor Banquet Hall', '21 Crescent Road, Your City'), recPlace: place('The Palm Garden', '5 Park Avenue, Your City'), recNote: 'Dinner will be served after Maghrib.',
        extra: [{ title: 'Mehendi Night', date: inDays(149), time: '18:00', place: place('Family home', '3 Garden Avenue, Your City'), note: 'Ladies only, with music and henna.' }],
        schedule: [{ time: '10:30', title: 'Guests arrive', note: '' }, { time: '11:00', title: 'Nikah', note: '' }, { time: '13:00', title: 'Lunch', note: '' }],
        info: [{ title: 'Dress code', text: 'Modest, festive attire.' }, { title: 'Duas', text: 'Please keep the couple in your prayers.' }],
        closing: 'Jazakallahu khairan for being part of our happiness.' }) },
    { id: 'wedding-christian', design: 'christian', name: 'Christian wedding', tagline: 'A gentle sage-and-cream invitation with a gothic window frame, olive branches and your chosen verse.', for: 'Church weddings, blessings, vow renewals', thumb: thumbChristian,
      sample: Object.assign(base(), { design: 'christian', name1: 'Daniel', name2: 'Grace', about1: 'Son of Mr. and Mrs. Thomas', about2: 'Daughter of Mr. and Mrs. Mathew', top: 'Together with their families',
        intro: 'request the honour of your presence at the celebration of their marriage.', cerTime: '14:00', recTime: '17:30',
        cerPlace: place("St. Thomas' Church", '10 Church Road, Your City'), recPlace: place('Bethany Hall', '7 Garden Lane, Your City'), recNote: 'Dinner and dancing to follow.',
        schedule: [{ time: '13:30', title: 'Guests are seated', note: '' }, { time: '14:00', title: 'Wedding service', note: '' }, { time: '15:30', title: 'Photographs', note: '' }, { time: '17:30', title: 'Reception', note: '' }],
        info: [{ title: 'Dress code', text: 'Smart and elegant.' }, { title: 'Gifts', text: 'Your prayers and presence are our greatest gift.' }],
        closing: 'The Lord has done great things for us, and we are filled with joy.' }) },
    { id: 'wedding-modern', design: 'modern', name: 'Modern minimal wedding', tagline: 'Clean lines, spacious type and one warm accent colour. Fully yours to restyle.', for: 'Weddings of any kind, elopements, city celebrations', thumb: thumbModern,
      sample: Object.assign(base(), { design: 'modern', name1: 'Noah', name2: 'Ella', top: 'Please join us', tagline: 'are getting married', intro: 'for a day of love, laughter and good company.', cerTime: '16:00', recTime: '18:30',
        cerPlace: place('The Glass House', '1 Studio Lane, Your City'), recPlace: place('The Rooftop', '1 Studio Lane, Your City'), recNote: 'Food, drinks and dancing.',
        schedule: [{ time: '16:00', title: 'Ceremony', note: '' }, { time: '17:00', title: 'Drinks', note: '' }, { time: '18:30', title: 'Dinner and dancing', note: '' }],
        info: [{ title: 'Dress code', text: 'Smart casual. Comfortable shoes for dancing.' }], closing: 'See you there.' }) }
  ];
  SPECS.forEach(s => KS.registerTemplate(make(s)));
})();
