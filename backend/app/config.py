"""Configuration — loaded from backend/.env"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

AIS_API_KEY: str  = os.getenv("AIS_API_KEY", "").strip()
AIS_PROVIDER: str = os.getenv("AIS_PROVIDER", "demo").strip()   # demo | aisstream
HOST: str         = os.getenv("HOST", "0.0.0.0")
PORT: int         = int(os.getenv("PORT", "8000"))
POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "5"))
MAX_VESSELS: int  = int(os.getenv("MAX_VESSELS", "5000"))
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "*"
).split(",")
