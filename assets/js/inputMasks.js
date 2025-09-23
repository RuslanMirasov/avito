let imaskLoader;

function loadIMask() {
  if (window.IMask) return Promise.resolve(window.IMask);
  if (imaskLoader) return imaskLoader;

  imaskLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/imask@7.6.0/dist/imask.min.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.IMask);
    script.onerror = () => reject(new Error('Ошибка загрузки IMask'));
    document.head.appendChild(script);
  });

  return imaskLoader;
}

export const initInputMasks = async () => {
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  if (phoneInputs.length === 0) return;

  try {
    const IMask = await loadIMask();
    const phoneMaskOptions = { mask: '+{7} 000 000-00-00' };
    phoneInputs.forEach(input => IMask(input, phoneMaskOptions));
  } catch (err) {
    console.warn('IMask не потдерживается:', err);
  }
};
