@echo off
REM ═══════════════════════════════════════════════════════════════
REM  🐂  BULLMONEY WORKSPACE CLEANER  –  Windows Launcher
REM
REM  Double-click this file to open a branded command window.
REM ═══════════════════════════════════════════════════════════════

title 🐂 BULLMONEY CLEANER
cd /d "%~dp0\.."

REM Try venv first, then system python
if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
)

python scripts\clean.py %*

echo.
echo   Press any key to close...
pause >nul
