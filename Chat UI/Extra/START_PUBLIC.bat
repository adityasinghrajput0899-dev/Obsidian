@echo off
title Project UI — Public Access Launcher
color 0A

echo ============================================================
echo   Project UI — Public Access Launcher
echo ============================================================
echo.

REM ── STEP 1: Check ngrok auth token ──────────────────────────
set NGROK_TOKEN=PASTE_YOUR_TOKEN_HERE

if "%NGROK_TOKEN%"=="PASTE_YOUR_TOKEN_HERE" (
    echo [!] ngrok auth token not set.
    echo.
    echo  1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
    echo  2. Sign up free ^(takes 30 seconds^)
    echo  3. Copy your token
    echo  4. Open this file ^(START_PUBLIC.bat^) in Notepad
    echo  5. Replace PASTE_YOUR_TOKEN_HERE with your token
    echo  6. Save and run again
    echo.
    pause
    exit /b 1
)

REM ── STEP 2: Save auth token ──────────────────────────────────
ngrok config add-authtoken %NGROK_TOKEN% >nul 2>&1

REM ── STEP 3: Start Chat UI server ─────────────────────────────
echo [1/3] Starting Chat UI server on port 3001...
start "Chat UI Server" cmd /k "cd /d "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\obsidian-chat\backend" && node server.js"
timeout /t 2 /nobreak >nul

REM ── STEP 4: Start File Converter server ──────────────────────
echo [2/3] Starting File Converter server on port 3002...
start "File Converter Server" cmd /k "cd /d "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\file-converter\backend" && node server.js"
timeout /t 2 /nobreak >nul

REM ── STEP 5: Start ngrok tunnels for both ports ───────────────
echo [3/3] Opening public tunnels via ngrok...
echo.
echo  This will open a browser showing your public URLs.
echo  Share those URLs with anyone — they work from anywhere.
echo.

REM ngrok can tunnel multiple ports with a config file
echo version: "3" > "%TEMP%\ngrok_multi.yml"
echo agent: >> "%TEMP%\ngrok_multi.yml"
echo   authtoken: %NGROK_TOKEN% >> "%TEMP%\ngrok_multi.yml"
echo tunnels: >> "%TEMP%\ngrok_multi.yml"
echo   chat-ui: >> "%TEMP%\ngrok_multi.yml"
echo     proto: http >> "%TEMP%\ngrok_multi.yml"
echo     addr: 3001 >> "%TEMP%\ngrok_multi.yml"
echo   file-converter: >> "%TEMP%\ngrok_multi.yml"
echo     proto: http >> "%TEMP%\ngrok_multi.yml"
echo     addr: 3002 >> "%TEMP%\ngrok_multi.yml"

start "ngrok Tunnels" cmd /k "ngrok start --all --config "%TEMP%\ngrok_multi.yml""

timeout /t 4 /nobreak >nul

REM ── STEP 6: Open ngrok dashboard to see URLs ─────────────────
start http://127.0.0.1:4040

echo.
echo ============================================================
echo   All services started!
echo ============================================================
echo.
echo   Public URLs are shown at: http://127.0.0.1:4040
echo   Share the ngrok URLs with anyone on any network.
echo.
echo   To stop everything: close the 3 server windows + ngrok window
echo ============================================================
echo.
pause
