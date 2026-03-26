"""
Alert engine — focused on Indian Maritime Domain Awareness.
Rules fire only for vessels in/near Indian waters to avoid noise.
"""
import uuid, logging, math
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.models import Vessel, Alert

logger = logging.getLogger(__name__)

_alerts: list[Alert] = []
_MAX_ALERTS = 200
_prev_states: dict[str, Vessel] = {}

# Cooldown: don't re-fire same rule for same vessel within N seconds
_cooldowns: dict[str, datetime] = {}   # key = f"{mmsi}:{rule}"
COOLDOWN_SECS = 120

# ── Indian Maritime Zone (200-NM EEZ bounding box) ───────────────────────────
# Covers Arabian Sea, Bay of Bengal, Lakshadweep, Andaman & Nicobar
INDIA_EEZ = (0.0, 25.0, 60.0, 100.0)   # lat_min, lat_max, lon_min, lon_max

# ── Restricted / Alert Zones ──────────────────────────────────────────────────
RESTRICTED_ZONES = [
    # (lat_min, lat_max, lon_min, lon_max, name, priority)
    (10.0, 15.0, 43.0, 53.0,  "Gulf of Aden",              "critical"),
    (0.0,   5.0, 65.0, 70.0,  "Arabian Sea Piracy Zone",   "critical"),
    (0.0,   5.0, 97.0, 102.0, "Malacca Strait",            "high"),
    (22.0, 24.0, 68.0, 70.0,  "Gujarat Restricted Waters", "high"),
    (8.0,  10.0, 76.5, 78.0,  "Palk Strait",               "medium"),
    (10.5, 12.0, 79.5, 81.0,  "Palk Bay",                  "medium"),
]

# Indian 200-NM boundary polygon (simplified, clockwise)
INDIA_BOUNDARY_POLY = [
    (25.0, 64.5), (15.0, 64.5), (5.0, 69.5), (4.0, 76.0),
    (4.0, 84.0),  (6.0, 87.5),  (15.0, 93.0),(21.5, 90.0),
    (25.0, 90.0), (25.0, 64.5),
]


def _in_india_eez(v: Vessel) -> bool:
    lat_min, lat_max, lon_min, lon_max = INDIA_EEZ
    return lat_min <= v.lat <= lat_max and lon_min <= v.lon <= lon_max


def _cooldown_ok(mmsi: str, rule: str) -> bool:
    key = f"{mmsi}:{rule}"
    last = _cooldowns.get(key)
    if last and (datetime.now(timezone.utc) - last).total_seconds() < COOLDOWN_SECS:
        return False
    _cooldowns[key] = datetime.now(timezone.utc)
    return True


def _add_alert(alert: Alert):
    # Deduplicate: skip if identical message fired in last 60s
    for existing in _alerts[:10]:
        if existing.vessel_mmsi == alert.vessel_mmsi and existing.alert_type == alert.alert_type:
            age = (datetime.now(timezone.utc) - existing.timestamp).total_seconds()
            if age < 60:
                return
    _alerts.insert(0, alert)
    if len(_alerts) > _MAX_ALERTS:
        _alerts.pop()
    logger.info("ALERT [%s] %s — %s", alert.priority.upper(), alert.alert_type, alert.message)


# ── Rules ─────────────────────────────────────────────────────────────────────

def rule_boundary_violation(vessel: Vessel, prev: Optional[Vessel]):
    """Unknown/foreign vessel entering Indian EEZ without AIS transponder name."""
    if not _in_india_eez(vessel):
        return
    if not _cooldown_ok(vessel.mmsi, "boundary"):
        return
    name = (vessel.name or "").strip()
    is_unknown = name in ("", "Unknown", "0") or vessel.flag == "Unknown"
    if is_unknown and vessel.speed > 2:
        _add_alert(Alert(
            id=str(uuid.uuid4()),
            vessel_mmsi=vessel.mmsi,
            vessel_name=vessel.name,
            alert_type="boundary_violation",
            message=f"Unidentified vessel in Indian EEZ at {vessel.lat:.3f}°N, {vessel.lon:.3f}°E — {vessel.speed:.1f} kn",
            priority="high",
            lat=vessel.lat, lon=vessel.lon,
            timestamp=datetime.now(timezone.utc),
        ))


def rule_restricted_zone(vessel: Vessel, prev: Optional[Vessel]):
    """Vessel entering a restricted/piracy zone."""
    for lat_min, lat_max, lon_min, lon_max, zone_name, priority in RESTRICTED_ZONES:
        if lat_min <= vessel.lat <= lat_max and lon_min <= vessel.lon <= lon_max:
            if prev:
                was_inside = lat_min <= prev.lat <= lat_max and lon_min <= prev.lon <= lon_max
                if was_inside:
                    continue
            if not _cooldown_ok(vessel.mmsi, f"zone_{zone_name}"):
                continue
            _add_alert(Alert(
                id=str(uuid.uuid4()),
                vessel_mmsi=vessel.mmsi,
                vessel_name=vessel.name,
                alert_type="restricted_zone",
                message=f"{vessel.name or vessel.mmsi} entered {zone_name}",
                priority=priority,
                lat=vessel.lat, lon=vessel.lon,
                timestamp=datetime.now(timezone.utc),
            ))


def rule_speed_drop(vessel: Vessel, prev: Optional[Vessel]):
    """Sudden speed drop > 8 kn — possible distress or suspicious stop."""
    if not _in_india_eez(vessel):
        return
    if not prev or prev.speed < 8:
        return
    if vessel.speed < prev.speed - 8 and _cooldown_ok(vessel.mmsi, "speed_drop"):
        _add_alert(Alert(
            id=str(uuid.uuid4()),
            vessel_mmsi=vessel.mmsi,
            vessel_name=vessel.name,
            alert_type="speed_drop",
            message=f"{vessel.name or vessel.mmsi} speed dropped {prev.speed:.1f}→{vessel.speed:.1f} kn near Indian waters",
            priority="high",
            lat=vessel.lat, lon=vessel.lon,
            timestamp=datetime.now(timezone.utc),
        ))


def rule_dark_vessel(vessel: Vessel, prev: Optional[Vessel]):
    """High-speed unknown vessel in Indian waters — possible dark/spoofed AIS."""
    if not _in_india_eez(vessel):
        return
    if vessel.speed < 15:
        return
    t = (vessel.vessel_type or "").lower()
    is_suspicious = t in ("unknown", "") or (vessel.name or "").strip() in ("", "Unknown", "0")
    if is_suspicious and _cooldown_ok(vessel.mmsi, "dark"):
        _add_alert(Alert(
            id=str(uuid.uuid4()),
            vessel_mmsi=vessel.mmsi,
            vessel_name=vessel.name,
            alert_type="dark_vessel",
            message=f"Dark/unidentified vessel at {vessel.speed:.1f} kn — {vessel.lat:.3f}°N {vessel.lon:.3f}°E",
            priority="high",
            lat=vessel.lat, lon=vessel.lon,
            timestamp=datetime.now(timezone.utc),
        ))


def rule_proximity(vessel: Vessel, prev: Optional[Vessel]):
    """Two vessels within ~5 NM of each other in Indian EEZ."""
    if not _in_india_eez(vessel):
        return
    if not _cooldown_ok(vessel.mmsi, "proximity"):
        return
    from app.store import vessel_store
    for other in vessel_store.all():
        if other.mmsi == vessel.mmsi:
            continue
        if not _in_india_eez(other):
            continue
        dlat = vessel.lat - other.lat
        dlon = vessel.lon - other.lon
        dist_nm = math.sqrt(dlat**2 + dlon**2) * 60  # rough NM
        if dist_nm < 0.5:   # ~0.5 NM — very close
            _add_alert(Alert(
                id=str(uuid.uuid4()),
                vessel_mmsi=vessel.mmsi,
                vessel_name=vessel.name,
                alert_type="proximity_risk",
                message=f"Collision risk: {vessel.name or vessel.mmsi} & {other.name or other.mmsi} within {dist_nm:.1f} NM",
                priority="critical",
                lat=vessel.lat, lon=vessel.lon,
                timestamp=datetime.now(timezone.utc),
            ))
            break


RULES = [rule_boundary_violation, rule_restricted_zone, rule_speed_drop, rule_dark_vessel, rule_proximity]


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
