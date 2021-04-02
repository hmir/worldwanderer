const DISTANCE_THRESHOLD = 6000000;
const MAX_ROUNDS = 5;

var panorama;
var latLng;

let round = 1;
let totalScore = 0;
let positionsList = [];

function randomLatLng() {
  return {
    lat: Math.random() * 90 - 30, // restrict longitude to between -30 and 60 to avoid poles
    lng: Math.random() * 280 - 125 // restrict latitude to between -125 and 155 to avoid pacific ocean
  };
}

function isEndless() {
  return $("#endless-switch").is(":checked");
}

function setNewGameVariables() {
  round = 1;
  totalScore = 0;
  positionsList = [];
}

$(document).ready(()=> {
  $("#endless-switch").click(() => {
    if (isEndless()) {
      $("#round-container").css("display", "none");
    } else {
      setNewGameVariables();
      $("#round-container").text("Round: " + round + "/" + MAX_ROUNDS);
      $("#round-container").css("display", "inherit");
    }
  });
});

let guessMarker;
let targetMarker;

function markResultsMap(positionsList) {
  let middle = google.maps.geometry.spherical.interpolate(positionsList[0][0], positionsList[0][1], 0.5);
  let dist = google.maps.geometry.spherical.computeDistanceBetween(positionsList[0][0], positionsList[0][1]);

  let zoom = Math.max(2, Math.min(Math.floor((1 / dist) * 10000000), 6));

  const resultsMap = new google.maps.Map(document.getElementById("results-view"), {
    center: positionsList.length == 1 ? middle : {lat: 0, lng: 0},
    zoom: positionsList.length == 1 ? zoom : 1,
    disableDefaultUI: true,
  });

  for (let i = 0; i < positionsList.length; i++) {
    let guessLatLng = positionsList[i][0];
    let targetLatLng = positionsList[i][1];
    guessMarker = new google.maps.Marker({
      position: guessLatLng,
      map: resultsMap,
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });

    targetMarker = new google.maps.Marker({
      position: targetLatLng,
      map: resultsMap,
      icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
    });

    new google.maps.Polyline({
      path: [guessLatLng, targetLatLng],
      geodesic: false,
      strokeColor: "#000000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      map: resultsMap
    });
  }
}

async function setRandomStreetView(outdoor) {
  let coords = randomLatLng();

  let req = {
    location: coords,
    preference: "nearest",
    radius: 400000,
    source: outdoor ? "outdoor" : "default"
  };

  let sv = new google.maps.StreetViewService();

  try {
    let results = await sv.getPanorama(req);

    let latLng = results.data.location.latLng;

    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("pano-container"), {
        position: latLng,
        disableDefaultUI: true
      }
    );
    return true;
  } catch (e) {
    return false;
  }
}

var marker;
let initializing = false;
async function initialize() {
  if (initializing) {
    return;
  }

  initializing = true;
  $("#loading-screen").css("display", "inherit");
  const map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 0,
      lng: 0
    },
    zoom: 2,
    disableDefaultUI: true,
  });

  marker = null;
  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map);
  });

  while (await setRandomStreetView(true) == false);
  $("#pano-container").css("display", "inherit");
  $("#results-view").css("display", "none");
  $("#progress-bar-container").css("display", "none");
  $("#loading-screen").css("display", "none");
  $("#round-container").text("Round: " + round + "/" + MAX_ROUNDS);
  initializing = false;
}

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
      "opacity": 1
    }, 300)
  }
}

function computeDistance() {
  var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), panorama.getPosition());
  return distanceBetween;
}

function calculateScoreFromRatio(ratio) {
  return Math.ceil(ratio * 100);
}

function setOnclick(element, func) {
  element.off();
  element.click(func);
}

function showRoundResults(dist, ratio) {
  let score = calculateScoreFromRatio(ratio);
  $("#progress-bar").attr("aria-valuenow", progress).css("width", Math.max(1, ratio * 100) + "%");
  $("#progress-text").text("You were " + Math.ceil(dist / 1000) + " km away... Score: " + score + "/100");

  if (isEndless()) {
    $("#play-again").text("Hit here to play again!");
    setOnclick($("#play-again"), initialize);
  } else {
    if (round == MAX_ROUNDS) {
      $("#play-again").text("Hit here to view results");
      setOnclick($("#play-again"), showGameResults);
    } else {
      $("#play-again").text("Hit here to go to the next round");
      setOnclick($("#play-again"), initialize);
    }
  }
}

function showGameResults() {
  let finalRatio = totalScore / (MAX_ROUNDS * 100);
  $("#play-again").text("Hit here to play again!");
  setOnclick($("#play-again"), initialize);
  $("#progress-bar").attr("aria-valuenow", progress).css("width", Math.max(1, finalRatio * 100) + "%");
  $("#progress-text").text("You scored " + Math.floor(totalScore) + "/" + (MAX_ROUNDS * 100) + " points this game!");
  markResultsMap(positionsList);
  setNewGameVariables();
}

function makeGuess() {
  let dist = computeDistance();
  let progress = Math.max(DISTANCE_THRESHOLD - dist, 0);
  let ratio = progress / DISTANCE_THRESHOLD;
  totalScore += calculateScoreFromRatio(ratio);

  let positions = [marker.getPosition(), panorama.getPosition()];
  positionsList.push(positions);

  markResultsMap([positions]);

  $("#pano-container").css("display", "none");
  $("#results-view").css("display", "inherit");
  $("#progress-bar-container").css("display", "flex");


  showRoundResults(dist, ratio);
  round++;
}