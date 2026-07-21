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
}

// Export singleton
const weatherUI = new WeatherUI();
window.weatherUI = weatherUI;
