/* LIFE OS — notify.js : service worker registration, local reminders, optional Web Push.
 *
 * HONEST CAPABILITY SUMMARY
 *  1. While LIFE OS is open (foreground or a background tab that the browser has not frozen):
 *     reminders fire as real system notifications via ServiceWorkerRegistration.showNotification().
 *  2. When the app/browser is fully closed: a web page cannot run timers. Reliable notifications then
 *     need either (a) a push server (Web Push, optional architecture in /push-server), or
 *     (b) exporting reminders to the phone calendar as .ics (OS-level alarms, no server needed).
 *  3. Notification Triggers (scheduled local notifications) are used only if the browser exposes them
 *     (`showTrigger`) — currently an experimental API not shipped in stable Chrome.
 *  4. When notifications are blocked/unsupported, an in-app fallback (toast + "missed reminders" banner) is used.
 */
(function (root) {
  'use strict';
  const C = root.LifeCore, Store = root.LifeStore, UI = root.UI;
  let reg = null, loop = null, nextTimer = null, swError = '';

  const support = () => ({
    notification: 'Notification' in root,
    permission: 'Notification' in root ? Notification.permission : 'unsupported',
    serviceWorker: 'serviceWorker' in navigator,
    secure: root.isSecureContext,
    triggers: 'Notification' in root && 'showTrigger' in Notification.prototype,
    push: 'PushManager' in root,
    standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    swActive: !!(reg && reg.active),
    swError
  });

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    if (!/^https?:$/.test(location.protocol)) { swError = 'Service worker butuh http(s) — buka lewat server lokal/hosting, bukan file://'; return null; }
    try {
      reg = await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      reg = await navigator.serviceWorker.getRegistration() || reg;
      navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'navigate') location.hash = e.data.hash; });
      return reg;
    } catch (e) { swError = e.message; console.warn('SW registration failed', e); return null; }
  }

  async function requestPermission() {
    if (!('Notification' in root)) { UI.toast('Browser ini tidak mendukung notifikasi', 'error'); return 'unsupported'; }
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p === 'granted') { App.commit(s => { s.settings.notif.enabled = true; }, { quiet: true }); scheduleTriggers(); }
    else if (p === 'denied') UI.toast('Izin notifikasi ditolak. Aktifkan lewat pengaturan situs di browser.', 'error', 4000);
    return p;
  }

  /** Show a notification (system if allowed, otherwise in-app). Returns the channel used. */
  async function show(title, body, tag = 'lifeos', opts = {}) {
    const s = Store.get();
    const canSystem = s.settings.notif.enabled && 'Notification' in root && Notification.permission === 'granted';
    if (canSystem) {
      const o = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/badge-72.png', renotify: true, data: { hash: opts.hash || '#/dashboard' }, vibrate: [80, 40, 80] };
      try {
        if (reg && reg.showNotification) { await reg.showNotification(title, o); return 'system'; }
        new Notification(title, o); return 'system';
      } catch (e) { console.warn(e); }
    }
    if (s.settings.notif.inApp && document.visibilityState === 'visible') UI.toast(title + ' — ' + body, 'info', 5000);
    return 'inapp';
  }

  const ROUTES = { routine: '#/dashboard', supplement: '#/supplements', university: '#/calendar', gym: '#/fitness', study: '#/study', copy: '#/copywriting', meal: '#/nutrition', private: '#/dashboard', habit: '#/habits', event: '#/calendar' };
  function check() {
    const s = Store.get(), now = new Date();
    const due = C.dueReminders(s, now);
    if (!due.length) return;
    for (const r of due) {
      // privacy: private reminders always use a generic title/body
      const title = r.type === 'private' ? 'LIFE OS' : r.label;
      const body = r.type === 'private' ? 'Waktunya check-in harian singkat.' : r.body;
      show(title, body, 'rem-' + r.id, { hash: ROUTES[r.type] || '#/dashboard' });
      s.reminderLog[C.dateKey(now) + '|' + r.id] = now.toISOString();
    }
    // prune log (> 14 days)
    const cutoff = C.addDays(C.dateKey(now), -14);
    for (const key of Object.keys(s.reminderLog)) if (key.slice(0, 10) < cutoff) delete s.reminderLog[key];
    Store.save();
    planNext();
  }
  function planNext() {
    clearTimeout(nextTimer);
    const n = C.nextReminderTime(Store.get());
    if (!n) return;
    const ms = n.at - Date.now();
    if (ms > 0 && ms < 2 ** 31 - 1) nextTimer = setTimeout(check, ms + 500);
  }

  /** Experimental: schedule next-24h reminders with Notification Triggers if (and only if) supported. */
  async function scheduleTriggers() {
    const sp = support();
    if (!sp.triggers || !reg || Notification.permission !== 'granted') return 0;
    const s = Store.get(); let n = 0;
    try {
      const old = await reg.getNotifications({ includeTriggered: false });
      old.filter(x => x.tag && x.tag.startsWith('trg-')).forEach(x => x.close());
      const now = new Date();
      for (let d = 0; d < 2; d++) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
        for (const r of s.reminders) {
          if (!r.enabled || !r.days.includes(day.getDay())) continue;
          const t = C.toMin(r.time); const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(t / 60), t % 60);
          if (at <= now || C.inQuietHours(s, t)) continue;
          await reg.showNotification(r.type === 'private' ? 'LIFE OS' : r.label, { body: r.type === 'private' ? 'Waktunya check-in harian singkat.' : r.body, tag: 'trg-' + r.id + '-' + C.dateKey(at), showTrigger: new root.TimestampTrigger(at.getTime()), icon: 'icons/icon-192.png' });
          n++;
        }
      }
    } catch (e) { console.warn('Triggers failed', e); }
    return n;
  }

  // ------------------------------------------------------------ optional Web Push (requires your own server)
  function urlB64ToUint8Array(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }
  async function subscribePush(vapidPublicKey) {
    if (!reg || !('PushManager' in root)) throw new Error('Push tidak didukung di konteks ini (butuh HTTPS + service worker aktif)');
    if (Notification.permission !== 'granted') { const p = await requestPermission(); if (p !== 'granted') throw new Error('Izin notifikasi diperlukan'); }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(vapidPublicKey.trim()) });
    return sub.toJSON();
  }
  async function unsubscribePush() { if (!reg) return false; const sub = await reg.pushManager.getSubscription(); return sub ? sub.unsubscribe() : false; }

  async function init() {
    await registerSW();
    check(); planNext();
    clearInterval(loop); loop = setInterval(check, 20000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { check(); planNext(); } });
    scheduleTriggers();
    // PWA install prompt (Android Chrome)
    root.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); Notify.installPrompt = e; if (App.route.name === 'settings') App.render(); });
    root.addEventListener('appinstalled', () => { Notify.installPrompt = null; UI.toast('LIFE OS terpasang di perangkat', 'good'); });
  }

  const Notify = { init, support, requestPermission, show, check, planNext, scheduleTriggers, subscribePush, unsubscribePush, installPrompt: null, ensurePermissionSoft() {}, get reg() { return reg; } };
  root.Notify = Notify;
})(window);
