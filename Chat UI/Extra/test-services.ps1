# Test script to verify services are working
Write-Host "=== Testing Chat UI and Converter Services ===" -ForegroundColor Cyan
Write-Host ""

# Test localhost access
$chatUrl = "http://localhost:3001/health"
$converterUrl = "http://localhost:3002/api/status"

Write-Host "Testing Chat UI ($chatUrl)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $chatUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✓ Chat UI is responding: $($response.StatusCode)" -ForegroundColor Green
    $chatData = $response.Content | ConvertFrom-Json
    Write-Host "  Status: $($chatData.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Chat UI is not responding: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing File Converter ($converterUrl)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $converterUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✓ File Converter is responding: $($response.StatusCode)" -ForegroundColor Green
    $converterData = $response.Content | ConvertFrom-Json
    Write-Host "  Status: $($converterData.status)" -ForegroundColor Green
    Write-Host "  Port: $($converterData.port)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ File Converter is not responding: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Network Information ===" -ForegroundColor Cyan

# Get current IP addresses
$ipAddresses = Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -ne 'WellKnown'} | Select-Object IPAddress, InterfaceAlias

if ($ipAddresses) {
    Write-Host "Your current IP addresses:" -ForegroundColor Green
    foreach ($ip in $ipAddresses) {
        Write-Host "  $($ip.InterfaceAlias): $($ip.IPAddress)" -ForegroundColor Yellow
        Write-Host "    Chat UI:     http://$($ip.IPAddress):3001" -ForegroundColor Gray
        Write-Host "    Converter:   http://$($ip.IPAddress):3002" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "No network interfaces found" -ForegroundColor Red
}

Write-Host "=== Service Status ===" -ForegroundColor Cyan
Get-Service -Name "ObsidianChatUI", "FileConverterService" -ErrorAction SilentlyContinue | Format-Table -AutoSize

Write-Host ""
Write-Host "=== Quick Commands ===" -ForegroundColor Cyan
Write-Host "Check service status:  Get-Service ObsidianChatUI, FileConverterService" -ForegroundColor Gray
Write-Host "Start services:        Start-Service ObsidianChatUI; Start-Service FileConverterService" -ForegroundColor Gray
Write-Host "Stop services:         Stop-Service ObsidianChatUI; Stop-Service FileConverterService" -ForegroundColor Gray
Write-Host "Install services:      Run 'install-all-services.bat' as Administrator" -ForegroundColor Gray