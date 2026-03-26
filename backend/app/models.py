"""Unified vessel data schema and alert models."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Vessel(BaseModel):
    """Normalized vessel state — unified schema for all AIS sources."""
    mmsi: str
    name: Optional[str] = "Unknown"
    lat: float
    lon: float
    speed: float = 0.0          # knots
    heading: float = 0.0        # degrees 0-359
    course: float = 0.0         # degrees over ground
    vessel_type: Optional[str] = "Unknown"
    flag: Optional[str] = "Unknown"
    imo: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: Optional[str] = "underway"
    # Trail: last N positions stored as [lat, lon] pairs
    trail: list[list[float]] = Field(default_factory=list)


class Alert(BaseModel):
    id: str
    vessel_mmsi: Optional[str] = None
    vessel_name: Optional[str] = None
    alert_type: str          # speed_drop | route_deviation | restricted_zone | proximity
    message: str
    priority: str = "medium"  # low | medium | high | critical
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False


class VesselUpdate(BaseModel):
    """Incoming raw AIS update before normalization."""
    mmsi: str
    lat: float
    lon: float
    speed: float
    heading: float
    timestamp: str
