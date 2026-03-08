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
      "circle-radius": 18,
      "circle-color": "#3b82f6",
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
  map.on("mouseenter", "Point", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "Point", () => {
    map.getCanvas().style.cursor = "";
  });

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
});
