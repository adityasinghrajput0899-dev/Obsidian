@echo off
echo ========================================
echo Starting Obsidian Chat UI + File Converter
echo ========================================

echo.
echo 1. Starting Chat UI Server (Port 3003)...
start cmd /k "cd /d "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\obsidian-chat\backend" && node server.js"

timeout /t 3 /nobreak >nul

echo.
echo 2. Starting File Converter Server (Port 3002)...
start cmd /k "cd /d "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\file-converter\backend" && node server.js"

timeout /t 3 /nobreak >nul

echo.
echo 3. Starting Ngrok Tunnel for Chat UI (Port 3003)...
start cmd /k "ngrok http 3003"

echo.
echo 4. Starting Ngrok Tunnel for File Converter (Port 3002)...
start cmd /k "ngrok http 3002"

echo.
echo ========================================
echo SERVICES STARTED:
echo.
echo LOCAL ACCESS:
echo - Chat UI:      http://localhost:3003
echo - File Converter: http://localhost:3002
echo.
echo PUBLIC ACCESS (Ngrok URLs):
echo - Check the ngrok windows for public URLs
echo - They will look like: https://abc123.ngrok.io
echo.
echo ========================================
echo.
echo IMPORTANT:
echo 1. Share the Ngrok URLs with your team
echo 2. URLs work even when you're not in office
echo 3. Keep this window open
echo.
pause