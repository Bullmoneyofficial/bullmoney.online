#!/bin/bash
# Simple Push Notification Setup Script
# Run this once to set up everything

echo "🚀 BullMoney Push Notifications Setup"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "   Copy .env.example to .env.local first:"
    echo "   cp .env.example .env.local"
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# These are the VAPID keys generated for you
PUBLIC_KEY="BAvJUkJ7Wb5MnRJYvq61Pao2bV_4AWf8_g2NRpei4_nYw-t1a2BfwdcT5Ruuhe3gPRdmXenaYivFp_cOgksRqhg"
PRIVATE_KEY="z2aL2AIwbisEA0LV_YMiX4Nz9M0_4dcTxjYUOAb4dCo"

echo "🔑 VAPID Keys (ONE pair for entire app):"
echo "   Public:  ${PUBLIC_KEY:0:30}..."
echo "   Private: ${PRIVATE_KEY:0:30}..."
echo ""

# Check if keys already set
if grep -q "BAvJUkJ7Wb5MnRJYvq61Pao2bV_4AWf8" .env.local; then
    echo "✅ VAPID keys already set in .env.local"
else
    echo "📝 Adding VAPID keys to .env.local..."

    # Update .env.local with real keys
    if grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY=" .env.local; then
        # Update existing
        sed -i.bak "s|NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*|NEXT_PUBLIC_VAPID_PUBLIC_KEY=$PUBLIC_KEY|g" .env.local
        sed -i.bak "s|VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=$PRIVATE_KEY|g" .env.local
        rm .env.local.bak 2>/dev/null
    else
        # Add new
        echo "" >> .env.local
        echo "# Push Notifications (auto-generated)" >> .env.local
        echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=$PUBLIC_KEY" >> .env.local
        echo "VAPID_PRIVATE_KEY=$PRIVATE_KEY" >> .env.local
        echo "VAPID_SUBJECT=mailto:admin@bullmoney.com" >> .env.local
    fi

    echo "✅ VAPID keys added to .env.local"
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Make sure Supabase tables exist (run SQL in Supabase):"
echo "   → database/push_notifications_schema.sql"
echo ""
echo "2. Set same VAPID keys in Vercel/Render:"
echo "   NEXT_PUBLIC_VAPID_PUBLIC_KEY=$PUBLIC_KEY"
echo "   VAPID_PRIVATE_KEY=$PRIVATE_KEY"
echo ""
echo "3. Deploy and test:"
echo "   vercel --prod"
echo "   curl -X POST https://yourdomain.com/api/push/test"
echo ""
