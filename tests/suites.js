/* The tests. Each one: { name, fn(H), timeout? }. Throw (or use H.ok / H.eq) to fail; return a short note to show next to a pass,
   or { skip: 'why' } to skip. Helpers are in tests/harness.html. */
window.SUITES = async () => {
  const H = window.H, ids = await H.ids(), T = [];
  const add = (name, fn, timeout) => T.push({ name, fn, timeout });
  const CUTE = ['ask-date', 'ask-sorry', 'quest'];

  /* ---------- every design opens ---------- */
  for (const id of ids) for (const live of [false, true]) add(`${id}: opens (${live ? 'visitor' : 'builder preview'})`, async () => {
    const { w, d } = await H.render(id, null, live);
    await H.sleep(live ? 900 : 300);
    const stage = d.querySelector('#stage');
    H.ok(stage.textContent.trim().length > 20, 'the page is empty');
    const over = d.documentElement.scrollWidth - w.innerWidth;
    H.ok(over <= 1, `scrolls sideways on a phone by ${over}px`);
  });

  add('switching between designs leaves no styles behind', async () => {
    const { w, d } = await H.render(ids[0], null, false);
    const cycle = async () => { for (const id of ids) { const T2 = await w.KS.loadTemplate(id); w.postMessage({ type: 'ks-render', t: id, d: T2.sample, m: null, live: false }, '*'); await H.sleep(120); } };
    await cycle(); const after1 = d.head.querySelectorAll('style').length;
    await cycle(); const after2 = d.head.querySelectorAll('style').length;
    H.eq(after2, after1, 'style tags after a second round of switching');
    return `${ids.length} designs × 2`;
  }, 90000);

  /* ---------- Will you go out with me? ---------- */
  add('ask-date: No runs away, stays on screen, never covers Yes, then gives up', async () => {
    const { w, d, data } = await H.render('ask-date');
    const no = d.querySelector('#aNo'), yes = d.querySelector('#aYes'), lines = data.noLines.split('\n').length;
    for (let i = 1; i < lines; i++) {
      H.press(w, no); await H.sleep(380);
      H.ok(H.inView(w, no), `try ${i}: the No button left the screen`);
      const a = H.rect(no), b = H.rect(yes);
      H.ok(!(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top), `try ${i}: No landed on top of Yes`);
      H.eq(no.textContent, data.noLines.split('\n')[i], `try ${i} text`);
    }
    H.press(w, no); await H.sleep(300);
    H.ok(no.classList.contains('a-yes'), 'No did not turn into a Yes at the end');
    H.ok(d.querySelector('.k-bub').textContent.length > 3, 'the guide said nothing');
    return `${lines} tries`;
  });

  add('ask-date: yes → planning pages → summary with picks in the WhatsApp message', async () => {
    const { w, d, data } = await H.render('ask-date', { whatsapp: '+91 98765 43210' });
    d.querySelector('#aYes').click(); await H.sleep(700);
    H.ok(!d.querySelector('#aAns').hidden, 'the yes page did not open');
    d.querySelector('#aPlan').click(); await H.sleep(500);
    const picked = [];
    for (let i = 0; i < data.steps.length; i++) {
      const sec = [...d.querySelectorAll('.a-step')].find(s => !s.hidden); H.ok(sec, `planning page ${i + 1} is not showing`);
      const opt = sec.querySelectorAll('.a-opt')[i % 2]; picked.push(opt.textContent.trim()); opt.click(); await H.sleep(800);
    }
    // pick the date and time
    const ws = d.querySelector('.a-step[data-when]'); H.ok(ws && !ws.hidden, 'the date and time page is not showing');
    const go2 = ws.querySelector('.a-wgo'); H.ok(go2.disabled, '"That works" should wait until a day and a time are picked');
    ws.querySelectorAll('.a-day')[2].click(); ws.querySelectorAll('.a-time')[2].click();
    H.ok(!go2.disabled, '"That works" did not switch on');
    const when = go2.textContent.replace(' 💖', ''); picked.push(when); go2.click(); await H.sleep(900);
    H.ok(!d.querySelector('#aEnd').hidden, 'the last page did not open');
    H.eq(d.querySelectorAll('#aPicks .a-pick').length, data.steps.length + 1, 'picks shown on the last page');
    H.eq(d.querySelector('#aWhen').textContent, when, 'the plan card should show their date');
    H.ok(!d.querySelector('#aIcs').hidden && d.querySelector('#aIcs').href.startsWith('blob:'), 'Add to calendar should appear with their date');
    const ics = await (await w.fetch(d.querySelector('#aIcs').href)).text();
    H.ok(/DTSTART:\d{8}T183000/.test(ics), 'calendar file should start at 18:30 on their day: ' + (/DTSTART[^\r]*/.exec(ics) || [''])[0]);
    const wa = decodeURIComponent(d.querySelector('#aWa').href);
    H.ok(wa.startsWith('https://api.whatsapp.com/send?phone=919876543210&text='), 'WhatsApp link goes to the wrong number (or uses wa.me, which breaks emoji): ' + wa.slice(0, 50));
    H.ok(/💖/.test(wa) && /📅/.test(wa), 'emoji should survive in the WhatsApp message');
    picked.forEach(p => H.ok(wa.includes(p), 'WhatsApp message is missing the pick "' + p + '"'));
    return picked.join(', ');
  });

  for (const id of ['ask-date', 'ask-sorry']) add(`${id}: opening screen shows, and tapping it opens the page and starts the music`, async () => {
    const ready = new Promise(r => { const f = e => { if (e.data && e.data.type === 'ks-ready') { removeEventListener('message', f); r(); } }; addEventListener('message', f); });
    const { w, d } = await H.open('../index.html?preview=1'); await ready;
    const Tp = await w.KS.loadTemplate(id);
    w.postMessage({ type: 'ks-render', t: id, d: Tp.sample, m: { type: 'library', id: 'g1' }, live: true }, '*');
    const gate = await H.until(() => d.querySelector('.a-gate'), 5000, 'the opening screen');
    H.ok(H.inView(w, gate) && H.rect(gate).height >= w.innerHeight - 1, 'the opening screen should cover the phone screen');
    H.eq(d.body.style.overflow, 'hidden', 'page scrolling while the opening screen shows');
    gate.click();
    await H.until(() => !d.querySelector('.a-gate'), 3000, 'the opening screen to go away');
    H.ok(d.querySelector('.ks-music'), 'the music did not start (no music button appeared)');
    H.ok(d.body.style.overflow !== 'hidden', 'scrolling was not given back');
    const off = await H.render(id, { gateOn: false });
    H.ok(!off.d.querySelector('.a-gate'), 'turning it off in the builder should remove it');
  });

  add('emoji at the end of a choice becomes its picture; no emoji gets ✨', async () => {
    const { w, d } = await H.render('ask-date', { whenOn: false, steps: [{ q: 'Food?', options: 'something else 💁🏻\nplain choice\n🍕 Pizza' }] });
    d.querySelector('#aYes').click(); await H.sleep(700); d.querySelector('#aPlan').click(); await H.sleep(600);
    const [a, b, c] = [...[...d.querySelectorAll('.a-step')].find(s => !s.hidden).querySelectorAll('.a-opt')];
    H.eq(a.querySelector('span:last-child').textContent, 'something else', 'label without its emoji');
    H.ok(a.querySelector('img,.stk-t').alt === '💁🏻' || a.querySelector('.stk-t'), 'the 💁🏻 should be the picture');
    H.eq((b.querySelector('img') || {}).alt, '✨', 'a choice with no emoji gets ✨');
  });

  add('ask-date: the guide says your own first, yes and last-page lines', async () => {
    const { w, d } = await H.render('ask-date', { firstSay: 'Hi Surya! Big question coming 🙈', yaySay: 'SHE SAID YES 🎉', endSay: 'See you soon 💖', steps: [], whenOn: false });
    H.eq(d.querySelector('.k-bub').textContent, 'Hi Surya! Big question coming 🙈', 'first line');
    d.querySelector('#aYes').click(); await H.sleep(800);
    H.eq(d.querySelector('.k-bub').textContent, 'SHE SAID YES 🎉', 'line when they say yes');
    const r2 = await H.render('ask-date', { endSay: 'See you soon 💖', whenOn: false, steps: [{ q: 'Pick', options: '🍕 Pizza' }] });
    r2.d.querySelector('#aYes').click(); await H.sleep(700); r2.d.querySelector('#aPlan').click(); await H.sleep(600);
    r2.d.querySelector('.a-step:not([hidden]) .a-opt').click(); await H.sleep(900);
    H.eq(r2.d.querySelector('.k-bub').textContent, 'See you soon 💖', 'line on the last page');
  });

  add('ask-sorry: forgive, then claim and unclaim a coupon', async () => {
    const { w, d } = await H.render('ask-sorry');
    d.querySelector('#aYes').click(); await H.sleep(700);
    const c = d.querySelector('.a-coup'); H.ok(c, 'no coupons');
    c.click(); H.ok(c.classList.contains('used'), 'coupon did not get stamped'); c.click(); H.ok(!c.classList.contains('used'), 'coupon did not unstamp');
  });

  /* ---------- Little love quest ---------- */
  add('quest: play every level to the end', async () => {
    const { w, d, data } = await H.render('quest', { whatsapp: '' });
    const vis = () => [...d.querySelectorAll('.q-page')].find(p => !p.hidden), k = () => vis().dataset.k;
    const next = async () => { const b = await H.until(() => vis().querySelector('.q-next'), 4000, 'the Next level button'); b.click(); await H.sleep(600); };
    const heart = d.querySelector('#qHeart'); for (let i = 0; i < 5; i++) { heart.click(); await H.sleep(120); }
    await H.until(() => k() === 'quiz', 3000, 'the quiz');
    for (let q = 0; q < data.quiz.length; q++) { vis().querySelector('[data-ok="1"]').click(); await H.sleep(1500); }
    H.eq(k(), 'meter', 'after the quiz');
    const r = d.querySelector('#qRange'); r.value = 20; r.dispatchEvent(new w.Event('input')); r.dispatchEvent(new w.Event('change'));
    await H.until(() => d.querySelector('#qNum').textContent === '∞', 5000, 'the love meter to reach ∞'); await next();
    H.eq(k(), 'catch', 'after the love meter');
    await H.until(() => { const h = [...d.querySelectorAll('.q-fall:not(.got)')].find(b => b.getAttribute('aria-label') === 'Heart'); if (h) H.press(w, h); return vis().querySelector('.q-next'); }, 30000, 'six hearts to be caught');
    await next(); H.eq(k(), 'memory', 'after catching hearts');
    const by = {}; vis().querySelectorAll('.q-card').forEach(c => (by[c.dataset.e] = by[c.dataset.e] || []).push(c));
    for (const pair of Object.values(by)) { pair[0].click(); await H.sleep(120); pair[1].click(); await H.sleep(500); }
    await next(); H.eq(k(), 'scratch', 'after memory');
    const cv = d.querySelector('#qScv'), cr = H.rect(cv); H.press(w, cv, 'pointerdown', cr.left + 4, cr.top + 4);
    for (let y = cr.top + 5; y < cr.bottom && d.querySelector('#qScv') && !cv.classList.contains('gone'); y += 28) for (let x = cr.left; x <= cr.right; x += 22) H.press(w, cv, 'pointermove', x, y);
    H.press(w, cv, 'pointerup', cr.right, cr.bottom);
    await next(); H.eq(k(), 'hug', 'after the scratch card');
    const hug = d.querySelector('#qHug'); H.press(w, hug); await H.until(() => hug.classList.contains('done'), 4000, 'the hug to fill up'); await next();
    H.eq(k(), 'final', 'after the hug');
    const no = d.querySelector('#qNo'), n = data.noLines.split('\n').length; for (let i = 0; i < n; i++) { no.click(); await H.sleep(120); }
    H.ok(no.classList.contains('poof'), 'the No button did not disappear');
    d.querySelector('#qYes').click(); await H.until(() => k() === 'end', 3000, 'the results page');
    const chips = [...d.querySelectorAll('.q-chip')].map(c => c.textContent.trim());
    H.eq(chips.length, 7, 'result badges (' + chips.join(' | ') + ')');
    H.ok(/genius/.test(chips[0]), 'a perfect quiz should say genius: ' + chips[0]);
    return chips.join(' | ');
  }, 90000);

  /* ---------- Page by page: guides, words and photos ---------- */
  add('page by page: own guide, words and photo on one page only', async () => {
    const photo = 'stickers/1f339.webp';
    const { w, d } = await H.render('quest', { pages: [{ at: 'quiz1', guide: '🐼', say: 'Panda says hi 🐼', photo, caption: 'us' }, { at: 'quiz1', guide: '', say: '', photo, caption: 'again' }] });
    const heart = d.querySelector('#qHeart'); for (let i = 0; i < 5; i++) { heart.click(); await H.sleep(120); }
    await H.sleep(900);
    H.ok(d.querySelector('.k-pet>img').src.includes('1f43c'), 'the guide did not change to the panda');
    H.eq(d.querySelector('.k-bub').textContent, 'Panda says hi 🐼', 'what the guide says');
    const pg = [...d.querySelectorAll('.q-page')].find(p => !p.hidden);
    H.eq(pg.querySelectorAll('.k-photo').length, 2, 'photos on that page');
    H.eq(d.querySelectorAll('.k-photo').length, 2, 'photos on the whole page (other pages should have none)');
    pg.querySelector('[data-ok="1"]').click(); await H.sleep(1600);
    H.ok(d.querySelector('.k-pet>img').src.includes('1f43b'), 'the main guide did not come back on the next page');
  });

  add('emoji: saved sticker, then Google, then the wiggle', async () => {
    const { w, d } = await H.render('ask-date', { steps: [{ q: 'Food?', options: '🍕 Pizza\n🦖 Dino\n🍛 Curry' }] });
    d.querySelector('#aYes').click(); await H.sleep(700); d.querySelector('#aPlan').click(); await H.sleep(2500);
    const [pizza, dino, curry] = [...[...d.querySelectorAll('.a-step')].find(s => !s.hidden).querySelectorAll('.a-opt')];
    H.ok(pizza.querySelector('img') && pizza.querySelector('img').src.includes('/stickers/1f355'), 'pizza should use our saved sticker');
    const di = dino.querySelector('img');
    if (!di) return { skip: 'offline: could not reach Google for 🦖' };
    H.ok(di.src.includes('fonts.gstatic.com') && di.src.endsWith('.webp') && di.naturalWidth > 0, 'dino should be Google’s animated version');
    const ci = await H.until(() => { const i = curry.querySelector('img'); return i && i.src.endsWith('emoji.svg') && i.complete && i.naturalWidth > 0 && i; }, 8000, 'curry to fall back to Google’s still picture');
    H.ok(ci.classList.contains('still'), 'the still picture should be marked to wiggle');
    H.eq(w.getComputedStyle(ci).animationName, 'kemo', 'curry wiggle animation');
  });

  /* ---------- the builder ---------- */
  add('builder: every design’s form builds with its sample', async () => {
    const { w, d } = await H.open('../index.html?preview=1');
    for (const id of ids) {
      const Tp = await w.KS.loadTemplate(id), host = d.createElement('div'); d.body.append(host);
      w.KS.buildEditor(host, Tp.schema, JSON.parse(JSON.stringify(Tp.sample)), () => {}, { emoji: !!Tp.emoji });
      H.ok(host.querySelectorAll('.field').length > 3, id + ': the form is almost empty');
      host.remove();
    }
    return ids.length + ' forms';
  });

  add('builder: sticker picker drops the sticker in at the cursor', async () => {
    const { w, d } = await H.open('../index.html?preview=1');
    const Tp = await w.KS.loadTemplate('quest'), host = d.createElement('div'); d.body.append(host);
    const data = JSON.parse(JSON.stringify(Tp.sample)); let changes = 0;
    w.KS.buildEditor(host, Tp.schema, data, () => changes++, { emoji: true });
    const ta = host.querySelector('.repitem textarea'), first = ta.value.split('\n')[0];
    ta.setSelectionRange(first.length, first.length);
    ta.closest('.emo').querySelector('.emo-btn').click();
    const pan = ta.closest('.emo').nextElementSibling; [...pan.querySelectorAll('.emo-tab')].find(b => b.textContent === 'Food').click();
    const btn = pan.querySelector('.emo-grid button'), e = btn.getAttribute('aria-label').replace('Add ', ''); btn.click();
    H.eq(data.quiz[0].answers.split('\n')[0], first + e, 'first answer after inserting');
    H.ok(changes > 0, 'the form did not save the change');
    const wa = [...host.querySelectorAll('input')].find(i => /98765/.test(i.placeholder));
    H.ok(wa && !wa.closest('.emo'), 'the WhatsApp number box should not have a sticker button');
  });

  add('builder: "which page" list follows the quiz', async () => {
    const { w, d } = await H.open('../index.html?preview=1');
    const Tp = await w.KS.loadTemplate('quest'), host = d.createElement('div'); d.body.append(host);
    const data = JSON.parse(JSON.stringify(Tp.sample));
    w.KS.buildEditor(host, Tp.schema, data, () => {}, { emoji: true });
    const addP = [...host.querySelectorAll('button.add')].find(b => /to a page/i.test(b.textContent)); addP.click();
    const count = () => addP.closest('.repeater').querySelector('.repitem .chips').querySelectorAll('.chip').length;
    const before = count();
    const addQ = [...host.querySelectorAll('button.add')].find(b => /question/i.test(b.textContent)); addQ.click();
    const item = [...addQ.closest('.repeater').querySelectorAll('.repitem')].pop();
    const q = item.querySelector('input[type=text]'), ans = item.querySelector('textarea');
    q.value = 'New question?'; q.dispatchEvent(new w.Event('input', { bubbles: true }));
    ans.value = '*Yes'; ans.dispatchEvent(new w.Event('input', { bubbles: true }));
    await H.sleep(100);
    H.eq(count(), before + 1, 'pages to choose from after adding a quiz question');
  });

  add('builder: home page lists every design', async () => {
    const { w, d } = await H.open('../index.html');
    await H.until(() => d.querySelectorAll('.tcard').length >= ids.length, 10000, 'the design cards');
    return d.querySelectorAll('.tcard').length + ' cards';
  });

  add('builder: song list lays out properly', async () => {
    const { w, d } = await H.open('../index.html#/new/ask-date');
    const b = await H.until(() => [...d.querySelectorAll('button')].find(x => x.textContent.trim() === 'Our songs'), 10000, 'the music choices');
    const sec = b.closest('details'); if (sec) sec.open = true; // the Music section starts folded, like for a person
    b.click(); await H.sleep(200);
    const rows = [...d.querySelectorAll('.tracks .track')];
    H.ok(rows.length >= 2, 'no songs listed');
    rows.forEach(r => H.ok(H.rect(r).width > 200 && H.rect(r).height > 40, 'a song row is squashed: ' + Math.round(H.rect(r).width) + 'px wide'));
  });

  add('publishing: a dead database connection gives a clear message', async () => {
    const { w } = await H.open('../index.html?preview=1');
    w.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
    let msg = '';
    try { await w.KS.backend.createPage('abcdefgh', 'k'.repeat(28), { v: 1 }); } catch (e) { msg = e.message; }
    H.ok(/Supabase|offline/.test(msg), 'message was: ' + msg);
  });

  /* ---------- editing by page, and from the preview ---------- */
  add('builder by page: one card per page, words + guide + photos together, guide line in one place', async () => {
    const { w, d } = await H.open('../index.html?preview=1');
    const Tp = await w.KS.loadTemplate('ask-date'), host = d.createElement('div'); d.body.append(host);
    const data = JSON.parse(JSON.stringify(Tp.sample));
    const ed = w.KS.buildEditor(host, Tp.schema, data, () => {}, { emoji: true, layout: 'page', pagesOf: Tp.pagesOf, sayHint: Tp.sayHint });
    const cards = [...host.querySelectorAll('.pcard')].map(c => c.querySelector('.pc-t').textContent);
    H.ok(cards[0] === 'The question' && cards[1] === 'After they say yes', 'cards were: ' + cards.join(' | '));
    H.ok(!/Page by page: guides/.test(host.textContent), 'the old "Page by page" list is still there');
    const yes = host.querySelector('.pcard[data-page="yes"]');
    H.ok(yes.querySelector('[data-bind="yayTitle"]'), 'the big happy line is not on the yes card');
    const say = yes.querySelector('[data-bind="say:yes"]');
    say.value = 'Woo hoo'; say.dispatchEvent(new w.Event('input', { bubbles: true }));
    H.eq(data.yaySay, 'Woo hoo', 'the yes card writes the same guide line the old form did');
    H.ok(![...host.querySelectorAll('[data-bind="yaySay"]')].length, 'the guide line shows twice');
    // a photo on the question page
    [...host.querySelector('.pcard[data-page="q"]').querySelectorAll('button')].find(b => /Add a photo/.test(b.textContent)).click();
    H.ok(data.pages.some(x => x.at === 'q' && x.kind === 'photo'), 'no photo slot added to the question page');
    // planning pages sit in one card, each with its own guide; the guide follows a page when it moves
    const grp = host.querySelector('.pcard[data-key="grp:steps"]');
    H.ok(grp && grp.querySelectorAll('.repitem[data-page] .pextras').length === data.steps.length, 'planning pages have no guide boxes');
    data.pages.push({ at: 's1', guide: '🐼', say: '', photo: '', caption: '' });
    grp.querySelector('.repitem [aria-label="Move down"]').click();
    H.ok(data.pages.some(x => x.at === 's2' && x.guide === '🐼'), 'the panda did not move with its page');
    ed.reveal({ page: 'end' });
    H.ok(host.querySelector('.pcard[data-page="end"]').open, 'reveal did not open the last page');
    host.remove();
    return cards.length + ' cards';
  });

  add('builder: tap words in the preview, type, and the form and page follow', async () => {
    const { w, d } = await H.open('../index.html#/new/ask-date');
    w.localStorage.removeItem('ks.draft.ask-date'); w.localStorage.removeItem('ks.editor');
    w.location.hash = '#/'; await H.sleep(100); w.location.hash = '#/new/ask-date';
    const frame = await H.until(() => d.querySelector('.pvframe iframe'), 8000, 'the preview');
    const pd = () => frame.contentDocument;
    const h1 = await H.until(() => pd() && pd().querySelector('.ks-tap [data-ks-edit="question"]'), 8000, 'editable words in the preview');
    h1.click();
    const box = await H.until(() => pd().querySelector('.ks-inbox'), 3000, 'the typing box');
    box.value = 'Pizza tonight?'; box.dispatchEvent(new frame.contentWindow.Event('input'));
    const blur = b => b.dispatchEvent(new frame.contentWindow.FocusEvent('blur'));
    const field = d.querySelector('[data-bind="question"]');
    await H.until(() => field.value === 'Pizza tonight?', 2000, 'the form box to say "Pizza tonight?" (it says "' + field.value + '")');
    blur(box);
    await H.until(() => { const n = pd().querySelector('[data-ks-edit="question"]'); return n && n.textContent === 'Pizza tonight?'; }, 3000, 'the preview to show the new words');
    // what the guide says can be typed on the page too
    const bub = await H.until(() => pd().querySelector('[data-ks-page="yes"] .k-bub>span[data-ks-edit]'), 3000, 'the guide line on the yes page');
    bub.click(); const b2 = await H.until(() => pd().querySelector('.ks-inbox'), 3000, 'the typing box');
    b2.value = 'You said yes!'; b2.dispatchEvent(new frame.contentWindow.Event('input')); blur(b2);
    await H.until(() => d.querySelector('[data-bind="say:yes"]').value === 'You said yes!', 2000, 'the guide box on the yes card');
    // tap a page (not its words) to open its card
    await H.sleep(400);
    const yesPage = pd().querySelector('[data-ks-page="yes"]');
    yesPage.dispatchEvent(new frame.contentWindow.MouseEvent('click', { bubbles: true }));
    await H.until(() => d.querySelector('.pcard[data-page="yes"]').open, 2000, 'the yes card to open');
    // settings: arrange by topic brings back the classic form
    d.querySelector('[aria-label="Editor settings"]').click();
    [...d.querySelectorAll('.edset .seg button')].find(b => b.textContent === 'By topic').click();
    H.ok([...d.querySelectorAll('.sec>summary')].some(x => /Page by page: guides/.test(x.textContent)), 'by topic did not bring the classic sections back');
    H.eq(JSON.parse(w.localStorage.getItem('ks.editor')).layout, 'topic', 'the setting was not remembered');
    w.localStorage.removeItem('ks.editor'); w.localStorage.removeItem('ks.draft.ask-date');
    w.location.hash = '#/'; await H.sleep(200);
  }, 30000);

  add('builder: designs without marks still let you tap their words', async () => {
    const { w, d } = await H.open('../index.html#/new/birthday');
    w.localStorage.removeItem('ks.draft.birthday');
    const frame = await H.until(() => d.querySelector('.pvframe iframe'), 8000, 'the preview');
    const n = await H.until(() => frame.contentDocument && frame.contentDocument.querySelector('[data-ks-edit]'), 8000, 'words matched to the form');
    const path = n.dataset.ksEdit;
    n.click();
    const box = await H.until(() => frame.contentDocument.querySelector('.ks-inbox'), 3000, 'the typing box');
    box.value = 'Changed here'; box.dispatchEvent(new frame.contentWindow.Event('input')); box.dispatchEvent(new frame.contentWindow.FocusEvent('blur'));
    await H.until(() => d.querySelector('[data-bind="' + path + '"]').value === 'Changed here', 2000, 'the form box for ' + path);
    w.localStorage.removeItem('ks.draft.birthday'); w.location.hash = '#/'; await H.sleep(200);
    return path;
  }, 30000);

  /* ---------- accounts (a pretend Supabase, so nothing real is touched) ---------- */
  const fakeSupabase = (w, pages, drafts) => {
    const calls = [], saved = {};
    const json = (body, status) => Promise.resolve(new w.Response(body == null ? null : JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json' } }));
    w.fetch = (url, opts) => {
      const path = String(url).replace(/^https?:\/\/[^/]+/, ''), auth = ((opts && opts.headers) || {}).Authorization || '';
      calls.push({ path, auth, body: opts && opts.body });
      if (path.startsWith('/auth/v1/token')) return json({ access_token: 'tok-1', refresh_token: 'ref-1', expires_in: 3600, user: { id: 'u1', email: 'me@example.com' } });
      if (path === '/rest/v1/rpc/claim_page') return json(true);
      if (path === '/rest/v1/rpc/my_pages') return json(pages);
      if (path === '/rest/v1/rpc/delete_my_page' || path === '/rest/v1/rpc/delete_draft') return json(true);
      if (path === '/rest/v1/rpc/my_drafts') return json(drafts || []);
      if (path === '/rest/v1/rpc/save_draft') { const b = JSON.parse(opts.body); saved[b.p_id] = b.p_data; return json(true); }
      if (path === '/rest/v1/rpc/get_draft') return json(saved[JSON.parse(opts.body).p_id] || null);
      if (path.startsWith('/storage/v1/object/list/')) return json([{ id: 'f1', name: 'old-photo.jpg' }]);
      if (path.startsWith('/storage/v1/object/media/')) return json({ Key: path });
      if (path === '/storage/v1/object/media' && opts.method === 'DELETE') return json(JSON.parse(opts.body).prefixes.map(n => ({ name: n })));
      return json(null, 404);
    };
    calls.saved = saved; return calls;
  };
  const cleanAccount = w => { ['ks.session', 'ks.pages'].forEach(k => w.localStorage.removeItem(k)); };

  add('accounts: sign in moves this browser’s pages into the account, and the dashboard lists them', async () => {
    const { w, d } = await H.open('../index.html#/');
    if (!w.KS.backend.configured()) return { skip: 'config.js has no Supabase keys' };
    cleanAccount(w);
    w.KS.backend.rememberPage({ id: 'localpg01', key: 'k'.repeat(28), t: 'birthday', title: 'Old one', created: Date.now() });
    const now = new Date().toISOString(), photo = w.KS.backend.publicUrl('abcdefgh02/1-x.jpg');
    const calls = fakeSupabase(w, [{ id: 'abcdefgh01', data: { t: 'birthday', d: w.KS.templates.birthday.sample }, created_at: now, updated_at: now },
                                   { id: 'abcdefgh02', data: { t: 'wedding', d: Object.assign({}, w.KS.templates.wedding.sample, { photo }) }, created_at: now, updated_at: now }],
                                  [{ id: 'draft00001', data: { t: 'garden', d: w.KS.templates.garden.sample }, created_at: now, updated_at: now }]);
    w.location.hash = '#/account';
    const email = await H.until(() => d.querySelector('#ac-email'), 5000, 'the sign-in form');
    H.ok(/move into your account/.test(d.body.textContent), 'no note about pages on this browser');
    const over0 = d.documentElement.scrollWidth - w.innerWidth;
    H.ok(over0 <= 1, `sign-in scrolls sideways on a phone by ${over0}px (screen ${w.innerWidth}px)`);
    email.value = 'me@example.com'; d.querySelector('#ac-pass').value = 'secret123';
    d.querySelector('.acct-form').requestSubmit();
    await H.until(() => d.querySelectorAll('.dash-row').length === 3, 5000, 'a draft and two pages on the dashboard');
    H.ok(d.querySelector('a[href="#/draft/draft00001"]'), 'the draft has no Continue button');
    const rows = d.querySelectorAll('.dash-row a[href^="#/edit/"]').length === 2 && [...d.querySelectorAll('.dash-row')].filter(r => r.querySelector('a[href^="#/edit/"]'));
    const claim = calls.find(c => c.path === '/rest/v1/rpc/claim_page');
    H.ok(claim && /localpg01/.test(claim.body) && claim.auth === 'Bearer tok-1', 'the page on this browser was not claimed with the sign-in');
    H.ok(calls.find(c => c.path === '/rest/v1/rpc/my_pages').auth === 'Bearer tok-1', 'the dashboard did not ask as the signed-in person');
    H.ok(rows[0].querySelector('a[href="#/edit/abcdefgh01"]'), 'no Edit button');
    const over = d.documentElement.scrollWidth - w.innerWidth;
    H.ok(over <= 1, `dashboard scrolls sideways on a phone by ${over}px`);
    w.confirm = () => true;
    [...rows[1].querySelectorAll('button')].find(b => b.textContent === 'Delete').click();
    await H.until(() => d.querySelectorAll('.dash-row').length === 2, 3000, 'the deleted page to go');
    const del = await H.until(() => calls.find(c => c.path === '/storage/v1/object/media' && c.body), 3000, 'the photos to be deleted');
    const gone = JSON.parse(del.body).prefixes;
    H.ok(gone.includes('abcdefgh02/1-x.jpg') && gone.includes('abcdefgh02/old-photo.jpg'), 'deleted files were: ' + gone.join(', '));
    [...d.querySelectorAll('button')].find(b => b.textContent === 'Sign out').click();
    await H.until(() => !w.KS.backend.signedIn(), 3000, 'signing out');
    cleanAccount(w);
    return '1 draft, 2 pages, 1 deleted with its photos';
  });

  add('accounts: a signed-in draft saves to the account with its photo, and opens again', async () => {
    const { w, d } = await H.open('../index.html#/');
    if (!w.KS.backend.configured()) return { skip: 'config.js has no Supabase keys' };
    cleanAccount(w); w.localStorage.removeItem('ks.draft.birthday');
    const calls = fakeSupabase(w, [], []);
    w.localStorage.setItem('ks.session', JSON.stringify({ access_token: 'tok-1', refresh_token: 'r', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1', email: 'me@example.com' } }));
    w.location.hash = '#/new/birthday';
    const input = await H.until(() => d.querySelector('.ed-form input[type=text]'), 8000, 'the editor');
    H.ok(/account/.test(d.querySelector('.ttl small').textContent), 'editor does not say drafts go to the account');
    // a photo the person just added (as the photo picker does), then a typed change
    const blobUrl = w.KS.util.addBlob(new w.Blob(['x'], { type: 'image/jpeg' }), 'jpg', 'me.jpg');
    input.value = 'Hello draft'; input.dispatchEvent(new w.Event('input'));
    const saveCall = () => calls.find(c => c.path === '/rest/v1/rpc/save_draft');
    await H.until(saveCall, 6000, 'the draft to save');
    const id = (w.location.hash.match(/^#\/draft\/(\w+)$/) || [])[1];
    H.ok(id && calls.saved[id], 'address did not change to the draft: ' + w.location.hash);
    H.ok(JSON.stringify(calls.saved[id]).includes('Hello draft'), 'typed text not in the saved draft');
    // the uploader swaps photos for their online address inside the draft
    const map = await w.KS.backend.uploadBlobMap({ p: blobUrl }, 'drafts/' + id);
    H.ok(calls.some(c => c.path.startsWith('/storage/v1/object/media/drafts/' + id + '/')), 'photo not uploaded into the draft folder');
    const obj = { p: blobUrl }; w.KS.backend.swapUrls(obj, map); H.ok(obj.p.startsWith(w.KS.backend.publicUrl('drafts/')), 'photo address not swapped');
    // open it again from the dashboard link
    w.location.hash = '#/account'; await H.until(() => d.querySelector('.dash-head'), 4000, 'the dashboard');
    w.location.hash = '#/draft/' + id;
    await H.until(() => d.querySelector('.draftbar') && /Carrying on/.test(d.querySelector('.draftbar').textContent), 6000, 'the draft to open again');
    w.location.hash = '#/'; await H.sleep(200);
    cleanAccount(w);
    return 'draft ' + id;
  }, 30000);

  add('accounts: an email link signs you in and opens the dashboard', async () => {
    const { w, d } = await H.open('../index.html?preview=1');
    if (!w.KS.backend.configured()) return { skip: 'config.js has no Supabase keys' };
    cleanAccount(w); fakeSupabase(w, []);
    w.history.replaceState(null, '', w.location.pathname + '#access_token=tok-9&refresh_token=r9&expires_in=3600&type=signup');
    w.fetch = ((f) => (url, o) => String(url).includes('/auth/v1/user') ? Promise.resolve(new w.Response(JSON.stringify({ id: 'u9', email: 'x@y.z' }), { status: 200 })) : f(url, o))(w.fetch);
    const r = await w.KS.backend.takeSessionFromUrl();
    H.eq(r.type, 'signup', 'link type');
    H.eq(w.KS.backend.user().email, 'x@y.z', 'signed-in email');
    H.ok(w.KS.backend.session().access_token === 'tok-9', 'session not saved');
    cleanAccount(w);
  });

  /* ---------- smoothness ---------- */
  for (const id of CUTE) add(`${id}: animates smoothly`, async () => {
    const { w, d } = await H.render(id);
    const open = d.querySelector('#qHeart'); if (open) for (let i = 0; i < 5; i++) open.click(); else d.querySelector('#aYes').click();
    const f = await H.frames(w, 2500);
    H.ok(f.slow <= 3, `${f.slow} slow frames (worst ${f.max} ms)`);
    return `${f.n} frames, worst ${f.max} ms`;
  });

  return T;
};
