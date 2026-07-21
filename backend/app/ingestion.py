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
# ── 1,500+ Marine Vessel Fleet Generator ─────────────────────────────────────
def _generate_realistic_fleet(count: int = 1500) -> list[dict]:
    types = ['Cargo Ship', 'Container Ship', 'Tanker', 'Fishing Vessel', 'Naval Vessel', 'Coast Guard', 'High Speed Craft', 'Research Vessel', 'Passenger Ship', 'Special Craft']
    flags = ['India', 'Panama', 'Liberia', 'China', 'USA', 'UK', 'Japan', 'Singapore', 'Marshall Islands', 'Germany', 'France', 'Australia', 'South Korea']
    prefixes = ['MV', 'MT', 'INS', 'ICGS', 'COSCO', 'Ever', 'Hai Yang', 'FV Matsya', 'USNS', 'HMAS', 'ROKS', 'MSC', 'CMA CGM', 'Frontline']

    fleet = []
    for i in range(count):
        mmsi = str(419000000 + i)
        v_type = types[i % len(types)]
        flag = flags[i % len(flags)]
        prefix = prefixes[i % len(prefixes)]
        name = f"{prefix} {v_type.split()[0]} {1000 + i}"

        lane = random.random()
        if lane < 0.35:
            lat = random.uniform(6.0, 22.0)
            lon = random.uniform(60.0, 72.5)  # Arabian Sea
        elif lane < 0.70:
            lat = random.uniform(5.0, 21.0)
            lon = random.uniform(82.0, 93.0)  # Bay of Bengal
        elif lane < 0.85:
            lat = random.uniform(-10.0, 5.0)
            lon = random.uniform(55.0, 95.0)  # Indian Ocean Deep Sea
        else:
            lat = random.uniform(1.0, 15.0)
            lon = random.uniform(96.0, 115.0) # Malacca / South China Sea

        # Land clamping
        if 8.8 < lat < 28.0 and 73.8 < lon < 87.5:
            lon = 71.8 if lon < 80.0 else 89.2

        fleet.append({
            "mmsi": mmsi,
            "name": name,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "heading": random.randint(0, 359),
            "speed": round(random.uniform(6.0, 24.0), 1),
            "type": v_type,
            "flag": flag,
        })
    return fleet

_demo_fleet = _generate_realistic_fleet(1500)
_demo_state: dict[str, dict] = {s["mmsi"]: dict(s) for s in _demo_fleet}


def _simulate_movement(state: dict) -> dict:
    speed_knots = state["speed"]
    heading_rad = math.radians(state["heading"])
    dist_deg = speed_knots * 0.000278 * config.POLL_INTERVAL
    new_lat = state["lat"] + dist_deg * math.cos(heading_rad)
    new_lon = state["lon"] + dist_deg * math.sin(heading_rad)
    
    # Land clamping
    if 8.8 < new_lat < 28.0 and 73.8 < new_lon < 87.5:
        new_lon = 71.8 if new_lon < 80.0 else 89.2

    state["lat"] = max(-15.0, min(30.0, new_lat))
    state["lon"] = max(40.0, min(120.0, new_lon))
    state["heading"] = (state["heading"] + random.uniform(-2, 2)) % 360
    state["speed"] = max(5.0, min(30.0, state["speed"] + random.uniform(-0.3, 0.3)))
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

    BOUNDING_BOX = [[-90.0, -180.0], [90.0, 180.0]]

    while True:
        try:
            logger.info("Connecting to aisstream.io...")
            ws = await websockets.connect(url, ping_interval=20, ping_timeout=60, open_timeout=30)
            try:
                sub = {
                    "Apikey": config.AIS_API_KEY,
                    "BoundingBoxes": [BOUNDING_BOX],
                    "FilterMessageTypes": ["PositionReport"],
                }
                await ws.send(json.dumps(sub))
                logger.info("Subscribed — AIS feed active")
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
    """Continuously update 1,500+ vessels."""
    logger.info("Running in DEMO mode — simulating %d vessels", len(_demo_fleet))
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
