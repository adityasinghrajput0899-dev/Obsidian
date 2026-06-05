@echo off
title Obsidian AI Chat Agent
color 0A

echo.
echo ================================================
echo   Obsidian AI Chat Agent
echo ================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Ollama
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [..] Starting Ollama...
    start /b ollama serve
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Ollama already running
)

REM Install deps if needed
cd /d "%~dp0obsidian-chat\backend"
if not exist "node_modules" (
    echo [..] Installing dependencies...
    call npm install
)
echo [OK] Dependencies ready

REM Start the backend server in background
echo [..] Starting backend server...
start /b node server.js
timeout /t 2 /nobreak >nul
echo [OK] Server running at http://127.0.0.1:3001
echo [OK] Local network:   http://10.10.139.13:3001

REM Check if ngrok is available and start tunnel
cd /d "%~dp0"
if exist "ngrok.exe" (
    echo.
    echo [..] Starting ngrok tunnel for personal network access...
    start /b ngrok http 3001 --log=stdout > ngrok.log 2>&1
    timeout /t 3 /nobreak >nul

    REM Try to read the public URL from ngrok API
    for /f "delims=" %%i in ('curl -s http://127.0.0.1:4040/api/tunnels 2^>nul ^| node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');try{const t=JSON.parse(d).tunnels;const u=t.find(x=>x.proto==='https');console.log(u?u.public_url:'');}catch(e){}"') do set NGROK_URL=%%i

    if not "!NGROK_URL!"=="" (
        echo [OK] Public URL: !NGROK_URL!
        echo.
        echo ================================================
        echo   Share this link with ANYONE, ANYWHERE:
        echo   !NGROK_URL!
        echo ================================================
    ) else (
        echo [OK] ngrok started - check http://127.0.0.1:4040 for your public URL
        echo      Or run: curl http://127.0.0.1:4040/api/tunnels
    )
) else (
    echo.
    echo [--] ngrok not found - personal network access disabled
    echo      To enable: download ngrok.exe to this folder from https://ngrok.com
)

echo.
echo ================================================
echo   Opening browser...
echo   Press Ctrl+C to stop
echo ================================================
echo.

start http://127.0.0.1:3001

REM Keep window open
echo Server is running. Close this window to stop everything.
pause >nul
