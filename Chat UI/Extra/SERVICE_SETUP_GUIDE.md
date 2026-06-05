# Windows Service Setup Guide

## Problem
When you leave your computer or lock it, the Node.js servers stop running, making them unavailable to others.

## Solution
Install the servers as Windows Services that run automatically even when you're not logged in.

## Files Created

1. **`install-all-services.bat`** - Main installation script (run as Administrator)
2. **`install-chatui-service.ps1`** - Installs Chat UI service (port 3001)
3. **`install-converter-service.ps1`** - Installs File Converter service (port 3002)
4. **`manage-services.ps1`** - PowerShell script to manage services
5. **`SERVICE_SETUP_GUIDE.md`** - This guide

## Installation Steps

### Step 1: Run as Administrator
1. Right-click on `install-all-services.bat`
2. Select "Run as administrator"
3. Click "Yes" if prompted by User Account Control
4. Press any key when prompted

### Step 2: Verify Installation
After installation, check if services are running:
```powershell
# Open PowerShell as Administrator
Get-Service ObsidianChatUI, FileConverterService
```

### Step 3: Test Access
1. **Chat UI**: `http://localhost:3001` or `http://[YOUR_IP]:3001`
2. **File Converter**: `http://localhost:3002` or `http://[YOUR_IP]:3002`

To find your IP address:
```powershell
ipconfig | findstr IPv4
```

## Service Management

### Using PowerShell (as Administrator):
```powershell
# Check status
Get-Service ObsidianChatUI, FileConverterService

# Start services
Start-Service ObsidianChatUI
Start-Service FileConverterService

# Stop services
Stop-Service ObsidianChatUI
Stop-Service FileConverterService

# Restart services
Restart-Service ObsidianChatUI
Restart-Service FileConverterService
```

### Using the management script:
```powershell
# Run from project directory
.\manage-services.ps1 status
.\manage-services.ps1 start
.\manage-services.ps1 stop
.\manage-services.ps1 restart
```

## Service Details

### Chat UI Service
- **Name**: `ObsidianChatUI`
- **Display Name**: `Obsidian Chat UI Server`
- **Port**: 3001
- **Runs as**: `NT AUTHORITY\NetworkService`
- **Startup Type**: Automatic
- **Logs**: Console output captured by Windows Service Manager

### File Converter Service
- **Name**: `FileConverterService`
- **Display Name**: `File to Markdown Converter`
- **Port**: 3002
- **Runs as**: `NT AUTHORITY\NetworkService`
- **Startup Type**: Automatic
- **Logs**: Console output captured by Windows Service Manager

## Benefits

1. **Always Available**: Services run 24/7, even when you're not logged in
2. **Automatic Startup**: Services start automatically when Windows boots
3. **Automatic Recovery**: Services restart automatically if they crash
4. **No User Session Required**: Runs under system account, not your user account
5. **Centralized Management**: Manage through Windows Services console or PowerShell

## Troubleshooting

### Service won't start
1. Check if port is already in use:
   ```powershell
   netstat -ano | findstr :3001
   netstat -ano | findstr :3002
   ```

2. Check service logs:
   ```powershell
   Get-EventLog -LogName Application -Source "ObsidianChatUI" -Newest 10
   Get-EventLog -LogName Application -Source "FileConverterService" -Newest 10
   ```

3. Reinstall services:
   ```powershell
   # Uninstall
   sc.exe delete ObsidianChatUI
   sc.exe delete FileConverterService
   
   # Then run install-all-services.bat again as Administrator
   ```

### Firewall Issues
Services should automatically have firewall rules, but you can check:
```powershell
Get-NetFirewallRule -DisplayName "*3001*" | Select-Object DisplayName, Enabled
Get-NetFirewallRule -DisplayName "*3002*" | Select-Object DisplayName, Enabled
```

### Access from other devices
Make sure:
1. Other devices are on the same network
2. Windows Firewall allows inbound connections on ports 3001 and 3002
3. You're using the correct IP address (check with `ipconfig`)

## Uninstallation
To completely remove the services:
```powershell
# Run as Administrator
Stop-Service ObsidianChatUI -Force
sc.exe delete ObsidianChatUI

Stop-Service FileConverterService -Force
sc.exe delete FileConverterService
```

Or use the management script:
```powershell
.\manage-services.ps1 uninstall
```

## Notes
- Services will automatically restart if they fail (up to 3 times)
- Services run with minimal privileges for security
- Logs are available in Windows Event Viewer under "Application" log
- The servers will be available even when your computer is locked or you're logged out