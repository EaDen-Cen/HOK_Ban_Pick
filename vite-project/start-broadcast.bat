@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title HOK Broadcast Launcher
echo ==========================================
echo   HOK Broadcast - Starting...
echo ==========================================
echo.

where node >nul 2>&1 || (echo [ERROR] Node.js was not found in PATH.& pause & exit /b 1)
where npm >nul 2>&1 || (echo [ERROR] npm was not found in PATH.& pause & exit /b 1)
where cloudflared >nul 2>&1 || (echo [ERROR] cloudflared was not found in PATH.& pause & exit /b 1)

if not exist "package.json" (
  echo [ERROR] Run this launcher from the vite-project folder.
  pause
  exit /b 1
)

if not exist "artifacts" mkdir "artifacts"
del /q "artifacts\cloudflared.log" >nul 2>&1
del /q "artifacts\current-public-url.txt" >nul 2>&1

echo [1/6] Stopping old HOK server on port 3001...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>&1
)
echo [2/6] Stopping old Cloudflare tunnel...
taskkill /IM cloudflared.exe /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/6] Starting HOK server...
start "HOK Broadcast Server" /min cmd /c "cd /d ""%~dp0"" && npm run server"

echo       Waiting for http://127.0.0.1:3001 ...
set /a SERVER_TRIES=0
:wait_server
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3001/control' -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto server_ready
set /a SERVER_TRIES+=1
if !SERVER_TRIES! GEQ 30 (
  echo [ERROR] Server did not become ready within 30 seconds.
  echo         Check the "HOK Broadcast Server" window.
  pause
  exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_server

:server_ready
echo       Server is ready.

echo [4/6] Starting Cloudflare Quick Tunnel...
start "HOK Cloudflare Tunnel" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "& cloudflared tunnel --url http://127.0.0.1:3001 *^>^&1 ^| Tee-Object -FilePath '%~dp0artifacts\cloudflared.log'"

echo [5/6] Waiting for public URL...
set /a TUNNEL_TRIES=0
:wait_tunnel
set "PUBLIC_URL="
for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "$p='%~dp0artifacts\cloudflared.log'; if(Test-Path $p){$m=Select-String -Path $p -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' -AllMatches; if($m){$m.Matches.Value ^| Select-Object -Last 1}}"`) do set "PUBLIC_URL=%%U"
if defined PUBLIC_URL goto tunnel_ready
set /a TUNNEL_TRIES+=1
if !TUNNEL_TRIES! GEQ 45 (
  echo [ERROR] Could not obtain a trycloudflare.com URL within 45 seconds.
  echo         Check the "HOK Cloudflare Tunnel" window and artifacts\cloudflared.log.
  pause
  exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_tunnel

:tunnel_ready
(
  echo !PUBLIC_URL!
  echo !PUBLIC_URL!/control
  echo !PUBLIC_URL!/caster
  echo !PUBLIC_URL!/overlay/draft
) > "artifacts\current-public-url.txt"

echo [6/6] Opening local Control...
start "" "http://127.0.0.1:3001/control"

echo.
echo ==========================================
echo   HOK Broadcast is READY
echo ==========================================
echo Local Control:
echo   http://127.0.0.1:3001/control
echo.
echo Public:
echo   !PUBLIC_URL!
echo.
echo Caster:
echo   !PUBLIC_URL!/caster
echo.
echo Overlay:
echo   !PUBLIC_URL!/overlay/draft
echo.
echo Saved to:
echo   artifacts\current-public-url.txt
echo ==========================================
echo.
echo Keep the Server and Cloudflare windows running.
echo Use stop-broadcast.bat when the event is over.
echo.
pause
endlocal
