let teamData = [];
let map;
let markerGroup;

const departmentColors = {
  'Art/Design': '#F333FF',
  'Development': '#33FFF5',
  'Animation': '#97FBA1',
  'Lua': '#3357FF',
  'QA': '#FFFF00',
  'Other': '#FFA500' 
};

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    teamData = data;
    initMap();
    renderMap(teamData);
    renderLegend();
  });

function getTimeDisplay(timezone) {
  const userZone = luxon.DateTime.now().zoneName;
  if (luxon.IANAZone.isValidZone(timezone)) {
    const now = luxon.DateTime.now().setZone(timezone);
    const local = luxon.DateTime.now().setZone(userZone);
    const diff = now.offset - local.offset;
    const label =
      diff === 0
        ? "Same time as you"
        : `${diff / 60 > 0 ? "+" : ""}${diff / 60}h ${diff > 0 ? "ahead" : "behind"}`;
    return `🕒 ${now.toFormat("HH:mm")} (${label})`;
  }
  return "🕒 Invalid timezone";
}

function initMap() {
  map = L.map("map").setView([30, 0], 2);

  // 🌑 DARK THEME tile layer from CartoDB
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  markerGroup = L.layerGroup().addTo(map);
}

function renderMap(data) {
  if (map) {
    markerGroup.clearLayers();
  } else {
    map = L.map("map").setView([30, 0], 2);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    markerGroup = L.layerGroup().addTo(map);
  }

  // Group people by coordinate string
  const grouped = {};
  data.forEach(person => {
    if (!person.coords) return;
    const key = person.coords.join(",");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(person);
  });

  // Place markers with offsets if needed
  Object.values(grouped).forEach(group => {
    const baseLat = group[0].coords[0];
    const baseLng = group[0].coords[1];

    group.forEach((person, index) => {
      const offset = 0.003;
      const angle = (index / group.length) * 2 * Math.PI;
      const latOffset = offset * Math.cos(angle);
      const lngOffset = offset * Math.sin(angle);
      const adjustedCoords = group.length === 1 ? person.coords : [baseLat + latOffset, baseLng + lngOffset];

      const markerColor = departmentColors[person.department] || '#FFFFFF';

      const marker = L.circleMarker(adjustedCoords, {
        radius: 8,
        fillColor: markerColor,
        color: markerColor,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.7
      });

      const timeDisplay = getTimeDisplay(person.timezone);
      marker.bindPopup(`
        <div style="
          background: #1a1a1a;
          padding: 0.25rem;
          border-radius: 12px;
          color: white;
          text-align: center;
          font-family: sans-serif;
          min-width: 180px;
          box-shadow: 0 0 10px rgba(0,0,0,0.6);
        ">
          <img src="${person.image}" style="
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 50%;
            border: 2px solid #14b8a6;
            margin: auto;        
          " />
          <div style="font-weight: 600; color: #14b8a6;">${person.name}</div>
          <div style="font-weight: bold; color: #00eefd;"; font-size: 0.9rem;">${person.role}</div>
          <div style="color: #ccc; font-size: 0.85rem;">${person.location}</div>
          <div style="color: #999; font-size: 0.75rem; margin-top: 0.3rem;">${getTimeDisplay(person.timezone)}</div>
        </div>
      `);      

      markerGroup.addLayer(marker);
    });
  });

  setTimeout(() => map.invalidateSize(), 300);
}


function renderLegend() {
  const legend = L.control({ position: "topright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    div.style.background = "rgba(0, 0, 0, 0.8)";
    div.style.padding = "10px";
    div.style.borderRadius = "6px";
    div.style.color = "#fff";
    div.style.fontSize = "12px";

    for (const [dept, color] of Object.entries(departmentColors)) {
      div.innerHTML += `
        <div style="margin-bottom:4px">
          <span style="display:inline-block;width:12px;height:12px;background:${color};border-radius:2px;margin-right:6px;"></span>
          ${dept}
        </div>`;
    }

    return div;
  };

  legend.addTo(map);
}
