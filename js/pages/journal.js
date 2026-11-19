/* LIFE OS — Jurnal malam: ~5 kalimat sebelum tidur. Disimpan hanya di perangkat ini (ikut backup). */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon } = UI;
  const MOODS = [[1, 'Berat'], [2, 'Kurang'], [3, 'Biasa'], [4, 'Baik'], [5, 'Hebat']];
  // [question shown on the button, starter inserted into the text — ends with ':' so it doesn't count as a sentence]
  const PROMPTS = [
    ['Apa yang berjalan baik hari ini?', 'Hal baik hari ini: '],
    ['Apa yang paling menantang, dan bagaimana aku menghadapinya?', 'Tantangan hari ini: '],
    ['Satu hal yang aku pelajari hari ini.', 'Yang aku pelajari: '],
    ['Satu hal yang aku syukuri.', 'Aku bersyukur: '],
    ['Apa fokus utamaku besok?', 'Fokus besok: ']
  ];
  const timeOf = iso => iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  let saveTimer = null, query = '';

  function counter(text, min) {
    const n = C.countSentences(text);
    const pct = Math.min(1, n / min);
    return `<div class="row" style="gap:10px;align-items:center"><div style="flex:1">${UI.bar(pct, { cls: n >= min ? 'good' : '' })}</div>
      <b class="small ${n >= min ? 'good' : ''}" id="jCount">${n}/${min} kalimat</b></div>`;
  }

  App.pages.journal = {
    title: 'Jurnal',
    render() {
      const s = App.S(), k = C.dateKey(), min = s.settings.journalMinSentences || 5;
      const e = C.journalEntry(s, k) || { text: '', mood: 0 };
      const done = C.journalDone(s, k);
      const start = C.addDays(k, -29) < s.createdAt ? s.createdAt : C.addDays(k, -29);
      const days = C.rangeKeys(start, k);
      const all = Object.keys(s.journal.entries).filter(d => (s.journal.entries[d].text || '').trim()).sort().reverse();
      const q = query.trim().toLowerCase();
      const list = all.filter(d => d !== k && (!q || s.journal.entries[d].text.toLowerCase().includes(q)));
      return `<div class="card">
          <div class="row"><div style="flex:1"><h3>${esc(C.formatDate(k))}</h3><p class="muted small">Tulis sekitar ${min} kalimat sebelum tidur. Tersimpan otomatis.</p></div>
            ${done ? `<span class="pill good">${icon('check', 12)}Selesai</span>` : ''}</div>
          <div style="margin:12px 0;display:grid;grid-template-columns:repeat(5,1fr);gap:6px" role="group" aria-label="Mood hari ini">${MOODS.map(([v, l]) => `<button class="chip ${e.mood === v ? 'active' : ''}" style="justify-content:center;padding:8px 4px" data-act="jMood" data-v="${v}">${l}</button>`).join('')}</div>
          <textarea id="jText" rows="7" placeholder="Hari ini aku…" style="width:100%">${esc(e.text)}</textarea>
          <div style="margin-top:10px" id="jCounter">${counter(e.text, min)}</div>
          <p class="tiny muted" id="jSaved" style="margin-top:6px">${e.updatedAt ? 'Tersimpan ' + timeOf(e.updatedAt) : ''}</p>
          <details style="margin-top:10px"><summary class="small muted">Butuh ide? Pertanyaan pemandu</summary>
            <div class="stack" style="margin-top:8px;gap:6px">${PROMPTS.map((p, i) => `<button class="btn sm ghost" style="justify-content:flex-start;text-align:left;white-space:normal;height:auto;padding-top:8px;padding-bottom:8px" data-act="jPrompt" data-i="${i}">${icon('plus', 13)}${esc(p[0])}</button>`).join('')}</div>
          </details>
          <button class="btn block primary" style="margin-top:12px" data-act="jSave">${icon('check', 16)}Simpan jurnal</button>
        </div>
        <div class="kpis" style="margin-top:14px;grid-template-columns:repeat(3,1fr)">
          <div class="kpi"><small>Streak</small><b>${C.journalStreak(s)}</b><span>malam</span></div>
          <div class="kpi"><small>30 hari</small><b>${days.filter(d => C.journalDone(s, d)).length}/${days.length}</b></div>
          <div class="kpi"><small>Total</small><b>${C.journalDays(s)}</b><span>jurnal</span></div>
        </div>
        <div class="card" style="margin-top:14px">${UI.heatmap(days.map(d => ({ v: C.journalDone(s, d) ? 1 : (C.journalEntry(s, d) ? 0.4 : 0), title: d })))}</div>
        <div class="row" style="margin-top:18px;align-items:center"><h3 style="flex:1">Jurnal sebelumnya</h3></div>
        ${all.length > 1 ? `<input id="jSearch" type="search" placeholder="Cari kata di jurnal…" value="${esc(query)}" style="width:100%;margin:10px 0">` : ''}
        <div class="stack">${list.slice(0, 60).map(d => {
          const x = s.journal.entries[d]; const m = MOODS.find(([v]) => v === x.mood);
          return `<div class="card flat" data-act="jOpen" data-date="${d}" style="cursor:pointer">
            <div class="row"><b style="flex:1">${esc(C.formatDate(d, { short: true }))}</b>${m ? `<span class="pill">${m[1]}</span>` : ''}<span class="tiny muted">${C.countSentences(x.text)} kalimat</span></div>
            <p class="small muted" style="margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(x.text)}</p></div>`;
        }).join('') || `<div class="card empty">${q ? 'Tidak ada jurnal yang cocok.' : 'Belum ada jurnal sebelumnya.'}</div>`}</div>
        <p class="tiny muted" style="margin-top:14px">Jurnal hanya tersimpan di perangkat ini dan ikut dalam file backup. Tidak pernah tampil di notifikasi.</p>`;
    },
    mount(view) {
      const ta = view.querySelector('#jText');
      if (ta) ta.addEventListener('input', () => {
        const min = App.S().settings.journalMinSentences || 5;
        view.querySelector('#jCounter').innerHTML = counter(ta.value, min);
        view.querySelector('#jSaved').textContent = 'Mengetik…';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => save(ta.value, { render: false }), 900);
      });
      const sr = view.querySelector('#jSearch');
      if (sr) sr.addEventListener('input', () => {
        query = sr.value;
        const pos = sr.selectionStart;
        App.render();
        const n = document.querySelector('#jSearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
      });
    }
  };

  function save(text, { render = true, mood } = {}) {
    clearTimeout(saveTimer);
    const k = C.dateKey();
    App.commit(s => {
      const cur = s.journal.entries[k] || { text: '', mood: 0, at: new Date().toISOString() };
      cur.text = String(text).replace(/\s+$/, '');
      if (mood !== undefined) cur.mood = mood;
      cur.updatedAt = new Date().toISOString();
      if (!cur.text.trim() && !cur.mood) delete s.journal.entries[k]; else s.journal.entries[k] = cur;
    }, { render, quiet: !render });
    if (!render) { const el = document.querySelector('#jSaved'); if (el) el.textContent = 'Tersimpan ' + timeOf(new Date().toISOString()); }
  }
  const curText = () => { const ta = document.querySelector('#jText'); return ta ? ta.value : ((C.journalEntry(App.S(), C.dateKey()) || {}).text || ''); };

  Object.assign(App.actions, {
    jSave: () => {
      const s = App.S(), min = s.settings.journalMinSentences || 5, n = C.countSentences(curText());
      save(curText());
      UI.toast(n >= min ? 'Jurnal tersimpan. Selamat istirahat.' : 'Tersimpan. ' + (min - n) + ' kalimat lagi untuk menyelesaikan habit.', n >= min ? 'good' : 'info');
    },
    jMood: (el) => { const v = +el.dataset.v; const e = C.journalEntry(App.S(), C.dateKey()); save(curText(), { mood: e && e.mood === v ? 0 : v }); },
    jPrompt: (el) => {
      const ta = document.querySelector('#jText'); if (!ta) return;
      const p = PROMPTS[+el.dataset.i][1];
      ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n' : '') + p;
      ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.dispatchEvent(new Event('input'));
    },
    jOpen: async (el) => {
      const d = el.dataset.date, x = C.journalEntry(App.S(), d); if (!x) return;
      const v = await UI.formModal({ title: 'Jurnal · ' + C.formatDate(d, { short: true }), fields: [
        { name: 'mood', label: 'Mood', type: 'select', value: String(x.mood || 0), options: [{ value: '0', label: '—' }].concat(MOODS.map(([v, l]) => ({ value: String(v), label: l }))) },
        { name: 'text', label: 'Isi jurnal', type: 'textarea', rows: 9, value: x.text }],
        submitLabel: 'Simpan', extraActions: [{ id: 'del', label: 'Hapus', cls: 'danger' }] });
      if (!v) return;
      if (v.__action === 'del') {
        if (!(await UI.confirmDialog('Hapus jurnal tanggal ini? Tidak bisa dikembalikan (kecuali dari backup).', { danger: true, ok: 'Hapus' }))) return;
        return App.commit(s => { delete s.journal.entries[d]; }, { quiet: true });
      }
      App.commit(s => { Object.assign(s.journal.entries[d], { text: v.text, mood: +v.mood || 0, updatedAt: new Date().toISOString() }); }, { quiet: true });
    }
  });
})();
