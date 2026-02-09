#!/usr/bin/env python3
"""Deep Telegram diagnostic — check bot permissions and channel access"""
import requests, os, json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
token = os.getenv("TELEGRAM_BOT_TOKEN", "")

# 1. Get ALL updates with full detail
print("=== ALL UPDATES (raw) ===")
r = requests.get(
    f"https://api.telegram.org/bot{token}/getUpdates?limit=10&timeout=2",
    timeout=10
)
data = r.json()
for u in data.get("result", []):
    print(json.dumps(u, indent=2, ensure_ascii=False)[:500])
    print("---")

# 2. Check the specific channels
channels = ["@bullmoneywebsite", "@bullmoneyfx", "@bullmoneyshop"]
print("\n=== CHANNEL ACCESS CHECK ===")
for ch in channels:
    try:
        r2 = requests.get(f"https://api.telegram.org/bot{token}/getChat?chat_id={ch}", timeout=5)
        info = r2.json()
        if info.get("ok"):
            chat = info["result"]
            print(f"  {ch}: {chat.get('title','?')} (type: {chat.get('type','?')}, id: {chat.get('id','?')})")
        else:
            print(f"  {ch}: FAILED - {info.get('description','unknown error')}")
    except Exception as e:
        print(f"  {ch}: ERROR - {e}")

# 3. Check bot membership in channels
print("\n=== BOT MEMBERSHIP CHECK ===")
bot_r = requests.get(f"https://api.telegram.org/bot{token}/getMe")
bot_id = bot_r.json().get("result", {}).get("id")
print(f"Bot ID: {bot_id}")

for ch in channels:
    try:
        r3 = requests.get(f"https://api.telegram.org/bot{token}/getChatMember?chat_id={ch}&user_id={bot_id}", timeout=5)
        member = r3.json()
        if member.get("ok"):
            status = member["result"].get("status", "?")
            print(f"  {ch}: status = {status}")
        else:
            print(f"  {ch}: NOT A MEMBER - {member.get('description','?')}")
    except Exception as e:
        print(f"  {ch}: ERROR - {e}")
