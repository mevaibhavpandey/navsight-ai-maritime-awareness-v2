# Ocean Risk and Vessel Monitoring System (ORVMS)

Real-time global vessel monitoring system with AIS integration, WebSocket streaming, weather intelligence, and a modern glassmorphism dashboard.

---

## Architecture

```
navsight-ai/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── .env                 # API keys (never commit this)
│   ├── requirements.txt
│   └── app/
│       ├── config.py        # Environment variable loader
│       ├── models.py        # Unified vessel/alert schema
│       ├── store.py         # In-memory vessel state store
│       ├── ingestion.py     # AIS pipeline (demo + REST + retry)
│       ├── alerts.py        # Modular rule-based alert engine
│       └── api.py           # REST + WebSocket endpoints
├── frontend/
│   ├── index.html           # Single-page app
│   ├── style.css            # Dark glassmorphism theme
│   ├── app.js               # WebSocket client + map + charts
│   └── modules/
│       ├── navalResponse/   # Naval Response Recommendation Engine
│       │   ├── navalResponseEngine.js  # Threat detection & analysis
│       │   ├── interceptionUtils.js    # Distance & time calculations
│       │   ├── actionGenerator.js      # Response recommendations
│       │   ├── navalResponseUI.js      # UI rendering
│       │   ├── navalResponse.css       # Styling
│       │   └── README.md              # Module documentation
│       └── weather/         # Weather & Disaster Intelligence Module
│           ├── weatherService.js  # API integration
│           ├── weatherMap.js      # Map visualization
│           ├── weatherUI.js       # UI components
│           ├── weather.css        # Weather styles
│           └── README.md          # Weather module docs
├── start.sh                 # Linux/Mac launcher
├── start.bat                # Windows launcher
└── README.md
```

---

## Quick Start

### 1. Start the Backend

**Windows:**
```
start.bat
```

**Linux / Mac:**
```bash
chmod +x start.sh && ./start.sh
```

**Manual:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Open the Frontend

Open `frontend/index.html` in your browser.

Login: `DEMO001` / `demo123`

---

## AIS API Integration

Edit `backend/.env`:

```env
# Choose provider: demo | aishub | marinetraffic
AIS_PROVIDER=demo
AIS_API_KEY=your_api_key_here
```

| Provider | Sign Up |
|---|---|
| AISHub | https://www.aishub.net |
| MarineTraffic | https://www.marinetraffic.com/en/ais-api-services |
| VesselFinder | https://www.vesselfinder.com/api |

Without an API key the system runs in **demo mode** with 15 simulated vessels in the Indian Ocean.

---

## Weather API Integration

The weather module supports OpenWeather API for real-time data:

1. Get a free API key from [OpenWeather](https://openweathermap.org/api)

2. Configure in the application:
   - Navigate to Weather & Disaster page
   - Use the location search feature
   - System works in demo mode without API key

3. Or set in browser localStorage:
```javascript
localStorage.setItem('openWeatherKey', 'your_api_key_here');
```

**Demo Mode**: Without an API key, the weather module displays:
- Simulated weather data
- Sample active cyclone (Cyclone Amphan)
- Historical disaster database
- Realistic weather patterns

See `frontend/modules/weather/README.md` for detailed weather module documentation.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vessels/live` | All current vessel states |
| GET | `/vessels/{mmsi}` | Single vessel detail |
| GET | `/alerts` | Recent alerts |
| POST | `/alerts/{id}/ack` | Acknowledge alert |
| GET | `/health` | System health |
| WS | `/ws/vessels` | Live WebSocket stream |

Interactive docs: `http://localhost:8000/docs`

---

## Features

### Maritime Monitoring
- Real-time AIS ingestion with WebSocket streaming + REST polling fallback
- Exponential backoff retry logic and rate-limit handling
- Smooth vessel movement interpolation with `requestAnimationFrame`
- Vessel trails (last N positions)
- Rotating vessel icons based on heading
- Marker clustering for large datasets
- Modular alert engine: speed drops, restricted zones, proximity, high-speed unknowns
- Toast notifications for critical alerts
- Analytics: vessel type breakdown, speed distribution, timeline, flag states

### Naval Response Recommendation Engine 🛡️ NEW
- **Automatic Threat Detection**: Identifies unauthorized, suspicious, and potentially hostile vessels
- **Intelligent Response**: Recommends optimal naval unit deployment
- **Interception Calculations**: Distance, time, and optimal meeting point
- **Priority Assessment**: CRITICAL, HIGH, MEDIUM, LOW threat classification
- **Action Recommendations**: Specific, context-aware instructions for naval commanders
- **Real-Time Updates**: Continuous 5-second analysis cycle
- **Map Visualization**: Threat markers, response paths, interception points
- **Multi-Threat Handling**: Manages multiple simultaneous threats
- **Alert Integration**: Automatic alert generation for threats
- **Decision Support**: Transform monitoring into actionable intelligence

### Weather & Disaster Intelligence ⛈️
- **Real-time weather monitoring** for coastal regions
- **Cyclone tracking** with historical and forecast paths
- **Interactive weather map** with multiple layers:
  - Cyclone positions and danger zones
  - Rainfall heatmaps
  - Wind patterns and direction
  - Historical disaster markers
- **7-day weather forecast** with detailed metrics
- **Location search** for coastal cities and regions
- **Historical disaster database** (Cyclones Amphan, Fani, Vardah, Hudhud, Kerala Floods, etc.)
- **Risk level assessment** (Low, Medium, High, Critical)
- **Safety precautions** tailored for fishermen and coastal populations
- **Date selector** for viewing historical weather data
- **Automatic weather alerts** integrated with main alert system
- **OpenWeather API integration** with demo mode fallback

### User Interface
- Dark/light theme toggle
- Fully responsive layout
- Military command-center style glassmorphism design
- Real-time dashboard with KPIs
- Interactive maps (Maritime + Weather + Naval Response)
- File upload with OCR support
- Analytics and charts

---

## Demo Credentials

```
Officer ID:    DEMO001
Security Code: demo123
```
