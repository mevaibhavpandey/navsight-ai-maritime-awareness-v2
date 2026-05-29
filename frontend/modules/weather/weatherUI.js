/**
 * Weather UI Components
 * Handles weather dashboard, search, forecasts, and alerts
 */

class WeatherUI {
  constructor() {
    this.currentLocation = { lat: 15, lon: 78, name: 'India' };
    this.selectedDate = new Date();
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
                <i class="fas fa-eye"></i>
                <span>Visibility: ${((weather.visibility || 0) / 1000).toFixed(1)} km</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-cloud"></i>
                <span>Clouds: ${weather.clouds?.all || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 7-Day Forecast -->
        <div class="card glass forecast-card">
          <div class="card-header">
            <i class="fas fa-calendar-days"></i> 7-Day Forecast
          </div>
          <div class="forecast-scroll">
            ${this._renderForecast(forecast)}
          </div>
        </div>

        <!-- Safety Precautions -->
        <div class="card glass">
          <div class="card-header">
            <i class="fas fa-shield-halved"></i> Safety Precautions
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
      <div class="weather-search-bar">
        <div class="search-input-group">
          <i class="fas fa-magnifying-glass"></i>
          <input 
            type="text" 
            id="weather-location-search" 
            placeholder="Search coastal city or region..."
            autocomplete="off"
          />
          <button class="btn btn-primary" onclick="weatherUI.searchLocation()">
            <i class="fas fa-search"></i> Search
          </button>
        </div>
        <div id="search-results" class="search-results"></div>
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
      container.innerHTML = '<div class="search-no-results">No locations found</div>';
      return;
    }

    container.innerHTML = results.map(loc => `
      <div class="search-result-item" onclick="weatherUI.selectLocation(${loc.lat}, ${loc.lon}, '${loc.name}')">
        <i class="fas fa-location-dot"></i>
        <div>
          <div class="result-name">${loc.name}</div>
          <div class="result-coords">${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}</div>
        </div>
      </div>
    `).join('');
  }

  selectLocation(lat, lon, name) {
    this.currentLocation = { lat, lon, name };
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('weather-location-search').value = name;
    
    // Trigger weather update
    if (window.updateWeatherData) {
      window.updateWeatherData(lat, lon);
    }
  }

  renderHistoricalView(disasters) {
    const container = document.getElementById('weather-historical');
    if (!container) return;

    container.innerHTML = `
      <div class="card glass">
        <div class="card-header">
          <i class="fas fa-clock-rotate-left"></i> Disaster History Database
        </div>
        <div class="disaster-timeline">
          ${disasters.map(d => `
            <div class="disaster-item" onclick="weatherUI.focusDisaster(${d.lat}, ${d.lon})">
              <div class="disaster-icon ${d.type.toLowerCase()}">
                <i class="fas fa-${this._getDisasterIcon(d.type)}"></i>
              </div>
              <div class="disaster-content">
                <div class="disaster-name">${d.name}</div>
                <div class="disaster-meta">
                  <span><i class="fas fa-calendar"></i> ${d.date}</span>
                  <span><i class="fas fa-location-dot"></i> ${d.location}</span>
                </div>
                <div class="disaster-severity severity-${d.severity.toLowerCase().replace(/\s+/g, '-')}">
                  ${d.severity}
                </div>
                <div class="disaster-impact">${d.impact}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderDateSelector() {
    return `
      <div class="date-selector glass">
        <button class="btn btn-icon" onclick="weatherUI.changeDate(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <input 
          type="date" 
          id="weather-date-picker" 
          value="${this.selectedDate.toISOString().split('T')[0]}"
          max="${new Date().toISOString().split('T')[0]}"
          onchange="weatherUI.onDateChange(this.value)"
        />
        <button class="btn btn-icon" onclick="weatherUI.changeDate(1)">
          <i class="fas fa-chevron-right"></i>
        </button>
        <button class="btn btn-secondary" onclick="weatherUI.resetDate()">
          <i class="fas fa-calendar-day"></i> Today
        </button>
      </div>
    `;
  }

  changeDate(days) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    if (newDate > new Date()) return; // Can't go to future
    
    this.selectedDate = newDate;
    document.getElementById('weather-date-picker').value = newDate.toISOString().split('T')[0];
    
    // Trigger historical data load
    if (window.loadHistoricalWeather) {
      window.loadHistoricalWeather(this.selectedDate);
    }
  }

  onDateChange(dateString) {
    this.selectedDate = new Date(dateString);
    if (window.loadHistoricalWeather) {
      window.loadHistoricalWeather(this.selectedDate);
    }
  }

  resetDate() {
    this.selectedDate = new Date();
    document.getElementById('weather-date-picker').value = this.selectedDate.toISOString().split('T')[0];
    
    // Load current weather
    if (window.updateWeatherData) {
      window.updateWeatherData(this.currentLocation.lat, this.currentLocation.lon);
    }
  }

  focusDisaster(lat, lon) {
    if (window.weatherMapInstance) {
      window.weatherMapInstance.map.setView([lat, lon], 8, { animate: true });
    }
  }

  // Helper rendering methods
  _renderForecast(forecast) {
    if (!forecast || !forecast.list) {
      return '<div class="forecast-empty">No forecast data available</div>';
    }

    // Group by day and take one entry per day
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
          <div class="detail-row">
            <span>Category:</span>
            <strong>${cyclone.category}</strong>
          </div>
          <div class="detail-row">
            <span>Wind Speed:</span>
            <strong>${cyclone.windSpeed} km/h</strong>
          </div>
          <div class="detail-row">
            <span>Pressure:</span>
            <strong>${cyclone.pressure} hPa</strong>
          </div>
        </div>
        <div class="cyclone-warning">
          <i class="fas fa-triangle-exclamation"></i>
          ${cyclone.warning}
        </div>
        <div class="affected-regions">
          <strong>Affected Regions:</strong>
          ${cyclone.affectedRegions.join(', ')}
        </div>
        <button class="btn btn-primary btn-full" onclick="weatherUI.focusDisaster(${cyclone.lat}, ${cyclone.lon})">
          <i class="fas fa-map-location-dot"></i> View on Map
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
