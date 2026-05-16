@echo off
echo Launching Eco-Budgeter...
echo.
echo Starting development server...

:: Start a background task to wait for port 3000, then open the browser
start /b powershell -WindowStyle Hidden -Command "while (!(Test-NetConnection localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Seconds 1 }; Start-Process 'http://localhost:3000'"

:: Run the Next.js development server
npm run dev