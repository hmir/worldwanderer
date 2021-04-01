const DISTANCE_THRESHOLD = 6000000;

var panorama;
var latLng;

function randomLatLng() {
  return {
    lat: Math.random() * 90 - 30, // restrict longitude to between -30 and 60 to avoid poles
    lng: Math.random() * 280 - 125 // restrict latitude to between -125 and 155 to avoid pacific ocean
  };
}

let guessMarker;
let targetMarker;

function markResultsMap(guessLatLng, targetLatLng) {
  let middle = google.maps.geometry.spherical.interpolate(guessLatLng, targetLatLng, 0.5);
  let dist = google.maps.geometry.spherical.computeDistanceBetween(guessLatLng, targetLatLng);

  let zoom = Math.max(2, Math.min(Math.floor((1 / dist) * 10000000), 6));

  const map = new google.maps.Map(document.getElementById("street-view"), {
    center: middle,
    zoom: zoom,
    disableDefaultUI: true,
  });

  guessMarker = new google.maps.Marker({
    position: guessLatLng,
    map: map,
    icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });

  targetMarker = new google.maps.Marker({
    position: targetLatLng,
    map: map,
    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
  });

  const path = new google.maps.Polyline({
    path: [guessLatLng, targetLatLng],
    geodesic: false,
    strokeColor: "#000000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: map
  });

}

async function setRandomStreetView(outdoor) {
  let coords = randomLatLng();

  let req = {
    location: coords,
    preference: 'nearest',
    radius: 400000,
    source: outdoor ? 'outdoor' : 'default'
  };

  let sv = new google.maps.StreetViewService();

  try {
    let results = await sv.getPanorama(req);

    let latLng = results.data.location.latLng;

    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view"), {
        position: latLng,
        disableDefaultUI: true
      }
    );
    return true;
  } catch (e) {
    return false;
  }
}

async function initialize() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 0,
      lng: 0
    },
    zoom: 2,
    disableDefaultUI: true,
  });

  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map);
  });

  while (await setRandomStreetView(true) == false);
}

var marker;

function placeMarkerAndPanTo(latLng, map) {
  if (marker) {
    marker.setPosition(latLng);
  } else {
    marker = new google.maps.Marker({
      position: latLng,
      map: map,
    });
    map.panTo(latLng);
    $("#guess-button").animate({
      'opacity': 1
    }, 300)
  }
}

function computeDistance() {
  var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), panorama.getPosition());
  return distanceBetween;
}

function makeGuess() {
  let dist = computeDistance();
  markResultsMap(marker.getPosition(), panorama.getPosition());
  let progress = Math.max(DISTANCE_THRESHOLD - dist, 0);
  let ratio = progress / DISTANCE_THRESHOLD;
  $("#progress-bar-container").css('display', "flex");
  $("#progress-bar").attr('aria-valuenow', progress).css('width', Math.max(1, ratio * 100) + "%");
  $("#progress-text").text('You were ' + Math.ceil(dist / 1000) + ' km away... Score: ' + Math.ceil(ratio * 100) + '%');
  $("#play-again").text('Hit here to play again!');
}