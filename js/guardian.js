/* LIFE OS — Guardian (Spartan) for the private challenge. Evolves with the private streak, never with XP.
 * Wording stays neutral on purpose: no explicit terms anywhere in this file. */
(function (root) {
  'use strict';
  let seq = 0;
  const FORMS = [
    { at: 0, name: 'Recruit', color: '#9aa0b4', desc: 'Helm polos. Setiap prajurit mulai dari sini.' },
    { at: 3, name: 'Hoplite', color: '#d9465b', desc: 'Jambul merah — tanda kamu sudah bertahan.' },
    { at: 7, name: 'Shieldbearer', color: '#e0a052', desc: 'Perisai di tangan. Mata mulai menyala.' },
    { at: 14, name: 'Spearman', color: '#ef5a4f', desc: 'Tombak dan jubah merah. Kamu menyerang balik.' },
    { at: 30, name: 'Champion', color: '#f5a524', desc: 'Aura juara. Satu bulan penuh kendali diri.' },
    { at: 60, name: 'Legend', color: '#ff7a3d', desc: 'Api menyelimuti. Kebiasaan lama sudah tumbang.' },
    { at: 90, name: 'Unbreakable', color: '#ffd35a', desc: 'Zirah emas. Tak tergoyahkan.' }
  ];
  const formOf = days => FORMS.reduce((acc, f, i) => days >= f.at ? i : acc, 0);

  function svg(form = 0, { size = 120, locked = false, anim = true } = {}) {
    const id = 'g' + (++seq), F = FORMS[form];
    const col = locked ? '#3a3a46' : F.color;
    const gold = form >= 6;
    const b1 = locked ? '#2b2b34' : gold ? '#ffe9a8' : '#d6a15c', b2 = locked ? '#15151b' : gold ? '#a87a22' : '#6b3f1a';
    const red = locked ? '#2e2e38' : '#b3263a';
    const eye = locked ? '#4a4a58' : form < 2 ? '#f0f0f6' : col;
    const a = anim && !locked ? ' anim' : '';
    const embers = form >= 5 && !locked ? [22, 40, 118, 138, 60, 104].map((x, i) =>
      `<circle class="ch-ember" style="animation-delay:${(i * 0.45).toFixed(2)}s" cx="${x}" cy="${160 - (i % 3) * 16}" r="${1.7 + (i % 2)}" fill="${col}"/>`).join('') : '';
    return `<svg class="ronin-svg guardian${a}${locked ? ' locked' : ''}" width="${size}" height="${size * 1.25}" viewBox="0 0 160 200" role="img" aria-label="Penjaga, wujud ${F.name}">
      <defs>
        <radialGradient id="${id}a" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2=".3"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${locked ? 0 : .5}"/></linearGradient>
        <filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${form >= 4 ? `<ellipse class="ch-aura" cx="80" cy="108" rx="${64 + form * 2}" ry="${84 + form * 2}" fill="url(#${id}a)"/>` : ''}
      ${form >= 6 && !locked ? `<g class="z-halo"><circle cx="80" cy="80" r="50" fill="none" stroke="${col}" stroke-width="1.6" opacity=".7"/>${Array.from({ length: 12 }, (_, i) => { const an = i * Math.PI / 6; return `<line x1="${80 + Math.cos(an) * 54}" y1="${80 + Math.sin(an) * 54}" x2="${80 + Math.cos(an) * 64}" y2="${80 + Math.sin(an) * 64}" stroke="${col}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`; }).join('')}</g>` : ''}
      <ellipse cx="80" cy="191" rx="48" ry="6" fill="#000" opacity=".5"/>
      <g class="ch-body">
        ${form >= 3 ? `<path class="g-cape" d="M20 188 C28 146 46 124 66 119 L94 119 C114 124 132 146 140 188 Z" fill="${red}"/>` : ''}
        ${form >= 3 ? `<g><line x1="127" y1="22" x2="117" y2="188" stroke="${locked ? '#333' : '#5a3a22'}" stroke-width="3.4" stroke-linecap="round"/><path d="M127 6 L133 26 L127 30 L121 26 Z" fill="url(#${id}b)" stroke="#000" stroke-opacity=".3"/></g>` : ''}
        <path d="M30 188 C34 150 50 128 70 122 L90 122 C110 128 126 150 130 188 Z" fill="url(#${id}b)" stroke="#000" stroke-opacity=".35"/>
        <path d="M60 140 C68 148 76 148 80 142 C84 148 92 148 100 140 M80 130 L80 168 M62 162 C70 166 90 166 98 162" stroke="#000" stroke-opacity=".28" stroke-width="1.4" fill="none"/>
        ${form >= 1 ? `<path class="g-crest" d="M68 46 C62 26 70 10 80 6 C90 10 98 26 92 46 Z" fill="${red}" stroke="#000" stroke-opacity=".3"/><path d="M72 44 C68 28 73 16 80 11 M80 11 L80 44 M88 44 C92 28 87 16 80 11" stroke="#000" stroke-opacity=".22" fill="none"/>` : ''}
        <path d="M50 94 C48 60 61 42 80 42 C99 42 112 60 110 94 L106 116 C101 123 91 124 86 119 L86 104 L74 104 L74 119 C69 124 59 123 54 116 Z" fill="url(#${id}b)" stroke="#000" stroke-opacity=".4" stroke-width="1.2"/>
        <path d="M54 66 C62 60 98 60 106 66" stroke="#000" stroke-opacity=".2" stroke-width="1.4" fill="none"/>
        <path d="M60 74 C67 71 75 72 78.5 76 L78.5 116 L81.5 116 L81.5 76 C85 72 93 71 100 74 L100 83 C93 80 87 81 84 85 L84 117 L76 117 L76 85 C73 81 67 80 60 83 Z" fill="#050507"/>
        <path d="M50 94 C48 60 61 42 80 42 C99 42 112 60 110 94 L106 116 C101 123 91 124 86 119 L86 104 L74 104 L74 119 C69 124 59 123 54 116 Z" fill="url(#${id}s)" pointer-events="none"/>
        <g class="ch-eyes" filter="url(#${id}g)"><ellipse cx="69" cy="78.5" rx="4.4" ry="${form >= 2 ? 2.2 : 1.8}" fill="${eye}"/><ellipse cx="91" cy="78.5" rx="4.4" ry="${form >= 2 ? 2.2 : 1.8}" fill="${eye}"/></g>
        ${form >= 2 ? `<g class="g-shield"><circle cx="54" cy="152" r="31" fill="url(#${id}b)" stroke="#000" stroke-opacity=".45" stroke-width="1.5"/><circle cx="54" cy="152" r="25" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/><path d="M42 166 L54 136 L66 166" stroke="${locked ? '#444' : form >= 4 ? col : red}" stroke-width="5" fill="none" stroke-linejoin="round" ${form >= 4 && !locked ? `filter="url(#${id}g)"` : ''}/><circle cx="54" cy="152" r="31" fill="url(#${id}s)"/></g>` : ''}
      </g>
      ${embers}
    </svg>`;
  }

  const L = {
    general: [
      'Dorongan itu seperti ombak: naik, memuncak, lalu pergi. Bertahan sampai surut.',
      'Prajurit sejati menang di pertempuran yang tidak dilihat siapa pun.',
      'Setiap "tidak" hari ini adalah perisai untuk dirimu besok.',
      'Kamu bukan budak dari keinginan sepuluh menit.',
      'Energi yang kamu jaga adalah bahan bakar untuk tujuanmu.',
      'Bosan dan sendirian? Itu celahnya. Keluar, bergerak, jangan beri ruang.',
      'Pilih yang paling kamu inginkan, bukan yang kamu inginkan sekarang.',
      'Pikiran yang jernih adalah senjata. Jaga ketajamannya.'
    ],
    night: ['Malam adalah medan tempur paling berat. Taruh HP jauh dari kasur.', 'Sudah larut. Matikan layar, tidur. Penjagamu berjaga.'],
    fresh: ['Hari pertama. Tidak ada beban masa lalu, hanya langkah berikutnya.', 'Jatuh itu manusiawi. Bangkit sekarang, bukan besok.'],
    strong: ['Rantainya makin panjang. Jangan biarkan satu momen memutusnya.', 'Lihat sejauh apa kamu sudah datang. Itu bukan kebetulan.']
  };
  function line(days, nextAt, now = new Date(), rnd = false) {
    let pool = L.general.slice();
    const h = now.getHours();
    if (days === 0) pool = L.fresh;
    else if (h >= 22 || h < 3) pool = L.night;
    else if (days >= 7) pool = pool.concat(L.strong);
    if (nextAt && nextAt - days === 1 && days > 0) pool = [`Besok milestone ${nextAt} hari. Jangan tukar ini dengan sepuluh menit.`];
    if (rnd) return pool[Math.floor(Math.random() * pool.length)];
    return pool[(days * 7 + h) % pool.length];
  }

  root.Guardian = { FORMS, formOf, svg, line };
})(window);
