#!/bin/bash

# Telegram Webhook Fix Script
# This script deletes any active webhook so getUpdates can work

echo "================================================"
echo "Telegram Webhook Fix Script"
echo "================================================"
echo ""

# Set your domain (change if needed)
DOMAIN="https://bullmoney.online"

echo "Checking webhook status..."
echo ""

# Get webhook info
WEBHOOK_INFO=$(curl -s "${DOMAIN}/api/telegram/bot" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WEBHOOK_INFO" ] || [ "$WEBHOOK_INFO" == "Not set" ]; then
    echo "✅ No webhook is active - getUpdates should work!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure @MrBullmoneybot is ADMIN in your VIP channel"
    echo "2. Post a test message in the VIP channel"
    echo "3. Check the VIP Trades section - messages should appear"
else
    echo "⚠️  Active webhook detected: $WEBHOOK_INFO"
    echo ""
    echo "This webhook prevents getUpdates from working."
    echo "Deleting webhook..."
    echo ""
    
    # Delete webhook
    RESULT=$(curl -s -X POST "${DOMAIN}/api/telegram/delete-webhook")
    
    if echo "$RESULT" | grep -q '"ok":true'; then
        echo "✅ Webhook deleted successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Post a test message in your VIP channel"
        echo "2. Refresh the VIP Trades section"
        echo "3. Messages should now appear"
    else
        echo "❌ Failed to delete webhook"
        echo ""
        echo "Response: $RESULT"
        echo ""
        echo "Try manually:"
        echo "curl -X POST ${DOMAIN}/api/telegram/delete-webhook"
    fi
fi

echo ""
echo "================================================"
echo "For more help, check the server logs"
echo "================================================"
