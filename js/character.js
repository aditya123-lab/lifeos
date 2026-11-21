/* LIFE OS — RONIN: original companion character. Evolves with rank (7 forms), speaks context-aware discipline lines. */
(function (root) {
  'use strict';
  const C = root.LifeCore;
  let seq = 0;

  const RONIN_FORMS = [
    { name: 'Wanderer', desc: 'Jubah sederhana. Mata baru mulai menyala.' },
    { name: 'Initiate', desc: 'Syal merah — tanda sumpah disiplin pertama.' },
    { name: 'Blade', desc: 'Katana di punggung. Aura mulai terlihat.' },
    { name: 'Warden', desc: 'Aura menguat, syal berganti warna rank.' },
    { name: 'Vanguard', desc: 'Pelindung bahu. Tatapan makin tajam.' },
    { name: 'Phantom', desc: 'Bara api melayang di sekitarnya.' },
    { name: 'Ascendant', desc: 'Mahkota cahaya. Disiplin yang tak tergoyahkan.' }
  ];

  const tierOf = level => Math.max(0, C.RANKS.findIndex(r => level >= r.from && level <= r.to));

  /** RONIN SVG at a given tier (0..6). */
  function roninSvg(tier = 0, { size = 120, locked = false, anim = true } = {}) {
    const id = 'r' + (++seq);
    const rank = C.RANKS[tier] || C.RANKS[0];
    const col = locked ? '#3a3a46' : rank.color;
    const eye = locked ? '#55556a' : tier === 0 ? '#e8e8f0' : rank.color;
    const scarf = locked ? '#2c2c36' : tier >= 3 ? rank.color : '#c23b4e';
    const a = anim && !locked ? ' anim' : '';
    const embers = tier >= 5 && !locked ? [18, 42, 120, 140, 64, 100].map((x, i) =>
      `<circle class="ch-ember" style="animation-delay:${(i * 0.45).toFixed(2)}s" cx="${x}" cy="${150 - (i % 3) * 18}" r="${1.6 + (i % 2)}" fill="${col}"/>`).join('') : '';
    return `<svg class="ronin-svg${a}${locked ? ' locked' : ''}" width="${size}" height="${size * 1.25}" viewBox="0 0 160 200" role="img" aria-label="Ronin, wujud ${RONIN_FORMS[tier].name}">
      <defs>
        <radialGradient id="${id}a" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${locked ? '#1a1a22' : '#262634'}"/><stop offset="1" stop-color="#0a0a10"/></linearGradient>
        <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="80" cy="190" rx="46" ry="7" fill="#000" opacity=".45"/>
      ${tier >= 2 ? `<ellipse class="ch-aura" cx="80" cy="112" rx="${62 + tier * 3}" ry="${84 + tier * 3}" fill="url(#${id}a)"/>` : ''}
      ${tier >= 6 && !locked ? `<g class="ch-halo" filter="url(#${id}g)"><ellipse cx="80" cy="30" rx="24" ry="6" fill="none" stroke="${col}" stroke-width="2.4"/><path d="M62 28 L66 18 L71 26 L80 12 L89 26 L94 18 L98 28" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/></g>` : ''}
      <g class="ch-body">
        ${tier >= 2 ? `<g transform="rotate(-38 80 104)"><rect x="77" y="22" width="6" height="122" rx="2" fill="#1d1d26" stroke="${col}" stroke-opacity=".35"/><rect x="76" y="4" width="8" height="20" rx="2" fill="#3a3a48"/><path d="M76 8 h8 M76 13 h8 M76 18 h8" stroke="${col}" stroke-opacity=".7" stroke-width="1.2"/><rect x="72" y="23" width="16" height="3.5" rx="1.5" fill="${locked ? '#444' : '#e6c15a'}"/></g>` : ''}
        ${tier >= 1 ? `<path class="ch-scarf" d="M92 82 C108 80 120 86 136 78 C128 92 114 96 98 92 Z" fill="${scarf}"/>` : ''}
        <path d="M80 38 C57 38 47 57 47 78 C47 94 39 122 29 186 L131 186 C121 122 113 94 113 78 C113 57 103 38 80 38 Z" fill="url(#${id}c)" stroke="${col}" stroke-opacity="${locked ? .25 : .45}" stroke-width="1.4"/>
        <path d="M80 100 L80 186 M64 112 C60 140 56 160 52 184 M96 112 C100 140 104 160 108 184" stroke="${col}" stroke-opacity=".14" stroke-width="1.2" fill="none"/>
        ${tier >= 1 ? `<path d="M58 86 C66 96 94 96 102 86 L104 94 C94 104 66 104 56 94 Z" fill="${scarf}"/>` : ''}
        ${tier >= 4 ? `<path d="M47 88 C50 78 60 74 66 80 L62 96 C56 98 50 96 47 88 Z M113 88 C110 78 100 74 94 80 L98 96 C104 98 110 96 113 88 Z" fill="${col}" fill-opacity=".85" stroke="#000" stroke-opacity=".3"/>` : ''}
        ${tier >= 2 ? `<path d="M50 124 C66 130 94 130 110 124 L111 133 C94 139 66 139 49 133 Z" fill="#14141c" stroke="${col}" stroke-opacity=".5"/><rect x="74" y="125" width="12" height="11" rx="2" fill="none" stroke="${col}" stroke-opacity=".8" stroke-width="1.3"/>` : `<path d="M52 126 C68 131 92 131 108 126" stroke="${col}" stroke-opacity=".25" stroke-width="2" fill="none"/>`}
        <path d="M80 46 C62 46 54 60 54 75 C54 90 66 99 80 99 C94 99 106 90 106 75 C106 60 98 46 80 46 Z" fill="#000" opacity=".35"/>
        <path d="M80 50 C66 50 59 62 59 75 C59 88 69 96 80 96 C91 96 101 88 101 75 C101 62 94 50 80 50 Z" fill="#040406" stroke="${col}" stroke-opacity=".22"/>
        <g class="ch-eyes" filter="url(#${id}g)">
          <polygon points="65,72 76,76 75,79.5 65,76" fill="${eye}"/>
          <polygon points="95,72 84,76 85,79.5 95,76" fill="${eye}"/>
        </g>
      </g>
      ${embers}
    </svg>`;
  }


  // ------------------------------------------------------------ ZEUS: marble statue, glowing eyes
  const ZEUS_FORMS = [
    { name: 'Mortal Marble', desc: 'Patung marmer polos. Mata mulai bercahaya samar.' },
    { name: 'Hero', desc: 'Mahkota daun zaitun — tanda kemenangan pertama.' },
    { name: 'Demigod', desc: 'Mata menyala, mahkota berubah emas.' },
    { name: 'Titan', desc: 'Retakan bercahaya — kekuatan yang tak muat di dalam batu.' },
    { name: 'Olympian', desc: 'Jubah dewa dan aura yang menyelimuti.' },
    { name: 'Thunderer', desc: 'Petir mengikuti setiap langkahnya.' },
    { name: 'King of Olympus', desc: 'Lingkar cahaya ilahi. Disiplin tingkat dewa.' }
  ];
  function zeusSvg(tier = 0, { size = 120, locked = false, anim = true } = {}) {
    const id = 'z' + (++seq);
    const rank = C.RANKS[tier] || C.RANKS[0];
    const col = locked ? '#3a3a46' : rank.color;
    const eye = locked ? '#4a4a58' : tier < 2 ? '#f4f6ff' : rank.color;
    const m1 = locked ? '#2a2a33' : tier >= 6 ? '#fff0c4' : '#e8e4de', m2 = locked ? '#16161c' : tier >= 6 ? '#a07a2e' : '#7d7871';
    const shade = locked ? '#0e0e13' : tier >= 6 ? '#8a6a2a' : '#6f6a64';
    const leaf = locked ? '#3a3a44' : tier >= 2 ? '#e6c15a' : '#7fae6a';
    const a = anim && !locked ? ' anim' : '';
    const curls = (pts, r, cls = '') => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r + (i % 2) * 0.8}" fill="url(#${id}m)" stroke="${shade}" stroke-opacity=".55" stroke-width=".9" ${cls}/>`).join('');
    const hair = curls([[56, 76], [58, 66], [64, 58], [72, 53], [80, 51], [88, 53], [96, 58], [102, 66], [104, 76]], 7.2);
    const beard = curls([[61, 99], [63, 108], [68, 115], [74, 119], [80, 121], [86, 119], [92, 115], [97, 108], [99, 99]], 5.6);
    const laurel = side => [0, 1, 2, 3, 4].map(i => {
      const t = i / 4, x = side * (22 - t * 4) + 80, y = 70 - t * 16, rot = side * (60 - t * 40);
      return `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" transform="rotate(${rot} ${x} ${y})" fill="${leaf}" stroke="#000" stroke-opacity=".25" stroke-width=".6"/>`;
    }).join('');
    const bolt = (x, flip) => `<path class="z-bolt" d="M${x} 40 L${x + 10 * flip} 64 L${x + 3 * flip} 64 L${x + 14 * flip} 92 L${x - 2 * flip} 60 L${x + 5 * flip} 60 Z" fill="${col}" filter="url(#${id}g)"/>`;
    return `<svg class="ronin-svg zeus${a}${locked ? ' locked' : ''}" width="${size}" height="${size * 1.25}" viewBox="0 0 160 200" role="img" aria-label="Zeus, wujud ${ZEUS_FORMS[tier].name}">
      <defs>
        <radialGradient id="${id}a" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m1}"/><stop offset="1" stop-color="${m2}"/></linearGradient>
        <linearGradient id="${id}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity=".45"/></linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2=".35"><stop offset=".38" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${locked ? 0 : .62}"/></linearGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${locked ? 0 : .45}"/></linearGradient>
        <clipPath id="${id}k"><ellipse cx="80" cy="86" rx="25" ry="30"/><circle cx="80" cy="62" r="26"/><path d="M28 171 C30 148 46 136 63 131 L97 131 C114 136 130 148 132 171 Z"/><path d="M67 100 L93 100 L97 133 L63 133 Z"/><circle cx="80" cy="110" r="22"/></clipPath>
        <filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${tier >= 2 ? `<ellipse class="ch-aura" cx="80" cy="96" rx="${60 + tier * 3}" ry="${78 + tier * 3}" fill="url(#${id}a)"/>` : ''}
      ${tier >= 6 && !locked ? `<g class="z-halo"><circle cx="80" cy="80" r="44" fill="none" stroke="${col}" stroke-width="2" opacity=".8"/>${Array.from({ length: 16 }, (_, i) => { const an = i * Math.PI / 8; return `<line x1="${80 + Math.cos(an) * 48}" y1="${80 + Math.sin(an) * 48}" x2="${80 + Math.cos(an) * (i % 2 ? 56 : 62)}" y2="${80 + Math.sin(an) * (i % 2 ? 56 : 62)}" stroke="${col}" stroke-width="2" stroke-linecap="round" opacity=".75"/>`; }).join('')}</g>` : ''}
      ${tier >= 5 && !locked ? bolt(20, 1) + bolt(140, -1) : ''}
      <ellipse cx="80" cy="192" rx="44" ry="5" fill="#000" opacity=".5"/>
      <rect x="44" y="170" width="72" height="8" rx="2" fill="url(#${id}m)"/><rect x="50" y="178" width="60" height="12" rx="2" fill="${m2}"/>
      <g class="ch-body">
        <path d="M28 171 C30 148 46 136 63 131 L97 131 C114 136 130 148 132 171 Z" fill="url(#${id}m)" stroke="${shade}" stroke-opacity=".4"/>
        <path d="M54 150 C64 157 74 157 79 150 M81 150 C86 157 96 157 106 150 M80 138 L80 152" stroke="${shade}" stroke-opacity=".55" stroke-width="1.3" fill="none"/>
        ${tier >= 4 ? `<path d="M28 171 C36 150 50 138 64 132 L104 166 C92 170 70 171 56 171 Z" fill="url(#${id}d)"/><path d="M40 166 C52 152 62 144 70 138 M54 170 C66 158 76 150 84 146 M70 171 C80 162 88 156 96 154" stroke="#000" stroke-opacity=".22" stroke-width="1.3" fill="none"/><circle cx="64" cy="134" r="4" fill="${locked ? '#444' : '#e6c15a'}"/>` : ''}
        <path d="M67 108 L93 108 L97 133 L63 133 Z" fill="url(#${id}m)"/>
        <path d="M67 116 C74 122 86 122 93 116" stroke="${shade}" stroke-opacity=".5" fill="none"/>
        ${hair}
        <ellipse cx="80" cy="86" rx="23" ry="28" fill="url(#${id}m)" stroke="${shade}" stroke-opacity=".35"/>
        ${beard}
        <path d="M68 103 C74 99 78 101 80 103 C82 101 86 99 92 103 C86 106 74 106 68 103 Z" fill="url(#${id}m)" stroke="${shade}" stroke-opacity=".6" stroke-width=".9"/>
        <path d="M64 78 Q71 73 78 78 M82 78 Q89 73 96 78" stroke="${shade}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M66 80 Q71 87 77 82 M83 82 Q89 87 94 80" fill="${shade}" opacity=".35"/>
        <path d="M80 80 L77 94 Q80 97 83 94" stroke="${shade}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        ${tier >= 1 ? `<g>${laurel(-1)}${laurel(1)}</g>` : ''}
        <g clip-path="url(#${id}k)" pointer-events="none"><rect x="20" y="40" width="120" height="140" fill="url(#${id}s)"/><rect x="20" y="40" width="120" height="140" fill="url(#${id}v)"/></g>
        <g class="ch-eyes" filter="url(#${id}g)">
          <ellipse cx="71" cy="83" rx="4.6" ry="${tier >= 2 ? 2.4 : 2}" fill="${eye}" opacity="${locked ? .6 : tier ? 1 : .85}"/>
          <ellipse cx="89" cy="83" rx="4.6" ry="${tier >= 2 ? 2.4 : 2}" fill="${eye}" opacity="${locked ? .6 : tier ? 1 : .85}"/>
        </g>
        ${tier >= 3 && !locked ? `<g class="z-cracks" filter="url(#${id}g)" stroke="${col}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M96 62 L91 71 L97 77 L92 88"/><path d="M62 92 L66 98 L63 104"/><path d="M42 160 L52 151 L50 143 L57 137"/><path d="M112 150 L118 158 L116 166"/></g>` : ''}
      </g>
    </svg>`;
  }

  // ------------------------------------------------------------ character selection
  const CHARS = {
    zeus: { label: 'ZEUS', forms: ZEUS_FORMS, svg: zeusSvg, extra: ['Dewa tidak dilahirkan. Mereka ditempa.', 'Marmer jadi patung karena dipahat setiap hari.', 'Petir tidak minta izin. Kamu juga jangan.', 'Olympus tidak didaki dengan alasan.'] },
    ronin: { label: 'RONIN', forms: RONIN_FORMS, svg: roninSvg, extra: ['Pedang tidak tajam karena dielus. Ia tajam karena diasah.', 'Jalan pedang adalah jalan pengulangan.'] }
  };
  const keyOf = s => { const v = s && s.settings && s.settings.character; return v === false || v === 'off' ? null : CHARS[v] ? v : 'zeus'; };
  const cur = s => CHARS[keyOf(s) || 'zeus'];
  const FORMS = ZEUS_FORMS;
  function svg(tier, opts = {}) { const s = root.LifeStore && root.LifeStore.get(); return (opts.char ? CHARS[opts.char] : cur(s)).svg(tier, opts); }

  // ------------------------------------------------------------ lines (original)
  const L = {
    general: [
      'Motivasi datang dan pergi. Disiplin tetap tinggal.',
      'Tidak ada yang datang menyelamatkanmu. Bergeraklah.',
      'Dirimu yang kemarin sedang menonton. Buat dia kalah.',
      'Lakukan meski tidak ingin. Terutama saat tidak ingin.',
      'Diam. Kerjakan. Biar hasilnya yang bicara.',
      'Kenyamanan adalah musuh yang tersenyum.',
      'Versi terbaikmu dibangun dari hari-hari yang membosankan.',
      'Jangan bernegosiasi dengan dirimu yang malas.',
      'Satu centang lagi. Lalu satu lagi.',
      'Hari berat? Bagus. Itu tanda kamu sedang ditempa.',
      'Kamu tidak harus merasa siap. Kamu hanya harus mulai.'
    ],
    morning: ['Bangun. Dunia tidak menunggu yang ragu.', 'Pagi ini menentukan siapa kamu hari ini.', 'Rapikan kasurmu. Menang kecil pertama hari ini.'],
    night: ['Tutup hari dengan jujur. Tulis jurnalmu.', 'Lima kalimat. Lalu tidur seperti pemenang.'],
    late: ['Lewat tengah malam. Selesaikan yang kemarin, lalu tidur. Istirahat juga bagian dari disiplin.'],
    done: ['Misi selesai. Ini rasanya menang melawan diri sendiri.', 'Semua wajib beres. Istirahat — kamu sudah membayarnya.', 'Hari ini milikmu. Ulangi besok.'],
    good: ['Target harian aman. Sekarang lampaui.', 'Ritmemu bagus. Jangan kendur di akhir.'],
    behind: ['Masih ada waktu. Selesaikan yang tersisa.', 'Belum terlambat. Satu tugas sekarang, jangan nanti.'],
    gym: ['Hari gym. Tubuhmu tidak dibangun oleh niat.', 'Beban itu tidak akan mengangkat dirinya sendiri.'],
    rest: ['Hari istirahat. Pulihkan diri — besok kita tempur lagi.']
  };

  /** Pick a context-aware line. `rnd` true -> random from pool (tap), else stable per day. */
  function line(s, now = new Date(), rnd = false) {
    const k = C.dateKey(now), h = now.getHours();
    const st = C.dayStats(s, k), streak = C.currentStreak(s, k);
    const y = C.addDays(k, -1);
    const yPending = y >= s.createdAt && !s.restDays[y] && C.habitsFor(s, y).some(x => C.isMandatoryOn(x, y) && !C.statusOf(s, y, x.id));
    let pool = L.general, extra = '';
    if (h < 4 && yPending) pool = L.late;
    else if (st.rest) pool = L.rest;
    else if (st.total && st.pct >= 1) pool = L.done;
    else if (h >= 21 && !C.journalDone(s, k) && s.habits.some(x => x.link === 'journal' && x.active)) pool = L.night;
    else if (h < 10 && st.done === 0) pool = L.morning;
    else if ((s.settings.gymDays || []).includes(now.getDay()) && !C.workoutsIn(s, k, k).length && h >= 12 && h < 20) pool = L.gym;
    else if (st.pct * 100 >= s.settings.successThreshold) pool = L.good;
    else if (h >= 18) pool = L.behind;
    if (pool === L.general && streak >= 3) extra = `Streak ${streak} hari. Jangan putus rantainya.`;
    const all = (extra ? pool.concat([extra]) : pool).concat(pool === L.general ? cur(s).extra : []);
    if (rnd) return all[Math.floor(Math.random() * all.length)];
    const seed = [...k].reduce((a, c) => a + c.charCodeAt(0), 0) + h; // changes hourly, stable within the hour
    return extra && h % 2 ? extra : all[seed % all.length];
  }

  // ------------------------------------------------------------ typing effect
  let lastTyped = '';
  function type(el, text, force) {
    if (!el) return;
    clearInterval(el._t);
    const motion = !root.Motion || root.Motion.enabled();
    if (!motion || (!force && text === lastTyped)) { el.textContent = text; return; }
    lastTyped = text; el.textContent = ''; el.classList.add('typing');
    let i = 0;
    el._t = setInterval(() => {
      i += 1; el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(el._t); el.classList.remove('typing'); }
    }, 24);
  }

  /** Dashboard hero block. */
  function hero(s, lv) {
    const tier = tierOf(lv.level), ch = cur(s);
    return `<div class="ronin-hero">
      <button class="ronin" data-act="roninTap" aria-label="Ketuk ${ch.label}">${ch.svg(tier, { size: 92 })}</button>
      <div class="ronin-right">
        <div class="ronin-tag" style="color:${lv.rank.color}">${ch.label} · ${ch.forms[tier].name.toUpperCase()}</div>
        <div class="ronin-say"><span id="roninSay" data-line="${UI.esc(line(s))}"></span></div>
      </div>
    </div>`;
  }
  function mount(view) {
    const el = view.querySelector('#roninSay');
    if (el) type(el, el.dataset.line);
  }

  root.Character = { FORMS, CHARS, svg, line, type, hero, mount, tierOf, keyOf, cur, forms: s => cur(s).forms, label: s => cur(s).label };
})(window);
