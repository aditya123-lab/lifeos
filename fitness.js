/* LIFE OS — Fitness & gym tracker */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const TABS = [['overview', 'Ringkasan'], ['history', 'Riwayat'], ['exercises', 'Latihan & PR'], ['program', 'Program'], ['body', 'Berat Badan']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/fitness/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  const exName = (s, id) => (s.fitness.exercises.find(e => e.id === id) || { name: 'Latihan dihapus' }).name;
  const volume = w => (w.sets || []).reduce((a, x) => a + (+x.weight || 0) * (+x.reps || 0), 0);

  function overview() {
    const s = App.S(), k = C.dateKey();
    const ws = C.startOfWeek(k);
    const days = C.rangeKeys(ws, C.addDays(ws, 6));
    const weekW = C.workoutsIn(s, ws, C.addDays(ws, 6));
    const target = s.settings.gymPerWeek;
    const weeks = [];
    for (let i = 7; i >= 0; i--) { const w = C.addDays(ws, -7 * i); const n = C.workoutsIn(s, w, C.addDays(w, 6)).length; weeks.push({ label: w, short: C.formatDate(w, { short: true, year: false }).replace(' ', '/'), value: n, color: n >= target ? 'var(--good)' : undefined }); }
    const todayPlanned = s.settings.gymDays.includes(C.weekday(k));
    const doneToday = s.fitness.workouts.some(w => w.date === k);
    const last = s.fitness.workouts.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    return `
      <div class="card hero"><div class="row between"><div><h3>Minggu ini</h3><p class="muted small">${weekW.length} dari ${target} sesi · ${fmt(weekW.reduce((a, w) => a + volume(w), 0))} kg volume</p></div>${UI.ring(weekW.length / target, { size: 70, stroke: 7, label: weekW.length + '/' + target, color: 'var(--warn)' })}</div>
        <div class="cal-grid" style="margin-top:14px">${days.map(d => { const wd = C.weekday(d), planned = s.settings.gymDays.includes(wd), done = s.fitness.workouts.some(w => w.date === d);
          return `<div class="cal-cell ${d === k ? 'today' : ''}" style="min-height:64px;align-items:center;justify-content:center;cursor:default"><span class="tiny muted">${C.DAY_SHORT[wd]}</span>${done ? `<span class="good">${icon('check', 18)}</span>` : planned ? `<span class="muted">${icon('dumbbell', 16)}</span>` : '<span class="tiny muted">rest</span>'}</div>`; }).join('')}</div>
        <div class="row wrap" style="margin-top:14px"><button class="btn primary" data-act="wkLog">${icon('plus', 16)}${doneToday ? 'Catat sesi lain' : 'Catat workout hari ini'}</button>
        ${todayPlanned && !doneToday ? `<span class="muted small">Jadwal hari ini: <b>${esc(s.fitness.split[C.weekday(k)] || 'Gym')}</b> · ${s.settings.gymTime}</span>` : ''}</div></div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('chart', 18)}<h3>Sesi per minggu</h3></div>${UI.barChart(weeks, { goal: target, color: 'var(--warn)' })}</div>
        <div class="card"><div class="card-head">${icon('dumbbell', 18)}<h3>Sesi terakhir</h3></div>${last ? workoutCard(s, last) : '<div class="empty small">Belum ada workout tercatat.</div>'}</div>
      </div>`;
  }
  function workoutCard(s, w) {
    const byEx = {};
    (w.sets || []).forEach(x => (byEx[x.exerciseId] = byEx[x.exerciseId] || []).push(x));
    return `<div data-act="wkLog" data-id="${w.id}" style="cursor:pointer"><b>${esc(w.name)}</b><p class="muted small">${C.formatDate(w.date, { weekday: true })} · ${(w.sets || []).length} set · ${fmt(volume(w))} kg</p>
      <div style="margin-top:8px">${Object.entries(byEx).map(([id, sets]) => `<div class="small" style="margin-top:3px"><span class="muted">${esc(exName(s, id))}:</span> ${sets.map(x => `${x.weight}×${x.reps}`).join(', ')}</div>`).join('')}</div>${w.note ? `<p class="small muted" style="margin-top:6px">${esc(w.note)}</p>` : ''}</div>`;
  }
  function history() {
    const s = App.S();
    const list = s.fitness.workouts.slice().sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">${list.length} sesi total</p><button class="btn primary sm" data-act="wkLog">${icon('plus', 15)}Workout</button></div>
      <div class="stack">${list.map(w => `<div class="card">${workoutCard(s, w)}</div>`).join('') || '<div class="card empty">' + icon('dumbbell', 28) + 'Belum ada riwayat workout.</div>'}</div>`;
  }
  function exercises() {
    const s = App.S();
    const pr = C.personalRecords(s);
    const groups = {};
    s.fitness.exercises.forEach(e => (groups[e.muscle] = groups[e.muscle] || []).push(e));
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">Database latihan & personal record (e1RM = estimasi 1RM rumus Epley).</p><button class="btn primary sm" data-act="exEdit">${icon('plus', 15)}Latihan</button></div>
      ${Object.keys(groups).map(m => `<div class="section-title">${esc(m)}</div><div class="card tight"><div class="list">${groups[m].map(e => { const p = pr[e.id];
        return `<div class="li" data-act="exEdit" data-id="${e.id}" style="cursor:pointer"><div class="li-main"><div class="li-title">${esc(e.name)}</div><div class="li-sub">${p ? `PR ${p.weight} kg × ${p.reps} · e1RM ${p.e1rm} kg · ${C.formatDate(p.date, { short: true })}` : 'Belum ada data'}</div></div>${p ? `<span class="pill accent">${icon('trophy', 12)} ${p.weight} kg</span>` : ''}</div>`; }).join('')}</div></div>`).join('')}`;
  }
  function program() {
    const s = App.S();
    return `<form class="card" data-submit="progSave"><div class="card-head">${icon('calendar', 18)}<h3>Hari & split latihan</h3></div>
      <div class="form-grid">
        ${UI.field({ name: 'gymPerWeek', label: 'Target sesi per minggu', type: 'number', half: true, min: 1, max: 7, value: s.settings.gymPerWeek })}
        ${UI.field({ name: 'gymTime', label: 'Jam latihan', type: 'time', half: true, value: s.settings.gymTime })}
        ${UI.field({ name: 'gymDuration', label: 'Durasi (menit)', type: 'number', half: true, min: 15, max: 240, value: s.settings.gymDuration })}
        ${UI.field({ name: 'gymDays', label: 'Hari gym', type: 'days', value: s.settings.gymDays })}
        ${[1, 2, 3, 4, 5, 6, 0].map(d => UI.field({ name: 'split' + d, label: 'Split ' + C.DAY_NAMES[d] + ' (jika hari gym)', value: s.fitness.split[d] || '', half: true, placeholder: 'mis. Push / Upper / Full body' })).join('')}
        <p class="form-error" hidden></p>
      </div>
      <p class="note-box" style="margin:12px 0">Jadwal gym otomatis divalidasi agar <b>tidak bentrok dengan jam kuliah</b> (${s.schedule.uniStart}–${s.schedule.uniEnd}, ${s.schedule.uniDays.map(d => C.DAY_SHORT[d]).join(', ')}).</p>
      <button class="btn primary block">Simpan program</button></form>`;
  }
  function body() {
    const s = App.S();
    const list = s.fitness.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
    const first = list[0], last = list[list.length - 1];
    return `<div class="card"><div class="card-head">${icon('chart', 18)}<h3>Berat badan</h3><button class="btn sm primary" data-act="bwAdd">${icon('plus', 14)}Catat</button></div>
      ${list.length ? `<p class="small muted" style="margin-bottom:8px">Terakhir <b>${last.kg} kg</b> (${C.formatDate(last.date, { short: true })})${list.length > 1 ? ` · perubahan ${(last.kg - first.kg >= 0 ? '+' : '') + C.round1(last.kg - first.kg)} kg sejak ${C.formatDate(first.date, { short: true })}` : ''}</p>` : ''}
      ${UI.lineChart(list.slice(-30).map(x => ({ label: x.date, short: x.date.slice(8) + '/' + x.date.slice(5, 7), value: x.kg })), { unit: ' kg', color: 'var(--accent2)', max: list.length ? Math.ceil(Math.max(...list.map(x => x.kg)) + 2) : null })}
      <div class="list" style="margin-top:10px">${list.slice().reverse().slice(0, 15).map(x => `<div class="li"><div class="li-main"><div class="li-title">${x.kg} kg</div><div class="li-sub">${C.formatDate(x.date, { weekday: true })}</div></div><button class="icon-btn" data-act="bwDel" data-id="${x.id}">${icon('trash', 16)}</button></div>`).join('')}</div></div>`;
  }

  App.pages.fitness = { title: 'Fitness & Gym', render(p) { const t = p[0] || 'overview'; return tabs(t) + ({ overview, history, exercises, program, body }[t] || overview)(); } };

  function setRow(s, x = {}) {
    return `<div class="set-row"><select data-f="exerciseId">${s.fitness.exercises.map(e => `<option value="${e.id}" ${e.id === x.exerciseId ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
      <input data-f="weight" type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${x.weight != null ? x.weight : ''}"><input data-f="reps" type="number" inputmode="numeric" min="0" placeholder="reps" value="${x.reps != null ? x.reps : ''}">
      <button type="button" class="icon-btn" data-rm aria-label="Hapus set">${icon('x', 16)}</button></div>`;
  }
  function logWorkout(id) {
    const s = App.S(), k = C.dateKey();
    const w = id ? s.fitness.workouts.find(x => x.id === id) : null;
    const defName = s.fitness.split[C.weekday(k)] || 'Workout';
    const body = `<div class="form-grid">${UI.field({ name: 'name', label: 'Nama sesi', value: w ? w.name : defName, half: true })}${UI.field({ name: 'date', label: 'Tanggal', type: 'date', value: w ? w.date : k, half: true })}</div>
      <div class="row between" style="margin:14px 0 8px"><b class="small">Set (latihan · beban · repetisi)</b><button type="button" class="btn sm ghost" data-prefill>${icon('refresh', 14)}Isi dari sesi sebelumnya</button></div>
      <div id="sets">${(w ? w.sets : []).map(x => setRow(s, x)).join('')}</div>
      <div class="row" style="margin-top:6px"><button type="button" class="btn sm" data-add>${icon('plus', 14)}Tambah set</button><button type="button" class="btn sm ghost" data-dup>Ulangi set terakhir</button></div>
      <div class="form-grid" style="margin-top:12px">${UI.field({ name: 'note', label: 'Catatan', type: 'textarea', rows: 2, value: w ? w.note : '' })}</div>`;
    const read = (wrap) => ({
      name: UI.$('[name=name]', wrap).value.trim() || 'Workout', date: UI.$('[name=date]', wrap).value, note: UI.$('[name=note]', wrap).value.trim(),
      sets: UI.$$('.set-row', wrap).map(r => ({ exerciseId: UI.$('[data-f=exerciseId]', r).value, weight: +UI.$('[data-f=weight]', r).value || 0, reps: +UI.$('[data-f=reps]', r).value || 0 })).filter(x => x.reps > 0)
    });
    const actions = [];
    if (w) actions.push({ label: 'Hapus', cls: 'danger', onClick: () => { UI.confirmDialog('Hapus workout ini?', { danger: true, ok: 'Hapus' }).then(ok => ok && App.commit(st => { st.fitness.workouts = st.fitness.workouts.filter(x => x.id !== w.id); })); } });
    actions.push({ label: 'Batal', cls: 'ghost' }, { label: 'Simpan workout', cls: 'primary', onClick: (wrap) => {
      const v = read(wrap);
      if (!v.date || v.date > C.dateKey()) { UI.toast('Tanggal tidak valid', 'error'); return false; }
      if (!v.sets.length) UI.toast('Disimpan tanpa detail set (isi beban & repetisi untuk PR).', 'info');
      App.commit(st => { if (w) Object.assign(st.fitness.workouts.find(x => x.id === w.id), v); else st.fitness.workouts.push(Object.assign({ id: C.uid('wk'), at: new Date().toISOString() }, v)); });
    } });
    UI.modal({ title: w ? 'Edit workout' : 'Catat workout', wide: true, body, actions, onOpen: (wrap) => {
      const sets = UI.$('#sets', wrap);
      if (!w) sets.insertAdjacentHTML('beforeend', setRow(s));
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-add]')) sets.insertAdjacentHTML('beforeend', setRow(s));
        if (e.target.closest('[data-dup]')) { const rows = UI.$$('.set-row', sets); const l = rows[rows.length - 1]; sets.insertAdjacentHTML('beforeend', setRow(s, l ? { exerciseId: UI.$('[data-f=exerciseId]', l).value, weight: UI.$('[data-f=weight]', l).value, reps: UI.$('[data-f=reps]', l).value } : {})); }
        const rm = e.target.closest('[data-rm]'); if (rm) rm.closest('.set-row').remove();
        if (e.target.closest('[data-prefill]')) {
          const name = UI.$('[name=name]', wrap).value.trim();
          const prev = s.fitness.workouts.filter(x => x.name === name && (!w || x.id !== w.id)).sort((a, b) => b.date.localeCompare(a.date))[0] || s.fitness.workouts.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
          if (!prev) return UI.toast('Belum ada sesi sebelumnya', 'error');
          sets.innerHTML = prev.sets.map(x => setRow(s, x)).join(''); UI.toast('Diisi dari ' + C.formatDate(prev.date, { short: true }), 'good');
        }
      });
    } });
  }

  Object.assign(App.actions, {
    wkLog: (el) => logWorkout(el.dataset.id),
    exEdit: async (el) => {
      const s = App.S(); const e = el.dataset.id ? s.fitness.exercises.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: e ? 'Edit latihan' : 'Latihan baru', fields: [{ name: 'name', label: 'Nama latihan', value: e ? e.name : '', required: true }, { name: 'muscle', label: 'Otot / kelompok', value: e ? e.muscle : '', required: true, placeholder: 'Dada, Punggung, Kaki…' }],
        extraActions: e ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      if (v.__action === 'del') { if (s.fitness.workouts.some(w => w.sets.some(x => x.exerciseId === e.id))) return UI.toast('Latihan dipakai di riwayat — ganti nama saja.', 'error'); return App.commit(st => { st.fitness.exercises = st.fitness.exercises.filter(x => x.id !== e.id); }, { quiet: true }); }
      App.commit(st => { if (e) Object.assign(st.fitness.exercises.find(x => x.id === e.id), v); else st.fitness.exercises.push({ id: C.uid('ex'), name: v.name, muscle: v.muscle }); }, { quiet: true });
    },
    progSave: (f) => {
      const s = App.S();
      const days = UI.$$('[data-days=gymDays] input:checked', f).map(i => +i.value);
      const time = f.gymTime.value, dur = +f.gymDuration.value || 60;
      const clash = days.filter(d => C.overlapsUniversity(s, d, time, dur));
      const err = UI.$('.form-error', f);
      if (!time) { err.textContent = 'Isi jam latihan'; err.hidden = false; return; }
      if (clash.length) { err.textContent = `Jadwal gym bentrok dengan jam kuliah pada ${clash.map(d => C.DAY_NAMES[d]).join(', ')}. Pilih jam setelah ${s.schedule.uniEnd}.`; err.hidden = false; return; }
      App.commit(st => {
        st.settings.gymDays = days; st.settings.gymTime = time; st.settings.gymDuration = dur; st.settings.gymPerWeek = +f.gymPerWeek.value || 3;
        for (const d of [0, 1, 2, 3, 4, 5, 6]) { const v = f['split' + d].value.trim(); if (v) st.fitness.split[d] = v; else delete st.fitness.split[d]; }
        const gh = st.habits.find(h => h.id === 'h_gym'); if (gh) { gh.days = days.slice(); gh.time = time; }
        const r = st.reminders.find(r => r.id === 'r_gym'); if (r) { r.days = days.slice(); r.time = C.fromMin(C.toMin(time) - 15); }
      }, { quiet: true });
      UI.toast('Program disimpan. Habit & pengingat gym ikut diperbarui.', 'good');
    },
    bwAdd: async () => {
      const v = await UI.formModal({ title: 'Catat berat badan', fields: [{ name: 'kg', label: 'Berat (kg)', type: 'number', step: 0.1, min: 20, max: 300, required: true, inputmode: 'decimal' }, { name: 'date', label: 'Tanggal', type: 'date', value: C.dateKey(), required: true }] });
      if (v) App.commit(s => { s.fitness.bodyweight = s.fitness.bodyweight.filter(x => x.date !== v.date); s.fitness.bodyweight.push({ id: C.uid('bw'), kg: v.kg, date: v.date }); }, { quiet: true });
    },
    bwDel: (el) => App.commit(s => { s.fitness.bodyweight = s.fitness.bodyweight.filter(x => x.id !== el.dataset.id); }, { quiet: true })
  });
})();
