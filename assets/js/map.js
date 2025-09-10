ymaps.ready(init);

function init() {
  const iconUrl = new URL('assets/img/svg/pin.svg', window.location.origin + window.location.pathname).href;
  const zoom = window.innerWidth <= 767 ? 11 : 14;
  const map = new ymaps.Map('map', {
    center: [56.766336, 60.758219],
    zoom,
    controls: ['zoomControl'],
  });

  const addressElements = document.querySelectorAll('[data-adress]');
  const placemarks = [];

  addressElements.forEach(el => {
    const lat = el.dataset.lat;
    const lng = el.dataset.lng;

    if (lat && lng) {
      const coords = [parseFloat(lat), parseFloat(lng)];

      const placemark = new ymaps.Placemark(
        coords,
        {
          balloonContent: el.textContent.trim(),
        },
        {
          iconLayout: 'default#image',
          iconImageHref: iconUrl,
          iconImageSize: [54, 70],
          iconImageOffset: [-27, -70],
        }
      );

      map.geoObjects.add(placemark);
      placemarks.push({ el, placemark });
    }
  });
}
