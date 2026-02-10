#!/bin/bash
# Auto-start Bullcasino Laravel backend and Node.js socket server

echo "🎰 Starting Bullcasino servers..."

# Navigate to Bullcasino directory
cd "$(dirname "$0")/../Bullcasino" || exit 1

# Start Laravel server in background
echo "📡 Starting Laravel backend on port 8000..."
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!

# Give Laravel a moment to start
sleep 2

# Start Node.js socket server in background
echo "🔌 Starting Socket server on port 8443..."
cd server && node app.js &
SOCKET_PID=$!

# Wait for both processes
wait $LARAVEL_PID $SOCKET_PID
