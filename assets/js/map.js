ymaps.ready(init);

function init() {
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
          iconImageHref: '../assets/img/svg/pin.svg',
          iconImageSize: [54, 70],
          iconImageOffset: [-27, -70],
        }
      );

      map.geoObjects.add(placemark);
      placemarks.push({ el, placemark });
    }
  });
}
