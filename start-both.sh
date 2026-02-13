#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🎮  BULL MONEY - START BOTH SERVERS                      ║"
echo "║   Frontend (Next.js) + Backend (Laravel)                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if ports are already in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0 # Port is in use
    else
        return 1 # Port is free
    fi
}

# Kill servers on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    pkill -f "php.*artisan serve"
    pkill -f "next dev"
    pkill -P $$ 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check port 8000
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use${NC}"
    echo -e "${YELLOW}Killing existing Laravel process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check port 3000
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo -e "${YELLOW}Will use port 3001 instead${NC}"
fi

echo -e "\n${GREEN}✓ Starting Laravel backend (port 8000)...${NC}"
php "${SCRIPT_DIR}/Bullcasino/artisan" serve --host=0.0.0.0 --port=8000 2>&1 | sed 's/^/  [Laravel] /' &
LARAVEL_PID=$!

sleep 3

echo -e "${GREEN}✓ Starting Next.js frontend (port 3000/3001)...${NC}"
cd "${SCRIPT_DIR}"
npm run dev 2>&1 | sed 's/^/  [Next.js] /' &
NEXTJS_PID=$!

echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Both servers are running!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000 (or 3001 if 3000 is busy)"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:8000"
echo -e "  ${BLUE}Games:${NC}     http://localhost:3001/games/dice"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait $LARAVEL_PID $NEXTJS_PID
