mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaGFzcyIsImEiOiJjbWwxbWs4aTYwYTNqM2Rwdnh1b2NoaWxqIn0.Qe13DZxRshOkPNEd5cPcww";

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-120.7401, 47.7511],
    zoom: 6
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {
    map.addSource('arrests', {
        type: 'geojson',
        data: 'assets/arrests-data.geojson',
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40
    });

    // Cluster circles
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'arrests',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#2DC4B2', 10,
                '#3BB3C3', 25,
                '#669EC4', 50,
                '#8B88B6'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                18, 10,
                24, 25,
                30, 50,
                36
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
    });

    // Cluster numbers
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'arrests',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14
        },
        paint: {
            'text-color': '#ffffff'
        }
    });

    // Unclustered points
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'arrests',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#ff4d4d',
            'circle-radius': 7,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff'
        }
    });

    // Click cluster to zoom in
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;

        map.getSource('arrests').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
            });
        });
    });

    // Popup for individual points
    map.on('click', 'unclustered-point', (e) => {
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong>Date:</strong> ${props.apprehension_date || 'N/A'}<br>
                <strong>State:</strong> ${props.apprehension_state || 'N/A'}<br>
                <strong>Location:</strong> ${props.apprehension_site_landmark || 'N/A'}<br>
                <strong>Country:</strong> ${props.citizenship_country || 'N/A'}<br>
                <strong>Gender:</strong> ${props.gender || 'N/A'}<br>
                <strong>Status:</strong> ${props.case_status || 'N/A'}
            `)
            .addTo(map);
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    // Fit map + update counters using fetched data
    fetch('assets/arrests-data.geojson')
        .then(r => r.json())
        .then(data => {
            const bounds = new mapboxgl.LngLatBounds();
            data.features.forEach(f => {
                if (f.geometry?.coordinates) bounds.extend(f.geometry.coordinates);
            });
            if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50 });

            document.getElementById('locationCount').textContent = data.features.length;
            document.getElementById('totalDeportations').textContent = data.features.length;
        })
        .catch(err => console.error('GeoJSON load error:', err));
});
