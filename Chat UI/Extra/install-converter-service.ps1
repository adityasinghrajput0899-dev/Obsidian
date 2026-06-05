# PowerShell script to install File Converter as Windows Service
$serviceName = "FileConverterService"
$serviceDisplayName = "File to Markdown Converter"
$serviceDescription = "File to Markdown Converter Server running on port 3002"
$nodePath = "node.exe"

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $scriptDir "file-converter\backend\server.js"
$workingDirectory = Join-Path $scriptDir "file-converter\backend"

# Verify paths exist
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Server.js not found at: $scriptPath" -ForegroundColor Red
    Write-Host "Please make sure the file-converter\backend directory exists." -ForegroundColor Red
    exit 1
}

# Check if service already exists
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Service '$serviceName' already exists." -ForegroundColor Yellow
    Write-Host "Stopping and removing existing service..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName
    Start-Sleep -Seconds 2
}

Write-Host "Creating Windows Service: $serviceDisplayName" -ForegroundColor Green

# Create the service
New-Service -Name $serviceName `
            -DisplayName $serviceDisplayName `
            -Description $serviceDescription `
            -BinaryPathName "`"$nodePath`" `"$scriptPath`"" `
            -StartupType Automatic `
            -ErrorAction Stop

# Configure service to restart on failure
sc.exe failure $serviceName reset= 86400 actions= restart/5000/restart/10000/restart/30000

# Set service to run with network service account (can run without user login)
sc.exe config $serviceName obj= "NT AUTHORITY\NetworkService"

# Set working directory using PowerShell instead of sc.exe
$regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\$serviceName"
New-ItemProperty -Path $regPath -Name "WorkingDirectory" -Value $workingDirectory -PropertyType String -Force | Out-Null

Write-Host "Service created successfully!" -ForegroundColor Green
Write-Host "Starting the service..." -ForegroundColor Green

# Start the service
Start-Service -Name $serviceName -ErrorAction Stop

Write-Host "Service started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service Information:" -ForegroundColor Cyan
Write-Host "  Name: $serviceName"
Write-Host "  Display Name: $serviceDisplayName"
Write-Host "  Status: $(Get-Service -Name $serviceName | Select-Object -ExpandProperty Status)"
Write-Host "  Startup Type: Automatic"
Write-Host "  Runs as: NetworkService (no user login required)"
Write-Host "  Port: 3002"
Write-Host "  Access URLs:"
Write-Host "    - http://localhost:3002"
Write-Host "    - http://[YOUR_IP]:3002"
Write-Host ""
Write-Host "To manage the service:" -ForegroundColor Yellow
Write-Host "  Start:   Start-Service -Name $serviceName"
Write-Host "  Stop:    Stop-Service -Name $serviceName"
Write-Host "  Restart: Restart-Service -Name $serviceName"
Write-Host "  Status:  Get-Service -Name $serviceName"
Write-Host ""
Write-Host "The service will automatically start when Windows boots up." -ForegroundColor Green