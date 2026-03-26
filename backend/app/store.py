"""
In-memory vessel state store.
Handles deduplication, out-of-order timestamps, and trail management.
"""
import logging
from datetime import datetime
from typing import Optional
from app.models import Vessel

logger = logging.getLogger(__name__)

TRAIL_MAX_LENGTH = 20  # keep last N positions per vessel


from app import config

class VesselStore:
    def __init__(self, max_vessels: int = None):
        self._vessels: dict[str, Vessel] = {}
        self._max = max_vessels or config.MAX_VESSELS

    def upsert(self, vessel: Vessel) -> bool:
        """
        Insert or update a vessel. Returns True if state changed.
        Handles:
          - Duplicate updates (same timestamp → skip)
          - Out-of-order timestamps (older data → skip)
          - Missing/null values (keep existing)
        """
        mmsi = vessel.mmsi
        existing = self._vessels.get(mmsi)

        if existing:
            # Skip if same or older timestamp
            if vessel.timestamp <= existing.timestamp:
                return False
            # Preserve trail
            trail = existing.trail.copy()
            trail.append([existing.lat, existing.lon])
            if len(trail) > TRAIL_MAX_LENGTH:
                trail = trail[-TRAIL_MAX_LENGTH:]
            vessel.trail = trail
            # Fill nulls from existing
            vessel.name = vessel.name or existing.name
            vessel.vessel_type = vessel.vessel_type or existing.vessel_type
            vessel.flag = vessel.flag or existing.flag
            vessel.imo = vessel.imo or existing.imo
        else:
            if len(self._vessels) >= self._max:
                logger.warning("Vessel store at capacity (%d), dropping oldest", self._max)
                oldest_mmsi = next(iter(self._vessels))
                del self._vessels[oldest_mmsi]

        self._vessels[mmsi] = vessel
        return True

    def get(self, mmsi: str) -> Optional[Vessel]:
        return self._vessels.get(mmsi)

    def all(self) -> list[Vessel]:
        return list(self._vessels.values())

    def delete(self, mmsi: str) -> bool:
        if mmsi in self._vessels:
            del self._vessels[mmsi]
            return True
        return False

    def count(self) -> int:
        return len(self._vessels)

    def clear(self):
        self._vessels.clear()


# Singleton store instance
vessel_store = VesselStore()
