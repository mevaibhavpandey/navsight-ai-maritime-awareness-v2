#!/bin/bash
# NavSight AI — Start Backend
echo "NavSight AI Maritime Intelligence Platform"
echo "==========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "ERROR: Python 3 is required. Install from https://python.org"
  exit 1
fi

# Install dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q

echo ""
echo "Starting backend server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
echo ""
echo "Open frontend/index.html in your browser to access the UI."
echo "Press Ctrl+C to stop."
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
