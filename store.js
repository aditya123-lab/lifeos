/* LIFE OS — store.js : persistence (localStorage), auto-snapshots, backup/restore. */
(function (root) {
  'use strict';
  const C = root.LifeCore;
  const KEY = 'lifeos.state.v1';
  const SNAP_KEY = 'lifeos.snapshots.v1';
  let state = null, saveTimer = null, lastError = null;
  const listeners = new Set();

  function storageAvailable() {
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; }
  }
  function load() {
    lastError = null;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? C.migrate(JSON.parse(raw)) : C.defaultState();
      if (!raw) { const n = new Date(), k = C.dateKey(n), m = n.getHours() * 60 + n.getMinutes(); state.reminders.forEach(r => { if (C.toMin(r.time) <= m) state.reminderLog[k + '|' + r.id] = 'before-install'; }); }
      if (!raw) persistNow();
    } catch (e) {
      lastError = 'Gagal membaca data tersimpan: ' + e.message;
      console.error(e);
      // keep corrupted copy so it is never silently lost
      try { const bad = localStorage.getItem(KEY); if (bad) localStorage.setItem(KEY + '.corrupt.' + Date.now(), bad); } catch (_) {}
      state = C.defaultState();
    }
    return state;
  }
  function persistNow() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      lastError = null;
      autoSnapshot();
      return true;
    } catch (e) {
      lastError = e && e.name === 'QuotaExceededError' ? 'Penyimpanan penuh. Ekspor backup lalu hapus data lama.' : 'Gagal menyimpan: ' + e.message;
      console.error(e);
      return false;
    }
  }
  function save() { // debounced
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 150);
    listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  }
  function flush() { clearTimeout(saveTimer); return persistNow(); }
  function get() { return state; }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  // one automatic snapshot per day, keep last 5
  function autoSnapshot() {
    try {
      const today = C.dateKey();
      const snaps = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]');
      if (snaps.length && snaps[0].date === today) return;
      snaps.unshift({ date: today, at: new Date().toISOString(), data: JSON.stringify(state) });
      localStorage.setItem(SNAP_KEY, JSON.stringify(snaps.slice(0, 5)));
    } catch (e) { /* snapshots are best-effort */ }
  }
  function snapshots() {
    try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]').map(s => ({ date: s.date, at: s.at, size: s.data.length })); } catch (e) { return []; }
  }
  function restoreSnapshot(date) {
    const snaps = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]');
    const s = snaps.find(x => x.date === date);
    if (!s) throw new Error('Snapshot tidak ditemukan');
    state = C.migrate(JSON.parse(s.data));
    return flush();
  }
  function exportJSON() {
    return JSON.stringify({ app: 'LIFE OS', exportedAt: new Date().toISOString(), version: state.version, data: state }, null, 1);
  }
  function importJSON(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('File bukan JSON yang valid'); }
    const data = obj && obj.app === 'LIFE OS' ? obj.data : obj;
    if (!data || !Array.isArray(data.habits) || !Array.isArray(data.xpTx)) throw new Error('File ini bukan backup LIFE OS');
    const migrated = C.migrate(data);
    // safety copy of current data before overwrite
    try { localStorage.setItem(KEY + '.before-import', JSON.stringify(state)); } catch (_) {}
    state = migrated;
    return flush();
  }
  function resetAll() {
    try { localStorage.setItem(KEY + '.before-reset', JSON.stringify(state)); } catch (_) {}
    state = C.defaultState();
    return flush();
  }
  function usageBytes() {
    try { return (localStorage.getItem(KEY) || '').length * 2; } catch (e) { return 0; }
  }
  async function requestPersistent() {
    try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) {}
    return false;
  }

  root.LifeStore = { load, save, flush, get, onChange, exportJSON, importJSON, resetAll, snapshots, restoreSnapshot, usageBytes, storageAvailable, requestPersistent, get error() { return lastError; } };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
})(window);
