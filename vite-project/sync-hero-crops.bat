@echo off
setlocal
cd /d "%~dp0"
echo [HOK Broadcast] Promoting runtime hero crop settings into the tracked shared defaults...
call npm run hero:crop-sync
if errorlevel 1 (
  echo.
  echo Crop sync failed. Make sure Broadcast has saved data\match.json, or set DATA_FILE to the active match file.
  pause
  exit /b 1
)
echo.
echo Done. Review src\data\heroArtFocusOverrides.ts in Git/GitHub Desktop, then commit and push it normally.
pause
