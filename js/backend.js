/* Tales & Tidings backend: talks to Supabase with plain fetch (no library).
   Setup: see SETUP.md and supabase/setup.sql. Keys go in config.js. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util;
  const cfg = () => KS.config || {};
  const base = () => String(cfg().SUPABASE_URL || '').replace(/\/+$/, '');
  const key = () => String(cfg().SUPABASE_ANON_KEY || '');
  const headers = extra => {
    const h = { apikey: key() };
    if (/^eyJ/.test(key())) h.Authorization = 'Bearer ' + key(); // classic JWT-style keys; the newer sb_publishable_ keys use apikey only
    return Object.assign(h, extra || {});
  };
  const B = KS.backend = {};

  B.configured = () => /^https?:\/\//.test(base()) && key().length > 20;

  const rnd = (n, alphabet) => { const a = new Uint32Array(n); crypto.getRandomValues(a); return [...a].map(x => alphabet[x % alphabet.length]).join(''); };
  const ABC = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  B.newId = () => rnd(10, ABC);
  B.newKey = () => rnd(28, ABC);

  async function must(res) {
    if (res.ok) return res;
    let msg = ''; try { const j = await res.clone().json(); msg = j.message || j.error || j.msg || ''; } catch (_) {}
    const e = new Error(msg || ('Server said ' + res.status)); e.status = res.status; throw e;
  }

  B.publicUrl = path => base() + '/storage/v1/object/public/media/' + path;

  B.upload = async (blob, path, type) => {
    const res = await fetch(base() + '/storage/v1/object/media/' + path, { method: 'POST', headers: headers({ 'Content-Type': type || blob.type || 'application/octet-stream', 'x-upsert': 'false' }), body: blob });
    await must(res); return B.publicUrl(path);
  };

  B.createPage = async (id, editKey, obj) => must(await fetch(base() + '/rest/v1/rpc/create_page', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ p_id: id, p_key: editKey, p_data: obj }) }));
  B.updatePage = async (id, editKey, obj) => {
    const r = await must(await fetch(base() + '/rest/v1/rpc/update_page', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ p_id: id, p_key: editKey, p_data: obj }) }));
    if ((await r.json()) !== true) throw new Error('This page can only be edited from the device that made it.');
  };
  B.getPage = async id => {
    if (!/^[A-Za-z0-9]{6,20}$/.test(id || '')) return null;
    const r = await must(await fetch(base() + '/rest/v1/rpc/get_page', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ p_id: id }) }));
    return (await r.json()) || null;
  };

  /* Upload every picture/song the visitor added (blob: urls) and swap in the public address.
     `onStep(done, total)` reports progress. Returns a copy of the data with real urls. */
  B.uploadBlobs = async (obj, pageId, onStep) => {
    const found = new Map(); // blob url -> uploaded url
    (function walk(v) { if (typeof v === 'string') { if (u.isBlobUrl(v)) found.set(v, null); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(obj);
    const list = [...found.keys()]; let done = 0, n = 0; onStep && onStep(0, list.length);
    const queue = list.slice();
    const worker = async () => {
      while (queue.length) {
        const bu = queue.shift(), info = u.blobs.get(bu);
        if (!info) throw new Error('A picture you added is no longer available. Please add it again.');
        const path = pageId + '/' + (++n) + '-' + Math.random().toString(36).slice(2, 7) + '.' + info.ext;
        found.set(bu, await B.upload(info.blob, path, info.blob.type)); onStep && onStep(++done, list.length);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return (function swap(v) {
      if (typeof v === 'string') return found.has(v) ? found.get(v) : v;
      if (Array.isArray(v)) return v.map(swap);
      if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = swap(v[k]); return o; }
      return v;
    })(obj);
  };

  /* ---- pages made on this device (so they can be opened or edited again) ---- */
  const LS = 'ks.pages';
  B.myPages = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (_) { return []; } };
  B.rememberPage = rec => { try { const l = B.myPages().filter(x => x.id !== rec.id); l.unshift(rec); localStorage.setItem(LS, JSON.stringify(l.slice(0, 50))); } catch (_) {} };
  B.forgetPage = id => { try { localStorage.setItem(LS, JSON.stringify(B.myPages().filter(x => x.id !== id))); } catch (_) {} };
  B.pageLink = id => location.href.split(/[?#]/)[0].replace(/index\.html$/, '') + '?p=' + id;
})();
