# Ocean Risk and Vessel Monitoring System (ORVMS)

Real-time global vessel monitoring system with AIS integration, WebSocket streaming, and a modern glassmorphism dashboard.

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
│   └── app.js               # WebSocket client + map + charts
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

- Real-time AIS ingestion with WebSocket streaming + REST polling fallback
- Exponential backoff retry logic and rate-limit handling
- Smooth vessel movement interpolation with `requestAnimationFrame`
- Vessel trails (last N positions)
- Rotating vessel icons based on heading
- Marker clustering for large datasets
- Modular alert engine: speed drops, restricted zones, proximity, high-speed unknowns
- Toast notifications for critical alerts
- Analytics: vessel type breakdown, speed distribution, timeline, flag states
- Dark/light theme toggle
- Fully responsive layout

---

## Demo Credentials

```
Officer ID:    DEMO001
Security Code: demo123
```
