/* Tales & Blooms admin page: one place, one sign-in, for both sides of the site.
   - Overview:    how many invitation pages, drafts and accounts there are.
   - Bouquets:    Blooms by Bincy's bouquets and prices, wedding dates, banner photos, shop details, colour stories, categories.
                  Saved in the database (site_content, key 'blooms'); the shop reads it from there (blooms/js/content.js).
                  blooms/shop-data.js is the built-in starting point.
   - Invitations: every published invitation page, with search, open and delete.
   Only accounts listed in the admins table can use it: supabase/admin.sql and SETUP.md ("The admin page"). */
(function () {
  'use strict';
  const KS = window.KS, B = KS.backend, u = KS.util, el = u.el;
  const root = document.getElementById('adm');
  const BUILT_IN = u.clone(window.BLOOMS || {});
  const SITE = '../', PHOTOS = '../assets/blooms/photos/', ILLUS = '../assets/blooms/illus/', ICONS = '../assets/blooms/icons/';
  const base = () => String(KS.config.SUPABASE_URL || '').replace(/\/+$/, ''), key = () => String(KS.config.SUPABASE_ANON_KEY || '');

  /* ---------- talking to the database ---------- */
  async function rpc(fn, args) {
    await B.fresh();
    const s = B.session(), h = { apikey: key(), 'Content-Type': 'application/json' };
    if (s && s.access_token) h.Authorization = 'Bearer ' + s.access_token; else if (/^eyJ/.test(key())) h.Authorization = 'Bearer ' + key();
    let res;
    try { res = await fetch(base() + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(args || {}) }); }
    catch (_) { throw new Error(navigator.onLine === false ? 'You seem to be offline. Connect to the internet and try again.' : 'Could not reach the database. The Supabase project may be paused: open the Supabase dashboard and restore it.'); }
    // a function that does not exist yet: supabase/admin.sql has not been run
    if (res.status === 404) throw Object.assign(new Error('The admin part of the database is not set up yet.'), { missing: true });
    if (!res.ok) { let m = ''; try { const j = await res.json(); m = j.message || j.msg || ''; } catch (_) {} throw new Error(m || 'The database said ' + res.status + '.'); }
    return res.status === 204 ? null : res.json();
  }

  /* ---------- small helpers ---------- */
  const when = x => x ? new Date(x).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const day = x => x ? new Date(x).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const longDay = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const rupees = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const pad = n => String(n).padStart(2, '0');
  const slug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'item';
  const uniqueId = (name, taken) => { let id = slug(name), n = 2; while (taken.includes(id)) id = slug(name) + '-' + n++; return id; };
  const isUrl = x => /^https:\/\//.test(x || '');
  const heroThumb = img => isUrl(img) ? img : PHOTOS + img + '-wide-800.jpg';
  const cardThumb = p => isUrl(p.image) ? p.image : p.image ? PHOTOS + p.image + '-400.jpg' : p.illus ? ILLUS + p.illus : '';
  const todayIso = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  // the drawings that come with the site, for bouquets without a photo
  const DRAWINGS = [...new Set((BUILT_IN.products || []).map(p => p.illus).filter(Boolean))];
  let fid = 0;

  const shell = (...kids) => { root.textContent = ''; root.append(...kids); };
  const brand = () => el('a', { class: 'adm-brand', href: '#overview' }, el('span', {}, 'Tales ', el('em', {}, '&'), ' Blooms'), el('small', {}, 'Admin'));
  const section = (title, help, ...kids) => el('section', { class: 'adm-card' },
    el('div', { class: 'adm-card-head' }, el('h2', {}, title), help ? el('p', { class: 'adm-help' }, help) : null), ...kids);
  const field = (label, input, hint) => {
    input.id = input.id || 'f' + (++fid);
    return el('div', { class: 'adm-field' }, el('label', { for: input.id }, label), input, hint ? el('small', {}, hint) : null);
  };
  const head = (title, help, ...act) => el('div', { class: 'adm-head' }, el('div', {}, el('h1', {}, title), help ? el('p', { class: 'adm-help' }, help) : null), act.length ? el('div', { class: 'adm-head-act' }, ...act) : null);
  const loading = () => el('p', { class: 'adm-help adm-pad' }, 'Loading…');
  const errBox = (e, retry) => el('div', { class: 'adm-err' }, el('p', {}, e.message || 'Something went wrong.'),
    retry ? el('button', { class: 'adm-btn', type: 'button', onclick: retry }, 'Try again') : null);
  const ext = href => ({ href, target: '_blank', rel: 'noopener' });
  /* up and down buttons for a list: fn(-1) or fn(+1) */
  const moveBtns = (i, n, what, fn) => [
    el('button', { class: 'adm-icon', type: 'button', 'aria-label': 'Move ' + what + ' up', disabled: i === 0, onclick: () => fn(-1) }, '↑'),
    el('button', { class: 'adm-icon', type: 'button', 'aria-label': 'Move ' + what + ' down', disabled: i === n - 1, onclick: () => fn(1) }, '↓')];
  const move = (arr, i, dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  /* photos are made smaller in the browser before uploading, so the shop stays fast */
  async function shrink(file, maxW) {
    if (!/^image\//.test(file.type || '')) throw new Error('Please choose a photo (JPG, PNG or WebP).');
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) {
      src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that photo. Try a JPG.')); i.src = URL.createObjectURL(file); });
    }
    const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight, k = Math.min(1, maxW / w0);
    const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.84));
    if (!blob) throw new Error('Could not prepare that photo. Try a different one.');
    return { blob, w: c.width, h: c.height };
  }
  const uploadPhoto = async (file, maxW) => {
    const { blob, w, h } = await shrink(file, maxW);
    return { url: await B.upload(blob, 'blooms/' + Date.now().toString(36) + '-' + B.newId() + '.jpg', 'image/jpeg'), w, h };
  };
  /* a hidden file picker opened by a normal button */
  const picker = (label, onFile, cls) => {
    const input = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: () => { const f = input.files[0]; input.value = ''; if (f) onFile(f, btn); } });
    const btn = el('button', { class: 'adm-btn ' + (cls || ''), type: 'button', onclick: () => input.click() }, label);
    return el('span', {}, btn, input);
  };

  /* ---------- start: connected? signed in? an admin? ---------- */
  async function boot() {
    if (!B.configured()) return shell(el('main', { class: 'adm-auth' }, el('div', { class: 'adm-auth-card' }, brand(), el('h1', {}, 'Not connected yet'),
      el('p', { class: 'adm-help' }, 'Fill in config.js with your Supabase details first (SETUP.md, steps 1 to 4).'))));
    if (!B.signedIn() || !(await B.fresh())) return signIn();
    let ok = false;
    try { ok = (await rpc('is_admin')) === true; } catch (e) { return notReady(e); }
    if (!ok) return notAdmin();
    window.onhashchange = render;
    render();
  }

  function signIn(note) {
    const email = el('input', { type: 'email', autocomplete: 'username', required: true, inputmode: 'email' });
    const pass = el('input', { type: 'password', autocomplete: 'current-password', required: true });
    const msg = el('p', { class: 'adm-msg', role: 'status' }, note || '');
    const btn = el('button', { class: 'adm-btn solid big', type: 'submit' }, 'Sign in');
    shell(el('main', { class: 'adm-auth' }, el('div', { class: 'adm-auth-card' }, brand(),
      el('h1', {}, 'Admin sign-in'), el('p', { class: 'adm-help' }, 'Use the same account you use on the site.'),
      el('form', { class: 'adm-form', novalidate: true, onsubmit: async e => {
        e.preventDefault();
        if (!email.value.trim() || !pass.value) { msg.textContent = 'Please fill in your email and password.'; msg.className = 'adm-msg err'; return; }
        btn.disabled = true; msg.className = 'adm-msg'; msg.textContent = 'Signing in…';
        try { await B.signIn(email.value.trim(), pass.value); boot(); }
        catch (err) { btn.disabled = false; msg.textContent = err.message; msg.className = 'adm-msg err'; }
      } }, field('Email', email), field('Password', pass), btn, msg),
      el('p', { class: 'adm-help small' }, 'Forgot your password? ', el('a', { href: SITE + '#/account' }, 'Reset it on the main site'), '.'))));
    email.focus();
  }

  const signOutBtn = () => el('button', { class: 'adm-link', type: 'button', onclick: async () => {
    if (isDirty() && !confirm('You have bouquet changes that are not saved. Sign out anyway?')) return;
    await B.signOut(); shop = null; window.onhashchange = null; signIn('Signed out.');
  } }, 'Sign out');

  function notAdmin() {
    const who = (B.user() || {}).email || 'your-email@example.com';
    const sql = "insert into public.admins (user_id) select id from auth.users where email = '" + who.replace(/'/g, "''") + "';";
    shell(el('main', { class: 'adm-auth' }, el('div', { class: 'adm-auth-card wide' }, brand(),
      el('h1', {}, 'This account is not an admin yet'),
      el('p', { class: 'adm-help' }, 'You are signed in as ', el('b', {}, who), '. To let this account use the admin page, open your Supabase project, click SQL Editor, then New query, paste this line and press Run:'),
      el('pre', { class: 'adm-code' }, sql),
      el('div', { class: 'adm-row-act' },
        el('button', { class: 'adm-btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(sql); u.toast('Copied'); } catch (_) { u.toast('Select the line and copy it'); } } }, 'Copy the line'),
        el('button', { class: 'adm-btn solid', type: 'button', onclick: boot }, 'I have done it, check again')),
      el('p', { class: 'adm-help small' }, 'Wrong account? ', signOutBtn()))));
  }

  function notReady(e) {
    shell(el('main', { class: 'adm-auth' }, el('div', { class: 'adm-auth-card wide' }, brand(),
      el('h1', {}, e.missing ? 'One setup step left' : 'Could not open the admin page'),
      e.missing ? el('p', { class: 'adm-help' }, 'The database does not have the admin part yet. In Supabase, click SQL Editor, then New query, paste everything from the file supabase/admin.sql and press Run. Then come back here.')
        : el('p', { class: 'adm-help' }, e.message),
      el('div', { class: 'adm-row-act' }, el('button', { class: 'adm-btn solid', type: 'button', onclick: boot }, 'Try again'), signOutBtn()))));
  }

  /* ---------- the signed-in admin page ---------- */
  const TABS = [['overview', 'Overview'], ['bouquets', 'Bouquets'], ['invitations', 'Invitations']];
  const tab = () => { const t = location.hash.replace(/^#\/?/, ''); return TABS.some(x => x[0] === t) ? t : 'overview'; };

  function render() {
    const t = tab(), main = el('main', { class: 'adm-main', id: 'main' });
    document.title = TABS.find(x => x[0] === t)[1] + ' | Admin | Tales & Blooms';
    shell(topbar(t), main);
    ({ overview, bouquets, invitations })[t](main);
    window.scrollTo(0, 0);
  }

  function topbar(t) {
    return el('header', { class: 'adm-top' }, el('div', { class: 'adm-top-in' },
      brand(),
      el('nav', { class: 'adm-tabs', 'aria-label': 'Admin sections' }, TABS.map(([id, label]) =>
        el('a', { href: '#' + id, 'aria-current': id === t ? 'page' : null, class: id === 'bouquets' && isDirty() ? 'is-dirty' : null }, label))),
      el('div', { class: 'adm-who' }, el('span', {}, (B.user() || {}).email || ''), signOutBtn())));
  }

  /* ---------- overview ---------- */
  async function overview(main) {
    const stat = (n, label, note) => el('div', { class: 'adm-stat' }, el('b', {}, n), el('span', {}, label), note ? el('small', {}, note) : null);
    const stats = el('div', { class: 'adm-stats' }, stat('…', 'Invitation pages'), stat('…', 'Drafts in progress'), stat('…', 'Accounts'), stat('…', 'Bouquets in the shop'));
    const tile = (href, eyebrow, title, text, go) => el('a', { class: 'adm-tile', href }, el('span', { class: 'adm-eyebrow' }, eyebrow), el('h2', {}, title), el('p', {}, text), el('span', { class: 'adm-go' }, go));
    main.append(
      head('Welcome back', 'Tales & Tidings invitations and Blooms by Bincy bouquets, managed in one place.'),
      stats,
      el('div', { class: 'adm-tiles' },
        tile('#bouquets', 'Blooms by Bincy', 'Bouquets', 'Bouquets and prices, blocked wedding dates, banner photos, WhatsApp number and colour stories.', 'Manage bouquets →'),
        tile('#invitations', 'Tales & Tidings', 'Invitations', 'Every published invitation page: search by name or email, open one, or remove it.', 'See invitation pages →')),
      el('div', { class: 'adm-links' }, el('a', ext(SITE), 'Open the home page ↗'), el('a', ext(SITE + 'blooms/'), 'Open the bouquet shop ↗')));
    try {
      const [s] = await Promise.all([rpc('admin_stats'), shop ? null : loadShop().catch(() => null)]);
      const live = shop ? shop.data.products.filter(p => !p.hidden).length : '–';
      stats.replaceChildren(
        stat(s.pages, 'Invitation pages', s.pages_30d + ' new in the last 30 days'),
        stat(s.drafts, 'Drafts in progress'),
        stat(s.accounts, 'Accounts', s.accounts_30d + ' new in the last 30 days'),
        stat(live, 'Bouquets in the shop', shop && !shop.fromDb ? 'from the built-in list' : null));
    } catch (e) { stats.replaceWith(errBox(e, render)); }
  }

  /* ---------- bouquets ---------- */
  let shop = null; // { data, savedJson, info: { updated_at, updated_by_email }, fromDb }
  const isDirty = () => !!shop && JSON.stringify(shop.data) !== shop.savedJson;
  let bar = null;

  async function loadShop() {
    const [saved, info] = await Promise.all([rpc('get_content', { p_key: 'blooms' }), rpc('admin_content_info', { p_key: 'blooms' }).catch(() => [])]);
    const fromDb = !!(saved && Array.isArray(saved.products));
    const data = Object.assign(u.clone(BUILT_IN), fromDb ? saved : {});
    ['heroSlides', 'products', 'colourStories', 'categories', 'blockedDates'].forEach(k => { if (!Array.isArray(data[k])) data[k] = []; });
    data.products.sort((a, b) => a.no - b.no).forEach((p, i) => { p.no = i + 1; });
    shop = { data, savedJson: JSON.stringify(data), info: (info && info[0]) || null, fromDb };
  }

  /* something changed: update the save bar and the dot on the tab */
  function changed() {
    if (bar) bar.update();
    const a = document.querySelector('.adm-tabs a[href="#bouquets"]'); if (a) a.classList.toggle('is-dirty', isDirty());
  }

  async function bouquets(main) {
    if (!shop) {
      main.append(loading());
      try { await loadShop(); } catch (e) { main.textContent = ''; return main.append(errBox(e, render)); }
      if (tab() !== 'bouquets') return; // moved on while loading
      main.textContent = '';
    }
    const d = shop.data;
    main.append(
      head('Bouquets', 'Blooms by Bincy. Your changes show on the shop when you press Save changes.', el('a', Object.assign({ class: 'adm-btn' }, ext(SITE + 'blooms/')), 'Open the shop ↗')),
      ...[productsCard(d), datesCard(d), heroCard(d), detailsCard(d), storiesCard(d), categoriesCard(d), resetCard(), saveBar()].filter(Boolean));
  }

  function saveBar() {
    const status = el('span', { class: 'adm-status', role: 'status' });
    const discard = el('button', { class: 'adm-btn', type: 'button', onclick: () => {
      if (!confirm('Throw away the changes you have not saved?')) return;
      shop.data = JSON.parse(shop.savedJson); render();
    } }, 'Discard');
    const save = el('button', { class: 'adm-btn solid', type: 'button', onclick: saveShop }, 'Save changes');
    bar = el('div', { class: 'adm-savebar' }, el('div', { class: 'adm-savebar-in' }, status, el('div', { class: 'adm-savebar-act' }, discard, save)));
    bar.update = (note) => {
      const dirty = isDirty();
      bar.classList.toggle('is-dirty', dirty); discard.hidden = !dirty; save.disabled = !dirty;
      status.textContent = note || (dirty ? 'You have changes that are not on the shop yet.'
        : shop.info ? 'All saved · last saved ' + when(shop.info.updated_at) + (shop.info.updated_by_email ? ' by ' + shop.info.updated_by_email : '')
        : 'The shop shows the built-in list (blooms/shop-data.js). Saving here takes over from it.');
    };
    bar.save = save;
    bar.update();
    return bar;
  }

  /* things that would break the shop, checked before saving */
  function problems(d) {
    const out = [];
    if (d.whatsapp && !/^\d{10,15}$/.test(d.whatsapp)) out.push('WhatsApp number: digits only, starting with the country code, like 919876543210.');
    if (!(Number.isFinite(d.leadDays) && d.leadDays >= 0 && d.leadDays <= 365)) out.push('Book at least: a number of days from 0 to 365.');
    d.products.forEach(p => {
      if (!String(p.name || '').trim()) out.push('A bouquet has no name.');
      if (!(p.price >= 0)) out.push((p.name || 'A bouquet') + ': the price must be a number.');
    });
    if (!d.heroSlides.length) out.push('Keep at least one banner photo.');
    return out;
  }

  async function saveShop() {
    const d = shop.data, bad = problems(d);
    if (bad.length) { alert('Please fix this first:\n\n• ' + bad.join('\n• ')); return; }
    bar.save.disabled = true; bar.update('Saving…');
    try {
      const t = await rpc('admin_save_content', { p_key: 'blooms', p_data: d });
      shop.savedJson = JSON.stringify(d); shop.fromDb = true;
      shop.info = { updated_at: t || new Date().toISOString(), updated_by_email: (B.user() || {}).email || '' };
      changed(); u.toast('Saved. The shop now shows your changes.');
    } catch (e) { bar.save.disabled = false; bar.update('Not saved: ' + e.message); }
  }

  /* bouquets and prices */
  function productsCard(d) {
    const list = el('div', { class: 'adm-list' });
    const renumber = () => d.products.forEach((p, i) => { p.no = i + 1; });
    const draw = () => {
      list.textContent = '';
      d.products.forEach((p, i) => list.append(el('div', { class: 'adm-row' + (p.hidden ? ' is-hidden' : '') },
        el('div', { class: 'adm-thumb arch' + (p.image ? '' : ' is-drawing') }, cardThumb(p) ? el('img', { src: cardThumb(p), alt: '', loading: 'lazy' }) : null),
        el('div', { class: 'adm-row-info' },
          el('b', {}, p.name || 'Untitled'),
          el('small', {}, 'No. ' + pad(p.no) + (p.label ? ' · ' + p.label : '') + ' · from ' + rupees(p.price) + (p.per ? ' ' + p.per : '')),
          el('span', { class: 'adm-badges' }, p.featured ? el('span', { class: 'adm-badge' }, 'Featured') : null, p.hidden ? el('span', { class: 'adm-badge muted' }, 'Hidden') : null, p.image ? null : el('span', { class: 'adm-badge muted' }, 'No photo yet'))),
        el('div', { class: 'adm-row-act' },
          moveBtns(i, d.products.length, p.name, dir => { move(d.products, i, dir); renumber(); draw(); changed(); }),
          el('button', { class: 'adm-btn small', type: 'button', onclick: () => editProduct(d, p, draw) }, 'Edit')))));
    };
    draw();
    return section('Bouquets and prices', 'Edit a bouquet to change its name, price, colours or photo. The arrows set the order (and the No. on each card).', list,
      el('div', { class: 'adm-card-foot' }, el('button', { class: 'adm-btn', type: 'button', onclick: () => editProduct(d, null, draw) }, '+ Add a bouquet')));
  }

  function editProduct(d, p, redraw) {
    const isNew = !p;
    const f = isNew ? { name: '', label: '', category: (d.categories.find(c => c.id !== 'all') || { id: 'cascade' }).id, price: '', per: '',
      colours: ['#F4EEE2', '#E9B9C4', '#9BB08C'], stories: [], illus: DRAWINGS[0] || '', image: '', alt: '', tag: '', featured: false, hidden: false } : u.clone(p);
    if (!Array.isArray(f.colours)) f.colours = [];
    if (!Array.isArray(f.stories)) f.stories = [];

    const inp = (k, attrs) => el('input', Object.assign({ value: f[k] == null ? '' : f[k], oninput: e => { f[k] = e.target.value; } }, attrs || {}));
    const cats = d.categories.filter(c => c.id !== 'all').map(c => [c.id, c.name]);
    // categories some bouquets use that have no icon of their own (they show under "All bouquets")
    [...new Set(d.products.map(x => x.category))].filter(c => c && !cats.some(x => x[0] === c)).forEach(c => cats.push([c, c[0].toUpperCase() + c.slice(1) + ' (under All bouquets)']));
    const category = el('select', { onchange: e => { f.category = e.target.value; } }, cats.map(([id, name]) => el('option', { value: id, selected: id === f.category }, name)));

    const colours = el('div', { class: 'adm-swatches' });
    const drawColours = () => {
      colours.textContent = '';
      f.colours.forEach((c, i) => colours.append(el('span', { class: 'adm-swatch' },
        el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff', 'aria-label': 'Colour ' + (i + 1), oninput: e => { f.colours[i] = e.target.value.toUpperCase(); } }),
        el('button', { class: 'adm-icon', type: 'button', 'aria-label': 'Remove colour ' + (i + 1), onclick: () => { f.colours.splice(i, 1); drawColours(); } }, '×'))));
      if (f.colours.length < 6) colours.append(el('button', { class: 'adm-btn small', type: 'button', onclick: () => { f.colours.push('#FFFFFF'); drawColours(); } }, '+ Colour'));
    };
    drawColours();

    const stories = el('div', { class: 'adm-checks' }, d.colourStories.map(s => el('label', { class: 'adm-check' },
      el('input', { type: 'checkbox', checked: f.stories.includes(s.id), onchange: e => { f.stories = e.target.checked ? [...new Set(f.stories.concat(s.id))] : f.stories.filter(x => x !== s.id); } }),
      el('span', { class: 'adm-mini-dots' }, (s.colours || []).map(c => el('i', { style: 'background:' + c }))), s.name)));

    const photo = el('div', { class: 'adm-photo' }), done = el('button', { class: 'adm-btn solid', type: 'submit' }, isNew ? 'Add bouquet' : 'Done');
    const drawing = el('select', { onchange: e => { f.illus = e.target.value; drawPhoto(); } }, DRAWINGS.map(x => el('option', { value: x, selected: x === f.illus }, x.replace(/\.svg$/, '').replace(/-/g, ' '))));
    const drawPhoto = () => {
      photo.textContent = '';
      photo.append(el('div', { class: 'adm-thumb arch big' + (f.image ? '' : ' is-drawing') }, cardThumb(f) ? el('img', { src: cardThumb(f), alt: '' }) : null),
        el('div', { class: 'adm-photo-act' },
          el('p', { class: 'adm-help' }, f.image ? 'Shown on the card in the shop.' : 'No photo yet: the shop shows the drawing with “Photo coming soon”.'),
          picker(f.image ? 'Change photo' : 'Upload a photo', async (file, btn) => {
            btn.disabled = done.disabled = true; btn.textContent = 'Uploading…';
            try { f.image = (await uploadPhoto(file, 1000)).url; } catch (e) { u.toast(e.message); }
            done.disabled = false; drawPhoto();
          }),
          f.image ? el('button', { class: 'adm-link', type: 'button', onclick: () => { f.image = ''; drawPhoto(); } }, 'Remove photo') : null,
          f.image ? null : field('Drawing', drawing)));
    };
    drawPhoto();

    const msg = el('p', { class: 'adm-msg', role: 'status' });
    const dlg = el('dialog', { class: 'adm-dialog', 'aria-label': isNew ? 'Add a bouquet' : 'Edit ' + (p.name || 'bouquet') });
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.append(el('form', { class: 'adm-form', novalidate: true, onsubmit: e => {
      e.preventDefault();
      const name = String(f.name || '').trim(), price = Number(f.price);
      if (!name) { msg.textContent = 'Please give the bouquet a name.'; msg.className = 'adm-msg err'; return; }
      if (f.price === '' || !(price >= 0)) { msg.textContent = 'Please enter the starting price as a number, like 3500.'; msg.className = 'adm-msg err'; return; }
      const out = Object.assign({}, f, { name, price, label: String(f.label || '').trim() || (cats.find(c => c[0] === f.category) || [, ''])[1].replace(/ \(.*$/, '') });
      ['per', 'tag', 'alt', 'image', 'illus'].forEach(k => { out[k] = String(out[k] || '').trim(); if (!out[k]) delete out[k]; });
      ['featured', 'hidden'].forEach(k => { if (!out[k]) delete out[k]; });
      if (isNew) { out.id = uniqueId(name, d.products.map(x => x.id)); out.no = d.products.length + 1; d.products.push(out); }
      else { Object.keys(p).forEach(k => delete p[k]); Object.assign(p, out); }
      close(); redraw(); changed();
    } },
      // the heading takes the focus when the editor opens, so a phone keyboard does not pop up straight away
      el('div', { class: 'adm-dialog-head' }, el('h2', { tabindex: '-1', autofocus: true }, isNew ? 'Add a bouquet' : 'Edit bouquet'), el('button', { class: 'adm-icon', type: 'button', 'aria-label': 'Close', onclick: close }, '×')),
      field('Name', inp('name', { required: true, placeholder: 'The Lavender Cascade' })),
      el('div', { class: 'adm-2col' },
        field('Starting price (₹)', inp('price', { type: 'number', min: '0', step: '50', inputmode: 'numeric', placeholder: '3500' }), 'Shown as “From ₹…”'),
        field('After the price (optional)', inp('per', { placeholder: 'each' }))),
      el('div', { class: 'adm-2col' },
        field('Category', category, 'Which round icon shows it'),
        field('Type on the card', inp('label', { placeholder: 'Cascade' }), 'Shown after the No.')),
      field('Photo', photo),
      field('Photo description (optional)', inp('alt', { placeholder: 'A cascade bouquet with plum and ivory roses' }), 'Read out to people who cannot see the photo'),
      field('Colour dots on the card', colours),
      field('Colour stories it appears under', stories),
      el('div', { class: 'adm-2col' },
        field('Small label on the photo (optional)', inp('tag', { placeholder: 'Signature' })),
        el('div', { class: 'adm-field adm-checks col' },
          el('label', { class: 'adm-check' }, el('input', { type: 'checkbox', checked: !!f.featured, onchange: e => { f.featured = e.target.checked; } }), 'Featured: show it first'),
          el('label', { class: 'adm-check' }, el('input', { type: 'checkbox', checked: !!f.hidden, onchange: e => { f.hidden = e.target.checked; } }), 'Hide it from the shop for now'))),
      msg,
      el('div', { class: 'adm-dialog-foot' },
        isNew ? el('span') : el('button', { class: 'adm-link danger', type: 'button', onclick: () => {
          if (!confirm('Delete "' + (p.name || 'this bouquet') + '" from the shop? (It is only gone for good once you press Save changes.)')) return;
          d.products.splice(d.products.indexOf(p), 1); d.products.forEach((x, i) => { x.no = i + 1; });
          close(); redraw(); changed();
        } }, 'Delete bouquet'),
        el('span', { class: 'adm-row-act' }, el('button', { class: 'adm-btn', type: 'button', onclick: close }, 'Cancel'), done))));
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
    document.body.append(dlg); dlg.showModal();
  }

  /* wedding dates */
  function datesCard(d) {
    const lead = el('input', { type: 'number', min: '0', max: '365', inputmode: 'numeric', value: d.leadDays, oninput: e => { d.leadDays = e.target.value === '' ? '' : Number(e.target.value); changed(); } });
    const pick = el('input', { type: 'date', min: todayIso(), 'aria-label': 'Date to block' });
    const chips = el('div', { class: 'adm-chips' });
    const draw = () => {
      d.blockedDates.sort();
      chips.textContent = '';
      if (!d.blockedDates.length) chips.append(el('p', { class: 'adm-help' }, 'No blocked dates. Every date at least ' + (d.leadDays || 0) + ' days away shows as open.'));
      const past = d.blockedDates.filter(s => s < todayIso());
      d.blockedDates.forEach((s, i) => chips.append(el('span', { class: 'adm-chip' + (s < todayIso() ? ' past' : '') }, longDay(s),
        el('button', { type: 'button', 'aria-label': 'Unblock ' + longDay(s), onclick: () => { d.blockedDates.splice(i, 1); draw(); changed(); } }, '×'))));
      if (past.length) chips.append(el('button', { class: 'adm-link', type: 'button', onclick: () => { d.blockedDates = d.blockedDates.filter(s => s >= todayIso()); draw(); changed(); } }, 'Remove ' + past.length + ' past date' + (past.length > 1 ? 's' : '')));
    };
    draw();
    return section('Wedding dates', 'What the “Is your wedding date still open?” checker on the shop says.',
      el('div', { class: 'adm-2col' },
        field('Book at least (days ahead)', lead, '14 = two weeks'),
        el('div', { class: 'adm-field' }, el('label', { for: 'blk' }, 'Block a date (fully booked, holiday…)'),
          el('div', { class: 'adm-inline' }, Object.assign(pick, { id: 'blk' }),
            el('button', { class: 'adm-btn', type: 'button', onclick: () => {
              if (!pick.value) { pick.focus(); return; }
              if (!d.blockedDates.includes(pick.value)) d.blockedDates.push(pick.value);
              pick.value = ''; draw(); changed();
            } }, 'Block')))),
      chips);
  }

  /* banner photos at the top of the shop */
  function heroCard(d) {
    const list = el('div', { class: 'adm-list' });
    const FOCUS = [['', 'Middle'], ['25% 50%', 'Left side'], ['40% 50%', 'Left of middle'], ['60% 50%', 'Right of middle'], ['75% 50%', 'Right side']];
    const draw = () => {
      list.textContent = '';
      d.heroSlides.forEach((s, i) => list.append(el('div', { class: 'adm-row' },
        el('div', { class: 'adm-thumb wide' }, el('img', { src: heroThumb(s.image), alt: '', loading: 'lazy' })),
        el('div', { class: 'adm-row-info grow' },
          field('Photo description', el('input', { value: s.alt || '', placeholder: 'A bride holding a cascade bouquet at sunset', oninput: e => { s.alt = e.target.value; changed(); } })),
          field('Keep in view on phones', el('select', { onchange: e => { if (e.target.value) s.focus = e.target.value; else delete s.focus; changed(); } },
            FOCUS.map(([v, l]) => el('option', { value: v, selected: (s.focus || '') === v || (!FOCUS.some(x => x[0] === (s.focus || '')) && v === '') }, l))))),
        el('div', { class: 'adm-row-act' },
          moveBtns(i, d.heroSlides.length, 'photo ' + (i + 1), dir => { move(d.heroSlides, i, dir); draw(); changed(); }),
          el('button', { class: 'adm-link danger', type: 'button', disabled: d.heroSlides.length < 2, onclick: () => { d.heroSlides.splice(i, 1); draw(); changed(); } }, 'Remove')))));
    };
    draw();
    return section('Banner photos', 'The big photos at the top of the shop. They fade from one to the next; the first shows first. Wide (landscape) photos work best.', list,
      el('div', { class: 'adm-card-foot' }, picker('+ Add a photo', async (file, btn) => {
        btn.disabled = true; btn.textContent = 'Uploading…';
        try {
          const up = await uploadPhoto(file, 1600);
          if (up.w < up.h) u.toast('Tip: this photo is tall. Wide photos fill the banner better.');
          d.heroSlides.push({ image: up.url, alt: '' }); draw(); changed();
        } catch (e) { u.toast(e.message); }
        btn.disabled = false; btn.textContent = '+ Add a photo';
      }), el('small', { class: 'adm-help' }, 'Only use photos Bincy took or has permission to use.')));
  }

  /* shop details */
  function detailsCard(d) {
    const inp = (k, attrs) => el('input', Object.assign({ value: d[k] || '', oninput: e => { d[k] = e.target.value.trim(); changed(); } }, attrs || {}));
    return section('Shop details', 'Used by the WhatsApp buttons, the footer and the Instagram links.',
      el('div', { class: 'adm-2col' },
        field('WhatsApp number', inp('whatsapp', { inputmode: 'numeric', placeholder: '919876543210', oninput: e => { e.target.value = e.target.value.replace(/\D/g, ''); d.whatsapp = e.target.value; changed(); } }), 'Country code then number, digits only. Empty: customers pick who to message.'),
        field('Phone number as shown', inp('phoneDisplay', { placeholder: '+91 98765 43210' }))),
      el('div', { class: 'adm-2col' },
        field('Email', inp('email', { type: 'email', placeholder: 'hello@example.com' })),
        field('Instagram name', inp('instagram', { placeholder: 'blooms_by_bincy' }), 'Without the @')),
      field('Place', inp('place', { placeholder: 'Adimali, Idukki, Kerala' })),
      field('First WhatsApp message', el('textarea', { rows: '2', oninput: e => { d.whatsappHello = e.target.value; changed(); } }, d.whatsappHello || ''), 'What a WhatsApp button starts the chat with'));
  }

  /* colour stories: the chips under the bouquet categories */
  function storiesCard(d) {
    const list = el('div', { class: 'adm-list' });
    const draw = () => {
      list.textContent = '';
      d.colourStories.forEach((s, i) => list.append(el('div', { class: 'adm-row' },
        el('div', { class: 'adm-row-info grow' }, field('Name', el('input', { value: s.name || '', oninput: e => { s.name = e.target.value; changed(); } }))),
        el('div', { class: 'adm-swatches' }, (s.colours || []).map((c, k) => el('span', { class: 'adm-swatch' },
          el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff', 'aria-label': (s.name || 'Colour story') + ' colour ' + (k + 1), oninput: e => { s.colours[k] = e.target.value.toUpperCase(); changed(); } })))),
        el('div', { class: 'adm-row-act' },
          moveBtns(i, d.colourStories.length, s.name, dir => { move(d.colourStories, i, dir); draw(); changed(); }),
          el('button', { class: 'adm-link danger', type: 'button', onclick: () => {
            if (!confirm('Remove the colour story "' + s.name + '"? Bouquets stay in the shop.')) return;
            d.colourStories.splice(i, 1); d.products.forEach(p => { p.stories = (p.stories || []).filter(x => x !== s.id); });
            draw(); changed();
          } }, 'Remove')))));
    };
    draw();
    return section('Colour stories', '“Shop by colour story” chips. Choose which bouquets show under each one when you edit a bouquet.', list,
      el('div', { class: 'adm-card-foot' }, el('button', { class: 'adm-btn', type: 'button', onclick: () => {
        const name = (prompt('Name of the new colour story, e.g. Sage & Ivory') || '').trim(); if (!name) return;
        d.colourStories.push({ id: uniqueId(name, d.colourStories.map(x => x.id)), name, colours: ['#F4EEE2', '#E9B9C4', '#9BB08C'] }); draw(); changed();
      } }, '+ Add a colour story')));
  }

  /* categories: rename only (each one has its own drawn icon) */
  function categoriesCard(d) {
    return section('Categories', 'The round icons above the bouquets. You can rename them here; a new category needs a new icon drawn first.',
      el('div', { class: 'adm-cats' }, d.categories.map(c => el('div', { class: 'adm-cat' },
        el('img', { src: ICONS + c.icon, alt: '', width: '44', height: '44' }),
        el('input', { value: c.name || '', 'aria-label': 'Name of the ' + c.id + ' category', oninput: e => { c.name = e.target.value; changed(); } })))));
  }

  function resetCard() {
    if (!shop.fromDb) return null;
    return el('details', { class: 'adm-card adm-danger' }, el('summary', {}, 'Go back to the built-in list'),
      el('p', { class: 'adm-help' }, 'Removes everything saved here, so the shop shows blooms/shop-data.js again. Uploaded photos stay in storage.'),
      el('button', { class: 'adm-btn danger', type: 'button', onclick: async () => {
        if (!confirm('Remove all saved bouquet changes and go back to the built-in list? This cannot be undone.')) return;
        try { await rpc('admin_reset_content', { p_key: 'blooms' }); shop = null; u.toast('The shop is back to the built-in list.'); render(); } catch (e) { u.toast(e.message); }
      } }, 'Go back to the built-in list'));
  }

  /* ---------- invitation pages ---------- */
  const TPL = { garden: 'Night garden letter', quest: 'Little love quest', 'ask-date': 'Will you go out with me?', 'ask-sorry': 'I’m sorry (please?)', birthday: 'Birthday party',
    wedding: 'Classic floral wedding', 'wedding-hindu': 'Hindu wedding', 'wedding-muslim': 'Muslim wedding (Nikah)', 'wedding-christian': 'Christian wedding', 'wedding-modern': 'Modern minimal wedding', celestial: 'Celestial traditional wedding' };
  const pageTitle = data => {
    const d = (data && data.d) || {};
    if (d.name1 || d.name2) return [d.name1, d.name2].filter(Boolean).join(' & ');
    if (d.name) return 'Happy birthday, ' + d.name;
    if (d.to) return 'For ' + d.to + (d.from ? ', from ' + d.from : '');
    return 'Untitled page';
  };
  const pageLink = id => new URL(SITE + '?p=' + encodeURIComponent(id), location.href).href;

  async function invitations(main) {
    const PER = 30;
    const q = el('input', { type: 'search', placeholder: 'Names, email or page id', 'aria-label': 'Search invitation pages', enterkeyhint: 'search' });
    const list = el('div', { class: 'adm-list' }), count = el('p', { class: 'adm-help', role: 'status' });
    const more = el('button', { class: 'adm-btn', type: 'button', hidden: true, onclick: () => load(false) }, 'Show more');
    let offset = 0, total = 0;
    main.append(
      head('Invitations', 'Every published Tales & Tidings page. Deleting one removes it for everyone, with its photos and songs.', el('a', Object.assign({ class: 'adm-btn' }, ext(SITE)), 'Open the home page ↗')),
      el('section', { class: 'adm-card' },
        el('form', { class: 'adm-inline adm-search', role: 'search', onsubmit: e => { e.preventDefault(); load(true); } }, q, el('button', { class: 'adm-btn solid', type: 'submit' }, 'Search')),
        count, list, el('div', { class: 'adm-card-foot' }, more)));

    const row = p => {
      const d = p.data || {}, link = pageLink(p.id);
      const r = el('div', { class: 'adm-row' },
        el('div', { class: 'adm-row-info grow' },
          el('b', {}, pageTitle(d)),
          el('small', {}, (TPL[d.t] || d.t || 'Page') + ' · ' + p.id),
          el('small', {}, (p.owner_email ? p.owner_email : 'Made without an account') + ' · published ' + day(p.created_at) + (p.updated_at !== p.created_at ? ' · changed ' + day(p.updated_at) : ''))),
        el('div', { class: 'adm-row-act' },
          el('a', Object.assign({ class: 'adm-btn small' }, ext(link)), 'View'),
          el('button', { class: 'adm-btn small', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); u.toast('Link copied'); } catch (_) { u.toast(link); } } }, 'Copy link'),
          el('button', { class: 'adm-link danger', type: 'button', onclick: async () => {
            if (!confirm('Delete "' + pageTitle(d) + '" (' + p.id + ') and its photos and songs? The link stops working for everyone. This cannot be undone.')) return;
            try {
              if ((await rpc('admin_delete_page', { p_id: p.id })) !== true) throw new Error('That page was already gone.');
              await B.removeMedia(d, p.id + '/');
              r.remove(); total--; offset--; count.textContent = total + ' page' + (total === 1 ? '' : 's'); u.toast('Page deleted');
            } catch (e) { u.toast(e.message); }
          } }, 'Delete')));
      return r;
    };

    async function load(reset) {
      if (reset) { offset = 0; list.textContent = ''; }
      more.hidden = true; count.textContent = 'Loading…';
      try {
        const rows = (await rpc('admin_pages', { p_search: q.value.trim(), p_limit: PER, p_offset: offset })) || [];
        total = rows.length ? Number(rows[0].total) : (reset ? 0 : total);
        offset += rows.length;
        rows.forEach(p => list.append(row(p)));
        count.textContent = total ? total + ' page' + (total === 1 ? '' : 's') + (q.value.trim() ? ' found' : '') : (q.value.trim() ? 'No pages match “' + q.value.trim() + '”.' : 'No published pages yet.');
        more.hidden = offset >= total;
      } catch (e) { count.textContent = ''; list.append(errBox(e, () => load(true))); }
    }
    load(true);
  }

  window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });
  boot();
})();
