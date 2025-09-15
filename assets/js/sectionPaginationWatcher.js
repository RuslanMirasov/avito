import { throttle } from './helpers.js';

export const initSectionPaginationWatcher = ({
  linkSelector = '[data-section-pagination]',
  wrapperSelector = '.fixed-pagination',
  activeClass = 'active',
  darkClass = 'not-dark',
  throttleMs = 120,
  offset = 50,
} = {}) => {
  const links = Array.from(document.querySelectorAll(linkSelector));
  const wrapper = document.querySelector(wrapperSelector);
  if (!links.length || !wrapper) return;

  const sections = links
    .map(link => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return null;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return null;
      return { id, el, link, top: 0, bottom: 0 };
    })
    .filter(Boolean);

  if (!sections.length) return;

  let currentId = null;

  const measure = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    sections.forEach(s => {
      const rect = s.el.getBoundingClientRect();
      const top = rect.top + scrollY - offset;
      s.top = top;
      s.bottom = top + s.el.offsetHeight;
    });
  };

  const setActive = id => {
    if (currentId === id) return;
    currentId = id;

    // активная точка
    links.forEach(a => {
      const isActive = a.getAttribute('href') === `#${id}`;
      a.classList.toggle(activeClass, isActive);
    });

    // тёмная тема у всего pagination
    const sec = sections.find(s => s.id === id);
    if (sec) {
      wrapper.classList.toggle(darkClass, sec.el.classList.contains('dark'));
    }
  };

  const updateActive = () => {
    const center = (window.scrollY || window.pageYOffset) + window.innerHeight / 2;
    // секция, внутри которой находится центр
    let active = sections.find(s => center >= s.top && center < s.bottom);

    // запасной вариант — ближайшая секция
    if (!active) {
      let best = null,
        bestDist = Infinity;
      for (const s of sections) {
        const d = Math.min(Math.abs(center - s.top), Math.abs(center - s.bottom));
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      active = best;
    }

    if (active) setActive(active.id);
  };

  const onScroll = throttle(updateActive, throttleMs);
  const onResize = throttle(() => {
    measure();
    updateActive();
  }, throttleMs);

  // init
  measure();
  updateActive();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
};
