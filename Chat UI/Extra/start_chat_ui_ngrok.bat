@echo off
echo ========================================
echo Starting Obsidian Chat UI with Ngrok
echo ========================================

echo.
echo 1. Starting Chat UI Server (Port 3003)...
start cmd /k "cd /d "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\obsidian-chat\backend" && node server.js"

timeout /t 5 /nobreak >nul

echo.
echo 2. Starting Ngrok Tunnel...
echo    Public URL will appear below:
echo.
ngrok http 3003

echo.
echo ========================================
echo IMPORTANT:
echo - Share the Ngrok URL (https://*.ngrok.io) with team
echo - Works even when you're not in office
echo - Keep this window open
echo ========================================
pause