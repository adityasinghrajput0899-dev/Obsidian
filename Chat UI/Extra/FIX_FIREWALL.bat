@echo off
:: This must be run as Administrator
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo Adding firewall rule for Obsidian AI Agent on port 3001...

:: Remove old blocking Node.js rules
netsh advfirewall firewall delete rule name="Node.js JavaScript Runtime" >nul 2>&1

:: Add allow rule for port 3001
netsh advfirewall firewall add rule name="Obsidian AI Agent Port 3001" dir=in action=allow protocol=TCP localport=3001

echo.
echo Done! Port 3001 is now open.
echo Share this URL with colleagues on the same network:
echo.
echo   http://10.10.139.13:3001
echo.
pause
