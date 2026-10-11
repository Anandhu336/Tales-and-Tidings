/* Tales & Tidings music: built-in library, an uploaded file, or a YouTube link.
   start() must be called from inside a tap/click, otherwise the browser blocks the sound. */
(function () {
  'use strict';
  const KS = window.KS, u = KS.util;

  /* Built-in songs. To add one: put the file in /music and add a line here. */
  KS.TRACKS = [
    { id: 'g1', name: 'Calm guitar 1', mood: 'Soft & gentle', file: 'music/gymnopedie-1.m4a', credit: 'Satie, Gymnopédie No. 1 (guitar: Michael Laucke, public domain)' },
    { id: 'g2', name: 'Calm guitar 2', mood: 'Slow & dreamy', file: 'music/gymnopedie-2.m4a', credit: 'Satie, Gymnopédie No. 2 (guitar: Michael Laucke, public domain)' }
  ];
  KS.trackOf = id => KS.TRACKS.find(t => t.id === id) || null;

  const VOL = 0.55;
  let styled = false;
  function addStyle() {
    if (styled) return; styled = true;
    document.head.append(u.el('style', {}, `
      .ks-music{position:fixed;z-index:2147483000;right:12px;bottom:calc(env(safe-area-inset-bottom) + 12px);appearance:none;border:1px solid rgba(255,255,255,.35);background:rgba(20,20,30,.62);color:#fff;
        backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:999px;padding:8px 14px;font:600 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.25)}
      .ks-music:hover{background:rgba(20,20,30,.8)}
      .ks-yt{position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:.01;pointer-events:none;border:0}
      #ks-toast{position:fixed;z-index:2147483001;left:50%;bottom:26px;transform:translate(-50%,20px);opacity:0;background:#fff;color:#222;font:600 14px system-ui,sans-serif;padding:10px 18px;border-radius:999px;transition:all .3s;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:90vw;text-align:center}
      #ks-toast.show{opacity:1;transform:translate(-50%,0)}`));
  }

  /* m = { type: 'none' | 'library' | 'upload' | 'youtube', id | src, name } */
  KS.musicSource = m => {
    if (!m) return null;
    if (m.type === 'library') { const t = KS.trackOf(m.id); return t ? { kind: 'file', src: t.file } : null; }
    if (m.type === 'upload' && m.src) return { kind: 'file', src: m.src };
    if (m.type === 'youtube') { const id = u.youtubeId(m.src) || (/^[\w-]{11}$/.test(m.src || '') ? m.src : ''); return id ? { kind: 'yt', id } : null; }
    return null;
  };

  KS.createMusic = m => {
    const S = KS.musicSource(m);
    const c = { has: !!S, playing: false, muted: false, btn: null };
    let audio = null, yt = null, fadeId = 0;
    const label = () => { if (c.btn) c.btn.textContent = c.playing ? '♪ Music on' : '♪ Music off'; };
    const fade = (to, ms, done) => {
      if (!audio) return; const id = ++fadeId, from = audio.volume, t0 = performance.now();
      (function step(now) {
        if (fadeId !== id) return;
        const k = Math.min(1, Math.max(0, now - t0) / ms);
        try { audio.volume = from + (to - from) * k; } catch (_) {}
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      })(t0);
    };
    const ytCmd = (func, args) => { try { yt.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*'); } catch (_) {} };

    c.start = () => {
      if (!S || c.muted) return;
      addStyle();
      if (!c.btn) { c.btn = u.el('button', { class: 'ks-music', type: 'button', 'aria-label': 'Turn music on or off', onclick: () => c.toggle() }); document.body.append(c.btn); }
      if (S.kind === 'file') {
        if (!audio) { audio = new Audio(S.src); audio.loop = true; audio.volume = 0; audio.preload = 'auto'; }
        c.playing = true; label();
        const pr = audio.play();
        if (pr && pr.then) pr.then(() => fade(VOL, 3000)).catch(() => { c.playing = false; label(); }); // blocked or missing file: the button lets them try again
      } else {
        if (!yt) {
          yt = u.el('iframe', { class: 'ks-yt', allow: 'autoplay; encrypted-media', title: 'Music', tabindex: '-1',
            src: `https://www.youtube-nocookie.com/embed/${S.id}?enablejsapi=1&autoplay=1&loop=1&playlist=${S.id}&controls=0&playsinline=1&rel=0` });
          document.body.append(yt);
        } else { ytCmd('playVideo'); }
        c.playing = true; label();
      }
    };
    c.stop = () => {
      c.playing = false; label();
      if (audio) fade(0, 700, () => audio.pause()); else if (yt) ytCmd('pauseVideo');
    };
    c.toggle = () => { if (c.playing) { c.muted = true; c.stop(); } else { c.muted = false; c.start(); } };
    /* Phones only allow sound after the visitor touches the page. So: try right away (some browsers allow it),
       and if that is blocked, start on their very first tap, swipe or key press anywhere. */
    const EVS = ['pointerup', 'touchend', 'click', 'keydown'];
    const onFirst = () => { EVS.forEach(e => removeEventListener(e, onFirst, true)); if (!c.playing && !c.muted) c.start(); };
    c.autoplay = () => { if (!S) return; c.start(); EVS.forEach(e => addEventListener(e, onFirst, true)); };
    c.destroy = () => {
      EVS.forEach(e => removeEventListener(e, onFirst, true));
      fadeId++; if (audio) { audio.pause(); audio = null; } if (yt) { yt.remove(); yt = null; } if (c.btn) { c.btn.remove(); c.btn = null; } c.playing = false;
    };
    return c;
  };
})();
