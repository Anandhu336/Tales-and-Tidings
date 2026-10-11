/* Tales & Tidings core: namespace + small helpers shared by the builder, the viewer and every template.
   Plain scripts (no modules) so the site also works when opened straight from a folder. */
(function () {
  'use strict';
  const KS = window.KS = window.KS || {};
  KS.templates = {};
  KS.config = window.KS_CONFIG || {};
  KS.registerTemplate = t => { KS.templates[t.id] = t; };

  const u = KS.util = {};
  u.$ = (s, r) => (r || document).querySelector(s);
  u.$$ = (s, r) => [...(r || document).querySelectorAll(s)];
  u.rand = (a, b) => a + Math.random() * (b - a);
  u.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  u.RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* phones and small tablets: draw canvases at a lower resolution and with fewer particles so animations stay smooth */
  u.LITE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.hardwareConcurrency || 8) <= 4;
  u.dpr = () => Math.min(window.devicePixelRatio || 1, u.LITE ? 1.5 : 2);
  /* resize that ignores the phone address bar sliding in and out (only width or a big height change counts) */
  u.onResize = (fn, ms) => {
    let w = innerWidth, h = innerHeight, t = 0;
    const h2 = () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth === w && Math.abs(innerHeight - h) < 160) return; w = innerWidth; h = innerHeight; fn(); }, ms || 200); };
    addEventListener('resize', h2);
    return () => { clearTimeout(t); removeEventListener('resize', h2); };
  };
  /* background photos marked data-bg load only when they come near the screen, so the first view opens fast */
  u.lazyBg = (root, eager) => {
    const els = [...root.querySelectorAll('[data-bg]')], set = e => { e.style.backgroundImage = e.dataset.bg; e.removeAttribute('data-bg'); };
    if (eager || !('IntersectionObserver' in window)) { els.forEach(set); return null; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { set(e.target); io.unobserve(e.target); } }), { rootMargin: '600px 0px' });
    els.forEach(e => io.observe(e));
    return io;
  };
  u.clone = o => JSON.parse(JSON.stringify(o));
  u.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* tiny DOM builder: el('div', {class:'x', onclick:fn}, 'text', childEl) */
  u.el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  };

  /* ---- dates: stored as 'YYYY-MM-DD' and 'HH:MM' (wall-clock time, no timezone) ---- */
  u.parseDate = (d, t) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return null;
    const tm = /^(\d{1,2}):(\d{2})$/.exec(t || '');
    return new Date(+m[1], +m[2] - 1, +m[3], tm ? +tm[1] : 0, tm ? +tm[2] : 0, 0);
  };
  u.fmtDate = (d, opts) => { const x = u.parseDate(d); return x ? x.toLocaleDateString(undefined, opts || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''; };
  u.fmtTime = t => { const x = u.parseDate('2000-01-01', t); return x && t ? x.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''; };
  u.daysUntil = d => { const x = u.parseDate(d); if (!x) return null; const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((x - n) / 864e5); };

  /* ---- places / links ---- */
  u.safeUrl = url => {
    url = String(url || '').trim(); if (!url) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
    if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(url)) return 'https://' + url;
    return '';
  };
  u.mapsQuery = p => [p && p.name, p && p.address].filter(Boolean).join(', ');
  u.mapsUrl = p => u.safeUrl(p && p.url) || (u.mapsQuery(p) ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(u.mapsQuery(p)) : '');
  u.mapsEmbed = p => u.mapsQuery(p) ? 'https://maps.google.com/maps?q=' + encodeURIComponent(u.mapsQuery(p)) + '&z=15&output=embed' : '';
  u.youtubeId = url => { const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(String(url || '')); return m ? m[1] : ''; };

  /* ---- calendar file (.ics) ---- */
  u.ics = ({ title, date, time, endTime, place, note }) => {
    const s = u.parseDate(date, time); if (!s) return '';
    const p2 = n => String(n).padStart(2, '0'), stamp = d => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`,
      stampT = d => stamp(d) + `T${p2(d.getHours())}${p2(d.getMinutes())}00`, esc = t => String(t || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    let dt;
    if (time) { const e = endTime ? u.parseDate(date, endTime) : new Date(s.getTime() + 3 * 36e5); dt = `DTSTART:${stampT(s)}\r\nDTEND:${stampT(e > s ? e : new Date(s.getTime() + 3 * 36e5))}`; }
    else { const e = new Date(s.getTime() + 864e5); dt = `DTSTART;VALUE=DATE:${stamp(s)}\r\nDTEND;VALUE=DATE:${stamp(e)}`; }
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tales and Tidings//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@talesandtidings', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d+/g, ''),
      dt, 'SUMMARY:' + esc(title), place ? 'LOCATION:' + esc(u.mapsQuery(place)) : '', note ? 'DESCRIPTION:' + esc(note) : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    return URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
  };

  /* ---- images the visitor picks: shrunk in the browser before upload ---- */
  u.blobs = new Map(); // blob: url -> { blob, ext, name }
  u.isBlobUrl = s => typeof s === 'string' && s.startsWith('blob:');
  u.resizeImage = async (file, max, quality) => {
    max = max || 1600; quality = quality || .82;
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That file is not a picture we can read.')); i.src = URL.createObjectURL(file); }); }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight, k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not process that picture.');
    return blob;
  };
  u.addBlob = (blob, ext, name) => { const url = URL.createObjectURL(blob); u.blobs.set(url, { blob, ext, name: name || '' }); return url; };

  /* ---- animated stickers (Google Noto Animated Emoji, CC BY 4.0, shrunk into /stickers; see stickers/README.txt) ---- */
  u.STK = new Set('1f305 1f308 1f30a 1f32e 1f32f 1f338 1f339 1f353 1f354 1f355 1f35c 1f366 1f369 1f36a 1f377 1f37b 1f37f 1f382 1f389 1f3a1 1f3b2 1f3b3 1f3b6 1f407 1f415 1f423 1f425 1f427 1f431 1f438 1f43b 1f43c 1f43e 1f44f 1f48c 1f490 1f494 1f496 1f497 1f498 1f49d 1f49e 1f4af 1f4da 1f4f8 1f50b 1f525 1f60a 1f60d 1f60f 1f618 1f61c 1f622 1f624 1f62d 1f62e 1f633 1f638 1f639 1f63a 1f63b 1f63c 1f63d 1f63e 1f63f 1f640 1f648 1f64f 1f697 1f6b2 1f914 1f917 1f929 1f92d 1f957 1f95e 1f970 1f973 1f979 1f97a 1f984 1f98a 1f98b 1f9cb 1fac2 1fae0 1faf6 2615 267e_fe0f 2708_fe0f 2728 2764_fe0f'.split(' '));
  const codeOf = e => [...e].map(c => c.codePointAt(0).toString(16)).filter(h => h !== 'fe0f').join('_');
  u.stkFile = e => { const c = codeOf(e || ''); return u.STK.has(c) ? c : u.STK.has(c + '_fe0f') ? c + '_fe0f' : ''; };
  u.stkSrc = e => { const f = u.stkFile(e); return f ? 'stickers/' + f + '.webp' : ''; };
  /* an <img> sticker for an emoji, or the plain emoji when there is no sticker (or it fails to load) */
  /* Any emoji can be a sticker: ours first, then Google's animated version straight from Google (bigger, so only for
     emoji we don't keep), and if Google has none either, the phone's own emoji, which the cute designs wiggle with CSS. */
  const NOTO = c => 'https://fonts.gstatic.com/s/e/notoemoji/latest/' + c + '/512.webp';
  u.stk = (e, cls) => {
    const src = u.stkSrc(e), c = (cls ? cls + ' ' : ''), code = codeOf(e || '');
    if (!src && !/^[0-9a-f]{4,6}(_[0-9a-f]{4,6})*$/.test(code)) return `<span class="${c}stk-t">${u.esc(e)}</span>`;
    const url = src || NOTO(code), alt = src ? '' : ` data-alt="${NOTO(code + '_fe0f')}"`;
    return `<img class="${c}stk" src="${url}"${alt} loading="lazy" alt="${u.esc(e)}" draggable="false" decoding="async" onerror="KS.util.stkFail(this)">`;
  };
  u.stkFail = img => {
    if (img.dataset.alt) { const a = img.dataset.alt; img.removeAttribute('data-alt'); img.src = a; return; } // some need the _fe0f spelling
    img.replaceWith(Object.assign(document.createElement('span'), { className: img.className.replace(/\bstk\b/, 'stk-t'), textContent: img.alt }));
  };
  u.preloadStk = e => { const src = u.stkSrc(e); if (src) new Image().src = src; };
  const LEAD = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u20E3|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*)\s*/u;
  u.splitEmoji = t => { t = String(t || ''); const m = LEAD.exec(t); return m ? { e: m[1], l: t.slice(m[0].length).trim() } : { e: '', l: t.trim() }; };
  u.STK_CREDIT = '<p class="ks-credit">Animated emoji: <a href="https://googlefonts.github.io/noto-emoji-animation/" target="_blank" rel="noopener">Google Noto</a> (CC BY 4.0)</p>';

  /* ---- small toast ---- */
  u.toast = msg => {
    let t = document.getElementById('ks-toast');
    if (!t) { t = u.el('div', { id: 'ks-toast', role: 'status' }); document.body.append(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(u.toast.t); u.toast.t = setTimeout(() => t.classList.remove('show'), 2600);
  };

  /* ---- load a script once (templates, builder code) ---- */
  const loading = {};
  u.loadScript = src => loading[src] || (loading[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.append(s);
  }));
  /* a file can register a family of templates: 'wedding-hindu' lives in templates/wedding.js */
  KS.V = '16'; // bump when templates change so phones fetch the new files instead of a cached copy
  KS.loadTemplate = async id => { if (!KS.templates[id]) await u.loadScript('templates/' + String(id).split('-')[0] + '.js?v=' + KS.V); if (!KS.templates[id]) throw new Error('Unknown template'); return KS.templates[id]; };
  u.font = href => { if (document.querySelector('link[data-ks-font="' + href + '"]')) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.ksFont = href; document.head.append(l); };
})();
