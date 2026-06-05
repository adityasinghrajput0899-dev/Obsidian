@echo off
echo ============================================
echo  Installing Chat UI and Converter Services
echo ============================================
echo.
echo This will install both servers as Windows Services
echo so they run automatically even when you're not logged in.
echo.
echo You need to run this as Administrator!
echo.
echo Make sure this batch file is in the same directory as:
echo   - install-chatui-service.ps1
echo   - install-converter-service.ps1
echo.
pause

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo.
echo Current directory: %CD%
echo.

echo Installing Chat UI Service (port 3001)...
if exist "install-chatui-service.ps1" (
    powershell -ExecutionPolicy Bypass -File "install-chatui-service.ps1"
) else (
    echo ERROR: install-chatui-service.ps1 not found!
    echo Please make sure all files are in the same directory.
    pause
    exit /b 1
)

echo.
echo Installing File Converter Service (port 3002)...
if exist "install-converter-service.ps1" (
    powershell -ExecutionPolicy Bypass -File "install-converter-service.ps1"
) else (
    echo ERROR: install-converter-service.ps1 not found!
    echo Please make sure all files are in the same directory.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Services Installation Complete!
echo ============================================
echo.
echo Both services are now installed and running.
echo They will start automatically when Windows boots up.
echo.
echo To check service status, run:
echo   Get-Service ObsidianChatUI
echo   Get-Service FileConverterService
echo.
echo To stop a service:
echo   Stop-Service ObsidianChatUI
echo.
echo To start a service:
echo   Start-Service ObsidianChatUI
echo.
pause