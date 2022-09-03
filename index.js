
import { formTemplate } from './templates.js';

let reviews = [];
let storage = localStorage;

document.addEventListener('DOMContentLoaded', () => {
  ymaps.ready(init);
  
  function init() {
    const myMap = new ymaps.Map('map', {
      center: [55.76, 37.64],
      zoom: 12,
      controls: ['zoomControl'],
    });

    setClusterer(myMap, getStorage());

    myMap.events.add('click', function(event) {
      const coords = event.get('coords');
      openBalloon(myMap, coords);
    })
  }
})

async function openBalloon(map, coords, geoObjectsInCluster, placemark) {
  if (placemark) {
    await map.balloon.open(coords, {
      content: `<div class="balloon__reviews">
        ${setLayout(coords, getStorage())}  
      </div>
      ${formTemplate}`
    })
  } else if (geoObjectsInCluster) {
    let currentReviews = [];
    for (let review of getStorage()) {
      if (geoObjectsInCluster.some((geoObject) => JSON.stringify(geoObject.geometry._coordinates) === JSON.stringify(review.coords))) {
        currentReviews.push(review);
      }
    }
    await map.balloon.open(coords, {
      content: `<div class="balloon__reviews">
        ${setLayout(coords, getStorage(), currentReviews)}  
      </div>
      ${formTemplate}`
    })
  } else {
    await map.balloon.open(coords, {
      content: `${formTemplate}`
    })
  }

  const form = document.querySelector('#add-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
      map.geoObjects.removeAll();
      
      const review = {};
      review.coords = coords;
      review.name = form.elements.name.value;
      review.place = form.elements.place.value;
      review.review = form.elements.review.value;
      
      reviews = getStorage();
      reviews.push(review);
      setStorage(reviews);

    setClusterer(map, reviews, coords);

    map.balloon.close();
  })
}

function setStorage(reviews) {
  storage.data = JSON.stringify(reviews);
}

function getStorage() {
  const reviews = JSON.parse(storage.data || '[]');
  return reviews;
}

function setClusterer(map, reviews, coords) {
  if (reviews.length) {
    const clusterer = new ymaps.Clusterer({hasBalloon: false, clusterDisableClickZoom: true});
    clusterer.add(setClustererPlacemarks(reviews));
    map.geoObjects.add(clusterer);

    clusterer.events.add('click', function(event) {
      event.preventDefault();
      coords = event.get('target').geometry._coordinates;
      let placemark;
      let geoObjectsInCluster;
      if (event.get('target').options._name === 'cluster') {
        geoObjectsInCluster = event.get('target').getGeoObjects();
      } else if (event.get('target').options._name === 'geoObject') {
        placemark = event.get('target');
      }
      openBalloon(map, coords, geoObjectsInCluster, placemark);
    })
  }
}

function setClustererPlacemarks(reviews) {
  if (reviews.length) {
    let list = reviews.map((item) => {
      let placemark = new ymaps.Placemark(item.coords);
      return placemark;
    })
    return list;
  }
}

function setLayout(coords, reviews, currentReviews) {
  let layout = '';
  if (reviews.length) {
    if (currentReviews) {
      for (let review of currentReviews) {
        layout += `
          <div class = "balloon__review">
            <div><span class="balloon__review-author">${review.name} </span><span class="balloon__review-place">${review.place}</span></div>
            <div class="balloon__review-text">${review.review}</div>
          </div>`
        }
      return layout;
    } else {
      let review;
      for (let item of reviews) {
        if (JSON.stringify(item.coords) === JSON.stringify(coords)) {
          review = item;
        }
      }
      layout = `
        <div class = "balloon__review">
          <div><span class="balloon__review-author">${review.name} </span><span class="balloon__review-place">${review.place}</span></div>
          <div class="balloon__review-text">${review.review}</div>
        </div>`
      return layout;
    }
  }
  return layout;
}