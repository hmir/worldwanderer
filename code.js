let panorama;
google.maps.event.addListener(map, 'click', function (event) {
    placeMarker(event.latLng);
});

function placeMarker(location) {
    var marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

function initialize() {
    const fenway = { lat: 42.345573, lng: -71.098326 };
    const map = new google.maps.Map(document.getElementById("map"), {
        center: fenway,
        zoom: 14,
    });
    panorama = new google.maps.StreetViewPanorama(
        document.getElementById("street-view"),
        {
            position: fenway,
            pov: { heading: 34, pitch: 10 },
            zoom: 1,
        }
    );
    map.addListener("click", (e) => {
        placeMarkerAndPanTo(e.latLng, map);
    });
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
    }
}

function randomLatLng() {
  return { lat: Math.random() * 90 - 30, // restrict longitude to between -30 and 60 to avoid poles
           lng: Math.random() * 280 - 125 }; // restrict latitude to between -125 and 155 to avoid pacific ocean
}

async function setRandomStreetView() {
  console.log("making req");
  let coords = randomLatLng();
  console.log(coords);
  let req = {location: coords, preference: 'nearest', radius: 400000, source: 'outdoor'};
  let sv = new google.maps.StreetViewService();
  let pano = sv.getPanorama(req, (data, status) => {
    console.log(status);
    if (status != 'OK') {
      console.log('sadge');
      return;
    }

    let latLng = data.location.latLng;
    console.log('ll ', latLng)

    const panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view"),
      {
        position: latLng
      }
    );
  });
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
  }
}

console.log("setting timeout");
setTimeout(()=> { setRandomStreetView().await }, 2000);
