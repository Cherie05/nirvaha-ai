@echo off
REM Double-click this to bring the whole Nirvaha demo up.
REM Bypasses the execution policy so the .ps1 runs on a fresh machine without
REM anyone having to remember Set-ExecutionPolicy under demo pressure.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-demo.ps1"
echo.
pause
