let teamData = [];
let map;
let markerGroup;
let markerStyle = "color"; // 'color' or 'photo'

const departmentColors = {
  "Art/Design": "#F333FF",
  Development: "#33FFF5",
  Animation: "#97FBA1",
  Lua: "#3357FF",
  QA: "#FFFF00",
  Other: "#FFA500",
};

const departmentFilter = document.getElementById("departmentFilter");
const locationFilter = document.getElementById("locationFilter");
const searchInput = document.getElementById("searchInput");
const toggleBtn = document.getElementById("togglePinsBtn");

fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    teamData = data;
    initMap();
    populateFilters();
    renderMap(teamData);
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
        : `${diff / 60 > 0 ? "+" : ""}${diff / 60}h ${
            diff > 0 ? "ahead" : "behind"
          }`;
    return `⏰ ${now.toFormat("HH:mm")} (${label})`;
  }
  return "⏰ Invalid timezone";
}

function initMap() {
  map = L.map("map").setView([30, 0], 2);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; CARTO, OpenStreetMap",
  }).addTo(map);
  markerGroup = L.layerGroup().addTo(map);

  // ✅ Add legend
  const legend = L.control({ position: "topright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    div.innerHTML = "<strong>Departments</strong><br>";
    for (const [dept, color] of Object.entries(departmentColors)) {
      div.innerHTML += `<i style="background:${color};display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:50%;"></i>${dept}<br>`;
    }
    return div;
  };
  legend.addTo(map);
}

function renderMap(data) {
  markerGroup.clearLayers();
  const seenCoords = new Map();

  data.forEach((person) => {
    if (person.coords && Array.isArray(person.coords)) {
      let [lat, lng] = person.coords;
      const coordKey = `${lat},${lng}`;
      const count = seenCoords.get(coordKey) || 0;
      seenCoords.set(coordKey, count + 1);
      lat += count * 0.005;
      lng += count * 0.005;

      let marker;

      if (markerStyle === "color") {
        const markerColor = departmentColors[person.department] || "#FFFFFF";
        marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: markerColor,
          color: markerColor,
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6,
        });
      } else {
        const icon = L.icon({
          iconUrl: person.image,
          iconSize: [40, 40],
          className: "rounded-full border border-teal-500",
        });
        marker = L.marker([lat, lng], { icon });
      }

      const popupHTML = `
        <div style="text-align:center">
          <img src="${person.image}" style="width:50px;height:50px;border-radius:50%;border:2px solid #14b8a6;margin: auto; ">
          <div style="font-weight:bold;color:#14b8a6">${person.name}</div>
          <div style="font-weight:bold; color: #00eefd; font-size: 0.9rem;">${person.role}</div>
          <div style="font-size:smaller">${person.location}</div>
          <div style="font-size:x-small;color:gray">${getTimeDisplay(person.timezone)}</div>
        </div>`;

      marker.bindPopup(popupHTML);
      markerGroup.addLayer(marker);
    }
  });

  setTimeout(() => map.invalidateSize(), 300);
}

function applyFilters() {
  const dept = departmentFilter?.value || "all";
  const loc = locationFilter?.value || "all";
  const term = searchInput?.value.toLowerCase() || "";

  const filtered = teamData.filter((person) => {
    const deptMatch = dept === "all" || person.department === dept;
    const locMatch = loc === "all" || person.location === loc;
    const textMatch = person.name.toLowerCase().includes(term);
    return deptMatch && locMatch && textMatch;
  });

  renderMap(filtered);
}

function populateFilters() {
  if (!departmentFilter || !locationFilter) return;

  const depts = new Set();
  const locs = new Set();

  teamData.forEach((t) => {
    depts.add(t.department);
    locs.add(t.location);
  });

  [...depts].sort().forEach((dept) => {
    const opt = document.createElement("option");
    opt.value = dept;
    opt.textContent = dept;
    departmentFilter.appendChild(opt);
  });

  [...locs].sort().forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
}

// 🔘 TOGGLE HANDLER
toggleBtn?.addEventListener("click", () => {
  markerStyle = markerStyle === "color" ? "photo" : "color";
  applyFilters();
  toggleBtn.textContent =
    markerStyle === "color"
      ? "Switch to Profile Pics"
      : "Switch to Colored Pins";
});

departmentFilter?.addEventListener("change", applyFilters);
locationFilter?.addEventListener("change", applyFilters);
searchInput?.addEventListener("input", applyFilters);
