# Naval Response Recommendation Engine

An intelligent decision support system that detects maritime threats and recommends optimal naval response strategies in real-time.

## Overview

The Naval Response Recommendation Engine continuously monitors vessel movements, identifies potential threats to maritime security, and automatically generates actionable response recommendations for naval forces.

## Features

### 🚨 Threat Detection
- **Continuous Monitoring**: Real-time analysis of all vessels in the system
- **Multi-Factor Assessment**: Evaluates vessel nationality, position, trajectory, and behavior
- **Threat Classification**:
  - Unauthorized Intrusion (unfriendly vessel inside boundary)
  - Potential Intrusion (trajectory intersects boundary)
  - Piracy Zone Threat (vessel in high-risk area)
  - Suspicious Activity (high-speed unknown vessel)

### 📍 Naval Unit Selection
- **Automatic Identification**: Finds all available naval and coast guard vessels
- **Proximity Calculation**: Determines nearest responding unit for each threat
- **Multi-Threat Handling**: Assigns different units to simultaneous threats
- **Availability Check**: Ensures units are operational and mobile

### ⏱️ Interception Calculations
- **Distance Measurement**: Precise nautical mile calculations
- **Time Estimation**: ETA based on naval unit speed
- **Trajectory Prediction**: Advanced interception point calculation
- **Path Optimization**: Considers both vessel movements

### 🧠 Action Recommendations
- **Context-Aware**: Actions tailored to threat type and distance
- **Priority-Based**: CRITICAL, HIGH, MEDIUM, LOW classifications
- **Detailed Instructions**: Specific steps for naval commanders
- **Escalation Protocols**: Built-in response escalation procedures

### 📊 Real-Time Updates
- **5-Second Refresh**: Continuous threat assessment
- **Dynamic Recalculation**: Updates as vessels move
- **Alert Integration**: Automatic alert generation
- **Performance Optimized**: Efficient calculations

### 🗺️ Map Visualization
- **Threat Markers**: Pulsing red markers for threats
- **Responder Markers**: Green markers for naval units
- **Interception Lines**: Dashed lines showing response paths
- **Interception Points**: Predicted meeting locations
- **Interactive Popups**: Detailed information on click

### 📱 User Interface
- **Sliding Panel**: Collapsible response panel
- **Response Cards**: Detailed threat information
- **Priority Indicators**: Color-coded urgency levels
- **Statistics Dashboard**: Quick overview of threats
- **Action Buttons**: View on map, acknowledge responses

## Architecture

```
modules/navalResponse/
├── navalResponseEngine.js  - Core threat detection & analysis
├── interceptionUtils.js    - Distance & time calculations
├── actionGenerator.js      - Response recommendation logic
├── navalResponseUI.js      - UI rendering & interactions
├── navalResponse.css       - Styling
└── README.md              - This file
```

### Component Responsibilities

**navalResponseEngine.js**
- Main analysis loop
- Threat detection logic
- Naval unit selection
- Response generation
- Alert integration

**interceptionUtils.js**
- Distance calculations (Haversine formula)
- Interception time estimation
- Trajectory prediction
- Path intersection detection
- Coordinate formatting

**actionGenerator.js**
- Action recommendation generation
- Priority assessment
- Context-specific instructions
- Escalation procedures
- Multi-unit coordination

**navalResponseUI.js**
- Panel management
- Response card rendering
- Map visualization
- User interactions
- Statistics display

## Usage

### Automatic Operation

The system starts automatically when the application loads:

```javascript
// Initialized in app.js
initNavalResponseModule();
```

No configuration required - it works out of the box!

### Manual Control

```javascript
// Start the engine
navalResponseEngine.start();

// Stop the engine
navalResponseEngine.stop();

// Get current responses
const responses = navalResponseEngine.getResponses();

// Get current threats
const threats = navalResponseEngine.getThreats();
```

### UI Control

```javascript
// Toggle panel visibility
navalResponseUI.togglePanel();

// Focus on specific threat
navalResponseUI.focusOnThreat(mmsi);

// Acknowledge response
navalResponseUI.acknowledgeResponse(mmsi);
```

## Threat Detection Logic

### Criteria

A vessel is classified as a threat if:

1. **Unfriendly + Inside Boundary**
   - Flag not in friendly list
   - Currently within India EEZ
   - → Unauthorized Intrusion

2. **Unfriendly + Trajectory Threat**
   - Flag not in friendly list
   - Predicted path enters boundary
   - → Potential Intrusion

3. **High Speed Unknown**
   - Speed ≥ 25 knots
   - Unknown or no flag
   - Inside or approaching boundary
   - → Suspicious Activity

4. **Piracy Zone**
   - Any vessel in designated piracy zones
   - → Piracy Zone Threat

### Friendly Flags

```javascript
India, USA, UK, France, Australia, Japan, South Korea,
New Zealand, Canada, Germany, Italy, Norway, Netherlands,
Denmark, Sweden, Finland, Portugal, Spain, Greece
```

## Response Generation

### Priority Calculation

Priority is calculated based on:

- **Threat Type** (40 points max)
  - Unauthorized Intrusion: 40
  - Piracy Zone: 35
  - Potential Intrusion: 30
  - Suspicious Activity: 20

- **Distance** (30 points max)
  - < 20 NM: 30
  - < 50 NM: 20
  - < 100 NM: 10

- **Speed** (20 points max)
  - > 30 knots: 20
  - > 20 knots: 10

- **Inside Boundary** (10 points)

**Priority Levels:**
- CRITICAL: ≥ 70 points
- HIGH: ≥ 50 points
- MEDIUM: ≥ 30 points
- LOW: < 30 points

### Action Examples

**Unauthorized Intrusion (< 20 NM)**
```
IMMEDIATE RESPONSE: Deploy INS Kolkata for direct interception.
Initiate radio contact on VHF Channel 16. Prepare boarding team.
Alert coast guard command. ETA: 1h 30m.
```

**Potential Intrusion (< 30 NM)**
```
PREVENTIVE ACTION: Position INS Chennai to intercept projected path.
Issue warning via radio to alter course.
Monitor vessel movements closely. ETA: 2h 15m.
```

**Piracy Zone Threat**
```
ANTI-PIRACY PROTOCOL: Deploy INS Tarkash with armed escort.
Establish visual contact and assess threat level.
Coordinate with international maritime security forces.
Maintain heightened alert status. ETA: 3h 45m.
```

## Interception Calculations

### Distance Formula

Uses Haversine formula for great-circle distance:

```javascript
R = 3440.065 NM (Earth radius)
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c
```

### Time Calculation

```javascript
time (hours) = distance (NM) / speed (knots)
```

### Interception Point

Advanced algorithm predicts optimal meeting point:

1. Project threat position over next 6 hours
2. Calculate naval unit travel time to each point
3. Find point where times match (within 18-minute tolerance)
4. Return most accurate interception point

## Map Visualization

### Markers

- **Threat Marker**: Red pulsing circle
- **Naval Responder**: Green circle
- **Interception Point**: Yellow blinking circle

### Lines

- **Interception Line**: Blue dashed line (animated)
- **Threat Path**: Red dashed line
- **Naval Path**: Green solid line

### Popups

Click any marker for detailed information:
- Vessel name and type
- Current status
- Speed and heading
- Distance and ETA
- Coordinates

## Integration

### With Alert System

Automatically generates alerts:

```javascript
window._pushAlert(
  `NAVAL_${mmsi}`,
  vesselName,
  'naval_response',
  message,
  priority,
  lat,
  lon
);
```

### With Vessel Tracking

Uses existing vessel data:
- `vessels` object (global)
- Vessel attributes (mmsi, name, type, lat, lon, speed, heading, flag)
- Maritime boundary functions
- Distance calculations

### With Map System

Integrates with Leaflet map:
- Uses `mainMap` instance
- Adds custom layers
- Respects existing layers
- No conflicts with vessel markers

## Performance

### Optimization Strategies

1. **Efficient Loops**: Single pass through vessel array
2. **Cached Calculations**: Reuses distance calculations
3. **Throttled Updates**: 5-second refresh interval
4. **Lazy Rendering**: Only updates visible UI
5. **Memory Management**: Clears old threats automatically

### Resource Usage

- **CPU**: < 5% during analysis
- **Memory**: ~2-5 MB for typical scenarios
- **Network**: No additional API calls
- **Rendering**: Smooth 60fps animations

## Customization

### Update Interval

```javascript
// In navalResponseEngine.js
this.updateInterval = 5000; // Change to 3000 for 3 seconds
```

### Threat Criteria

```javascript
// In navalResponseEngine.js assessThreat()
const isHighSpeedUnknown = (vessel.speed || 0) >= 25; // Change threshold
```

### Priority Thresholds

```javascript
// In navalResponseEngine.js _calculatePriority()
if (score >= 70) return 'CRITICAL'; // Adjust thresholds
```

### Friendly Flags

```javascript
// In navalResponseEngine.js _isUnfriendly()
const friendlyFlags = new Set([
  'India', 'USA', 'UK', // Add more countries
]);
```

### Action Templates

```javascript
// In actionGenerator.js
_generateIntrusionAction(threat, navalUnit, distance, time) {
  // Customize action messages
}
```

## Troubleshooting

### No Threats Detected

**Possible Causes:**
- No unfriendly vessels in area
- All vessels outside boundary
- No high-speed unknown vessels

**Solution:** System is working correctly - no action needed

### No Naval Units Available

**Possible Causes:**
- No vessels with "Naval" or "Coast Guard" type
- All naval vessels stationary (speed = 0)
- Naval vessels outside tracking range

**Solution:** Add naval vessels or wait for them to enter area

### Interception Time Shows N/A

**Possible Causes:**
- Naval unit speed is 0
- Naval unit not moving

**Solution:** System correctly identifies unit cannot intercept

### Map Markers Not Showing

**Possible Causes:**
- Map not initialized
- Layers not added to map
- Zoom level too low

**Solution:**
```javascript
// Check map instance
console.log(window.mainMap);

// Reinitialize UI
navalResponseUI.initialize();
```

### Panel Not Visible

**Possible Causes:**
- Panel collapsed
- CSS not loaded

**Solution:**
```javascript
// Toggle panel
navalResponseUI.togglePanel();

// Check CSS
console.log(document.querySelector('link[href*="navalResponse.css"]'));
```

## API Reference

### NavalResponseEngine

```javascript
// Start engine
navalResponseEngine.start()

// Stop engine
navalResponseEngine.stop()

// Get responses
navalResponseEngine.getResponses() // Returns Array<Response>

// Get threats
navalResponseEngine.getThreats() // Returns Array<Threat>

// Manual analysis
navalResponseEngine.analyze()
```

### InterceptionUtils

```javascript
// Calculate interception
interceptionUtils.calculateInterception(threat, navalUnit)
// Returns { distance, time, point }

// Calculate bearing
interceptionUtils.calculateBearing(lat1, lon1, lat2, lon2)
// Returns bearing in degrees

// Predict position
interceptionUtils.predictPosition(vessel, hours)
// Returns { lat, lon }

// Check path intersection
interceptionUtils.willPathsIntersect(vessel1, vessel2, maxHours)
// Returns { intersects, time, point, distance }

// Format distance
interceptionUtils.formatDistance(nm)
// Returns formatted string

// Format coordinates
interceptionUtils.formatCoordinates(lat, lon)
// Returns formatted string
```

### ActionGenerator

```javascript
// Generate action
actionGenerator.generateAction(threat, navalUnit, interception)
// Returns action string

// Generate multi-unit action
actionGenerator.generateMultiUnitAction(threat, navalUnits, interceptions)
// Returns coordinated action string

// Generate escalation
actionGenerator.generateEscalationAction(threat, currentAction)
// Returns escalation action string
```

### NavalResponseUI

```javascript
// Initialize UI
navalResponseUI.initialize()

// Toggle panel
navalResponseUI.togglePanel()

// Update UI
navalResponseUI.update(responses)

// Update map
navalResponseUI.updateMap(responses)

// Focus on threat
navalResponseUI.focusOnThreat(mmsi)

// Acknowledge response
navalResponseUI.acknowledgeResponse(mmsi)

// Clear UI
navalResponseUI.clear()
```

## Future Enhancements

### Planned Features

1. **Multi-Unit Coordination**
   - Assign multiple units to single threat
   - Coordinated pincer maneuvers
   - Formation tactics

2. **Historical Analysis**
   - Track response effectiveness
   - Learn from past incidents
   - Optimize recommendations

3. **Weather Integration**
   - Consider sea conditions
   - Adjust ETAs for weather
   - Factor in visibility

4. **Communication Integration**
   - Direct radio contact
   - Automated messaging
   - Status updates

5. **Advanced Predictions**
   - Machine learning for behavior
   - Pattern recognition
   - Anomaly detection

6. **Resource Management**
   - Fuel considerations
   - Crew readiness
   - Equipment status

## Best Practices

### For Naval Commanders

1. **Monitor Continuously**: Keep panel visible during operations
2. **Prioritize Critical**: Address CRITICAL threats immediately
3. **Verify Information**: Confirm vessel identity before action
4. **Follow Protocols**: Use recommended actions as guidelines
5. **Document Actions**: Acknowledge responses for record-keeping

### For System Administrators

1. **Regular Testing**: Verify system with test scenarios
2. **Monitor Performance**: Check CPU and memory usage
3. **Update Friendly List**: Keep flag list current
4. **Review Thresholds**: Adjust based on operational needs
5. **Backup Data**: Log all threats and responses

### For Developers

1. **Maintain Modularity**: Keep components separate
2. **Test Thoroughly**: Verify all threat scenarios
3. **Document Changes**: Update README for modifications
4. **Follow Patterns**: Use existing code style
5. **Optimize Performance**: Profile before optimizing

## License

Part of the Ocean Risk and Vessel Monitoring System (ORVMS)

## Support

For issues or questions:
1. Check this documentation
2. Review code comments
3. Test in isolation
4. Check browser console
5. Verify vessel data availability

---

**Transform your maritime monitoring into an intelligent defense system!** 🛡️⚓🚢
