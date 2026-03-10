mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaGFzcyIsImEiOiJjbWwxbWs4aTYwYTNqM2Rwdnh1b2NoaWxqIn0.Qe13DZxRshOkPNEd5cPcww";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-120.7401, 47.7511],
  zoom: 6
});

map.addControl(new mapboxgl.NavigationControl(), "top-right");

map.on("load", () => {
  map.addSource("arrests", {
    type: "geojson",
    data: "assets/arrests-data.geojson",
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 40
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "arrests",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#ffffcc",   // 0-9
        10, "#c7e9b4",   // 10-49
        50, "#7fcdbb",   // 50-199
        200, "#2c7fb8"   // 200+
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        16,
        10, 20,
        50, 24,
        200, 30
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff"
    }
  });

  // Click point so that it shows the landmark
  map.on("click", "Point", (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const landmark = e.features[0].properties.apprehension_site_landmark || "Unknown location";

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<strong>${landmark}</strong>`)
      .addTo(map);
  });

  // hover

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "arrests",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12
    },
    paint: {
      "text-color": "#ffffff"
    }
  });

  map.addLayer({
    id: "Point",
    type: "circle",
    source: "arrests",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#ffffcc",   // Low
        10, "#c7e9b4",  // Moderate
        50, "#7fcdbb",  // High
        200, "#2c7fb8"  // Very High
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        15,
        10, 20,
        50, 25,
        200, 30
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff"
    }
  });

  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters"]
    });

    const clusterId = features[0].properties.cluster_id;

    map.getSource("arrests").getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
  });

  loadCharts();
});

// Load and populate charts with real data
async function loadCharts() {
  try {
    const response = await fetch('assets/arrests-data.geojson');
    const geojson = await response.json();
    const features = geojson.features;

    // Calculate statistics
    const totalApprehensions = features.length;
    const uniqueSites = new Set(features.map(f => f.properties.apprehension_site_landmark));
    const uniqueLandmarks = uniqueSites.size;

    // Monthly data aggregation
    const monthlyData = {};
    const areaData = {};
    features.forEach(f => {
      const date = f.properties.apprehension_date.substring(0, 7);
      monthlyData[date] = (monthlyData[date] || 0) + 1;
      const area = f.properties.apprehension_site_landmark || 'Unknown';
      areaData[area] = (areaData[area] || 0) + 1;
    });

    // Update statistics
    document.getElementById('totalDeportations').textContent = totalApprehensions;
    document.getElementById('locationCount').textContent = uniqueLandmarks;
    const avgMonthly = features.length > 0 ? (totalApprehensions / 36).toFixed(0) : 0; // ~3 years
    document.getElementById('avgRate').textContent = avgMonthly;

    // Line Chart
    const months = Object.keys(monthlyData).sort();
    const c1 = document.getElementById('lineChart').getContext('2d');
    new Chart(c1, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Apprehensions',
          data: months.map(m => monthlyData[m]),
          borderColor: '#0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: Math.max(...Object.values(monthlyData)) + 10 },
          x: { display: true }
        }
      }
    });

    // Pie Chart
    const topAreas = Object.entries(areaData).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const c2 = document.getElementById('pieChart').getContext('2d');
    new Chart(c2, {
      type: 'doughnut',
      data: {
        labels: topAreas.map(a => a[0].substring(0, 20)),
        datasets: [{
          data: topAreas.map(a => a[1]),
          backgroundColor: ['#0066cc', '#ff6b6b', '#51cf66', '#ffd43b'],
          borderColor: '#242424',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
      }
    });
  } catch (e) {
    console.error('Error loading charts:', e);
  }
}
