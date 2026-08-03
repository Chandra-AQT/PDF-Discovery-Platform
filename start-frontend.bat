@echo off
title DocPlus - Frontend UI
color 0B
echo.
echo  =========================================
echo   DocPlus Frontend - Starting on port 5173
echo  =========================================
echo.

cd /d "%~dp0frontend"

:: Check Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo [*] Installing npm packages...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo [OK] Node modules ready.
echo [*] Starting Vite dev server...
echo.
echo  UI running at: http://localhost:5173
echo.
echo  Make sure backend is running on port 8000 first!
echo  Press Ctrl+C to stop.
echo.

npm run dev

pause
