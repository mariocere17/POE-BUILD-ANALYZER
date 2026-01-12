@echo off
echo ========================================
echo   PoE Build Analyzer - Starting...
echo ========================================
echo.

echo [1/2] Starting Proxy Server (Port 3001)...
start "Proxy Server" cmd /k "node proxy-server.js"
timeout /t 2 /nobreak > nul

echo [2/2] Starting React App (Port 3000)...
start "React App" cmd /k "npm start"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo   - Proxy Server: http://localhost:3001
echo   - React App: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
