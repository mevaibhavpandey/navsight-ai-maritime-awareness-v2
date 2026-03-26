@echo off
echo NavSight AI Maritime Intelligence Platform
echo ===========================================
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python 3 is required. Install from https://python.org
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt -q

echo.
echo Starting backend server on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
echo Open frontend\index.html in your browser.
echo Press Ctrl+C to stop.
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
