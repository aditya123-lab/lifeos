/* LIFE OS — ui.js : DOM helpers, icons, modals, forms, toasts, charts, badges. */
(function (root) {
  'use strict';
  const C = root.LifeCore;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.round(+n || 0).toLocaleString('id-ID');
  const pct = (x) => Math.round((x || 0) * 100) + '%';

  // ------------------------------------------------------------- icons (stroke, 24x24)
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 20.5A1.5 1.5 0 0 0 5.5 22H20"/><path d="M9 7h7"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z"/><path d="M4 20c4-6 8-9 12-11"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4.3 3 7 7 7z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
    pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m8.5 8.5 7 7"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sunrise: '<path d="M17 18a5 5 0 0 0-10 0M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    drop: '<path d="M12 2.7s7 7 7 12.3a7 7 0 0 1-14 0C5 9.7 12 2.7 12 2.7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    skip: '<path d="M5 4l10 8-10 8z"/><path d="M19 5v14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M17.9 17.9A10 10 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 4.1-5.1M9.9 5.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    crown: '<path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 2h4l2 5 2-5h4l-2.5 7.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'
  };
  function icon(name, size = 20, cls = '') {
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.spark}</svg>`;
  }

  // ------------------------------------------------------------- toast
  function toast(msg, type = 'info', ms = 2600) {
    let host = $('#toasts');
    if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = (type === 'xp' ? icon('bolt', 16) : type === 'error' ? icon('info', 16) : icon('check', 16)) + '<span>' + esc(msg) + '</span>';
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, ms);
  }

  // ------------------------------------------------------------- modal
  function modal({ title = '', body = '', actions = [], onOpen, wide = false, cls = '' }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button></div>
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="modal-actions">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
    </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => wrap.classList.add('show'));
    const close = () => {
      wrap.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => { wrap.remove(); if (!$('.modal-wrap')) document.body.classList.remove('no-scroll'); }, 200);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-close]')) return close();
      const b = e.target.closest('.modal-actions [data-i]');
      if (b) { const a = actions[+b.dataset.i]; const r = a.onClick ? a.onClick(wrap, close) : undefined; if (r !== false) close(); }
    });
    if (onOpen) onOpen(wrap, close);
    return { el: wrap, close };
  }
  function confirmDialog(message, { title = 'Konfirmasi', ok = 'Ya, lanjutkan', danger = false } = {}) {
    return new Promise(res => {
      let done = false;
      const m = modal({
        title, body: `<p class="muted">${esc(message)}</p>`,
        actions: [{ label: 'Batal', cls: 'ghost', onClick: () => { done = true; res(false); } }, { label: ok, cls: danger ? 'danger' : 'primary', onClick: () => { done = true; res(true); } }]
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) res(false); } });
      obs.observe(document.body, { childList: true });
    });
  }

  // ------------------------------------------------------------- forms
  function field(f) {
    const id = 'f_' + f.name;
    const req = f.required ? 'required' : '';
    const v = f.value == null ? '' : f.value;
    let input;
    switch (f.type) {
      case 'textarea': input = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`; break;
      case 'select': input = `<select id="${id}" name="${f.name}" ${req}>${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`; break;
      case 'checkbox': return `<label class="check-row"><input type="checkbox" name="${f.name}" ${v ? 'checked' : ''}><span>${esc(f.label)}</span></label>${f.hint ? `<p class="hint">${esc(f.hint)}</p>` : ''}`;
      case 'days': {
        const sel = Array.isArray(v) ? v : [];
        input = `<div class="days-pick" data-days="${f.name}">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label><input type="checkbox" value="${d}" ${sel.includes(d) ? 'checked' : ''}><span>${C.DAY_SHORT[d]}</span></label>`).join('')}</div>`; break;
      }
      case 'html': return f.html;
      default: input = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step != null ? `step="${f.step}"` : ''} placeholder="${esc(f.placeholder || '')}" ${f.list ? `list="${f.list}"` : ''} ${req} ${f.inputmode ? `inputmode="${f.inputmode}"` : ''}>`;
    }
    return `<div class="field ${f.half ? 'half' : ''}"><label for="${id}">${esc(f.label)}</label>${input}${f.hint ? `<p class="hint">${esc(f.hint)}</p>` : ''}</div>`;
  }
  function readForm(form, fields) {
    const out = {};
    for (const f of fields) {
      if (f.type === 'html') continue;
      if (f.type === 'days') { out[f.name] = $$(`[data-days="${f.name}"] input:checked`, form).map(i => +i.value).sort(); continue; }
      const el = form.elements[f.name];
      if (!el) continue;
      if (f.type === 'checkbox') out[f.name] = el.checked;
      else if (f.type === 'number') out[f.name] = el.value === '' ? '' : +el.value;
      else out[f.name] = el.value.trim();
    }
    return out;
  }
  /** Promise-based form modal. validate(values) may return an error string. */
  function formModal({ title, fields, submitLabel = 'Simpan', validate, extraActions = [], intro = '' }) {
    return new Promise(res => {
      let settled = false;
      const body = `${intro}<form class="form-grid" novalidate>${fields.map(field).join('')}<p class="form-error" hidden></p><button type="submit" hidden></button></form>`;
      const submit = (wrap) => {
        const form = $('form', wrap);
        const vals = readForm(form, fields);
        for (const f of fields) if (f.required && (vals[f.name] === '' || vals[f.name] == null || (Array.isArray(vals[f.name]) && !vals[f.name].length))) { showErr(wrap, `"${f.label}" wajib diisi`); return false; }
        const err = validate && validate(vals);
        if (err) { showErr(wrap, err); return false; }
        settled = true; res(vals);
      };
      const showErr = (wrap, msg) => { const e = $('.form-error', wrap); e.textContent = msg; e.hidden = false; };
      const m = modal({
        title, body,
        actions: extraActions.map(a => ({ label: a.label, cls: a.cls, onClick: () => { settled = true; res({ __action: a.id }); } }))
          .concat([{ label: 'Batal', cls: 'ghost' }, { label: submitLabel, cls: 'primary', onClick: (w) => submit(w) }]),
        onOpen: (wrap, close) => {
          $('form', wrap).addEventListener('submit', (e) => { e.preventDefault(); if (submit(wrap) !== false) close(); });
          const first = $('input:not([type=checkbox]),textarea,select', wrap); if (first && window.innerWidth > 700) first.focus();
        }
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!settled) res(null); } });
      obs.observe(document.body, { childList: true });
    });
  }

  // ------------------------------------------------------------- charts (pure SVG, no libraries → works offline)
  function barChart(data, { height = 140, unit = '', max, goal, color = 'var(--accent)' } = {}) {
    if (!data.length) return '<div class="empty small">Belum ada data</div>';
    const W = 320, H = height, pad = 18, bw = (W - pad) / data.length;
    const m = max || Math.max(1, goal || 0, ...data.map(d => d.value));
    const bars = data.map((d, i) => {
      const h = Math.max(d.value > 0 ? 2 : 0, (d.value / m) * (H - 30));
      const x = pad + i * bw + bw * 0.18, w = bw * 0.64, y = H - 18 - h;
      return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(4, w / 2)}" fill="${d.color || color}" opacity="${d.dim ? .35 : 1}"><title>${esc(d.label)}: ${fmt(d.value)}${unit}</title></rect>
        <text x="${x + w / 2}" y="${H - 4}" text-anchor="middle" class="ch-l">${esc(d.short || d.label)}</text></g>`;
    }).join('');
    const g = goal ? `<line x1="${pad}" x2="${W}" y1="${H - 18 - (goal / m) * (H - 30)}" y2="${H - 18 - (goal / m) * (H - 30)}" class="ch-goal"/>` : '';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"><text x="0" y="10" class="ch-l">${fmt(m)}${unit}</text><line x1="${pad}" x2="${W}" y1="${H - 18}" y2="${H - 18}" class="ch-axis"/>${g}${bars}</svg>`;
  }
  function lineChart(data, { height = 140, unit = '', max = null, color = 'var(--accent)' } = {}) {
    if (data.length < 2) return '<div class="empty small">Data belum cukup</div>';
    const W = 320, H = height, pl = 4, pr = 4;
    const m = max || Math.max(1, ...data.map(d => d.value));
    const x = i => pl + (i / (data.length - 1)) * (W - pl - pr);
    const y = v => H - 20 - (v / m) * (H - 34);
    const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
    const area = `M${x(0)},${H - 20} L${pts.replace(/ /g, ' L')} L${x(data.length - 1)},${H - 20} Z`;
    const step = Math.ceil(data.length / 7);
    const labels = data.map((d, i) => i % step === 0 || i === data.length - 1 ? `<text x="${x(i)}" y="${H - 5}" text-anchor="middle" class="ch-l">${esc(d.short || d.label)}</text>` : '').join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
      <defs><linearGradient id="lg${H}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <text x="2" y="10" class="ch-l">${fmt(m)}${unit}</text>
      <path d="${area}" fill="url(#lg${H})"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      ${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.value)}" r="2.2" fill="${color}"><title>${esc(d.label)}: ${fmt(d.value)}${unit}</title></circle>`).join('')}${labels}</svg>`;
  }
  function ring(p, { size = 64, stroke = 6, label = '', sub = '', color = 'var(--accent)' } = {}) {
    p = Math.max(0, Math.min(1, p || 0));
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--track)" stroke-width="${stroke}" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})" class="ring-fg"/></svg>
      <div class="ring-label"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  }
  function bar(p, { cls = '', color } = {}) {
    p = Math.max(0, Math.min(1, p || 0));
    return `<div class="bar ${cls}"><span style="width:${(p * 100).toFixed(1)}%;${color ? 'background:' + color : ''}"></span></div>`;
  }
  function heatmap(cells) { // cells: [{key, v (0..1|null), title}]
    return `<div class="heatmap">${cells.map(c => `<i title="${esc(c.title)}" style="--v:${c.v == null ? 0 : c.v}" class="${c.v == null ? 'na' : ''}"></i>`).join('')}</div>`;
  }

  // ------------------------------------------------------------- badges
  const TIER = { 1: ['#7b6cf2', '#4f8cff'], 2: ['#a77bff', '#5b8cff'], 3: ['#f0c35a', '#e06a9a'] };
  function badge(a, unlocked, size = 64) {
    const [c1, c2] = TIER[a.tier] || TIER[1];
    const id = 'g' + a.id;
    const glyph = (P[a.icon] || P.spark);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" class="badge ${unlocked ? '' : 'locked'}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${unlocked ? c1 : '#555'}"/><stop offset="1" stop-color="${unlocked ? c2 : '#333'}"/></linearGradient></defs>
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="url(#${id})" opacity="${unlocked ? 1 : .35}"/>
      <path d="M32 9 52 20.5v23L32 55 12 43.5v-23z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
      <g transform="translate(20 20)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" opacity="${unlocked ? 1 : .5}">${glyph}</g>
      ${unlocked ? '' : '<g transform="translate(40 40)"><circle cx="8" cy="8" r="8" fill="#222"/><g transform="translate(2.5 2.5) scale(.46)" fill="none" stroke="#aaa" stroke-width="2.6">' + P.lock + '</g></g>'}
    </svg>`;
  }

  // ------------------------------------------------------------- celebration overlays (subtle)
  // celebrations are queued so several (level-up + achievement) never stack on top of each other
  const cq = []; let cActive = false;
  function celebrate(opts) { cq.push(opts); if (!cActive) nextCelebration(); }
  function nextCelebration() {
    const o = cq.shift(); if (!o) { cActive = false; return; }
    cActive = true; showCelebration(o);
  }
  function showCelebration({ title, subtitle, iconName = 'trophy', color = 'var(--accent)', art = '' }) {
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.innerHTML = `<div class="celebrate-card"><div class="celebrate-glow" style="--c:${color}"></div>${art ? `<div class="celebrate-art">${art}</div>` : `<div class="celebrate-icon">${icon(iconName, 40)}</div>`}<h2>${esc(title)}</h2><p>${esc(subtitle || '')}</p><button class="btn primary">Lanjutkan</button></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    if (root.Motion) setTimeout(() => root.Motion.confetti({ count: 90 }), 120);
    let closed = false;
    const close = () => { if (closed) return; closed = true; el.classList.remove('show'); setTimeout(() => { el.remove(); nextCelebration(); }, 280); };
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('button')) close(); });
    if (navigator.vibrate) try { navigator.vibrate([20, 40, 20]); } catch (_) {}
  }

  function download(filename, text, mime = 'application/json') {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function pickFile(accept = '.json,application/json') {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
      i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsText(f); };
      i.click();
    });
  }

  root.UI = { $, $$, esc, fmt, pct, icon, toast, modal, confirmDialog, formModal, field, readForm, barChart, lineChart, ring, bar, heatmap, badge, celebrate, download, pickFile };
})(window);
