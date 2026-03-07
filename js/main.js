mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaGFzcyIsImEiOiJjbW0xOWt1b2MwN2s0MnNvYzFhNW5tZXRjIn0.woofAfgLav-FoAG30Mo0pg";

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-120.7401, 47.7511],
    zoom: 6
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {

    map.addSource('arrests', {
        type: 'geojson',
        data: 'assets/arrests-washington-only.geojson'
    });

    map.addLayer({
        id: 'arrests-layer',
        type: 'circle',
        source: 'washington-arrests',
        paint: {
            'circle-radius': 6,
            'circle-color': '#ff4d4d'
        }
    });


    map.on('click', 'arrests-layer', function (e) {

        const props = e.features[0].properties;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Date:</strong> ${props.apprehension_date}<br>
                <strong>Location:</strong> ${props.apprehension_site_landmark}<br>
                <strong>Country:</strong> ${props.citizenship_country}<br>
                <strong>Gender:</strong> ${props.gender}<br>
                <strong>Status:</strong> ${props.case_status}
            `)
            .addTo(map);

        });

    map.on('mouseenter', 'arrests-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'arrests-layer', () => {
        map.getCanvas().style.cursor = '';
    });

});
