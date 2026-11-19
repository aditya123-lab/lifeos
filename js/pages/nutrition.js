/* LIFE OS — Nutrition Command Center */
(function () {
  const C = LifeCore, UI = window.UI, { esc, icon, fmt } = UI;
  const TABS = [['day', 'Hari ini'], ['foods', 'Database'], ['templates', 'Favorit & Template'], ['history', 'Riwayat'], ['targets', 'Target']];
  const tabs = cur => `<div class="tabs">${TABS.map(([id, l]) => `<a href="#/nutrition/${id}" class="${cur === id ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  const allFoods = s => s.nutrition.customFoods.concat(C.FOOD_DB);
  const GOALS = { bulking: 'Muscle gain / bulking', maintain: 'Maintenance', cutting: 'Cutting / defisit' };
  const ESTIMATE_NOTE = '<p class="note-box" style="margin-top:14px">' + icon('info', 14) + ' Semua nilai gizi adalah <b>estimasi</b> (database bawaan didekati dari USDA FoodData Central; hidangan bersantan/gorengan bervariasi per resep). Bukan hasil uji laboratorium. Untuk produk kemasan gunakan label gizi, dan untuk makanan lokal verifikasi dengan TKPI (Tabel Komposisi Pangan Indonesia).</p>';
  const dayRec = (s, k) => (s.nutrition.days[k] = s.nutrition.days[k] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, water: 0 });

  function macroBars(s, totals, water) {
    const t = s.nutrition.targets;
    const row = (lbl, v, tgt, unit, color) => { const left = tgt - v; return `<div class="macro"><span class="lbl">${lbl}</span><span class="val">${fmt(v)} / ${fmt(tgt)} ${unit} · <b class="${left < 0 ? 'warn' : ''}">${left >= 0 ? 'sisa ' + fmt(left) : 'lebih ' + fmt(-left)}</b></span>${UI.bar(v / tgt, { color })}</div>`; };
    return row('Kalori', totals.kcal, t.kcal, 'kkal', 'var(--grad)') + row('Protein', totals.p, t.p, 'g', '#3ecf8e') + row('Karbohidrat', totals.c, t.c, 'g', '#5b8cff') + row('Lemak', totals.f, t.f, 'g', '#f5a524') + row('Air', water, t.water, 'ml', '#4fc3f7');
  }

  function day(dateK) {
    const s = App.S(), today = C.dateKey(), k = dateK || today;
    const d = s.nutrition.days[k] || { meals: {}, water: 0 };
    const nd = C.nutritionDay(s, k);
    const cups = Math.round(s.nutrition.targets.water / 250);
    return `
      <div class="card row" style="gap:8px"><button class="icon-btn" data-act="go" data-to="nutrition/day/${C.addDays(k, -1)}">${icon('left')}</button>
        <div style="flex:1;text-align:center"><b>${k === today ? 'Hari ini' : C.formatDate(k, { weekday: true })}</b><div class="muted small">Tujuan: ${esc(GOALS[s.nutrition.goal] || s.nutrition.goal)}</div></div>
        <button class="icon-btn" ${k >= today ? 'disabled style="opacity:.3"' : ''} data-act="go" data-to="nutrition/day/${C.addDays(k, 1) > today ? today : C.addDays(k, 1)}">${icon('right')}</button></div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><div class="row" style="gap:16px;margin-bottom:14px">${UI.ring(nd.totals.kcal / s.nutrition.targets.kcal, { size: 86, stroke: 8, label: fmt(nd.totals.kcal), sub: 'kkal' })}
          <div class="preview-n" style="flex:1;margin:0;grid-template-columns:repeat(3,1fr)"><div><b>${fmt(nd.totals.p)}</b><small>Protein g</small></div><div><b>${fmt(nd.totals.c)}</b><small>Karbo g</small></div><div><b>${fmt(nd.totals.f)}</b><small>Lemak g</small></div></div></div>
          ${macroBars(s, nd.totals, nd.water)}</div>
        <div class="card"><div class="card-head">${icon('drop', 18)}<h3>Air minum</h3><span class="num small muted">${fmt(nd.water)} / ${fmt(s.nutrition.targets.water)} ml</span></div>
          <div class="water-cups">${Array.from({ length: cups }, (_, i) => `<i class="${(i + 1) * 250 <= nd.water ? 'full' : ''}"></i>`).join('')}</div>
          <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-act="water" data-ml="250" data-date="${k}">+250 ml</button><button class="btn sm" data-act="water" data-ml="500" data-date="${k}">+500 ml</button><button class="btn sm" data-act="water" data-ml="custom" data-date="${k}">Kustom</button><button class="btn sm ghost" data-act="water" data-ml="-250" data-date="${k}">−250</button></div>
          <p class="tiny muted" style="margin-top:10px">Tracking makan dianggap lengkap jika ${s.settings.mealsRequired} waktu makan utama terisi (${nd.mealsLogged}/${s.settings.mealsRequired}).</p></div>
      </div>
      ${C.MEALS.map(m => { const items = (d.meals && d.meals[m.id]) || []; const sum = C.sumNutrients(items);
        return `<div class="section-title">${m.label}<span class="spacer"></span><span class="num">${fmt(sum.kcal)} kkal · P ${fmt(sum.p)}g</span></div>
        <div class="card tight"><div class="list">${items.map(it => `<div class="li" data-act="entryEdit" data-id="${it.id}" data-meal="${m.id}" data-date="${k}" style="cursor:pointer"><div class="li-main"><div class="li-title">${esc(it.name)}</div><div class="li-sub">${fmt(it.grams)} g · P ${it.p} · K ${it.c} · L ${it.f}${it.src === 'Perkiraan' ? ' · ±' : ''}</div></div><b class="num small">${fmt(it.kcal)}</b></div>`).join('')}</div>
          <div class="row wrap" style="margin-top:${items.length ? 8 : 0}px"><button class="btn sm" data-act="foodAdd" data-meal="${m.id}" data-date="${k}">${icon('plus', 14)}Tambah</button>${s.nutrition.favorites.length ? `<button class="btn sm ghost" data-act="tplUse" data-meal="${m.id}" data-date="${k}">${icon('star', 14)}Template</button>` : ''}${items.length ? `<button class="btn sm ghost" data-act="tplSave" data-meal="${m.id}" data-date="${k}">Simpan sbg template</button>` : ''}</div></div>`; }).join('')}
      ${ESTIMATE_NOTE}`;
  }

  function foods() {
    const s = App.S(), q = (App._foodQ || '').toLowerCase();
    const list = allFoods(s).filter(f => !q || f.name.toLowerCase().includes(q));
    return `<div class="row" style="margin-bottom:12px"><div class="search" style="flex:1">${icon('search', 16)}<input type="search" placeholder="Cari makanan…" value="${esc(App._foodQ || '')}" data-inp="foodQ"></div><button class="btn primary" data-act="foodEdit">${icon('plus', 16)}Kustom</button></div>
      <div class="card tight scroll-x"><table class="tbl"><thead><tr><th>Makanan (per 100 g)</th><th class="r">kkal</th><th class="r">P</th><th class="r">K</th><th class="r">L</th></tr></thead><tbody id="foodRows">
      ${list.map(f => `<tr data-act="foodEdit" data-id="${f.id}" style="cursor:pointer"><td>${esc(f.name)} ${f.builtin ? `<span class="pill">${f.src}</span>` : '<span class="pill accent">Kustom</span>'}</td><td class="r">${fmt(f.kcal)}</td><td class="r">${f.p}</td><td class="r">${f.c}</td><td class="r">${f.f}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Tidak ditemukan. Tambah sebagai makanan kustom.</td></tr>'}</tbody></table></div>${ESTIMATE_NOTE}`;
  }

  function templates() {
    const s = App.S();
    return `<p class="muted small" style="margin-bottom:12px">Simpan menu yang sering dimakan sebagai template (tombol "Simpan sbg template" di tab Hari ini), lalu tambahkan dengan satu ketukan.</p>
      <div class="stack">${s.nutrition.favorites.map(t => { const sum = C.sumNutrients(t.items); return `<div class="card"><div class="row between"><div><b>${esc(t.name)}</b><p class="muted small">${t.items.length} item · ${fmt(sum.kcal)} kkal · P ${fmt(sum.p)} g</p></div><button class="icon-btn" data-act="tplDel" data-id="${t.id}">${icon('trash', 16)}</button></div><p class="small muted" style="margin-top:6px">${t.items.map(i => esc(i.name) + ' ' + i.grams + 'g').join(' · ')}</p></div>`; }).join('') || '<div class="card empty">' + icon('star', 28) + 'Belum ada template.</div>'}</div>`;
  }

  function history() {
    const s = App.S(), k = C.dateKey(), t = s.nutrition.targets;
    const d14 = C.rangeKeys(C.addDays(k, -13), k).map(d => ({ d, n: C.nutritionDay(s, d) }));
    const kcal = d14.map(({ d, n }) => ({ label: d, short: d.slice(8), value: n.totals.kcal, color: n.totals.kcal >= t.kcal * .9 && n.totals.kcal <= t.kcal * 1.1 ? 'var(--good)' : undefined }));
    const prot = d14.map(({ d, n }) => ({ label: d, short: d.slice(8), value: n.totals.p }));
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const dt = C.parseKey(k); dt.setDate(1); dt.setMonth(dt.getMonth() - i);
      const from = C.dateKey(dt), endD = new Date(dt.getFullYear(), dt.getMonth() + 1, 0), to = C.dateKey(endD) > k ? k : C.dateKey(endD);
      const logged = C.rangeKeys(from, to).map(x => C.nutritionDay(s, x)).filter(n => n.items > 0);
      const avg = f => logged.length ? logged.reduce((a, n) => a + n.totals[f], 0) / logged.length : 0;
      months.push({ name: C.MONTHS[dt.getMonth()] + ' ' + dt.getFullYear(), days: logged.length, complete: C.rangeKeys(from, to).filter(x => C.nutritionDay(s, x).mealsLogged >= s.settings.mealsRequired).length, kcal: avg('kcal'), p: avg('p') });
    }
    const ws = C.startOfWeek(k), weeks = [];
    for (let i = 3; i >= 0; i--) { const w = C.addDays(ws, -7 * i); const ds = C.rangeKeys(w, C.addDays(w, 6)).filter(x => x <= k).map(x => C.nutritionDay(s, x)).filter(n => n.items); weeks.push({ w, days: ds.length, kcal: ds.length ? ds.reduce((a, n) => a + n.totals.kcal, 0) / ds.length : 0, p: ds.length ? ds.reduce((a, n) => a + n.totals.p, 0) / ds.length : 0 }); }
    return `<div class="grid two"><div class="card"><div class="card-head">${icon('chart', 18)}<h3>Kalori 14 hari</h3><span class="tiny muted">hijau = ±10% target</span></div>${UI.barChart(kcal, { goal: t.kcal })}</div>
      <div class="card"><div class="card-head">${icon('chart', 18)}<h3>Protein 14 hari (g)</h3></div>${UI.barChart(prot, { goal: t.p, color: '#3ecf8e' })}</div></div>
      <div class="section-title">Mingguan (rata-rata hari yang dicatat)</div>
      <div class="card tight scroll-x"><table class="tbl"><thead><tr><th>Minggu</th><th class="r">Hari dicatat</th><th class="r">Rata kkal</th><th class="r">Rata protein</th></tr></thead><tbody>${weeks.map(w => `<tr><td>${C.formatDate(w.w, { short: true, year: false })}</td><td class="r">${w.days}/7</td><td class="r">${fmt(w.kcal)}</td><td class="r">${fmt(w.p)} g</td></tr>`).join('')}</tbody></table></div>
      <div class="section-title">Bulanan</div>
      <div class="card tight scroll-x"><table class="tbl"><thead><tr><th>Bulan</th><th class="r">Hari dicatat</th><th class="r">Lengkap</th><th class="r">Rata kkal</th><th class="r">Rata protein</th></tr></thead><tbody>${months.map(m => `<tr><td>${m.name}</td><td class="r">${m.days}</td><td class="r">${m.complete}</td><td class="r">${fmt(m.kcal)}</td><td class="r">${fmt(m.p)} g</td></tr>`).join('')}</tbody></table></div>`;
  }

  function targets() {
    const s = App.S(), t = s.nutrition.targets;
    const lastBw = s.fitness.bodyweight.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    return `<form class="card" data-submit="targetsSave"><div class="card-head">${icon('target', 18)}<h3>Target harian</h3></div><div class="form-grid">
        ${UI.field({ name: 'goal', label: 'Tujuan nutrisi', type: 'select', value: s.nutrition.goal, options: Object.entries(GOALS).map(([value, label]) => ({ value, label })) })}
        ${UI.field({ name: 'kcal', label: 'Kalori (kkal)', type: 'number', half: true, min: 800, max: 8000, value: t.kcal })}${UI.field({ name: 'p', label: 'Protein (g)', type: 'number', half: true, min: 0, max: 500, value: t.p })}
        ${UI.field({ name: 'c', label: 'Karbohidrat (g)', type: 'number', half: true, min: 0, max: 1200, value: t.c })}${UI.field({ name: 'f', label: 'Lemak (g)', type: 'number', half: true, min: 0, max: 400, value: t.f })}
        ${UI.field({ name: 'water', label: 'Air (ml)', type: 'number', half: true, min: 500, max: 8000, step: 250, value: t.water })}${UI.field({ name: 'mealsRequired', label: 'Waktu makan utama untuk "lengkap"', type: 'number', half: true, min: 1, max: 3, value: s.settings.mealsRequired })}
      </div><p class="tiny muted" style="margin:8px 0 12px">Cek konsistensi: protein×4 + karbo×4 + lemak×9 =${fmt(t.p * 4 + t.c * 4 + t.f * 9)} kkal dari makro saat ini.</p><button class="btn primary block">Simpan target</button></form>
      <form class="card" style="margin-top:14px" data-submit="calcTargets"><div class="card-head">${icon('spark', 18)}<h3>Kalkulator saran target</h3></div>
        <p class="muted small" style="margin-bottom:12px">Rumus Mifflin-St Jeor + faktor aktivitas. Hasilnya hanya <b>saran</b> — target tidak akan berubah sebelum kamu menekan "Terapkan".</p>
        <div class="form-grid">${UI.field({ name: 'sex', label: 'Jenis kelamin', type: 'select', half: true, value: 'm', options: [{ value: 'm', label: 'Laki-laki' }, { value: 'f', label: 'Perempuan' }] })}${UI.field({ name: 'age', label: 'Usia', type: 'number', half: true, min: 14, max: 90 })}
        ${UI.field({ name: 'weight', label: 'Berat (kg)', type: 'number', half: true, step: 0.1, value: lastBw ? lastBw.kg : '' })}${UI.field({ name: 'height', label: 'Tinggi (cm)', type: 'number', half: true })}
        ${UI.field({ name: 'activity', label: 'Aktivitas', type: 'select', value: '1.55', options: [{ value: '1.375', label: 'Ringan (olahraga 1–3×/minggu)' }, { value: '1.55', label: 'Sedang (3–5×/minggu)' }, { value: '1.725', label: 'Tinggi (6–7×/minggu)' }] })}
        ${UI.field({ name: 'goal', label: 'Tujuan', type: 'select', value: s.nutrition.goal, options: Object.entries(GOALS).map(([value, label]) => ({ value, label })) })}</div>
        <button class="btn block" style="margin-top:12px">Hitung saran</button></form>`;
  }

  App.pages.nutrition = { title: 'Nutrisi', render(p) { const t = p[0] || 'day'; return tabs(t) + (t === 'day' ? day(p[1]) : ({ foods, templates, history, targets }[t] || day)()); } };

  // ---------------------------------------------------------- add food modal
  function addFood(meal, k) {
    const s = App.S();
    let sel = null;
    const mealOpts = C.MEALS.map(m => ({ value: m.id, label: m.label }));
    const body = `<div class="search">${icon('search', 16)}<input type="search" id="fq" placeholder="Cari: nasi, ayam, tempe, telur…" autocomplete="off"></div>
      <div class="food-res" id="fres"></div>
      <div id="fdetail" hidden style="margin-top:12px"><b id="fname"></b> <span class="pill" id="fsrc"></span>
        <div class="row wrap" id="fport" style="margin:10px 0"></div>
        <div class="form-grid">${UI.field({ name: 'grams', label: 'Berat (gram)', type: 'number', half: true, min: 1, max: 3000, value: 100, inputmode: 'decimal' })}${UI.field({ name: 'meal', label: 'Waktu makan', type: 'select', half: true, value: meal, options: mealOpts })}</div>
        <div class="preview-n" id="fprev"></div></div>
      <div class="divider"></div><button type="button" class="btn sm ghost" id="fmanual">${icon('edit', 14)}Input manual (tanpa database)</button>`;
    UI.modal({ title: 'Tambah makanan', wide: true, body, actions: [{ label: 'Batal', cls: 'ghost' }, { label: 'Tambah', cls: 'primary', onClick: (wrap) => {
      if (!sel) { UI.toast('Pilih makanan dulu', 'error'); return false; }
      const g = +UI.$('[name=grams]', wrap).value; if (!(g > 0)) { UI.toast('Isi berat dalam gram', 'error'); return false; }
      const m = UI.$('[name=meal]', wrap).value;
      App.commit(st => { const d = dayRec(st, k); (d.meals[m] = d.meals[m] || []).push(Object.assign({ id: C.uid('fe'), foodId: sel.id, name: sel.name, grams: g, src: sel.src || 'Kustom' }, C.nutrientsFor(sel, g))); });
    } }], onOpen: (wrap, close) => {
      const q = UI.$('#fq', wrap), res = UI.$('#fres', wrap), grams = UI.$('[name=grams]', wrap);
      const list = () => { const v = q.value.toLowerCase().trim(); const fs = allFoods(s).filter(f => !v || f.name.toLowerCase().includes(v)).slice(0, 40);
        res.innerHTML = fs.map(f => `<button type="button" data-fid="${f.id}" class="${sel && sel.id === f.id ? 'sel' : ''}"><span style="flex:1">${esc(f.name)}</span><span class="tiny muted">${fmt(f.kcal)} kkal/100g</span></button>`).join('') || '<div class="empty small">Tidak ditemukan — gunakan input manual.</div>'; };
      const prev = () => { if (!sel) return; const n = C.nutrientsFor(sel, +grams.value || 0); UI.$('#fprev', wrap).innerHTML = `<div><b>${fmt(n.kcal)}</b><small>kkal</small></div><div><b>${n.p}</b><small>protein g</small></div><div><b>${n.c}</b><small>karbo g</small></div><div><b>${n.f}</b><small>lemak g</small></div>`; };
      list(); q.addEventListener('input', list); grams.addEventListener('input', prev);
      res.addEventListener('click', e => { const b = e.target.closest('[data-fid]'); if (!b) return; sel = allFoods(s).find(f => f.id === b.dataset.fid);
        UI.$('#fdetail', wrap).hidden = false; UI.$('#fname', wrap).textContent = sel.name; UI.$('#fsrc', wrap).textContent = sel.builtin ? 'Estimasi · ' + sel.src : 'Kustom';
        UI.$('#fport', wrap).innerHTML = (sel.portions || []).concat([{ label: '100 g', g: 100 }]).map(p => `<button type="button" class="btn sm" data-g="${p.g}">${esc(p.label)} (${p.g} g)</button>`).join('');
        if (sel.portions && sel.portions[0]) grams.value = sel.portions[0].g; list(); prev(); });
      UI.$('#fport', wrap).addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { grams.value = b.dataset.g; prev(); } });
      UI.$('#fmanual', wrap).addEventListener('click', () => { close(); setTimeout(() => manualEntry(meal, k), 220); });
      if (window.innerWidth > 700) q.focus();
    } });
  }
  async function manualEntry(meal, k) {
    const v = await UI.formModal({ title: 'Input manual', intro: '<p class="muted small" style="margin-bottom:10px">Isi nilai untuk porsi yang kamu makan (bukan per 100 g). Gunakan label gizi jika ada.</p>', fields: [
      { name: 'name', label: 'Nama makanan', required: true }, { name: 'grams', label: 'Berat (g)', type: 'number', half: true, min: 1, required: true },
      { name: 'meal', label: 'Waktu makan', type: 'select', half: true, value: meal, options: C.MEALS.map(m => ({ value: m.id, label: m.label })) },
      { name: 'kcal', label: 'Kalori', type: 'number', half: true, min: 0, required: true }, { name: 'p', label: 'Protein (g)', type: 'number', half: true, min: 0, step: 0.1, value: 0 },
      { name: 'c', label: 'Karbo (g)', type: 'number', half: true, min: 0, step: 0.1, value: 0 }, { name: 'f', label: 'Lemak (g)', type: 'number', half: true, min: 0, step: 0.1, value: 0 },
      { name: 'save', label: 'Simpan juga ke database makanan kustom', type: 'checkbox', value: true }] });
    if (!v) return;
    App.commit(st => {
      const d = dayRec(st, k); let foodId = '';
      if (v.save) { const r = 100 / v.grams; const f = { id: C.uid('cf'), name: v.name, kcal: Math.round(v.kcal * r), p: C.round1(v.p * r), c: C.round1(v.c * r), f: C.round1(v.f * r), src: 'Kustom', portions: [{ label: '1 porsi', g: v.grams }] }; st.nutrition.customFoods.push(f); foodId = f.id; }
      (d.meals[v.meal] = d.meals[v.meal] || []).push({ id: C.uid('fe'), foodId, name: v.name, grams: v.grams, kcal: Math.round(v.kcal), p: C.round1(v.p), c: C.round1(v.c), f: C.round1(v.f), src: 'Kustom' });
    });
  }

  Object.assign(App.actions, {
    foodAdd: (el) => addFood(el.dataset.meal, el.dataset.date),
    foodQ: (el) => { App._foodQ = el.value; const pos = el.selectionStart; App.render(); const n = UI.$('[data-inp=foodQ]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} } },
    water: async (el) => {
      let ml = el.dataset.ml;
      if (ml === 'custom') { const v = await UI.formModal({ title: 'Tambah air', fields: [{ name: 'ml', label: 'Jumlah (ml)', type: 'number', min: 1, max: 3000, value: 330, required: true }] }); if (!v) return; ml = v.ml; }
      App.commit(s => { const d = dayRec(s, el.dataset.date); d.water = Math.max(0, (d.water || 0) + (+ml)); });
    },
    entryEdit: async (el) => {
      const s = App.S(); const k = el.dataset.date, meal = el.dataset.meal;
      const it = ((s.nutrition.days[k] || {}).meals || {})[meal].find(x => x.id === el.dataset.id);
      const v = await UI.formModal({ title: it.name, fields: [{ name: 'grams', label: 'Porsi (gram)', type: 'number', min: 1, value: it.grams, required: true }, { name: 'meal', label: 'Pindah ke', type: 'select', value: meal, options: C.MEALS.map(m => ({ value: m.id, label: m.label })) }],
        intro: `<p class="muted small" style="margin-bottom:10px">${fmt(it.kcal)} kkal · P ${it.p} g · K ${it.c} g · L ${it.f} g (estimasi)</p>`, extraActions: [{ id: 'del', label: 'Hapus', cls: 'danger' }] });
      if (!v) return;
      App.commit(st => {
        const d = dayRec(st, k); d.meals[meal] = d.meals[meal].filter(x => x.id !== it.id);
        if (v.__action === 'del') return;
        const food = allFoods(st).find(f => f.id === it.foodId);
        const n = food ? C.nutrientsFor(food, v.grams) : { kcal: Math.round(it.kcal * v.grams / it.grams), p: C.round1(it.p * v.grams / it.grams), c: C.round1(it.c * v.grams / it.grams), f: C.round1(it.f * v.grams / it.grams) };
        (d.meals[v.meal] = d.meals[v.meal] || []).push(Object.assign({}, it, n, { grams: v.grams }));
      });
    },
    foodEdit: async (el) => {
      const s = App.S(); const f = el.dataset.id ? allFoods(s).find(x => x.id === el.dataset.id) : null;
      const builtin = f && f.builtin;
      const v = await UI.formModal({ title: builtin ? 'Salin & sesuaikan' : f ? 'Edit makanan' : 'Makanan kustom', intro: `<p class="muted small" style="margin-bottom:10px">${builtin ? 'Data bawaan tidak diubah. Menyimpan akan membuat salinan kustom yang bisa kamu sesuaikan (mis. dari TKPI atau label).' : 'Nilai per 100 gram.'}</p>`,
        fields: [{ name: 'name', label: 'Nama', value: f ? f.name + (builtin ? ' (kustom)' : '') : '', required: true }, { name: 'kcal', label: 'Kalori /100g', type: 'number', half: true, min: 0, value: f ? f.kcal : '', required: true },
          { name: 'p', label: 'Protein /100g', type: 'number', half: true, step: 0.1, min: 0, value: f ? f.p : 0 }, { name: 'c', label: 'Karbo /100g', type: 'number', half: true, step: 0.1, min: 0, value: f ? f.c : 0 }, { name: 'f', label: 'Lemak /100g', type: 'number', half: true, step: 0.1, min: 0, value: f ? f.f : 0 },
          { name: 'portion', label: 'Porsi default (gram, opsional)', type: 'number', half: true, min: 1, value: f && f.portions && f.portions[0] ? f.portions[0].g : '' }],
        extraActions: f && !builtin ? [{ id: 'del', label: 'Hapus', cls: 'danger' }] : [] });
      if (!v) return;
      App.commit(st => {
        if (v.__action === 'del') { st.nutrition.customFoods = st.nutrition.customFoods.filter(x => x.id !== f.id); return; }
        const rec = { name: v.name, kcal: +v.kcal, p: +v.p, c: +v.c, f: +v.f, src: 'Kustom', portions: v.portion ? [{ label: '1 porsi', g: +v.portion }] : [] };
        if (f && !builtin) Object.assign(st.nutrition.customFoods.find(x => x.id === f.id), rec); else st.nutrition.customFoods.push(Object.assign({ id: C.uid('cf') }, rec));
      }, { quiet: true });
    },
    tplSave: async (el) => {
      const s = App.S(); const items = ((s.nutrition.days[el.dataset.date] || {}).meals || {})[el.dataset.meal] || [];
      const v = await UI.formModal({ title: 'Simpan sebagai template', fields: [{ name: 'name', label: 'Nama template', required: true, placeholder: 'mis. Sarapan bulking standar' }] });
      if (v) App.commit(st => st.nutrition.favorites.push({ id: C.uid('tpl'), name: v.name, items: items.map(i => Object.assign({}, i, { id: undefined })) }), { quiet: true }), UI.toast('Template disimpan', 'good');
    },
    tplUse: async (el) => {
      const s = App.S();
      const v = await UI.formModal({ title: 'Tambah dari template', fields: [{ name: 'tpl', label: 'Template', type: 'select', options: s.nutrition.favorites.map(t => ({ value: t.id, label: `${t.name} (${fmt(C.sumNutrients(t.items).kcal)} kkal)` })) }] });
      if (!v) return;
      const t = s.nutrition.favorites.find(x => x.id === v.tpl);
      App.commit(st => { const d = dayRec(st, el.dataset.date); const m = el.dataset.meal; d.meals[m] = (d.meals[m] || []).concat(t.items.map(i => Object.assign({}, i, { id: C.uid('fe') }))); });
    },
    tplDel: (el) => App.commit(s => { s.nutrition.favorites = s.nutrition.favorites.filter(x => x.id !== el.dataset.id); }, { quiet: true }),
    targetsSave: (f) => {
      const n = name => +f[name].value;
      if (!(n('kcal') > 0 && n('water') > 0)) return UI.toast('Isi target dengan benar', 'error');
      App.commit(s => { s.nutrition.goal = f.goal.value; s.nutrition.targets = { kcal: n('kcal'), p: n('p'), c: n('c'), f: n('f'), water: n('water') }; s.settings.mealsRequired = Math.min(3, Math.max(1, n('mealsRequired') || 3)); }, { quiet: true });
      UI.toast('Target nutrisi disimpan', 'good');
    },
    calcTargets: async (f) => {
      const r = C.suggestTargets({ sex: f.sex.value, age: +f.age.value, weight: +f.weight.value, height: +f.height.value, activity: +f.activity.value, goal: f.goal.value });
      if (!r) return UI.toast('Isi usia, berat, dan tinggi', 'error');
      const ok = await UI.confirmDialog(`Saran: ${fmt(r.kcal)} kkal · protein ${r.p} g · karbo ${r.c} g · lemak ${r.f} g (BMR ≈ ${fmt(r.bmr)}, TDEE ≈ ${fmt(r.tdee)}). Ini estimasi populasi umum, bukan resep medis. Terapkan ke target?`, { title: 'Saran target', ok: 'Terapkan' });
      if (ok) App.commit(s => { s.nutrition.goal = f.goal.value; Object.assign(s.nutrition.targets, { kcal: r.kcal, p: r.p, c: r.c, f: r.f }); }, { quiet: true }), UI.toast('Target diperbarui', 'good');
    }
  });
})();
