const DISTANCE_THRESHOLD = 6_000_000;

var panorama;
var latLng;
let globalMap;

let curChallenge;
const sustainabilityChallengeLocations = [
  {
    name: 'The Great Barrier Reef',
    question: "The ___ is the world's largest coral reef system composed of over 2,900 individual reefs and 900 islands stretching for over 2,300 kilometres. This reef structure is composed of and built by billions of tiny organisms, known as coral polyps. According to a study published in October 2012 by the Proceedings of the National Academy of Sciences, the reef has lost more than half its coral cover since 1985, a finding reaffirmed by a 2020 study which found over half of the reef's coral cover to have been lost between 1995 and 2017, with the effects of a widespread 2020 bleaching event not yet quantified",
    location: {lat: -23.3071842, lng: 151.9144542},
  },
  // {
  //   name: "Ganges River",
  //   question: "The ___ is a trans-boundary river which flows through ___ and ___. It is the third largest river on Earth by discharge. The ___ is threatened by severe pollution. This poses a danger not only to humans but also to animals; the ___ is home to approximately 140 species of fish and 90 species of amphibians. The river also contains reptiles and mammals, including critically endangered species such as the gharial.",
  //   location: {lat: 27.4036401, lng:83.0319706},
  // },
  {
    name: "The Hudson River",
    question: "The ___ is a 315-mile (507 km) river that flows from north to south primarily through eastern ___. The ___'s sediments contain a significant array of pollutants, accumulated over decades from industrial waste discharges, sewage treatment plants, and urban runoff. The most discussed pollution of the ___ is General Electric's contamination of the river with polychlorinated biphenyls (PCBs) between 1947 and 1977. This pollution caused a range of harmful effects to wildlife and people who ate fish from the river or drank the water.",
    location: {lat: 40.8358816, lng: -74.01432}
  },
  {
    name: "Beijing",
    question: "This city, with a population of over 21 million residents, is  one of the world's leading centers for culture, diplomacy and politics, business and economics, education, language, and science and technology. ___ has a long history of environmental problems. Because of the combined factors of urbanization and pollution caused by burning of fossil fuel, ___ is often affected by serious environmental problems, which lead to health issues of many inhabitants. In 2013 heavy smog struck ___ and most parts of ___, impacting a total of 600 million people. After this 'pollution shock' the government of ____ announced measures to reduce air pollution.",
    location: {lat: 39.9682234, lng: 116.4770841}
    
  }, 
  {
    name: "Central Park, NY",
    question: "____ 18,000 trees and 843 acres of trails, lawns, and gardens offer some much-needed reprieve when it's area turns into what's called an 'urban heat island.' More concrete and less tree cover exacerbates this difference in temperature, which can vary by 16 degrees depending on location. This is because hard, impervious surfaces (like paved roadways and empty rooftops) absorb, magnify, and slowly release heat throughout the course of a day, creating a warming cycle on city streets.",
    location: {lat: 40.7695199, lng: -73.9724093}
  }

]

function randomLatLng() {
  return {
    lat: Math.random() * 90 - 30, // restrict longitude to between -30 and 60 to avoid poles
    lng: Math.random() * 280 - 125
  }; // restrict latitude to between -125 and 155 to avoid pacific ocean
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
    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });

  targetMarker = new google.maps.Marker({
    position: targetLatLng,
    map: map,
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
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

let success = false;
async function setRandomStreetView(outdoor) {
  let coords = randomLatLng();
  
  // sustainability challenge
  if (!outdoor) {
    let cookie = document.cookie;
    console.log(document.cookie);
    if (cookie.length == 0) {
      document.cookie = '0';
      curChallenge = 0;
    } else {
      curChallenge = parseInt(cookie) + 1;      
    }
    if (curChallenge == sustainabilityChallengeLocations.length) {
      document.cookie = (curChallenge + 1).toString();
      location.href = location.origin + '/success.html';
    } else if (curChallenge > sustainabilityChallengeLocations.length) {
      document.cookie = '0';
      curChallenge = 0;
    }
    console.log('chalnum', curChallenge);
    coords = sustainabilityChallengeLocations[curChallenge].location;
    $('#info').css('display', 'inline');
    $('#info').text(sustainabilityChallengeLocations[curChallenge].question);
  }

  console.log(coords);
  let req = {location: coords, preference: 'nearest', radius: 400000, source: outdoor ? 'outdoor' : 'default'};
  let sv = new google.maps.StreetViewService();

  try {
    let results = await sv.getPanorama(req);

    let latLng = results.data.location.latLng;
    console.log('ll ', latLng.lat(), latLng.lng());

    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view"),
      {
        position: latLng,
        disableDefaultUI: true
      }
    );
    return true;
  } catch (e) {
    return false;
  }
}

function isSustainabilityChallenge() {
  let searchParams = new URLSearchParams(window.location.search);
  return searchParams.has('sustainability') && searchParams.get('sustainability') == 'true';
}

async function initialize() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 0, lng: 0 },
    zoom: 2,
    disableDefaultUI: true,
  });

  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map);
  });

  if(isSustainabilityChallenge()) {
    $("#sust-challenge").css('display', 'none');
  }

  globalMap = map;

  while (await setRandomStreetView(!isSustainabilityChallenge()) == false);
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
    $("#guess-button").animate({ 'opacity': 1 }, 300)
  }
}

function computeDistance() {
  var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), panorama.getPosition());
  console.log("distancebetween: " + distanceBetween);
  return distanceBetween;
}

function makeGuess() {
  let dist = computeDistance();
  markResultsMap(marker.getPosition(), panorama.getPosition());
  let progress = Math.max(DISTANCE_THRESHOLD - dist, 0);
  let ratio = progress / DISTANCE_THRESHOLD;
  $("#progress-bar-container").css('display', "inline");
  $("#progress-bar").attr('aria-valuenow', progress).css('width', Math.max(1, ratio * 100) + "%");
  if (isSustainabilityChallenge()) {
    document.cookie = curChallenge.toString();
    let name = sustainabilityChallengeLocations[curChallenge].name;
    $("#progress-text").text('The location was ' + name + '. You were ' + Math.ceil(dist / 1000) + ' km away.');
  } else {
    $("#progress-text").text('You were ' + Math.ceil(dist / 1000) + ' km away... Score: ' + Math.ceil(ratio * 100) + '%');
  }
  $("#play-again").text('Hit here to play again!');
}
