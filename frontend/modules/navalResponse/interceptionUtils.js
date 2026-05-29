/**
 * Interception Utilities
 * Calculate interception times, points, and trajectories
 */

const interceptionUtils = {
  /**
   * Calculate interception details between threat and naval unit
   */
  calculateInterception(threat, navalUnit) {
    const distance = this._calculateDistance(
      threat.lat, threat.lon,
      navalUnit.lat, navalUnit.lon
    );

    const navalSpeed = navalUnit.speed || 0;
    
    // Calculate simple interception time
    const time = this._calculateInterceptionTime(distance, navalSpeed);

    // Calculate interception point (advanced)
    const point = this._calculateInterceptionPoint(threat, navalUnit);

    return {
      distance,
      time,
      point,
    };
  },

  /**
   * Calculate interception time
   */
  _calculateInterceptionTime(distance, navalSpeed) {
    if (navalSpeed === 0) {
      return {
        hours: null,
        minutes: null,
        formatted: 'N/A (vessel stationary)',
      };
    }

    const hours = distance / navalSpeed;
    const totalMinutes = hours * 60;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    let formatted;
    if (h > 0) {
      formatted = `${h}h ${m}m`;
    } else {
      formatted = `${Math.round(totalMinutes)}m`;
    }

    return {
      hours: hours,
      minutes: totalMinutes,
      formatted: formatted,
    };
  },

  /**
   * Calculate optimal interception point using trajectory prediction
   */
  _calculateInterceptionPoint(threat, navalUnit) {
    const threatSpeed = threat.speed || 0;
    const navalSpeed = navalUnit.speed || 0;

    // If either vessel is stationary, interception point is threat's current position
    if (threatSpeed === 0 || navalSpeed === 0) {
      return {
        lat: threat.lat,
        lon: threat.lon,
        eta: null,
      };
    }

    const threatHeading = (threat.heading || threat.course || 0) * Math.PI / 180;
    const navalHeading = (navalUnit.heading || navalUnit.course || 0) * Math.PI / 180;

    // Predict threat position over next 6 hours
    const predictions = [];
    for (let t = 0.5; t <= 6; t += 0.5) {
      const threatDist = threatSpeed * t;
      const threatLat = threat.lat + (threatDist * Math.cos(threatHeading) / 60);
      const threatLon = threat.lon + (threatDist * Math.sin(threatHeading) / 60);

      // Calculate distance from naval unit to predicted threat position
      const distToThreat = this._calculateDistance(
        navalUnit.lat, navalUnit.lon,
        threatLat, threatLon
      );

      // Calculate time for naval unit to reach this point
      const navalTime = distToThreat / navalSpeed;

      // If naval unit can reach before threat, this is interception point
      if (Math.abs(navalTime - t) < 0.3) { // Within 18 minutes tolerance
        predictions.push({
          lat: threatLat,
          lon: threatLon,
          eta: t,
          accuracy: Math.abs(navalTime - t),
        });
      }
    }

    // Return best interception point (most accurate)
    if (predictions.length > 0) {
      predictions.sort((a, b) => a.accuracy - b.accuracy);
      return predictions[0];
    }

    // Fallback: simple midpoint with time estimate
    const directDist = this._calculateDistance(
      threat.lat, threat.lon,
      navalUnit.lat, navalUnit.lon
    );

    const meetTime = directDist / (navalSpeed + threatSpeed);
    const threatDist = threatSpeed * meetTime;

    return {
      lat: threat.lat + (threatDist * Math.cos(threatHeading) / 60),
      lon: threat.lon + (threatDist * Math.sin(threatHeading) / 60),
      eta: meetTime,
    };
  },

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
  },

  /**
   * Calculate bearing between two points
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  },

  /**
   * Predict vessel position after time (hours)
   */
  predictPosition(vessel, hours) {
    const speed = vessel.speed || 0;
    const heading = (vessel.heading || vessel.course || 0) * Math.PI / 180;
    const distance = speed * hours; // nautical miles

    return {
      lat: vessel.lat + (distance * Math.cos(heading) / 60),
      lon: vessel.lon + (distance * Math.sin(heading) / 60),
    };
  },

  /**
   * Calculate if paths will intersect
   */
  willPathsIntersect(vessel1, vessel2, maxHours = 6) {
    for (let t = 0.5; t <= maxHours; t += 0.5) {
      const pos1 = this.predictPosition(vessel1, t);
      const pos2 = this.predictPosition(vessel2, t);
      
      const dist = this._calculateDistance(pos1.lat, pos1.lon, pos2.lat, pos2.lon);
      
      // If within 5 NM, consider intersection
      if (dist < 5) {
        return {
          intersects: true,
          time: t,
          point: pos1,
          distance: dist,
        };
      }
    }

    return {
      intersects: false,
      time: null,
      point: null,
      distance: null,
    };
  },

  /**
   * Format distance for display
   */
  formatDistance(nm) {
    if (nm === null || nm === undefined) return 'N/A';
    return `${nm.toFixed(1)} NM`;
  },

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat, lon) {
    if (lat === null || lon === null) return 'N/A';
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
  },
};

// Make globally accessible
window.interceptionUtils = interceptionUtils;
