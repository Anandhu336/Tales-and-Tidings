/* Tales & Tidings backend: talks to Supabase with plain fetch (no library).
   Setup: see SETUP.md and supabase/setup.sql. Keys go in config.js. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util;
  const cfg = () => KS.config || {};
  const base = () => String(cfg().SUPABASE_URL || '').replace(/\/+$/, '');
  const key = () => String(cfg().SUPABASE_ANON_KEY || '');
  const B = KS.backend = {};
  const headers = extra => {
    const h = { apikey: key() };
    const s = B.session();
    if (s && s.access_token) h.Authorization = 'Bearer ' + s.access_token; // signed in: the database knows who is asking
    else if (/^eyJ/.test(key())) h.Authorization = 'Bearer ' + key(); // classic JWT-style keys; the newer sb_publishable_ keys use apikey only
    return Object.assign(h, extra || {});
  };

  B.configured = () => /^https?:\/\//.test(base()) && key().length > 20;

  const rnd = (n, alphabet) => { const a = new Uint32Array(n); crypto.getRandomValues(a); return [...a].map(x => alphabet[x % alphabet.length]).join(''); };
  const ABC = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  B.newId = () => rnd(10, ABC);
  B.newKey = () => rnd(28, ABC);

  /* fetch, but a dead connection gets a message people can act on instead of "Failed to fetch" */
  const net = (url, opts) => fetch(url, opts).catch(() => {
    throw new Error(navigator.onLine === false ? 'You seem to be offline. Connect to the internet and try again.'
      : 'Could not reach the page database. If your internet is working, the site’s Supabase project may be paused or deleted: open your Supabase dashboard and restore it (see SETUP.md).');
  });

  async function must(res) {
    if (res.ok) return res;
    let msg = ''; try { const j = await res.clone().json(); msg = j.message || j.error || j.msg || ''; } catch (_) {}
    const e = new Error(msg || ('Server said ' + res.status)); e.status = res.status; throw e;
  }

  B.publicUrl = path => base() + '/storage/v1/object/public/media/' + path;

  B.upload = async (blob, path, type) => {
    await B.fresh();
    const res = await net(base() + '/storage/v1/object/media/' + path, { method: 'POST', headers: headers({ 'Content-Type': type || blob.type || 'application/octet-stream', 'x-upsert': 'false' }), body: blob });
    await must(res); return B.publicUrl(path);
  };

  /* ---- accounts (Supabase Auth). The session lives in this browser; pages live in the account. ---- */
  const SS = 'ks.session';
  B.session = () => { try { return JSON.parse(localStorage.getItem(SS) || 'null'); } catch (_) { return null; } };
  const keep = s => { try { if (s) localStorage.setItem(SS, JSON.stringify(s)); else localStorage.removeItem(SS); } catch (_) {} };
  const saveSession = j => {
    if (!j || !j.access_token) return null;
    const s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (+j.expires_in || 3600), user: j.user || (B.session() || {}).user || null };
    keep(s); return s;
  };
  B.user = () => { const s = B.session(); return s && s.user ? s.user : null; };
  B.signedIn = () => !!B.session();
  B.siteUrl = () => location.href.split(/[?#]/)[0];
  const authPost = async (path, body, extra) => {
    const res = await net(base() + '/auth/v1/' + path, { method: 'POST', headers: Object.assign({ apikey: key(), 'Content-Type': 'application/json' }, extra || {}), body: JSON.stringify(body) });
    if (!res.ok) {
      let j = {}; try { j = await res.json(); } catch (_) {}
      const m = j.msg || j.error_description || j.message || j.error || '';
      throw new Error(/invalid login/i.test(m) ? 'That email and password do not match. Try again, or reset your password.'
        : /not confirmed/i.test(m) ? 'Please confirm your email first: open the link we sent you.'
        : /already registered/i.test(m) ? 'There is already an account with this email. Sign in instead.'
        : m || ('Server said ' + res.status));
    }
    return res.status === 204 ? null : res.json().catch(() => null);
  };
  // returns the signed-in session, or null when the account still needs its email confirmed
  B.signUp = async (email, password) => saveSession(await authPost('signup?redirect_to=' + encodeURIComponent(B.siteUrl()), { email, password }));
  B.signIn = async (email, password) => saveSession(await authPost('token?grant_type=password', { email, password }));
  B.resetPassword = email => authPost('recover?redirect_to=' + encodeURIComponent(B.siteUrl()), { email });
  B.signOut = async () => {
    const s = B.session(); keep(null);
    if (s) await fetch(base() + '/auth/v1/logout', { method: 'POST', headers: { apikey: key(), Authorization: 'Bearer ' + s.access_token } }).catch(() => {});
  };
  B.setPassword = async password => {
    await B.fresh();
    const res = await net(base() + '/auth/v1/user', { method: 'PUT', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ password }) });
    await must(res);
  };
  /* keep the 1-hour access token fresh before talking to the database; a dead session signs out quietly */
  let refreshing = null;
  B.fresh = async () => {
    const s = B.session(); if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s;
    return refreshing || (refreshing = authPost('token?grant_type=refresh_token', { refresh_token: s.refresh_token })
      .then(saveSession, e => { if (navigator.onLine !== false && !/reach|offline/i.test(e.message)) keep(null); return null; })
      .finally(() => { refreshing = null; }));
  };
  /* the email links (confirm, reset password) come back as #access_token=... on this site */
  B.takeSessionFromUrl = async () => {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (h.get('error_description')) return { error: h.get('error_description').replace(/\+/g, ' ') };
    if (!h.get('access_token')) return null;
    const s = saveSession({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: h.get('expires_in'), expires_at: +h.get('expires_at') || 0 });
    try { const r = await net(base() + '/auth/v1/user', { headers: headers() }); if (r.ok) { s.user = await r.json(); keep(s); } } catch (_) {}
    return { type: h.get('type') || '' };
  };

  const rpc = async (fn, args) => {
    await B.fresh();
    const call = () => net(base() + '/rest/v1/rpc/' + fn, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(args || {}) });
    let res = await call();
    if (res.status === 401 && B.session()) { keep(null); res = await call(); } // the sign-in has run out: carry on signed out
    return must(res);
  };
  B.accountPages = async () => (await (await rpc('my_pages')).json()) || [];
  B.claimPage = async (id, editKey) => (await (await rpc('claim_page', { p_id: id, p_key: editKey })).json()) === true;
  /* deleting a page or draft also removes the photos and songs it uploaded (only files uploaded while signed in can be removed) */
  B.deletePage = async (id, data) => {
    if ((await (await rpc('delete_my_page', { p_id: id })).json()) !== true) throw new Error('Could not delete this page.');
    await B.removeMedia(data, id + '/');
  };
  B.saveDraft = async (id, obj) => { if ((await (await rpc('save_draft', { p_id: id, p_data: obj })).json()) !== true) throw new Error('Could not save this draft.'); };
  B.getDraft = async id => /^[A-Za-z0-9]{6,20}$/.test(id || '') ? (await (await rpc('get_draft', { p_id: id })).json()) || null : null;
  B.accountDrafts = async () => (await (await rpc('my_drafts')).json()) || [];
  B.deleteDraft = async (id, data, keepFiles) => {
    await rpc('delete_draft', { p_id: id });
    if (!keepFiles) await B.removeMedia(data, 'drafts/' + id + '/');
  };
  /* best effort: files the page points at, plus anything left in its folder (photos that were replaced while editing) */
  B.removeMedia = async (data, folder) => {
    try {
      await B.fresh(); if (!B.signedIn()) return 0;
      const pre = B.publicUrl(''), paths = new Set();
      (function walk(v) { if (typeof v === 'string') { if (v.startsWith(pre)) paths.add(decodeURIComponent(v.slice(pre.length).split(/[?#]/)[0])); } else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(data);
      if (folder) {
        const r = await net(base() + '/storage/v1/object/list/media', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefix: folder, limit: 1000, offset: 0 }) });
        if (r.ok) ((await r.json()) || []).forEach(f => { if (f && f.id && f.name) paths.add(folder + f.name); });
      }
      if (!paths.size) return 0;
      const r = await net(base() + '/storage/v1/object/media', { method: 'DELETE', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: [...paths] }) });
      return r.ok ? ((await r.json().catch(() => [])) || []).length : 0;
    } catch (_) { return 0; }
  };
  /* after signing in, pages made on this device before move into the account */
  B.claimDevicePages = async () => {
    for (const p of B.myPages()) {
      if (p.claimed === (B.user() || {}).id) continue;
      try { if (await B.claimPage(p.id, p.key)) B.rememberPage(Object.assign({}, p, { claimed: B.user().id })); } catch (_) {}
    }
  };

  B.createPage = async (id, editKey, obj) => rpc('create_page', { p_id: id, p_key: editKey, p_data: obj });
  B.updatePage = async (id, editKey, obj) => {
    const r = await rpc('update_page', { p_id: id, p_key: editKey || '', p_data: obj });
    if ((await r.json()) !== true) throw new Error(B.signedIn() ? 'This page belongs to a different account.' : 'Sign in to the account that owns this page to edit it.');
  };
  B.getPage = async id => {
    if (!/^[A-Za-z0-9]{6,20}$/.test(id || '')) return null;
    const r = await rpc('get_page', { p_id: id });
    return (await r.json()) || null;
  };

  /* Upload every picture/song the visitor added (blob: urls) into `folder`.
     `onStep(done, total)` reports progress. Returns a Map of blob url -> public url. */
  B.uploadBlobMap = async (obj, folder, onStep) => {
    const found = new Map(); // blob url -> uploaded url
    (function walk(v) { if (typeof v === 'string') { if (u.isBlobUrl(v)) found.set(v, null); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(obj);
    const list = [...found.keys()]; let done = 0, n = 0; onStep && onStep(0, list.length);
    const queue = list.slice();
    const worker = async () => {
      while (queue.length) {
        const bu = queue.shift(), info = u.blobs.get(bu);
        if (!info) throw new Error('A picture you added is no longer available. Please add it again.');
        const path = folder + '/' + (++n) + '-' + rnd(8, ABC) + '.' + info.ext;
        found.set(bu, await B.upload(info.blob, path, info.blob.type)); onStep && onStep(++done, list.length);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return found;
  };
  /* returns a copy of the data with real urls */
  B.uploadBlobs = async (obj, pageId, onStep) => {
    const found = await B.uploadBlobMap(obj, pageId, onStep);
    return (function swap(v) {
      if (typeof v === 'string') return found.has(v) ? found.get(v) : v;
      if (Array.isArray(v)) return v.map(swap);
      if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = swap(v[k]); return o; }
      return v;
    })(obj);
  };
  /* swaps uploaded blob urls for their public address inside the same objects (so the open editor keeps working on them) */
  B.swapUrls = (obj, found) => {
    if (!found || !found.size || !obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) { const v = obj[k]; if (typeof v === 'string') { if (found.has(v)) obj[k] = found.get(v); } else B.swapUrls(v, found); }
  };

  /* ---- pages made on this device (so they can be opened or edited again) ---- */
  const LS = 'ks.pages';
  B.myPages = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (_) { return []; } };
  B.rememberPage = rec => { try { const l = B.myPages().filter(x => x.id !== rec.id); l.unshift(rec); localStorage.setItem(LS, JSON.stringify(l.slice(0, 50))); } catch (_) {} };
  B.forgetPage = id => { try { localStorage.setItem(LS, JSON.stringify(B.myPages().filter(x => x.id !== id))); } catch (_) {} };
  B.pageLink = id => location.href.split(/[?#]/)[0].replace(/index\.html$/, '') + '?p=' + id;
})();
