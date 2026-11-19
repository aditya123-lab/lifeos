/* LIFE OS — Private Self-Control Challenge
 * Privacy design: nothing from this module appears on the dashboard, in achievement titles,
 * in notification previews, or in analytics (unless the user opts in). Optional PIN screen.
 * NOTE: the PIN is a privacy screen against casual viewing, not encryption — data lives in
 * this browser's localStorage. */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const GOALS = ['Tidak mengakses pornografi', 'Tidak melakukan masturbasi', 'Menghindari paparan pemicu seksual secara sengaja', 'Membangun kontrol diri yang lebih baik'];
  const PROMPTS = ['Apa pemicunya (waktu, tempat, perasaan, aplikasi)?', 'Apa yang sedang kurasakan sebelumnya — lelah, bosan, stres, kesepian?', 'Satu langkah konkret untuk mengurangi pemicu itu besok?', 'Apa yang sudah berjalan baik selama streak terakhir?'];

  async function hash(pin) {
    const data = 'lifeos-private:' + pin;
    try { if (crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); } } catch (_) {}
    let h = 2166136261; for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); } return 'fnv' + (h >>> 0).toString(16);
  }

  function intro() {
    return `<div class="card hero" style="max-width:640px"><div class="row" style="margin-bottom:10px">${icon('shield', 26, 'accent')}<h2>Self-Control Challenge</h2></div>
      <p class="muted">Ruang privat untuk membangun kontrol diri. Tidak tampil di dashboard, tidak muncul di judul achievement, dan notifikasinya selalu generik.</p>
      <div class="divider"></div><b class="small">Tujuan</b><ul class="small" style="margin:6px 0 14px;padding-left:18px;color:var(--text2)">${GOALS.map(g => `<li>${g}</li>`).join('')}</ul>
      <p class="small muted" style="margin-bottom:14px">Setback bukan kegagalan sebagai manusia — itu data untuk refleksi. Tidak ada hukuman, hanya mulai lagi.</p>
      <button class="btn primary" data-act="pvStart">Mulai tantangan hari ini</button></div>`;
  }

  function lockScreen() {
    return `<form class="card lock-screen" data-submit="pvUnlock">${icon('lock', 34)}<h3 style="margin:10px 0 4px">Ruang Privat terkunci</h3><p class="muted small" style="margin-bottom:14px">Masukkan PIN untuk membuka.</p>
      <input name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN" style="text-align:center;letter-spacing:.3em" required><button class="btn primary block" style="margin-top:10px">Buka</button>
      <p class="tiny muted" style="margin-top:14px">Lupa PIN? Hapus PIN dengan reset data privat di Pengaturan → Data (riwayat modul ini ikut terhapus).</p></form>`;
  }

  function main() {
    const s = App.S(), sc = s.selfControl, k = C.dateKey();
    const streak = C.privateStreak(s, k);
    const longest = Math.max(sc.longest || 0, streak);
    const next = C.PRIVATE_MILESTONES.find(m => m > streak);
    const prev = [...C.PRIVATE_MILESTONES].reverse().find(m => m <= streak) || 0;
    const ci = sc.checkins[k];
    const days = C.rangeKeys(C.addDays(k, -41) < sc.activatedAt ? sc.activatedAt : C.addDays(k, -41), k);
    return `
      <div class="grid two">
        <div class="card hero"><p class="muted small">Streak saat ini</p><div class="row" style="align-items:baseline;gap:8px;margin:4px 0 8px"><b style="font-size:2.6rem" class="num">${streak}</b><span class="muted">hari</span></div>
          ${next ? `${UI.bar((streak - prev) / (next - prev))}<p class="tiny muted" style="margin-top:6px">${next - streak} hari lagi menuju milestone ${next} hari</p>` : '<p class="small good">Semua milestone tercapai. Pertahankan!</p>'}
          <p class="small muted" style="margin-top:10px">Terpanjang: <b>${longest} hari</b> · Mulai: ${C.formatDate(sc.streakStart, { short: true })}</p></div>
        <div class="card"><h3 style="margin-bottom:10px">Check-in hari ini</h3>
          ${ci ? `<p class="small">${ci.s === 'clean' ? icon('check', 15, 'good') + ' Kamu sudah check-in: <b>hari ini aman</b>.' : icon('heart', 15, 'accent') + ' Setback dicatat. Hari ini adalah hari pertama yang baru.'}</p>` : `<p class="muted small" style="margin-bottom:12px">Jujur pada diri sendiri. Data ini hanya untukmu.</p>`}
          <div class="row wrap" style="margin-top:10px">${!ci || ci.s !== 'clean' ? `<button class="btn primary" data-act="pvClean" ${ci && ci.s === 'setback' ? 'disabled' : ''}>${icon('check', 16)}Hari ini aman</button>` : ''}<button class="btn" data-act="pvSetback">Catat setback</button><button class="btn ghost" data-act="pvNote">${icon('note', 16)}Refleksi</button></div></div>
      </div>
      <div class="section-title">Milestone</div>
      <div class="card"><div class="row wrap" style="gap:8px">${C.PRIVATE_MILESTONES.map(m => { const got = streak >= m; return `<span class="pill ${got ? 'good' : ''}" style="padding:7px 12px">${got ? icon('check', 13) : ''}${m} hari${s.settings.private.xpEnabled ? ` · ${C.PRIVATE_XP[m]} XP` : ''}</span>`; }).join('')}</div>
        <p class="tiny muted" style="margin-top:10px">XP milestone opsional (bisa dimatikan di bawah). Di riwayat XP hanya tercatat sebagai "Milestone privat".</p></div>
      <div class="section-title">Riwayat check-in (6 minggu)</div>
      <div class="card">${UI.heatmap(days.map(d => { const c = sc.checkins[d]; return { v: c ? (c.s === 'clean' ? 1 : .15) : null, title: d + (c ? ' · ' + (c.s === 'clean' ? 'aman' : 'setback') : '') }; }))}
        <div class="legend" style="margin-top:10px"><span><i style="background:var(--accent)"></i>Aman</span><span><i style="background:color-mix(in srgb,var(--accent) 15%,var(--track))"></i>Setback</span><span><i style="background:var(--track)"></i>Tidak check-in</span></div></div>
      <div class="section-title">Refleksi & setback</div>
      <div class="card tight"><div class="list">${sc.notes.concat(sc.setbacks.map(b => ({ date: b.date, text: b.note, setback: true, streak: b.streak }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map(n => `<div class="li"><div class="li-main"><div class="li-sub">${C.formatDate(n.date, { weekday: true })}${n.setback ? ` · setback setelah ${n.streak} hari` : ''}</div><div class="small" style="margin-top:3px;white-space:pre-wrap">${esc(n.text || '—')}</div></div></div>`).join('') || '<div class="empty small">Belum ada catatan.</div>'}</div></div>
      <div class="section-title">Privasi & pengaturan</div>
      <div class="card">
        <label class="switch"><span class="sw-text"><b>XP untuk milestone</b><small>Tercatat sebagai "Milestone privat" tanpa detail.</small></span><input type="checkbox" class="toggle" data-chg="pvXp" ${s.settings.private.xpEnabled ? 'checked' : ''}></label>
        <label class="switch"><span class="sw-text"><b>Tampilkan streak di halaman Progress</b><small>Dengan label netral "Tantangan Privat".</small></span><input type="checkbox" class="toggle" data-chg="pvStats" ${s.settings.private.showInStats ? 'checked' : ''}></label>
        <label class="switch"><span class="sw-text"><b>Pengingat check-in</b><small>Isi notifikasi selalu generik: "Waktunya check-in harian singkat."</small></span><input type="checkbox" class="toggle" data-chg="pvRem" ${(s.reminders.find(r => r.id === 'r_private') || {}).enabled ? 'checked' : ''}></label>
        <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-act="pvPin">${icon('lock', 14)}${s.settings.private.pinHash ? 'Ubah / hapus PIN' : 'Pasang PIN'}</button><button class="btn sm ghost" data-act="pvLock">Kunci sekarang</button><button class="btn sm ghost" data-act="pvReset">Reset streak manual</button></div>
      </div>`;
  }

  App.pages.private = {
    title: 'Ruang Privat',
    render() {
      const s = App.S();
      if (!s.selfControl.active) return intro();
      if (s.settings.private.pinHash && !App.privateUnlocked) return lockScreen();
      return main();
    },
    mount() {
      const s = App.S();
      if (!s.selfControl.active || (s.settings.private.pinHash && !App.privateUnlocked)) return;
      const before = s.xpTx.length;
      C.privateClaimMilestones(s);
      if (s.xpTx.length !== before) { App.commit(() => {}, { render: false }); UI.toast('Milestone privat tercapai', 'good'); }
    }
  };
  // auto-lock whenever the user leaves the page
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/private')) App.privateUnlocked = false; });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { App.privateUnlocked = false; if (location.hash.startsWith('#/private') && App.S().settings.private.pinHash) App.render(); } });

  Object.assign(App.actions, {
    pvStart: () => App.commit(s => { const k = C.dateKey(); Object.assign(s.selfControl, { active: true, activatedAt: s.selfControl.activatedAt || k, streakStart: k }); }, { quiet: true }),
    pvUnlock: async (f) => { const h = await hash(f.pin.value); if (h === App.S().settings.private.pinHash) { App.privateUnlocked = true; App.render(); } else { UI.toast('PIN salah', 'error'); f.pin.value = ''; } },
    pvLock: () => { App.privateUnlocked = false; if (!App.S().settings.private.pinHash) UI.toast('Pasang PIN dulu agar bisa dikunci', 'info'); App.render(); },
    pvClean: () => App.commit(s => { s.selfControl.checkins[C.dateKey()] = { s: 'clean', at: new Date().toISOString() }; C.privateClaimMilestones(s); }, { quiet: false }),
    pvSetback: async () => {
      const v = await UI.formModal({ title: 'Catat setback', intro: `<p class="small" style="margin-bottom:10px">Terima kasih sudah jujur. Satu setback tidak menghapus progres yang sudah kamu bangun — streak terpanjangmu tetap tercatat. Gunakan ini sebagai informasi, bukan alasan menyalahkan diri.</p><p class="tiny muted" style="margin-bottom:10px">Pertanyaan refleksi: ${PROMPTS.map(esc).join(' · ')}</p>`,
        fields: [{ name: 'note', label: 'Refleksi (opsional, hanya untukmu)', type: 'textarea', rows: 4 }], submitLabel: 'Catat & mulai lagi' });
      if (!v) return;
      App.commit(s => C.privateSetback(s, v.note), { quiet: true });
      UI.celebrate({ title: 'Hari pertama yang baru', subtitle: 'Kamu tetap orang yang sedang bertumbuh. Fokus ke 24 jam ke depan.', iconName: 'heart' });
    },
    pvNote: async () => {
      const v = await UI.formModal({ title: 'Catatan refleksi', intro: `<p class="tiny muted" style="margin-bottom:10px">${PROMPTS.map(esc).join(' · ')}</p>`, fields: [{ name: 'text', label: 'Catatan', type: 'textarea', rows: 5, required: true }] });
      if (v) App.commit(s => s.selfControl.notes.push({ id: C.uid('pn'), date: C.dateKey(), at: new Date().toISOString(), text: v.text }), { quiet: true });
    },
    pvReset: async () => {
      if (!(await UI.confirmDialog('Mulai ulang streak dari hari ini? Riwayat dan streak terpanjang tetap tersimpan.', { ok: 'Reset streak' }))) return;
      App.commit(s => C.privateSetback(s, 'Reset manual'), { quiet: true });
    },
    pvPin: async () => {
      const s = App.S();
      const v = await UI.formModal({ title: s.settings.private.pinHash ? 'Ubah PIN' : 'Pasang PIN', intro: '<p class="muted small" style="margin-bottom:10px">PIN ini layar privasi (mencegah orang lain melihat sekilas), bukan enkripsi. Kosongkan untuk menghapus PIN.</p>',
        fields: [{ name: 'pin', label: 'PIN baru (4–8 digit)', type: 'password', inputmode: 'numeric' }, { name: 'pin2', label: 'Ulangi PIN', type: 'password', inputmode: 'numeric' }],
        validate: v => v.pin !== v.pin2 ? 'PIN tidak sama' : v.pin && !/^\d{4,8}$/.test(v.pin) ? 'PIN harus 4–8 digit angka' : null });
      if (!v) return;
      const h = v.pin ? await hash(v.pin) : '';
      App.commit(st => { st.settings.private.pinHash = h; }, { quiet: true });
      App.privateUnlocked = true; App.render();
      UI.toast(h ? 'PIN dipasang' : 'PIN dihapus', 'good');
    },
    pvXp: (el) => App.commit(s => { s.settings.private.xpEnabled = el.checked; if (el.checked) C.privateClaimMilestones(s); }, { quiet: true }),
    pvStats: (el) => App.commit(s => { s.settings.private.showInStats = el.checked; }, { quiet: true }),
    pvRem: (el) => App.commit(s => { const r = s.reminders.find(r => r.id === 'r_private'); if (r) r.enabled = el.checked; }, { quiet: true })
  });
  App.privateHash = hash;
})();
