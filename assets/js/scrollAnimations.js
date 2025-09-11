// import { throttle } from './helpers.js';

// export function initScrollAnimations({ selector = '[data-animation]', threshold = 0.2, throttleMs = 120, respectReducedMotion = true } = {}) {
//   const nodes = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(selector));
//   if (!nodes.length) return;

//   const prefersReduced = respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

//   const animated = new WeakSet(); // уже анимированные
//   const pending = new WeakMap(); // el -> timeoutId (запланированные)

//   const getDelay = el => {
//     if (prefersReduced) return 0;
//     const d = Number(el.dataset.delay || 0);
//     return Number.isFinite(d) && d >= 0 ? d : 0;
//   };

//   const addAnimated = el => {
//     if (animated.has(el)) return;
//     animated.add(el);
//     el.classList.add('animated');
//   };

//   const scheduleAnimate = el => {
//     if (animated.has(el) || pending.has(el)) return;

//     const delay = getDelay(el);

//     // Передадим задержку ещё и в CSS-переменную (удобно для transition/animation-delay)
//     el.style.setProperty('--anim-delay', `${delay}ms`);

//     if (delay > 0) {
//       const id = window.setTimeout(() => {
//         pending.delete(el);
//         addAnimated(el);
//       }, delay);
//       pending.set(el, id);
//     } else {
//       addAnimated(el);
//     }
//   };

//   const throttledIOHandler = throttle((entries, io) => {
//     for (const entry of entries) {
//       if (entry.isIntersecting) {
//         scheduleAnimate(entry.target);
//         io.unobserve(entry.target);
//       }
//     }
//   }, throttleMs);

//   if ('IntersectionObserver' in window) {
//     const io = new IntersectionObserver(throttledIOHandler, { threshold });
//     nodes.forEach(el => io.observe(el));
//   } else {
//     // Фолбэк без IO
//     const inViewport = el => {
//       const r = el.getBoundingClientRect();
//       const h = window.innerHeight || document.documentElement.clientHeight;
//       const w = window.innerWidth || document.documentElement.clientWidth;
//       const visibleY = Math.min(r.bottom, h) - Math.max(r.top, 0);
//       const visibleX = Math.min(r.right, w) - Math.max(r.left, 0);
//       return visibleY > 0 && visibleX > 0 && visibleY / r.height >= threshold;
//     };

//     const scan = throttle(() => {
//       nodes.forEach(el => {
//         if (!animated.has(el) && inViewport(el)) scheduleAnimate(el);
//       });
//       if ([...nodes].every(el => animated.has(el) || pending.has(el))) {
//         window.removeEventListener('scroll', scan, { passive: true });
//         window.removeEventListener('resize', scan);
//       }
//     }, throttleMs);

//     window.addEventListener('scroll', scan, { passive: true });
//     window.addEventListener('resize', scan);
//     scan();
//   }
// }

import { throttle } from './helpers.js';

export function initScrollAnimations({
  selector = '[data-animation]',
  threshold = 0.2, // целевая доля видимости
  throttleMs = 120,
  respectReducedMotion = true,
} = {}) {
  const nodes = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(selector));
  if (!nodes.length) return;

  const prefersReduced = respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animated = new WeakSet();
  const pending = new WeakMap(); // el -> timeoutId

  const getDelay = el => {
    if (prefersReduced) return 0;
    const d = Number(el.dataset.delay || 0);
    return Number.isFinite(d) && d >= 0 ? d : 0;
  };

  const addAnimated = el => {
    if (animated.has(el)) return;
    animated.add(el);
    el.classList.add('animated');
  };

  const scheduleAnimate = el => {
    if (animated.has(el) || pending.has(el)) return;
    const delay = getDelay(el);
    el.style.setProperty('--anim-delay', `${delay}ms`);
    if (delay > 0) {
      const id = window.setTimeout(() => {
        pending.delete(el);
        addAnimated(el);
      }, delay);
      pending.set(el, id);
    } else {
      addAnimated(el);
    }
  };

  // ---- С основным IntersectionObserver throttle НЕ используем ----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          // Триггерим, когда доля видимости >= threshold
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            scheduleAnimate(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      {
        // даём небольшой "запас" снизу, чтобы при smooth-scroll не проскочить
        root: null,
        rootMargin: '0px 0px -10% 0px',
        // важен массив порогов, чтобы ловить точный переход через threshold
        threshold: buildThresholds(threshold),
      }
    );

    nodes.forEach(el => io.observe(el));

    // вспомогательная: [0, threshold, 1] без дублей, в пределах [0..1]
    function buildThresholds(t) {
      const set = new Set([0, clamp(t, 0, 1), 1]);
      return Array.from(set).sort((a, b) => a - b);
    }
    function clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    }
  } else {
    // ---- Фолбэк без IO (тут throttle уместен) ----
    const inViewport = el => {
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement.clientHeight;
      const w = window.innerWidth || document.documentElement.clientWidth;
      const visibleY = Math.min(r.bottom, h) - Math.max(r.top, 0);
      const visibleX = Math.min(r.right, w) - Math.max(r.left, 0);
      if (visibleY <= 0 || visibleX <= 0 || r.height <= 0) return false;
      return visibleY / r.height >= threshold;
    };

    const scan = throttle(() => {
      nodes.forEach(el => {
        if (!animated.has(el) && inViewport(el)) scheduleAnimate(el);
      });
      // если всё либо проанимировано, либо ожидает задержку — снимаем слушатели
      const done = Array.from(nodes).every(el => animated.has(el) || pending.has(el));
      if (done) {
        window.removeEventListener('scroll', scan, { capture: false });
        window.removeEventListener('resize', scan, { capture: false });
      }
    }, throttleMs);

    window.addEventListener('scroll', scan, { passive: true, capture: false });
    window.addEventListener('resize', scan, { passive: true, capture: false });
    scan();
  }
}
