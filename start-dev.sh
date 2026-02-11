#!/bin/bash

# Start both Next.js and Casino backend servers
echo "🚀 Starting BullMoney + Casino Backend..."
echo ""

# Kill any existing processes on ports 3000 and 8000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Clean Next.js cache
rm -rf .next 2>/dev/null

echo "✅ Cleanup complete"
echo ""

# Run the dev script (starts both servers)
npm run dev
