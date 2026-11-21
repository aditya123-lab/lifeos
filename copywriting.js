/* LIFE OS — Copywriting development */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const TYPES = ['Latihan menulis', 'Analisis swipe file', 'Belajar materi', 'Proyek portfolio', 'Rewrite / editing'];
  const STATUS = [['idea', 'Ide'], ['draft', 'Draft'], ['revisi', 'Revisi'], ['done', 'Selesai']];
  const TABS = [['overview', 'Ringkasan'], ['history', 'Riwayat'], ['topics', 'Materi'], ['portfolio', 'Portfolio'], ['swipe', 'Swipe File']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/copywriting/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;

  function overview() {
    const s = App.S(), k = C.dateKey(), target = s.settings.copyTarget;
    const today = C.minutesOn(s.copy.sessions, k);
    const ws = C.startOfWeek(k);
    const week = C.minutesIn(s.copy.sessions, ws, C.addDays(ws, 6));
    const month = C.minutesIn(s.copy.sessions, k.slice(0, 8) + '01', k);
    const daysHit = C.rangeKeys(C.addDays(k, -29), k).filter(d => C.minutesOn(s.copy.sessions, d) >= target).length;
    const weeks = [];
    for (let i = 7; i >= 0; i--) { const w = C.addDays(ws, -7 * i); weeks.push({ label: 'Minggu ' + C.formatDate(w, { short: true, year: false }), short: C.formatDate(w, { short: true, year: false }).replace(' ', '/'), value: C.minutesIn(s.copy.sessions, w, C.addDays(w, 6)) }); }
    const topicsDone = s.copy.topics.filter(t => t.done).length;
    return `
      ${App.timer.panel('copy') || `<div class="card hero"><div class="row" style="gap:16px">${UI.ring(today / target, { size: 96, stroke: 8, label: today + 'm', sub: 'dari ' + target + 'm', color: '#e06a9a' })}
        <div style="flex:1"><h3>Latihan harian</h3><p class="muted small" style="margin:4px 0 10px">${today >= target ? 'Target tercapai. Konsistensi > intensitas.' : (target - today) + ' menit lagi hari ini.'}</p>
        <div class="row wrap"><button class="btn primary" data-act="copyTimer">${icon('play', 16)}Mulai timer</button><button class="btn" data-act="copyLog">${icon('plus', 16)}Catat manual</button></div></div></div></div>`}
      <div class="kpis" style="margin-top:12px">
        <div class="kpi"><small>Minggu ini</small><b>${week}</b><span>mnt</span></div><div class="kpi"><small>Bulan ini</small><b>${(month / 60).toFixed(1)}</b><span>jam</span></div>
        <div class="kpi"><small>Total sesi</small><b>${s.copy.sessions.length}</b></div><div class="kpi"><small>Target tercapai (30h)</small><b>${daysHit}</b><span>hari</span></div>
      </div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('chart', 18)}<h3>Menit per minggu</h3></div>${UI.barChart(weeks, { unit: 'm', goal: target * 7, color: '#e06a9a' })}</div>
        <div class="card"><div class="card-head">${icon('target', 18)}<h3>Goal & milestone</h3><button class="btn sm" data-act="goalEdit">${icon('plus', 14)}</button></div>
          <div class="macro"><span class="lbl">Materi dikuasai</span><span class="val">${topicsDone}/${s.copy.topics.length}</span>${UI.bar(topicsDone / Math.max(1, s.copy.topics.length))}</div>
          <div class="macro"><span class="lbl">Portfolio selesai</span><span class="val">${s.copy.portfolio.filter(p => p.status === 'done').length}/${s.copy.portfolio.length}</span>${UI.bar(s.copy.portfolio.filter(p => p.status === 'done').length / Math.max(1, s.copy.portfolio.length))}</div>
          ${s.copy.goals.map(g => { const cur = goalValue(s, g); return `<div class="macro" data-act="goalEdit" data-id="${g.id}" style="cursor:pointer"><span class="lbl">${esc(g.title)}${cur >= g.target ? ' ✓' : ''}</span><span class="val">${fmt(cur)}/${fmt(g.target)} ${g.metric === 'minutes' ? 'mnt' : g.metric === 'sessions' ? 'sesi' : g.metric === 'portfolio' ? 'karya' : 'swipe'}</span>${UI.bar(cur / g.target, { cls: cur >= g.target ? 'good' : '' })}</div>`; }).join('')}
        </div>
      </div>`;
  }
  function goalValue(s, g) {
    const sess = s.copy.sessions.filter(x => !g.from || x.date >= g.from);
    if (g.metric === 'minutes') return sess.reduce((a, b) => a + b.minutes, 0);
    if (g.metric === 'sessions') return sess.length;
    if (g.metric === 'portfolio') return s.copy.portfolio.filter(p => p.status === 'done').length;
    return s.copy.swipes.length;
  }

  function history() {
    const s = App.S();
    const list = s.copy.sessions.slice().sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date)).slice(0, 200);
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">${s.copy.sessions.length} sesi tercatat</p><button class="btn primary sm" data-act="copyLog">${icon('plus', 15)}Catat</button></div>
      <div class="card tight"><div class="list">${list.map(x => `<div class="li"><span class="dot" style="background:#e06a9a"></span><div class="li-main"><div class="li-title">${esc(x.type)} · ${x.minutes} menit</div><div class="li-sub">${C.formatDate(x.date, { weekday: true })}${x.note ? ' · ' + esc(x.note) : ''}</div></div><button class="icon-btn" data-act="copyDel" data-id="${x.id}">${icon('trash', 16)}</button></div>`).join('') || '<div class="empty">' + icon('pen', 28) + 'Belum ada sesi.</div>'}</div></div>`;
  }
  function topics() {
    const s = App.S();
    return `<div class="card tight"><form class="row" data-submit="topicAdd" style="margin-bottom:6px"><input name="t" placeholder="Tambah topik belajar…" required><button class="btn">${icon('plus', 16)}</button></form>
      <div class="list">${s.copy.topics.map(t => `<div class="li"><button class="icon-btn" data-act="topicToggle" data-id="${t.id}" style="color:${t.done ? 'var(--good)' : 'var(--muted)'}">${icon(t.done ? 'check' : 'target', 18)}</button><div class="li-main"><div class="li-title" style="${t.done ? 'color:var(--muted)' : ''}">${esc(t.name)}</div></div><button class="icon-btn" data-act="topicDel" data-id="${t.id}">${icon('trash', 16)}</button></div>`).join('')}</div></div>`;
  }
  function portfolio() {
    const s = App.S();
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">Lacak karya untuk portfolio.</p><button class="btn primary sm" data-act="pfEdit">${icon('plus', 15)}Karya</button></div>
      ${STATUS.map(([id, l]) => { const list = s.copy.portfolio.filter(p => p.status === id); return `<div class="section-title">${l}<span class="spacer"></span>${list.length}</div><div class="card tight"><div class="list">${list.map(p => `<div class="li" data-act="pfEdit" data-id="${p.id}" style="cursor:pointer"><div class="li-main"><div class="li-title">${esc(p.title)}</div><div class="li-sub">${esc(p.kind || '')}${p.due ? ' · target ' + C.formatDate(p.due, { short: true, year: false }) : ''}${p.link ? ' · ada tautan' : ''}</div></div>${icon('edit', 16, 'muted')}</div>`).join('') || '<div class="empty small">—</div>'}</div></div>`; }).join('')}`;
  }
  function swipe() {
    const s = App.S();
    const list = s.copy.swipes.slice().sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="row between" style="margin-bottom:12px"><p class="muted small">Catat iklan / email / sales page yang kamu bedah.</p><button class="btn primary sm" data-act="swEdit">${icon('plus', 15)}Swipe</button></div>
      <div class="card tight"><div class="list">${list.map(w => `<div class="li" data-act="swEdit" data-id="${w.id}" style="cursor:pointer"><div class="li-main"><div class="li-title">${esc(w.title)}</div><div class="li-sub">${C.formatDate(w.date, { short: true })}${w.source ? ' · ' + esc(w.source) : ''}${w.note ? ' · ' + esc(w.note.slice(0, 80)) : ''}</div></div></div>`).join('') || '<div class="empty small">Belum ada swipe file.</div>'}</div></div>`;
  }

  App.pages.copywriting = {
    title: 'Copywriting',
    render(p) { const t = p[0] || 'overview'; return tabs(t) + ({ overview, history, topics, portfolio, swipe }[t] || overview)(); }
  };

  const crud = (path, item, v) => App.commit(s => {
    const arr = s.copy[path];
    if (v.__action === 'del') s.copy[path] = arr.filter(x => x.id !== item.id);
    else if (item) Object.assign(arr.find(x => x.id === item.id), v);
    else arr.push(Object.assign({ id: C.uid(path.slice(0, 2)) }, v));
  }, { quiet: true });

  Object.assign(App.actions, {
    copyTimer: () => App.timerStarter('copy', TYPES.map(t => ({ value: t, label: t })), 'Jenis latihan'),
    copyLog: async () => {
      const v = await UI.formModal({ title: 'Catat latihan copywriting', fields: [
        { name: 'type', label: 'Jenis', type: 'select', options: TYPES.map(t => ({ value: t, label: t })) },
        { name: 'minutes', label: 'Durasi (menit)', type: 'number', half: true, min: 1, max: 600, value: 30, required: true },
        { name: 'date', label: 'Tanggal', type: 'date', half: true, value: C.dateKey(), required: true },
        { name: 'note', label: 'Catatan', type: 'text', placeholder: 'mis. 10 headline untuk produk skincare' }],
        validate: v => v.date > C.dateKey() ? 'Tanggal tidak boleh di masa depan' : null });
      if (!v) return;
      App.commit(s => s.copy.sessions.push({ id: C.uid('cs'), type: v.type, minutes: Math.round(v.minutes), date: v.date, at: new Date().toISOString(), note: v.note, source: 'manual' }));
    },
    copyDel: async (el) => { if (await UI.confirmDialog('Hapus sesi ini?', { danger: true, ok: 'Hapus' })) App.commit(s => { s.copy.sessions = s.copy.sessions.filter(x => x.id !== el.dataset.id); }); },
    topicAdd: (f) => { const t = f.t.value.trim(); if (t) App.commit(s => s.copy.topics.push({ id: C.uid('ct'), name: t, done: false }), { quiet: true }); },
    topicToggle: (el) => App.commit(s => { const t = s.copy.topics.find(x => x.id === el.dataset.id); t.done = !t.done; }, { quiet: true }),
    topicDel: (el) => App.commit(s => { s.copy.topics = s.copy.topics.filter(x => x.id !== el.dataset.id); }, { quiet: true }),
    pfEdit: async (el) => {
      const p = el.dataset.id ? App.S().copy.portfolio.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: p ? 'Edit karya' : 'Karya baru', fields: [{ name: 'title', label: 'Judul', value: p ? p.title : '', required: true }, { name: 'kind', label: 'Jenis', value: p ? p.kind : '', placeholder: 'Sales page, email, iklan IG…' },
        { name: 'status', label: 'Status', type: 'select', half: true, value: p ? p.status : 'idea', options: STATUS.map(([value, label]) => ({ value, label })) }, { name: 'due', label: 'Target selesai', type: 'date', half: true, value: p ? p.due : '' }, { name: 'link', label: 'Tautan (opsional)', value: p ? p.link : '' }],
        extraActions: p ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (v) crud('portfolio', p, v);
    },
    swEdit: async (el) => {
      const w = el.dataset.id ? App.S().copy.swipes.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: w ? 'Edit swipe' : 'Swipe file baru', fields: [{ name: 'title', label: 'Judul / brand', value: w ? w.title : '', required: true }, { name: 'source', label: 'Sumber', value: w ? w.source : '' }, { name: 'date', label: 'Tanggal dibaca', type: 'date', value: w ? w.date : C.dateKey(), required: true }, { name: 'note', label: 'Apa yang bisa dipelajari?', type: 'textarea', value: w ? w.note : '' }],
        extraActions: w ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (v) crud('swipes', w, v);
    },
    goalEdit: async (el) => {
      const g = el.dataset.id ? App.S().copy.goals.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: g ? 'Edit goal' : 'Goal / milestone baru', fields: [{ name: 'title', label: 'Nama goal', value: g ? g.title : '', required: true, placeholder: 'mis. 50 jam latihan' },
        { name: 'metric', label: 'Diukur dari', type: 'select', half: true, value: g ? g.metric : 'minutes', options: [{ value: 'minutes', label: 'Total menit' }, { value: 'sessions', label: 'Jumlah sesi' }, { value: 'portfolio', label: 'Portfolio selesai' }, { value: 'swipes', label: 'Swipe file' }] },
        { name: 'target', label: 'Target', type: 'number', half: true, min: 1, value: g ? g.target : 600, required: true }, { name: 'from', label: 'Hitung mulai (opsional)', type: 'date', value: g ? g.from : '' }],
        extraActions: g ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (v) crud('goals', g, v);
    }
  });
})();
