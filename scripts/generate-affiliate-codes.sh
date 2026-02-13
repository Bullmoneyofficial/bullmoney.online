#!/bin/bash

# Affiliate Code Batch Generation Script
# Usage: ./scripts/generate-affiliate-codes.sh <command> [options]

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
AFFILIATE_BATCH_SECRET="${AFFILIATE_BATCH_SECRET:-change-this-in-prod}"

echo "🔧 BullMoney Affiliate Code Batch Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

command=${1:-status}

if [ "$command" = "status" ]; then
    echo "📊 Checking affiliate code status..."
    curl -s -X GET \
        -H "Authorization: Bearer $AFFILIATE_BATCH_SECRET" \
        "$API_URL/api/recruit/batch-generate-codes" | jq '.'
    
elif [ "$command" = "generate" ]; then
    echo "⚙️  Generating affiliate codes for existing users..."
    echo "ℹ️  This will generate codes for all users without an affiliate_code"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -s -X POST \
            -H "Authorization: Bearer $AFFILIATE_BATCH_SECRET" \
            -H "Content-Type: application/json" \
            -d '{}' \
            "$API_URL/api/recruit/batch-generate-codes" | jq '.'
        echo "✅ Done!"
    else
        echo "❌ Cancelled"
    fi

elif [ "$command" = "help" ]; then
    echo "Available commands:"
    echo "  status    - Check how many users need affiliate codes"
    echo "  generate  - Generate codes for all users without one"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  API_URL                   - Base URL of your API (default: http://localhost:3000)"
    echo "  AFFILIATE_BATCH_SECRET    - Admin secret for authentication"
    echo ""
    echo "Examples:"
    echo "  # Check status"
    echo "  ./scripts/generate-affiliate-codes.sh status"
    echo ""
    echo "  # Generate codes"
    echo "  ./scripts/generate-affiliate-codes.sh generate"
    echo ""
    echo "  # Use custom API URL"
    echo "  API_URL=https://bullmoney.online ./scripts/generate-affiliate-codes.sh status"
else
    echo "❌ Unknown command: $command"
    echo "Run './scripts/generate-affiliate-codes.sh help' for usage"
    exit 1
fi
