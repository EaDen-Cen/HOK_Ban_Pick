@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo HOK BP Simulator - Starting...
echo ==========================================
echo.
echo This window runs a standalone draft simulator for Auto BP capture tests.
echo It does NOT connect to or modify the live match state.
echo.
echo URL: http://127.0.0.1:5173/tools/bp-simulator
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Preparing dependencies...
  call npm ci
  if errorlevel 1 (
    echo [ERROR] npm ci failed.
    pause
    exit /b 1
  )
)

call npm run simulator
