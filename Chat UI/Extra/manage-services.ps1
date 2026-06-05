# PowerShell script to manage Chat UI and Converter services
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("status", "start", "stop", "restart", "install", "uninstall")]
    [string]$Action = "status"
)

$chatService = "ObsidianChatUI"
$converterService = "FileConverterService"

function Show-Status {
    Write-Host "`n=== Service Status ===" -ForegroundColor Cyan
    Get-Service -Name $chatService, $converterService -ErrorAction SilentlyContinue | Format-Table -AutoSize
}

function Start-Services {
    Write-Host "`nStarting services..." -ForegroundColor Green
    try {
        Start-Service -Name $chatService -ErrorAction Stop
        Write-Host "  $chatService started" -ForegroundColor Green
    } catch {
        Write-Host "  $chatService : $_" -ForegroundColor Red
    }
    
    try {
        Start-Service -Name $converterService -ErrorAction Stop
        Write-Host "  $converterService started" -ForegroundColor Green
    } catch {
        Write-Host "  $converterService : $_" -ForegroundColor Red
    }
}

function Stop-Services {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    try {
        Stop-Service -Name $chatService -Force -ErrorAction Stop
        Write-Host "  $chatService stopped" -ForegroundColor Green
    } catch {
        Write-Host "  $chatService : $_" -ForegroundColor Red
    }
    
    try {
        Stop-Service -Name $converterService -Force -ErrorAction Stop
        Write-Host "  $converterService stopped" -ForegroundColor Green
    } catch {
        Write-Host "  $converterService : $_" -ForegroundColor Red
    }
}

function Restart-Services {
    Write-Host "`nRestarting services..." -ForegroundColor Cyan
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Install-Services {
    Write-Host "`nInstalling services..." -ForegroundColor Cyan
    Write-Host "Run the install scripts separately as Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Right-click 'install-all-services.bat'" -ForegroundColor Yellow
    Write-Host "  2. Select 'Run as administrator'" -ForegroundColor Yellow
    Write-Host "  3. Follow the prompts" -ForegroundColor Yellow
}

function Uninstall-Services {
    Write-Host "`nUninstalling services..." -ForegroundColor Red
    Write-Host "This will remove the services. Continue? (Y/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        try {
            Stop-Service -Name $chatService -Force -ErrorAction SilentlyContinue
            sc.exe delete $chatService
            Write-Host "  $chatService uninstalled" -ForegroundColor Green
        } catch {
            Write-Host "  $chatService : $_" -ForegroundColor Red
        }
        
        try {
            Stop-Service -Name $converterService -Force -ErrorAction SilentlyContinue
            sc.exe delete $converterService
            Write-Host "  $converterService uninstalled" -ForegroundColor Green
        } catch {
            Write-Host "  $converterService : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
}

# Main execution
switch ($Action) {
    "status"    { Show-Status }
    "start"     { Start-Services; Show-Status }
    "stop"      { Stop-Services; Show-Status }
    "restart"   { Restart-Services; Show-Status }
    "install"   { Install-Services }
    "uninstall" { Uninstall-Services }
}

Write-Host "`n=== Access Information ===" -ForegroundColor Cyan
Write-Host "Chat UI:      http://localhost:3001" -ForegroundColor Green
Write-Host "              http://[YOUR_IP]:3001" -ForegroundColor Green
Write-Host "Converter:    http://localhost:3002" -ForegroundColor Green
Write-Host "              http://[YOUR_IP]:3002" -ForegroundColor Green
Write-Host ""
Write-Host "To find your IP address:" -ForegroundColor Yellow
Write-Host "  ipconfig | findstr IPv4" -ForegroundColor Yellow