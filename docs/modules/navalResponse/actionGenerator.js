/**
 * Action Generator
 * Generate recommended actions based on threat assessment
 */

const actionGenerator = {
  /**
   * Generate recommended action for a threat
   */
  generateAction(threat, navalUnit, interception) {
    const threatType = threat.threatType;
    const distance = interception.distance;
    const time = interception.time;

    // Base action on threat type and distance
    let action = '';

    if (threatType === 'Unauthorized Intrusion') {
      action = this._generateIntrusionAction(threat, navalUnit, distance, time);
    } else if (threatType === 'Potential Intrusion') {
      action = this._generatePotentialIntrusionAction(threat, navalUnit, distance, time);
    } else if (threatType === 'Piracy Zone Threat') {
      action = this._generatePiracyAction(threat, navalUnit, distance, time);
    } else if (threatType === 'Suspicious Activity') {
      action = this._generateSuspiciousAction(threat, navalUnit, distance, time);
    } else {
      action = this._generateDefaultAction(threat, navalUnit, distance, time);
    }

    return action;
  },

  /**
   * Generate action for unauthorized intrusion
   */
  _generateIntrusionAction(threat, navalUnit, distance, time) {
    if (distance < 20) {
      return `IMMEDIATE RESPONSE: Deploy ${navalUnit.name || navalUnit.mmsi} for direct interception. ` +
             `Initiate radio contact on VHF Channel 16. Prepare boarding team. ` +
             `Alert coast guard command. ETA: ${time.formatted}.`;
    } else if (distance < 50) {
      return `HIGH PRIORITY: Dispatch ${navalUnit.name || navalUnit.mmsi} to intercept. ` +
             `Attempt radio contact and request vessel identification. ` +
             `Monitor trajectory continuously. Coordinate with nearest coast guard station. ` +
             `ETA: ${time.formatted}.`;
    } else {
      return `ALERT STATUS: Vector ${navalUnit.name || navalUnit.mmsi} toward threat vessel. ` +
             `Establish surveillance and maintain safe distance. ` +
             `Request vessel to alter course away from territorial waters. ` +
             `Prepare for extended pursuit if necessary. ETA: ${time.formatted}.`;
    }
  },

  /**
   * Generate action for potential intrusion
   */
  _generatePotentialIntrusionAction(threat, navalUnit, distance, time) {
    if (distance < 30) {
      return `PREVENTIVE ACTION: Position ${navalUnit.name || navalUnit.mmsi} to intercept projected path. ` +
             `Issue warning via radio to alter course. ` +
             `Monitor vessel movements closely. ETA: ${time.formatted}.`;
    } else {
      return `MONITORING: Track ${threat.name || threat.mmsi} trajectory. ` +
             `Alert ${navalUnit.name || navalUnit.mmsi} to standby for possible interception. ` +
             `Prepare to escalate if vessel continues toward boundary. ` +
             `Estimated interception time if needed: ${time.formatted}.`;
    }
  },

  /**
   * Generate action for piracy zone threat
   */
  _generatePiracyAction(threat, navalUnit, distance, time) {
    if (distance < 40) {
      return `ANTI-PIRACY PROTOCOL: Deploy ${navalUnit.name || navalUnit.mmsi} with armed escort. ` +
             `Establish visual contact and assess threat level. ` +
             `Coordinate with international maritime security forces. ` +
             `Maintain heightened alert status. ETA: ${time.formatted}.`;
    } else {
      return `PIRACY ALERT: Monitor ${threat.name || threat.mmsi} in high-risk zone. ` +
             `Position ${navalUnit.name || navalUnit.mmsi} for rapid response. ` +
             `Share intelligence with coalition forces. ` +
             `Prepare for potential hostile engagement. ETA: ${time.formatted}.`;
    }
  },

  /**
   * Generate action for suspicious activity
   */
  _generateSuspiciousAction(threat, navalUnit, distance, time) {
    return `INVESTIGATION: Dispatch ${navalUnit.name || navalUnit.mmsi} to investigate suspicious vessel. ` +
           `Request identification and destination information. ` +
           `Conduct visual inspection if safe to approach. ` +
           `Document vessel characteristics and behavior. ETA: ${time.formatted}.`;
  },

  /**
   * Generate default action
   */
  _generateDefaultAction(threat, navalUnit, distance, time) {
    return `STANDARD RESPONSE: Deploy ${navalUnit.name || navalUnit.mmsi} for routine interception. ` +
           `Establish radio contact and verify vessel credentials. ` +
           `Monitor until threat is resolved. ETA: ${time.formatted}.`;
  },
};

// Make globally accessible
window.actionGenerator = actionGenerator;
