"""
Alert engine — Indian Maritime Domain Awareness.

Three rules:
  1. High speed (>=25 kn) OUTSIDE Indian maritime boundary  → low
  2. Unfriendly vessel inside/entering Indian boundary       → high
  3. Unfriendly vessel inside/entering at high speed         → critical

Uses ray-casting point-in-polygon against the actual EEZ boundary,
not a simple bounding box.
"""
import uuid, logging
from datetime import datetime, timezone
from typing import Optional
from app.models import Vessel, Alert

logger = logging.getLogger(__name__)

_alerts: list[Alert] = []
_MAX_ALERTS = 200
_prev_states: dict[str, Vessel] = {}
_cooldowns: dict[str, datetime] = {}
COOLDOWN_SECS = 300  # 5 minutes

HIGH_SPEED_KN = 25.0

FRIENDLY_FLAGS = {
    "India", "USA", "UK", "France", "Australia", "Japan", "South Korea",
    "New Zealand", "Canada", "Germany", "Italy", "Norway", "Netherlands",
    "Denmark", "Sweden", "Finland", "Portugal", "Spain", "Greece",
}

# India 200-NM EEZ — main polygon (Arabian Sea + Bay of Bengal)
INDIA_BOUNDARY_MAIN = [
    (23.5, 62.0), (23.5, 68.0), (23.5, 72.0), (23.0, 80.0), (22.5, 87.0), (22.0, 89.5),
    (21.5, 89.5),
    (20.0, 89.0), (18.0, 88.5), (16.0, 88.0), (14.0, 87.5), (12.5, 87.0),
    (11.0, 86.5), (10.0, 85.5), (9.0, 84.0),
    (8.0, 82.5), (7.0, 81.0), (6.0, 80.0),
    (5.0, 78.5), (3.5, 77.0), (2.5, 75.5), (2.0, 74.0),
    (2.5, 72.5), (3.5, 71.0),
    (5.0, 69.5), (6.5, 68.0), (7.5, 67.5),
    (9.0, 67.0), (11.0, 66.5), (13.0, 66.0), (15.0, 65.5),
    (17.0, 65.0), (19.0, 64.0), (21.0, 63.0), (22.5, 62.5),
    (23.5, 62.0),
]

# Andaman & Nicobar Islands EEZ
INDIA_BOUNDARY_ANDAMAN = [
    (14.0, 91.5), (14.0, 96.5),
    (13.0, 97.0), (12.0, 97.0), (11.0, 96.5),
    (10.0, 96.0), (9.0, 95.5),  (8.0, 95.0),
    (7.0, 94.5),  (6.5, 93.5),  (6.0, 92.5),
    (6.5, 91.5),  (7.5, 91.0),  (9.0, 91.0),
    (11.0, 91.0), (13.0, 91.0),
    (14.0, 91.5),
]


def _point_in_poly(lat: float, lon: float, poly: list) -> bool:
    """Ray-casting point-in-polygon. poly is list of (lat, lon) tuples."""
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > lon) != (yj > lon)) and \
           (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def _in_eez(v: Vessel) -> bool:
    return (_point_in_poly(v.lat, v.lon, INDIA_BOUNDARY_MAIN) or
            _point_in_poly(v.lat, v.lon, INDIA_BOUNDARY_ANDAMAN))


def _is_unfriendly(v: Vessel) -> bool:
    flag = (v.flag or "").strip()
    if not flag or flag == "Unknown":
        return False
    return flag not in FRIENDLY_FLAGS


def _cooldown_ok(mmsi: str, rule: str) -> bool:
    key = f"{mmsi}:{rule}"
    last = _cooldowns.get(key)
    if last and (datetime.now(timezone.utc) - last).total_seconds() < COOLDOWN_SECS:
        return False
    _cooldowns[key] = datetime.now(timezone.utc)
    return True


def _add_alert(alert: Alert):
    for existing in _alerts[:20]:
        if existing.vessel_mmsi == alert.vessel_mmsi and existing.alert_type == alert.alert_type:
            age = (datetime.now(timezone.utc) - existing.timestamp).total_seconds()
            if age < COOLDOWN_SECS:
                return
    _alerts.insert(0, alert)
    if len(_alerts) > _MAX_ALERTS:
        _alerts.pop()
    logger.info("ALERT [%s] %s — %s", alert.priority.upper(), alert.alert_type, alert.message)


def rule_high_speed_outside(vessel: Vessel, prev: Optional[Vessel]):
    """High speed vessel outside Indian maritime boundary → low."""
    if _in_eez(vessel):
        return
    if vessel.speed < HIGH_SPEED_KN:
        return
    if not _cooldown_ok(vessel.mmsi, "highspeed_outside"):
        return
    _add_alert(Alert(
        id=str(uuid.uuid4()),
        vessel_mmsi=vessel.mmsi,
        vessel_name=vessel.name,
        alert_type="high_speed_outside",
        message=f"{vessel.name or vessel.mmsi} at {vessel.speed:.1f} kn outside Indian maritime boundary",
        priority="low",
        lat=vessel.lat, lon=vessel.lon,
        timestamp=datetime.now(timezone.utc),
    ))


def rule_unfriendly_entry(vessel: Vessel, prev: Optional[Vessel]):
    """Unfriendly vessel inside/entering Indian boundary — high or critical."""
    in_now = _in_eez(vessel)
    if not in_now:
        return
    # Fire on entry (was outside) OR first sighting inside (no prev)
    was_inside = _in_eez(prev) if prev else False
    if was_inside:
        return
    if not _is_unfriendly(vessel):
        return
    if not _cooldown_ok(vessel.mmsi, "unfriendly_entry"):
        return

    if vessel.speed >= HIGH_SPEED_KN:
        priority = "critical"
        alert_type = "unfriendly_entry_highspeed"
        msg = (f"{vessel.name or vessel.mmsi} ({vessel.flag}) entering Indian boundary"
               f" at {vessel.speed:.1f} kn")
    else:
        priority = "high"
        alert_type = "unfriendly_entry"
        msg = f"{vessel.name or vessel.mmsi} ({vessel.flag}) entering Indian maritime boundary"

    _add_alert(Alert(
        id=str(uuid.uuid4()),
        vessel_mmsi=vessel.mmsi,
        vessel_name=vessel.name,
        alert_type=alert_type,
        message=msg,
        priority=priority,
        lat=vessel.lat, lon=vessel.lon,
        timestamp=datetime.now(timezone.utc),
    ))


RULES = [rule_high_speed_outside, rule_unfriendly_entry]


class AlertEngine:
    def evaluate(self, vessel: Vessel):
        prev = _prev_states.get(vessel.mmsi)
        for rule in RULES:
            try:
                rule(vessel, prev)
            except Exception as exc:
                logger.debug("Rule %s error: %s", rule.__name__, exc)
        _prev_states[vessel.mmsi] = vessel

    def get_alerts(self, limit: int = 100) -> list[Alert]:
        return _alerts[:limit]

    def acknowledge(self, alert_id: str) -> bool:
        for a in _alerts:
            if a.id == alert_id:
                a.acknowledged = True
                return True
        return False


alert_engine = AlertEngine()
