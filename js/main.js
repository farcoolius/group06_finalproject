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
        data: 'data/arrests-washington-only.geojson'
    });

    map.addLayer({
        id: 'arrests-layer',
        type: 'circle',
        source: 'arrests',
        paint: {
            'circle-radius': 6,
            'circle-color': '#ff4d4d',
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    map.on('click', 'arrests-layer', function (e) {

        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = `
            <strong>Location:</strong> ${properties.city || "Unknown"}<br>
            <strong>Arrests:</strong> ${properties.arrests || "N/A"}
        `;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    });

    map.on('mouseenter', 'arrests-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'arrests-layer', () => {
        map.getCanvas().style.cursor = '';
    });

});
