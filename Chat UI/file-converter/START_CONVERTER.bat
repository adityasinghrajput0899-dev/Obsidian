@echo off
title File Converter — Obsidian Markdown
color 0A

echo ============================================================
echo   File-to-Markdown Converter
echo ============================================================
echo.

:: Check if node_modules exists, install if not
if not exist "%~dp0backend\node_modules" (
    echo   Installing dependencies...
    echo.
    cd /d "%~dp0backend"
    npm install
    echo.
)

:: Start the server
echo   Starting server on port 3002...
echo.
cd /d "%~dp0backend"
start "" http://127.0.0.1:3002
node server.js

pause
