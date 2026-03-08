mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaGFzcyIsImEiOiJjbWwxbWs4aTYwYTNqM2Rwdnh1b2NoaWxqIn0.Qe13DZxRshOkPNEd5cPcww";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [-120.7401, 47.7511],
    zoom: 6
});

map.on('load', () => {
    map.addSource('arrests', {
        type: 'geojson',
        data: 'assets/arrests-data.geojson',
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40
    });
