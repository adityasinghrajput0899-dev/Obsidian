@echo off
echo Opening ports 3001 and 3002 in Windows Firewall...
echo.

netsh advfirewall firewall delete rule name="ChatUI-3001" >nul 2>&1
netsh advfirewall firewall delete rule name="FileConverter-3002" >nul 2>&1

netsh advfirewall firewall add rule name="ChatUI-3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="FileConverter-3002" dir=in action=allow protocol=TCP localport=3002

echo.
echo Done! Both ports are now open.
echo.
echo  Chat UI       : http://%COMPUTERNAME%:3001
echo  File Converter: http://%COMPUTERNAME%:3002
echo.
pause
