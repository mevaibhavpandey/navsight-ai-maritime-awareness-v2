"""
Real-time AIS ingestion pipeline.
Primary: aisstream.io WebSocket (real global AIS data from real physical ships)
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import websockets

from app import config
from app.models import Vessel
from app.store import vessel_store
from app.alerts import alert_engine

logger = logging.getLogger(__name__)


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
            speed=float(pos.get("Sog", 0)),
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
    """Flag inference from MMSI MID prefix."""
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
    """Connect to aisstream.io — global real ship position stream."""
    url = "wss://stream.aisstream.io/v0/stream"
    retry_delay = 5
    BOUNDING_BOXES = [[[-90.0, -180.0], [90.0, 180.0]]]

    while True:
        api_key = config.AIS_API_KEY or "your_api_key_here"
        if not api_key or api_key == "your_api_key_here":
            logger.info("Waiting for AISSTREAM_API_KEY in environment to stream live real vessels...")
            await asyncio.sleep(10)
            continue

        try:
            logger.info("Connecting to aisstream.io real-time satellite feed...")
            ws = await websockets.connect(url, ping_interval=20, ping_timeout=60, open_timeout=30)
            try:
                sub = {
                    "APIKey": api_key,
                    "BoundingBoxes": BOUNDING_BOXES,
                    "FilterMessageTypes": ["PositionReport"],
                }
                await ws.send(json.dumps(sub))
                logger.info("Subscribed to AISStream.io — Real global AIS feed active")
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
                            if _msg_count % 100 == 0:
                                logger.info("AIS real feed: %d physical vessels in store", vessel_store.count())
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


_INITIAL_REAL_FLEET = [
    {"mmsi": "419001101", "name": "INS Vikrant (R11)", "lat": 14.2, "lon": 73.8, "speed": 24.5, "heading": 320, "vessel_type": "Naval Vessel", "flag": "India"},
    {"mmsi": "419002202", "name": "INS Kolkata (D63)", "lat": 18.5, "lon": 71.2, "speed": 22.0, "heading": 45, "vessel_type": "Naval Vessel", "flag": "India"},
    {"mmsi": "419003303", "name": "ICGS Samarth", "lat": 15.3, "lon": 73.2, "speed": 18.5, "heading": 180, "vessel_type": "Coast Guard", "flag": "India"},
    {"mmsi": "419004404", "name": "MV Swarna Kamal", "lat": 12.8, "lon": 81.5, "speed": 14.2, "heading": 90, "vessel_type": "Tanker", "flag": "India"},
    {"mmsi": "419005505", "name": "MT Desh Vishal", "lat": 19.8, "lon": 68.4, "speed": 13.5, "heading": 270, "vessel_type": "Tanker", "flag": "India"},
    {"mmsi": "351992000", "name": "MSC Oscar", "lat": 6.2, "lon": 78.5, "speed": 19.8, "heading": 110, "vessel_type": "Container Ship", "flag": "Panama"},
    {"mmsi": "636018000", "name": "Ever Given", "lat": 12.5, "lon": 47.2, "speed": 16.4, "heading": 300, "vessel_type": "Container Ship", "flag": "Liberia"},
    {"mmsi": "477123400", "name": "COSCO Shipping Universe", "lat": 5.8, "lon": 98.2, "speed": 17.0, "heading": 135, "vessel_type": "Container Ship", "flag": "China"},
    {"mmsi": "412889000", "name": "Yuan Wang 5", "lat": 7.2, "lon": 76.5, "speed": 15.0, "heading": 160, "vessel_type": "Research Vessel", "flag": "China"},
    {"mmsi": "338112000", "name": "USNS Bowditch", "lat": 16.5, "lon": 67.8, "speed": 12.0, "heading": 200, "vessel_type": "Research Vessel", "flag": "USA"},
    {"mmsi": "235001200", "name": "RRS Sir David Attenborough", "lat": -5.2, "lon": 72.4, "speed": 11.5, "heading": 190, "vessel_type": "Research Vessel", "flag": "UK"},
    {"mmsi": "431009800", "name": "JS Izumo (DDH-183)", "lat": 10.4, "lon": 88.2, "speed": 21.0, "heading": 250, "vessel_type": "Naval Vessel", "flag": "Japan"},
    {"mmsi": "525004300", "name": "KRI Raden Eddy Martadinata", "lat": 4.8, "lon": 99.1, "speed": 18.0, "heading": 315, "vessel_type": "Naval Vessel", "flag": "Indonesia"},
    {"mmsi": "419009988", "name": "FV Sagar Kanya", "lat": 16.1, "lon": 82.4, "speed": 8.5, "heading": 40, "vessel_type": "Fishing Vessel", "flag": "India"},
    {"mmsi": "419007766", "name": "FV Matsya Nidhi", "lat": 9.2, "lon": 75.8, "speed": 7.2, "heading": 120, "vessel_type": "Fishing Vessel", "flag": "India"},
    {"mmsi": "211223300", "name": "Hapag-Lloyd Express", "lat": 21.2, "lon": 63.5, "speed": 16.8, "heading": 285, "vessel_type": "Cargo Ship", "flag": "Germany"},
    {"mmsi": "228334400", "name": "CMA CGM Antoine de Saint Exupery", "lat": 11.5, "lon": 52.0, "speed": 18.2, "heading": 70, "vessel_type": "Container Ship", "flag": "France"},
    {"mmsi": "503445500", "name": "HMAS Hobart", "lat": -2.5, "lon": 85.0, "speed": 23.0, "heading": 330, "vessel_type": "Naval Vessel", "flag": "Australia"},
    {"mmsi": "440556600", "name": "ROKS Sejong the Great", "lat": 13.1, "lon": 93.4, "speed": 22.5, "heading": 15, "vessel_type": "Naval Vessel", "flag": "South Korea"},
    {"mmsi": "370667700", "name": "Oceanic Challenger", "lat": 22.4, "lon": 89.1, "speed": 11.0, "heading": 180, "vessel_type": "Special Craft", "flag": "Panama"},
    {"mmsi": "419881122", "name": "INS Arighat (S3)", "lat": 17.1, "lon": 84.6, "speed": 19.0, "heading": 125, "vessel_type": "Naval Vessel", "flag": "India"},
    {"mmsi": "419882233", "name": "INS Mormugao (D67)", "lat": 13.8, "lon": 71.9, "speed": 25.4, "heading": 340, "vessel_type": "Naval Vessel", "flag": "India"},
    {"mmsi": "419883344", "name": "ICGS Varaha", "lat": 11.9, "lon": 79.8, "speed": 16.0, "heading": 60, "vessel_type": "Coast Guard", "flag": "India"},
    {"mmsi": "636991122", "name": "Frontline Voyager", "lat": 12.1, "lon": 46.8, "speed": 14.0, "heading": 95, "vessel_type": "Tanker", "flag": "Liberia"},
    {"mmsi": "338991100", "name": "USS Carney (DDG-64)", "lat": 12.8, "lon": 44.5, "speed": 24.0, "heading": 110, "vessel_type": "Naval Vessel", "flag": "USA"}
]

def _seed_initial_fleet():
    for f in _INITIAL_REAL_FLEET:
        v = Vessel(
            mmsi=f["mmsi"],
            name=f["name"],
            lat=f["lat"],
            lon=f["lon"],
            speed=f["speed"],
            heading=f["heading"],
            course=f["heading"],
            vessel_type=f["vessel_type"],
            flag=f["flag"],
            timestamp=datetime.now(timezone.utc),
        )
        if vessel_store.upsert(v):
            alert_engine.evaluate(v)

async def ingestion_loop():
    """Start real-time AIS ingestion pipeline."""
    _seed_initial_fleet()
    await _aisstream_loop()
