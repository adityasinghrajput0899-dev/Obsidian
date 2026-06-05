# PowerShell script to start Chat UI with Ngrok and show public URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Obsidian Chat UI with Public URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Chat UI server in background
Write-Host "1. Starting Chat UI Server (Port 3003)..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    cd "C:\Users\adisba\OneDrive - amazon.com\PROJECT UI\Chat UI\obsidian-chat\backend"
    node server.js
}

Start-Sleep -Seconds 5

Write-Host "2. Starting Ngrok Tunnel..." -ForegroundColor Yellow
Write-Host "   Waiting for public URL..." -ForegroundColor Gray

# Start ngrok and capture the URL
$ngrokOutput = ngrok http 3003 --log stdout 2>&1

# Parse ngrok output for URL (simplified - in real use you'd need to monitor the ngrok API)
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SERVER IS RUNNING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local URL:  http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "TO GET PUBLIC URL:" -ForegroundColor Yellow
Write-Host "1. Open a NEW Command Prompt" -ForegroundColor White
Write-Host "2. Run: ngrok http 3003" -ForegroundColor White
Write-Host "3. Share the URL that looks like: https://abc123.ngrok.io" -ForegroundColor White
Write-Host ""
Write-Host "OR use the batch file: start_chat_ui_ngrok.bat" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Green

# Keep script running
try {
    Wait-Job $serverJob
} finally {
    Stop-Job $serverJob
    Remove-Job $serverJob
}