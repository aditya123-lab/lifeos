/* LIFE OS — Calendar & weekly planning */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon } = UI;
  const TYPES = [['personal', 'Pribadi'], ['study', 'Belajar'], ['copy', 'Copywriting'], ['gym', 'Gym'], ['exam', 'Ujian'], ['deadline', 'Deadline'], ['university', 'Kuliah'], ['other', 'Lainnya']];
  const COLORS = { university: '#5b8cff', gym: '#f5a524', study: '#8b7cf6', copy: '#e06a9a', exam: '#f2555a', deadline: '#f2555a', personal: '#3ecf8e', other: '#9aa0aa' };
  const st = () => App._cal || (App._cal = { view: 'month', date: C.dateKey(), sel: C.dateKey() });

  function header(c) {
    const d = C.parseKey(c.date);
    const title = c.view === 'month' ? C.MONTHS[d.getMonth()] + ' ' + d.getFullYear() : c.view === 'week' ? 'Minggu ' + C.formatDate(C.startOfWeek(c.date), { short: true }) : C.formatDate(c.date, { weekday: true });
    return `<div class="row wrap between" style="margin-bottom:12px"><div class="seg">${[['day', 'Hari'], ['week', 'Minggu'], ['month', 'Bulan']].map(([v, l]) => `<button class="${c.view === v ? 'on' : ''}" data-act="calView" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="row"><button class="icon-btn" data-act="calNav" data-d="-1">${icon('left')}</button><b style="min-width:150px;text-align:center">${title}</b><button class="icon-btn" data-act="calNav" data-d="1">${icon('right')}</button><button class="btn sm" data-act="calToday">Hari ini</button></div>
      <button class="btn primary sm" data-act="evEdit" data-date="${c.sel}">${icon('plus', 15)}Event</button></div>`;
  }
  const itemHtml = (i) => `<div class="ev-item k-${i.kind} ${i.done ? 'done' : ''}" ${i.derived ? `data-act="calDerived" data-kind="${i.kind}"` : `data-act="evEdit" data-id="${i.id}" data-occ="${i.occurrence}"`}><span class="t">${i.start || '—'}</span><div style="flex:1"><div>${esc(i.title)}${i.recur && i.recur !== 'none' ? ' ' + icon('refresh', 11) : ''}</div>${i.end ? `<div class="tiny muted">${i.start}–${i.end}</div>` : ''}</div>${i.done ? icon('check', 14, 'good') : ''}</div>`;

  function dayPanel(k) {
    const s = App.S();
    const items = C.calendarItems(s, k);
    const stt = C.dayStats(s, k);
    const today = C.dateKey();
    return `<div class="card" style="margin-top:14px"><div class="card-head">${icon('calendar', 18)}<h3>${C.formatDate(k, { weekday: true })}</h3>${k <= today ? `<a class="btn sm ghost" href="#/habits/today/${k}">Checklist</a>` : ''}</div>
      ${items.map(itemHtml).join('') || '<div class="empty small">Tidak ada agenda.</div>'}
      ${k <= today && k >= s.createdAt ? `<div class="divider"></div><p class="small muted">Habit: <b>${stt.done}/${stt.total}</b> wajib selesai (${UI.pct(stt.pct)}) · ${stt.optionalDone} opsional${stt.rest ? ' · hari istirahat' : ''}</p>` : ''}
      ${k > today ? `<div class="divider"></div><p class="small muted">Terjadwal: ${C.habitsFor(s, k).filter(h => C.isMandatoryOn(h, k)).length} habit wajib</p>` : ''}</div>`;
  }

  function month(c) {
    const s = App.S(), d = C.parseKey(c.date), today = C.dateKey();
    const first = C.dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
    const start = C.startOfWeek(first);
    const cells = C.rangeKeys(start, C.addDays(start, 41));
    return `<div class="cal-grid">${[1, 2, 3, 4, 5, 6, 0].map(x => `<div class="cal-dow">${C.DAY_SHORT[x]}</div>`).join('')}
      ${cells.map(k => { const items = C.calendarItems(s, k); const other = C.parseKey(k).getMonth() !== d.getMonth();
        return `<div class="cal-cell ${other ? 'other' : ''} ${k === today ? 'today' : ''} ${k === c.sel ? 'sel' : ''}" data-act="calSel" data-k="${k}"><span class="d">${C.parseKey(k).getDate()}</span>
          <div class="cal-dots">${items.slice(0, 6).map(i => `<i style="background:${COLORS[i.kind] || COLORS.other};${i.done ? 'opacity:.45' : ''}"></i>`).join('')}</div>
          ${items.slice(0, 2).map(i => `<span class="ev" style="border-left:2px solid ${COLORS[i.kind] || COLORS.other}">${esc(i.title)}</span>`).join('')}</div>`; }).join('')}</div>
      <div class="legend" style="margin-top:10px">${[['university', 'Kuliah'], ['gym', 'Gym'], ['study', 'Belajar'], ['copy', 'Copywriting'], ['exam', 'Ujian/Deadline'], ['personal', 'Pribadi']].map(([k, l]) => `<span><i style="background:${COLORS[k]}"></i>${l}</span>`).join('')}</div>
      ${dayPanel(c.sel)}`;
  }
  function week(c) {
    const s = App.S(), ws = C.startOfWeek(c.date), today = C.dateKey();
    return `<div class="week-grid">${C.rangeKeys(ws, C.addDays(ws, 6)).map(k => `<div class="week-col ${k === today ? 'today' : ''}"><h4 data-act="calSel" data-k="${k}" data-to-day="1" style="cursor:pointer">${C.DAY_SHORT[C.weekday(k)]} ${C.parseKey(k).getDate()}</h4>${C.calendarItems(s, k).map(itemHtml).join('') || '<p class="tiny muted">—</p>'}
      <button class="btn sm ghost block" data-act="evEdit" data-date="${k}">${icon('plus', 13)}</button></div>`).join('')}</div>`;
  }

  App.pages.calendar = {
    title: 'Kalender',
    render() { const c = st(); return header(c) + (c.view === 'month' ? month(c) : c.view === 'week' ? week(c) : dayPanel(c.date)); }
  };

  async function editEvent(id, date, occ) {
    const s = App.S(); const ev = id ? s.events.find(e => e.id === id) : null;
    const v = await UI.formModal({ title: ev ? 'Edit event' : 'Event baru', fields: [
      { name: 'title', label: 'Judul', value: ev ? ev.title : '', required: true },
      { name: 'type', label: 'Jenis', type: 'select', half: true, value: ev ? ev.type : 'personal', options: TYPES.map(([value, label]) => ({ value, label })) },
      { name: 'date', label: 'Tanggal', type: 'date', half: true, value: ev ? ev.date : date || C.dateKey(), required: true },
      { name: 'start', label: 'Mulai', type: 'time', half: true, value: ev ? ev.start : '' }, { name: 'end', label: 'Selesai', type: 'time', half: true, value: ev ? ev.end : '' },
      { name: 'recur', label: 'Berulang', type: 'select', half: true, value: ev ? ev.recur : 'none', options: [{ value: 'none', label: 'Tidak' }, { value: 'daily', label: 'Setiap hari' }, { value: 'weekly', label: 'Mingguan' }, { value: 'monthly', label: 'Bulanan' }] },
      { name: 'until', label: 'Berulang sampai (opsional)', type: 'date', half: true, value: ev ? ev.until : '' },
      { name: 'days', label: 'Hari (untuk mingguan)', type: 'days', value: ev ? ev.days || [] : [] },
      { name: 'reminder', label: 'Pengingat', type: 'select', value: ev && ev.reminder !== '' && ev.reminder != null ? ev.reminder : '', options: [{ value: '', label: 'Tidak ada' }, { value: 0, label: 'Saat mulai' }, { value: 10, label: '10 menit sebelum' }, { value: 30, label: '30 menit sebelum' }, { value: 60, label: '1 jam sebelum' }] },
      { name: 'notes', label: 'Catatan', type: 'textarea', rows: 2, value: ev ? ev.notes : '' }],
      extraActions: ev ? (ev.recur && ev.recur !== 'none' && occ ? [{ id: 'delOcc', label: 'Hapus kejadian ini', cls: 'danger' }, { id: 'del', label: 'Hapus semua', cls: 'danger' }] : [{ id: 'del', label: 'Hapus', cls: 'danger' }]) : [],
      validate: v => {
        if (v.end && v.start && v.end <= v.start) return 'Jam selesai harus setelah jam mulai';
        if (v.reminder !== '' && !v.start) return 'Isi jam mulai untuk memakai pengingat';
        if (v.until && v.until < v.date) return 'Tanggal akhir pengulangan tidak valid';
        if ((v.type === 'gym') && v.start && C.overlapsUniversity(s, C.weekday(v.date), v.start, v.end ? C.toMin(v.end) - C.toMin(v.start) : 60)) return 'Sesi gym bentrok dengan jam kuliah. Pilih waktu lain.';
      } });
    if (!v) return;
    App.commit(st => {
      if (v.__action === 'del') { st.events = st.events.filter(e => e.id !== ev.id); return; }
      if (v.__action === 'delOcc') { const e = st.events.find(x => x.id === ev.id); e.exceptions = (e.exceptions || []).concat(occ); return; }
      const rec = Object.assign({}, v, { reminder: v.reminder === '' ? '' : +v.reminder });
      if (ev) Object.assign(st.events.find(e => e.id === ev.id), rec); else st.events.push(Object.assign({ id: C.uid('ev'), exceptions: [] }, rec));
    }, { quiet: true });
  }

  Object.assign(App.actions, {
    calView: (el) => { st().view = el.dataset.v; App.render(); },
    calNav: (el) => { const c = st(), n = +el.dataset.d; if (c.view === 'month') { const d = C.parseKey(c.date); d.setDate(1); d.setMonth(d.getMonth() + n); c.date = C.dateKey(d); } else c.date = C.addDays(c.date, n * (c.view === 'week' ? 7 : 1)); if (c.view !== 'month') c.sel = c.date; App.render(); },
    calToday: () => { const c = st(); c.date = c.sel = C.dateKey(); App.render(); },
    calSel: (el) => { const c = st(); c.sel = el.dataset.k; if (el.dataset.toDay) { c.view = 'day'; c.date = el.dataset.k; } App.render(); },
    calDerived: (el) => App.go({ university: 'settings/schedule', gym: 'fitness', study: 'study/sessions', copy: 'copywriting/history', exam: 'study/exams', deadline: 'study/tasks' }[el.dataset.kind] || 'calendar'),
    evEdit: (el) => editEvent(el.dataset.id, el.dataset.date, el.dataset.occ)
  });
})();
