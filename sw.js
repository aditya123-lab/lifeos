/* LIFE OS — service worker: offline app shell, notification clicks, optional Web Push. */
const VERSION = 'lifeos-v1.2.2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/core.js', 'js/store.js', 'js/ui.js', 'js/app.js', 'js/notify.js',
  'js/pages/dashboard.js', 'js/pages/habits.js', 'js/pages/study.js', 'js/pages/copywriting.js', 'js/pages/fitness.js',
  'js/pages/nutrition.js', 'js/pages/supplements.js', 'js/pages/journal.js', 'js/pages/private.js', 'js/pages/calendar.js', 'js/pages/progress.js', 'js/pages/settings.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/badge-72.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// stale-while-revalidate for same-origin GET requests → works fully offline, updates in background
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await network) || new Response('Offline', { status: 503, statusText: 'Offline' });
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.hash) || '#/dashboard';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.postMessage({ type: 'navigate', hash }); return c.focus(); } }
    return self.clients.openWindow('./' + hash);
  }));
});

// Optional Web Push (requires your own server, see /push-server). Payload: {title, body, hash, tag}
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'LIFE OS', {
    body: d.body || 'Kamu punya pengingat.', tag: d.tag || 'lifeos-push', icon: 'icons/icon-192.png', badge: 'icons/badge-72.png', data: { hash: d.hash || '#/dashboard' }
  }));
});
