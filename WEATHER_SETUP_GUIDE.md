# Weather & Disaster Intelligence Module - Setup Guide

Complete guide to setting up and using the Weather & Disaster Intelligence Module in ORVMS.

## Table of Contents
1. [Quick Start](#quick-start)
2. [API Configuration](#api-configuration)
3. [Features Overview](#features-overview)
4. [Usage Guide](#usage-guide)
5. [Customization](#customization)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. No Configuration Required (Demo Mode)

The weather module works out-of-the-box without any API keys:

1. Start the application (see main README.md)
2. Login with demo credentials: `DEMO001` / `demo123`
3. Click **"Weather & Disaster"** in the sidebar
4. Explore the demo weather data and active cyclone

**Demo Mode Includes:**
- Simulated weather data for Indian coastal regions
- Active cyclone (Cyclone Amphan) with forecast path
- Historical disaster database (5 major events)
- Rainfall and wind visualizations
- All UI features fully functional

### 2. With OpenWeather API (Recommended for Production)

For real-time weather data:

1. Get a free API key from [OpenWeather](https://openweathermap.org/api)
   - Sign up for free account
   - Navigate to API keys section
   - Copy your API key

2. Configure in browser console:
   ```javascript
   localStorage.setItem('openWeatherKey', 'your_api_key_here');
   ```

3. Refresh the Weather & Disaster page

4. Search for any coastal location to see real weather data

---

## API Configuration

### OpenWeather API Setup

#### Free Tier Limits
- 1,000 calls/day
- 60 calls/minute
- Current weather + 5-day forecast included

#### Getting Your API Key

1. Visit https://openweathermap.org/api
2. Click "Sign Up" (top right)
3. Create account with email
4. Verify email address
5. Go to "API keys" tab
6. Copy the default API key (or create new one)

#### Configuration Methods

**Method 1: Browser Console (Temporary)**
```javascript
localStorage.setItem('openWeatherKey', 'your_api_key_here');
location.reload();
```

**Method 2: Browser DevTools (Persistent)**
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Expand Local Storage
4. Click on your domain
5. Add new key: `openWeatherKey`
6. Set value: your API key
7. Refresh page

**Method 3: Settings Page (Future Enhancement)**
- Navigate to Settings
- Enter API key in Weather section
- Click Save

### IMD Integration (Planned)

Indian Meteorological Department integration is planned for future releases:
- Official cyclone bulletins
- Satellite imagery
- Regional warnings
- No API key required (public data)

---

## Features Overview

### 1. Real-Time Weather Dashboard

**Location:** Weather & Disaster page (top section)

**Displays:**
- Current temperature, wind speed, humidity
- Risk level indicator (Low/Medium/High/Critical)
- Active cyclone count
- Weather icon and description
- Feels-like temperature
- Atmospheric pressure
- Visibility
- Cloud cover

**Updates:** Every 10 minutes (configurable)

### 2. 7-Day Weather Forecast

**Location:** Weather & Disaster page (forecast card)

**Shows:**
- Daily temperature ranges (high/low)
- Weather conditions with icons
- Wind speed
- Precipitation probability
- Day name and date

**Interaction:** Hover over days for details

### 3. Interactive Weather Map

**Location:** Weather & Disaster page (bottom section)

**Layers:**
- **Cyclones** (red): Active cyclones with danger zones
  - Historical path (dashed red line)
  - Forecast path (dashed yellow line)
  - Animated cyclone icon
  - Click for details popup

- **Rainfall** (blue gradient): Precipitation heatmap
  - Intensity-based coloring
  - Coverage area visualization

- **Wind** (arrows): Wind patterns
  - Direction indicators
  - Speed-based coloring
  - Hover for wind speed

- **Historical** (colored markers): Past disasters
  - Cyclones (red)
  - Floods (blue)
  - Storms (yellow)
  - Click for disaster details

**Controls:**
- Toggle layers on/off with checkboxes
- Zoom and pan like regular map
- Click markers for popups

### 4. Cyclone Tracking

**Active Cyclones:**
- Real-time position
- Wind speed and pressure
- Category classification
- Affected regions list
- Warning messages
- "View on Map" button

**Cyclone Paths:**
- Historical track (where it's been)
- Forecast track (where it's going)
- Time markers (+12h, +24h, +36h)
- Danger zone radius

### 5. Location Search

**Location:** Top of Weather & Disaster page

**Features:**
- Search coastal cities
- Autocomplete suggestions
- Coordinates display
- Quick location switching
- Updates all weather data

**Supported Locations:**
- All Indian coastal cities
- Major ports
- Island territories
- International locations (with API key)

### 6. Historical Disaster Database

**Location:** Weather & Disaster page (disaster timeline)

**Includes:**
- Cyclone Amphan (2020) - West Bengal, Odisha
- Cyclone Fani (2019) - Odisha
- Kerala Floods (2018) - Kerala
- Cyclone Vardah (2016) - Tamil Nadu
- Cyclone Hudhud (2014) - Andhra Pradesh

**Each Entry Shows:**
- Disaster name and type
- Date of occurrence
- Location/regions affected
- Severity classification
- Impact summary (casualties, damage)
- Map marker

**Interaction:** Click to view location on map

### 7. Date Selector

**Location:** Below search bar

**Features:**
- Calendar date picker
- Previous/Next day buttons
- "Today" quick button
- Historical data view
- Cannot select future dates

**Use Cases:**
- Review past weather events
- Compare historical patterns
- Study disaster timelines

### 8. Safety Precautions

**Location:** Weather & Disaster page (precautions card)

**Context-Aware Recommendations:**

**For Fishermen:**
- Sailing advisories (avoid/limit/proceed)
- Equipment securing instructions
- Coast guard contact reminders
- Return-to-harbor timing
- Emergency procedures

**For Coastal Residents:**
- Evacuation alerts
- Shelter locations
- Supply stocking guidance
- Communication protocols

**Risk-Based:**
- **Critical**: Immediate action required
- **High**: Prepare for severe conditions
- **Medium**: Exercise caution
- **Low**: Normal precautions

### 9. Alert Integration

**Automatic Alerts Generated For:**
- Active cyclones (Critical/High priority)
- High wind conditions (>40 km/h)
- Heavy rainfall (>50mm/h)
- Storm surge risks

**Alert Features:**
- Appears in Alert Center
- Shows on dashboard
- Toast notifications
- Acknowledgment tracking
- "View on Map" button

---

## Usage Guide

### Basic Workflow

#### 1. View Current Weather
```
1. Navigate to "Weather & Disaster" from sidebar
2. View current conditions at default location (India center)
3. Check risk level indicator
4. Review safety precautions
```

#### 2. Search Specific Location
```
1. Click search bar at top
2. Type coastal city name (e.g., "Mumbai", "Chennai")
3. Select from dropdown results
4. Weather updates automatically
5. Map centers on location
```

#### 3. Check Forecast
```
1. Scroll to "7-Day Forecast" card
2. Review daily conditions
3. Hover over days for details
4. Check precipitation probability
5. Note wind conditions
```

#### 4. Track Active Cyclones
```
1. Look for red "Active Cyclone Alert" card
2. Review cyclone details (wind speed, pressure)
3. Read warning message
4. Check affected regions
5. Click "View on Map" to see location
6. Observe historical and forecast paths
```

#### 5. Explore Weather Map
```
1. Scroll to weather map
2. Toggle layers as needed:
   - Cyclones: See active storms
   - Rainfall: View precipitation
   - Wind: Check wind patterns
   - Historical: Past disasters
3. Click markers for details
4. Zoom in/out for different views
```

#### 6. Review Historical Data
```
1. Use date selector to pick past date
2. View disaster timeline
3. Click disaster entries to see on map
4. Compare with current conditions
5. Study patterns and trends
```

### Advanced Usage

#### Custom Risk Assessment
The system calculates risk based on multiple factors:
- Wind speed thresholds
- Rainfall intensity
- Cyclone proximity
- Combined conditions

You can interpret risk levels:
- **Low**: Normal operations, standard precautions
- **Medium**: Increased vigilance, limit exposure
- **High**: Significant risk, avoid non-essential activities
- **Critical**: Immediate danger, emergency protocols

#### Layer Combinations
Effective layer combinations for different scenarios:

**Cyclone Monitoring:**
- Enable: Cyclones + Wind
- Disable: Rainfall, Historical
- Focus: Storm tracking

**Rainfall Analysis:**
- Enable: Rainfall + Historical
- Disable: Cyclones, Wind
- Focus: Flood risk areas

**Comprehensive View:**
- Enable: All layers
- Use: Situational awareness

**Historical Study:**
- Enable: Historical only
- Use: Pattern analysis

#### Integration with Maritime Monitoring
The weather module integrates with vessel tracking:

1. **Weather Alerts** appear in main Alert Center
2. **Risk levels** can inform vessel routing
3. **Cyclone zones** overlay with vessel positions
4. **Safety precautions** apply to maritime operations

---

## Customization

### Adjusting Update Intervals

Edit `frontend/modules/weather/weatherService.js`:

```javascript
const WEATHER_CONFIG = {
  updateInterval: 600000, // 10 minutes (in milliseconds)
  // Change to 300000 for 5 minutes
  // Change to 1800000 for 30 minutes
};
```

### Adding Custom Locations

Add to demo locations in `weatherService.js`:

```javascript
_getDemoLocations(query) {
  const coastal = [
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'IN' },
    { name: 'Your City', lat: XX.XXXX, lon: YY.YYYY, country: 'IN' },
    // Add more locations
  ];
  return coastal.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
}
```

### Customizing Risk Thresholds

Edit `weatherService.js` `calculateRiskLevel()` method:

```javascript
// Adjust wind speed thresholds
if (weather.wind?.speed > 40) {  // Change 40 to your threshold
  risk = 'critical';
} else if (weather.wind?.speed > 25) {  // Change 25
  risk = 'high';
}

// Adjust rainfall thresholds
if (weather.rain?.['1h'] > 50) {  // Change 50
  risk = risk === 'critical' ? 'critical' : 'high';
}
```

### Adding Custom Precautions

Edit `weatherService.js` `getSafetyPrecautions()` method:

```javascript
const precautions = {
  cyclone: {
    high: [
      '⚠️ Your custom precaution here',
      '🔒 Another safety tip',
      // Add more
    ],
  },
};
```

### Styling Customization

Edit `frontend/modules/weather/weather.css`:

```css
/* Change cyclone color */
.cyclone-center {
  background: var(--red);  /* Change to your color */
}

/* Adjust forecast card size */
.forecast-day {
  min-width: 120px;  /* Change width */
}

/* Modify risk level colors */
.kpi-card[style*="border-left: 3px solid"] {
  /* Custom styling */
}
```

---

## Troubleshooting

### Weather Data Not Loading

**Symptom:** Dashboard shows "No data available" or loading spinner

**Solutions:**
1. Check API key configuration:
   ```javascript
   console.log(localStorage.getItem('openWeatherKey'));
   ```
2. Verify internet connection
3. Check browser console for errors (F12)
4. Try demo mode (remove API key):
   ```javascript
   localStorage.removeItem('openWeatherKey');
   location.reload();
   ```
5. Check API key validity at OpenWeather dashboard

### Map Not Displaying

**Symptom:** Weather map shows blank or doesn't load

**Solutions:**
1. Ensure Leaflet library is loaded:
   ```javascript
   console.log(typeof L);  // Should show "object"
   ```
2. Check browser compatibility (Chrome, Firefox, Edge, Safari)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Verify map container exists:
   ```javascript
   console.log(document.getElementById('weather-map'));
   ```
5. Try refreshing the page

### Location Search Not Working

**Symptom:** Search returns no results or errors

**Solutions:**
1. Check API key (required for real location search)
2. Verify query format (city name only, no special characters)
3. Try demo locations: Mumbai, Chennai, Kochi, Visakhapatnam, Goa
4. Check network tab in DevTools for API errors
5. Ensure OpenWeather geocoding API is enabled

### Cyclone Not Showing on Map

**Symptom:** Cyclone alert visible but not on map

**Solutions:**
1. Check "Cyclones" layer is enabled (checkbox above map)
2. Zoom out to see full region
3. Click "View on Map" button in cyclone alert
4. Verify map is initialized:
   ```javascript
   console.log(window.weatherMapInstance);
   ```
5. Refresh the page

### Forecast Not Updating

**Symptom:** Forecast shows old data

**Solutions:**
1. Check last update time in dashboard
2. Verify update interval setting
3. Manually refresh by changing location
4. Check API call limits (1000/day for free tier)
5. Clear localStorage and reconfigure:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Performance Issues

**Symptom:** Slow loading or laggy map

**Solutions:**
1. Disable unused layers (rainfall, wind)
2. Reduce update frequency
3. Close other browser tabs
4. Check system resources (CPU, memory)
5. Use demo mode for testing

### API Key Errors

**Symptom:** "Invalid API key" or 401 errors

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Check API key is activated (can take 10 minutes)
3. Ensure API key has required permissions
4. Try generating new API key
5. Check OpenWeather account status

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Not Supported:**
- Internet Explorer
- Opera Mini
- Old mobile browsers

### Console Errors

Common errors and solutions:

**"weatherService is not defined"**
- Ensure `weatherService.js` is loaded before `app.js`
- Check script order in `index.html`

**"Cannot read property 'map' of undefined"**
- Weather map not initialized
- Navigate to Weather page first
- Check `initWeatherModule()` is called

**"Failed to fetch"**
- Network error or CORS issue
- Check internet connection
- Verify API endpoint is accessible

---

## Support & Resources

### Documentation
- Main README: `README.md`
- Weather Module README: `frontend/modules/weather/README.md`
- This Setup Guide: `WEATHER_SETUP_GUIDE.md`

### External Resources
- OpenWeather API Docs: https://openweathermap.org/api
- Leaflet Documentation: https://leafletjs.com/reference.html
- IMD Official Site: https://mausam.imd.gov.in/

### Getting Help
1. Check browser console for errors
2. Review this troubleshooting section
3. Test in demo mode
4. Verify API configuration
5. Check network connectivity

### Reporting Issues
When reporting issues, include:
- Browser and version
- Error messages from console
- Steps to reproduce
- API key status (configured/demo mode)
- Screenshots if applicable

---

## Best Practices

### For Fishermen
1. Check weather before every voyage
2. Monitor cyclone alerts daily during monsoon season
3. Keep emergency contacts handy
4. Follow coast guard advisories
5. Return to harbor when risk level is High or Critical

### For Coastal Residents
1. Review disaster history for your region
2. Know evacuation routes and shelter locations
3. Stock emergency supplies during cyclone season
4. Monitor weather during monsoon months
5. Follow local authority instructions

### For System Administrators
1. Configure OpenWeather API key for production
2. Monitor API usage to stay within limits
3. Set appropriate update intervals
4. Test in demo mode before deployment
5. Keep documentation updated

### For Developers
1. Review module architecture before customizing
2. Test changes in demo mode first
3. Follow existing code patterns
4. Document custom modifications
5. Keep weather module separate from core system

---

## Conclusion

The Weather & Disaster Intelligence Module provides comprehensive weather monitoring and disaster management capabilities specifically designed for maritime and coastal applications. With both demo and production modes, it's ready to use immediately while offering full customization for specific needs.

For questions or issues, refer to the troubleshooting section or review the detailed module documentation in `frontend/modules/weather/README.md`.

**Stay safe and monitor the weather!** 🌊⛈️🚢
