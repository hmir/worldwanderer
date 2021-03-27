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