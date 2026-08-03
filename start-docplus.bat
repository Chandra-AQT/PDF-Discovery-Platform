@echo off
title DocPlus Launcher
color 0E
echo.
echo  ==========================================
echo        DocPlus - PDF Discovery Platform
echo  ==========================================
echo.
echo  This will open two windows:
echo    [1] Backend  - http://localhost:8000
echo    [2] Frontend - http://localhost:5173
echo.
echo  Starting...
echo.

:: Start backend in a new window
start "DocPlus - Backend" cmd /k "cd /d "%~dp0backend" && echo [*] Installing dependencies... && pip install -r requirements.txt --quiet && echo. && echo [OK] Backend starting on http://localhost:8000 && echo. && python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload"

:: Wait 5 seconds for backend to start
echo [*] Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

:: Start frontend in a new window
start "DocPlus - Frontend" cmd /k "cd /d "%~dp0frontend" && if not exist node_modules (echo [*] Installing npm packages... && npm install) && echo. && echo [OK] Frontend starting on http://localhost:5173 && echo. && npm run dev"

:: Wait 5 seconds for frontend to start
echo [*] Waiting for frontend to start (5 seconds)...
timeout /t 5 /nobreak >nul

:: Open browser
echo [*] Opening browser...
start http://localhost:5173

echo.
echo  ==========================================
echo   DocPlus is running!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo  ==========================================
echo.
echo  Close the Backend and Frontend windows to stop.
echo.
pause
