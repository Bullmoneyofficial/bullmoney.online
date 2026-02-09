# ═══════════════════════════════════════════════════════════════
#  🐂  BULLMONEY WORKSPACE CLEANER  –  Windows PowerShell Launcher
#
#  Right-click → Run with PowerShell  or:  .\scripts\bullmoney-clean.ps1
# ═══════════════════════════════════════════════════════════════

$Host.UI.RawUI.WindowTitle = "🐂 BULLMONEY CLEANER"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
Set-Location $Root

# Activate venv if available
$VenvActivate = Join-Path $Root ".venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) {
    & $VenvActivate
}

python scripts\clean.py @args

Write-Host ""
Write-Host "  Press any key to close…"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
