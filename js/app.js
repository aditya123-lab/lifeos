/* LIFE OS — app.js : app shell, router, state commits, gamification feedback, shared timer. */
(function (root) {
  'use strict';
  const C = root.LifeCore, Store = root.LifeStore, UI = root.UI;
  const { esc, icon, fmt } = UI;

  const NAV = [
    { id: 'dashboard', label: 'Beranda', icon: 'home', group: 'main' },
    { id: 'habits', label: 'Habit', icon: 'check', group: 'main' },
    { id: 'calendar', label: 'Kalender', icon: 'calendar', group: 'main' },
    { id: 'study', label: 'Belajar', icon: 'book', group: 'mod' },
    { id: 'copywriting', label: 'Copywriting', icon: 'pen', group: 'mod' },
    { id: 'fitness', label: 'Fitness', icon: 'dumbbell', group: 'mod' },
    { id: 'nutrition', label: 'Nutrisi', icon: 'leaf', group: 'mod' },
    { id: 'supplements', label: 'Suplemen', icon: 'pill', group: 'mod' },
    { id: 'private', label: 'Ruang Privat', icon: 'shield', group: 'mod' },
    { id: 'progress', label: 'Progress', icon: 'chart', group: 'growth' },
    { id: 'achievements', label: 'Achievement', icon: 'trophy', group: 'growth' },
    { id: 'rewards', label: 'Reward Shop', icon: 'gift', group: 'growth' },
    { id: 'settings', label: 'Pengaturan', icon: 'settings', group: 'sys' }
  ];
  const BOTTOM = ['dashboard', 'habits', 'calendar', 'progress', 'menu'];

  const App = {
    pages: {}, actions: {}, route: { name: 'dashboard', params: [] },
    today: C.dateKey(), privateUnlocked: false, NAV,
    S: () => Store.get(),

    /** Run a state mutation, then: sync linked habits, check achievements, save, give feedback, re-render. */
    commit(mutator, { render = true, quiet = false } = {}) {
      const s = Store.get();
      const lvBefore = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
      const result = mutator(s);
      const linked = C.syncLinked(s);
      const unlocked = C.checkAchievements(s);
      const lvAfter = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
      Store.save();
      const delta = lvAfter.total - lvBefore.total;
      if (!quiet && delta > 0) UI.toast('+' + fmt(delta) + ' XP', 'xp');
      if (!quiet && delta < 0) UI.toast(fmt(delta) + ' XP (dibatalkan)', 'info');
      for (const c of linked) if (c.done) UI.toast('Otomatis selesai: ' + c.h.name, 'good');
      if (lvAfter.level > lvBefore.level) {
        const rankUp = lvAfter.rank.name !== lvBefore.rank.name;
        setTimeout(() => UI.celebrate({ title: 'Level Up! Level ' + lvAfter.level, subtitle: rankUp ? 'Rank baru: ' + lvAfter.rank.name + '. Konsistensimu terbayar.' : 'Rank ' + lvAfter.rank.name + ' · ' + fmt(lvAfter.toNext) + ' XP ke level berikutnya', iconName: 'crown', color: lvAfter.rank.color }), 250);
      }
      unlocked.forEach((a, i) => setTimeout(() => UI.celebrate({ title: a.name, subtitle: 'Achievement terbuka · +' + a.xp + ' XP — ' + a.desc, iconName: a.icon }), 400 + i * 200));
      if (render) App.render();
      App.renderChrome();
      return result;
    },

    go(path) { if (location.hash !== '#/' + path) location.hash = '#/' + path; else App.render(); },

    parseRoute() {
      const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
      const [name, ...params] = h.split('/').map(decodeURIComponent);
      return { name: App.pages[name] ? name : 'dashboard', params };
    },

    render() {
      const prev = App.route.name;
      App.route = App.parseRoute();
      const page = App.pages[App.route.name];
      const view = UI.$('#view');
      const y = window.scrollY;
      try {
        view.innerHTML = page.render(App.route.params);
        if (page.mount) page.mount(view, App.route.params);
      } catch (e) {
        console.error(e);
        view.innerHTML = `<div class="card"><h3>Terjadi kesalahan</h3><p class="muted small" style="margin:8px 0">${esc(e.message)}</p><button class="btn" data-act="reload">Muat ulang</button></div>`;
      }
      if (prev !== App.route.name) { window.scrollTo(0, 0); view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; }
      else window.scrollTo(0, y);
      App.renderChrome();
    },

    renderChrome() {
      const s = Store.get();
      const lv = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
      const cur = App.route.name;
      const page = App.pages[cur];
      const groups = { main: '', mod: 'Modul', growth: 'Gamifikasi', sys: 'Sistem' };
      let side = `<div class="brand"><div class="brand-mark">OS</div><div><b>LIFE OS</b><small>Build Discipline</small></div></div>`;
      let lastG = null;
      for (const n of NAV) {
        if (n.group !== lastG) { if (groups[n.group]) side += `<div class="side-label">${groups[n.group]}</div>`; lastG = n.group; }
        side += `<a class="side-link ${cur === n.id ? 'active' : ''}" href="#/${n.id}">${icon(n.icon, 18)}<span>${n.label}</span></a>`;
      }
      UI.$('#sidebar').innerHTML = side;
      UI.$('#bottomnav').innerHTML = BOTTOM.map(id => {
        if (id === 'menu') { const inMenu = !['dashboard', 'habits', 'calendar', 'progress'].includes(cur); return `<a href="#/menu" class="${inMenu ? 'active' : ''}">${icon('grid', 22)}<span>Menu</span></a>`; }
        const n = NAV.find(x => x.id === id);
        return `<a href="#/${id}" class="${cur === id ? 'active' : ''}">${icon(n.icon, 22)}<span>${n.label}</span></a>`;
      }).join('');
      const theme = document.documentElement.dataset.theme;
      UI.$('#topbar').innerHTML = `<h1>${esc(page && page.title ? (typeof page.title === 'function' ? page.title() : page.title) : 'LIFE OS')}</h1>
        <a class="xp-chip" href="#/progress" title="Level & XP">${icon('bolt', 15)}Lv ${lv.level} · ${fmt(C.balanceXP(s))} XP</a>
        <button class="icon-btn" data-act="toggleTheme" aria-label="Ganti tema">${icon(theme === 'dark' ? 'sun' : 'moon', 19)}</button>`;
      App.renderBanner();
      App.timer.renderDock();
    },

    renderBanner() {
      const s = Store.get(), el = UI.$('#banner');
      const items = [];
      if (Store.error) items.push(`<div class="banner warn">${icon('info', 18)}<span>${esc(Store.error)}</span></div>`);
      if (root.Notify && App.route.name === 'dashboard') {
        const missed = C.missedReminders(s).filter(r => !App._dismissedMissed || !App._dismissedMissed.includes(r.id));
        if (missed.length && s.settings.notif.inApp) items.push(`<div class="banner">${icon('bell', 18)}<span><b>Pengingat terlewat:</b> ${missed.map(r => esc(r.label)).join(', ')}</span><span class="spacer"></span><button class="btn sm ghost" data-act="dismissMissed">Tutup</button></div>`);
      }
      el.innerHTML = items.join('');
    },

    applyTheme() {
      let t = Store.get().settings.theme;
      if (t === 'system') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
      const meta = document.querySelector('meta[name=theme-color]:not([media])');
      if (meta) meta.content = t === 'dark' ? '#0b0b10' : '#f4f4f7';
    },

    // ------------------------------------------------------------ shared task rendering
    taskRow(h, k, { showPeriod = false, readOnly = false } = {}) {
      const s = Store.get();
      const st = C.statusOf(s, k, h.id);
      const cls = st ? (st.s === 'done' ? 'done' : 'skipped') : '';
      const pinned = (s.topPicks[k] || []).includes(h.id);
      const meta = [];
      if (h.time) meta.push(icon('clock', 12) + h.time);
      if (!C.isMandatoryOn(h, k)) meta.push('<span class="pill">Opsional</span>');
      else if (!h.mandatory) meta.push('<span class="pill warn">Wajib hari ini</span>');
      if (h.link) meta.push('<span class="pill accent" title="Selesai otomatis dari modul terkait">Auto</span>');
      if (pinned) meta.push('<span class="pill warn">Prioritas</span>');
      if (st && st.s === 'skipped') meta.push('<span class="pill">Dilewati: ' + esc(st.reason) + '</span>');
      if (showPeriod) meta.push(esc((C.PERIODS.find(p => p.id === h.period) || {}).label || ''));
      const linkInfo = App.linkProgress(h, k);
      if (linkInfo) meta.push(esc(linkInfo));
      return `<div class="task ${cls}">
        <button class="tick" ${readOnly ? 'disabled' : ''} data-act="toggleHabit" data-id="${h.id}" data-date="${k}" aria-label="${st && st.s === 'done' ? 'Batalkan' : 'Selesaikan'} ${esc(h.name)}">${st && st.s === 'skipped' ? icon('skip', 13) : icon('check', 15)}</button>
        <div class="t-main" data-act="habitMenu" data-id="${h.id}" data-date="${k}"><div class="t-name">${esc(h.name)}</div>${meta.length ? `<div class="t-meta">${meta.join(' ')}</div>` : ''}</div>
        <span class="xp">+${h.xp}</span>
      </div>`;
    },
    linkProgress(h, k) {
      const s = Store.get();
      if (!h.link) return '';
      if (h.link === 'study') return C.minutesOn(s.study.sessions, k) + '/' + C.studyTarget(s) + ' mnt';
      if (h.link === 'copy') return C.minutesOn(s.copy.sessions, k) + '/' + s.settings.copyTarget + ' mnt';
      if (h.link === 'water') return fmt(C.nutritionDay(s, k).water) + '/' + fmt(s.nutrition.targets.water) + ' ml';
      if (h.link === 'meals') return C.nutritionDay(s, k).mealsLogged + '/' + s.settings.mealsRequired + ' waktu makan';
      return '';
    },

    async habitMenu(id, k) {
      const s = Store.get();
      const h = s.habits.find(x => x.id === id);
      if (!h) return;
      const today = k === C.dateKey();
      const st = C.statusOf(s, k, id);
      const pinned = (s.topPicks[k] || []).includes(id);
      const cons = C.habitConsistency(s, h, C.addDays(C.dateKey(), -29), C.dateKey());
      const body = `<p class="muted small">${esc(C.CATEGORIES[h.cat] || '')} · ${C.DIFFICULTY[h.difficulty] || ''} · ${h.mandatory ? 'Wajib' : 'Opsional' + (h.mandatoryDays && h.mandatoryDays.length ? ' (wajib ' + h.mandatoryDays.map(d => C.DAY_SHORT[d]).join(', ') + ')' : '')} · +${h.xp} XP</p>
        <div class="kpis" style="margin:12px 0"><div class="kpi"><small>Konsistensi 30 hari</small><b>${cons.pct == null ? '—' : UI.pct(cons.pct)}</b></div><div class="kpi"><small>Total selesai</small><b>${C.countDone(s, id)}</b><span>kali</span></div></div>
        ${st ? `<p class="small">Status ${today ? 'hari ini' : C.formatDate(k)}: <b>${st.s === 'done' ? 'Selesai' : 'Dilewati'}</b>${st.at ? ' · ' + new Date(st.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}${st.reason ? ' · ' + esc(st.reason) : ''}</p>` : ''}
        ${!today ? '<p class="note-box" style="margin-top:10px">Riwayat hari sebelumnya bersifat permanen dan tidak dapat diubah (mencegah klaim XP ganda).</p>' : ''}`;
      const actions = [];
      if (today) {
        if (!st || st.s !== 'done') actions.push({ label: 'Selesai', cls: 'primary', onClick: () => App.toggleHabit(id, k) });
        if (st && st.s === 'done') actions.push({ label: 'Batalkan selesai', onClick: () => App.toggleHabit(id, k) });
        if (!st || st.s === 'done') actions.push({ label: 'Lewati…', onClick: () => { setTimeout(() => App.skipHabit(id, k), 220); } });
        if (st && st.s === 'skipped') actions.push({ label: 'Batalkan lewati', onClick: () => App.commit(s2 => C.unskipHabit(s2, id, k)) });
        actions.push({ label: pinned ? 'Lepas prioritas' : 'Jadikan prioritas', onClick: () => App.togglePin(id, k) });
      }
      actions.push({ label: 'Edit', cls: 'ghost', onClick: () => { setTimeout(() => App.pages.habits.edit(id), 220); } });
      UI.modal({ title: h.name, body, actions });
    },
    toggleHabit(id, k) {
      const s = Store.get();
      const st = C.statusOf(s, k, id);
      if (k !== C.dateKey()) return UI.toast('Riwayat hari sebelumnya tidak dapat diubah', 'error');
      App.commit(s2 => {
        const r = st && st.s === 'done' ? C.uncompleteHabit(s2, id, k) : C.completeHabit(s2, id, k);
        if (r && r.err) UI.toast(r.err, 'error');
        if (navigator.vibrate && !(st && st.s === 'done')) try { navigator.vibrate(12); } catch (_) {}
        return r;
      });
    },
    async skipHabit(id, k) {
      const s = Store.get(); const h = s.habits.find(x => x.id === id);
      const v = await UI.formModal({
        title: 'Lewati: ' + h.name,
        intro: '<p class="muted small" style="margin-bottom:10px">Melewati tugas tidak memberi XP, tapi juga tidak menurunkan persentase penyelesaianmu. Alasan dicatat untuk refleksi.</p>',
        fields: [{ name: 'reason', label: 'Alasan', type: 'select', value: 'Sakit / kurang fit', options: ['Sakit / kurang fit', 'Jadwal kuliah padat', 'Hari istirahat', 'Kegiatan organisasi', 'Tidak relevan hari ini', 'Lainnya'].map(x => ({ value: x, label: x })) },
          { name: 'note', label: 'Catatan (opsional)', type: 'text' }],
        submitLabel: 'Lewati'
      });
      if (!v) return;
      App.commit(s2 => C.skipHabit(s2, id, k, v.reason + (v.note ? ' — ' + v.note : '')));
    },
    togglePin(id, k) {
      App.commit(s => {
        const arr = s.topPicks[k] = s.topPicks[k] || [];
        const i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1);
        else { if (arr.length >= 3) { UI.toast('Maksimal 3 prioritas. Lepas salah satu dulu.', 'error'); return; } arr.push(id); }
      }, { quiet: true });
    },

    // ------------------------------------------------------------ shared timer (study & copywriting)
    timer: {
      tickHandle: null,
      get t() { return Store.get().timer; },
      start({ module, refId, label, kind = 'pomodoro', focus = 25, brk = 5 }) {
        const s = Store.get();
        if (s.timer) return UI.toast('Masih ada timer berjalan. Hentikan dulu.', 'error');
        s.timer = { module, refId, label, kind, focus, brk, phase: 'focus', phaseStart: Date.now(), running: true, pausedRemain: null, acc: 0, cycles: 0 };
        Store.save(); this.ensureTick(); App.renderChrome(); App.render();
        if (root.Notify) root.Notify.ensurePermissionSoft();
      },
      dur(t) { return (t.phase === 'focus' ? t.focus : t.brk) * 60000; },
      remaining(t, now = Date.now()) {
        if (t.kind === 'stopwatch') return null;
        if (!t.running) return t.pausedRemain != null ? t.pausedRemain : this.dur(t);
        return this.dur(t) - (now - t.phaseStart);
      },
      elapsed(t, now = Date.now()) { return t.acc + (t.running ? now - t.phaseStart : 0); },
      pause() { const t = this.t; if (!t || !t.running) return; if (t.kind === 'stopwatch') { t.acc += Date.now() - t.phaseStart; } else t.pausedRemain = this.remaining(t); t.running = false; Store.save(); App.renderChrome(); App.refreshTimerViews(); },
      resume() { const t = this.t; if (!t || t.running) return; if (t.kind === 'stopwatch') t.phaseStart = Date.now(); else { t.phaseStart = Date.now() - (this.dur(t) - (t.pausedRemain != null ? t.pausedRemain : this.dur(t))); t.pausedRemain = null; } t.running = true; Store.save(); this.ensureTick(); App.renderChrome(); App.refreshTimerViews(); },
      async stop() {
        const t = this.t; if (!t) return;
        let minutes = 0;
        if (t.kind === 'stopwatch') minutes = Math.floor(this.elapsed(t) / 60000);
        else if (t.phase === 'focus') minutes = Math.floor((this.dur(t) - this.remaining(t)) / 60000);
        let log = false;
        if (minutes >= 1) log = await UI.confirmDialog(`Simpan ${minutes} menit fokus yang sudah berjalan sebagai sesi?`, { title: 'Hentikan timer', ok: 'Simpan & hentikan' });
        else if (!(await UI.confirmDialog('Hentikan timer? Waktu kurang dari 1 menit tidak dicatat.', { title: 'Hentikan timer', ok: 'Hentikan' }))) return;
        App.commit(s => { if (log) App.timer.logSession(s, t, minutes); s.timer = null; });
      },
      logSession(s, t, minutes) {
        const now = new Date();
        const rec = { id: C.uid('ss'), minutes, date: C.dateKey(now), at: now.toISOString(), source: 'timer' };
        if (t.module === 'study') s.study.sessions.push(Object.assign(rec, { subjectId: t.refId, note: '' }));
        else s.copy.sessions.push(Object.assign(rec, { type: t.refId || 'Latihan menulis', note: '' }));
      },
      /** Advance phases based on wall-clock time (works even if the tab was in background). */
      process() {
        const s = Store.get(), t = s.timer;
        if (!t || !t.running || t.kind === 'stopwatch') return;
        let guard = 0;
        while (t.running && this.remaining(t) <= 0 && guard++ < 20) {
          const endAt = t.phaseStart + this.dur(t);
          if (t.phase === 'focus') {
            t.cycles++;
            App.commit(st => App.timer.logSession(st, t, t.focus), { render: false });
            root.Notify && root.Notify.show('Sesi fokus selesai', `${t.focus} menit ${t.module === 'study' ? 'belajar' : 'copywriting'} tercatat. Istirahat ${t.brk} menit.`, 'timer');
            t.phase = 'break'; t.phaseStart = endAt;
          } else {
            root.Notify && root.Notify.show('Istirahat selesai', 'Siap untuk sesi fokus berikutnya?', 'timer');
            t.phase = 'focus'; t.running = false; t.pausedRemain = this.dur(t);
          }
          Store.save(); App.render();
        }
      },
      ensureTick() {
        if (this.tickHandle) return;
        this.tickHandle = setInterval(() => {
          if (!Store.get().timer) { clearInterval(this.tickHandle); this.tickHandle = null; App.timer.renderDock(); return; }
          this.process(); App.refreshTimerViews(); this.renderDock();
        }, 1000);
      },
      fmtMs(ms) { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000); return C.pad(m) + ':' + C.pad(sec); },
      display(t) { return t.kind === 'stopwatch' ? this.fmtMs(this.elapsed(t)) : this.fmtMs(this.remaining(t)); },
      renderDock() {
        const t = Store.get().timer, el = UI.$('#timer-dock');
        if (!el) return;
        const onPage = t && App.route.name === (t.module === 'study' ? 'study' : 'copywriting');
        if (!t || onPage) { el.innerHTML = ''; return; }
        el.innerHTML = `<div class="dock" data-act="goTimer">${icon('timer', 18)}<span>${t.phase === 'break' ? 'Istirahat' : esc(t.label)}</span><span class="mono js-timer">${this.display(t)}</span>
          <button class="icon-btn" data-act="${t.running ? 'timerPause' : 'timerResume'}" aria-label="${t.running ? 'Jeda' : 'Lanjut'}">${icon(t.running ? 'pause' : 'play', 16)}</button></div>`;
      },
      panel(module) {
        const t = Store.get().timer;
        if (!t || t.module !== module) return '';
        const total = t.kind === 'stopwatch' ? null : this.dur(t);
        const p = total ? 1 - this.remaining(t) / total : 0;
        return `<div class="card hero"><div class="timer-face"><div class="phase">${t.kind === 'stopwatch' ? 'Stopwatch' : t.phase === 'focus' ? 'Fokus · ' + t.focus + ' menit' : 'Istirahat · ' + t.brk + ' menit'}</div>
          <div class="time js-timer">${this.display(t)}</div><div class="muted small">${esc(t.label)}${t.cycles ? ' · ' + t.cycles + ' siklus selesai' : ''}</div></div>
          ${total ? UI.bar(p, { cls: 'thin js-timer-bar' }) : ''}
          <div class="row" style="justify-content:center;margin-top:14px">
            <button class="btn" data-act="${t.running ? 'timerPause' : 'timerResume'}">${icon(t.running ? 'pause' : 'play', 16)}${t.running ? 'Jeda' : t.phase === 'focus' && t.pausedRemain === this.dur(t) ? 'Mulai fokus' : 'Lanjut'}</button>
            <button class="btn danger" data-act="timerStop">${icon('stop', 16)}Hentikan</button></div></div>`;
      }
    },
    refreshTimerViews() {
      const t = Store.get().timer; if (!t) return;
      UI.$$('.js-timer').forEach(el => { el.textContent = App.timer.display(t); });
      const b = UI.$('.js-timer-bar > span');
      if (b && t.kind !== 'stopwatch') b.style.width = ((1 - App.timer.remaining(t) / App.timer.dur(t)) * 100).toFixed(1) + '%';
    },

    // ------------------------------------------------------------ bootstrap
    start() {
      if (!Store.storageAvailable()) {
        UI.$('#view').innerHTML = '<div class="card"><h3>Penyimpanan tidak tersedia</h3><p class="muted">Browser memblokir localStorage (mode privat/incognito?). Data tidak akan tersimpan.</p></div>';
      }
      Store.load();
      Store.requestPersistent();
      App.applyTheme();
      // first sync for today (e.g. supplement logged yesterday doesn't count today; new day starts clean)
      App.commit(() => {}, { render: false, quiet: true });
      window.addEventListener('hashchange', () => App.render());
      App.render();
      if (Store.get().timer) App.timer.ensureTick();

      // delegated events
      document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const fn = App.actions[el.dataset.act];
        if (fn) { e.preventDefault(); e.stopPropagation(); fn(el, e); }
      });
      document.addEventListener('change', (e) => {
        const el = e.target.closest('[data-chg]');
        if (el && App.actions[el.dataset.chg]) App.actions[el.dataset.chg](el, e);
      });
      document.addEventListener('input', (e) => {
        const el = e.target.closest('[data-inp]');
        if (el && App.actions[el.dataset.inp]) App.actions[el.dataset.inp](el, e);
      });
      document.addEventListener('submit', (e) => {
        const f = e.target.closest('form[data-submit]');
        if (f && App.actions[f.dataset.submit]) { e.preventDefault(); App.actions[f.dataset.submit](f, e); }
      });

      // automatic daily reset (date change while app is open) — history is never deleted
      setInterval(() => {
        const k = C.dateKey();
        if (k !== App.today) { App.today = k; App.commit(() => {}, { quiet: true }); UI.toast('Hari baru dimulai. Semangat!', 'good'); }
      }, 30000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { App.timer.process(); if (C.dateKey() !== App.today) { App.today = C.dateKey(); App.commit(() => {}, { quiet: true }); } else App.renderChrome(); } });
      matchMedia('(prefers-color-scheme: light)').addEventListener && matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => App.applyTheme());
      if (root.Notify) root.Notify.init();
    }
  };

  // ------------------------------------------------------------ global actions
  Object.assign(App.actions, {
    reload: () => location.reload(),
    toggleTheme: () => App.commit(s => { const cur = document.documentElement.dataset.theme; s.settings.theme = cur === 'dark' ? 'light' : 'dark'; App.applyTheme(); }, { quiet: true }),
    toggleHabit: (el) => App.toggleHabit(el.dataset.id, el.dataset.date),
    habitMenu: (el) => App.habitMenu(el.dataset.id, el.dataset.date),
    go: (el) => App.go(el.dataset.to),
    goTimer: (el, e) => { if (e.target.closest('button')) return; const t = Store.get().timer; if (t) App.go(t.module === 'study' ? 'study' : 'copywriting'); },
    timerPause: () => App.timer.pause(),
    timerResume: () => App.timer.resume(),
    timerStop: () => App.timer.stop(),
    dismissMissed: () => { App._dismissedMissed = C.missedReminders(Store.get()).map(r => r.id); App.commit(s => { for (const id of App._dismissedMissed) s.reminderLog[C.dateKey() + '|' + id] = 'dismissed'; }, { quiet: true }); }
  });

  // ------------------------------------------------------------ mobile "Menu" page
  App.pages.menu = {
    title: 'Menu',
    render() {
      return `<div class="menu-grid">${NAV.filter(n => !['dashboard'].includes(n.id)).map(n => `<a class="menu-tile" href="#/${n.id}">${icon(n.icon, 24)}<span>${n.label}</span></a>`).join('')}</div>
        <p class="muted small" style="margin-top:18px;text-align:center">LIFE OS · Build Discipline. Track Progress. Master Your Life.</p>`;
    }
  };

  root.App = App;
})(window);
