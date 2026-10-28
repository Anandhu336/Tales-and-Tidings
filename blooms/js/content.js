/* Blooms by Bincy: the shop details, bouquets, photos and dates saved from the admin page (admin/).
   blooms/shop-data.js holds the built-in version. If the admin has saved changes, they replace it here,
   so every page sees the admin's version. If the database cannot be reached, the built-in version is used.
   Needs ../config.js and shop-data.js first. Sets window.BloomsContent: a promise that settles when the shop data is ready. */
(function () {
  'use strict';
  const S = window.BLOOMS = window.BLOOMS || {};
  const cfg = window.KS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/+$/, ''), key = String(cfg.SUPABASE_ANON_KEY || '');
  const done = () => S;
  if (!/^https?:\/\//.test(base) || key.length < 20) { window.BloomsContent = Promise.resolve(S); return; }

  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
  const ask = fetch(base + '/rest/v1/rpc/get_content', { method: 'POST', headers: h, body: JSON.stringify({ p_key: 'blooms' }) })
    .then(r => r.ok ? r.json() : null)
    .then(saved => { if (saved && typeof saved === 'object' && Array.isArray(saved.products)) Object.assign(S, saved); return S; });
  // a slow connection should not keep the bouquets from showing: after 3 seconds, carry on with the built-in version
  const wait = new Promise(r => setTimeout(r, 3000));
  window.BloomsContent = Promise.race([ask, wait]).then(done, done);
})();
