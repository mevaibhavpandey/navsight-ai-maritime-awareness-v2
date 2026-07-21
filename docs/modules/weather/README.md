# Weather & Disaster Intelligence Module

A comprehensive weather monitoring and disaster management system specifically designed for fishermen and coastal populations in India.

## Features

### 🌦️ Real-Time Weather Monitoring
- Current weather conditions (temperature, wind, humidity, pressure)
- 7-day weather forecast with detailed metrics
- Location-based weather search for coastal cities
- Risk level assessment (Low, Medium, High, Critical)

### 🌪️ Cyclone Tracking
- Active cyclone monitoring with real-time positions
- Historical cyclone path visualization
- Forecast path prediction (up to 72 hours)
- Animated cyclone markers with danger zones
- Wind speed and pressure data
- Affected regions identification

### 🗺️ Interactive Weather Map
- Dedicated weather map with multiple layers:
  - **Cyclone Layer**: Shows active cyclones with paths
  - **Rainfall Layer**: Heatmap visualization of precipitation
  - **Wind Layer**: Wind direction and speed indicators
  - **Historical Layer**: Past disaster locations
- Toggle layers on/off for customized view
- Click markers for detailed information

### 📅 Historical Weather View
- Date selector for viewing past weather data
- Disaster history database with:
  - Cyclone records (Amphan, Fani, Vardah, Hudhud, etc.)
  - Flood events (Kerala Floods 2018)
  - Impact assessments and casualty data
  - Severity classifications
- Interactive timeline navigation

### 🔮 Weather Forecasting
- 7-day forecast with:
  - Daily temperature ranges
  - Precipitation probability
  - Wind conditions
  - Weather icons and descriptions
- Hourly breakdown available

### 📍 Location Search
- Search coastal cities and regions
- Autocomplete suggestions
- Coordinates display
- Quick location switching

### 🧭 Safety Precautions
- Context-aware safety recommendations based on:
  - Current risk level
  - Weather conditions
  - Active cyclones
- Specific guidance for fishermen:
  - Sailing advisories
  - Equipment securing instructions
  - Coast guard contact reminders
  - Evacuation procedures

### ⚠️ Disaster Alerts
- Automatic alert generation for:
  - Active cyclones
  - High wind conditions
  - Heavy rainfall
  - Storm surge risks
- Integration with existing alert system
- Priority-based notifications (Critical, High, Medium, Low)

## Data Sources

### Primary Sources
1. **OpenWeather API** (configurable)
   - Current weather data
   - 5-day/3-hour forecast
   - Geocoding for location search

2. **Indian Meteorological Department (IMD)** (planned)
   - Official cyclone warnings
   - Regional weather bulletins
   - Satellite imagery

### Demo Mode
When no API key is configured, the system runs in demo mode with:
- Simulated weather data
- Sample cyclone (Cyclone Amphan)
- Historical disaster database
- Realistic data patterns

## Configuration

### Setting Up OpenWeather API

1. Get a free API key from [OpenWeather](https://openweathermap.org/api)

2. Configure in the application:
   - Navigate to Weather & Disaster page
   - Click Settings icon
   - Enter your API key
   - Save configuration

3. Or set in localStorage:
```javascript
localStorage.setItem('openWeatherKey', 'your_api_key_here');
```

### Update Intervals
- Weather data: 10 minutes (configurable)
- Cyclone tracking: Real-time
- Forecast: 6 hours

## Architecture

```
modules/weather/
├── weatherService.js    # API integration & data management
├── weatherMap.js        # Map rendering & visualization
├── weatherUI.js         # UI components & dashboard
├── weather.css          # Weather-specific styles
└── README.md           # This file
```

### weatherService.js
- Handles all API calls (OpenWeather, IMD)
- Data caching and management
- Risk level calculation
- Safety precaution generation
- Demo data generators

### weatherMap.js
- Leaflet map integration
- Cyclone path rendering
- Rainfall heatmap visualization
- Wind pattern display
- Warning zone overlays
- Historical disaster markers

### weatherUI.js
- Dashboard rendering
- Location search interface
- Forecast display
- Date selector
- Safety precautions list
- Disaster timeline

## Usage

### Basic Usage

1. **View Current Weather**
   - Navigate to "Weather & Disaster" from sidebar
   - Default location: India (15°N, 78°E)
   - View current conditions and risk level

2. **Search Location**
   - Use search bar at top
   - Type coastal city name
   - Select from results
   - Weather updates automatically

3. **View Forecast**
   - Scroll to 7-day forecast card
   - Hover over days for details
   - Check precipitation probability

4. **Track Cyclones**
   - Active cyclones shown in alert card
   - Click "View on Map" to see location
   - View historical and forecast paths
   - Check affected regions

5. **View Historical Data**
   - Use date selector
   - Navigate through past dates
   - View disaster timeline
   - Click disasters to see on map

6. **Toggle Map Layers**
   - Use checkboxes above weather map
   - Show/hide cyclones, rainfall, wind, historical
   - Customize view as needed

### Advanced Features

#### Risk Assessment
The system calculates risk levels based on:
- Wind speed (>40 km/h = Critical, >25 = High, >15 = Medium)
- Rainfall intensity (>50mm/h = High, >20mm/h = Medium)
- Cyclone proximity
- Combined factors

#### Safety Recommendations
Precautions are tailored to:
- **Fishermen**: Sailing advisories, equipment securing
- **Coastal residents**: Evacuation alerts, shelter information
- **Emergency services**: Coordination guidelines

#### Alert Integration
Weather alerts automatically integrate with the main alert system:
- Appear in Alert Center
- Show in dashboard
- Toast notifications for critical events
- Acknowledgment tracking

## API Reference

### weatherService Methods

```javascript
// Fetch current weather
await weatherService.fetchCurrentWeather(lat, lon)

// Fetch 7-day forecast
await weatherService.fetchForecast(lat, lon)

// Search locations
await weatherService.searchLocation(query)

// Get active cyclones
weatherService.getCycloneData()

// Get disaster history
weatherService.getDisasterHistory()

// Calculate risk level
weatherService.calculateRiskLevel(weather, cyclones)

// Get safety precautions
weatherService.getSafetyPrecautions(riskLevel, weatherType)
```

### weatherMap Methods

```javascript
// Render cyclone on map
weatherMapInstance.renderCyclone(cyclone)

// Render rainfall heatmap
weatherMapInstance.renderRainfallHeatmap(data)

// Render wind patterns
weatherMapInstance.renderWindPatterns(windData)

// Render warning zone
weatherMapInstance.renderWarningZone(zone)

// Render historical disaster
weatherMapInstance.renderHistoricalDisaster(disaster)

// Toggle layer visibility
weatherMapInstance.toggleLayer(layerName, visible)

// Clear all layers
weatherMapInstance.clearAll()
```

### weatherUI Methods

```javascript
// Render main dashboard
weatherUI.renderWeatherDashboard(weather, forecast, cyclones)

// Render location search
weatherUI.renderLocationSearch()

// Render historical view
weatherUI.renderHistoricalView(disasters)

// Render date selector
weatherUI.renderDateSelector()

// Search location
await weatherUI.searchLocation()

// Select location
weatherUI.selectLocation(lat, lon, name)

// Focus on disaster
weatherUI.focusDisaster(lat, lon)
```

## Styling

The weather module uses the same glassmorphism design as the main application:
- Dark theme by default
- Light theme support
- Consistent color scheme
- Responsive layout
- Smooth animations

### Key CSS Classes
- `.weather-kpi-row` - Weather KPI cards
- `.weather-grid` - Main dashboard grid
- `.forecast-day` - Forecast card
- `.cyclone-marker` - Animated cyclone icon
- `.disaster-item` - Historical disaster entry
- `.precaution-item` - Safety recommendation

## Future Enhancements

### Planned Features
1. **IMD Integration**
   - Official cyclone bulletins
   - Satellite imagery overlay
   - Regional weather warnings

2. **Advanced Visualizations**
   - Animated cloud movement
   - Timeline slider for weather playback
   - 3D cyclone visualization

3. **Real-Time Updates**
   - WebSocket integration
   - Push notifications
   - Live cyclone tracking

4. **Enhanced Forecasting**
   - 14-day extended forecast
   - Hourly breakdown
   - Probability maps

5. **Community Features**
   - User-reported conditions
   - Fishermen check-ins
   - Emergency SOS

6. **Offline Support**
   - Cached weather data
   - Offline maps
   - Emergency contacts

## Troubleshooting

### Weather data not loading
- Check API key configuration
- Verify internet connection
- Check browser console for errors
- System falls back to demo mode automatically

### Map not displaying
- Ensure Leaflet is loaded
- Check browser compatibility
- Clear browser cache
- Verify map container exists

### Location search not working
- Check API key
- Verify query format
- Demo locations available without API key

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key configuration
3. Test in demo mode
4. Review this documentation

## License

Part of the Ocean Risk and Vessel Monitoring System (ORVMS)
