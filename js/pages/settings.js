/* LIFE OS — Settings, notifications, backup & restore */
(function () {
  const C = LifeCore, UI = window.UI, Store = LifeStore, { esc, icon, fmt } = UI;
  const TABS = [['profile', 'Profil'], ['schedule', 'Jadwal'], ['targets', 'Target'], ['game', 'Gamifikasi'], ['notif', 'Notifikasi'], ['look', 'Tampilan'], ['data', 'Data & Backup']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/settings/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  const F = UI.field;

  const profile = s => `<form class="card" data-submit="setProfile"><div class="form-grid">
      ${F({ name: 'name', label: 'Nama', value: s.profile.name, required: true })}${F({ name: 'role', label: 'Peran / status', value: s.profile.role })}
      ${F({ name: 'wake', label: 'Jam bangun', type: 'time', half: true, value: s.profile.wake })}${F({ name: 'bed', label: 'Jam tidur', type: 'time', half: true, value: s.profile.bed })}
    </div><p class="tiny muted" style="margin:10px 0">Jam bangun & tidur juga memperbarui jam habit "Bangun tepat waktu", "Tidur sesuai jadwal" dan pengingat rutinitas pagi.</p><button class="btn primary block">Simpan profil</button></form>`;

  const schedule = s => `<form class="card" data-submit="setUni"><div class="card-head">${icon('school', 18)}<h3>Jadwal kuliah</h3></div><div class="form-grid">
      ${F({ name: 'uniDays', label: 'Hari kuliah', type: 'days', value: s.schedule.uniDays })}
      ${F({ name: 'uniStart', label: 'Mulai', type: 'time', half: true, value: s.schedule.uniStart })}${F({ name: 'uniEnd', label: 'Selesai', type: 'time', half: true, value: s.schedule.uniEnd })}
    </div><button class="btn primary block" style="margin-top:12px">Simpan jadwal kuliah</button></form>
    <div class="section-title">Blok jadwal mingguan<span class="spacer"></span><button class="btn sm" data-act="blockEdit">${icon('plus', 14)}Blok</button></div>
    <div class="card tight"><div class="list">${s.schedule.blocks.slice().sort((a, b) => a.start.localeCompare(b.start)).map(b => `<div class="li" data-act="blockEdit" data-id="${b.id}" style="cursor:pointer"><span class="mono small muted">${b.start}–${b.end}</span><div class="li-main"><div class="li-title">${esc(b.label)}</div><div class="li-sub">${b.days.length === 7 ? 'Setiap hari' : b.days.map(d => C.DAY_SHORT[d]).join(', ')}</div></div>${icon('edit', 16, 'muted')}</div>`).join('')}</div></div>
    <p class="note-box" style="margin-top:12px">Blok ini adalah saran struktur hari (bukan aturan kaku). Jadwal gym diatur di Fitness → Program dan divalidasi agar tidak bentrok dengan jam kuliah.</p>`;

  const targets = s => `<form class="card" data-submit="setTargets"><div class="form-grid">
      ${F({ name: 'studyTarget', label: 'Belajar harian (menit)', type: 'number', half: true, min: 5, max: 600, value: s.settings.studyTarget })}${F({ name: 'studyTargetExam', label: 'Belajar saat mode ujian', type: 'number', half: true, min: 5, max: 720, value: s.settings.studyTargetExam })}
      ${F({ name: 'copyTarget', label: 'Copywriting harian (menit)', type: 'number', half: true, min: 5, max: 300, value: s.settings.copyTarget })}${F({ name: 'gymPerWeek', label: 'Gym per minggu', type: 'number', half: true, min: 1, max: 7, value: s.settings.gymPerWeek })}
      ${F({ name: 'successThreshold', label: 'Ambang hari sukses (%)', type: 'number', half: true, min: 30, max: 100, value: s.settings.successThreshold, hint: 'Hari dihitung untuk streak jika ≥ ambang ini.' })}${F({ name: 'maxRestPerWeek', label: 'Hari istirahat / minggu', type: 'number', half: true, min: 0, max: 4, value: s.settings.maxRestPerWeek })}
      ${F({ name: 'focus', label: 'Pomodoro fokus', type: 'number', half: true, min: 5, max: 120, value: s.settings.pomodoro.focus })}${F({ name: 'short', label: 'Istirahat pendek', type: 'number', half: true, min: 1, max: 30, value: s.settings.pomodoro.short })}
      ${F({ name: 'focus2', label: 'Deep work fokus', type: 'number', half: true, min: 10, max: 180, value: s.settings.pomodoro.focus2 })}${F({ name: 'long', label: 'Istirahat panjang', type: 'number', half: true, min: 1, max: 60, value: s.settings.pomodoro.long })}
    </div><button class="btn primary block" style="margin-top:12px">Simpan target</button></form>
    <p class="note-box" style="margin-top:12px">Target nutrisi ada di Nutrisi → Target. Target tidak pernah diubah otomatis tanpa persetujuanmu.</p>`;

  function game(s) {
    const prev = [1, 5, 10, 20, 35, 50, 75, 99].map(l => `<tr><td>Lv ${l} → ${l + 1}</td><td class="r">${fmt(C.xpRequired(l, s.settings.levelBase, s.settings.levelExp))}</td><td class="r">${fmt(C.cumulativeXP(l + 1, s.settings.levelBase, s.settings.levelExp))}</td><td>${C.rankFor(l + 1).name}</td></tr>`).join('');
    return `<form class="card" data-submit="setLevel"><div class="card-head">${icon('bolt', 18)}<h3>Kurva level</h3></div>
      <p class="small muted" style="margin-bottom:10px">XP untuk naik dari level L = <span class="kbd">basis × L^eksponen</span>. Mengubah kurva menghitung ulang level dari total XP (XP tidak hilang).</p>
      <div class="form-grid">${F({ name: 'levelBase', label: 'Basis', type: 'number', half: true, min: 10, max: 2000, value: s.settings.levelBase })}${F({ name: 'levelExp', label: 'Eksponen', type: 'number', half: true, min: 1, max: 2.5, step: 0.05, value: s.settings.levelExp })}
      ${F({ name: 'bonusMorning', label: 'Bonus rutinitas pagi lengkap', type: 'number', half: true, min: 0, value: s.settings.bonusMorning })}${F({ name: 'bonusNight', label: 'Bonus rutinitas malam lengkap', type: 'number', half: true, min: 0, value: s.settings.bonusNight })}</div>
      <div class="scroll-x" style="margin-top:12px"><table class="tbl"><thead><tr><th>Level</th><th class="r">XP naik</th><th class="r">Kumulatif</th><th>Rank</th></tr></thead><tbody>${prev}</tbody></table></div>
      <button class="btn primary block" style="margin-top:12px">Simpan kurva & bonus</button></form>
      <div class="section-title">XP per habit</div>
      <form class="card tight" data-submit="setHabitXp"><div class="list">${s.habits.filter(h => h.active).map(h => `<div class="li"><div class="li-main"><div class="li-title">${esc(h.name)}</div><div class="li-sub">${C.DIFFICULTY[h.difficulty]}</div></div><input type="number" name="xp_${h.id}" value="${h.xp}" min="1" max="2000" style="width:90px"></div>`).join('')}</div><button class="btn primary block" style="margin-top:10px">Simpan nilai XP</button></form>
      <div class="card" style="margin-top:14px">
        <label class="switch"><span class="sw-text"><b>Achievement</b><small>Buka badge & XP bonus otomatis.</small></span><input type="checkbox" class="toggle" data-chg="setFlag" data-k="achievementsEnabled" ${s.settings.achievementsEnabled ? 'checked' : ''}></label>
        <label class="switch"><span class="sw-text"><b>Reward Shop</b><small>Opsional — tukar XP dengan reward nyata.</small></span><input type="checkbox" class="toggle" data-chg="setFlag" data-k="rewardsEnabled" ${s.settings.rewardsEnabled ? 'checked' : ''}></label>
      </div>`;
  }

  function notif(s) {
    const sp = root.Notify ? Notify.support() : {};
    const status = (ok, txt) => `<span class="pill ${ok ? 'good' : ok === null ? '' : 'warn'}">${txt}</span>`;
    const perm = sp.permission;
    return `<div class="card"><div class="card-head">${icon('bell', 18)}<h3>Status notifikasi</h3></div>
      <div class="list small">
        <div class="li"><div class="li-main">Notification API</div>${status(sp.notification, sp.notification ? 'Didukung' : 'Tidak didukung')}</div>
        <div class="li"><div class="li-main">Izin</div>${status(perm === 'granted', perm === 'granted' ? 'Diizinkan' : perm === 'denied' ? 'Diblokir' : perm === 'default' ? 'Belum diminta' : 'N/A')}</div>
        <div class="li"><div class="li-main">Service worker${sp.swError ? `<div class="li-sub">${esc(sp.swError)}</div>` : ''}</div>${status(sp.swActive, sp.swActive ? 'Aktif' : 'Tidak aktif')}</div>
        <div class="li"><div class="li-main">Terpasang sebagai aplikasi (PWA)</div>${status(sp.standalone || null, sp.standalone ? 'Ya' : 'Belum')}</div>
        <div class="li"><div class="li-main">Notifikasi terjadwal lokal (Notification Triggers)<div class="li-sub">API eksperimental — umumnya belum tersedia di Chrome stabil.</div></div>${status(sp.triggers || null, sp.triggers ? 'Tersedia' : 'Tidak tersedia')}</div>
        <div class="li"><div class="li-main">Web Push (butuh server)</div>${status(sp.push || null, sp.push ? 'Didukung browser' : 'Tidak didukung')}</div>
      </div>
      <div class="row wrap" style="margin-top:12px">
        ${perm !== 'granted' ? `<button class="btn primary" data-act="nfPerm">${icon('bell', 16)}Izinkan notifikasi</button>` : `<label class="switch" style="border:0;padding:0;flex:1"><span class="sw-text"><b>Notifikasi sistem aktif</b></span><input type="checkbox" class="toggle" data-chg="nfEnabled" ${s.settings.notif.enabled ? 'checked' : ''}></label>`}
        <button class="btn" data-act="nfTest">Kirim notifikasi uji</button>
        ${Notify && Notify.installPrompt ? `<button class="btn" data-act="pwaInstall">${icon('download', 16)}Pasang aplikasi</button>` : ''}
      </div></div>
    <div class="card" style="margin-top:14px"><div class="card-head">${icon('info', 18)}<h3>Cara kerja (jujur)</h3></div>
      <ul class="small" style="margin:0;padding-left:18px;color:var(--text2);display:grid;gap:6px">
        <li><b>Saat LIFE OS terbuka</b> (atau masih di background dan belum dibekukan browser): pengingat muncul sebagai notifikasi sistem asli.</li>
        <li><b>Saat aplikasi/browser ditutup penuh</b>: halaman web tidak bisa menjalankan timer. Pengingat <b>tidak</b> akan muncul tanpa server push.</li>
        <li><b>Solusi tanpa server (disarankan):</b> ekspor pengingat ke kalender HP (.ics) — Google Calendar/Kalender Android akan membunyikan alarm walau LIFE OS tertutup.</li>
        <li><b>Solusi dengan server:</b> Web Push (lihat folder <span class="kbd">push-server/</span> di source code). Gratis untuk di-host sendiri, tapi butuh server yang selalu menyala.</li>
        <li><b>Fallback dalam aplikasi:</b> pengingat yang terlewat ditampilkan sebagai banner di Dashboard saat kamu membuka aplikasi.</li>
      </ul>
      <div class="row wrap" style="margin-top:12px"><button class="btn primary" data-act="icsExport">${icon('download', 16)}Ekspor pengingat ke kalender (.ics)</button><button class="btn ghost" data-act="pushSetup">Setup Web Push (lanjutan)</button></div></div>
    <form class="card" style="margin-top:14px" data-submit="nfQuiet"><div class="card-head">${icon('moon', 18)}<h3>Jam tenang & fallback</h3></div><div class="form-grid">
      ${F({ name: 'quietStart', label: 'Jam tenang mulai', type: 'time', half: true, value: s.settings.notif.quietStart })}${F({ name: 'quietEnd', label: 'Jam tenang selesai', type: 'time', half: true, value: s.settings.notif.quietEnd })}
      ${F({ name: 'inApp', label: 'Tampilkan pengingat dalam aplikasi (toast & banner pengingat terlewat)', type: 'checkbox', value: s.settings.notif.inApp })}</div><button class="btn block" style="margin-top:10px">Simpan</button></form>
    <div class="section-title">Daftar pengingat<span class="spacer"></span><button class="btn sm" data-act="remEdit">${icon('plus', 14)}Pengingat</button></div>
    <div class="card tight"><div class="list">${s.reminders.map(r => `<div class="li"><div class="li-main" data-act="remEdit" data-id="${r.id}" style="cursor:pointer"><div class="li-title"><span class="mono">${r.time}</span> · ${esc(r.label)}</div><div class="li-sub">${r.days.length === 7 ? 'Setiap hari' : r.days.map(d => C.DAY_SHORT[d]).join(', ')}${r.type === 'private' ? ' · teks generik' : ' · ' + esc(r.body)}</div></div><input type="checkbox" class="toggle" data-chg="remToggle" data-id="${r.id}" ${r.enabled ? 'checked' : ''} aria-label="Aktif"></div>`).join('')}</div></div>`;
  }

  const look = s => `<div class="card"><div class="card-head">${icon('sun', 18)}<h3>Tema</h3></div><div class="seg">${[['dark', 'Gelap'], ['light', 'Terang'], ['system', 'Ikuti sistem']].map(([v, l]) => `<button class="${s.settings.theme === v ? 'on' : ''}" data-act="setTheme" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="card" style="margin-top:14px"><div class="card-head">${icon('info', 18)}<h3>Bahasa</h3></div><div class="seg"><button class="on">Bahasa Indonesia</button><button disabled title="Belum tersedia">English (segera)</button></div>
      <p class="tiny muted" style="margin-top:8px">Antarmuka saat ini Bahasa Indonesia dengan istilah umum (XP, Level, Streak, Achievement). Terjemahan Inggris belum dibuat.</p></div>`;

  function data(s) {
    const snaps = Store.snapshots();
    return `<div class="card"><div class="card-head">${icon('download', 18)}<h3>Backup & restore</h3></div>
      <p class="small muted" style="margin-bottom:12px">Data tersimpan di browser ini (localStorage) — tidak dikirim ke server mana pun. Ekspor backup rutin, terutama sebelum ganti HP / hapus data browser.${s.settings.lastBackup ? ` Backup terakhir: <b>${new Date(s.settings.lastBackup).toLocaleString('id-ID')}</b>.` : ' <b class="warn">Belum pernah backup.</b>'}</p>
      <div class="row wrap"><button class="btn primary" data-act="dataExport">${icon('download', 16)}Ekspor backup (.json)</button><button class="btn" data-act="dataImport">${icon('upload', 16)}Impor / restore</button><button class="btn ghost" data-act="dataCsv">Ekspor riwayat habit (.csv)</button></div>
      <p class="tiny muted" style="margin-top:10px">Ukuran data: ${(Store.usageBytes() / 1024).toFixed(1)} KB</p></div>
    <div class="card" style="margin-top:14px"><div class="card-head">${icon('refresh', 18)}<h3>Snapshot otomatis</h3></div><p class="small muted" style="margin-bottom:8px">Satu snapshot per hari (5 terakhir) disimpan otomatis di browser ini.</p>
      <div class="list">${snaps.map(x => `<div class="li"><div class="li-main"><div class="li-title">${C.formatDate(x.date, { weekday: true })}</div><div class="li-sub">${new Date(x.at).toLocaleTimeString('id-ID')} · ${(x.size / 1024).toFixed(0)} KB</div></div><button class="btn sm" data-act="snapRestore" data-d="${x.date}">Pulihkan</button></div>`).join('') || '<div class="empty small">Belum ada snapshot.</div>'}</div></div>
    <div class="card" style="margin-top:14px;border-color:color-mix(in srgb,var(--bad) 35%,transparent)"><div class="card-head">${icon('trash', 18)}<h3>Zona berbahaya</h3></div>
      <div class="row wrap"><button class="btn danger" data-act="resetPrivate">Reset data Ruang Privat</button><button class="btn danger" data-act="resetAll">Reset semua data</button></div>
      <p class="tiny muted" style="margin-top:8px">Sebelum reset, salinan otomatis disimpan sekali di browser. Tetap ekspor backup terlebih dahulu.</p></div>`;
  }

  const root = window;
  App.pages.settings = {
    title: 'Pengaturan',
    render(p) { const s = App.S(), t = p[0] || 'profile'; return tabs(t) + ({ profile, schedule, targets, game, notif, look, data }[t] || profile)(s); }
  };

  const num = (f, n) => +f[n].value;
  Object.assign(App.actions, {
    setProfile: (f) => { App.commit(s => {
      Object.assign(s.profile, { name: f.name.value.trim() || 'Kamu', role: f.role.value.trim(), wake: f.wake.value, bed: f.bed.value });
      const w = s.habits.find(h => h.id === 'h_wake'); if (w && f.wake.value) w.time = f.wake.value;
      const b = s.habits.find(h => h.id === 'h_sleep'); if (b && f.bed.value) b.time = f.bed.value;
      const r = s.reminders.find(r => r.id === 'r_morning'); if (r && f.wake.value) r.time = f.wake.value;
    }, { quiet: true }); UI.toast('Profil disimpan', 'good'); },
    setUni: (f) => {
      const days = UI.$$('[data-days=uniDays] input:checked', f).map(i => +i.value);
      if (!f.uniStart.value || !f.uniEnd.value || f.uniEnd.value <= f.uniStart.value) return UI.toast('Jam kuliah tidak valid', 'error');
      const s = App.S();
      const tmp = { schedule: { uniDays: days, uniStart: f.uniStart.value, uniEnd: f.uniEnd.value } };
      const clash = s.settings.gymDays.filter(d => C.overlapsUniversity(tmp, d, s.settings.gymTime, s.settings.gymDuration));
      App.commit(st => { Object.assign(st.schedule, tmp.schedule); const h = st.habits.find(h => h.id === 'h_uni'); if (h) { h.days = days.slice(); h.time = f.uniStart.value; } const r = st.reminders.find(r => r.id === 'r_uni'); if (r) { r.days = days.slice(); r.time = C.fromMin(C.toMin(f.uniStart.value) - 20); r.body = 'Kuliah mulai ' + f.uniStart.value + '. Siapkan perlengkapan.'; } }, { quiet: true });
      UI.toast(clash.length ? 'Disimpan. Perhatian: jadwal gym kini bentrok dengan kuliah — ubah di Fitness → Program.' : 'Jadwal kuliah disimpan', clash.length ? 'error' : 'good', clash.length ? 5000 : 2600);
    },
    blockEdit: async (el) => {
      const s = App.S(); const b = el.dataset.id ? s.schedule.blocks.find(x => x.id === el.dataset.id) : null;
      const v = await UI.formModal({ title: b ? 'Edit blok' : 'Blok baru', fields: [{ name: 'label', label: 'Aktivitas', value: b ? b.label : '', required: true }, { name: 'start', label: 'Mulai', type: 'time', half: true, value: b ? b.start : '', required: true }, { name: 'end', label: 'Selesai', type: 'time', half: true, value: b ? b.end : '', required: true }, { name: 'days', label: 'Hari', type: 'days', value: b ? b.days : C.ALL }],
        extraActions: b ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [], validate: v => v.end && v.start && v.end <= v.start ? 'Jam selesai harus setelah mulai' : null });
      if (!v) return;
      App.commit(st => { if (v.__action === 'del') st.schedule.blocks = st.schedule.blocks.filter(x => x.id !== b.id); else if (b) Object.assign(st.schedule.blocks.find(x => x.id === b.id), v); else st.schedule.blocks.push(Object.assign({ id: C.uid('b') }, v)); }, { quiet: true });
    },
    setTargets: (f) => { App.commit(s => {
      Object.assign(s.settings, { studyTarget: num(f, 'studyTarget') || 60, studyTargetExam: num(f, 'studyTargetExam') || 120, copyTarget: num(f, 'copyTarget') || 30, gymPerWeek: num(f, 'gymPerWeek') || 3, successThreshold: Math.min(100, Math.max(30, num(f, 'successThreshold') || 70)), maxRestPerWeek: Math.max(0, num(f, 'maxRestPerWeek')) });
      Object.assign(s.settings.pomodoro, { focus: num(f, 'focus') || 25, short: num(f, 'short') || 5, focus2: num(f, 'focus2') || 50, long: num(f, 'long') || 10 });
    }, { quiet: true }); UI.toast('Target disimpan', 'good'); },
    setLevel: (f) => { App.commit(s => { s.settings.levelBase = Math.max(10, num(f, 'levelBase')); s.settings.levelExp = Math.min(2.5, Math.max(1, num(f, 'levelExp'))); s.settings.bonusMorning = Math.max(0, num(f, 'bonusMorning')); s.settings.bonusNight = Math.max(0, num(f, 'bonusNight')); }, { quiet: true }); UI.toast('Kurva level disimpan', 'good'); },
    setHabitXp: (f) => { App.commit(s => { s.habits.forEach(h => { const el = f['xp_' + h.id]; if (el && +el.value > 0) h.xp = Math.round(+el.value); }); }, { quiet: true }); UI.toast('Nilai XP disimpan (berlaku untuk penyelesaian berikutnya)', 'good'); },
    setFlag: (el) => App.commit(s => { s.settings[el.dataset.k] = el.checked; }, { quiet: true }),
    setTheme: (el) => App.commit(s => { s.settings.theme = el.dataset.v; App.applyTheme(); }, { quiet: true }),
    nfPerm: async () => { await Notify.requestPermission(); App.render(); },
    nfEnabled: (el) => App.commit(s => { s.settings.notif.enabled = el.checked; }, { quiet: true }),
    nfTest: async () => { const ch = await Notify.show('LIFE OS', 'Notifikasi uji berhasil. Pengingatmu akan tampil seperti ini.', 'test', { hash: '#/settings/notif' }); UI.toast(ch === 'system' ? 'Notifikasi sistem dikirim' : 'Ditampilkan dalam aplikasi (izin notifikasi belum aktif)', ch === 'system' ? 'good' : 'info', 3500); },
    pwaInstall: async () => { const p = Notify.installPrompt; if (!p) return; p.prompt(); await p.userChoice; Notify.installPrompt = null; App.render(); },
    nfQuiet: (f) => { App.commit(s => { Object.assign(s.settings.notif, { quietStart: f.quietStart.value, quietEnd: f.quietEnd.value, inApp: f.inApp.checked }); }, { quiet: true }); Notify.planNext(); UI.toast('Disimpan', 'good'); },
    remToggle: (el) => { App.commit(s => { const r = s.reminders.find(x => x.id === el.dataset.id); if (r) r.enabled = el.checked; }, { quiet: true }); Notify.planNext(); },
    remEdit: async (el) => {
      const s = App.S(); const r = el.dataset.id ? s.reminders.find(x => x.id === el.dataset.id) : null;
      const priv = r && r.type === 'private';
      const v = await UI.formModal({ title: r ? 'Edit pengingat' : 'Pengingat baru', fields: [
        { name: 'label', label: 'Judul', value: r ? r.label : '', required: true }, { name: 'time', label: 'Jam', type: 'time', half: true, value: r ? r.time : '', required: true },
        { name: 'type', label: 'Jenis', type: 'select', half: true, value: r ? r.type : 'routine', options: [['routine', 'Rutinitas'], ['university', 'Kuliah'], ['study', 'Belajar'], ['copy', 'Copywriting'], ['gym', 'Gym'], ['supplement', 'Suplemen'], ['meal', 'Makan'], ['habit', 'Habit'], ['private', 'Privat (teks generik)']].map(([value, label]) => ({ value, label })) },
        { name: 'days', label: 'Hari', type: 'days', value: r ? r.days : C.ALL }, { name: 'body', label: 'Isi notifikasi', value: r ? r.body : '', hint: priv ? 'Untuk jenis Privat, isi selalu diganti teks generik.' : '' }],
        extraActions: r ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      App.commit(st => { if (v.__action === 'del') st.reminders = st.reminders.filter(x => x.id !== r.id); else if (r) Object.assign(st.reminders.find(x => x.id === r.id), v); else st.reminders.push(Object.assign({ id: C.uid('r'), enabled: true }, v)); }, { quiet: true });
      Notify.planNext();
    },
    icsExport: () => { UI.download('lifeos-pengingat.ics', C.buildICS(App.S()), 'text/calendar'); UI.modal({ title: 'Impor ke kalender HP', body: `<ol class="small" style="padding-left:18px;display:grid;gap:6px;margin:0"><li>Buka file <b>lifeos-pengingat.ics</b> yang baru diunduh (dari notifikasi unduhan / app Files).</li><li>Pilih <b>Google Calendar</b> (atau kalender bawaan) → simpan ke akun kalendermu.</li><li>Setiap pengingat aktif menjadi event berulang mingguan dengan alarm tepat waktu.</li><li>Jika mengubah pengingat di LIFE OS, hapus event lama di kalender lalu impor ulang.</li></ol><p class="tiny muted" style="margin-top:10px">Di Google Calendar web: Setelan → Impor & ekspor → Impor. Pengingat privat diekspor dengan judul generik.</p>` }); },
    pushSetup: () => {
      UI.modal({ title: 'Web Push (opsional, lanjutan)', wide: true, body: `<p class="small" style="margin-bottom:10px">Agar notifikasi tetap datang saat aplikasi tertutup tanpa memakai kalender, kamu perlu server kecil yang mengirim push sesuai jadwal. Contoh server Node.js gratis ada di folder <span class="kbd">push-server/</span> (lihat README di sana).</p>
        <ol class="small" style="padding-left:18px;display:grid;gap:6px;margin:0 0 12px"><li>Jalankan <span class="kbd">npx web-push generate-vapid-keys</span> di komputer, simpan public & private key di server.</li><li>Tempel <b>public key</b> di bawah → tekan Subscribe → salin JSON subscription ke server.</li><li>Server mengirim push sesuai jadwal pengingat (cron). Service worker LIFE OS sudah menangani event <span class="kbd">push</span>.</li></ol>
        <div class="form-grid">${F({ name: 'vapid', label: 'VAPID public key', placeholder: 'B…' })}</div><pre id="subOut" class="note-box" style="white-space:pre-wrap;word-break:break-all;margin-top:10px" hidden></pre>
        <p class="tiny muted" style="margin-top:8px">Jangan pernah menaruh VAPID <b>private</b> key di aplikasi ini.</p>`,
        actions: [{ label: 'Tutup', cls: 'ghost' }, { label: 'Subscribe', cls: 'primary', onClick: (w) => { const key = UI.$('[name=vapid]', w).value.trim(); if (!key) { UI.toast('Isi public key', 'error'); return false; }
          Notify.subscribePush(key).then(sub => { const o = UI.$('#subOut', w); o.hidden = false; const rem = App.S().reminders.filter(r => r.enabled).map(r => ({ id: r.id, time: r.time, days: r.days, title: r.type === 'private' ? 'LIFE OS' : r.label, body: r.type === 'private' ? 'Waktunya check-in harian singkat.' : r.body })); o.textContent = JSON.stringify({ subscription: sub, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, quiet: { start: App.S().settings.notif.quietStart, end: App.S().settings.notif.quietEnd }, reminders: rem }, null, 2); UI.toast('Subscription dibuat — salin JSON ke server', 'good'); }).catch(e => UI.toast(e.message, 'error', 4000)); return false; } }] });
    },
    dataExport: () => { const s = App.S(); s.settings.lastBackup = new Date().toISOString(); Store.save(); UI.download('lifeos-backup-' + C.dateKey() + '.json', Store.exportJSON()); UI.toast('Backup diunduh', 'good'); App.render(); },
    dataImport: async () => {
      const text = await UI.pickFile(); if (!text) return;
      if (!(await UI.confirmDialog('Impor akan MENGGANTI semua data saat ini dengan isi backup. Salinan data saat ini disimpan sekali di browser sebagai pengaman. Lanjutkan?', { title: 'Restore backup', ok: 'Restore', danger: true }))) return;
      try { Store.importJSON(text); App.applyTheme(); App.render(); UI.toast('Data berhasil dipulihkan', 'good'); } catch (e) { UI.toast('Gagal impor: ' + e.message, 'error', 4500); }
    },
    dataCsv: () => {
      const s = App.S(); const rows = [['tanggal', 'habit', 'status', 'waktu', 'alasan', 'xp']];
      Object.keys(s.logs).sort().forEach(k => Object.entries(s.logs[k]).forEach(([id, l]) => { const h = s.habits.find(x => x.id === id); rows.push([k, h ? h.name : id, l.s === 'done' ? 'selesai' : 'dilewati', l.at || '', l.reason || '', l.s === 'done' && h ? h.xp : 0]); }));
      UI.download('lifeos-riwayat-habit.csv', rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n'), 'text/csv');
    },
    snapRestore: async (el) => { if (!(await UI.confirmDialog('Pulihkan data ke snapshot ' + el.dataset.d + '? Perubahan setelahnya akan hilang.', { danger: true, ok: 'Pulihkan' }))) return; try { Store.restoreSnapshot(el.dataset.d); App.applyTheme(); App.render(); UI.toast('Snapshot dipulihkan', 'good'); } catch (e) { UI.toast(e.message, 'error'); } },
    resetPrivate: async () => { if (!(await UI.confirmDialog('Hapus semua data Ruang Privat (streak, check-in, catatan, PIN)? XP yang sudah diperoleh tetap ada.', { danger: true, ok: 'Hapus data privat' }))) return; App.commit(s => { s.selfControl = { active: false, activatedAt: '', streakStart: '', longest: 0, checkins: {}, notes: [], setbacks: [] }; s.settings.private.pinHash = ''; }, { quiet: true }); App.privateUnlocked = false; UI.toast('Data privat dihapus', 'good'); },
    resetAll: async () => {
      if (!(await UI.confirmDialog('Reset SEMUA data LIFE OS ke awal? Riwayat, XP, level, dan pengaturan akan hilang dari aplikasi.', { danger: true, ok: 'Lanjut' }))) return;
      const v = await UI.formModal({ title: 'Konfirmasi terakhir', fields: [{ name: 'c', label: 'Ketik RESET untuk melanjutkan', required: true }], submitLabel: 'Reset semua', validate: v => v.c !== 'RESET' ? 'Ketik RESET (huruf kapital)' : null });
      if (!v) return; Store.resetAll(); App.applyTheme(); App.go('dashboard'); UI.toast('Data direset', 'good');
    }
  });
})();
