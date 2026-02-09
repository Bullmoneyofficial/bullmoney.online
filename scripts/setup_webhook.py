#!/usr/bin/env python3
"""Set up Telegram webhook for INSTANT notifications"""
import os, sys, requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
token = os.getenv("TELEGRAM_BOT_TOKEN", "")

if not token:
    print("❌ TELEGRAM_BOT_TOKEN not set")
    sys.exit(1)

# Production domain
DOMAIN = "www.bullmoney.shop"
WEBHOOK_URL = f"https://{DOMAIN}/api/telegram/webhook"

action = sys.argv[1] if len(sys.argv) > 1 else "setup"

if action == "info":
    info = requests.get(f"https://api.telegram.org/bot{token}/getWebhookInfo").json()
    result = info.get("result", {})
    print(f"Webhook URL: {result.get('url', '(none)')}")
    print(f"Pending updates: {result.get('pending_update_count', 0)}")
    print(f"Last error: {result.get('last_error_message', '(none)')}")
    print(f"Last error date: {result.get('last_error_date', '(none)')}")
    print(f"Max connections: {result.get('max_connections', '?')}")
    print(f"Allowed updates: {result.get('allowed_updates', [])}")

elif action == "setup":
    print(f"Setting webhook to: {WEBHOOK_URL}")
    
    # First delete any existing webhook
    requests.get(f"https://api.telegram.org/bot{token}/deleteWebhook?drop_pending_updates=false")
    
    # Set new webhook with allowed_updates filter
    r = requests.get(
        f"https://api.telegram.org/bot{token}/setWebhook",
        params={
            "url": WEBHOOK_URL,
            "allowed_updates": '["channel_post","edited_channel_post","message"]',
            "max_connections": 40,
        }
    )
    data = r.json()
    if data.get("ok"):
        print(f"✅ Webhook set! Telegram will now POST instantly to {WEBHOOK_URL}")
        print(f"   Response: {data.get('description','')}")
    else:
        print(f"❌ Failed: {data.get('description','unknown error')}")
    
    # Verify
    info = requests.get(f"https://api.telegram.org/bot{token}/getWebhookInfo").json()
    result = info.get("result", {})
    print(f"\nVerification:")
    print(f"  URL: {result.get('url','')}")
    print(f"  Pending: {result.get('pending_update_count', 0)}")

elif action == "delete":
    r = requests.get(f"https://api.telegram.org/bot{token}/deleteWebhook?drop_pending_updates=false")
    data = r.json()
    print(f"Webhook deleted: {data.get('ok', False)}")
    print(f"  {data.get('description','')}")

else:
    print("Usage: python setup_webhook.py [setup|info|delete]")
