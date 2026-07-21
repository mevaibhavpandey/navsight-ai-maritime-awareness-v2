/**
 * Weather & Disaster Intelligence UI Components
 * Handles weather dashboard, search, forecasts, calamity inspection,
 * satellite telemetry, and emergency disaster survival guidelines.
 */

class WeatherUI {
  constructor() {
    this.currentLocation = { lat: 15.0, lon: 78.0, name: 'India (Center)' };
    this.selectedDate = new Date();
    this.activeCalamityCategory = 'all';
    this.activeSurvivalCategory = 'cyclone';
  }

  renderWeatherDashboard(weather, forecast, cyclones) {
    const container = document.getElementById('weather-dashboard');
    if (!container) return;

    const riskLevel = weatherService.calculateRiskLevel(weather, cyclones);
    const riskColors = {
      low: 'var(--green)',
      medium: 'var(--yellow)',
      high: 'var(--yellow)',
      critical: 'var(--red)',
    };

    container.innerHTML = `
      <div class="weather-kpi-row">
        <div class="kpi-card glass">
          <div class="kpi-icon"><i class="fas fa-temperature-half"></i></div>
          <div class="kpi-body">
            <span class="kpi-val">${Math.round(weather.main?.temp || 0)}°C</span>
            <span class="kpi-label">Temperature</span>
          </div>
        </div>
        
        <div class="kpi-card glass">
          <div class="kpi-icon"><i class="fas fa-wind"></i></div>
          <div class="kpi-body">
            <span class="kpi-val">${Math.round(weather.wind?.speed || 0)}</span>
            <span class="kpi-label">Wind (km/h)</span>
          </div>
        </div>
        
        <div class="kpi-card glass">
          <div class="kpi-icon"><i class="fas fa-droplet"></i></div>
          <div class="kpi-body">
            <span class="kpi-val">${Math.round(weather.main?.humidity || 0)}%</span>
            <span class="kpi-label">Humidity</span>
          </div>
        </div>
        
        <div class="kpi-card glass" style="border-left: 3px solid ${riskColors[riskLevel]}">
          <div class="kpi-icon" style="color: ${riskColors[riskLevel]}">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <div class="kpi-body">
            <span class="kpi-val" style="color: ${riskColors[riskLevel]}">${riskLevel.toUpperCase()}</span>
            <span class="kpi-label">Risk Level</span>
          </div>
        </div>
        
        <div class="kpi-card glass">
          <div class="kpi-icon"><i class="fas fa-hurricane"></i></div>
          <div class="kpi-body">
            <span class="kpi-val">${cyclones?.length || 0}</span>
            <span class="kpi-label">Active Cyclones</span>
          </div>
        </div>
      </div>

      <div class="weather-grid">
        <!-- Current Weather Card -->
        <div class="card glass">
          <div class="card-header">
            <i class="fas fa-cloud-sun"></i> Current Conditions
          </div>
          <div class="weather-current">
            <div class="weather-icon-large">
              <i class="fas fa-${this._getWeatherIcon(weather.weather?.[0]?.main)}"></i>
            </div>
            <div class="weather-temp-large">${Math.round(weather.main?.temp || 0)}°C</div>
            <div class="weather-desc">${weather.weather?.[0]?.description || 'N/A'}</div>
            <div class="weather-location">
              <i class="fas fa-location-dot"></i> ${this.currentLocation.name}
            </div>
            <div class="weather-details-grid">
              <div class="detail-item">
                <i class="fas fa-temperature-arrow-down"></i>
                <span>Feels Like: ${Math.round(weather.main?.feels_like || 0)}°C</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-gauge"></i>
                <span>Pressure: ${weather.main?.pressure || 0} hPa</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-compass"></i>
                <span>Wind Direction: ${weather.wind?.deg || 0}°</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-cloud"></i>
                <span>Cloudiness: ${weather.clouds?.all || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 7-Day Forecast -->
        <div class="card glass forecast-card">
          <div class="card-header">
            <i class="fas fa-calendar-days"></i> 7-Day Regional Forecast
          </div>
          <div class="forecast-scroll">
            ${this._renderForecast(forecast)}
          </div>
        </div>

        <!-- Safety & Precautions Quick View -->
        <div class="card glass">
          <div class="card-header">
            <i class="fas fa-shield-halved"></i> Immediate Operations Advisories
          </div>
          <div class="precautions-list">
            ${this._renderPrecautions(riskLevel, cyclones)}
          </div>
        </div>

        <!-- Active Cyclones -->
        ${cyclones && cyclones.length > 0 ? `
          <div class="card glass cyclone-alert-card">
            <div class="card-header" style="color: var(--red)">
              <i class="fas fa-hurricane"></i> Active Cyclone Alert
            </div>
            ${cyclones.map(c => this._renderCycloneAlert(c)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderLocationSearch() {
    return `
      <div class="card glass" style="margin-bottom: 20px;">
        <div class="weather-search-bar">
          <div class="search-input-group" style="display:flex;gap:10px;align-items:center;width:100%">
            <i class="fas fa-magnifying-glass" style="color:var(--accent)"></i>
            <input 
              type="text" 
              id="weather-location-search" 
              placeholder="Search any global location (e.g. Mumbai, Tokyo, London, Singapore, Male, Port Blair)..."
              autocomplete="off"
              style="flex:1;background:transparent;border:none;color:var(--text);font-size:14px;outline:none"
              onkeypress="if(event.key==='Enter') weatherUI.searchLocation()"
            />
            <button class="btn btn-primary" onclick="weatherUI.searchLocation()">
              <i class="fas fa-search"></i> Get Weather
            </button>
          </div>
          <div id="search-results" class="search-results"></div>
        </div>
      </div>
    `;
  }

  async searchLocation() {
    const input = document.getElementById('weather-location-search');
    const query = input?.value.trim();
    if (!query) return;

    const results = await weatherService.searchLocation(query);
    this.displaySearchResults(results);
  }

  displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = '<div class="search-no-results" style="padding:10px;color:var(--text-muted)">No locations found</div>';
      return;
    }

    container.innerHTML = results.map(loc => `
      <div class="search-result-item" onclick="weatherUI.selectLocation(${loc.lat}, ${loc.lon}, '${loc.name.replace(/'/g, "\\'")}')">
        <i class="fas fa-location-dot" style="color:var(--accent)"></i>
        <div>
          <div class="result-name" style="font-weight:600">${loc.name}</div>
          <div class="result-coords" style="font-size:11px;color:var(--text-muted)">Coordinates: ${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°</div>
        </div>
      </div>
    `).join('');
  }

  selectLocation(lat, lon, name) {
    this.currentLocation = { lat, lon, name };
    document.getElementById('search-results').innerHTML = '';
    const input = document.getElementById('weather-location-search');
    if (input) input.value = name;
    
    // Trigger weather update
    if (window.updateWeatherData) {
      window.updateWeatherData(lat, lon);
    }
  }

  /**
   * Historical Calamities Inspector Database UI
   */
  renderHistoricalView(disasters) {
    const container = document.getElementById('weather-historical');
    if (!container) return;

    const filtered = this.activeCalamityCategory === 'all' 
      ? disasters 
      : disasters.filter(d => d.type.toLowerCase() === this.activeCalamityCategory);

    container.innerHTML = `
      <div class="card glass" style="margin-top: 20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <i class="fas fa-clock-rotate-left"></i> Historical Calamities & Major Disasters Inspector
          </div>
          <div class="category-tabs" style="display:flex;gap:6px">
            <button class="btn ${this.activeCalamityCategory==='all'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setDisasterCategory('all')">All</button>
            <button class="btn ${this.activeCalamityCategory==='tsunami'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setDisasterCategory('tsunami')">Tsunamis</button>
            <button class="btn ${this.activeCalamityCategory==='cyclone'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setDisasterCategory('cyclone')">Cyclones</button>
            <button class="btn ${this.activeCalamityCategory==='flood'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setDisasterCategory('flood')">Floods</button>
          </div>
        </div>

        <div class="disaster-timeline" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:14px;padding:14px">
          ${filtered.map(d => `
            <div class="disaster-card-box glass" style="border-left: 4px solid ${d.type === 'Tsunami' ? '#38bdf8' : d.type === 'Cyclone' ? '#ef476f' : '#ffd60a'};padding:14px;border-radius:8px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <div style="font-size:15px;font-weight:700;color:var(--text)">
                  <i class="fas fa-${this._getDisasterIcon(d.type)}" style="color:${d.type === 'Tsunami' ? '#38bdf8' : '#ef476f'};margin-right:6px"></i> ${d.name}
                </div>
                <span class="badge" style="background:rgba(255,255,255,0.1);font-size:10px">${d.date.slice(0,4)}</span>
              </div>

              <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">
                <i class="fas fa-location-dot"></i> ${d.location}
              </div>

              <div style="font-size:12px;color:var(--yellow);font-weight:600;margin-bottom:6px">
                Severity: ${d.severity}
              </div>

              <div style="font-size:12px;color:var(--text);margin-bottom:8px;line-height:1.5">
                ${d.impact}
              </div>

              ${d.details ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.4">${d.details}</div>` : ''}

              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;flex:1" onclick="weatherUI.focusDisaster(${d.lat}, ${d.lon})">
                  <i class="fas fa-crosshairs"></i> Inspect on Map
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Natural Calamities Emergency Survival & Safety Guide -->
      ${this.renderSurvivalGuide()}
    `;
  }

  setDisasterCategory(cat) {
    this.activeCalamityCategory = cat;
    this.renderHistoricalView(weatherService.getDisasterHistory());
  }

  /**
   * Disaster Preparedness & Emergency Survival Guide
   */
  renderSurvivalGuide() {
    const survivalData = {
      cyclone: {
        title: '🌀 Cyclone & Severe Typhoon Safety Protocol',
        before: [
          'Secure roof structures, storm shutters, and clear loose outdoor objects.',
          'Stock 72-hour emergency water (3 gal/person), non-perishable food, and Go-Bag.',
          'Keep VHF Channel 16 radio active; monitor IMD / Coast Guard advisories.'
        ],
        during: [
          'Remain indoors in an interior windowless room or designated shelter.',
          'Do NOT venture outside during the eye of the storm—winds will resume suddenly.',
          'Disconnect main electrical supply if coastal water inundation begins.'
        ],
        after: [
          'Watch out for fallen power lines, weakened trees, and structural collapses.',
          'Drink only boiled or bottled water to prevent waterborne epidemic outbreaks.',
          'Signal rescue teams via visual SOS cloth or flashlights.'
        ]
      },
      tsunami: {
        title: '🌊 Tsunami & Rogue Wave Emergency Protocol',
        before: [
          'Recognize natural warnings: Strong ground shaking or sudden ocean water recedence.',
          'Identify inland high-ground evacuation points (>30 meters elevation).',
          'Vessels at sea in deep water (>100m) MUST stay offshore; do NOT enter port.'
        ],
        during: [
          'Run immediately inland and uphill; do NOT wait for official sirens.',
          'Never go to the beach to watch a tsunami wave coming.',
          'If caught in water, grab floating debris (doors, life rings, logs).'
        ],
        after: [
          'Remain on high ground for at least 3-4 hours; tsunamis come in multiple wave series.',
          'Avoid flooded coastal structures which may collapse without warning.'
        ]
      },
      earthquake: {
        title: '🏚️ Earthquake & Seismic Tremor Protocol',
        before: [
          'Anchor heavy equipment, lockers, and gas cylinders to structural walls.',
          'Identify safe spots under sturdy desks or interior structural doorways.'
        ],
        during: [
          'DROP to your hands and knees. COVER your head/neck. HOLD ON to your shelter.',
          'If outdoors: Move away from buildings, streetlights, and utility wires.',
          'If driving: Pull over safely away from overpasses and stop.'
        ],
        after: [
          'Be prepared for aftershocks. Check for gas leaks and fire hazards.',
          'If trapped under rubble, tap on pipes or walls so rescuers can locate you.'
        ]
      },
      vessel: {
        title: '⚓ Maritime Vessel Distress & Capsizing Survival',
        before: [
          'Verify all crew wear SOLAS-approved Life Jackets with whistles & lights.',
          'Inspect EPIRB, SART transponders, life raft hydrostatic releases, and pyrotechnics.'
        ],
        during: [
          'Transmit MAYDAY MAYDAY MAYDAY on VHF Ch 16 with MMSI, Lat/Lon, and nature of distress.',
          'Deploy life rafts on the leeward (downwind) side of the vessel.',
          'Huddle together in water in the HELP posture to conserve body heat.'
        ],
        after: [
          'Activate SART and EPIRB beacons for satellite Search & Rescue tracking.',
          'Ration fresh water and deploy solar/signal mirrors for passing aircraft.'
        ]
      }
    };

    const cur = survivalData[this.activeSurvivalCategory] || survivalData.cyclone;

    return `
      <div class="card glass" style="margin-top: 20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <i class="fas fa-life-ring" style="color:var(--accent)"></i> Natural Calamities Emergency Survival & Safety Guide
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn ${this.activeSurvivalCategory==='cyclone'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 8px" onclick="weatherUI.setSurvivalCategory('cyclone')">Cyclones</button>
            <button class="btn ${this.activeSurvivalCategory==='tsunami'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 8px" onclick="weatherUI.setSurvivalCategory('tsunami')">Tsunamis</button>
            <button class="btn ${this.activeSurvivalCategory==='earthquake'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 8px" onclick="weatherUI.setSurvivalCategory('earthquake')">Earthquakes</button>
            <button class="btn ${this.activeSurvivalCategory==='vessel'?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 8px" onclick="weatherUI.setSurvivalCategory('vessel')">Marine SOS</button>
          </div>
        </div>

        <div style="padding:16px">
          <h3 style="color:var(--accent);margin-bottom:14px;font-size:16px">${cur.title}</h3>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:20px">
            <div style="background:rgba(0,180,216,0.08);padding:12px;border-radius:8px;border-top:3px solid var(--accent)">
              <h4 style="color:var(--accent);margin-bottom:8px;font-size:13px"><i class="fas fa-hourglass-start"></i> BEFORE (Preparation)</h4>
              <ul style="padding-left:18px;font-size:12px;color:var(--text);line-height:1.6">
                ${cur.before.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>

            <div style="background:rgba(239,71,111,0.08);padding:12px;border-radius:8px;border-top:3px solid var(--red)">
              <h4 style="color:var(--red);margin-bottom:8px;font-size:13px"><i class="fas fa-bolt"></i> DURING (Immediate Action)</h4>
              <ul style="padding-left:18px;font-size:12px;color:var(--text);line-height:1.6">
                ${cur.during.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>

            <div style="background:rgba(255,214,10,0.08);padding:12px;border-radius:8px;border-top:3px solid var(--yellow)">
              <h4 style="color:var(--yellow);margin-bottom:8px;font-size:13px"><i class="fas fa-kit-medical"></i> AFTER (Recovery & SOS)</h4>
              <ul style="padding-left:18px;font-size:12px;color:var(--text);line-height:1.6">
                ${cur.after.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Emergency Helplines & SOS Contacts Bar -->
          <div style="background:rgba(0,0,0,0.3);padding:14px;border-radius:8px;border:1px solid rgba(0,180,216,0.2);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-weight:700;color:var(--accent);font-size:13px"><i class="fas fa-phone-volume"></i> Emergency Disaster Helplines</div>
              <div style="font-size:11px;color:var(--text-muted)">Indian Coast Guard: <strong>1554</strong> | NDMA National Helpline: <strong>1078</strong> | Navy SAR: <strong>022-22751000</strong></div>
            </div>
            <button class="btn btn-primary" style="font-size:11px;padding:6px 14px" onclick="alert('MAYDAY FORMAT:\\n1. \\'MAYDAY MAYDAY MAYDAY\\'\\n2. Vessel Name & MMSI\\n3. Position (Lat/Lon)\\n4. Nature of distress & Number of onboard personnel')">
              <i class="fas fa-tower-cell"></i> Mayday Distress Format
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setSurvivalCategory(cat) {
    this.activeSurvivalCategory = cat;
    this.renderHistoricalView(weatherService.getDisasterHistory());
  }

  renderDateSelector() {
    return `
      <div class="date-selector glass" style="margin-bottom:20px;display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:8px">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600"><i class="fas fa-calendar"></i> Historical Date Filter:</span>
        <button class="btn btn-icon" onclick="weatherUI.changeDate(-1)"><i class="fas fa-chevron-left"></i></button>
        <input 
          type="date" 
          id="weather-date-picker" 
          value="${this.selectedDate.toISOString().split('T')[0]}"
          max="${new Date().toISOString().split('T')[0]}"
          onchange="weatherUI.onDateChange(this.value)"
          style="background:transparent;border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:4px"
        />
        <button class="btn btn-icon" onclick="weatherUI.changeDate(1)"><i class="fas fa-chevron-right"></i></button>
        <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px" onclick="weatherUI.resetDate()"><i class="fas fa-calendar-day"></i> Reset Today</button>
      </div>
    `;
  }

  changeDate(days) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > new Date()) return;
    this.selectedDate = newDate;
    const el = document.getElementById('weather-date-picker');
    if (el) el.value = newDate.toISOString().split('T')[0];
    if (window.loadHistoricalWeather) window.loadHistoricalWeather(this.selectedDate);
  }

  onDateChange(dateString) {
    this.selectedDate = new Date(dateString);
    if (window.loadHistoricalWeather) window.loadHistoricalWeather(this.selectedDate);
  }

  resetDate() {
    this.selectedDate = new Date();
    const el = document.getElementById('weather-date-picker');
    if (el) el.value = this.selectedDate.toISOString().split('T')[0];
    if (window.updateWeatherData) window.updateWeatherData(this.currentLocation.lat, this.currentLocation.lon);
  }

  focusDisaster(lat, lon) {
    if (window.weatherMapInstance) {
      window.weatherMapInstance.map.setView([lat, lon], 7, { animate: true });
      window.weatherMapInstance.inspectEarthPoint(lat, lon);
    }
  }

  _renderForecast(forecast) {
    if (!forecast || !forecast.list) {
      return '<div class="forecast-empty">No forecast data available</div>';
    }

    const dailyForecasts = [];
    const seenDates = new Set();
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!seenDates.has(dateKey) && dailyForecasts.length < 7) {
        seenDates.add(dateKey);
        dailyForecasts.push(item);
      }
    });

    return dailyForecasts.map(day => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `
        <div class="forecast-day">
          <div class="forecast-date">
            <div class="day-name">${dayName}</div>
            <div class="date-str">${dateStr}</div>
          </div>
          <div class="forecast-icon">
            <i class="fas fa-${this._getWeatherIcon(day.weather?.[0]?.main)}"></i>
          </div>
          <div class="forecast-temp">
            <span class="temp-max">${Math.round(day.main.temp_max)}°</span>
            <span class="temp-min">${Math.round(day.main.temp_min)}°</span>
          </div>
          <div class="forecast-details">
            <div><i class="fas fa-wind"></i> ${Math.round(day.wind.speed)} km/h</div>
            <div><i class="fas fa-droplet"></i> ${Math.round(day.pop * 100)}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  _renderPrecautions(riskLevel, cyclones) {
    const weatherType = cyclones && cyclones.length > 0 ? 'cyclone' : 'storm';
    const precautions = weatherService.getSafetyPrecautions(riskLevel, weatherType);
    
    return precautions.map(p => `
      <div class="precaution-item">
        ${p}
      </div>
    `).join('');
  }

  _renderCycloneAlert(cyclone) {
    return `
      <div class="cyclone-alert">
        <div class="alert-header">
          <h3>${cyclone.name}</h3>
          <span class="cyclone-status status-${cyclone.status}">${cyclone.status}</span>
        </div>
        <div class="cyclone-details">
          <div class="detail-row"><span>Category:</span><strong>${cyclone.category}</strong></div>
          <div class="detail-row"><span>Wind Speed:</span><strong>${cyclone.windSpeed} km/h</strong></div>
          <div class="detail-row"><span>Pressure:</span><strong>${cyclone.pressure} hPa</strong></div>
        </div>
        <div class="cyclone-warning"><i class="fas fa-triangle-exclamation"></i> ${cyclone.warning}</div>
        <div class="affected-regions"><strong>Affected Regions:</strong> ${cyclone.affectedRegions.join(', ')}</div>
        <button class="btn btn-primary btn-full" onclick="weatherUI.focusDisaster(${cyclone.lat}, ${cyclone.lon})">
          <i class="fas fa-map-location-dot"></i> Inspect on Map
        </button>
      </div>
    `;
  }

  _getWeatherIcon(condition) {
    const icons = {
      Clear: 'sun',
      Clouds: 'cloud',
      Rain: 'cloud-rain',
      Drizzle: 'cloud-drizzle',
      Thunderstorm: 'cloud-bolt',
      Snow: 'snowflake',
      Mist: 'smog',
      Fog: 'smog',
      Haze: 'smog',
    };
    return icons[condition] || 'cloud';
  }

  _getDisasterIcon(type) {
    const icons = {
      Cyclone: 'hurricane',
      Flood: 'water',
      Storm: 'cloud-bolt',
      Tsunami: 'water',
    };
    return icons[type] || 'triangle-exclamation';
  }

  /**
   * Render Point Telemetry HUD Card on Weather Page
   */
  renderPointTelemetryHUD(data) {
    let container = document.getElementById('weather-point-telemetry');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
      <div class="card glass" style="margin-bottom: 20px; border: 1px solid var(--accent);">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <i class="fas fa-crosshairs" style="color:#00e5ff"></i>
            <strong style="color:#00e5ff">INSPECTED POINT TELEMETRY:</strong> ${data.lat}° N, ${data.lon}° E
          </div>
          <span class="badge-status green"><i class="fas fa-satellite"></i> SATELLITE LIVE</span>
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px">
          <div>
            <div style="font-size:11px;color:var(--text-muted)">WEATHER CONDITION</div>
            <div style="font-size:18px;font-weight:700;color:var(--text)"><i class="fas fa-cloud-sun" style="color:var(--accent)"></i> ${data.condition}</div>
            <div style="font-size:12px;color:var(--text-muted)">Temp: ${data.temp}°C | Humidity: ${data.humidity}%</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">WIND & PRESSURE</div>
            <div style="font-size:16px;font-weight:700;color:var(--text)"><i class="fas fa-wind" style="color:var(--yellow)"></i> ${data.windSpeed} km/h</div>
            <div style="font-size:12px;color:var(--text-muted)">Heading: ${data.windDeg}° | Pressure: ${data.pressure} hPa</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">CLOUD COVER & SEA STATE</div>
            <div style="font-size:16px;font-weight:700;color:var(--text)"><i class="fas fa-cloud" style="color:#e2e8f0"></i> ${data.cloudCover}% Coverage</div>
            <div style="font-size:12px;color:var(--text-muted)">Sea Temp: ${data.seaSurfaceTemp} | Waves: ${data.waveHeight}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">OVERHEAD SATELLITE & RISK</div>
            <div style="font-size:15px;font-weight:700;color:var(--yellow)"><i class="fas fa-satellite"></i> ${data.overheadSatellite}</div>
            <div style="font-size:12px;color:var(--text-muted)">Pass: ${data.nextSatPass} | Risk: <strong style="color:${data.riskLevel === 'critical' ? 'var(--red)' : data.riskLevel === 'high' ? 'var(--yellow)' : 'var(--green)'}">${data.riskLevel.toUpperCase()}</strong></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Comprehensive Calamity Prevention & Disaster Mitigation Section
   */
  renderCalamityPreventionSection() {
    const container = document.getElementById('calamity-prevention-container');
    if (!container) return;

    const preventionData = {
      cyclone: {
        title: '🌀 Cyclone & Tropical Storm Prevention & Mitigation',
        color: '#ef476f',
        infrastructure: [
          'Construct cyclone shelters with reinforced concrete roofs on elevated stilts above storm surge levels.',
          'Establish bio-shields along coastal belts using dense mangrove plantations and casuarina shelterbelts.',
          'Install underground power cables and fiber-optic telemetry lines to prevent grid collapse.',
          'Implement automated early-warning siren networks connected to Doppler Weather Radars.'
        ],
        before: [
          'Board up windows with plywood shutters and secure loose outdoor equipment or roofing sheets.',
          'Store 72 hours of drinkable water (4L per person/day) and non-perishable canned food.',
          'Ensure VHF marine radios and satellite phones are 100% charged with spare battery packs.'
        ],
        during: [
          'Stay indoors away from glass windows and doors in an inner windowless room.',
          'Turn off main electrical breakers and LPG gas valves immediately if floodwater rises.',
          'Do NOT go outside during the calm "eye of the cyclone" — winds will reverse violently without warning.'
        ],
        after: [
          'Beware of fallen power lines, submerged electrical cables, and weakened tree branches.',
          'Boil or chlorinate all drinking water before consumption to prevent cholera and dysentery.',
          'Inspect building structures for cracks or foundation settlement before entering.'
        ]
      },
      tsunami: {
        title: '🌊 Tsunami & Coastal Surge Prevention & Safety Protocol',
        color: '#00b4d8',
        infrastructure: [
          'Build seawalls, offshore breakwaters, and tsunami surge dissipation gates across river estuaries.',
          'Demarcate Tsunami Evacuation Routes with bright retro-reflective signs pointing to land >30 meters high.',
          'Deploy deep-ocean DART (Deep-ocean Assessment and Reporting of Tsunamis) buoy sensors.',
          'Enforce coastal zone regulation buffer zones prohibiting ground residential structures within 500m of high tide.'
        ],
        before: [
          'Recognize Natural Warning Signs: Strong earthquake ground shaking near coast OR sudden oceanic receding water.',
          'Map out the nearest high-ground route (at least 30m altitude or 2km inland) from your location.'
        ],
        during: [
          'EVACUATE IMMEDIATELY on foot to high ground as soon as natural warning signs or sirens occur — DO NOT wait for official alert.',
          'If at sea in a vessel: Move out into DEEP WATER (>100 meters depth) immediately — tsunami waves have smaller amplitude in deep ocean.'
        ],
        after: [
          'Stay on high ground for at least 4 hours — tsunamis consist of multiple wave crests, and the 2nd or 3rd wave is often the largest.',
          'Do NOT enter low-lying coastal areas until emergency services declare official clearance.'
        ]
      },
      earthquake: {
        title: '🏚️ Earthquake & Seismic Damage Prevention Protocol',
        color: '#ffd60a',
        infrastructure: [
          'Adopt Seismic Building Codes (IS 1893) with base isolation dampers and shear walls.',
          'Anchor heavy machinery, gas cylinders, fuel tanks, and high storage racks to structural walls.',
          'Install seismic automatic gas shutoff valves that cut fuel lines upon sensing 4.0+ M vibrations.'
        ],
        before: [
          'Identify safe spots in every room: under sturdy tables, desks, or against interior load-bearing walls.',
          'Keep an emergency Go-Bag near your exit door containing emergency light, whistle, and medical kit.'
        ],
        during: [
          'DROP, COVER, AND HOLD ON under a heavy desk or table. Protect head and neck with arms.',
          'If outdoors: Move away from high-rise buildings, glass facades, utility poles, and overpasses.',
          'If driving: Pull over to a clear side location away from bridges or overhanging signs and stay in vehicle.'
        ],
        after: [
          'Be prepared for aftershocks. Inspect gas, water, and electrical lines for leaks or sparks.',
          'Use battery-powered flashlights instead of open flames (matches/lighters) to avoid igniting leaked gas.'
        ]
      },
      flood: {
        title: '🌧️ Flash Flood & Coastal Inundation Prevention',
        color: '#4895ef',
        infrastructure: [
          'Maintain urban stormwater drainage networks, retention basins, and automated pumping stations.',
          'Construct elevated embankments and flood walls around critical substations and hospitals.',
          'Deploy telemetry water level sensors along river basins for real-time flood hydrograph modeling.'
        ],
        before: [
          'Elevate electrical panels, appliances, and valuables at least 1 meter above historic flood levels.',
          'Clear local gutters and storm drains of debris before monsoon rainy seasons.'
        ],
        during: [
          'Never walk, swim, or drive through moving floodwaters — 15cm of moving water can knock a person over.',
          'If trapped in a building, move to the highest level or roof. Take a flashlight and signal for rescue.'
        ],
        after: [
          'Disinfect all items that came into contact with floodwaters (sewage contamination risk).',
          'Avoid drinking tap water until tested and declared potable by health authorities.'
        ]
      },
      marine: {
        title: '⚓ Marine Vessel Emergency Distress & Capsizing Prevention',
        color: '#06d6a0',
        infrastructure: [
          'Equip all sea vessels with mandatory EPIRB (Emergency Position Indicating Radio Beacon) & SART.',
          'Implement AIS Class A/B vessel tracking and mandatory VMS (Vessel Monitoring System) transponders.',
          'Enforce strict vessel stability checks, cargo lashing, and hatch watertight sealing prior to departure.'
        ],
        before: [
          'Check NAVTEX weather warnings and barometric pressure drops before sailing into open sea.',
          'Inspect inflatable life rafts, immersion suits, life jackets (with strobe lights & whistles) for all crew.'
        ],
        during: [
          'Broadcast MAYDAY distress call on VHF Channel 16 (156.8 MHz) or HF 2182 kHz: "MAYDAY MAYDAY MAYDAY, Vessel [Name], Position [Lat/Lon], [Nature of Distress]".',
          'Activate EPIRB beacon, launch red rocket parachute flares, and instruct crew to don life jackets and assume H.E.L.P. (Heat Escape Lessening Posture) in water.'
        ],
        after: [
          'Stay attached to life raft or vessel hull if floating — air search teams spot vessel hulls easier than individual swimmers.',
          'Contact Coast Guard Maritime Rescue Coordination Center (MRCC Helpline 1554).'
        ]
      }
    };

    const current = preventionData[this.activeSurvivalCategory] || preventionData.cyclone;

    container.innerHTML = `
      <div class="card glass" style="margin-top: 20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <i class="fas fa-shield-halved" style="color:var(--green)"></i>
            <strong>Calamity Prevention & Disaster Mitigation Command Center</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn ${this.activeSurvivalCategory === 'cyclone' ? 'btn-primary' : 'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setPreventionTab('cyclone')">🌀 Cyclones</button>
            <button class="btn ${this.activeSurvivalCategory === 'tsunami' ? 'btn-primary' : 'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setPreventionTab('tsunami')">🌊 Tsunamis</button>
            <button class="btn ${this.activeSurvivalCategory === 'earthquake' ? 'btn-primary' : 'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setPreventionTab('earthquake')">🏚️ Earthquakes</button>
            <button class="btn ${this.activeSurvivalCategory === 'flood' ? 'btn-primary' : 'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setPreventionTab('flood')">🌧️ Floods</button>
            <button class="btn ${this.activeSurvivalCategory === 'marine' ? 'btn-primary' : 'btn-secondary'}" style="font-size:11px;padding:4px 10px" onclick="weatherUI.setPreventionTab('marine')">⚓ Marine Distress</button>
          </div>
        </div>

        <div style="padding:16px">
          <h3 style="color:${current.color};margin-bottom:14px;font-size:16px"><i class="fas fa-shield-virus"></i> ${current.title}</h3>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px">
            <!-- Infrastructure & Prevention Measures -->
            <div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:14px;border:1px solid var(--border)">
              <h4 style="color:var(--accent);margin-bottom:10px;font-size:13px"><i class="fas fa-building-shield"></i> Infrastructure & Prevention Measures</h4>
              <ul style="padding-left:16px;font-size:12px;line-height:1.6;color:var(--text)">
                ${current.infrastructure.map(item => `<li style="margin-bottom:6px">${item}</li>`).join('')}
              </ul>
            </div>

            <!-- BEFORE Protocol -->
            <div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:14px;border:1px solid var(--border)">
              <h4 style="color:var(--yellow);margin-bottom:10px;font-size:13px"><i class="fas fa-clock-rotate-left"></i> BEFORE (Preparation Phase)</h4>
              <ul style="padding-left:16px;font-size:12px;line-height:1.6;color:var(--text)">
                ${current.before.map(item => `<li style="margin-bottom:6px">${item}</li>`).join('')}
              </ul>
            </div>

            <!-- DURING Protocol -->
            <div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:14px;border:1px solid var(--border)">
              <h4 style="color:var(--red);margin-bottom:10px;font-size:13px"><i class="fas fa-triangle-exclamation"></i> DURING (Emergency Phase)</h4>
              <ul style="padding-left:16px;font-size:12px;line-height:1.6;color:var(--text)">
                ${current.during.map(item => `<li style="margin-bottom:6px">${item}</li>`).join('')}
              </ul>
            </div>

            <!-- AFTER Protocol -->
            <div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:14px;border:1px solid var(--border)">
              <h4 style="color:var(--green);margin-bottom:10px;font-size:13px"><i class="fas fa-hand-holding-medical"></i> AFTER (Recovery Phase)</h4>
              <ul style="padding-left:16px;font-size:12px;line-height:1.6;color:var(--text)">
                ${current.after.map(item => `<li style="margin-bottom:6px">${item}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Emergency Helplines & Go-Bag Kit Bar -->
          <div style="margin-top:16px;padding:12px;background:rgba(0,180,216,0.08);border-radius:10px;border:1px dashed var(--accent);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div style="font-size:12px">
              <strong>📞 EMERGENCY HELPLINES:</strong> 
              <span style="color:var(--accent);margin-left:8px">Indian Coast Guard: <strong>1554</strong></span> | 
              <span style="color:var(--yellow);margin-left:8px">NDMA Disaster Control: <strong>1078</strong></span> | 
              <span style="color:var(--green);margin-left:8px">Navy SAR: <strong>022-22751000</strong></span>
            </div>
            <div style="font-size:12px;color:var(--text-muted)">
              <i class="fas fa-kit-medical" style="color:var(--red)"></i> 72-Hour Go-Bag: Water, Rations, Flashlight, Radio, EPIRB, First-Aid, Whistle
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setPreventionTab(category) {
    this.activeSurvivalCategory = category;
    this.renderCalamityPreventionSection();
  }
}

// Export singleton
const weatherUI = new WeatherUI();
window.weatherUI = weatherUI;
