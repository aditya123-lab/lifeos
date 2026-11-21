/* LIFE OS — motion.js : animations that survive re-renders.
 * - Page entrance: cards slide in with a short stagger (only when the page changes, never on every tap).
 * - Bars & rings animate from their previous value to the new one after each commit.
 * - Numbers count up on page entrance; the XP chip counts up when XP changes.
 * - Completing a task: tick pops, particle burst + floating "+XP" on a fixed overlay layer.
 * - Confetti for level-up, achievements, and finishing all mandatory tasks of the day.
 * Respects prefers-reduced-motion and the "Animasi" setting. */
(function (root) {
  'use strict';
  const M = {
    enabled() {
      const s = root.LifeStore && root.LifeStore.get();
      if (s && s.settings && s.settings.motion === false) return false;
      return !(root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    apply() { document.documentElement.dataset.motion = M.enabled() ? 'on' : 'off'; },

    // ---------------------------------------------------------- layer
    layer() {
      let l = document.getElementById('fxLayer');
      if (!l) { l = document.createElement('div'); l.id = 'fxLayer'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); }
      return l;
    },

    // ---------------------------------------------------------- bars / rings continuity
    capture(view) {
      return {
        bars: [...view.querySelectorAll('.bar > span')].map(e => e.style.width),
        rings: [...view.querySelectorAll('.ring-fg')].map(e => e.getAttribute('stroke-dashoffset'))
      };
    },
    after(view, { entered, snap }) {
      if (!M.enabled()) return;
      const bars = [...view.querySelectorAll('.bar > span')];
      const rings = [...view.querySelectorAll('.ring-fg')];
      const sameShape = snap && snap.bars.length === bars.length && snap.rings.length === rings.length;
      const from = (i, kind) => entered || !sameShape ? null : snap[kind][i];
      bars.forEach((b, i) => {
        const target = b.style.width, start = entered ? '0%' : from(i, 'bars');
        if (start == null || start === target) return;
        b.style.transition = 'none'; b.style.width = start; void b.offsetWidth;
        b.style.transition = ''; requestAnimationFrame(() => { b.style.width = target; });
      });
      rings.forEach((r, i) => {
        const target = r.getAttribute('stroke-dashoffset');
        const start = entered ? r.getAttribute('stroke-dasharray') : from(i, 'rings');
        if (start == null || start === target) return;
        r.style.transition = 'none'; r.setAttribute('stroke-dashoffset', start); void r.getBoundingClientRect();
        r.style.transition = ''; requestAnimationFrame(() => r.setAttribute('stroke-dashoffset', target));
      });
      if (entered) {
        // stagger direct children of the view (cards, sections)
        [...view.children].slice(0, 14).forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('enter'); });
        setTimeout(() => view.querySelectorAll('.enter').forEach(c => c.classList.remove('enter')), 900);
        view.querySelectorAll('.kpi b, .ring-label b, [data-count]').forEach(el => M.countUp(el));
      }
    },

    // ---------------------------------------------------------- numbers
    parseNum(t) {
      const m = String(t).trim().match(/^([^\d-]*)(-?[\d.]+)(.*)$/);
      if (!m) return null;
      const n = Number(m[2].replace(/\./g, ''));
      if (!isFinite(n) || m[2].includes('/')) return null;
      return { pre: m[1], n, post: m[3], dots: m[2].includes('.') };
    },
    countUp(el, from = 0, dur = 650) {
      if (!M.enabled() || el.children.length) return;
      const p = M.parseNum(el.textContent);
      if (!p || p.n === from || Math.abs(p.n) > 1e7 || /[\/:]/.test(el.textContent) || /^0\d/.test(el.textContent.trim().replace(/^\D+/, ''))) return;
      const fmt = v => p.pre + (p.dots ? Math.round(v).toLocaleString('id-ID') : Math.round(v)) + p.post;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (p.n - from) * e);
        if (k < 1 && el.isConnected) requestAnimationFrame(step);
      };
      el.textContent = fmt(from); requestAnimationFrame(step);
    },
    /** XP chip in the top bar: count from previous balance and glow. */
    xpChip(chip, prevXP, newXP, text) {
      if (!chip) return;
      if (!M.enabled() || prevXP == null || prevXP === newXP) return;
      chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add(newXP > prevXP ? 'bump' : 'dip');
      const label = chip.querySelector('.xp-val'); if (!label) return;
      const t0 = performance.now(), dur = 700;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        label.textContent = Math.round(prevXP + (newXP - prevXP) * e).toLocaleString('id-ID');
        if (k < 1 && label.isConnected) requestAnimationFrame(step); else label.textContent = text;
      };
      requestAnimationFrame(step);
    },

    // ---------------------------------------------------------- task completion
    rectOf(sel) { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; },
    taskDone(rect, xp, sel) {
      if (!M.enabled()) return;
      const el = sel && document.querySelector(sel);
      if (el) { el.classList.add('just-done'); const row = el.closest('.task'); if (row) row.classList.add('row-flash'); }
      if (!rect) return;
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      M.burst(cx, cy, 12);
      if (xp) M.floatText(cx, cy - 6, '+' + xp + ' XP');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    },
    burst(x, y, n = 12, colors = ['#8b7cf6', '#5b8cff', '#3ecf8e', '#f5a524', '#ff6b9a']) {
      if (!M.enabled()) return;
      const L = M.layer();
      const ring = document.createElement('i'); ring.className = 'fx-ring'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; L.appendChild(ring);
      setTimeout(() => ring.remove(), 600);
      for (let i = 0; i < n; i++) {
        const d = document.createElement('i'); d.className = 'fx-dot';
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4, r = 22 + Math.random() * 22;
        d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.background = colors[i % colors.length];
        d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r + 'px');
        L.appendChild(d); setTimeout(() => d.remove(), 700);
      }
    },
    floatText(x, y, text, cls = '') {
      if (!M.enabled()) return;
      const t = document.createElement('div'); t.className = 'fx-float ' + cls; t.textContent = text;
      t.style.left = x + 'px'; t.style.top = y + 'px';
      M.layer().appendChild(t); setTimeout(() => t.remove(), 1100);
    },
    pulse(el) { if (!el || !M.enabled()) return; el.classList.remove('fx-pulse'); void el.offsetWidth; el.classList.add('fx-pulse'); },

    // ---------------------------------------------------------- confetti
    confetti({ count = 110, duration = 2200 } = {}) {
      if (!M.enabled() || document.querySelector('canvas.fx-confetti')) return; // never stack two at once
      const c = document.createElement('canvas'); c.className = 'fx-confetti';
      const dpr = Math.min(2, root.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
      document.body.appendChild(c);
      const g = c.getContext('2d'); g.scale(dpr, dpr);
      const colors = ['#8b7cf6', '#5b8cff', '#3ecf8e', '#f5a524', '#ff6b9a', '#ffffff'];
      const ps = Array.from({ length: count }, (_, i) => {
        const fromLeft = i % 2 === 0;
        return { x: fromLeft ? -10 : W + 10, y: H * (0.55 + Math.random() * 0.3), vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 6), vy: -(9 + Math.random() * 7),
          w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length] };
      });
      const t0 = performance.now();
      const frame = (t) => {
        const el = t - t0; g.clearRect(0, 0, W, H);
        g.globalAlpha = el > duration - 500 ? Math.max(0, (duration - el) / 500) : 1;
        for (const p of ps) {
          p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
        }
        if (el < duration) requestAnimationFrame(frame); else c.remove();
      };
      requestAnimationFrame(frame);
    }
  };
  root.Motion = M;
})(window);
