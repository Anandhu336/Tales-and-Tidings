/* Tales & Tidings editor: turns a template's `schema` into a form. Every field type a template can use lives here.
   Field types: text, textarea, date, time, choice, color, toggle, image, place, repeater, reset, sticker.
   choice: `resets: [keys]` clears those keys when picked; `default` is the value shown when nothing is picked; options may carry `f` (a font to show the label in).
   sticker: a grid of animated stickers to pick one from (`options`: list of emoji; `none`: label for an empty "use the default" choice).
   choice `options` may be a function(data) so the list follows the rest of the form.  color: `default` may be a function(data).  reset: button that clears `keys`.
   Arranging by page (opts.layout = 'page', opts.pagesOf(data) -> [[id, label]]): a field (or a whole section) says which page it is on with
   `page: 'id'` or `page: data => 'id'`. A repeater whose items are pages has `itemPage(data, i) -> id`, `groupTitle` and `after` (the page it follows);
   other fields join its card with `page: <its key>`. `sayFor: 'id'` marks the field that holds what the guide says on that page.
   A section with `extras: true` is the old "Page by page" list: in the page layout each page card has its own guide and photos instead. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util, el = u.el;

  const uid = (() => { let n = 0; return () => 'f' + (++n); })();

  function fieldBlock(f, control, extraClass) {
    const id = f._id;
    return el('div', { class: 'field ' + (extraClass || '') },
      f.label && f.type !== 'toggle' ? el('label', { class: 'lbl', for: id }, f.label) : null,
      control,
      f.help ? el('p', { class: 'help' }, f.help) : null);
  }

  /* a sticker button inside a text box: opens a picker and drops the chosen emoji in at the cursor */
  function withStickers(f, box) {
    const groups = (KS.cute && KS.cute.STICKER_GROUPS) || [['All', [...u.STK].map(c => String.fromCodePoint(...c.split('_').map(h => parseInt(h, 16))))]];
    let pan = null, at = 0;
    const insert = e => {
      const s = box.selectionStart == null ? box.value.length : box.selectionStart, end = box.selectionEnd == null ? s : box.selectionEnd;
      box.setRangeText(e, s, end, 'end');
      if (!u.LITE) box.focus(); // on phones, don't pop the keyboard over the picker
      box.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const draw = () => {
      pan.textContent = '';
      pan.append(el('div', { class: 'emo-tabs', role: 'tablist' }, groups.map(([l], i) => el('button', { type: 'button', class: 'emo-tab', role: 'tab', 'aria-selected': String(i === at), onclick: () => { at = i; draw(); } }, l)),
          el('button', { type: 'button', class: 'emo-tab done', onclick: () => { pan.hidden = true; } }, 'Done')),
        el('div', { class: 'emo-grid' }, groups[at][1].map(e => el('button', { type: 'button', 'aria-label': 'Add ' + e, html: u.stk(e), onclick: () => insert(e) }))),
        el('p', { class: 'emo-tip' }, 'Tip: you can also type any emoji. They all animate on the page.'));
    };
    const btn = el('button', { type: 'button', class: 'emo-btn', title: 'Add a sticker', 'aria-label': 'Add a sticker', onclick: () => {
      if (!pan) { pan = el('div', { class: 'emo-pan' }); wrap.after(pan); draw(); } else pan.hidden = !pan.hidden;
    } }, '😊');
    const wrap = el('div', { class: 'emo' + (box.tagName === 'TEXTAREA' ? ' ta' : '') }, box, btn);
    return wrap;
  }

  KS.buildEditor = function (host, schema, data, onChange, opts) {
    opts = opts || {};
    const emoji = !!opts.emoji;
    const byPage = opts.layout === 'page' && typeof opts.pagesOf === 'function';
    let showers = []; // functions that re-check "show if" conditions
    const paths = new WeakMap([[data, '']]), setters = new Map(); // where each value lives ('steps.0.q'), and how to update its box
    const bindPath = (obj, key) => { const p = paths.get(obj); return p == null ? null : (p ? p + '.' : '') + key; };
    const sayKeys = {}; schema.forEach(sec => sec.fields.forEach(f => { if (f.sayFor) sayKeys[f.sayFor] = f.key; }));
    let shapeNow = '', waiting = false;
    const changed = () => { showers.forEach(fn => fn()); onChange(data); if (byPage) reshape(); };

    /* ---- per-page guide, words and photos (kept in data.pages, the same list the "Page by page" section edits) ---- */
    const extrasOf = id => (Array.isArray(data.pages) ? data.pages : []).filter(x => x && x.at === id);
    const isPhoto = x => x.kind === 'photo' || !!x.photo;
    const extraOf = id => { const r = { guide: '', say: '' }; extrasOf(id).forEach(x => { if (!r.guide && x.guide) r.guide = x.guide; if (!r.say && (x.say || '').trim()) r.say = x.say; }); return r; };
    function setExtra(id, k, v) {
      if (!Array.isArray(data.pages)) data.pages = [];
      const all = extrasOf(id); let main = all.find(x => !isPhoto(x));
      all.forEach(x => { if (x !== main) x[k] = ''; }); // one place decides, so old entries cannot win over the new value
      if (!main) { if (!v) return; main = { at: id, guide: '', say: '', photo: '', caption: '' }; data.pages.push(main); }
      main[k] = v;
      if (!main.guide && !(main.say || '').trim() && !main.caption) data.pages.splice(data.pages.indexOf(main), 1);
    }
    const getSay = id => extraOf(id).say || (sayKeys[id] ? data[sayKeys[id]] || '' : '');
    function setSay(id, v) {
      if (sayKeys[id]) { data[sayKeys[id]] = v; setExtra(id, 'say', ''); const st = setters.get(sayKeys[id]); if (st) st(v, true); }
      else setExtra(id, 'say', v);
    }

    function control(f, obj) {
      f._id = f._id || uid();
      const key = f.key;
      switch (f.type) {
        case 'text': case 'date': case 'time': {
          const i = el('input', { type: f.type, id: f._id, maxlength: f.type === 'text' ? (f.max || 120) : null, placeholder: f.placeholder || '', autocomplete: 'off', value: obj[key] || '' });
          i.addEventListener('input', () => { obj[key] = i.value; changed(); });
          bind(f, obj, i, v => { i.value = v; });
          return fieldBlock(f, emoji && f.type === 'text' && f.emoji !== false ? withStickers(f, i) : i);
        }
        case 'textarea': {
          const t = el('textarea', { id: f._id, rows: f.rows || 5, placeholder: f.placeholder || '' }); t.value = obj[key] || '';
          const cnt = f.lines ? el('span', { class: 'count' }) : null;
          const upd = () => { if (cnt) { const n = t.value.split('\n').filter(s => s.trim()).length; cnt.textContent = n + ' / ' + f.lines + ' lines'; cnt.classList.toggle('over', n > f.lines); } };
          t.addEventListener('input', () => { obj[key] = t.value; upd(); changed(); }); upd();
          bind(f, obj, t, v => { t.value = v; upd(); });
          return fieldBlock(f, [emoji && f.emoji !== false ? withStickers(f, t) : t, cnt ? el('div', { class: 'counter' }, cnt) : null]);
        }
        case 'choice': {
          const wrap = el('div', { class: 'chips', role: 'radiogroup' });
          if (f.fonts && KS.cute) u.font(KS.cute.allFontsUrl());
          const opts = () => (typeof f.options === 'function' ? f.options(data) : f.options) || [];
          const draw = () => { wrap.textContent = ''; opts().forEach(o => wrap.append(el('button', { type: 'button', class: 'chip' + (o.f ? ' fontchip' : ''), role: 'radio', style: o.f ? 'font-family:' + o.f : null,
            'aria-checked': String((obj[key] == null ? (f.default != null ? f.default : (opts()[0] || {}).v) : obj[key]) === o.v),
            onclick: () => { obj[key] = o.v; (f.resets || []).forEach(k => { delete obj[k]; }); draw(); changed(); wrap.dispatchEvent(new Event('input', { bubbles: true })); } }, o.c ? el('i', { class: 'dot', style: 'background:' + o.c }) : null, o.l))); };
          if (typeof f.options === 'function') showers.push(draw); // options that depend on the rest of the form (e.g. the list of pages)
          draw(); return fieldBlock(f, wrap);
        }
        case 'color': {
          const dyn = typeof f.default === 'function', dflt = () => (dyn ? f.default(data) : f.default) || '#c9a45c';
          const i = el('input', { type: 'color', id: f._id, value: obj[key] || dflt() });
          i.addEventListener('input', () => { obj[key] = i.value; changed(); });
          if (dyn) showers.push(() => { if (!obj[key]) i.value = dflt(); }); // an untouched picker follows the palette
          return fieldBlock(f, i);
        }
        case 'reset': return el('div', { class: 'field' }, el('button', { type: 'button', class: 'btn ghost', onclick: () => { f.keys.forEach(k => { delete obj[k]; }); changed(); } }, f.label));
        case 'toggle': {
          const c = el('input', { type: 'checkbox', id: f._id }); c.checked = !!obj[key];
          c.addEventListener('change', () => { obj[key] = c.checked; changed(); });
          return el('div', { class: 'field' }, el('label', { class: 'switch', for: f._id }, c, el('span', { class: 'track' }), el('span', { class: 'swl' }, f.label)), f.help ? el('p', { class: 'help' }, f.help) : null);
        }
        case 'image': return imageControl(f, obj);
        case 'place': {
          const v = obj[key] = Object.assign({ name: '', address: '', url: '' }, obj[key] || {});
          const mk = (k, ph, lab) => { const i = el('input', { type: 'text', placeholder: ph, 'aria-label': lab, value: v[k] || '', maxlength: 200, autocomplete: 'off' }); i.addEventListener('input', () => { v[k] = i.value; changed(); }); return i; };
          return fieldBlock(f, el('div', { class: 'place' }, mk('name', 'Venue name, e.g. Rosewood Hall', 'Venue name'), mk('address', 'Street address, city', 'Address'),
            mk('url', 'Google Maps link (optional)', 'Maps link')), 'placefield');
        }
        case 'repeater': return repeater(f, obj);
        case 'sticker': {
          const opts = f.options || [...u.STK].map(c => String.fromCodePoint(...c.split('_').map(h => parseInt(h, 16))));
          const cur = el('span', { class: 'stkcur' }), grid = el('div', { class: 'stkgrid', role: 'radiogroup', hidden: true });
          const val = () => obj[key] || (f.none ? '' : f.default || opts[0]);
          const drawCur = () => { cur.innerHTML = val() ? u.stk(val()) : `<small>${u.esc(f.none)}</small>`; grid.querySelectorAll('.stkopt').forEach(b => b.setAttribute('aria-checked', String(b.dataset.e === val()))); };
          const pickIt = e => { obj[key] = e; drawCur(); changed(); grid.dispatchEvent(new Event('input', { bubbles: true })); };
          const toggle = el('button', { type: 'button', class: 'btn', id: f._id, onclick: () => {
            grid.hidden = !grid.hidden; toggle.textContent = grid.hidden ? 'Change' : 'Done';
            if (!grid.hidden && !grid.childElementCount) {
              if (f.none) grid.append(el('button', { type: 'button', class: 'stkopt none', role: 'radio', 'data-e': '', onclick: () => pickIt('') }, f.none));
              opts.forEach(e => grid.append(el('button', { type: 'button', class: 'stkopt', role: 'radio', 'data-e': e, 'aria-label': e, html: u.stk(e), onclick: () => pickIt(e) }))); drawCur(); }
          } }, 'Change');
          drawCur();
          return fieldBlock(f, [el('div', { class: 'stkrow' }, cur, toggle), grid]);
        }
        default: return el('div');
      }
    }

    /* remember where a box's value lives, so the preview can type into it (setValue) and find it (reveal) */
    function bind(f, obj, box, set) {
      const p = f.bindAs || bindPath(obj, f.key); if (p == null) return;
      box.dataset.bind = p;
      setters.set(p, (v, quiet) => { set(v); if (!quiet) box.dispatchEvent(new Event('input', { bubbles: true })); });
    }

    function imageControl(f, obj) {
      const key = f.key, thumb = el('div', { class: 'imgthumb' }), status = el('span', { class: 'imgstat' });
      const input = el('input', { type: 'file', accept: 'image/*', hidden: true });
      const pick = el('button', { type: 'button', class: 'btn', onclick: () => input.click() });
      const rm = el('button', { type: 'button', class: 'btn ghost', onclick: () => { obj[key] = ''; draw(); changed(); } }, 'Remove');
      const draw = () => {
        const has = !!obj[key];
        thumb.style.backgroundImage = has ? `url("${obj[key]}")` : ''; thumb.classList.toggle('empty', !has);
        pick.textContent = has ? 'Change photo' : 'Choose photo'; rm.hidden = !has;
      };
      input.addEventListener('change', async () => {
        const file = input.files[0]; if (!file) return;
        try { status.textContent = 'Preparing…'; obj[key] = u.addBlob(await u.resizeImage(file), 'jpg', file.name); status.textContent = ''; draw(); changed(); }
        catch (e) { status.textContent = ''; u.toast(e.message || 'Could not use that picture'); }
        input.value = '';
      });
      draw();
      return fieldBlock(f, el('div', { class: 'imgrow' }, thumb, el('div', { class: 'imgbtns' }, pick, rm, status), input));
    }

    function repeater(f, obj) {
      f._id = f._id || uid();
      if (!Array.isArray(obj[f.key])) obj[f.key] = [];
      const list = el('div', { class: 'replist' });
      const idsNow = () => obj[f.key].map((it, j) => [it, f.itemPage ? f.itemPage(data, j) || '' : '']);
      const follow = before => { // a planning page's own guide and photos move with it
        if (!f.itemPage || !Array.isArray(data.pages)) return;
        const now = new Map(idsNow()), m = new Map();
        before.forEach(([it, id]) => { if (id) m.set(id, now.has(it) ? now.get(it) : ''); });
        for (let k = data.pages.length - 1; k >= 0; k--) { const x = data.pages[k]; if (x && m.has(x.at)) { if (m.get(x.at)) x.at = m.get(x.at); else data.pages.splice(k, 1); } }
      };
      const add = el('button', { type: 'button', class: 'btn add', onclick: () => {
        if (obj[f.key].length >= (f.max || 20)) return u.toast('That is the most you can add here');
        obj[f.key].push(u.clone(f.blank || {})); draw(obj[f.key].length - 1); changed();
      } }, '+ ' + (f.addLabel || 'Add'));
      function draw(openIdx) {
        const arr = obj[f.key]; list.textContent = '';
        const base = bindPath(obj, f.key);
        arr.forEach((item, i) => {
          if (base != null) paths.set(item, base + '.' + i);
          const t = (f.title ? f.title(item, i) : '') || (f.itemLabel || 'Item') + ' ' + (i + 1);
          const btn = (txt, label, fn, dis) => el('button', { type: 'button', class: 'mini', 'aria-label': label, disabled: dis, onclick: e => { e.preventDefault(); e.stopPropagation(); fn(); } }, txt);
          const sum = el('summary', {}, el('span', { class: 'rt' }, t),
            el('span', { class: 'rc' },
              btn('↑', 'Move up', () => { const b = idsNow(); arr.splice(i - 1, 0, arr.splice(i, 1)[0]); follow(b); draw(i - 1); changed(); }, i === 0),
              btn('↓', 'Move down', () => { const b = idsNow(); arr.splice(i + 1, 0, arr.splice(i, 1)[0]); follow(b); draw(i + 1); changed(); }, i === arr.length - 1),
              btn('✕', 'Remove', () => { const b = idsNow(); arr.splice(i, 1); follow(b); draw(); changed(); })));
          const pid = f.itemPage ? f.itemPage(data, i) || '' : '';
          const body = el('div', { class: 'repbody' }, f.fields.map(sf => sub(sf, item)), byPage && pid ? pageExtras(pid) : null);
          list.append(el('details', { class: 'repitem', 'data-page': pid || null, 'data-key': base != null ? 'item:' + base + '.' + i : null,
            open: (openIdx === i || (arr.length === 1 && openIdx == null) || keepOpen.has('item:' + base + '.' + i)) ? true : null }, sum, body));
        });
        add.disabled = arr.length >= (f.max || 20);
        if (f.max) add.textContent = '+ ' + (f.addLabel || 'Add') + '  (' + arr.length + '/' + f.max + ')';
      }
      draw();
      return el('div', { class: 'field repeater' }, f.label ? el('span', { class: 'lbl' }, f.label) : null, f.help ? el('p', { class: 'help top' }, f.help) : null, list, add);
    }

    // a field inside a repeater item; its title updates as you type
    function sub(sf, item) {
      const node = control(sf, item);
      node.addEventListener('input', () => {
        const d = node.closest('details'); if (!d) return;
        const rt = d.querySelector('.rt'), idx = [...d.parentNode.children].indexOf(d);
        const parent = d.closest('.repeater'); if (rt && parent && parent._title) rt.textContent = parent._title(item, idx) || rt.textContent;
      });
      return node;
    }

    function withVisibility(f, obj, node) {
      if (f.show) { const fn = () => { node.hidden = !f.show(data, obj); }; showers.push(fn); fn(); }
      return node;
    }

    /* a page card's own guide, what the guide says there, and its photos */
    function pageExtras(id) {
      const box = el('div', { class: 'pextras' });
      const draw = () => {
        box.textContent = '';
        const v = { get guide() { return extraOf(id).guide; }, set guide(x) { setExtra(id, 'guide', x); }, get say() { return getSay(id); }, set say(x) { setSay(id, x); } };
        const guides = (KS.cute && KS.cute.GUIDES) || null;
        box.append(el('p', { class: 'px-h' }, 'Guide and photos on this page'));
        if (guides) box.append(control({ key: 'guide', type: 'sticker', label: 'Guide on this page', options: guides, none: 'Same as main' }, v));
        box.append(control({ key: 'say', type: 'text', label: 'What the guide says when this page opens', max: 110, bindAs: 'say:' + id, placeholder: opts.sayHint ? opts.sayHint(id, data) || '' : '' }, v));
        extrasOf(id).filter(isPhoto).forEach(x => box.append(el('div', { class: 'px-photo' },
          control({ key: 'photo', type: 'image', label: 'Photo' }, x),
          control({ key: 'caption', type: 'text', label: 'Caption (optional)', max: 60 }, x),
          el('button', { type: 'button', class: 'link danger', onclick: () => { data.pages.splice(data.pages.indexOf(x), 1); draw(); changed(); } }, 'Remove this photo'))));
        box.append(el('button', { type: 'button', class: 'btn add', onclick: () => {
          if (!Array.isArray(data.pages)) data.pages = [];
          data.pages.push({ at: id, kind: 'photo', guide: '', say: '', photo: '', caption: '' }); draw(); changed();
        } }, '+ Add a photo to this page'));
      };
      draw(); return box;
    }

    const pageOf = (f, sec) => { const p = f.page !== undefined ? f.page : sec.page; return (typeof p === 'function' ? p(data) : p) || ''; };
    const shape = () => opts.pagesOf(data).map(p => p[0]).join(',') + '|' + schema.map(sec => sec.fields.map(f => pageOf(f, sec)).join(',')).join(';')
      + '|' + schema.flatMap(sec => sec.fields.filter(f => f.itemPage).map(f => (data[f.key] || []).map((_, i) => f.itemPage(data, i)).join(','))).join(';');
    /* the set of pages changed (a planning page was added, a game switched off): rebuild, but never under someone's typing finger */
    function reshape() {
      if (shape() === shapeNow) return;
      const a = document.activeElement;
      if (a && host.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|date|time)$/.test(a.type)))) {
        if (!waiting) { waiting = true; a.addEventListener('blur', () => { waiting = false; setTimeout(() => { if (shape() !== shapeNow) build(); }, 0); }, { once: true }); }
        return;
      }
      build();
    }

    let keepOpen = new Set();
    const section = (key, title, kids, open) => el('details', { class: 'sec', 'data-key': key, open: open ? true : null }, el('summary', {}, title), el('div', { class: 'secbody' }, kids));
    const fieldNode = f => { const node = control(f, data); if (f.type === 'repeater' && f.title) node._title = f.title; return withVisibility(f, data, node); };

    function build() {
      const first = !host.childElementCount, a = document.activeElement, focus = a && host.contains(a) ? a.dataset.bind : '';
      keepOpen = new Set([...host.querySelectorAll('details[open][data-key]')].map(x => x.dataset.key));
      const isOpen = (key, dflt) => (first ? dflt : keepOpen.has(key));
      showers = []; setters.clear(); host.textContent = '';
      if (!byPage) {
        schema.forEach(sec => host.append(section('sec:' + sec.id, sec.title, sec.fields.map(fieldNode), isOpen('sec:' + sec.id, sec.open))));
      } else {
        const pages = opts.pagesOf(data), per = {}, groups = [], basics = [];
        schema.forEach(sec => {
          if (sec.extras) return;
          const loose = [];
          sec.fields.forEach(f => {
            if (f.sayFor) return; // lives in its page card as "What the guide says"
            const p = pageOf(f, sec);
            if (p) (per[p] = per[p] || []).push(f); else loose.push(f);
            if (f.type === 'repeater' && f.itemPage) groups.push(f);
          });
          if (loose.length) basics.push([sec, loose]);
        });
        host.append(el('p', { class: 'ed-h' }, 'For the whole page'));
        basics.forEach(([sec, fs]) => host.append(section('sec:' + sec.id, sec.basics || sec.title, fs.map(fieldNode), isOpen('sec:' + sec.id, sec.open))));
        host.append(el('p', { class: 'ed-h' }, 'Page by page', el('small', {}, 'In the order your visitor sees them. Tap a page in the preview to jump to it.')));
        let n = 0; const done = new Set();
        const label = id => { const x = opts.pagesOf(data).find(p => p[0] === id); return x ? x[1] : ''; };
        const card = (key, num, title, fs, id) => {
          const t = el('span', { class: 'pc-t' }, title()); showers.push(() => { t.textContent = title(); });
          return el('details', { class: 'sec pcard', 'data-key': key, 'data-page': id || null, open: isOpen(key, false) ? true : null },
            el('summary', {}, num ? el('span', { class: 'pc-n' }, num) : null, t), el('div', { class: 'secbody' }, fs.map(fieldNode), id ? pageExtras(id) : null));
        };
        const groupCard = g => { // one card holds all of a repeater's pages, numbered as a range
          if (done.has(g.key)) return; done.add(g.key);
          const c = (data[g.key] || []).map((_, i) => g.itemPage(data, i)).filter(Boolean).length;
          host.append(card('grp:' + g.key, c > 1 ? (n + 1) + '–' + (n + c) : c ? String(n + 1) : '', () => g.groupTitle || g.label || g.key, per[g.key] || [], ''));
          n += c;
        };
        pages.forEach(([id]) => {
          const g = groups.find(x => (data[x.key] || []).some((_, i) => x.itemPage(data, i) === id));
          if (g) return groupCard(g);
          host.append(card('pg:' + id, String(++n), () => label(id), per[id] || [], id));
          groups.forEach(x => { if (x.after === id) groupCard(x); });
        });
        groups.forEach(groupCard);
        shapeNow = shape();
      }
      const back = focus && host.querySelector('[data-bind="' + CSS.escape(focus) + '"]');
      if (back) back.focus({ preventScroll: true });
    }
    build();
    if (opts.onPage) host.addEventListener('toggle', e => { const d = e.target; if (d.open && d.dataset && d.dataset.page) opts.onPage(d.dataset.page); }, true);

    /* bring a page or a value into view in the form, with a short glow */
    function reveal(t) {
      const q = (attr, v) => host.querySelector('[' + attr + '="' + CSS.escape(v) + '"]');
      let node = t.path ? q('data-bind', t.path) : null;
      if (!node && t.path && t.path.startsWith('say:')) node = q('data-page', t.path.slice(4));
      if (!node && t.page) node = q('data-page', t.page);
      if (!node && t.page && !byPage) { // arranged by topic: the first field that belongs to that page
        for (const sec of schema) { const f = sec.fields.find(x => pageOf(x, sec) === t.page || x.sayFor === t.page); if (f) { node = host.querySelector('[data-key="sec:' + sec.id + '"]'); break; } }
      }
      if (!node) return false;
      for (let d = node.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
      if (node.tagName === 'DETAILS') node.open = true;
      const glow = node.closest('.field') || node;
      glow.scrollIntoView({ block: 'center', behavior: u.RM ? 'auto' : 'smooth' });
      glow.classList.remove('ks-glow'); void glow.offsetWidth; glow.classList.add('ks-glow');
      return true;
    }
    /* the preview typed something: put it in the data and the matching box */
    function setValue(path, v) {
      const st = setters.get(path);
      if (st) return st(v);
      if (path.startsWith('say:')) setSay(path.slice(4), v);
      else { const parts = path.split('.'), k = parts.pop(); let o = data; parts.forEach(x => { o = o && o[x]; }); if (!o || typeof o !== 'object') return; o[k] = v; }
      changed();
    }
    const sayMap = () => (opts.pagesOf ? Object.fromEntries(opts.pagesOf(data).map(([id]) => [id, getSay(id)])) : {});
    return { refresh: () => showers.forEach(fn => fn()), reveal, setValue, sayMap, layout: byPage ? 'page' : 'topic' };
  };

  /* ---------------- music picker ---------------- */
  const EXT = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
  const MAX_SONG = 10 * 1024 * 1024;

  KS.buildMusicEditor = function (host, m, onChange) {
    let preview = null, previewId = '';
    const stopPreview = () => { if (preview) { preview.pause(); preview = null; previewId = ''; } };
    const body = el('div', { class: 'musicbody' });
    const modes = [{ v: 'none', l: 'No music' }, { v: 'library', l: 'Our songs' }, { v: 'upload', l: 'My own song' }, { v: 'youtube', l: 'YouTube' }];

    function draw() {
      body.textContent = '';
      body.append(el('div', { class: 'chips', role: 'radiogroup' }, modes.map(o => el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(m.type === o.v),
        onclick: () => { stopPreview(); m.type = o.v; if (o.v === 'library' && !KS.trackOf(m.id)) m.id = KS.TRACKS[0].id; draw(); onChange(); } }, o.l))));

      if (m.type === 'library') {
        body.append(el('div', { class: 'tracks' }, KS.TRACKS.map(t => el('div', { class: 'track' + (m.id === t.id ? ' on' : '') },
          el('button', { type: 'button', class: 'play', 'aria-label': 'Listen to ' + t.name, onclick: () => {
            if (previewId === t.id) { stopPreview(); draw(); return; }
            stopPreview(); preview = new Audio(t.file); preview.volume = .6; previewId = t.id; preview.play().catch(() => {}); preview.onended = () => { stopPreview(); draw(); }; draw();
          } }, previewId === t.id ? '❚❚' : '▶'),
          el('button', { type: 'button', class: 'tname', onclick: () => { m.id = t.id; draw(); onChange(); } }, el('b', {}, t.name), el('small', {}, t.mood)),
          el('span', { class: 'tick' }, m.id === t.id ? '✓' : '')))),
          el('p', { class: 'help' }, 'These are free to use. Tap the play button to listen.'));
      }
      if (m.type === 'upload') {
        const input = el('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.aac,.wav,.ogg', hidden: true });
        input.addEventListener('change', () => {
          const f = input.files[0]; input.value = ''; if (!f) return;
          const ext = EXT[f.type] || (/\.(mp3|m4a|aac|wav|ogg)$/i.exec(f.name) || [])[1];
          if (!ext) return u.toast('Please choose an mp3, m4a, aac, wav or ogg file');
          if (f.size > MAX_SONG) return u.toast('That song is over 10 MB. Try a shorter or smaller version.');
          m.src = u.addBlob(f, ext.toLowerCase(), f.name); m.name = f.name; draw(); onChange();
        });
        body.append(el('div', { class: 'upl' }, el('button', { type: 'button', class: 'btn', onclick: () => input.click() }, m.src ? 'Choose a different song' : 'Choose a song from your device'), input,
          m.src ? el('p', { class: 'picked' }, '✓ ' + (m.name || 'Song ready'), el('audio', { controls: true, src: m.src, preload: 'none' })) : null),
          el('p', { class: 'help' }, 'MP3, M4A, AAC, WAV or OGG, up to 10 MB. Only upload music you have the right to share. Playback begins when the visitor taps to open.'));
      }
      if (m.type === 'youtube') {
        const i = el('input', { type: 'text', placeholder: 'Paste a YouTube link', value: m.src || '', autocomplete: 'off', 'aria-label': 'YouTube link' });
        const ok = el('div', { class: 'ytok' });
        const check = () => { const id = u.youtubeId(i.value); ok.textContent = ''; if (id) ok.append(el('img', { src: 'https://img.youtube.com/vi/' + id + '/mqdefault.jpg', alt: '' }), el('span', {}, '✓ Video found')); else if (i.value.trim()) ok.textContent = 'That does not look like a YouTube link.'; };
        i.addEventListener('input', () => { m.src = i.value.trim(); check(); onChange(); }); check();
        body.append(i, ok, el('p', { class: 'help' }, 'The sound plays in the background when the visitor taps to open. It only works if the video allows embedding, and on some phones it may need a second tap on the music button.'));
      }
    }
    host.textContent = ''; host.append(body); draw();
    return { stop: stopPreview };
  };
})();
