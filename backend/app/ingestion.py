"""
Real-time AIS ingestion pipeline.
Primary:  aisstream.io WebSocket (free, real global AIS data)
Fallback: Demo mode with 15 simulated vessels (Indian Ocean)
"""
import asyncio
import json
import logging
import math
import random
from datetime import datetime, timezone
from typing import Optional

import httpx

from app import config
from app.models import Vessel
from app.store import vessel_store
from app.alerts import alert_engine

logger = logging.getLogger(__name__)

# ── Demo vessel seeds ─────────────────────────────────────────────────────────
_DEMO_SEEDS = [
    # All positions verified in open ocean / shipping lanes
    {"mmsi": "419000001", "name": "INS Vikrant",      "lat": 15.5,  "lon": 69.2,  "heading": 45,  "speed": 18, "type": "Naval Vessel",   "flag": "India"},
    {"mmsi": "419000002", "name": "INS Chennai",      "lat": 10.5,  "lon": 83.5,  "heading": 270, "speed": 22, "type": "Naval Vessel",   "flag": "India"},
    {"mmsi": "419000003", "name": "ICGS Samarth",     "lat": 17.2,  "lon": 70.5,  "heading": 180, "speed": 14, "type": "Coast Guard",    "flag": "India"},
    {"mmsi": "636092001", "name": "MV Pacific Star",  "lat": 7.8,   "lon": 74.2,  "heading": 90,  "speed": 12, "type": "Cargo Ship",     "flag": "Liberia"},
    {"mmsi": "477123456", "name": "CSCL Globe",       "lat": 5.5,   "lon": 80.5,  "heading": 315, "speed": 15, "type": "Container Ship", "flag": "China"},
    {"mmsi": "235000001", "name": "HMS Dragon",       "lat": 14.0,  "lon": 62.0,  "heading": 120, "speed": 20, "type": "Naval Vessel",   "flag": "UK"},
    {"mmsi": "338000001", "name": "USS Nimitz",       "lat": 18.5,  "lon": 65.0,  "heading": 200, "speed": 25, "type": "Naval Vessel",   "flag": "USA"},
    {"mmsi": "525000001", "name": "KRI Diponegoro",   "lat": 4.0,   "lon": 97.5,  "heading": 270, "speed": 16, "type": "Naval Vessel",   "flag": "Indonesia"},
    {"mmsi": "548000001", "name": "BRP Gregorio",     "lat": 8.5,   "lon": 120.5, "heading": 45,  "speed": 14, "type": "Naval Vessel",   "flag": "Philippines"},
    {"mmsi": "000000001", "name": "Unknown Dhow",     "lat": 12.5,  "lon": 48.5,  "heading": 310, "speed": 8,  "type": "Fishing Vessel", "flag": "Unknown"},
    {"mmsi": "000000002", "name": "Suspicious Craft", "lat": 14.8,  "lon": 52.0,  "heading": 280, "speed": 35, "type": "Unknown",        "flag": "Unknown"},
    {"mmsi": "419000010", "name": "MV Mumbai Trader", "lat": 20.5,  "lon": 67.8,  "heading": 160, "speed": 10, "type": "Cargo Ship",     "flag": "India"},
    {"mmsi": "419000011", "name": "MT Kochi Tanker",  "lat": 6.5,   "lon": 73.8,  "heading": 350, "speed": 11, "type": "Tanker",         "flag": "India"},
    {"mmsi": "419000012", "name": "MV Andaman Star",  "lat": 9.0,   "lon": 90.5,  "heading": 90,  "speed": 13, "type": "Passenger Ship", "flag": "India"},
    {"mmsi": "636000099", "name": "MV Atlantic Hope", "lat": 3.5,   "lon": 76.0,  "heading": 45,  "speed": 14, "type": "Cargo Ship",     "flag": "Liberia"},
]
_demo_state: dict[str, dict] = {s["mmsi"]: dict(s) for s in _DEMO_SEEDS}


def _simulate_movement(state: dict) -> dict:
    speed_knots = state["speed"]
    heading_rad = math.radians(state["heading"])
    dist_deg = speed_knots * 0.000278 * config.POLL_INTERVAL
    state["lat"] += dist_deg * math.cos(heading_rad)
    state["lon"] += dist_deg * math.sin(heading_rad)
    state["heading"] = (state["heading"] + random.uniform(-3, 3)) % 360
    state["speed"] = max(0, state["speed"] + random.uniform(-0.5, 0.5))
    state["lat"] = max(-10, min(30, state["lat"]))
    state["lon"] = max(45, min(130, state["lon"]))
    return state


def _build_vessel_from_demo(state: dict) -> Vessel:
    return Vessel(
        mmsi=state["mmsi"],
        name=state["name"],
        lat=round(state["lat"], 5),
        lon=round(state["lon"], 5),
        speed=round(state["speed"], 1),
        heading=round(state["heading"], 1),
        course=round(state["heading"], 1),
        vessel_type=state.get("type", "Unknown"),
        flag=state.get("flag", "Unknown"),
        timestamp=datetime.now(timezone.utc),
    )


def _ingest_demo() -> list[Vessel]:
    vessels = []
    for mmsi, state in _demo_state.items():
        _simulate_movement(state)
        vessels.append(_build_vessel_from_demo(state))
    return vessels


# ── AISStream.io WebSocket ingestion ─────────────────────────────────────────

def _parse_aisstream(msg: dict) -> Optional[Vessel]:
    """Parse aisstream.io PositionReport message into Vessel."""
    try:
        meta = msg.get("MetaData", {})
        pos = msg.get("Message", {}).get("PositionReport", {})
        if not pos:
            return None
        mmsi = str(meta.get("MMSI", "")).strip()
        if not mmsi:
            return None
        lat = float(pos.get("Latitude", 0))
        lon = float(pos.get("Longitude", 0))
        if lat == 0 and lon == 0:
            return None
        ts_raw = meta.get("time_utc", datetime.now(timezone.utc).isoformat())
        try:
            ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except Exception:
            ts = datetime.now(timezone.utc)
        return Vessel(
            mmsi=mmsi,
            name=str(meta.get("ShipName", "Unknown")).strip() or "Unknown",
            lat=lat,
            lon=lon,
            speed=float(pos.get("Sog", 0)),       # Speed Over Ground
            heading=float(pos.get("TrueHeading", pos.get("Cog", 0))),
            course=float(pos.get("Cog", 0)),
            vessel_type=_ship_type_label(int(pos.get("ShipType", 0) or 0)),
            flag=_mmsi_to_flag(mmsi),
            timestamp=ts,
        )
    except Exception as exc:
        logger.debug("AISStream parse error: %s | msg=%s", exc, str(msg)[:200])
        return None


def _ship_type_label(code: int) -> str:
    """Map AIS numeric ship type to human-readable label."""
    if 20 <= code <= 29: return "Wing In Ground"
    if 30 <= code <= 39: return "Fishing Vessel"
    if 40 <= code <= 49: return "High Speed Craft"
    if 50 <= code <= 59: return "Special Craft"
    if 60 <= code <= 69: return "Passenger Ship"
    if 70 <= code <= 79: return "Cargo Ship"
    if 80 <= code <= 89: return "Tanker"
    if 35 == code: return "Naval Vessel"
    return "Unknown"


def _mmsi_to_flag(mmsi: str) -> str:
    """Rough flag inference from MMSI MID prefix."""
    mid_map = {
        "419": "India", "338": "USA", "235": "UK", "477": "China",
        "525": "Indonesia", "548": "Philippines", "431": "Japan",
        "228": "France", "211": "Germany", "636": "Liberia",
        "255": "Portugal", "351": "Panama", "370": "Panama",
        "412": "China", "416": "Taiwan", "440": "South Korea",
        "503": "Australia", "512": "New Zealand",
    }
    for mid, flag in mid_map.items():
        if mmsi.startswith(mid):
            return flag
    return "Unknown"


async def _aisstream_loop():
    """Connect to aisstream.io — Indian Ocean + nearby seas only."""
    import websockets
    url = "wss://stream.aisstream.io/v0/stream"
    retry_delay = 5

    # Global bounding box — all vessels worldwide
    BOUNDING_BOX = [[-90.0, -180.0], [90.0, 180.0]]

    while True:
        try:
            logger.info("Connecting to aisstream.io (Indian Ocean region)...")
            ws = await websockets.connect(url, ping_interval=20, ping_timeout=60, open_timeout=30)
            try:
                sub = {
                    "Apikey": config.AIS_API_KEY,
                    "BoundingBoxes": [BOUNDING_BOX],
                    "FilterMessageTypes": ["PositionReport"],
                }
                await ws.send(json.dumps(sub))
                logger.info("Subscribed — Indian Ocean AIS feed active")
                retry_delay = 5
                _msg_count = 0

                while True:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=60)
                        msg = json.loads(raw)
                        vessel = _parse_aisstream(msg)
                        if vessel:
                            if vessel_store.upsert(vessel):
                                alert_engine.evaluate(vessel)
                            _msg_count += 1
                            if _msg_count % 500 == 0:
                                logger.info("AIS feed: %d vessels in store", vessel_store.count())
                    except asyncio.TimeoutError:
                        await ws.ping()
                    except Exception as exc:
                        logger.debug("Message error: %s", exc)
                        break
            finally:
                await ws.close()

        except Exception as exc:
            logger.warning("AISStream error: %s — retry in %ds", exc, retry_delay)

        await asyncio.sleep(retry_delay)
        retry_delay = min(retry_delay * 2, 60)


# ── Demo fallback loop ────────────────────────────────────────────────────────

async def _demo_loop():
    """Continuously update demo vessels."""
    logger.info("Running in DEMO mode — simulating %d vessels", len(_DEMO_SEEDS))
    # Seed store immediately on startup
    for v in _ingest_demo():
        vessel_store.upsert(v)
    while True:
        await asyncio.sleep(config.POLL_INTERVAL)
        for v in _ingest_demo():
            if vessel_store.upsert(v):
                alert_engine.evaluate(v)
        logger.debug("Demo tick: %d vessels in store", vessel_store.count())


# ── Main entry point ──────────────────────────────────────────────────────────

async def ingestion_loop():
    """
    Start the appropriate ingestion pipeline:
    - Real AIS via aisstream.io if API key is set
    - Demo simulation otherwise
    """
    is_demo = (
        not config.AIS_API_KEY
        or config.AIS_API_KEY.strip() == "your_api_key_here"
        or config.AIS_PROVIDER == "demo"
    )

    if is_demo:
        await _demo_loop()
    else:
        # Run real AIS stream; if it fails permanently, fall back to demo
        try:
            await _aisstream_loop()
        except Exception as exc:
            logger.error("AISStream fatal error: %s — falling back to demo", exc)
            await _demo_loop()
