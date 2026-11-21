/* LIFE OS — Private Self-Control Challenge
 * Privacy design: nothing from this module appears on the dashboard, in achievement titles,
 * in notification previews, or in analytics (unless the user opts in). Optional PIN screen.
 * NOTE: the PIN is a privacy screen against casual viewing, not encryption — data lives in
 * this browser's localStorage. */
(function () {
  const C = LifeCore, UI = window.UI, G = window.Guardian, { esc, icon, fmt } = UI;
  const URGE_STEPS = ['Berdiri dan keluar dari ruangan', 'Minum segelas air dingin', '20 push-up atau squat', 'Tutup aplikasi/tab yang memicu', 'Chat teman atau jalan sebentar'];
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
        <div class="card hero pv-hero">${(() => { const f = G.formOf(streak), F = G.FORMS[f]; return `<div class="row" style="gap:10px;align-items:center">
            <button class="ronin" data-act="pvGuardTap" aria-label="Ketuk penjaga">${G.svg(f, { size: 92 })}</button>
            <div style="flex:1;min-width:0"><div class="ronin-tag" style="color:${F.color}">PENJAGA · ${F.name.toUpperCase()}</div>
              <div class="row" style="align-items:baseline;gap:8px;margin:2px 0 0"><b style="font-size:2.6rem" class="num">${streak}</b><span class="muted">hari</span></div></div></div>
          <div class="ronin-say" style="margin:6px 0 10px"><span id="pvSay" data-line="${esc(G.line(streak, next))}"></span></div>`; })()}
          ${next ? `${UI.bar((streak - prev) / (next - prev))}<p class="tiny muted" style="margin-top:6px">${next - streak} hari lagi menuju milestone ${next} hari</p>` : '<p class="small good">Semua milestone tercapai. Pertahankan!</p>'}
          <p class="small muted" style="margin-top:10px">Terpanjang: <b>${longest} hari</b> · Mulai: ${C.formatDate(sc.streakStart, { short: true })}</p></div>
        <div class="card"><h3 style="margin-bottom:10px">Check-in hari ini</h3>
          ${ci ? `<p class="small">${ci.s === 'clean' ? icon('check', 15, 'good') + ' Kamu sudah check-in: <b>hari ini aman</b>.' : icon('heart', 15, 'accent') + ' Setback dicatat. Hari ini adalah hari pertama yang baru.'}</p>` : `<p class="muted small" style="margin-bottom:12px">Jujur pada diri sendiri. Data ini hanya untukmu.</p>`}
          <div class="row wrap" style="margin-top:10px">${!ci || ci.s !== 'clean' ? `<button class="btn primary" data-act="pvClean" data-date="${k}" ${ci && ci.s === 'setback' ? 'disabled' : ''}>${icon('check', 16)}Hari ini aman</button>` : ''}<button class="btn" data-act="pvSetback" data-date="${k}">Catat setback</button><button class="btn ghost" data-act="pvNote">${icon('note', 16)}Refleksi</button></div>
          ${(() => { const y = C.addDays(k, -1), cy = sc.checkins[y]; if (y < sc.activatedAt) return ''; return `<div class="divider"></div>
            <p class="small"><b>Kemarin</b> · ${cy ? (cy.s === 'clean' ? `<span class="good">aman ${icon('check', 13)}</span>` : 'setback dicatat') : '<span class="warn">belum check-in</span>'}</p>
            ${!cy ? `<div class="row wrap" style="margin-top:8px;gap:8px"><button class="btn sm primary" data-act="pvClean" data-date="${y}">${icon('check', 14)}Kemarin aman</button><button class="btn sm ghost" data-act="pvSetback" data-date="${y}">Setback kemarin</button></div>` : ''}
            ${!cy ? '<p class="tiny muted" style="margin-top:6px">Lupa check-in? Masih bisa diisi sampai malam ini. Streak tidak putus hanya karena lupa check-in.</p>' : ''}`; })()}</div>
      </div>
      <button class="urge-btn" data-act="pvUrge">${icon('shield', 22)}<span><b>Dorongan datang?</b><small>Masuk Mode Bertahan · 90 detik</small></span>${icon('right', 18)}</button>
      ${(sc.urges || []).length ? `<p class="tiny muted" style="margin:8px 2px 0">Dorongan dikalahkan: <b class="good">${sc.urges.length}×</b>${(sc.urges || []).filter(u => u.date === k).length ? ` · hari ini ${(sc.urges || []).filter(u => u.date === k).length}×` : ''}</p>` : ''}
      <div class="section-title">Evolusi Penjaga</div>
      <div class="ronin-grid">${G.FORMS.map((F, i) => { const f = G.formOf(streak), lk = i > f; return `<div class="ronin-cell ${i === f ? 'current' : ''} ${lk ? 'locked' : ''}">${G.svg(i, { size: 64, locked: lk, anim: i === f })}<b style="color:${lk ? 'var(--muted)' : F.color}">${lk ? icon('lock', 12) + ' ' : ''}${F.name}</b><small class="muted">${F.at} hari</small></div>`; }).join('')}</div>
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
      const say = document.querySelector('#pvSay');
      if (say) { if (window.Character) Character.type(say, say.dataset.line); else say.textContent = say.dataset.line; }
      const before = s.xpTx.length;
      C.privateClaimMilestones(s);
      const f = G.formOf(C.privateStreak(s, C.dateKey()));
      const evolved = f > (s.selfControl.formSeen || 0);
      if (s.xpTx.length !== before || evolved || s.selfControl.formSeen == null) {
        App.commit(st => { st.selfControl.formSeen = Math.max(f, st.selfControl.formSeen || 0); }, { render: false, quiet: true });
        if (s.xpTx.length !== before && !evolved) UI.toast('Milestone privat tercapai', 'good');
      }
      if (evolved) UI.celebrate({ title: 'Penjaga berevolusi', subtitle: 'Wujud baru: ' + G.FORMS[f].name + '. ' + G.FORMS[f].desc, color: G.FORMS[f].color, art: G.svg(f, { size: 130 }) });
    }
  };
  // auto-lock whenever the user leaves the page
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/private')) App.privateUnlocked = false; });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { App.privateUnlocked = false; if (location.hash.startsWith('#/private') && App.S().settings.private.pinHash) App.render(); } });

  // ---------------------------------------------------------------- urge mode (90-second hold with breathing)
  function urgeMode() {
    const s = App.S(), streak = C.privateStreak(s, C.dateKey()), f = G.formOf(streak);
    const ov = document.createElement('div');
    ov.className = 'urge-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Mode Bertahan');
    let total = 90, t0 = Date.now(), timer = null;
    ov.innerHTML = `<button class="icon-btn urge-x" aria-label="Tutup">${icon('x', 20)}</button>
      <div class="urge-g">${G.svg(f, { size: 110 })}</div>
      <div class="ronin-tag" style="color:${G.FORMS[f].color};text-align:center">MODE BERTAHAN</div>
      <p class="urge-msg">Dorongan ini akan lewat. Kamu cukup bertahan ${total} detik.</p>
      <div class="breath"><div class="breath-c"></div><div class="breath-t"><b id="uPhase">Tarik napas</b><span id="uTime">1:30</span></div></div>
      <div class="urge-steps">${URGE_STEPS.map((x, i) => `<button class="chip" data-i="${i}">${esc(x)}</button>`).join('')}</div>
      <div class="urge-end" hidden><p class="urge-msg"><b>Gelombangnya sudah lewat?</b></p><div class="row" style="gap:8px;justify-content:center"><button class="btn primary" data-u="win">${icon('check', 16)}Ya, aku menang</button><button class="btn" data-u="more">+90 detik</button></div></div>
      <p class="tiny muted" style="text-align:center;margin-top:12px">Streak ${streak} hari sedang dijaga.</p>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
    const close = () => { clearInterval(timer); ov.classList.remove('show'); setTimeout(() => ov.remove(), 250); window.removeEventListener('hashchange', close); };
    window.addEventListener('hashchange', close);
    const phaseEl = ov.querySelector('#uPhase'), timeEl = ov.querySelector('#uTime'), circle = ov.querySelector('.breath-c');
    const tick = () => {
      const el = (Date.now() - t0) / 1000, left = Math.max(0, Math.ceil(total - el)), c = el % 14;
      const ph = c < 4 ? ['Tarik napas', 'in'] : c < 8 ? ['Tahan', 'hold'] : ['Hembuskan', 'out'];
      phaseEl.textContent = ph[0]; circle.dataset.p = ph[1];
      timeEl.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      if (left <= 0) { clearInterval(timer); ov.querySelector('.urge-end').hidden = false; phaseEl.textContent = 'Selesai'; circle.dataset.p = 'done'; }
    };
    timer = setInterval(tick, 250); tick();
    ov.addEventListener('click', (e) => {
      const st = e.target.closest('.urge-steps .chip');
      if (st) { st.classList.toggle('active'); if (st.classList.contains('active') && window.Motion) { const r = st.getBoundingClientRect(); Motion.burst(r.left + r.width / 2, r.top + r.height / 2, 8); } return; }
      if (e.target.closest('.urge-x')) return close();
      const u = e.target.closest('[data-u]'); if (!u) return;
      if (u.dataset.u === 'more') { total += 90; ov.querySelector('.urge-end').hidden = true; clearInterval(timer); timer = setInterval(tick, 250); tick(); return; }
      close();
      App.commit(st2 => { const sc = st2.selfControl; sc.urges = sc.urges || []; sc.urges.push({ date: C.dateKey(), at: new Date().toISOString() }); }, { quiet: true });
      if (window.Motion) Motion.confetti({ count: 80 });
      UI.toast('Dorongan dikalahkan. Penjagamu makin kuat.', 'good', 3200);
    });
  }

  Object.assign(App.actions, {
    pvUrge: () => urgeMode(),
    pvGuardTap: (el) => {
      const s = App.S(), streak = C.privateStreak(s, C.dateKey()), say = document.querySelector('#pvSay');
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      if (window.Motion) { const r = el.getBoundingClientRect(); Motion.burst(r.left + r.width / 2, r.top + r.height * 0.35, 10); }
      const next = C.PRIVATE_MILESTONES.find(m => m > streak);
      let t = G.line(streak, next, new Date(), true), n = 0;
      while (say && t === say.textContent && n++ < 5) t = G.line(streak, next, new Date(), true);
      if (window.Character) Character.type(say, t, true); else if (say) say.textContent = t;
    },
    pvStart: () => App.commit(s => { const k = C.dateKey(); Object.assign(s.selfControl, { active: true, activatedAt: s.selfControl.activatedAt || k, streakStart: k }); }, { quiet: true }),
    pvUnlock: async (f) => { const h = await hash(f.pin.value); if (h === App.S().settings.private.pinHash) { App.privateUnlocked = true; App.render(); } else { UI.toast('PIN salah', 'error'); f.pin.value = ''; } },
    pvLock: () => { App.privateUnlocked = false; if (!App.S().settings.private.pinHash) UI.toast('Pasang PIN dulu agar bisa dikunci', 'info'); App.render(); },
    pvClean: (el) => {
      const k = (el && el.dataset.date) || C.dateKey(), y = k !== C.dateKey();
      const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      App.commit(s => { if (!C.privateCheckin(s, new Date(), k)) UI.toast('Hanya hari ini dan kemarin yang bisa diisi', 'error'); C.privateClaimMilestones(s); }, { quiet: false });
      if (window.Motion && r) Motion.burst(r.left + r.width / 2, r.top + r.height / 2, 12);
      UI.toast(y ? 'Check-in kemarin tercatat. Lanjutkan hari ini.' : 'Hari ini aman. Penjagamu bangga.', 'good');
    },
    pvSetback: async (el) => {
      const k = (el && el.dataset.date) || C.dateKey(), y = k !== C.dateKey();
      const v = await UI.formModal({ title: y ? 'Catat setback kemarin' : 'Catat setback', intro: `<p class="small" style="margin-bottom:10px">Terima kasih sudah jujur. Satu setback tidak menghapus progres yang sudah kamu bangun — streak terpanjangmu tetap tercatat. Gunakan ini sebagai informasi, bukan alasan menyalahkan diri.</p><p class="tiny muted" style="margin-bottom:10px">Pertanyaan refleksi: ${PROMPTS.map(esc).join(' · ')}</p>`,
        fields: [{ name: 'note', label: 'Refleksi (opsional, hanya untukmu)', type: 'textarea', rows: 4 }], submitLabel: 'Catat & mulai lagi' });
      if (!v) return;
      App.commit(s => { C.privateSetback(s, v.note, new Date(), k); s.selfControl.formSeen = C.privateStreak(s) ? window.Guardian.formOf(C.privateStreak(s)) : 0; }, { quiet: true });
      UI.celebrate({ title: 'Penjaga bangkit lagi', subtitle: 'Kamu tetap orang yang sedang bertumbuh. Streak terpanjangmu tetap tercatat. Fokus ke 24 jam ke depan.', iconName: 'heart', art: G.svg(0, { size: 120 }) });
    },
    pvNote: async () => {
      const v = await UI.formModal({ title: 'Catatan refleksi', intro: `<p class="tiny muted" style="margin-bottom:10px">${PROMPTS.map(esc).join(' · ')}</p>`, fields: [{ name: 'text', label: 'Catatan', type: 'textarea', rows: 5, required: true }] });
      if (v) App.commit(s => s.selfControl.notes.push({ id: C.uid('pn'), date: C.dateKey(), at: new Date().toISOString(), text: v.text }), { quiet: true });
    },
    pvReset: async () => {
      if (!(await UI.confirmDialog('Mulai ulang streak dari hari ini? Riwayat dan streak terpanjang tetap tersimpan.', { ok: 'Reset streak' }))) return;
      App.commit(s => { C.privateSetback(s, 'Reset manual'); s.selfControl.formSeen = 0; }, { quiet: true });
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
