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
  KS.loadTemplate = async id => { if (!KS.templates[id]) await u.loadScript('templates/' + String(id).split('-')[0] + '.js'); if (!KS.templates[id]) throw new Error('Unknown template'); return KS.templates[id]; };
  u.font = href => { if (document.querySelector('link[data-ks-font="' + href + '"]')) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.ksFont = href; document.head.append(l); };
})();
