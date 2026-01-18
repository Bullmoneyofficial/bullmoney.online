#!/bin/bash

# Telegram Integration Quick Setup Script
# This script helps you set up environment variables and test the Telegram integration

set -e

echo "================================"
echo "BullMoney Telegram Integration"
echo "Quick Setup Script"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

echo "Step 1: Enter your Telegram Bot Token"
echo "Get this from @BotFather on Telegram"
read -p "Enter TELEGRAM_BOT_TOKEN: " BOT_TOKEN

echo ""
echo "Step 2: Enter your Telegram Channel ID"
echo "Example: -1001234567890 (private) or 12345 (public)"
read -p "Enter TELEGRAM_CHANNEL_ID: " CHANNEL_ID

echo ""
echo "Step 3: Enter your Telegram Channel Username (optional)"
echo "Example: bullmoneyfx"
read -p "Enter TELEGRAM_CHANNEL_USERNAME (press Enter to skip): " CHANNEL_USERNAME

# Write to .env.local
{
    echo "TELEGRAM_BOT_TOKEN=$BOT_TOKEN"
    echo "TELEGRAM_CHANNEL_ID=$CHANNEL_ID"
    if [ ! -z "$CHANNEL_USERNAME" ]; then
        echo "TELEGRAM_CHANNEL_USERNAME=$CHANNEL_USERNAME"
    fi
} >> .env.local

echo ""
echo "✅ Configuration saved to .env.local"
echo ""
echo "Next steps:"
echo "1. Add your bot as an administrator to your Telegram channel"
echo "2. Restart the dev server: npm run dev"
echo "3. Send a test message to your Telegram channel"
echo "4. Visit http://localhost:3000/community to see the feed"
echo ""
echo "For more help, see TELEGRAM_SETUP.md"
