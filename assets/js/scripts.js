import { popup } from './popup.js';
import { hidePreloader, initNavigationMenu } from './helpers.js';
import { initSliders } from './sliders.js';
import { initScrollToBlock } from './scrollToBlock.js';
import { initAccordeons } from './accordeon.js';
import { initCountdown } from './countdown.js';
import { initDigitAnimations } from './digit-animation.js';
import { initScrollAnimations } from './scrollAnimations.js';
import { initSectionPaginationWatcher } from './sectionPaginationWatcher.js';
import { initInputMasks } from './inputMasks.js';

popup.init();
window.popup = popup;
initNavigationMenu();
initSliders();
initScrollToBlock();
initAccordeons();
initScrollAnimations();
initDigitAnimations();
initSectionPaginationWatcher();
initInputMasks();
initCountdown('14 октября 2025');

setTimeout(() => {
  hidePreloader();
}, 300);
