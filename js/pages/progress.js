/* LIFE OS — Analytics, reports, XP history, achievements gallery, reward shop */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const TABS = [['overview', 'Ringkasan'], ['week', 'Laporan Mingguan'], ['month', 'Laporan Bulanan'], ['xp', 'Riwayat XP']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/progress/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  const clampFrom = (s, k) => k < s.createdAt ? s.createdAt : k;

  function habitRanking(s, from, to) {
    return s.habits.filter(h => h.active).map(h => ({ h, c: C.habitConsistency(s, h, clampFrom(s, from), to) })).filter(r => r.c.sched >= 3).sort((a, b) => b.c.pct - a.c.pct);
  }
  function insights(s, from, to) {
    const out = [];
    const rk = habitRanking(s, from, to);
    if (rk.length) {
      out.push(`Habit paling konsisten: <b>${esc(rk[0].h.name)}</b> (${UI.pct(rk[0].c.pct)}).`);
      const weak = rk[rk.length - 1];
      if (weak.c.pct < .6) out.push(`Butuh perhatian: <b>${esc(weak.h.name)}</b> (${UI.pct(weak.c.pct)}). Coba pindahkan jamnya, kecilkan targetnya, atau jadikan opsional sementara.`);
    }
    const byWd = [0, 1, 2, 3, 4, 5, 6].map(wd => { const ds = C.rangeKeys(clampFrom(s, from), to).filter(k => C.weekday(k) === wd && !s.restDays[k]); const r = ds.reduce((a, k) => { const x = C.dayStats(s, k); return { d: a.d + x.done, t: a.t + x.total }; }, { d: 0, t: 0 }); return { wd, pct: r.t ? r.d / r.t : null }; }).filter(x => x.pct != null);
    if (byWd.length >= 3) { byWd.sort((a, b) => b.pct - a.pct); out.push(`Hari terkuat: <b>${C.DAY_NAMES[byWd[0].wd]}</b> (${UI.pct(byWd[0].pct)}) · terlemah: <b>${C.DAY_NAMES[byWd[byWd.length - 1].wd]}</b> (${UI.pct(byWd[byWd.length - 1].pct)}).`); }
    const reasons = {};
    C.rangeKeys(clampFrom(s, from), to).forEach(k => Object.values(s.logs[k] || {}).forEach(l => { if (l.s === 'skipped') { const r = (l.reason || '').split(' — ')[0]; reasons[r] = (reasons[r] || 0) + 1; } }));
    const topR = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
    if (topR) out.push(`Alasan melewati tugas terbanyak: <b>${esc(topR[0])}</b> (${topR[1]}×).`);
    return out;
  }

  function overview() {
    const s = App.S(), k = C.dateKey();
    const lv = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
    const ws = C.startOfWeek(k), ms = k.slice(0, 8) + '01';
    const day = C.dayStats(s, k), wk = C.rangeCompletion(s, clampFrom(s, ws), k), mo = C.rangeCompletion(s, clampFrom(s, ms), k);
    const from30 = clampFrom(s, C.addDays(k, -29));
    const line = C.rangeKeys(from30, k).map(d => ({ label: d, short: d.slice(8), value: s.restDays[d] ? 0 : Math.round(C.dayStats(s, d).pct * 100) }));
    const xp14 = C.rangeKeys(C.addDays(k, -13), k).map(d => ({ label: d, short: d.slice(8), value: Math.max(0, C.xpOnDate(s, d)) }));
    const weeks = []; for (let i = 7; i >= 0; i--) { const w = C.addDays(ws, -7 * i); weeks.push(w); }
    const studyW = weeks.map(w => ({ label: w, short: C.formatDate(w, { short: true, year: false }).replace(' ', '/'), value: C.round1(C.minutesIn(s.study.sessions, w, C.addDays(w, 6)) / 60) }));
    const copyW = weeks.map(w => ({ label: w, short: C.formatDate(w, { short: true, year: false }).replace(' ', '/'), value: C.round1(C.minutesIn(s.copy.sessions, w, C.addDays(w, 6)) / 60), color: '#e06a9a' }));
    const gymW = weeks.map(w => ({ label: w, short: C.formatDate(w, { short: true, year: false }).replace(' ', '/'), value: C.workoutsIn(s, w, C.addDays(w, 6)).length, color: 'var(--warn)' }));
    const nutDays = C.rangeKeys(from30, k).filter(d => C.nutritionDay(s, d).mealsLogged >= s.settings.mealsRequired).length;
    const rk = habitRanking(s, from30, k);
    const heatFrom = clampFrom(s, C.addDays(k, -83));
    const ins = insights(s, from30, k);
    return `
      <div class="card hero"><div class="row between wrap"><div><p class="muted small">Level saat ini</p><h1 style="font-size:2rem">Level ${lv.level} <span class="rank-badge" style="color:${lv.rank.color};vertical-align:middle">${lv.rank.name}</span></h1></div>
        <div style="text-align:right"><p class="muted small">Total XP</p><b style="font-size:1.4rem" class="num">${fmt(lv.total)}</b><p class="tiny muted">Saldo reward: ${fmt(C.balanceXP(s))} XP</p></div></div>
        <div style="margin-top:12px">${UI.bar(lv.progress, { cls: 'thick' })}</div><p class="small muted" style="margin-top:6px">${lv.max ? 'Level maksimum.' : `${fmt(lv.toNext)} XP lagi ke Level ${lv.level + 1}`}</p></div>
      <div class="kpis" style="margin-top:12px">
        <div class="kpi"><small>Hari ini</small><b>${UI.pct(day.pct)}</b></div><div class="kpi"><small>Minggu ini</small><b>${UI.pct(wk.pct)}</b></div>
        <div class="kpi"><small>Bulan ini</small><b>${UI.pct(mo.pct)}</b></div><div class="kpi"><small>Streak / terpanjang</small><b>${C.currentStreak(s, k)}</b><span>/ ${C.longestStreak(s, k)} hari</span></div>
        <div class="kpi"><small>Jam belajar (total)</small><b>${(C.studyMinutesTotal(s) / 60).toFixed(1)}</b></div><div class="kpi"><small>Jam copywriting</small><b>${(s.copy.sessions.reduce((a, x) => a + x.minutes, 0) / 60).toFixed(1)}</b></div>
        <div class="kpi"><small>Total sesi gym</small><b>${s.fitness.workouts.length}</b></div><div class="kpi"><small>Nutrisi lengkap (30h)</small><b>${nutDays}</b><span>hari</span></div>
        ${s.settings.private.showInStats && s.selfControl.active ? `<div class="kpi"><small>Tantangan Privat</small><b>${C.privateStreak(s, k)}</b><span>hari</span></div>` : ''}
      </div>
      ${ins.length ? `<div class="card" style="margin-top:14px"><div class="card-head">${icon('spark', 18)}<h3>Insight</h3></div>${ins.map(t => `<p class="small" style="margin-bottom:6px">• ${t}</p>`).join('')}</div>` : ''}
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('chart', 18)}<h3>Penyelesaian harian (%)</h3></div>${UI.lineChart(line, { unit: '%', max: 100 })}</div>
        <div class="card"><div class="card-head">${icon('bolt', 18)}<h3>XP per hari</h3></div>${UI.barChart(xp14)}</div>
        <div class="card"><div class="card-head">${icon('book', 18)}<h3>Jam belajar / minggu</h3></div>${UI.barChart(studyW, { unit: 'j', goal: C.studyTarget(s) * 7 / 60 })}</div>
        <div class="card"><div class="card-head">${icon('pen', 18)}<h3>Jam copywriting / minggu</h3></div>${UI.barChart(copyW, { unit: 'j', goal: s.settings.copyTarget * 7 / 60 })}</div>
        <div class="card"><div class="card-head">${icon('dumbbell', 18)}<h3>Frekuensi gym / minggu</h3></div>${UI.barChart(gymW, { goal: s.settings.gymPerWeek })}</div>
        <div class="card"><div class="card-head">${icon('calendar', 18)}<h3>Konsistensi 12 minggu</h3></div>${UI.heatmap(C.rangeKeys(heatFrom, k).map(d => ({ v: s.restDays[d] ? null : C.dayStats(s, d).pct, title: d + ' · ' + UI.pct(C.dayStats(s, d).pct) })))}</div>
      </div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('trophy', 18)}<h3>Habit terkuat (30 hari)</h3></div>${rk.slice(0, 5).map(r => `<div class="macro"><span class="lbl">${esc(r.h.name)}</span><span class="val">${UI.pct(r.c.pct)}</span>${UI.bar(r.c.pct, { cls: 'good thin' })}</div>`).join('') || '<div class="empty small">Data belum cukup (min. 3 hari terjadwal).</div>'}</div>
        <div class="card"><div class="card-head">${icon('target', 18)}<h3>Perlu ditingkatkan</h3></div>${rk.slice(-5).reverse().filter(r => r.c.pct < .8).map(r => `<div class="macro"><span class="lbl">${esc(r.h.name)}</span><span class="val">${UI.pct(r.c.pct)}</span>${UI.bar(r.c.pct, { cls: 'warn thin' })}</div>`).join('') || (rk.length ? '<div class="empty small">Semua habit ≥ 80%. Mantap!</div>' : '<div class="empty small">Data belum cukup (min. 3 hari terjadwal).</div>')}</div>
      </div>`;
  }

  function report(kind, anchor) {
    const s = App.S(), today = C.dateKey();
    let from, to, label, prevA, nextA;
    if (kind === 'week') { from = C.startOfWeek(anchor || today); to = C.addDays(from, 6); label = C.formatDate(from, { short: true }) + ' – ' + C.formatDate(to, { short: true }); prevA = C.addDays(from, -7); nextA = C.addDays(from, 7); }
    else { const d = C.parseKey(anchor || today); from = C.dateKey(new Date(d.getFullYear(), d.getMonth(), 1)); to = C.dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)); label = C.MONTHS[d.getMonth()] + ' ' + d.getFullYear(); prevA = C.dateKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)); nextA = C.dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
    const end = to > today ? today : to;
    const f = clampFrom(s, from);
    const valid = f <= end;
    const comp = valid ? C.rangeCompletion(s, f, end) : { pct: 0, done: 0, total: 0 };
    const xp = valid ? C.rangeKeys(f, end).reduce((a, d) => a + C.xpOnDate(s, d), 0) : 0;
    const study = C.minutesIn(s.study.sessions, from, to), copy = C.minutesIn(s.copy.sessions, from, to);
    const gym = C.workoutsIn(s, from, to).length;
    const nDays = valid ? C.rangeKeys(f, end).length : 0;
    const gymTarget = kind === 'week' ? s.settings.gymPerWeek : Math.round(s.settings.gymPerWeek * nDays / 7);
    const nut = valid ? C.rangeKeys(f, end).map(d => C.nutritionDay(s, d)) : [];
    const logged = nut.filter(n => n.items);
    const avg = key => logged.length ? logged.reduce((a, n) => a + n.totals[key], 0) / logged.length : 0;
    const days = valid ? C.rangeKeys(f, end).map(d => ({ d, st: C.dayStats(s, d) })) : [];
    const best = days.filter(x => !x.st.rest && x.st.total).sort((a, b) => b.st.pct - a.st.pct || b.st.xp - a.st.xp)[0];
    const rk = valid ? habitRanking(s, f, end) : [];
    const ins = valid ? insights(s, f, end) : [];
    const ach = Object.entries(s.achievements).filter(([, v]) => v.date >= from && v.date <= to).map(([id]) => C.ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
    const target = kind === 'week' ? 7 : nDays;
    return `<div class="card row" style="gap:8px"><button class="icon-btn" data-act="go" data-to="progress/${kind}/${prevA}">${icon('left')}</button><div style="flex:1;text-align:center"><b>${label}</b><div class="muted small">${kind === 'week' ? 'Laporan mingguan' : 'Laporan bulanan'}${to > today ? ' · berjalan' : ''}</div></div><button class="icon-btn" ${nextA > today ? 'disabled style="opacity:.3"' : ''} data-act="go" data-to="progress/${kind}/${nextA}">${icon('right')}</button></div>
      ${!valid ? '<div class="card empty" style="margin-top:14px">Belum ada data untuk periode ini.</div>' : `
      <div class="kpis" style="margin-top:12px">
        <div class="kpi"><small>Penyelesaian</small><b>${UI.pct(comp.pct)}</b><span>${comp.done}/${comp.total}</span></div><div class="kpi"><small>XP diperoleh</small><b>${fmt(xp)}</b></div>
        <div class="kpi"><small>Belajar</small><b>${(study / 60).toFixed(1)}</b><span>jam / target ${(C.studyTarget(s) * target / 60).toFixed(0)}</span></div><div class="kpi"><small>Copywriting</small><b>${(copy / 60).toFixed(1)}</b><span>jam</span></div>
        <div class="kpi"><small>Gym</small><b>${gym}</b><span>/ ${gymTarget} sesi</span></div><div class="kpi"><small>Hari makan lengkap</small><b>${nut.filter(n => n.mealsLogged >= s.settings.mealsRequired).length}</b><span>/ ${nDays}</span></div>
        <div class="kpi"><small>Rata kalori (hari dicatat)</small><b>${fmt(avg('kcal'))}</b></div><div class="kpi"><small>Rata protein</small><b>${fmt(avg('p'))}</b><span>g</span></div>
      </div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('chart', 18)}<h3>Penyelesaian per hari</h3></div>${UI.barChart(days.map(x => ({ label: x.d, short: kind === 'week' ? C.DAY_SHORT[C.weekday(x.d)] : x.d.slice(8), value: x.st.rest ? 0 : Math.round(x.st.pct * 100), color: x.st.pct * 100 >= s.settings.successThreshold ? 'var(--good)' : undefined })), { unit: '%', max: 100, goal: s.settings.successThreshold })}</div>
        <div class="card"><div class="card-head">${icon('spark', 18)}<h3>Ringkasan</h3></div>
          ${best ? `<p class="small" style="margin-bottom:6px">• Hari terbaik: <b>${C.formatDate(best.d, { weekday: true, year: false })}</b> (${UI.pct(best.st.pct)}, +${fmt(best.st.xp)} XP)</p>` : ''}
          ${ins.map(t => `<p class="small" style="margin-bottom:6px">• ${t}</p>`).join('')}
          ${ach.length ? `<p class="small">• Achievement baru: ${ach.map(a => '<b>' + esc(a.name) + '</b>').join(', ')}</p>` : ''}
          ${!best && !ins.length ? '<div class="empty small">Data belum cukup.</div>' : ''}</div>
      </div>
      <div class="section-title">Konsistensi habit</div>
      <div class="card">${rk.map(r => `<div class="macro"><span class="lbl">${esc(r.h.name)}</span><span class="val">${r.c.done}/${r.c.sched} · ${UI.pct(r.c.pct)}</span>${UI.bar(r.c.pct, { cls: 'thin ' + (r.c.pct >= .8 ? 'good' : r.c.pct < .5 ? 'warn' : '') })}</div>`).join('') || '<div class="empty small">Data belum cukup.</div>'}</div>`}`;
  }

  function xpHistory() {
    const s = App.S();
    const f = App._xpFilter || 'all';
    const list = s.xpTx.slice().reverse().filter(t => f === 'all' || t.source === f);
    const spent = s.redemptions.slice().reverse();
    return `<div class="kpis"><div class="kpi"><small>Total diperoleh</small><b>${fmt(C.totalXP(s))}</b></div><div class="kpi"><small>Ditukar</small><b>${fmt(C.spentXP(s))}</b></div><div class="kpi"><small>Saldo</small><b class="accent">${fmt(C.balanceXP(s))}</b></div><div class="kpi"><small>Transaksi</small><b>${s.xpTx.length}</b></div></div>
      <p class="tiny muted" style="margin:10px 2px">Level dihitung dari total XP yang pernah diperoleh — menukar reward tidak menurunkan level. Pembatalan dicatat sebagai transaksi negatif, riwayat tidak pernah dihapus.</p>
      <div class="seg" style="margin:6px 0 12px">${[['all', 'Semua'], ['habit', 'Habit'], ['bonus', 'Bonus'], ['achievement', 'Achievement'], ['private', 'Privat']].map(([v, l]) => `<button class="${f === v ? 'on' : ''}" data-act="xpFilter" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="card tight"><div class="list">${list.slice(0, 300).map(t => `<div class="li"><div class="li-main"><div class="li-title">${esc(t.source === 'private' ? 'Milestone privat' : t.label)}</div><div class="li-sub">${C.formatDate(t.date, { short: true })} · ${new Date(t.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}${t.reversed ? ' · dibatalkan' : ''}</div></div><b class="num ${t.amount < 0 ? 'bad' : t.reversed ? 'muted' : 'good'}">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</b></div>`).join('') || '<div class="empty">Belum ada transaksi XP.</div>'}</div></div>
      ${spent.length ? `<div class="section-title">Penukaran reward</div><div class="card tight"><div class="list">${spent.map(r => `<div class="li"><div class="li-main"><div class="li-title">${esc(r.name)}</div><div class="li-sub">${new Date(r.at).toLocaleString('id-ID')}</div></div><b class="num warn">−${fmt(r.cost)}</b></div>`).join('')}</div></div>` : ''}`;
  }

  App.pages.progress = {
    title: 'Progress & Analytics',
    render(p) { const t = p[0] || 'overview'; return tabs(t) + (t === 'week' || t === 'month' ? report(t, p[1]) : t === 'xp' ? xpHistory() : overview()); }
  };

  // ------------------------------------------------------------ achievements gallery
  App.pages.achievements = {
    title: 'Achievement',
    render() {
      const s = App.S();
      const got = C.ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
      return `<div class="card hero row between"><div><h3>${got} / ${C.ACHIEVEMENTS.length} terbuka</h3><p class="muted small">Ketuk badge untuk detail syarat & progres.</p></div>${UI.ring(got / C.ACHIEVEMENTS.length, { size: 64, stroke: 6, label: got })}</div>
        ${!s.settings.achievementsEnabled ? '<div class="banner warn" style="margin-top:12px">Achievement dinonaktifkan di Pengaturan.</div>' : ''}
        <div class="badge-grid" style="margin-top:14px">${C.ACHIEVEMENTS.map(a => { const u = s.achievements[a.id]; const [cur, tgt] = a.prog(s);
          return `<div class="badge-card ${u ? '' : 'locked'}" data-act="achInfo" data-id="${a.id}">${UI.badge(a, !!u, 60)}<h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p>
            ${u ? `<span class="pill good">${C.formatDate(u.date, { short: true })}</span>` : `${UI.bar(cur / tgt, { cls: 'thin' })}<p class="tiny" style="margin-top:4px;min-height:0">${fmt(Math.min(cur, tgt))}/${fmt(tgt)} · +${a.xp} XP</p>`}</div>`; }).join('')}</div>`;
    }
  };

  // ------------------------------------------------------------ reward shop
  App.pages.rewards = {
    title: 'Reward Shop',
    render() {
      const s = App.S(), bal = C.balanceXP(s);
      if (!s.settings.rewardsEnabled) return `<div class="card empty">${icon('gift', 28)}Reward Shop dinonaktifkan.<br><button class="btn" style="margin-top:12px" data-act="rewardsOn">Aktifkan</button></div>`;
      return `<div class="card hero row between"><div><p class="muted small">Saldo XP</p><b style="font-size:1.8rem" class="num">${fmt(bal)}</b><p class="tiny muted">Opsional · menukar reward tidak menurunkan level.</p></div>${icon('gift', 36, 'accent')}</div>
        <div class="row between" style="margin:16px 2px 10px"><span class="section-title" style="margin:0">Reward kamu</span><button class="btn sm primary" data-act="rwEdit">${icon('plus', 14)}Reward</button></div>
        <div class="stack">${s.rewards.map(r => `<div class="card row"><div style="flex:1;cursor:pointer" data-act="rwEdit" data-id="${r.id}"><b>${esc(r.name)}</b><p class="small muted num">${fmt(r.cost)} XP</p>${UI.bar(bal / r.cost, { cls: 'thin' })}</div>
          <button class="btn sm ${bal >= r.cost ? 'primary' : ''}" ${bal >= r.cost ? '' : 'disabled'} data-act="rwRedeem" data-id="${r.id}">Tukar</button></div>`).join('') || '<div class="card empty">Buat reward pertamamu.</div>'}</div>
        ${s.redemptions.length ? `<div class="section-title">Riwayat penukaran</div><div class="card tight"><div class="list">${s.redemptions.slice().reverse().slice(0, 50).map(r => `<div class="li"><div class="li-main"><div class="li-title">${esc(r.name)}</div><div class="li-sub">${new Date(r.at).toLocaleString('id-ID')}</div></div><b class="num warn">−${fmt(r.cost)}</b></div>`).join('')}</div></div>` : ''}`;
    }
  };

  Object.assign(App.actions, {
    xpFilter: (el) => { App._xpFilter = el.dataset.v; App.render(); },
    achInfo: (el) => {
      const s = App.S(), a = C.ACHIEVEMENTS.find(x => x.id === el.dataset.id), u = s.achievements[a.id]; const [cur, tgt] = a.prog(s);
      UI.modal({ title: a.name, body: `<div style="text-align:center">${UI.badge(a, !!u, 96)}<p style="margin:10px 0 4px">${esc(a.desc)}</p><p class="small muted">Reward: +${a.xp} XP</p>
        ${u ? `<p class="pill good" style="margin-top:10px">Terbuka ${C.formatDate(u.date, { weekday: true })}</p>` : `<div style="margin-top:14px">${UI.bar(cur / tgt)}<p class="small muted" style="margin-top:6px">Progres: ${fmt(Math.min(cur, tgt))} / ${fmt(tgt)}</p></div>`}</div>` });
    },
    rewardsOn: () => App.commit(s => { s.settings.rewardsEnabled = true; }, { quiet: true }),
    rwEdit: async (el) => {
      const s = App.S(); const r = el.dataset.id ? s.rewards.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: r ? 'Edit reward' : 'Reward baru', fields: [{ name: 'name', label: 'Reward', value: r ? r.name : '', required: true }, { name: 'cost', label: 'Harga (XP)', type: 'number', min: 1, value: r ? r.cost : 500, required: true }], extraActions: r ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      App.commit(st => { if (v.__action === 'del') st.rewards = st.rewards.filter(x => x.id !== r.id); else if (r) Object.assign(st.rewards.find(x => x.id === r.id), { name: v.name, cost: Math.round(v.cost) }); else st.rewards.push({ id: C.uid('rw'), name: v.name, cost: Math.round(v.cost) }); }, { quiet: true });
    },
    rwRedeem: async (el) => {
      const s = App.S(), r = s.rewards.find(x => x.id === el.dataset.id);
      if (C.balanceXP(s) < r.cost) return UI.toast('Saldo XP belum cukup', 'error');
      if (!(await UI.confirmDialog(`Tukar ${fmt(r.cost)} XP untuk "${r.name}"? Saldo setelahnya: ${fmt(C.balanceXP(s) - r.cost)} XP.`, { title: 'Konfirmasi penukaran', ok: 'Tukar' }))) return;
      App.commit(st => { if (C.balanceXP(st) >= r.cost) st.redemptions.push({ id: C.uid('rd'), rewardId: r.id, name: r.name, cost: r.cost, at: new Date().toISOString() }); }, { quiet: true });
      UI.celebrate({ title: 'Reward ditukar!', subtitle: `Nikmati "${r.name}". Kamu pantas mendapatkannya.`, iconName: 'gift' });
    }
  });
})();
