mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaGFzcyIsImEiOiJjbW0xOWt1b2MwN2s0MnNvYzFhNW5tZXRjIn0.woofAfgLav-FoAG30Mo0pg";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [-120.7401, 47.7511]],
    zoom: 6.2
});

let collisionData = null;

// Legend breaks (based on CLUSTER counts)
const grades = ['1', '2-9', '10-49', '50+'];
const colors = ['#cb181d', '#ffebb5', '#82b1df', '#b96295'];
const radii = [8, 14, 20, 28];

// Legend HTML
const legend = document.getElementById('legend');
let labels = ['<strong># of Collisions (Cluster)</strong>'];
for (let i = 0; i < grades.length; i++) {
  const vbreak = grades[i];
  const dot_radii = 2 * radii[i];
  labels.push(
    `<p class="break">
      <i class="dot" style="background:${colors[i]}; width:${dot_radii}px; height:${dot_radii}px;"></i>
      <span class="dot-label" style="top:${dot_radii / 2}px;">${vbreak}</span>
    </p>`
  );
}

const source = `<p style="text-align:right; font-size:10pt">
  Source: <a href="https://data-seattlecitygis.opendata.arcgis.com/" target="_blank"
  style="color:#66aaff; text-decoration:none;">Seattle City GIS Open Data</a></p>`;

legend.innerHTML = labels.join('') + source;

// C3 Chart (Top 7 collision types currently in map view)
const chart = c3.generate({
  data: {
    columns: [],
    x: 'x',
    type: 'bar'
  },
  axis: {
    x: { label: 'Collisions', type: 'category' },
    y: { label: 'Number of collisions in current map view' }
  },
  legend: { show: false },
  bindto: '#chart'
});

async function geojsonFetch() {
  const response = await fetch('arrests-washington-only.csv');
  collisionData = await response.json();

  map.on('load', () => {
    map.addSource('collisions', {
      type: 'geojson',
      data: collisionData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Unclustered points
    map.addLayer({
      id: 'collision-points',
      type: 'circle',
      source: 'collisions',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ff6b6b',
        'circle-radius': 5,
        'circle-opacity': 0.55,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1
      }
    });

    // Clusters (proportional-ish by point_count)
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'collisions',
      filter: ['has', 'point_count'],
      paint: {
        'circle-opacity': 0.75,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
        'circle-color': [
          'step',
          ['get', 'point_count'],
          colors[1],  // 1-4
          5, colors[2], // 5-9
          10, colors[3] // 10+
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          12,
          5, 18,
          10, 26,
          50, 34
        ]
      }
    });

    // Cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'collisions',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Click popup for individual collision
    map.on('click', 'collision-points', (e) => {
      const f = e.features[0];
      const p = f.properties;

      // Some ArcGIS exports stringify numbers; keep it simple:
      const collisionType = p.COLLISIONTYPE || 'Unknown';
      const severity = p.SEVERITYDESC || 'Unknown';
      const when = p.INCDTTM || p.INCDATE || 'Unknown';
      const location = p.LOCATION || 'Unknown';
      const report = p.REPORTNO || 'N/A';

      new mapboxgl.Popup()
        .setLngLat(f.geometry.coordinates)
        .setHTML(`
          <strong>Seattle Collision (2024)</strong><br>
          <strong>Type:</strong> ${collisionType}<br>
          <strong>Severity:</strong> ${severity}<br>
          <strong>Date/Time:</strong> ${when}<br>
          <strong>Location:</strong> ${location}<br>
          <strong>Report #:</strong> ${report}
        `)
        .addTo(map);
    });

    // Cursor pointer on interactive layers
    ['collision-points', 'clusters'].forEach(layer => {
      map.on('mouseenter', layer, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', layer, () => map.getCanvas().style.cursor = '');
    });

    updateDashboard();
  });

  map.on('idle', () => updateDashboard());
}

function updateDashboard() {
  if (!collisionData) return;

  const bounds = map.getBounds();

  let totalInView = 0;
  let typeCounts = {};
  let severityCounts = {};

  collisionData.features.forEach(f => {
    const coords = f.geometry.coordinates;
    if (bounds.contains(coords)) {
      totalInView++;

      const type = f.properties.COLLISIONTYPE || "Unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      const sev = f.properties.SEVERITYDESC || "Unknown";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
  });

  // KPI number (you need <span id="collision-count"></span> in HTML)
  document.getElementById("collision-count").innerText = totalInView;

  // Top collision types (bar chart)
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const columns = [
    ['x', ...topTypes.map(d => d[0])],
    ['Collisions', ...topTypes.map(d => d[1])]
  ];

  chart.load({ columns });

  
}

const reset = document.getElementById('reset');
reset.addEventListener('click', () => {
  map.flyTo({ center: [-122.3321, 47.6170], zoom: 10.5 });
  chart.load({ columns: [] });
});

// Run
geojsonFetch();
