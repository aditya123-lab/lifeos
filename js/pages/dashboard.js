/* LIFE OS — Dashboard */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;

  App.pages.dashboard = {
    title: () => 'Dashboard',
    render() {
      const s = App.S(), k = C.dateKey(), now = new Date();
      const lv = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
      const st = C.dayStats(s, k);
      const streak = C.currentStreak(s, k);
      const hs = C.habitsFor(s, k);
      const pri = C.priorityTasks(s, k);
      const next = C.nextAchievement(s);
      const curP = C.currentPeriod(s, now);
      const showOpt = App._showOptional !== false;
      const remaining = hs.filter(h => C.isMandatoryOn(h, k) && !C.statusOf(s, k, h.id));
      const nd = C.nutritionDay(s, k);
      const weekStart = C.startOfWeek(k);
      const gymWeek = C.workoutsIn(s, weekStart, C.addDays(weekStart, 6)).length;
      const studyMin = C.minutesOn(s.study.sessions, k), copyMin = C.minutesOn(s.copy.sessions, k);
      const items = C.calendarItems(s, k).filter(i => i.kind !== 'study' && i.kind !== 'copy');
      const exam = s.study.exams.filter(e => e.date >= k).sort((a, b) => a.date.localeCompare(b.date))[0];
      const initial = (s.profile.name || 'U').trim().charAt(0).toUpperCase();

      const periods = C.PERIODS.map(p => {
        let list = hs.filter(h => h.period === p.id);
        if (!showOpt) list = list.filter(h => C.isMandatoryOn(h, k));
        if (!list.length) return '';
        const d = list.filter(h => (C.statusOf(s, k, h.id) || {}).s === 'done').length;
        return `<div class="card ${p.id === curP ? 'hero' : ''}"><div class="period-head">${icon(p.icon, 17)}${p.label}${p.id === curP ? ' <span class="pill accent">Sekarang</span>' : ''}<small>${d}/${list.length}</small></div>
          <div class="tasks">${list.map(h => App.taskRow(h, k)).join('')}</div></div>`;
      }).join('');

      return `
      <div class="grid two">
        <div class="card hero">
          <div class="hello"><div class="avatar">${esc(initial)}</div>
            <div style="flex:1;min-width:0"><h2>${C.greeting(now)}, ${esc(s.profile.name || 'kamu')}</h2>
            <p class="muted small">${C.formatDate(k, { weekday: true })} · ${esc(s.profile.role || '')}</p></div></div>
          <div class="level-line"><b>Lv ${lv.level}</b><span class="rank-badge" style="color:${lv.rank.color}">${icon('medal', 13)}${lv.rank.name}</span><span class="spacer"></span><span class="muted small num">${fmt(lv.total)} XP total</span></div>
          ${UI.bar(lv.progress, { cls: 'thick' })}
          <p class="muted small" style="margin-top:6px">${lv.max ? 'Level maksimum tercapai.' : `${fmt(lv.into)} / ${fmt(lv.need)} XP · <b class="accent">${fmt(lv.toNext)} XP</b> lagi ke Level ${lv.level + 1}`}</p>
        </div>

        <div class="card">
          <div class="row" style="gap:16px">
            ${UI.ring(st.pct, { size: 92, stroke: 8, label: UI.pct(st.pct), sub: 'hari ini' })}
            <div class="stack" style="flex:1;gap:8px">
              <div class="row between"><span class="muted small">Tugas wajib</span><b class="num">${st.done}/${st.total}</b></div>
              <div class="row between"><span class="muted small">XP hari ini</span><b class="num accent">+${fmt(st.xp)}</b></div>
              <div class="row between"><span class="muted small">Streak</span><b class="num">${icon('flame', 15, 'warn')} ${streak} hari</b></div>
              <div class="row between"><span class="muted small">Opsional</span><b class="num">${st.optionalDone}/${st.optionalTotal}</b></div>
            </div>
          </div>
          ${st.rest ? `<div class="banner" style="margin:12px 0 0">${icon('moon', 16)}<span>Hari istirahat — streak tetap aman.</span><span class="spacer"></span><button class="btn sm ghost" data-act="toggleRest">Batalkan</button></div>`
          : `<p class="muted small" style="margin-top:12px">${remaining.length ? `Sisa <b>${remaining.length}</b> tugas wajib. ${st.pct * 100 >= s.settings.successThreshold ? 'Target harian sudah tercapai 🎯' : `Capai ${s.settings.successThreshold}% untuk menjaga streak.`}` : st.total ? 'Semua tugas wajib selesai. Luar biasa!' : 'Tidak ada tugas wajib hari ini.'}</p>
             <button class="btn sm ghost" style="margin-top:6px;padding-left:0" data-act="toggleRest">${icon('moon', 15)}Jadikan hari istirahat</button>`}
        </div>
      </div>

      <div class="section-title">${icon('target', 14)}3 Misi Prioritas<span class="spacer"></span><span class="tiny hide-sm" style="text-transform:none;letter-spacing:0">Ketuk nama tugas → "Jadikan prioritas"</span></div>
      <div class="card">${pri.length ? pri.map((h, i) => {
        const done = (C.statusOf(s, k, h.id) || {}).s === 'done';
        return `<div class="priority ${done ? 'done' : ''}"><span class="num-badge">${done ? icon('check', 14) : i + 1}</span><span class="t-name" data-act="habitMenu" data-id="${h.id}" data-date="${k}">${esc(h.name)}</span><span class="xp accent small"><b>+${h.xp}</b></span>
          <button class="btn sm ${done ? 'ghost' : 'primary'}" data-act="toggleHabit" data-id="${h.id}" data-date="${k}">${done ? 'Batal' : 'Selesai'}</button></div>`;
      }).join('') : '<div class="empty small">Tidak ada tugas wajib hari ini.</div>'}</div>

      <div class="section-title">${icon('grid', 14)}Akses Cepat</div>
      <div class="chips">
        <a class="chip" href="#/habits">${icon('check', 16)}Checklist</a>
        <a class="chip" href="#/nutrition">${icon('leaf', 16)}Nutrisi</a>
        <a class="chip" href="#/fitness">${icon('dumbbell', 16)}Workout</a>
        <a class="chip" href="#/study">${icon('book', 16)}Belajar</a>
        <a class="chip" href="#/copywriting">${icon('pen', 16)}Copywriting</a>
        <a class="chip" href="#/private">${icon('shield', 16)}Ruang Privat</a>
        <a class="chip" href="#/calendar">${icon('calendar', 16)}Kalender</a>
        <a class="chip" href="#/supplements">${icon('pill', 16)}Suplemen</a>
      </div>

      <div class="kpis" style="margin-top:14px">
        <a class="kpi" href="#/study"><small>Belajar hari ini</small><b>${studyMin}</b><span>/ ${C.studyTarget(s)} mnt</span>${UI.bar(studyMin / C.studyTarget(s), { cls: 'thin' })}</a>
        <a class="kpi" href="#/copywriting"><small>Copywriting</small><b>${copyMin}</b><span>/ ${s.settings.copyTarget} mnt</span>${UI.bar(copyMin / s.settings.copyTarget, { cls: 'thin' })}</a>
        <a class="kpi" href="#/fitness"><small>Gym minggu ini</small><b>${gymWeek}</b><span>/ ${s.settings.gymPerWeek} sesi</span>${UI.bar(gymWeek / s.settings.gymPerWeek, { cls: 'thin' })}</a>
        <a class="kpi" href="#/nutrition"><small>Kalori</small><b>${fmt(nd.totals.kcal)}</b><span>/ ${fmt(s.nutrition.targets.kcal)}</span>${UI.bar(nd.totals.kcal / s.nutrition.targets.kcal, { cls: 'thin' })}</a>
      </div>

      <div class="section-title">${icon('list', 14)}Misi Hari Ini<span class="spacer"></span>
        <button class="btn sm ghost" data-act="toggleOptional">${showOpt ? 'Sembunyikan opsional' : 'Tampilkan opsional'}</button></div>
      <div class="stack">${periods || '<div class="card empty">Belum ada habit terjadwal hari ini. <a href="#/habits">Tambah habit</a></div>'}</div>

      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="card-head">${icon('calendar', 18)}<h3>Agenda hari ini</h3><a class="btn sm ghost" href="#/calendar">Kalender</a></div>
          ${items.length ? items.map(i => `<div class="ev-item k-${i.kind} ${i.done ? 'done' : ''}"><span class="t">${i.start || '—'}</span><span>${esc(i.title)}</span></div>`).join('') : '<div class="empty small">Tidak ada agenda.</div>'}
          ${exam ? `<div class="note-box" style="margin-top:8px">${icon('target', 14)} <b>${esc(exam.title)}</b> — ${C.daysBetween(k, exam.date) === 0 ? 'hari ini!' : C.daysBetween(k, exam.date) + ' hari lagi'}</div>` : ''}
        </div>
        <div class="card"><div class="card-head">${icon('trophy', 18)}<h3>Achievement berikutnya</h3><a class="btn sm ghost" href="#/achievements">Galeri</a></div>
          ${next ? `<div class="next-up">${UI.badge(next.a, false, 56)}<div style="flex:1"><b>${esc(next.a.name)}</b><p class="muted small">${esc(next.a.desc)}</p>${UI.bar(next.p, { cls: 'thin' })}<p class="tiny muted" style="margin-top:4px">${fmt(Math.min(next.cur, next.tgt))} / ${fmt(next.tgt)} · +${next.a.xp} XP</p></div></div>` : '<div class="empty small">Semua achievement sudah terbuka. Legendaris!</div>'}
        </div>
      </div>`;
    }
  };

  Object.assign(App.actions, {
    toggleOptional: () => { App._showOptional = App._showOptional === false; App.render(); },
    toggleRest: async () => {
      const s = App.S(), k = C.dateKey();
      if (s.restDays[k]) return App.commit(st => { delete st.restDays[k]; }, { quiet: true });
      const used = C.restDaysInWeek(s, k);
      if (used >= s.settings.maxRestPerWeek) return UI.toast(`Kuota hari istirahat minggu ini sudah habis (${s.settings.maxRestPerWeek}). Ubah di Pengaturan.`, 'error');
      if (!(await UI.confirmDialog(`Hari istirahat tidak memutus streak dan tidak dihitung dalam persentase. Sisa kuota minggu ini: ${s.settings.maxRestPerWeek - used}.`, { title: 'Jadikan hari istirahat?', ok: 'Ya, istirahat' }))) return;
      App.commit(st => { st.restDays[k] = true; }, { quiet: true });
      UI.toast('Istirahat juga bagian dari progres.', 'good');
    }
  });
})();
