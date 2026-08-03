@echo off
title DocPlus - Backend API
color 0A
echo.
echo  =========================================
echo   DocPlus Backend - Starting on port 8000
echo  =========================================
echo.

cd /d "%~dp0backend"

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

:: Install dependencies if needed
echo [*] Checking dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies ready.
echo [*] Starting FastAPI server...
echo.
echo  API running at: http://localhost:8000
echo  API docs at:    http://localhost:8000/docs
echo.
echo  Press Ctrl+C to stop.
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

pause
