#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🐂  BULLMONEY WORKSPACE CLEANER  –  macOS Launcher
#
#  Double-click this file to open a branded terminal window.
#  Or run:   ./scripts/bullmoney-clean.command
# ═══════════════════════════════════════════════════════════════

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"

# Set Terminal title
printf '\033]0;🐂 BULLMONEY CLEANER\007'

# Activate venv if it exists
if [ -f "$ROOT/.venv/bin/activate" ]; then
    source "$ROOT/.venv/bin/activate"
fi

cd "$ROOT"
python3 "$DIR/clean.py" "$@"

echo ""
echo "  Press any key to close…"
read -n 1 -s
