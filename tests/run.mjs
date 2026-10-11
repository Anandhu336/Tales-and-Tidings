/* Tales & Tidings automatic tests. No installs needed: uses Node 18+ and the Google Chrome already on this computer.
     node tests/run.mjs            run everything
     node tests/run.mjs quest      only tests whose name contains "quest"
     CHROME=/path/to/chrome node tests/run.mjs   if Chrome is somewhere else
   1) checks every script parses and every sticker file exists,
   2) serves the site locally and drives Chrome (phone-sized screen) through tests/harness.html, which runs tests/suites.js. */
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv[2] || '';
const results = [];
const C = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m` };
const report = (name, ok, msg, ms) => { results.push({ name, ok, msg }); console.log(`${ok ? C.g('✓') : C.r('✗')} ${name}${ms != null ? C.d(` (${ms} ms)`) : ''}${msg ? (ok ? C.d(' — ' + msg) : '\n    ' + C.r(msg)) : ''}`); };

/* ---------- 1. checks that need no browser ---------- */
const js = ['config.js', 'reviews.js', ...['js', 'templates'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f))];
if (!only || 'scripts parse'.includes(only)) {
  const bad = js.filter(f => { try { new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); return false; } catch (e) { console.log('   ' + f + ': ' + e.message); return true; } });
  report(`all ${js.length} scripts parse`, !bad.length, bad.join(', '));
}
if (!only || 'stickers'.includes(only)) {
  const core = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8'), m = /u\.STK = new Set\('([^']*)'/.exec(core);
  const listed = m ? m[1].split(' ') : [], files = fs.readdirSync(path.join(ROOT, 'stickers')).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5));
  const missing = listed.filter(c => !files.includes(c)), unlisted = files.filter(c => !listed.includes(c));
  const big = files.filter(c => fs.statSync(path.join(ROOT, 'stickers', c + '.webp')).size > 300 * 1024);
  report(`stickers: ${listed.length} listed, all files present`, !missing.length && !unlisted.length,
    [missing.length && 'missing files: ' + missing.join(' '), unlisted.length && 'files not in the list: ' + unlisted.join(' ')].filter(Boolean).join('; '));
  report('stickers: none over 300 KB', !big.length, big.join(' '));
}

/* ---------- 2. browser tests ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split(/[?#]/)[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(p, (err, st) => {
    const file = !err && st.isDirectory() ? path.join(p, 'index.html') : p;
    fs.readFile(file, (e, buf) => { if (e) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); });
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let chrome = null;
const chromePath = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
if (!chromePath) { report('find Chrome', false, 'Chrome not found. Set CHROME=/path/to/chrome'); finish(); }
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'tt-tests-'));
chrome = spawn(chromePath, ['--headless=new', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--autoplay-policy=user-gesture-required', '--window-size=420,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => {
  let buf = ''; const t = setTimeout(() => rej(new Error('Chrome did not start')), 20000);
  chrome.stderr.on('data', d => { buf += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf); if (m) { clearTimeout(t); res(m[1]); } });
});
const browser = new WebSocket(wsUrl); await new Promise(r => { browser.onopen = r; });
let id = 0; const pending = new Map(), handlers = [];
browser.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else handlers.forEach(h => h(m)); };
const send = (method, params, sessionId) => new Promise(r => { pending.set(++id, r); browser.send(JSON.stringify({ id, method, params, sessionId })); });

const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Runtime.enable'); await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

/* the harness talks to us through console messages starting with § */
let current = null, started = 0, doneResolve; const done = new Promise(r => { doneResolve = r; });
handlers.push(m => {
  if (m.sessionId !== sessionId) return;
  if (m.method === 'Runtime.consoleAPICalled') {
    const txt = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
    if (txt.startsWith('§start ')) { current = { name: txt.slice(7), errors: [] }; started = Date.now(); }
    else if (txt.startsWith('§pass ') || txt.startsWith('§fail ') || txt.startsWith('§skip ')) {
      const [kind, ...rest] = txt.slice(1).split(' '); const [name, msg] = rest.join(' ').split('§§');
      if (kind === 'skip') { console.log(`${C.y('–')} ${name} ${C.d('(skipped: ' + (msg || '') + ')')}`); current = null; return; }
      const errs = current ? current.errors : [];
      report(name, kind === 'pass' && !errs.length, [kind === 'fail' ? msg : '', ...errs].filter(Boolean).join('\n    ') || (kind === 'pass' ? msg : ''), Date.now() - started);
      current = null;
    } else if (txt === '§done') doneResolve();
    else if (m.params.type === 'error' && current && !/favicon|ERR_|net::/.test(txt)) current.errors.push('console error: ' + txt.slice(0, 300));
  }
  if (m.method === 'Runtime.exceptionThrown' && current) {
    const d = m.params.exceptionDetails; current.errors.push('page error: ' + ((d.exception && d.exception.description) || d.text).split('\n')[0] + (d.url ? ` (${d.url.replace(base, '')}:${d.lineNumber + 1})` : ''));
  }
});

await S('Page.navigate', { url: `${base}/tests/harness.html${only ? '?only=' + encodeURIComponent(only) : ''}` });
const timeout = setTimeout(() => { report('test run finished in time', false, 'stopped after 10 minutes' + (current ? ', stuck in: ' + current.name : '')); doneResolve(); }, 10 * 60 * 1000);
await done; clearTimeout(timeout);
finish();

function finish() {
  try { chrome && chrome.kill(); } catch (_) {}
  server.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n' + (failed.length ? C.r(`${failed.length} failed`) + ', ' : '') + C.g(`${results.length - failed.length} passed`));
  process.exit(failed.length ? 1 : 0);
}
