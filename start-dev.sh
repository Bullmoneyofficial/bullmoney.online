#!/bin/bash

# Start Next.js dev server
echo "Starting BullMoney dev server..."

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Clean Next.js cache
rm -rf .next 2>/dev/null

npm run dev
