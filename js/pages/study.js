/* LIFE OS — Academic management (Medical Student) */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const TABS = [['overview', 'Ringkasan'], ['sessions', 'Sesi'], ['subjects', 'Mata Kuliah'], ['tasks', 'Tugas & Checklist'], ['exams', 'Ujian']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/study/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  const subj = (s, id) => s.study.subjects.find(x => x.id === id) || { name: 'Lainnya', color: '#888' };
  const hm = m => m >= 60 ? Math.floor(m / 60) + ' j ' + (m % 60 ? (m % 60) + ' m' : '') : m + ' m';

  // shared timer starter (also used by copywriting)
  App.timerStarter = function (module, refOptions, refLabel) {
    const s = App.S();
    const p = s.settings.pomodoro;
    return UI.formModal({
      title: 'Mulai sesi fokus',
      fields: [
        { name: 'ref', label: refLabel, type: 'select', options: refOptions },
        { name: 'mode', label: 'Mode', type: 'select', value: 'p1', options: [
          { value: 'p1', label: `Pomodoro ${p.focus} / ${p.short} menit` }, { value: 'p2', label: `Deep work ${p.focus2} / ${p.long} menit` },
          { value: 'custom', label: 'Durasi kustom' }, { value: 'sw', label: 'Stopwatch (tanpa batas)' }] },
        { name: 'focus', label: 'Fokus (menit) — kustom', type: 'number', half: true, min: 1, max: 240, value: 40 },
        { name: 'brk', label: 'Istirahat (menit) — kustom', type: 'number', half: true, min: 1, max: 60, value: 8 }
      ],
      intro: '<p class="muted small" style="margin-bottom:10px">Waktu dihitung berdasarkan jam sistem, jadi tetap akurat walau layar dikunci. Setiap blok fokus yang selesai otomatis dicatat sebagai sesi.</p>',
      submitLabel: 'Mulai'
    }).then(v => {
      if (!v) return;
      const opt = refOptions.find(o => String(o.value) === String(v.ref));
      const cfg = v.mode === 'p1' ? { focus: p.focus, brk: p.short } : v.mode === 'p2' ? { focus: p.focus2, brk: p.long } : { focus: +v.focus || 25, brk: +v.brk || 5 };
      App.timer.start(Object.assign({ module, refId: v.ref, label: opt ? opt.label : '', kind: v.mode === 'sw' ? 'stopwatch' : 'pomodoro' }, cfg));
    });
  };

  function overview() {
    const s = App.S(), k = C.dateKey(), target = C.studyTarget(s);
    const today = C.minutesOn(s.study.sessions, k);
    const ws = C.startOfWeek(k);
    const week = C.minutesIn(s.study.sessions, ws, C.addDays(ws, 6));
    const month = C.minutesIn(s.study.sessions, k.slice(0, 8) + '01', k);
    const total = C.studyMinutesTotal(s);
    const last7 = C.rangeKeys(C.addDays(k, -6), k).map(d => ({ label: d, short: C.DAY_SHORT[C.weekday(d)], value: C.minutesOn(s.study.sessions, d), color: C.minutesOn(s.study.sessions, d) >= target ? 'var(--good)' : undefined }));
    const bySub = s.study.subjects.map(x => ({ x, m: s.study.sessions.filter(ss => ss.subjectId === x.id && ss.date >= C.addDays(k, -29)).reduce((a, b) => a + b.minutes, 0) })).filter(r => r.m).sort((a, b) => b.m - a.m);
    const maxSub = Math.max(1, ...bySub.map(r => r.m));
    const exam = s.study.exams.filter(e => e.date >= k).sort((a, b) => a.date.localeCompare(b.date))[0];
    return `
      ${App.timer.panel('study') || `<div class="card hero"><div class="row" style="gap:16px">${UI.ring(today / target, { size: 96, stroke: 8, label: today + 'm', sub: 'dari ' + target + 'm' })}
        <div style="flex:1"><h3>Target belajar harian</h3><p class="muted small" style="margin:4px 0 10px">${today >= target ? 'Target tercapai — habit belajar otomatis selesai.' : `${target - today} menit lagi untuk target hari ini.`}${s.settings.examMode ? ' <span class="pill warn">Mode ujian</span>' : ''}</p>
        <div class="row wrap"><button class="btn primary" data-act="studyTimer">${icon('play', 16)}Mulai Pomodoro</button><button class="btn" data-act="studyLog">${icon('plus', 16)}Catat manual</button></div></div></div></div>`}
      ${exam ? `<div class="banner warn" style="margin-top:12px">${icon('target', 18)}<span><b>${esc(exam.title)}</b> · ${C.formatDate(exam.date, { weekday: true })}</span><span class="spacer"></span><b>${C.daysBetween(k, exam.date)} hari lagi</b></div>` : ''}
      <div class="kpis" style="margin-top:12px">
        <div class="kpi"><small>Hari ini</small><b>${hm(today)}</b></div><div class="kpi"><small>Minggu ini</small><b>${hm(week)}</b></div>
        <div class="kpi"><small>Bulan ini</small><b>${hm(month)}</b></div><div class="kpi"><small>Total</small><b>${(total / 60).toFixed(1)}</b><span>jam</span></div>
      </div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('chart', 18)}<h3>7 hari terakhir</h3><span class="tiny muted">garis = target</span></div>${UI.barChart(last7, { unit: 'm', goal: target })}</div>
        <div class="card"><div class="card-head">${icon('book', 18)}<h3>Per mata kuliah (30 hari)</h3></div>
          ${bySub.length ? bySub.map(r => `<div class="macro"><span class="lbl"><span class="dot" style="background:${r.x.color};display:inline-block;margin-right:6px"></span>${esc(r.x.name)}</span><span class="val">${hm(r.m)}</span>${UI.bar(r.m / maxSub, { color: r.x.color })}</div>`).join('') : '<div class="empty small">Belum ada sesi.</div>'}</div>
      </div>
      <div class="card" style="margin-top:14px"><label class="switch"><span class="sw-text"><b>Mode ujian</b><small>Target harian menjadi ${s.settings.studyTargetExam} menit (ubah di Pengaturan).</small></span><input type="checkbox" class="toggle" data-chg="examMode" ${s.settings.examMode ? 'checked' : ''}></label></div>`;
  }

  function sessions() {
    const s = App.S();
    const list = s.study.sessions.slice().sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date));
    const groups = {};
    list.forEach(x => (groups[x.date] = groups[x.date] || []).push(x));
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">${list.length} sesi · ${(C.studyMinutesTotal(s) / 60).toFixed(1)} jam total</p><button class="btn primary sm" data-act="studyLog">${icon('plus', 15)}Catat sesi</button></div>
      ${Object.keys(groups).slice(0, 60).map(d => `<div class="section-title">${C.formatDate(d, { weekday: true })}<span class="spacer"></span>${hm(groups[d].reduce((a, b) => a + b.minutes, 0))}</div>
        <div class="card tight"><div class="list">${groups[d].map(x => { const sb = subj(s, x.subjectId); return `<div class="li"><span class="dot" style="background:${sb.color}"></span><div class="li-main"><div class="li-title">${esc(sb.name)} · ${x.minutes} menit</div><div class="li-sub">${x.source === 'timer' ? 'Timer' : 'Manual'}${x.note ? ' · ' + esc(x.note) : ''}</div></div><button class="icon-btn" data-act="studyDel" data-id="${x.id}" aria-label="Hapus">${icon('trash', 16)}</button></div>`; }).join('')}</div></div>`).join('') || '<div class="card empty">' + icon('book', 28) + 'Belum ada sesi belajar. Mulai Pomodoro pertamamu.</div>'}`;
  }

  function subjects() {
    const s = App.S();
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">Kelola mata kuliah / blok / topik.</p><button class="btn primary sm" data-act="subEdit">${icon('plus', 15)}Tambah</button></div>
      <div class="card tight"><div class="list">${s.study.subjects.map(x => { const m = s.study.sessions.filter(ss => ss.subjectId === x.id).reduce((a, b) => a + b.minutes, 0);
        return `<div class="li" data-act="subEdit" data-id="${x.id}" style="cursor:pointer"><span class="dot" style="background:${x.color}"></span><div class="li-main"><div class="li-title">${esc(x.name)}</div><div class="li-sub">${hm(m)} total</div></div>${icon('edit', 16, 'muted')}</div>`; }).join('') || '<div class="empty small">Belum ada mata kuliah.</div>'}</div></div>`;
  }

  function tasks() {
    const s = App.S(), k = C.dateKey();
    const asg = s.study.assignments.slice().sort((a, b) => (a.done - b.done) || (a.due || '9').localeCompare(b.due || '9'));
    const chk = s.study.checklist;
    return `<div class="section-title">${icon('note', 14)}Tugas & deadline<span class="spacer"></span><button class="btn sm" data-act="asgEdit">${icon('plus', 14)}Tugas</button></div>
      <div class="card tight"><div class="list">${asg.map(a => { const d = a.due ? C.daysBetween(k, a.due) : null;
        return `<div class="li"><button class="tick icon-btn" data-act="asgToggle" data-id="${a.id}" style="color:${a.done ? 'var(--good)' : 'var(--muted)'}">${icon(a.done ? 'check' : 'target', 18)}</button>
        <div class="li-main" data-act="asgEdit" data-id="${a.id}" style="cursor:pointer"><div class="li-title" style="${a.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(a.title)}</div><div class="li-sub">${esc(subj(s, a.subjectId).name)}${a.due ? ' · ' + C.formatDate(a.due, { short: true, year: false }) : ''}</div></div>
        ${!a.done && d != null ? `<span class="pill ${d < 0 ? 'bad' : d <= 2 ? 'warn' : ''}">${d < 0 ? 'Lewat ' + (-d) + ' hr' : d === 0 ? 'Hari ini' : d + ' hari'}</span>` : ''}</div>`; }).join('') || '<div class="empty small">Tidak ada tugas. 🎉</div>'}</div></div>
      <div class="section-title">${icon('list', 14)}Checklist belajar<span class="spacer"></span></div>
      <div class="card tight"><form class="row" data-submit="chkAdd" style="margin-bottom:6px"><input name="t" placeholder="mis. Review anatomi abdomen, 40 soal IPD…" required><button class="btn">${icon('plus', 16)}</button></form>
        <div class="list">${chk.map(c => `<div class="li"><button class="icon-btn" data-act="chkToggle" data-id="${c.id}" style="color:${c.done ? 'var(--good)' : 'var(--muted)'}">${icon(c.done ? 'check' : 'target', 18)}</button><div class="li-main"><div class="li-title" style="${c.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(c.title)}</div>${c.doneAt ? `<div class="li-sub">Selesai ${C.formatDate(c.doneAt, { short: true })}</div>` : ''}</div><button class="icon-btn" data-act="chkDel" data-id="${c.id}">${icon('trash', 16)}</button></div>`).join('') || '<div class="empty small">Tambahkan topik yang ingin dikuasai.</div>'}</div></div>`;
  }

  function exams() {
    const s = App.S(), k = C.dateKey();
    const list = s.study.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">Countdown ujian & tanggal penting akademik (tampil di kalender).</p><button class="btn primary sm" data-act="examEdit">${icon('plus', 15)}Ujian</button></div>
      <div class="grid two">${list.map(e => { const d = C.daysBetween(k, e.date);
        return `<div class="card ${d >= 0 && d <= 7 ? 'hero' : ''}" data-act="examEdit" data-id="${e.id}" style="cursor:pointer;${d < 0 ? 'opacity:.55' : ''}"><div class="row between"><div><h3>${esc(e.title)}</h3><p class="muted small">${C.formatDate(e.date, { weekday: true })}${e.time ? ' · ' + e.time : ''} · ${esc(subj(s, e.subjectId).name)}</p></div>
          <div style="text-align:right"><b style="font-size:1.6rem" class="num">${d < 0 ? '✓' : d}</b><div class="tiny muted">${d < 0 ? 'selesai' : d === 0 ? 'HARI INI' : 'hari lagi'}</div></div></div>${e.note ? `<p class="small muted" style="margin-top:8px">${esc(e.note)}</p>` : ''}</div>`; }).join('') || '<div class="card empty" style="grid-column:1/-1">Belum ada ujian terjadwal.</div>'}</div>`;
  }

  App.pages.study = {
    title: 'Belajar Kedokteran',
    render(p) {
      const tab = p[0] || 'overview';
      return tabs(tab) + ({ overview, sessions, subjects, tasks, exams }[tab] || overview)();
    }
  };

  const subOpts = () => App.S().study.subjects.map(x => ({ value: x.id, label: x.name }));
  Object.assign(App.actions, {
    studyTimer: () => { if (!App.S().study.subjects.length) return UI.toast('Tambah mata kuliah dulu', 'error'); App.timerStarter('study', subOpts(), 'Mata kuliah / topik'); },
    studyLog: async () => {
      const v = await UI.formModal({ title: 'Catat sesi belajar', fields: [
        { name: 'subjectId', label: 'Mata kuliah', type: 'select', options: subOpts() },
        { name: 'minutes', label: 'Durasi (menit)', type: 'number', half: true, min: 1, max: 600, value: 60, required: true },
        { name: 'date', label: 'Tanggal', type: 'date', half: true, value: C.dateKey(), required: true },
        { name: 'note', label: 'Catatan', type: 'text', placeholder: 'Topik yang dipelajari' }],
        validate: v => v.date > C.dateKey() ? 'Tanggal tidak boleh di masa depan' : null });
      if (!v) return;
      App.commit(s => s.study.sessions.push({ id: C.uid('ss'), subjectId: v.subjectId, minutes: Math.round(v.minutes), date: v.date, at: new Date().toISOString(), note: v.note, source: 'manual' }));
      UI.toast('Sesi dicatat', 'good');
    },
    studyDel: async (el) => { if (await UI.confirmDialog('Hapus sesi ini? Jika target hari ini jadi tidak tercapai, XP habit belajar hari ini dibatalkan.', { danger: true, ok: 'Hapus' })) App.commit(s => { s.study.sessions = s.study.sessions.filter(x => x.id !== el.dataset.id); }); },
    examMode: (el) => App.commit(s => { s.settings.examMode = el.checked; }, { quiet: true }),
    subEdit: async (el) => {
      const s = App.S(); const x = el.dataset.id ? s.study.subjects.find(y => y.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: x ? 'Edit mata kuliah' : 'Mata kuliah baru', fields: [{ name: 'name', label: 'Nama', value: x ? x.name : '', required: true }, { name: 'color', label: 'Warna', type: 'color', value: x ? x.color : '#8b7cf6' }],
        extraActions: x ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      if (v.__action === 'del') { if (s.study.sessions.some(ss => ss.subjectId === x.id)) return UI.toast('Mata kuliah punya riwayat sesi — ganti nama saja agar riwayat tetap utuh.', 'error'); return App.commit(st => { st.study.subjects = st.study.subjects.filter(y => y.id !== x.id); }, { quiet: true }); }
      App.commit(st => { if (x) Object.assign(st.study.subjects.find(y => y.id === x.id), v); else st.study.subjects.push({ id: C.uid('sub'), name: v.name, color: v.color }); }, { quiet: true });
    },
    asgEdit: async (el) => {
      const s = App.S(); const a = el.dataset.id ? s.study.assignments.find(y => y.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: a ? 'Edit tugas' : 'Tugas baru', fields: [{ name: 'title', label: 'Judul', value: a ? a.title : '', required: true }, { name: 'subjectId', label: 'Mata kuliah', type: 'select', value: a ? a.subjectId : '', options: subOpts() }, { name: 'due', label: 'Deadline', type: 'date', value: a ? a.due : '' }],
        extraActions: a ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      App.commit(st => { if (v.__action === 'del') st.study.assignments = st.study.assignments.filter(y => y.id !== a.id); else if (a) Object.assign(st.study.assignments.find(y => y.id === a.id), v); else st.study.assignments.push(Object.assign({ id: C.uid('as'), done: false }, v)); }, { quiet: true });
    },
    asgToggle: (el) => App.commit(s => { const a = s.study.assignments.find(y => y.id === el.dataset.id); a.done = !a.done; a.doneAt = a.done ? C.dateKey() : ''; }, { quiet: true }),
    chkAdd: (f) => { const t = f.t.value.trim(); if (!t) return; App.commit(s => s.study.checklist.unshift({ id: C.uid('ck'), title: t, done: false }), { quiet: true }); },
    chkToggle: (el) => App.commit(s => { const c = s.study.checklist.find(y => y.id === el.dataset.id); c.done = !c.done; c.doneAt = c.done ? C.dateKey() : ''; }, { quiet: true }),
    chkDel: (el) => App.commit(s => { s.study.checklist = s.study.checklist.filter(y => y.id !== el.dataset.id); }, { quiet: true }),
    examEdit: async (el) => {
      const s = App.S(); const e = el.dataset.id ? s.study.exams.find(y => y.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: e ? 'Edit ujian' : 'Ujian baru', fields: [{ name: 'title', label: 'Nama ujian', value: e ? e.title : '', required: true, placeholder: 'mis. Ujian Blok Bedah' }, { name: 'subjectId', label: 'Mata kuliah', type: 'select', value: e ? e.subjectId : '', options: subOpts() },
        { name: 'date', label: 'Tanggal', type: 'date', half: true, value: e ? e.date : '', required: true }, { name: 'time', label: 'Jam', type: 'time', half: true, value: e ? e.time : '' }, { name: 'note', label: 'Catatan', type: 'textarea', value: e ? e.note : '' }],
        extraActions: e ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      App.commit(st => { if (v.__action === 'del') st.study.exams = st.study.exams.filter(y => y.id !== e.id); else if (e) Object.assign(st.study.exams.find(y => y.id === e.id), v); else st.study.exams.push(Object.assign({ id: C.uid('ex') }, v)); }, { quiet: true });
    }
  });
})();
