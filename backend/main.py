"""
ORVMS — Backend Entry Point
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
Then open: http://localhost:8000
"""
import asyncio
import logging
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app import config
from app.api import router, broadcast_loop
from app.ingestion import ingestion_loop

async def _early_snapshot():
    """Send first snapshot 1s after startup so frontend gets data fast."""
    from app.api import manager
    from app.store import vessel_store
    from app.alerts import alert_engine
    from datetime import datetime, timezone
    await asyncio.sleep(1)
    for _ in range(10):  # retry up to 10s until vessels arrive
        if vessel_store.count() > 0:
            vessels = [v.model_dump(mode="json") for v in vessel_store.all()]
            alerts = [a.model_dump(mode="json") for a in alert_engine.get_alerts(20)]
            await manager.broadcast({
                "type": "snapshot",
                "vessels": vessels,
                "alerts": alerts,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total": len(vessels),
            })
            break
        await asyncio.sleep(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NavSight AI Maritime API",
    description="Real-time AIS vessel monitoring backend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve frontend at root — fixes file:// WebSocket block issue
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, 'index.html'))

    @app.get("/{filename}")
    async def serve_file(filename: str):
        path = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(path):
            return FileResponse(path)
        return FileResponse(os.path.join(FRONTEND_DIR, 'index.html'))


@app.on_event("startup")
async def startup():
    logger.info("NavSight AI backend starting up...")
    logger.info("AIS Provider: %s", config.AIS_PROVIDER)
    if not config.AIS_API_KEY or config.AIS_API_KEY == "your_api_key_here":
        logger.warning("No AIS API key set — running in DEMO mode with simulated vessels")
    # Start background tasks
    asyncio.create_task(ingestion_loop())
    asyncio.create_task(broadcast_loop())
    asyncio.create_task(_early_snapshot())
    logger.info("Background tasks started. Server ready.")


@app.on_event("shutdown")
async def shutdown():
    logger.info("NavSight AI backend shutting down.")


if __name__ == "__main__":
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
