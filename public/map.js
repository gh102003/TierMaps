const covidData = require("./covidData.js");

document.addEventListener("DOMContentLoaded", function () {
  const map = L.map("map");

  map.setView([54.2, -2.5], 6);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: "pk.eyJ1IjoiZ2gxMDIwMDMiLCJhIjoiY2toejVsZmt6MGNmdTJycWg1cno1MXV1cCJ9.mcCZuCQscGmvI3cvKxJhmQ"
  }).addTo(map);

  const addCovidDataTooltip = (feature, layer) => {
    const ltlaCode = feature.properties.LAD20CD;
    const ltlaName = feature.properties.LAD20NM;
    const caseRise = covidData.getCaseRise(ltlaCode);
    const deathRise = covidData.getDeathRise(ltlaCode);
    const caseRisePercentageChange = covidData.getCaseRisePercentageChange(ltlaCode);

    if (caseRise) {
      layer.bindPopup(`
      <h3 class="popup-ltla-name">${ltlaName}</h3>
      <p><span class="popup-statistic">${caseRise.toFixed(1)}</span> cases per week per 100k population</p>
      <p><span class="popup-statistic">${caseRisePercentageChange.toFixed(1)}%</span> case rise change</p>
      <p><span class="popup-statistic">${deathRise.toFixed(1)}</span> deaths per week per 100k population</p>
      `);
    } else {
      layer.bindPopup(`<h3 class="popup-ltla-name">${ltlaName}</h3><p>not enough data available</p>`);
    }
  };

  covidData.loadData()
    // https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2020-boundaries-uk-buc?geometry=-73.847%2C46.014%2C68.975%2C63.432
    .then(() => fetch("https://opendata.arcgis.com/datasets/910f48f3c4b3400aa9eb0af9f8989bbe_0.geojson")) // 500m resolution
    // .then(() => fetch("https://opendata.arcgis.com/datasets/3b374840ce1b4160b85b8146b610cd0c_0.geojson")) // 20m resolution
    .then(res => res.json())
    .then(geodata => {
      console.log(geodata);

      const caseRiseLayer = L.geoJSON(geodata, {
        style: feature => {
          const baseStyle = { weight: 1, color: "black", opacity: 0.15, fillOpacity: 0.7 };
          const ltlaCode = feature.properties.LAD20CD;
          const caseRise = covidData.getCaseRise(ltlaCode);

          if (caseRise === null) {
            return { ...baseStyle, fillColor: "#aab" };
          } else {
            return { ...baseStyle, fillColor: `hsl(28, ${Math.min(100, 60 + caseRise * 0.06)}%, ${Math.max(0, 95 - caseRise * 0.12)}%)` }
          }
        },
        onEachFeature: addCovidDataTooltip
      }).addTo(map);

      const caseRisePercentageChangeLayer = L.geoJSON(geodata, {
        style: feature => {
          const baseStyle = { weight: 1, color: "black", opacity: 0.15, fillOpacity: 0.7 };
          const ltlaCode = feature.properties.LAD20CD;
          const caseRisePercentageChange = covidData.getCaseRisePercentageChange(ltlaCode);

          if (caseRisePercentageChange === null) {
            return { ...baseStyle, fillColor: "#bab" };
          } else {
            return { ...baseStyle, fillColor: `hsl(${caseRisePercentageChange > 0 ? 28 : 155}, ${Math.min(100, 50 + caseRisePercentageChange * 0.5)}%, ${Math.max(0, 100 - Math.abs(caseRisePercentageChange) * 0.5)}%)` }
          }
        },
        onEachFeature: addCovidDataTooltip
      });

      const deathRiseLayer = L.geoJSON(geodata, {
        style: feature => {
          const baseStyle = { weight: 1, color: "black", opacity: 0.15, fillOpacity: 0.7 };
          const ltlaCode = feature.properties.LAD20CD;
          const deathRise = covidData.getDeathRise(ltlaCode);

          if (deathRise === null) {
            return { ...baseStyle, fillColor: "#aab" };
          } else {
            return { ...baseStyle, fillColor: `hsl(28, ${Math.min(100, 60 + deathRise * 1)}%, ${Math.max(0, 95 - deathRise * 2.2)}%)` }
          }
        },
        onEachFeature: addCovidDataTooltip
      });

      L.control.layers({
        "cases": caseRiseLayer,
        "case change": caseRisePercentageChangeLayer,
        "deaths": deathRiseLayer
      }).addTo(map);

    });

});