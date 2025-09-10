// digits.js
import { throttle } from './helpers.js';

export function initDigitAnimations({ selector = '[data-digit-animation]', duration = 1500, threshold = 0.4, throttleMs = 120 } = {}) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(selector));
  if (!nodes.length) return;

  const nf = new Intl.NumberFormat('ru-RU');
  const format = n => nf.format(n).replace(/\u00A0/g, ' ');

  // Кэши и маркеры
  const started = new WeakSet();
  const meta = new Map();
  const getMeta = el => {
    let m = meta.get(el);
    if (!m) {
      const raw = el.textContent.replace(/[^\d]/g, '');
      const target = Number(raw) || 0;
      const dur = Number(el.dataset.duration) || duration;
      m = { target, duration: dur };
      meta.set(el, m);
    }
    return m;
  };

  // Анимация одного элемента
  const animateEl = el => {
    if (started.has(el)) return;
    started.add(el);

    const { target, duration: dur } = getMeta(el);

    if (prefersReduced || dur <= 0 || target === 0) {
      el.textContent = format(target);
      return;
    }

    const t0 = performance.now();
    const from = 0;

    const tick = now => {
      const p = Math.min(1, (now - t0) / dur); // 0..1
      const val = Math.trunc(from + (target - from) * p);
      el.textContent = format(val);

      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };

    requestAnimationFrame(tick);
  };

  const tryStart = entryOrEl => {
    const el = entryOrEl.target ? entryOrEl.target : entryOrEl;
    animateEl(el);
  };

  const throttledIOHandler = throttle((entries, io) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        tryStart(entry);
        io.unobserve(entry.target);
      }
    }
  }, throttleMs);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(throttledIOHandler, { threshold });
    nodes.forEach(el => io.observe(el));
  } else {
    // ---------- Фолбэк без IO: троттлим скролл/ресайз ----------
    const inViewport = el => {
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement.clientHeight;
      const w = window.innerWidth || document.documentElement.clientWidth;

      const visibleY = Math.min(r.bottom, h) - Math.max(r.top, 0);
      const visibleX = Math.min(r.right, w) - Math.max(r.left, 0);
      return visibleY > 0 && visibleX > 0 && visibleY / r.height >= threshold;
    };

    const scan = throttle(() => {
      nodes.forEach(el => {
        if (!started.has(el) && inViewport(el)) animateEl(el);
      });

      if ([...nodes].every(el => started.has(el))) {
        window.removeEventListener('scroll', scan, { passive: true });
        window.removeEventListener('resize', scan);
      }
    }, throttleMs);

    window.addEventListener('scroll', scan, { passive: true });
    window.addEventListener('resize', scan);
    scan();
  }
}
