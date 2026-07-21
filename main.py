"""
Root Entry Point for Render / Uvicorn Deployment
Allows `uvicorn main:app --host 0.0.0.0 --port $PORT` to run cleanly from root.
"""
import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import app from backend.main
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
