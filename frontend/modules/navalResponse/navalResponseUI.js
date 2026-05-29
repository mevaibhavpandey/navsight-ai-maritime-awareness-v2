/**
 * Naval Response UI
 * Handles UI rendering and user interactions for naval response system
 */

class NavalResponseUI {
  constructor() {
    this.panelVisible = true;
    this.mapLayers = {
      threats: L.layerGroup(),
      responders: L.layerGroup(),
      paths: L.layerGroup(),
      interceptionPoints: L.layerGroup(),
    };
  }

  /**
   * Initialize UI
   */
  initialize() {
    this.createPanel();
    this.initializeMapLayers();
  }

  /**
   * Create naval response panel
   */
  createPanel() {
    // Check if panel already exists
    if (document.getElementById('naval-response-panel')) return;

    // Create toggle button
    const toggle = document.createElement('div');
    toggle.id = 'naval-response-toggle';
    toggle.className = 'naval-response-toggle glass';
    toggle.innerHTML = `
      <i class="fas fa-shield-halved"></i>
      <span>Naval Response</span>
    `;
    toggle.onclick = () => this.togglePanel();
    document.body.appendChild(toggle);

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'naval-response-panel';
    panel.className = 'naval-response-panel';
    panel.innerHTML = `
      <div class="naval-response-header glass">
        <div class="naval-response-title">
          <i class="fas fa-shield-halved"></i>
          Naval Response Recommendations
        </div>
        <button class="naval-response-close" onclick="navalResponseUI.togglePanel()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div id="naval-response-stats"></div>
      <div id="naval-response-content"></div>
    `;
    document.body.appendChild(panel);
  }

  /**
   * Initialize map layers
   */
  initializeMapLayers() {
    if (!window.mainMap) return;

    Object.values(this.mapLayers).forEach(layer => {
      layer.addTo(window.mainMap);
    });
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    const panel = document.getElementById('naval-response-panel');
    if (!panel) return;

    this.panelVisible = !this.panelVisible;
    
    if (this.panelVisible) {
      panel.classList.remove('collapsed');
    } else {
      panel.classList.add('collapsed');
    }
  }

  /**
   * Update UI with responses
   */
  update(responses) {
    this.updateStats(responses);
    this.updateContent(responses);
  }

  /**
   * Update statistics
   */
  updateStats(responses) {
    const statsContainer = document.getElementById('naval-response-stats');
    if (!statsContainer) return;

    const critical = responses.filter(r => r.priority === 'CRITICAL').length;
    const high = responses.filter(r => r.priority === 'HIGH').length;
    const total = responses.length;

    statsContainer.innerHTML = `
      <div class="response-stats">
        <div class="response-stat critical">
          <div class="response-stat-value">${critical}</div>
          <div class="response-stat-label">Critical</div>
        </div>
        <div class="response-stat high">
          <div class="response-stat-value">${high}</div>
          <div class="response-stat-label">High</div>
        </div>
        <div class="response-stat">
          <div class="response-stat-value">${total}</div>
          <div class="response-stat-label">Total</div>
        </div>
      </div>
    `;
  }

  /**
   * Update content with response cards
   */
  updateContent(responses) {
    const contentContainer = document.getElementById('naval-response-content');
    if (!contentContainer) return;

    if (responses.length === 0) {
      contentContainer.innerHTML = this.renderEmptyState();
      return;
    }

    // Sort by priority
    const sorted = responses.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    contentContainer.innerHTML = sorted.map(response => 
      this.renderResponseCard(response)
    ).join('');
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="naval-response-empty glass">
        <i class="fas fa-shield-check"></i>
        <div class="naval-response-empty-title">All Clear</div>
        <div class="naval-response-empty-text">
          No threats detected. Maritime boundary secure.
        </div>
      </div>
    `;
  }

  /**
   * Render response card
   */
  renderResponseCard(response) {
    const timeClass = response.interceptionTime && response.interceptionTime.hours < 1 ? 'urgent' : '';
    
    return `
      <div class="response-card priority-${response.priority.toLowerCase()}" data-mmsi="${response.threatMMSI}">
        <div class="response-header">
          <div class="response-threat-name">${this._escapeHtml(response.threatVessel)}</div>
          <div class="response-priority ${response.priority.toLowerCase()}">${response.priority}</div>
        </div>
        
        <div class="threat-type-badge">
          <i class="fas fa-triangle-exclamation"></i> ${response.threatType}
        </div>
        
        <div class="response-details">
          <div class="response-detail-row">
            <span class="response-detail-label">
              <i class="fas fa-location-dot"></i> Position
            </span>
            <span class="response-detail-value coordinates-display">
              ${this._formatCoords(response.threatLat, response.threatLon)}
            </span>
          </div>
          
          ${response.nearestNavalUnit ? `
            <div class="response-detail-row">
              <span class="response-detail-label">
                <i class="fas fa-ship"></i> Responding Unit
              </span>
              <span class="response-detail-value">${this._escapeHtml(response.nearestNavalUnit)}</span>
            </div>
            
            <div class="response-detail-row">
              <span class="response-detail-label">
                <i class="fas fa-ruler"></i> Distance
              </span>
              <span class="response-detail-value">${response.distance.toFixed(1)} NM</span>
            </div>
            
            <div class="response-detail-row">
              <span class="response-detail-label">
                <i class="fas fa-clock"></i> Interception Time
              </span>
              <span class="response-detail-value time-display ${timeClass}">
                ${response.interceptionTime ? response.interceptionTime.formatted : 'N/A'}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="recommended-action">
          <div class="recommended-action-label">
            <i class="fas fa-lightbulb"></i> Recommended Action
          </div>
          ${this._escapeHtml(response.recommendedAction)}
        </div>
        
        <div class="response-actions">
          <button class="btn btn-primary" onclick="navalResponseUI.focusOnThreat('${response.threatMMSI}')">
            <i class="fas fa-crosshairs"></i> View on Map
          </button>
          <button class="btn btn-secondary" onclick="navalResponseUI.acknowledgeResponse('${response.threatMMSI}')">
            <i class="fas fa-check"></i> Acknowledge
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Update map visualization
   */
  updateMap(responses) {
    if (!window.mainMap) return;

    // Clear existing layers
    Object.values(this.mapLayers).forEach(layer => layer.clearLayers());

    responses.forEach(response => {
      this.drawThreatMarker(response);
      
      if (response.nearestNavalUnit) {
        this.drawResponderMarker(response);
        this.drawInterceptionLine(response);
        
        if (response.interceptionPoint) {
          this.drawInterceptionPoint(response);
        }
      }
    });
  }

  /**
   * Draw threat marker
   */
  drawThreatMarker(response) {
    const marker = L.circleMarker([response.threatLat, response.threatLon], {
      radius: 8,
      fillColor: '#ef476f',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.9,
      className: 'threat-marker',
    }).addTo(this.mapLayers.threats);

    marker.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-triangle-exclamation"></i> ${this._escapeHtml(response.threatVessel)}</h3>
        <div class="weather-detail">
          <span class="label">Threat Type:</span>
          <span class="value">${response.threatType}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Priority:</span>
          <span class="value priority-${response.priority.toLowerCase()}">${response.priority}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Speed:</span>
          <span class="value">${response.threatSpeed.toFixed(1)} kn</span>
        </div>
        <div class="weather-detail">
          <span class="label">Heading:</span>
          <span class="value">${response.threatHeading.toFixed(0)}°</span>
        </div>
      </div>
    `);
  }

  /**
   * Draw responder marker
   */
  drawResponderMarker(response) {
    const marker = L.circleMarker([response.navalLat, response.navalLon], {
      radius: 7,
      fillColor: '#06d6a0',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
      className: 'naval-responder-marker',
    }).addTo(this.mapLayers.responders);

    marker.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-ship"></i> ${this._escapeHtml(response.nearestNavalUnit)}</h3>
        <div class="weather-detail">
          <span class="label">Status:</span>
          <span class="value">Responding</span>
        </div>
        <div class="weather-detail">
          <span class="label">Speed:</span>
          <span class="value">${response.navalSpeed.toFixed(1)} kn</span>
        </div>
        <div class="weather-detail">
          <span class="label">Distance to Threat:</span>
          <span class="value">${response.distance.toFixed(1)} NM</span>
        </div>
        <div class="weather-detail">
          <span class="label">ETA:</span>
          <span class="value">${response.interceptionTime ? response.interceptionTime.formatted : 'N/A'}</span>
        </div>
      </div>
    `);
  }

  /**
   * Draw interception line
   */
  drawInterceptionLine(response) {
    const line = L.polyline([
      [response.navalLat, response.navalLon],
      [response.threatLat, response.threatLon],
    ], {
      color: '#00b4d8',
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.7,
      className: 'interception-line',
    }).addTo(this.mapLayers.paths);
  }

  /**
   * Draw interception point
   */
  drawInterceptionPoint(response) {
    if (!response.interceptionPoint || !response.interceptionPoint.lat) return;

    const marker = L.circleMarker(
      [response.interceptionPoint.lat, response.interceptionPoint.lon],
      {
        radius: 6,
        fillColor: '#ffd60a',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'interception-point-marker',
      }
    ).addTo(this.mapLayers.interceptionPoints);

    marker.bindPopup(`
      <div class="weather-popup">
        <h3><i class="fas fa-location-crosshairs"></i> Interception Point</h3>
        <div class="weather-detail">
          <span class="label">ETA:</span>
          <span class="value">${response.interceptionPoint.eta ? response.interceptionPoint.eta.toFixed(1) + 'h' : 'N/A'}</span>
        </div>
        <div class="weather-detail">
          <span class="label">Coordinates:</span>
          <span class="value coordinates-display">
            ${this._formatCoords(response.interceptionPoint.lat, response.interceptionPoint.lon)}
          </span>
        </div>
      </div>
    `);
  }

  /**
   * Focus on threat
   */
  focusOnThreat(mmsi) {
    const response = navalResponseEngine.getResponses().find(r => r.threatMMSI === mmsi);
    if (!response) return;

    // Navigate to map page
    if (typeof window.navigate === 'function') {
      window.navigate('map');
    }

    // Center map on threat
    setTimeout(() => {
      if (window.mainMap) {
        window.mainMap.setView([response.threatLat, response.threatLon], 8, { animate: true });
      }
    }, 100);
  }

  /**
   * Acknowledge response
   */
  acknowledgeResponse(mmsi) {
    const card = document.querySelector(`.response-card[data-mmsi="${mmsi}"]`);
    if (card) {
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
      
      setTimeout(() => {
        card.remove();
        
        // Check if no more cards
        const remaining = document.querySelectorAll('.response-card').length;
        if (remaining === 0) {
          this.updateContent([]);
        }
      }, 500);
    }
  }

  /**
   * Clear UI
   */
  clear() {
    const contentContainer = document.getElementById('naval-response-content');
    if (contentContainer) {
      contentContainer.innerHTML = this.renderEmptyState();
    }

    const statsContainer = document.getElementById('naval-response-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
    }

    // Clear map layers
    Object.values(this.mapLayers).forEach(layer => layer.clearLayers());
  }

  /**
   * Helper: Escape HTML
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Helper: Format coordinates
   */
  _formatCoords(lat, lon) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lon).toFixed(4)}°${lonDir}`;
  }
}

// Create singleton instance
const navalResponseUI = new NavalResponseUI();

// Make globally accessible
window.navalResponseUI = navalResponseUI;
window.updateNavalResponseUI = (responses) => navalResponseUI.update(responses);
window.clearNavalResponseUI = () => navalResponseUI.clear();
window.updateNavalResponseMap = (responses) => navalResponseUI.updateMap(responses);
