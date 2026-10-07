@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title HOK BP Simulator Stop

echo ==========================================
echo   HOK BP Simulator - Stopping...
echo ==========================================
echo.

set "FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  set "FOUND=1"
  taskkill /PID %%P /F >nul 2>&1
)

if "%FOUND%"=="0" (
  echo No simulator process was listening on port 5173.
) else (
  echo Simulator stopped.
)

timeout /t 1 /nobreak >nul
endlocal
exit /b 0
