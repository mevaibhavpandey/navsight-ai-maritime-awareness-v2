/**
 * Weather Map Component
 * Renders weather overlays, cyclone paths, and disaster zones on Leaflet map
 */

class WeatherMap {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.layers = {
      cyclones: L.layerGroup(),
      rainfall: L.layerGroup(),
      wind: L.layerGroup(),
      warnings: L.layerGroup(),
      historical: L.layerGroup(),
    };
    
    this.heatmapCanvas = null;
    this.animationFrame = null;
    this.cloudOffset = 0;
  }

  initialize() {
    // Add all weather layers to map
    Object.values(this.layers).forEach(layer => layer.addTo(this.map));
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
      
      pathLine.bindTooltip(`${cyclone.name} - Historical Path`, {
        permanent: false,
        direction: 'top',
      });
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
      
      forecastLine.bindTooltip('Forecast Path', {
        permanent: false,
        direction: 'top',
      });
      
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
        <div class="weather-detail">
          <span class="label">Category:</span>
          <span class="value">${cyclone.category}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Wind Speed:</span>
          <span class="value">${cyclone.windSpeed} km/h</span>
        </div>
        <div class="weather-detail">
          <span class="label">Pressure:</span>
          <span class="value">${cyclone.pressure} hPa</span>
        </div>
        <div class="weather-detail">
          <span class="label">Status:</span>
          <span class="value status-${cyclone.status}">${cyclone.status}</span>
        </div>
        <div class="weather-warning">
          <i class="fas fa-triangle-exclamation"></i>
          ${cyclone.warning}
        </div>
        <div class="affected-regions">
          <strong>Affected Regions:</strong><br>
          ${cyclone.affectedRegions.join(', ')}
        </div>
      </div>
    `);
    
    // Draw danger zone (radius based on wind speed)
    const dangerRadius = cyclone.windSpeed * 500; // meters
    L.circle([cyclone.lat, cyclone.lon], {
      radius: dangerRadius,
      color: '#ef476f',
      fillColor: '#ef476f',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(this.layers.cyclones);
  }

  renderRainfallHeatmap(data) {
    this.layers.rainfall.clearLayers();
    
    if (!data || data.length === 0) return;
    
    // Create heatmap points
    const heatData = data.map(point => [
      point.lat,
      point.lon,
      point.intensity, // 0-1 scale
    ]);
    
    // Use canvas overlay for better performance
    const canvas = document.createElement('canvas');
    const bounds = this.map.getBounds();
    
    // Simple heatmap visualization using circles
    data.forEach(point => {
      const radius = 50000 * point.intensity; // meters
      L.circle([point.lat, point.lon], {
        radius: radius,
        color: this._getRainfallColor(point.intensity),
        fillColor: this._getRainfallColor(point.intensity),
        fillOpacity: 0.3,
        weight: 0,
      }).addTo(this.layers.rainfall);
    });
  }

  renderWindPatterns(windData) {
    this.layers.wind.clearLayers();
    
    if (!windData || windData.length === 0) return;
    
    windData.forEach(point => {
      const arrow = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          className: 'wind-arrow',
          html: `<div style="transform: rotate(${point.direction}deg)">
                   <i class="fas fa-arrow-up" style="color: ${this._getWindColor(point.speed)}"></i>
                 </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(this.layers.wind);
      
      arrow.bindTooltip(`Wind: ${point.speed.toFixed(1)} km/h`, {
        permanent: false,
        direction: 'top',
      });
    });
  }

  renderWarningZone(zone) {
    const polygon = L.polygon(zone.coordinates, {
      color: this._getWarningColor(zone.severity),
      fillColor: this._getWarningColor(zone.severity),
      fillOpacity: 0.2,
      weight: 2,
      dashArray: '10, 5',
    }).addTo(this.layers.warnings);
    
    polygon.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-triangle-exclamation"></i> ${zone.name}</h3>
        <div class="weather-detail">
          <span class="label">Severity:</span>
          <span class="value severity-${zone.severity}">${zone.severity}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Type:</span>
          <span class="value">${zone.type}</span>
        </div>
        <div class="weather-warning">${zone.warning}</div>
      </div>
    `);
    
    // Add warning icon at center
    const center = this._getPolygonCenter(zone.coordinates);
    L.marker(center, {
      icon: L.divIcon({
        className: 'warning-icon',
        html: '<i class="fas fa-triangle-exclamation"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    }).addTo(this.layers.warnings);
  }

  renderHistoricalDisaster(disaster) {
    const marker = L.circleMarker([disaster.lat, disaster.lon], {
      radius: 8,
      fillColor: this._getDisasterColor(disaster.type),
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    }).addTo(this.layers.historical);
    
    marker.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-clock-rotate-left"></i> ${disaster.name}</h3>
        <div class="weather-detail">
          <span class="label">Type:</span>
          <span class="value">${disaster.type}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Date:</span>
          <span class="value">${disaster.date}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Location:</span>
          <span class="value">${disaster.location}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Severity:</span>
          <span class="value severity-high">${disaster.severity}</span>
        </div>
        <div class="disaster-impact">
          <strong>Impact:</strong><br>
          ${disaster.impact}
        </div>
      </div>
    `);
  }

  toggleLayer(layerName, visible) {
    const layer = this.layers[layerName];
    if (!layer) return;
    
    if (visible) {
      this.map.addLayer(layer);
    } else {
      this.map.removeLayer(layer);
    }
  }

  clearLayer(layerName) {
    const layer = this.layers[layerName];
    if (layer) {
      layer.clearLayers();
    }
  }

  clearAll() {
    Object.values(this.layers).forEach(layer => layer.clearLayers());
  }

  // Helper methods
  _getRainfallColor(intensity) {
    if (intensity > 0.8) return '#ef476f';
    if (intensity > 0.6) return '#ff6b9d';
    if (intensity > 0.4) return '#4895ef';
    if (intensity > 0.2) return '#00b4d8';
    return '#90caf9';
  }

  _getWindColor(speed) {
    if (speed > 40) return '#ef476f';
    if (speed > 25) return '#ffd60a';
    if (speed > 15) return '#00b4d8';
    return '#90caf9';
  }

  _getWarningColor(severity) {
    const colors = {
      critical: '#ef476f',
      high: '#ffd60a',
      medium: '#ff9f1c',
      low: '#00b4d8',
    };
    return colors[severity] || colors.medium;
  }

  _getDisasterColor(type) {
    const colors = {
      Cyclone: '#ef476f',
      Flood: '#4895ef',
      Storm: '#ffd60a',
      Tsunami: '#b5179e',
    };
    return colors[type] || '#adb5bd';
  }

  _getPolygonCenter(coordinates) {
    let latSum = 0, lonSum = 0;
    coordinates.forEach(coord => {
      latSum += coord[0];
      lonSum += coord[1];
    });
    return [latSum / coordinates.length, lonSum / coordinates.length];
  }

  // Generate demo rainfall data for visualization
  generateDemoRainfall(centerLat, centerLon) {
    const data = [];
    const gridSize = 5;
    const step = 0.5;
    
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        const lat = centerLat + i * step;
        const lon = centerLon + j * step;
        const distance = Math.sqrt(i * i + j * j);
        const intensity = Math.max(0, 1 - distance / gridSize) * Math.random();
        
        if (intensity > 0.1) {
          data.push({ lat, lon, intensity });
        }
      }
    }
    
    return data;
  }

  // Generate demo wind pattern
  generateDemoWind(centerLat, centerLon) {
    const data = [];
    const gridSize = 8;
    const step = 1;
    
    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j += 2) {
        const lat = centerLat + i * step;
        const lon = centerLon + j * step;
        const angle = Math.atan2(i, j) * 180 / Math.PI;
        const distance = Math.sqrt(i * i + j * j);
        const speed = 10 + (gridSize - distance) * 3 + Math.random() * 10;
        
        data.push({
          lat,
          lon,
          direction: angle,
          speed: Math.max(0, speed),
        });
      }
    }
    
    return data;
  }
}
