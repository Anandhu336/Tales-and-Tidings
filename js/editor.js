/* Tales & Tidings editor: turns a template's `schema` into a form. Every field type a template can use lives here.
   Field types: text, textarea, date, time, choice, color, toggle, image, place, repeater, reset.
   choice: `resets: [keys]` clears those keys when picked.  color: `default` may be a function(data).  reset: button that clears `keys`. */
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

  KS.buildEditor = function (host, schema, data, onChange) {
    const showers = []; // functions that re-check "show if" conditions
    const changed = () => { showers.forEach(fn => fn()); onChange(data); };

    function control(f, obj) {
      f._id = f._id || uid();
      const key = f.key;
      switch (f.type) {
        case 'text': case 'date': case 'time': {
          const i = el('input', { type: f.type, id: f._id, maxlength: f.type === 'text' ? (f.max || 120) : null, placeholder: f.placeholder || '', autocomplete: 'off', value: obj[key] || '' });
          i.addEventListener('input', () => { obj[key] = i.value; changed(); });
          return fieldBlock(f, i);
        }
        case 'textarea': {
          const t = el('textarea', { id: f._id, rows: f.rows || 5, placeholder: f.placeholder || '' }); t.value = obj[key] || '';
          const cnt = f.lines ? el('span', { class: 'count' }) : null;
          const upd = () => { if (cnt) { const n = t.value.split('\n').filter(s => s.trim()).length; cnt.textContent = n + ' / ' + f.lines + ' lines'; cnt.classList.toggle('over', n > f.lines); } };
          t.addEventListener('input', () => { obj[key] = t.value; upd(); changed(); }); upd();
          return fieldBlock(f, [t, cnt ? el('div', { class: 'counter' }, cnt) : null]);
        }
        case 'choice': {
          const wrap = el('div', { class: 'chips', role: 'radiogroup' });
          const draw = () => { wrap.textContent = ''; f.options.forEach(o => wrap.append(el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String((obj[key] == null ? f.options[0].v : obj[key]) === o.v),
            onclick: () => { obj[key] = o.v; (f.resets || []).forEach(k => { delete obj[k]; }); draw(); changed(); } }, o.c ? el('i', { class: 'dot', style: 'background:' + o.c }) : null, o.l))); };
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
        default: return el('div');
      }
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
      const add = el('button', { type: 'button', class: 'btn add', onclick: () => {
        if (obj[f.key].length >= (f.max || 20)) return u.toast('That is the most you can add here');
        obj[f.key].push(u.clone(f.blank || {})); draw(obj[f.key].length - 1); changed();
      } }, '+ ' + (f.addLabel || 'Add'));
      function draw(openIdx) {
        const arr = obj[f.key]; list.textContent = '';
        arr.forEach((item, i) => {
          const t = (f.title ? f.title(item, i) : '') || (f.itemLabel || 'Item') + ' ' + (i + 1);
          const btn = (txt, label, fn, dis) => el('button', { type: 'button', class: 'mini', 'aria-label': label, disabled: dis, onclick: e => { e.preventDefault(); e.stopPropagation(); fn(); } }, txt);
          const sum = el('summary', {}, el('span', { class: 'rt' }, t),
            el('span', { class: 'rc' },
              btn('↑', 'Move up', () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(i - 1); changed(); }, i === 0),
              btn('↓', 'Move down', () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(i + 1); changed(); }, i === arr.length - 1),
              btn('✕', 'Remove', () => { arr.splice(i, 1); draw(); changed(); })));
          const body = el('div', { class: 'repbody' }, f.fields.map(sf => sub(sf, item)));
          list.append(el('details', { class: 'repitem', open: (openIdx === i || (arr.length === 1 && openIdx == null)) ? true : null }, sum, body));
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

    host.textContent = '';
    schema.forEach(sec => {
      const body = el('div', { class: 'secbody' });
      sec.fields.forEach(f => {
        const node = control(f, data);
        if (f.type === 'repeater' && f.title) node._title = f.title;
        body.append(withVisibility(f, data, node));
      });
      host.append(el('details', { class: 'sec', open: sec.open ? true : null }, el('summary', {}, sec.title), body));
    });
    return { refresh: () => showers.forEach(fn => fn()) };
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
