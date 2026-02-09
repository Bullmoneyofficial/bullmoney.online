#!/usr/bin/env python3
"""Quick Telegram diagnostic"""
import requests, os, json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
token = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Bot info
r = requests.get(f"https://api.telegram.org/bot{token}/getMe")
bot = r.json().get("result", {})
print(f"Bot: @{bot.get('username','?')} ({bot.get('first_name','')})")

# Webhook check
r2 = requests.get(f"https://api.telegram.org/bot{token}/getWebhookInfo")
wh = r2.json().get("result", {})
print(f"Webhook URL: {wh.get('url','(none)')}")
print(f"Pending updates: {wh.get('pending_update_count',0)}")
print(f"Last error: {wh.get('last_error_message','(none)')}")

# Get recent updates
print("\n--- Recent Updates ---")
r3 = requests.get(
    f"https://api.telegram.org/bot{token}/getUpdates?limit=10&timeout=3",
    timeout=15
)
updates = r3.json()
print(f"OK: {updates.get('ok')}")
results = updates.get("result", [])
print(f"Count: {len(results)}")
for u in results[:5]:
    post = u.get("channel_post") or u.get("edited_channel_post") or u.get("message") or {}
    chat = post.get("chat", {})
    text = (post.get("text") or post.get("caption") or "")[:100]
    print(f"  [{chat.get('username','?')}] {text[:80]}")

if not results:
    print("\nNo updates. Possible reasons:")
    print("  1. Webhook is set (blocks getUpdates) - need to delete webhook first")
    print("  2. Bot is not added to any channels as admin")
    print("  3. No new messages since last poll")
