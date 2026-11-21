/* LIFE OS — Habits: daily checklist, habit management, history */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;

  const tabs = (cur) => `<div class="tabs">${[['today', 'Checklist'], ['manage', 'Kelola Habit'], ['history', 'Riwayat']].map(([id, l]) => `<a href="#/habits/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;

  function checklist(dateK) {
    const s = App.S(), today = C.dateKey();
    const k = dateK || today;
    const ro = !C.isEditable(k);
    const yest = !ro && k !== today;
    const hs = C.habitsFor(s, k);
    const st = C.dayStats(s, k);
    const byCat = {};
    hs.forEach(h => (byCat[h.cat] = byCat[h.cat] || []).push(h));
    return `
      <div class="card row" style="gap:8px">
        <button class="icon-btn" data-act="go" data-to="habits/today/${C.addDays(k, -1)}" aria-label="Hari sebelumnya">${icon('left')}</button>
        <div style="flex:1;text-align:center"><b>${k === today ? 'Hari ini' : C.formatDate(k, { weekday: true })}</b><div class="muted small">${st.done}/${st.total} wajib · ${UI.pct(st.pct)} · +${fmt(st.xp)} XP${st.rest ? ' · Hari istirahat' : ''}</div></div>
        <button class="icon-btn" ${k >= today ? 'disabled style="opacity:.3"' : ''} data-act="go" data-to="habits/today/${C.addDays(k, 1) > today ? today : C.addDays(k, 1)}" aria-label="Hari berikutnya">${icon('right')}</button>
      </div>
      ${ro ? `<div class="note-box" style="margin-top:10px">${icon('lock', 14)} Mode riwayat (hanya-baca). Hanya hari ini dan kemarin yang bisa diubah. <a href="#/habits/today">Kembali ke hari ini</a></div>` : ''}
      ${yest ? `<div class="note-box" style="margin-top:10px">${icon('clock', 14)} <b>Kemarin</b> — masih bisa dicentang sampai hari ini berakhir (pukul 23.59). <a href="#/habits/today">Kembali ke hari ini</a></div>` : ''}
      <div style="margin-top:12px">${UI.bar(st.pct, { cls: 'thick' })}</div>
      ${Object.keys(C.CATEGORIES).filter(c => byCat[c]).map(c => `
        <div class="section-title">${esc(C.CATEGORIES[c])}<span class="spacer"></span><span>${byCat[c].filter(h => (C.statusOf(s, k, h.id) || {}).s === 'done').length}/${byCat[c].length}</span></div>
        <div class="card tight"><div class="tasks">${byCat[c].map(h => App.taskRow(h, k, { showPeriod: true, readOnly: ro })).join('')}</div></div>`).join('') || '<div class="card empty">Tidak ada habit terjadwal pada hari ini.</div>'}
      ${!ro ? '<button class="btn block" style="margin-top:14px" data-act="addHabit">' + icon('plus', 16) + 'Tambah habit</button>' : ''}`;
  }

  function manage() {
    const s = App.S();
    const active = s.habits.filter(h => h.active).sort((a, b) => (a.order || 0) - (b.order || 0));
    const archived = s.habits.filter(h => !h.active);
    const row = (h, i, arr) => `<div class="li">
      <div class="li-main" data-act="editHabit" data-id="${h.id}" style="cursor:pointer"><div class="li-title">${esc(h.name)}</div>
        <div class="li-sub">${esc(C.CATEGORIES[h.cat] || '')} · ${h.days.length === 7 ? 'Setiap hari' : h.days.map(d => C.DAY_SHORT[d]).join(', ')}${h.time ? ' · ' + h.time : ''} · ${h.mandatory ? 'Wajib' : 'Opsional' + (h.mandatoryDays && h.mandatoryDays.length ? ' · wajib ' + h.mandatoryDays.map(d => C.DAY_SHORT[d]).join(', ') : '')} · ${C.DIFFICULTY[h.difficulty]} · <b class="accent">+${h.xp} XP</b></div></div>
      ${arr ? `<button class="icon-btn" data-act="moveHabit" data-id="${h.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naik">${icon('up', 16)}</button><button class="icon-btn" data-act="moveHabit" data-id="${h.id}" data-dir="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Turun">${icon('down', 16)}</button>` : `<button class="btn sm" data-act="restoreHabit" data-id="${h.id}">Aktifkan</button>`}
    </div>`;
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">${active.length} habit aktif. Ketuk untuk mengedit nama, jadwal, XP, kesulitan & pengingat.</p><button class="btn primary sm" data-act="addHabit">${icon('plus', 15)}Baru</button></div>
      ${C.PERIODS.map(p => { const list = active.filter(h => h.period === p.id); return list.length ? `<div class="section-title">${icon(p.icon, 14)}${p.label}</div><div class="card tight"><div class="list">${list.map((h, i) => row(h, i, list)).join('')}</div></div>` : ''; }).join('')}
      ${archived.length ? `<div class="section-title">Diarsipkan (riwayat tetap tersimpan)</div><div class="card tight"><div class="list">${archived.map(h => row(h)).join('')}</div></div>` : ''}
      <p class="note-box" style="margin-top:14px">Prinsip: jangan terlalu banyak tugas wajib. Tandai sebagai <b>opsional</b> kebiasaan yang bagus tapi tidak krusial — persentase harian hanya menghitung tugas wajib.</p>`;
  }

  function history() {
    const s = App.S(), today = C.dateKey();
    const from = C.addDays(today, -29) < s.createdAt ? s.createdAt : C.addDays(today, -29);
    const days = C.rangeKeys(from, today).reverse();
    const hs = s.habits.filter(h => h.active);
    const start = C.addDays(today, -29);
    return `<div class="card"><div class="card-head">${icon('chart', 18)}<h3>30 hari terakhir</h3></div>
        <div class="list">${days.map(k => { const st = C.dayStats(s, k); const ok = C.isSuccessDay(s, k);
          return `<div class="li" data-act="go" data-to="habits/today/${k}" style="cursor:pointer"><span class="dot" style="background:${ok === 'rest' ? 'var(--accent2)' : ok ? 'var(--good)' : st.done ? 'var(--warn)' : 'var(--track)'}"></span>
            <div class="li-main"><div class="li-title">${C.formatDate(k, { weekday: true, year: false })}</div><div class="li-sub">${st.rest ? 'Hari istirahat' : `${st.done}/${st.total} wajib · ${st.optionalDone} opsional${st.skipped ? ' · ' + st.skipped + ' dilewati' : ''}`}</div></div>
            <span class="num small">${st.rest ? '—' : UI.pct(st.pct)}</span><span class="xp small accent num">+${fmt(st.xp)}</span></div>`; }).join('')}</div></div>
      <div class="section-title">Konsistensi per habit (30 hari)</div>
      <div class="card">${hs.map(h => { const c = C.habitConsistency(s, h, start, today);
        const cells = C.rangeKeys(start, today).map(k => { const x = C.statusOf(s, k, h.id); return { v: !C.isScheduled(h, k) || k < s.createdAt ? null : x && x.s === 'done' ? 1 : x && x.s === 'skipped' ? .25 : 0, title: k + (x ? ' · ' + (x.s === 'done' ? 'selesai' : 'dilewati') : '') }; });
        return `<div style="margin-bottom:14px"><div class="row between small"><b>${esc(h.name)}</b><span class="muted num">${c.pct == null ? '—' : UI.pct(c.pct)}</span></div><div style="margin-top:6px">${UI.heatmap(cells)}</div></div>`; }).join('')}</div>`;
  }

  async function editHabit(id) {
    const s = App.S();
    const h = id ? s.habits.find(x => x.id === id) : null;
    const rem = h && s.reminders.find(r => r.id === 'rh_' + h.id);
    const linkOpts = [{ value: '', label: 'Tidak ada (centang manual)' }, { value: 'study', label: 'Selesai otomatis: target belajar tercapai' }, { value: 'copy', label: 'Selesai otomatis: target copywriting tercapai' }, { value: 'gym', label: 'Selesai otomatis: workout dicatat' }, { value: 'meals', label: 'Selesai otomatis: tracking makan lengkap' }, { value: 'water', label: 'Selesai otomatis: target air tercapai' }, { value: 'journal', label: 'Selesai otomatis: jurnal malam ditulis' }]
      .concat(s.supplements.map(sp => ({ value: 'supp:' + sp.id, label: 'Selesai otomatis: ' + sp.name + ' dicentang' })));
    const v = await UI.formModal({
      title: h ? 'Edit habit' : 'Habit baru',
      fields: [
        { name: 'name', label: 'Nama tugas', value: h ? h.name : '', required: true },
        { name: 'cat', label: 'Kategori', type: 'select', half: true, value: h ? h.cat : 'lainnya', options: Object.entries(C.CATEGORIES).map(([value, label]) => ({ value, label })) },
        { name: 'period', label: 'Waktu', type: 'select', half: true, value: h ? h.period : 'evening', options: C.PERIODS.map(p => ({ value: p.id, label: p.label })) },
        { name: 'days', label: 'Pengulangan (hari)', type: 'days', value: h ? h.days : C.ALL },
        { name: 'time', label: 'Jam (opsional)', type: 'time', half: true, value: h ? h.time : '' },
        { name: 'xp', label: 'XP reward', type: 'number', half: true, min: 1, max: 2000, value: h ? h.xp : 30, required: true },
        { name: 'difficulty', label: 'Kesulitan', type: 'select', half: true, value: h ? h.difficulty : 2, options: [1, 2, 3].map(d => ({ value: d, label: C.DIFFICULTY[d] })) },
        { name: 'mandatory', label: 'Tugas wajib (dihitung dalam % harian & streak)', type: 'checkbox', value: h ? h.mandatory : true },
        { name: 'mandatoryDays', label: 'Jika opsional: tetap wajib pada hari', type: 'days', value: h ? h.mandatoryDays || [] : [], hint: 'Kosongkan jika selalu opsional. Diabaikan jika "Tugas wajib" dicentang.' },
        { name: 'link', label: 'Integrasi modul', type: 'select', value: h ? h.link : '', options: linkOpts },
        { name: 'reminder', label: 'Aktifkan pengingat untuk habit ini', type: 'checkbox', value: !!(rem && rem.enabled) },
        { name: 'remTime', label: 'Jam pengingat', type: 'time', half: true, value: rem ? rem.time : (h && h.time) || '' }
      ],
      extraActions: h ? [{ id: 'delete', label: 'Arsipkan / hapus', cls: 'danger' }] : [],
      validate: v => {
        if (v.reminder && !v.remTime) return 'Isi jam pengingat';
        if (!(v.xp > 0)) return 'XP harus lebih dari 0';
      }
    });
    if (!v) return;
    if (v.__action === 'delete') return removeHabit(h.id);
    App.commit(st => {
      const today = C.dateKey();
      let target = h ? st.habits.find(x => x.id === h.id) : null;
      const data = { name: v.name, cat: v.cat, period: v.period, days: v.days, time: v.time, xp: Math.round(v.xp), difficulty: +v.difficulty, mandatory: v.mandatory, mandatoryDays: v.mandatory ? [] : v.mandatoryDays, link: v.link };
      if (target) Object.assign(target, data);
      else { target = Object.assign({ id: C.uid('h'), active: true, createdAt: today, order: st.habits.length }, data); st.habits.push(target); }
      const rid = 'rh_' + target.id;
      const r = st.reminders.find(x => x.id === rid);
      if (v.reminder) {
        const rec = { id: rid, label: target.name, time: v.remTime, days: target.days, type: 'habit', body: 'Waktunya: ' + target.name, enabled: true };
        if (r) Object.assign(r, rec); else st.reminders.push(rec);
      } else if (r) r.enabled = false;
    }, { quiet: true });
    UI.toast(h ? 'Habit diperbarui' : 'Habit ditambahkan', 'good');
  }

  async function removeHabit(id) {
    const s = App.S();
    const h = s.habits.find(x => x.id === id);
    const hasHistory = Object.values(s.logs).some(l => l[id]);
    if (hasHistory) {
      if (!(await UI.confirmDialog(`"${h.name}" punya riwayat. Habit akan diarsipkan (tidak muncul lagi mulai hari ini), riwayat & XP lama tetap tersimpan.`, { title: 'Arsipkan habit?', ok: 'Arsipkan' }))) return;
      App.commit(st => { const x = st.habits.find(y => y.id === id); x.active = false; x.archivedAt = C.dateKey(); const r = st.reminders.find(r => r.id === 'rh_' + id); if (r) r.enabled = false; }, { quiet: true });
    } else {
      if (!(await UI.confirmDialog(`Hapus "${h.name}"? Habit ini belum punya riwayat.`, { title: 'Hapus habit?', ok: 'Hapus', danger: true }))) return;
      App.commit(st => { st.habits = st.habits.filter(y => y.id !== id); st.reminders = st.reminders.filter(r => r.id !== 'rh_' + id); }, { quiet: true });
    }
  }

  App.pages.habits = {
    title: 'Habit & Checklist',
    render(params) {
      const tab = params[0] || 'today';
      return tabs(tab) + (tab === 'manage' ? manage() : tab === 'history' ? history() : checklist(params[1]));
    },
    edit: editHabit
  };

  Object.assign(App.actions, {
    addHabit: () => editHabit(null),
    editHabit: (el) => editHabit(el.dataset.id),
    restoreHabit: (el) => App.commit(s => { const h = s.habits.find(x => x.id === el.dataset.id); h.active = true; if (h.archivedAt) { h.createdAt = C.dateKey() > h.createdAt ? h.createdAt : C.dateKey(); delete h.archivedAt; } }, { quiet: true }),
    moveHabit: (el) => App.commit(s => {
      const h = s.habits.find(x => x.id === el.dataset.id);
      const peers = s.habits.filter(x => x.active && x.period === h.period).sort((a, b) => a.order - b.order);
      const i = peers.indexOf(h), j = i + (+el.dataset.dir);
      if (j < 0 || j >= peers.length) return;
      const o = peers[j].order; peers[j].order = h.order; h.order = o;
      if (peers[j].order === h.order) h.order += +el.dataset.dir;
    }, { quiet: true })
  });
})();
