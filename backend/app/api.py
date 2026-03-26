"""
FastAPI routes — REST + WebSocket
"""
import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

from app.store import vessel_store
from app.alerts import alert_engine
from app.models import Vessel
from app import config

logger = logging.getLogger(__name__)
router = APIRouter()


# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self._clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._clients.append(ws)
        logger.info("WS client connected. Total: %d", len(self._clients))

    def disconnect(self, ws: WebSocket):
        if ws in self._clients:
            self._clients.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self._clients))

    async def broadcast(self, data: dict):
        dead = []
        for ws in self._clients:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self._clients:
                self._clients.remove(ws)


manager = ConnectionManager()


async def broadcast_loop():
    """Push vessel updates to all WebSocket clients every POLL_INTERVAL seconds."""
    last_count = 0
    while True:
        await asyncio.sleep(config.POLL_INTERVAL)
        if not manager._clients:
            continue
        current_count = vessel_store.count()
        vessels = [v.model_dump(mode="json") for v in vessel_store.all()]
        alerts = [a.model_dump(mode="json") for a in alert_engine.get_alerts(20)]
        msg_type = "snapshot" if last_count == 0 and current_count > 0 else "update"
        last_count = current_count
        await manager.broadcast({
            "type": msg_type,
            "vessels": vessels,
            "alerts": alerts,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total": current_count,
        })


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "provider": config.AIS_PROVIDER,
        "vessels_tracked": vessel_store.count(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/vessels/live")
async def get_live_vessels():
    vessels = [v.model_dump(mode="json") for v in vessel_store.all()]
    return JSONResponse({
        "vessels": vessels,
        "total": len(vessels),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@router.get("/vessels/{mmsi}")
async def get_vessel(mmsi: str):
    vessel = vessel_store.get(mmsi)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel.model_dump(mode="json")


@router.delete("/vessels/{mmsi}")
async def delete_vessel(mmsi: str):
    vessel = vessel_store.get(mmsi)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    vessel_store.delete(mmsi)
    return {"deleted": True, "mmsi": mmsi}


@router.post("/vessels/manual")
async def add_manual_vessel(vessel: Vessel):
    vessel_store.upsert(vessel)
    return {"added": True, "mmsi": vessel.mmsi}


@router.get("/alerts")
async def get_alerts(limit: int = 100):
    alerts = [a.model_dump(mode="json") for a in alert_engine.get_alerts(limit)]
    return JSONResponse({"alerts": alerts, "total": len(alerts)})


@router.post("/alerts/{alert_id}/ack")
async def acknowledge_alert(alert_id: str):
    ok = alert_engine.acknowledge(alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"acknowledged": True}


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/vessels")
async def websocket_vessels(ws: WebSocket):
    await manager.connect(ws)
    vessels = [v.model_dump(mode="json") for v in vessel_store.all()]
    alerts = [a.model_dump(mode="json") for a in alert_engine.get_alerts(20)]
    await ws.send_json({
        "type": "snapshot",
        "vessels": vessels,
        "alerts": alerts,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(vessels),
    })
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
