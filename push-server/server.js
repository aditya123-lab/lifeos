/* LIFE OS — OPTIONAL Web Push reminder server (self-hosted, free).
 *
 * Why: browsers cannot run timers when a web app is fully closed. A tiny always-on server
 * can send Web Push messages at reminder times; the LIFE OS service worker displays them.
 *
 * Setup:
 *   cd push-server && npm install
 *   npx web-push generate-vapid-keys            # copy keys into .env (see .env.example)
 *   In LIFE OS: Pengaturan → Notifikasi → Setup Web Push → paste PUBLIC key → Subscribe
 *   Copy the JSON shown and save it as push-server/subscription.json  (or POST it to /subscribe)
 *   npm start
 *
 * Security: the VAPID PRIVATE key lives ONLY here (env var), never in the frontend.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const PORT = process.env.PORT || 8787;
const PUB = process.env.VAPID_PUBLIC_KEY, PRIV = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';
const TOKEN = process.env.SUBSCRIBE_TOKEN || ''; // optional shared secret for POST /subscribe
const FILE = path.join(__dirname, 'subscription.json');
if (!PUB || !PRIV) { console.error('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (see .env.example)'); process.exit(1); }
webpush.setVapidDetails(SUBJECT, PUB, PRIV);

const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; } };
const sent = new Set();

function localParts(tz) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, wd, hm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function quiet(q, t) { if (!q || !q.start || !q.end || q.start === q.end) return false; const s = toMin(q.start), e = toMin(q.end), m = toMin(t); return s < e ? m >= s && m < e : m >= s || m < e; }

async function tick() {
  const cfg = load(); if (!cfg || !cfg.subscription) return;
  const now = localParts(cfg.timezone || 'Asia/Jakarta');
  for (const r of cfg.reminders || []) {
    if (r.time !== now.hm || !r.days.includes(now.wd) || quiet(cfg.quiet, r.time)) continue;
    const key = now.date + '|' + r.id; if (sent.has(key)) continue; sent.add(key);
    try {
      await webpush.sendNotification(cfg.subscription, JSON.stringify({ title: r.title, body: r.body, tag: 'rem-' + r.id, hash: '#/dashboard' }));
      console.log(new Date().toISOString(), 'sent', r.id);
    } catch (e) { console.error('push failed', e.statusCode, e.body || e.message); if (e.statusCode === 410) console.error('Subscription expired — subscribe again in the app.'); }
  }
  if (sent.size > 500) sent.clear();
}
setInterval(tick, 20 * 1000); tick();

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method === 'GET' && req.url === '/health') { res.writeHead(200); return res.end('ok'); }
  if (req.method === 'POST' && req.url === '/subscribe') {
    if (TOKEN && req.headers.authorization !== 'Bearer ' + TOKEN) { res.writeHead(401); return res.end('unauthorized'); }
    let body = ''; req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { const j = JSON.parse(body); if (!j.subscription) throw new Error('missing subscription'); fs.writeFileSync(FILE, JSON.stringify(j, null, 2)); res.writeHead(200); res.end('saved'); } catch (e) { res.writeHead(400); res.end(e.message); } });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log('LIFE OS push server on :' + PORT));
