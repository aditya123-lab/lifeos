/* LIFE OS — Supplement tracker */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon } = UI;
  const remId = sp => sp.id === 's_creatine' ? 'r_creatine' : 'r_supp_' + sp.id;

  App.pages.supplements = {
    title: 'Suplemen',
    render() {
      const s = App.S(), k = C.dateKey();
      const start = C.addDays(k, -29) < s.createdAt ? s.createdAt : C.addDays(k, -29);
      const days = C.rangeKeys(start, k);
      return `<p class="muted small" style="margin-bottom:12px">Hanya suplemen yang kamu tambahkan sendiri yang dilacak. Untuk dosis, ikuti label produk atau saran tenaga kesehatan.</p>
        <div class="stack">${s.supplements.map(sp => {
          const taken = s.suppLogs[k] && s.suppLogs[k][sp.id];
          const hit = days.filter(d => s.suppLogs[d] && s.suppLogs[d][sp.id]).length;
          const missed = days.filter(d => d < k && !(s.suppLogs[d] && s.suppLogs[d][sp.id])).length;
          let run = 0; for (let d = taken ? k : C.addDays(k, -1); s.suppLogs[d] && s.suppLogs[d][sp.id]; d = C.addDays(d, -1)) run++;
          const rem = s.reminders.find(r => r.id === remId(sp));
          return `<div class="card ${sp.active ? '' : 'flat'}" style="${sp.active ? '' : 'opacity:.6'}">
            <div class="row"><div style="flex:1"><h3>${esc(sp.name)}</h3><p class="muted small">${sp.dose ? esc(sp.dose) + ' · ' : ''}Pengingat ${rem && rem.enabled ? rem.time : 'mati'}${sp.active ? '' : ' · nonaktif'}</p></div>
              <button class="icon-btn" data-act="suppEdit" data-id="${sp.id}" aria-label="Edit">${icon('edit', 17)}</button></div>
            ${sp.active ? `<button class="btn block ${taken ? '' : 'primary'}" style="margin-top:12px" data-act="suppToggle" data-id="${sp.id}">${icon('check', 16)}${taken ? 'Sudah diminum ' + new Date(taken).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' · batalkan' : 'Tandai sudah diminum hari ini'}</button>` : ''}
            <div class="kpis" style="margin-top:12px;grid-template-columns:repeat(3,1fr)"><div class="kpi"><small>Streak</small><b>${run}</b><span>hari</span></div><div class="kpi"><small>30 hari</small><b>${hit}/${days.length}</b></div><div class="kpi"><small>Terlewat</small><b class="${missed ? 'warn' : ''}">${missed}</b><span>hari</span></div></div>
            <div style="margin-top:12px">${UI.heatmap(days.map(d => ({ v: s.suppLogs[d] && s.suppLogs[d][sp.id] ? 1 : 0, title: d })))}</div>
            ${missed ? `<p class="tiny muted" style="margin-top:8px">Terlewat: ${days.filter(d => d < k && !(s.suppLogs[d] && s.suppLogs[d][sp.id])).slice(-6).map(d => C.formatDate(d, { short: true, year: false })).join(', ')}${missed > 6 ? ', …' : ''}</p>` : ''}
          </div>`; }).join('') || '<div class="card empty">Belum ada suplemen.</div>'}</div>
        <button class="btn block" style="margin-top:14px" data-act="suppEdit">${icon('plus', 16)}Tambah suplemen</button>`;
    }
  };

  Object.assign(App.actions, {
    suppToggle: (el) => App.commit(s => {
      const k = C.dateKey(); s.suppLogs[k] = s.suppLogs[k] || {};
      if (s.suppLogs[k][el.dataset.id]) delete s.suppLogs[k][el.dataset.id]; else s.suppLogs[k][el.dataset.id] = new Date().toISOString();
    }),
    suppEdit: async (el) => {
      const s = App.S(); const sp = el.dataset.id ? s.supplements.find(x => x.id === el.dataset.id) : null;
      const rem = sp && s.reminders.find(r => r.id === remId(sp));
      const v = await UI.formModal({ title: sp ? 'Edit suplemen' : 'Suplemen baru', fields: [
        { name: 'name', label: 'Nama', value: sp ? sp.name : '', required: true }, { name: 'dose', label: 'Dosis / catatan (opsional)', value: sp ? sp.dose : '', placeholder: 'sesuai label produk' },
        { name: 'time', label: 'Jam pengingat', type: 'time', half: true, value: rem ? rem.time : '07:00' }, { name: 'remOn', label: 'Aktifkan pengingat', type: 'checkbox', value: rem ? rem.enabled : true },
        { name: 'active', label: 'Aktif dilacak', type: 'checkbox', value: sp ? sp.active : true },
        { name: 'habit', label: 'Buat habit harian yang selesai otomatis saat dicentang', type: 'checkbox', value: sp ? s.habits.some(h => h.link === 'supp:' + sp.id && h.active) : false }],
        extraActions: sp ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      if (v.__action === 'del') {
        const hasLog = Object.values(s.suppLogs).some(l => l[sp.id]);
        if (!(await UI.confirmDialog(hasLog ? 'Suplemen punya riwayat. Akan dinonaktifkan (riwayat tetap tersimpan).' : 'Hapus suplemen ini?', { danger: !hasLog, ok: hasLog ? 'Nonaktifkan' : 'Hapus' }))) return;
        return App.commit(st => { if (hasLog) st.supplements.find(x => x.id === sp.id).active = false; else st.supplements = st.supplements.filter(x => x.id !== sp.id); const r = st.reminders.find(r => r.id === remId(sp)); if (r) r.enabled = false; const h = st.habits.find(h => h.link === 'supp:' + sp.id && h.active); if (h) { h.active = false; h.archivedAt = C.dateKey(); } }, { quiet: true });
      }
      App.commit(st => {
        let x = sp ? st.supplements.find(y => y.id === sp.id) : null;
        if (x) Object.assign(x, { name: v.name, dose: v.dose, time: v.time, active: v.active });
        else { x = { id: C.uid('sp'), name: v.name, dose: v.dose, time: v.time, active: v.active }; st.supplements.push(x); }
        const rid = remId(x); let r = st.reminders.find(r => r.id === rid);
        if (!r) { r = { id: rid, label: x.name, days: C.ALL.slice(), type: 'supplement', body: 'Waktunya ' + x.name + '.' }; st.reminders.push(r); }
        Object.assign(r, { label: x.name, time: v.time, enabled: v.remOn && v.active, body: 'Waktunya ' + x.name + '.' });
        const h = st.habits.find(h => h.link === 'supp:' + x.id);
        if (v.habit && !h) st.habits.push({ id: C.uid('h'), name: 'Minum ' + x.name, cat: 'fitness', period: 'morning', xp: 20, difficulty: 1, mandatory: false, days: C.ALL.slice(), time: '', link: 'supp:' + x.id, active: true, createdAt: C.dateKey(), order: st.habits.length });
        else if (v.habit && h && !h.active) { h.active = true; delete h.archivedAt; }
        else if (!v.habit && h && h.active) { h.active = false; h.archivedAt = C.dateKey(); }
      }, { quiet: true });
    }
  });
})();
