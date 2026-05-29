/**
 * Naval Response Recommendation Engine
 * Detects threats and recommends optimal naval response strategies
 */

class NavalResponseEngine {
  constructor() {
    this.threats = new Map(); // mmsi -> threat object
    this.responses = new Map(); // mmsi -> response recommendation
    this.updateInterval = 5000; // 5 seconds
    this.updateTimer = null;
    this.isActive = false;
  }

  /**
   * Start the naval response engine
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.updateTimer = setInterval(() => this.analyze(), this.updateInterval);
    console.log('[Naval Response] Engine started');
  }

  /**
   * Stop the naval response engine
   */
  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.isActive = false;
    console.log('[Naval Response] Engine stopped');
  }

  /**
   * Main analysis function - runs continuously
   */
  analyze() {
    if (!window.vessels || typeof window.vessels !== 'object') return;

    const allVessels = Object.values(window.vessels);
    if (allVessels.length === 0) return;

    // Step 1: Detect threats
    const threats = this.detectThreats(allVessels);

    // Step 2: Get available naval units
    const navalUnits = this.getNavalUnits(allVessels);

    // Step 3: Generate responses for each threat
    const responses = [];
    threats.forEach(threat => {
      const response = this.generateResponse(threat, navalUnits, allVessels);
      if (response) {
        responses.push(response);
        this.responses.set(threat.mmsi, response);
      }
    });

    // Step 4: Update UI and map
    if (responses.length > 0) {
      this.updateUI(responses);
      this.updateMap(responses);
      
      // Generate alerts for new threats
      this.generateAlerts(responses);
    } else {
      // Clear UI if no threats
      this.clearUI();
    }

    // Update threat tracking
    this.updateThreatTracking(threats);
  }

  /**
   * Detect threat vessels
   */
  detectThreats(vessels) {
    const threats = [];

    vessels.forEach(vessel => {
      // Skip if no position data
      if (!vessel.lat || !vessel.lon) return;

      // Check if vessel is a threat
      const threatType = this.assessThreat(vessel);
      
      if (threatType) {
        threats.push({
          ...vessel,
          threatType,
          detectedAt: this.threats.has(vessel.mmsi) 
            ? this.threats.get(vessel.mmsi).detectedAt 
            : Date.now(),
        });
      }
    });

    return threats;
  }

  /**
   * Assess if a vessel is a threat
   */
  assessThreat(vessel) {
    // Check 1: Unfriendly vessel
    const isUnfriendly = this._isUnfriendly(vessel);
    
    // Check 2: Inside maritime boundary
    const inBoundary = this._inIndiaEEZ(vessel.lat, vessel.lon);
    
    // Check 3: High speed unknown vessel
    const isHighSpeedUnknown = (vessel.speed || 0) >= 25 && 
                                (vessel.flag === 'Unknown' || !vessel.flag);

    // Check 4: Predicted trajectory intersects boundary
    const trajectoryThreat = this._checkTrajectoryThreat(vessel);

    // Determine threat type
    if (isUnfriendly && inBoundary) {
      return 'Unauthorized Intrusion';
    } else if (isUnfriendly && trajectoryThreat) {
      return 'Potential Intrusion';
    } else if (isHighSpeedUnknown && (inBoundary || trajectoryThreat)) {
      return 'Suspicious Activity';
    } else if (this._inPiracyZone(vessel.lat, vessel.lon)) {
      return 'Piracy Zone Threat';
    }

    return null;
  }

  /**
   * Check if vessel is unfriendly
   */
  _isUnfriendly(vessel) {
    const friendlyFlags = new Set([
      'India', 'USA', 'UK', 'France', 'Australia', 'Japan', 'South Korea',
      'New Zealand', 'Canada', 'Germany', 'Italy', 'Norway', 'Netherlands',
      'Denmark', 'Sweden', 'Finland', 'Portugal', 'Spain', 'Greece',
    ]);

    const flag = (vessel.flag || '').trim();
    if (!flag || flag === 'Unknown') return false;
    return !friendlyFlags.has(flag);
  }

  /**
   * Check if position is in India EEZ
   */
  _inIndiaEEZ(lat, lon) {
    if (typeof window._inIndiaEEZ === 'function') {
      return window._inIndiaEEZ(lat, lon);
    }
    // Fallback: simple bounding box
    return lat >= 2 && lat <= 24 && lon >= 62 && lon <= 97;
  }

  /**
   * Check if vessel trajectory threatens boundary
   */
  _checkTrajectoryThreat(vessel) {
    if (!vessel.speed || vessel.speed < 5) return false;
    if (!vessel.heading && !vessel.course) return false;

    // Predict position in 2 hours
    const heading = vessel.heading || vessel.course || 0;
    const speed = vessel.speed || 0;
    const distance = (speed * 2) / 60; // nautical miles in 2 hours

    // Simple projection
    const lat2 = vessel.lat + (distance * Math.cos(heading * Math.PI / 180) / 60);
    const lon2 = vessel.lon + (distance * Math.sin(heading * Math.PI / 180) / 60);

    // Check if projected position is in boundary
    const currentlyIn = this._inIndiaEEZ(vessel.lat, vessel.lon);
    const willBeIn = this._inIndiaEEZ(lat2, lon2);

    return !currentlyIn && willBeIn;
  }

  /**
   * Check if in piracy zone
   */
  _inPiracyZone(lat, lon) {
    const piracyZones = [
      { latMin: 10, latMax: 15, lonMin: 43, lonMax: 52 }, // Gulf of Aden
      { latMin: 5, latMax: 12, lonMin: 48, lonMax: 65 },  // Somali Basin
      { latMin: 3, latMax: 6, lonMin: 98, lonMax: 101 },  // Malacca Strait
    ];

    return piracyZones.some(zone =>
      lat >= zone.latMin && lat <= zone.latMax &&
      lon >= zone.lonMin && lon <= zone.lonMax
    );
  }

  /**
   * Get available naval units
   */
  getNavalUnits(vessels) {
    return vessels.filter(vessel => {
      const type = (vessel.vessel_type || '').toLowerCase();
      const isNaval = type.includes('naval') || type.includes('coast guard');
      const isFriendly = !this._isUnfriendly(vessel);
      const hasPosition = vessel.lat && vessel.lon;
      const isMoving = (vessel.speed || 0) > 0;

      return isNaval && isFriendly && hasPosition && isMoving;
    });
  }

  /**
   * Generate response recommendation for a threat
   */
  generateResponse(threat, navalUnits, allVessels) {
    if (navalUnits.length === 0) {
      return {
        threatVessel: threat.name || threat.mmsi,
        threatMMSI: threat.mmsi,
        threatType: threat.threatType,
        threatLat: threat.lat,
        threatLon: threat.lon,
        threatSpeed: threat.speed || 0,
        threatHeading: threat.heading || threat.course || 0,
        nearestNavalUnit: null,
        navalMMSI: null,
        distance: null,
        interceptionTime: null,
        interceptionPoint: null,
        recommendedAction: 'No naval units available for immediate response. Alert coast guard headquarters.',
        priority: this._calculatePriority(threat, null),
        timestamp: Date.now(),
      };
    }

    // Find nearest naval unit
    const nearest = this._findNearestNavalUnit(threat, navalUnits);
    
    if (!nearest) {
      return null;
    }

    // Calculate interception details
    const interception = window.interceptionUtils.calculateInterception(
      threat,
      nearest.unit
    );

    // Generate recommended action
    const action = window.actionGenerator.generateAction(
      threat,
      nearest.unit,
      interception
    );

    // Calculate priority
    const priority = this._calculatePriority(threat, nearest.distance);

    return {
      threatVessel: threat.name || threat.mmsi,
      threatMMSI: threat.mmsi,
      threatType: threat.threatType,
      threatLat: threat.lat,
      threatLon: threat.lon,
      threatSpeed: threat.speed || 0,
      threatHeading: threat.heading || threat.course || 0,
      nearestNavalUnit: nearest.unit.name || nearest.unit.mmsi,
      navalMMSI: nearest.unit.mmsi,
      navalLat: nearest.unit.lat,
      navalLon: nearest.unit.lon,
      navalSpeed: nearest.unit.speed || 0,
      distance: nearest.distance,
      interceptionTime: interception.time,
      interceptionPoint: interception.point,
      recommendedAction: action,
      priority: priority,
      timestamp: Date.now(),
    };
  }

  /**
   * Find nearest naval unit to threat
   */
  _findNearestNavalUnit(threat, navalUnits) {
    let nearest = null;
    let minDistance = Infinity;

    navalUnits.forEach(unit => {
      const distance = this._calculateDistance(
        threat.lat, threat.lon,
        unit.lat, unit.lon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { unit, distance };
      }
    });

    return nearest;
  }

  /**
   * Calculate distance between two points (nautical miles)
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate threat priority
   */
  _calculatePriority(threat, distance) {
    let score = 0;

    // Threat type scoring
    if (threat.threatType === 'Unauthorized Intrusion') score += 40;
    else if (threat.threatType === 'Potential Intrusion') score += 30;
    else if (threat.threatType === 'Piracy Zone Threat') score += 35;
    else score += 20;

    // Distance scoring (closer = higher priority)
    if (distance !== null) {
      if (distance < 20) score += 30;
      else if (distance < 50) score += 20;
      else if (distance < 100) score += 10;
    }

    // Speed scoring (faster = higher priority)
    const speed = threat.speed || 0;
    if (speed > 30) score += 20;
    else if (speed > 20) score += 10;

    // Inside boundary = higher priority
    if (this._inIndiaEEZ(threat.lat, threat.lon)) score += 10;

    // Determine priority level
    if (score >= 70) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Update UI with responses
   */
  updateUI(responses) {
    if (typeof window.updateNavalResponseUI === 'function') {
      window.updateNavalResponseUI(responses);
    }
  }

  /**
   * Clear UI when no threats
   */
  clearUI() {
    if (typeof window.clearNavalResponseUI === 'function') {
      window.clearNavalResponseUI();
    }
  }

  /**
   * Update map visualization
   */
  updateMap(responses) {
    if (typeof window.updateNavalResponseMap === 'function') {
      window.updateNavalResponseMap(responses);
    }
  }

  /**
   * Generate alerts for new threats
   */
  generateAlerts(responses) {
    responses.forEach(response => {
      // Only alert for new threats or priority changes
      const existing = this.responses.get(response.threatMMSI);
      
      if (!existing || existing.priority !== response.priority) {
        // Generate alert
        if (typeof window._pushAlert === 'function') {
          const priority = response.priority === 'CRITICAL' ? 'critical' :
                          response.priority === 'HIGH' ? 'high' :
                          response.priority === 'MEDIUM' ? 'medium' : 'low';

          window._pushAlert(
            `NAVAL_${response.threatMMSI}`,
            response.threatVessel,
            'naval_response',
            `${response.threatType} detected. ${response.recommendedAction}`,
            priority,
            response.threatLat,
            response.threatLon
          );
        }
      }
    });
  }

  /**
   * Update threat tracking
   */
  updateThreatTracking(threats) {
    // Clear old threats
    const currentMMSIs = new Set(threats.map(t => t.mmsi));
    for (const mmsi of this.threats.keys()) {
      if (!currentMMSIs.has(mmsi)) {
        this.threats.delete(mmsi);
        this.responses.delete(mmsi);
      }
    }

    // Update current threats
    threats.forEach(threat => {
      this.threats.set(threat.mmsi, threat);
    });
  }

  /**
   * Get current responses
   */
  getResponses() {
    return Array.from(this.responses.values());
  }

  /**
   * Get current threats
   */
  getThreats() {
    return Array.from(this.threats.values());
  }
}

// Export singleton instance
const navalResponseEngine = new NavalResponseEngine();
