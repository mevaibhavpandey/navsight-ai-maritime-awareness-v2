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


async def ingestion_loop():
    """Start real-time AIS ingestion pipeline — ONLY 100% LIVE DATA."""
    await _aisstream_loop()
