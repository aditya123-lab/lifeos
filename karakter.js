/* LIFE OS — Karakter page: your companion (Zeus or Ronin), current form, and the evolution path. */
(function () {
  const C = LifeCore, UI = window.UI, Ch = window.Character, { esc, icon, fmt } = UI;
  App.pages.karakter = {
    title: () => Ch.label(App.S()) === 'ZEUS' ? 'Zeus' : 'Ronin',
    render() {
      const s = App.S();
      const lv = C.levelInfo(C.totalXP(s), s.settings.levelBase, s.settings.levelExp);
      const tier = Ch.tierOf(lv.level), next = C.RANKS[tier + 1], F = Ch.forms(s), name = Ch.label(s);
      if (!Ch.keyOf(s)) return `<div class="card empty">Karakter disembunyikan. Aktifkan di <a href="#/settings/look">Pengaturan → Tampilan</a>.</div>`;
      const toNext = next ? Math.max(0, C.cumulativeXP(next.from, s.settings.levelBase, s.settings.levelExp) - lv.total) : 0;
      return `<div class="card hero ronin-stage">
          <button class="ronin big" data-act="roninTap" aria-label="Ketuk ${name}">${Ch.svg(tier, { size: 170 })}</button>
          <div class="ronin-tag" style="color:${lv.rank.color};text-align:center">${name} · ${F[tier].name.toUpperCase()}</div>
          <p class="muted small" style="text-align:center;margin-top:4px">${esc(F[tier].desc)}</p>
          <div class="ronin-say" style="margin-top:14px"><span id="roninSay" data-line="${esc(Ch.line(s))}"></span></div>
          ${next ? `<div style="margin-top:16px"><div class="row between small"><span class="muted">Evolusi berikutnya: <b style="color:${next.color}">${F[tier + 1].name}</b></span><span class="muted">Lv ${next.from}</span></div>
            <div style="margin-top:6px">${UI.bar((lv.level - C.RANKS[tier].from + lv.progress) / (next.from - C.RANKS[tier].from), { color: next.color })}</div>
            <p class="tiny muted" style="margin-top:6px">${fmt(toNext)} XP lagi</p></div>` : '<p class="small" style="text-align:center;margin-top:14px">Wujud tertinggi tercapai.</p>'}
        </div>
        <div class="section-title">${icon('spark', 14)}Jalur Evolusi</div>
        <div class="ronin-grid">${C.RANKS.map((r, i) => `<div class="ronin-cell ${i === tier ? 'current' : ''} ${i > tier ? 'locked' : ''}">
            ${Ch.svg(i, { size: 72, locked: i > tier, anim: i === tier })}
            <b style="color:${i > tier ? 'var(--muted)' : r.color}">${i > tier ? icon('lock', 12) + ' ' : ''}${F[i].name}</b>
            <small class="muted">${r.name} · Lv ${r.from}</small></div>`).join('')}</div>
        <p class="tiny muted" style="margin-top:14px">Ketuk ${name === 'ZEUS' ? 'Zeus' : 'Ronin'} untuk kata-kata baru. Ia berubah wujud setiap kamu naik rank — dan ucapannya menyesuaikan kondisimu hari ini. Ganti karakter di <a href="#/settings/look">Pengaturan → Tampilan</a>.</p>`;
    },
    mount(view) { Ch.mount(view); }
  };
  Object.assign(App.actions, {
    roninTap: (el) => {
      const say = document.querySelector('#roninSay');
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      if (window.Motion) { const r = el.getBoundingClientRect(); Motion.burst(r.left + r.width / 2, r.top + r.height * 0.35, 10); }
      let t = Ch.line(App.S(), new Date(), true), guard = 0;
      while (say && t === say.textContent && guard++ < 5) t = Ch.line(App.S(), new Date(), true);
      Ch.type(say, t, true);
    }
  });
})();
