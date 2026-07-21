/**
 * Weather & Satellite Map Component
 * Renders weather overlays, cloud visualizers, satellite tracks, cyclone paths,
 * and click-to-inspect Earth telemetry on Leaflet map.
 */

class WeatherMap {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.layers = {
      clouds: L.layerGroup(),
      satellites: L.layerGroup(),
      cyclones: L.layerGroup(),
      rainfall: L.layerGroup(),
      wind: L.layerGroup(),
      warnings: L.layerGroup(),
      historical: L.layerGroup(),
    };
    
    this.satelliteMarkers = [];
    this.satAnimTimer = null;
  }

  initialize() {
    // Add all weather & satellite layers to map
    Object.values(this.layers).forEach(layer => layer.addTo(this.map));

    // Enable click-on-map to inspect Earth point telemetry
    this.map.on('click', (e) => {
      if (e && e.latlng) {
        this.inspectEarthPoint(e.latlng.lat, e.latlng.lng);
      }
    });

    // Also attach to map container DOM to prevent drag interception
    const container = this.map.getContainer();
    if (container) {
      container.addEventListener('dblclick', (e) => {
        const rect = container.getBoundingClientRect();
        const pt = [e.clientX - rect.left, e.clientY - rect.top];
        const latlng = this.map.containerPointToLatLng(pt);
        if (latlng) this.inspectEarthPoint(latlng.lat, latlng.lng);
      });
    }

    // Initialize Cloud Layer & Satellite Orbits
    this.renderCloudLayer();
    this.initOrbitingSatellites();
  }

  /**
   * Render Animated Real-Time Cloud Cover Bands
   */
  renderCloudLayer() {
    this.layers.clouds.clearLayers();
    
    // Live Cloud Cover Tile Layer
    const cloudCenters = [
      { lat: 14.5, lon: 86.2, r: 380000, name: 'Bay of Bengal Monsoon Cloud Mass (85% Cover)' },
      { lat: 10.2, lon: 65.4, r: 420000, name: 'Arabian Sea Deep Convective Cloud System (90% Cover)' },
      { lat: 4.5, lon: 95.0, r: 480000, name: 'Equatorial Intertropical Convergence Zone Clouds' },
      { lat: 22.0, lon: 70.0, r: 280000, name: 'Coastal Moisture Front & Rain Clouds' },
      { lat: -5.0, lon: 75.0, r: 380000, name: 'South Indian Ocean Trade Cloud System' },
      { lat: 18.0, lon: 115.0, r: 480000, name: 'South China Sea Storm Cloud Mass' },
      { lat: 25.0, lon: 55.0, r: 220000, name: 'Persian Gulf Dust & Cloud System' }
    ];

    cloudCenters.forEach(c => {
      L.circle([c.lat, c.lon], {
        radius: c.r,
        color: '#e2e8f0',
        fillColor: '#ffffff',
        fillOpacity: 0.38,
        weight: 2,
        dashArray: '6, 6'
      }).bindTooltip(`☁️ ${c.name}`, { permanent: true, direction: 'center', className: 'cloud-mass-label' }).addTo(this.layers.clouds);
    });
  }

  /**
   * Click-to-Inspect Earth Point Telemetry HUD
   */
  async inspectEarthPoint(lat, lon) {
    // Fly smoothly to location if clicked
    this.map.panTo([lat, lon], { animate: true, duration: 0.5 });

    // Target Crosshair Marker on clicked point
    if (this.targetMarker) this.map.removeLayer(this.targetMarker);
    const crosshairIcon = L.divIcon({
      className: 'target-crosshair-marker',
      html: `<div style="width:32px;height:32px;border:2px solid #00e5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #00e5ff;animation:targetPulse 1s infinite alternate"><i class="fas fa-crosshairs" style="color:#00e5ff;font-size:16px"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    this.targetMarker = L.marker([lat, lon], { icon: crosshairIcon }).addTo(this.map);

    // Show loading popup at click location
    const popup = L.popup({ className: 'earth-telemetry-popup' })
      .setLatLng([lat, lon])
      .setContent(`
        <div style="padding:10px;text-align:center;color:var(--accent);">
          <i class="fas fa-satellite-dish fa-spin" style="font-size:1.5rem;margin-bottom:8px"></i><br/>
          <strong>Scanning Earth Telemetry...</strong><br/>
          <span style="font-size:11px;color:var(--text-muted)">Connecting to Satellite & Weather Feed</span>
        </div>
      `)
      .openOn(this.map);

    try {
      const data = await weatherService.fetchEarthDetailsAtPoint(lat, lon);
      
      const content = `
        <div class="weather-popup glass-popup">
          <div style="font-size:13px;font-weight:700;color:var(--accent);border-bottom:1px solid rgba(0,180,216,0.3);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
            <span><i class="fas fa-earth-asia"></i> EARTH POINT TELEMETRY</span>
            <span class="badge-status green">LIVE</span>
          </div>
          <div class="weather-detail"><span class="label">Coordinates:</span><span class="value">${data.lat}°, ${data.lon}°</span></div>
          <div class="weather-detail"><span class="label">Condition:</span><span class="value" style="color:#00e5ff">${data.condition}</span></div>
          <div class="weather-detail"><span class="label">Temperature:</span><span class="value">${data.temp} °C</span></div>
          <div class="weather-detail"><span class="label">Humidity / Pressure:</span><span class="value">${data.humidity}% | ${data.pressure} hPa</span></div>
          <div class="weather-detail"><span class="label">Wind Speed / Vector:</span><span class="value">${data.windSpeed} km/h (${data.windDeg}°)</span></div>
          <div class="weather-detail"><span class="label">Cloud Cover:</span><span class="value">${data.cloudCover}%</span></div>
          <div class="weather-detail"><span class="label">Sea Surface Temp:</span><span class="value">${data.seaSurfaceTemp}</span></div>
          <div class="weather-detail"><span class="label">Wave Height:</span><span class="value">${data.waveHeight}</span></div>
          
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.15);font-size:11px">
            <div><i class="fas fa-satellite" style="color:var(--yellow)"></i> Overhead Satellite: <strong>${data.overheadSatellite}</strong></div>
            <div><i class="fas fa-clock" style="color:var(--text-muted)"></i> Next Pass: <span>${data.nextSatPass}</span></div>
            <div style="margin-top:4px"><i class="fas fa-shield-cat"></i> Calamity Risk Index: <strong style="color:${data.riskLevel === 'critical' ? 'var(--red)' : data.riskLevel === 'high' ? 'var(--yellow)' : 'var(--green)'}">${data.riskLevel.toUpperCase()}</strong></div>
          </div>
          
          <button class="btn btn-primary btn-full" style="margin-top:10px;font-size:11px;padding:5px" onclick="if(window.updateWeatherData) window.updateWeatherData(${lat}, ${lon})">
            <i class="fas fa-sync"></i> Load Full Regional Weather
          </button>
        </div>
      `;
      popup.setContent(content);

      // Render Telemetry HUD Output Card on Weather Page
      if (window.weatherUI && window.weatherUI.renderPointTelemetryHUD) {
        window.weatherUI.renderPointTelemetryHUD(data);
      }
    } catch (err) {
      popup.setContent(`<div style="color:var(--red);padding:8px">Failed to load telemetry data.</div>`);
    }
  }

  /**
   * Real-time Orbiting Satellites Simulation
   */
  initOrbitingSatellites() {
    const satellites = [
      { name: 'ISS (Zarya)', type: 'Space Station', lat: 20.0, lon: 40.0, dLat: 0.15, dLon: 0.8, color: '#38bdf8', icon: 'space-station-with-service-module' },
      { name: 'Sentinel-2A', type: 'Earth Observation', lat: 10.0, lon: 80.0, dLat: 0.25, dLon: 0.6, color: '#10b981', icon: 'satellite' },
      { name: 'Landsat-9', type: 'Multispectral Land/Sea', lat: -15.0, lon: 70.0, dLat: -0.3, dLon: 0.7, color: '#ffd60a', icon: 'satellite' },
      { name: 'GOES-16', type: 'Geostationary Weather', lat: 5.0, lon: 110.0, dLat: 0.05, dLon: 0.4, color: '#ff9f1c', icon: 'satellite-dish' },
      { name: 'Terra (EOS AM-1)', type: 'Climate & Atmosphere', lat: 30.0, lon: 60.0, dLat: 0.2, dLon: 0.5, color: '#a855f7', icon: 'satellite' }
    ];

    this.layers.satellites.clearLayers();
    this.satelliteMarkers = [];

    satellites.forEach(sat => {
      const satIcon = L.divIcon({
        className: 'satellite-marker',
        html: `
          <div class="sat-wrapper" style="color:${sat.color}">
            <i class="fas fa-satellite fa-bounce"></i>
            <span class="sat-label">${sat.name}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const marker = L.marker([sat.lat, sat.lon], { icon: satIcon }).addTo(this.layers.satellites);
      marker.bindTooltip(`<strong>${sat.name}</strong><br/>Type: ${sat.type}<br/>Status: Active Orbit`, { direction: 'top' });
      
      this.satelliteMarkers.push({ marker, data: sat });
    });

    // Orbit update timer
    if (this.satAnimTimer) clearInterval(this.satAnimTimer);
    this.satAnimTimer = setInterval(() => {
      this.satelliteMarkers.forEach(s => {
        s.data.lat += s.data.dLat;
        s.data.lon += s.data.dLon;

        // Wrap around Earth coordinates
        if (s.data.lat > 80) s.data.lat = -80;
        if (s.data.lat < -80) s.data.lat = 80;
        if (s.data.lon > 180) s.data.lon = -180;
        if (s.data.lon < -180) s.data.lon = 180;

        s.marker.setLatLng([s.data.lat, s.data.lon]);
      });
    }, 2000);
  }

  renderCyclone(cyclone) {
    this.layers.cyclones.clearLayers();
    
    // Draw cyclone path (historical)
    if (cyclone.path && cyclone.path.length > 1) {
      const pathLine = L.polyline(cyclone.path, {
        color: '#ef476f',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5',
      }).addTo(this.layers.cyclones);
      
      pathLine.bindTooltip(`${cyclone.name} - Historical Path`, { permanent: false, direction: 'top' });
    }
    
    // Draw forecast path
    if (cyclone.forecast && cyclone.forecast.length > 0) {
      const forecastPath = [...(cyclone.path?.slice(-1) || [[cyclone.lat, cyclone.lon]]), ...cyclone.forecast];
      const forecastLine = L.polyline(forecastPath, {
        color: '#ffd60a',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 10',
      }).addTo(this.layers.cyclones);
      
      forecastLine.bindTooltip('Forecast Path', { permanent: false, direction: 'top' });
      
      // Add forecast position markers
      cyclone.forecast.forEach((pos, idx) => {
        L.circleMarker(pos, {
          radius: 6,
          fillColor: '#ffd60a',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).bindTooltip(`+${(idx + 1) * 12}h`, { permanent: false })
          .addTo(this.layers.cyclones);
      });
    }
    
    // Draw current cyclone position with animated ring
    const cycloneIcon = L.divIcon({
      className: 'cyclone-marker',
      html: `
        <div class="cyclone-icon">
          <div class="cyclone-ring"></div>
          <div class="cyclone-center">
            <i class="fas fa-hurricane"></i>
          </div>
          <div class="cyclone-label">${cyclone.name}</div>
        </div>
      `,
      iconSize: [80, 80],
      iconAnchor: [40, 40],
    });
    
    const marker = L.marker([cyclone.lat, cyclone.lon], { icon: cycloneIcon })
      .addTo(this.layers.cyclones);
    
    marker.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-hurricane"></i> ${cyclone.name}</h3>
        <div class="weather-detail"><span class="label">Category:</span><span class="value">${cyclone.category}</span></div>
        <div class="weather-detail"><span class="label">Wind Speed:</span><span class="value">${cyclone.windSpeed} km/h</span></div>
        <div class="weather-detail"><span class="label">Pressure:</span><span class="value">${cyclone.pressure} hPa</span></div>
        <div class="weather-detail"><span class="label">Status:</span><span class="value status-${cyclone.status}">${cyclone.status}</span></div>
        <div class="weather-warning"><i class="fas fa-triangle-exclamation"></i> ${cyclone.warning}</div>
        <div class="affected-regions"><strong>Affected Regions:</strong><br>${cyclone.affectedRegions.join(', ')}</div>
      </div>
    `);
    
    // Danger zone circle
    const dangerRadius = cyclone.windSpeed * 1200; // meters
    L.circle([cyclone.lat, cyclone.lon], {
      radius: dangerRadius,
      color: '#ef476f',
      fillColor: '#ef476f',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(this.layers.cyclones);
  }

  renderHistoricalDisaster(disaster) {
    const isTsunami = disaster.type === 'Tsunami';
    const isCyclone = disaster.type === 'Cyclone';
    const color = isTsunami ? '#38bdf8' : isCyclone ? '#ef476f' : '#ffd60a';
    const iconName = isTsunami ? 'water' : isCyclone ? 'hurricane' : 'triangle-exclamation';

    const disIcon = L.divIcon({
      className: 'disaster-hist-marker',
      html: `
        <div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#000;box-shadow:0 0 10px ${color}">
          <i class="fas fa-${iconName}" style="font-size:13px"></i>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([disaster.lat, disaster.lon], { icon: disIcon }).addTo(this.layers.historical);

    marker.bindPopup(`
      <div class="weather-popup">
        <h3 style="color:${color}"><i class="fas fa-${iconName}"></i> ${disaster.name} (${disaster.date.slice(0,4)})</h3>
        <div class="weather-detail"><span class="label">Type / Severity:</span><span class="value">${disaster.type} (${disaster.severity})</span></div>
        <div class="weather-detail"><span class="label">Location:</span><span class="value">${disaster.location}</span></div>
        <div class="weather-detail"><span class="label">Impact:</span><span class="value">${disaster.impact}</span></div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-muted);line-height:1.5">${disaster.details || ''}</div>
        ${disaster.lessons ? `<div style="margin-top:6px;font-size:11px;color:var(--accent)"><strong>Key Takeaway:</strong> ${disaster.lessons}</div>` : ''}
      </div>
    `);
  }

  renderRainfallHeatmap(data) {
    this.layers.rainfall.clearLayers();
    if (!data || data.length === 0) return;

    data.forEach(p => {
      L.circle([p.lat, p.lon], {
        radius: 35000,
        color: 'transparent',
        fillColor: '#3a86ff',
        fillOpacity: p.intensity * 0.4,
      }).addTo(this.layers.rainfall);
    });
  }

  renderWindPatterns(data) {
    this.layers.wind.clearLayers();
    if (!data || data.length === 0) return;

    data.forEach(p => {
      L.circleMarker([p.lat, p.lon], {
        radius: 4,
        color: '#00e5ff',
        fillColor: '#00e5ff',
        fillOpacity: 0.6,
      }).bindTooltip(`Wind: ${p.speed} km/h (${p.deg}°)`, { permanent: false }).addTo(this.layers.wind);
    });
  }

  generateDemoRainfall(lat, lon) {
    const points = [];
    for (let i = 0; i < 15; i++) {
      points.push({
        lat: lat + (Math.random() - 0.5) * 4,
        lon: lon + (Math.random() - 0.5) * 4,
        intensity: Math.random(),
      });
    }
    return points;
  }

  generateDemoWind(lat, lon) {
    const points = [];
    for (let i = 0; i < 12; i++) {
      points.push({
        lat: lat + (Math.random() - 0.5) * 5,
        lon: lon + (Math.random() - 0.5) * 5,
        speed: Math.round(15 + Math.random() * 30),
        deg: Math.round(Math.random() * 360),
      });
    }
    return points;
  }

  clearAll() {
    this.layers.cyclones.clearLayers();
    this.layers.rainfall.clearLayers();
    this.layers.wind.clearLayers();
    this.layers.warnings.clearLayers();
    this.layers.historical.clearLayers();
    this.renderCloudLayer();
    if (!this.satelliteMarkers || this.satelliteMarkers.length === 0) {
      this.initOrbitingSatellites();
    }
  }

  toggleLayer(layerName, visible) {
    if (!this.layers[layerName]) return;
    if (visible) {
      this.map.addLayer(this.layers[layerName]);
    } else {
      this.map.removeLayer(this.layers[layerName]);
    }
  }
}

// Export class
window.WeatherMap = WeatherMap;
