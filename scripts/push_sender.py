#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║         BULLMONEY PUSH NOTIFICATION ENGINE v1.0                     ║
║         Sends REAL device push notifications (lock screen, bar)     ║
║         Polls Telegram → Reads Supabase subscribers → Web Push      ║
║                                                                      ║
║  Usage:                                                              ║
║    python scripts/push_sender.py              # Run daemon (polls)   ║
║    python scripts/push_sender.py --test       # Send test push       ║
║    python scripts/push_sender.py --status     # Check system status  ║
║    python scripts/push_sender.py --once       # Poll once and exit   ║
╚══════════════════════════════════════════════════════════════════════╝

This script sends REAL push notifications that appear on:
  ✅ Android lock screen & notification bar
  ✅ iOS lock screen (Safari PWA, iOS 16.4+)
  ✅ Desktop notification center (Chrome, Firefox, Edge, Safari)
  ✅ Works even when the browser/app is CLOSED

It replaces the unreliable Vercel cron with a persistent background process.
"""

import os
import sys
import json
import time
import signal
import logging
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional

# ─── Load .env.local before anything else ───────────────────────────
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path, override=True)
        print(f"✅ Loaded environment from {env_path}")
    else:
        print(f"⚠️  No .env.local found at {env_path}")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment")

import requests

try:
    from pywebpush import webpush, WebPushException
except ImportError:
    print("❌ pywebpush not installed. Run: pip install pywebpush")
    sys.exit(1)

try:
    from supabase import create_client, Client as SupabaseClient
except ImportError:
    print("❌ supabase not installed. Run: pip install supabase")
    sys.exit(1)


# ─── CONFIGURATION ──────────────────────────────────────────────────

VAPID_PUBLIC_KEY = os.getenv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@bullmoney.com")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Polling interval in seconds (how often to check for new Telegram messages)
POLL_INTERVAL = int(os.getenv("PUSH_POLL_INTERVAL", "30"))

# Telegram channels to monitor (keyed by chat_username OR chat_id string)
CHANNEL_MAP = {
    "bullmoneywebsite":  {"name": "FREE TRADES",      "channel": "trades", "priority": "high"},
    "bullmoneyfx":       {"name": "LIVESTREAMS",       "channel": "main",   "priority": "normal"},
    "bullmoneyshop":     {"name": "BULLMONEY NEWS",    "channel": "shop",   "priority": "normal"},
    "-1003442830926":    {"name": "VIP TRADES",        "channel": "trades", "priority": "high"},
}

# ─── LOGGING ─────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("push_sender")


# ─── SUPABASE CLIENT ────────────────────────────────────────────────

_supabase: Optional[SupabaseClient] = None

def get_supabase() -> SupabaseClient:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


# ─── TELEGRAM POLLING ───────────────────────────────────────────────

_last_update_id = 0


def poll_telegram() -> list[dict]:
    """
    Poll Telegram Bot API for new channel_post updates.
    Returns list of new messages with metadata.
    """
    global _last_update_id

    if not TELEGRAM_BOT_TOKEN:
        log.warning("TELEGRAM_BOT_TOKEN not set — skipping Telegram poll")
        return []

    url = (
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        f"?allowed_updates=[\"channel_post\",\"edited_channel_post\"]"
        f"&limit=100"
        f"&timeout=5"
    )
    if _last_update_id > 0:
        url += f"&offset={_last_update_id + 1}"

    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
    except Exception as e:
        log.error(f"Telegram API error: {e}")
        return []

    if not data.get("ok") or not data.get("result"):
        return []

    messages = []
    for update in data["result"]:
        _last_update_id = max(_last_update_id, update.get("update_id", 0))

        post = update.get("channel_post") or update.get("edited_channel_post")
        if not post:
            continue

        text = post.get("text") or post.get("caption") or ""
        has_media = bool(post.get("photo") or post.get("video") or post.get("document") or post.get("animation"))
        chat_title = (post.get("chat") or {}).get("title", "")
        chat_username = (post.get("chat") or {}).get("username", "")
        msg_id = post.get("message_id")
        msg_date = post.get("date", 0)

        if not text and not has_media:
            continue

        # Match to our channel map (try username first, then chat_id)
        chat_id_str = str((post.get("chat") or {}).get("id", ""))
        channel_info = (
            CHANNEL_MAP.get(chat_username)
            or CHANNEL_MAP.get(chat_id_str)
            or {"name": chat_title or "BullMoney", "channel": "trades", "priority": "high"}
        )

        messages.append({
            "telegram_message_id": msg_id,
            "message": text or ("📷 Media post" if has_media else ""),
            "has_media": has_media,
            "chat_title": chat_title,
            "chat_username": chat_username,
            "channel_info": channel_info,
            "created_at": datetime.fromtimestamp(msg_date, tz=timezone.utc).isoformat() if msg_date else datetime.now(timezone.utc).isoformat(),
        })

    # Confirm updates processed
    if _last_update_id > 0 and messages:
        try:
            requests.get(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
                f"?offset={_last_update_id + 1}&limit=1",
                timeout=5,
            )
        except Exception:
            pass

    return messages


# ─── SAVE MESSAGES TO SUPABASE ──────────────────────────────────────

def save_messages_to_db(messages: list[dict]) -> list[dict]:
    """
    Save new Telegram messages to Supabase vip_messages table.
    Returns only truly NEW messages (not already notified).
    """
    if not messages:
        return []

    supabase = get_supabase()
    new_messages = []

    for msg in messages:
        # Check if this message already exists and was already notified
        existing = supabase.table("vip_messages") \
            .select("id, notification_sent") \
            .eq("telegram_message_id", msg["telegram_message_id"]) \
            .execute()

        if existing.data:
            # Already exists — skip if already notified
            if existing.data[0].get("notification_sent"):
                continue
            # Exists but not notified — include it
            msg["db_id"] = existing.data[0]["id"]
            new_messages.append(msg)
            continue

        # Insert new message
        result = supabase.table("vip_messages").insert({
            "telegram_message_id": msg["telegram_message_id"],
            "message": msg["message"],
            "has_media": msg.get("has_media", False),
            "chat_id": msg.get("chat_username", ""),
            "chat_title": msg.get("chat_title", ""),
            "created_at": msg["created_at"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "notification_sent": False,
        }).execute()

        if result.data:
            msg["db_id"] = result.data[0]["id"]
            new_messages.append(msg)

    return new_messages


# ─── GET PUSH SUBSCRIBERS ───────────────────────────────────────────

def get_subscribers(channel: str = "trades") -> list[dict]:
    """
    Fetch all active push subscribers from Supabase.
    Optionally filter by channel preference.
    """
    supabase = get_supabase()
    channel_col = f"channel_{channel}"

    query = supabase.table("push_subscriptions") \
        .select("endpoint, p256dh, auth") \
        .eq("is_active", True)

    # Filter by channel preference
    try:
        query = query.eq(channel_col, True)
    except Exception:
        pass  # Column might not exist — send to all

    result = query.execute()
    return result.data or []


# ─── SEND PUSH NOTIFICATION ─────────────────────────────────────────

def send_push(subscriber: dict, payload: dict) -> bool:
    """
    Send a single web push notification to a subscriber.
    Returns True if successful, False if failed.
    """
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        log.error("VAPID keys not configured!")
        return False

    subscription_info = {
        "endpoint": subscriber["endpoint"],
        "keys": {
            "p256dh": subscriber["p256dh"],
            "auth": subscriber["auth"],
        },
    }

    try:
        # Extract the origin (scheme + host) from the endpoint for VAPID aud claim
        from urllib.parse import urlparse
        parsed = urlparse(subscriber["endpoint"])
        aud = f"{parsed.scheme}://{parsed.netloc}"

        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": VAPID_SUBJECT,
                "aud": aud,
            },
            ttl=86400,  # 24 hours
        )
        return True
    except WebPushException as e:
        status_code = getattr(e, "response", None)
        if status_code and hasattr(status_code, "status_code"):
            code = status_code.status_code
            if code in (404, 410):
                # Subscription expired — deactivate AND delete to keep DB clean
                try:
                    supabase = get_supabase()
                    supabase.table("push_subscriptions") \
                        .delete() \
                        .eq("endpoint", subscriber["endpoint"]) \
                        .execute()
                    log.info(f"🗑️  Removed expired subscription: ...{subscriber['endpoint'][-30:]}")
                except Exception:
                    pass
                return False
            elif code == 403:
                log.error(f"Push 403 Forbidden — VAPID key mismatch! Subscription was created with different VAPID keys.")
                log.error(f"  Users must re-subscribe. Run with --cleanup to purge all dead subscriptions.")
                return False
            elif code == 401:
                log.error(f"Push 401 Unauthorized — VAPID signature invalid. Check VAPID_PRIVATE_KEY in .env.local")
                return False
        log.error(f"Push failed ({getattr(status_code, 'status_code', '?')}): {e}")
        return False
    except Exception as e:
        log.error(f"Push error: {e}")
        return False


def send_push_to_all(subscribers: list[dict], payload: dict) -> tuple[int, int]:
    """
    Send push notification to all subscribers.
    Returns (sent_count, failed_count).
    """
    sent = 0
    failed = 0

    for sub in subscribers:
        if send_push(sub, payload):
            sent += 1
        else:
            failed += 1

    return sent, failed


# ─── MARK MESSAGES AS NOTIFIED ──────────────────────────────────────

def mark_as_notified(message_ids: list):
    """Mark messages in Supabase as having had notifications sent."""
    if not message_ids:
        return

    supabase = get_supabase()
    for msg_id in message_ids:
        try:
            supabase.table("vip_messages") \
                .update({"notification_sent": True}) \
                .eq("id", msg_id) \
                .execute()
        except Exception as e:
            log.error(f"Failed to mark message {msg_id} as notified: {e}")


# ─── MAIN NOTIFICATION CYCLE ────────────────────────────────────────

def run_notification_cycle() -> dict:
    """
    One full notification cycle:
    1. Poll Telegram for new messages
    2. Save to database
    3. Get subscribers
    4. Send push notifications
    5. Mark as notified

    Returns stats dict.
    """
    stats = {
        "telegram_messages": 0,
        "new_messages": 0,
        "subscribers": 0,
        "sent": 0,
        "failed": 0,
        "expired": 0,
    }

    # Step 1: Poll Telegram
    log.info("📡 Polling Telegram for new messages...")
    messages = poll_telegram()
    stats["telegram_messages"] = len(messages)

    if messages:
        log.info(f"📨 Found {len(messages)} new Telegram messages")
    else:
        log.info("📭 No new messages")
        return stats

    # Step 2: Save to database & filter already-notified
    new_messages = save_messages_to_db(messages)
    stats["new_messages"] = len(new_messages)

    if not new_messages:
        log.info("✅ All messages already notified")
        return stats

    log.info(f"🆕 {len(new_messages)} messages need notifications")

    # Step 3-4: Send notifications for each message
    notified_ids = []

    for msg in new_messages:
        ch = msg.get("channel_info", {})
        channel = ch.get("channel", "trades")
        channel_name = ch.get("name", "BullMoney")
        priority = ch.get("priority", "high")

        # Get subscribers for this channel
        subscribers = get_subscribers(channel)
        stats["subscribers"] = max(stats["subscribers"], len(subscribers))

        if not subscribers:
            log.warning(f"⚠️  No active subscribers for channel: {channel}")
            continue

        # Build the push payload (matches sw.js format exactly)
        body_text = msg["message"][:120] if msg["message"] else "New trade signal — tap to view"
        payload = {
            "title": f"BullMoney {channel_name}",
            "body": body_text,
            "icon": "/bullmoney-logo.png",
            "badge": "/B.png",
            "tag": f"trade-{channel}-{msg['telegram_message_id']}",
            "url": f"/?channel={channel}&from=push",
            "channel": channel,
            "requireInteraction": priority == "high",
        }

        log.info(f"📤 Sending '{channel_name}' notification to {len(subscribers)} devices...")
        sent, failed = send_push_to_all(subscribers, payload)
        stats["sent"] += sent
        stats["failed"] += failed

        log.info(f"   ✅ Sent: {sent}  ❌ Failed: {failed}")

        if msg.get("db_id"):
            notified_ids.append(msg["db_id"])

    # Step 5: Mark as notified
    mark_as_notified(notified_ids)

    return stats


# ─── DAEMON MODE ─────────────────────────────────────────────────────

_running = True


def signal_handler(signum, frame):
    global _running
    log.info("\n🛑 Shutting down push sender...")
    _running = False


def run_daemon():
    """Run continuous polling loop."""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    log.info("=" * 60)
    log.info("🐂 BULLMONEY PUSH NOTIFICATION ENGINE v1.0")
    log.info("=" * 60)
    log.info(f"📡 Polling every {POLL_INTERVAL}s")
    log.info(f"🔑 VAPID key: {'✅ configured' if VAPID_PUBLIC_KEY else '❌ MISSING'}")
    log.info(f"🗄️  Supabase:  {'✅ configured' if SUPABASE_URL else '❌ MISSING'}")
    log.info(f"🤖 Telegram:  {'✅ configured' if TELEGRAM_BOT_TOKEN else '❌ MISSING'}")
    log.info("=" * 60)

    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        log.error("❌ Cannot start: VAPID keys not configured")
        log.error("   Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.local")
        sys.exit(1)

    cycle_count = 0

    while _running:
        cycle_count += 1
        log.info(f"\n{'─' * 40}")
        log.info(f"🔄 Cycle #{cycle_count} at {datetime.now().strftime('%H:%M:%S')}")

        try:
            stats = run_notification_cycle()

            if stats["sent"] > 0:
                log.info(f"🎉 Cycle complete: {stats['sent']} notifications sent!")
            elif stats["new_messages"] > 0:
                log.info(f"⚠️  Cycle complete: {stats['new_messages']} messages but 0 sent (no subscribers?)")
            else:
                log.info("💤 No new messages")

        except Exception as e:
            log.error(f"❌ Cycle error: {e}", exc_info=True)

        # Wait for next cycle
        for _ in range(POLL_INTERVAL):
            if not _running:
                break
            time.sleep(1)

    log.info("👋 Push sender stopped")


# ─── TEST MODE ───────────────────────────────────────────────────────

def run_test():
    """Send a test push notification to all active subscribers."""
    log.info("🧪 PUSH NOTIFICATION TEST")
    log.info("=" * 40)

    subscribers = get_subscribers("trades")
    log.info(f"📱 Found {len(subscribers)} active subscriber(s)")

    if not subscribers:
        log.warning("❌ No active subscribers found!")
        log.info("   Users need to enable notifications on bullmoney.com first")
        log.info("   They click the 🔔 bell icon and allow notifications")
        return

    payload = {
        "title": "BullMoney Test",
        "body": "✅ Push notifications are working! You'll get real trade alerts on your lock screen.",
        "icon": "/bullmoney-logo.png",
        "badge": "/B.png",
        "tag": f"test-{int(time.time())}",
        "url": "/",
        "channel": "trades",
        "requireInteraction": False,
    }

    log.info(f"📤 Sending test notification to {len(subscribers)} device(s)...")
    sent, failed = send_push_to_all(subscribers, payload)

    log.info(f"\n{'=' * 40}")
    log.info(f"✅ Sent: {sent}")
    log.info(f"❌ Failed: {failed}")

    if sent > 0:
        log.info("\n🎉 Check your device — you should see the notification!")
        log.info("   It appears on your lock screen and notification bar")
    else:
        log.info("\n⚠️  No notifications sent. Common issues:")
        log.info("   1. VAPID keys mismatch — regenerate with: npx web-push generate-vapid-keys")
        log.info("   2. Subscriptions expired — users need to re-subscribe")
        log.info("   3. Browser blocked notifications for the site")


# ─── STATUS CHECK ────────────────────────────────────────────────────

def check_status():
    """Check the notification system status."""
    log.info("📊 PUSH NOTIFICATION SYSTEM STATUS")
    log.info("=" * 50)

    # Config check
    checks = {
        "VAPID Public Key":   bool(VAPID_PUBLIC_KEY),
        "VAPID Private Key":  bool(VAPID_PRIVATE_KEY),
        "Supabase URL":       bool(SUPABASE_URL),
        "Supabase Key":       bool(SUPABASE_KEY),
        "Telegram Bot Token": bool(TELEGRAM_BOT_TOKEN),
    }

    for name, ok in checks.items():
        icon = "✅" if ok else "❌"
        log.info(f"  {icon} {name}")

    all_ok = all(checks.values())
    if not all_ok:
        log.error("\n❌ Some configuration is missing! Check .env.local")
        return

    # Database check
    log.info("\n📡 Database check...")
    try:
        supabase = get_supabase()

        # Count active subscribers
        result = supabase.table("push_subscriptions") \
            .select("endpoint", count="exact") \
            .eq("is_active", True) \
            .execute()
        sub_count = result.count if hasattr(result, 'count') and result.count is not None else len(result.data or [])
        log.info(f"  📱 Active subscribers: {sub_count}")

        # Count recent messages
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        result = supabase.table("vip_messages") \
            .select("id", count="exact") \
            .gte("created_at", one_hour_ago) \
            .execute()
        msg_count = result.count if hasattr(result, 'count') and result.count is not None else len(result.data or [])
        log.info(f"  💬 Messages (last hour): {msg_count}")

        # Count unnotified messages
        result = supabase.table("vip_messages") \
            .select("id", count="exact") \
            .or_("notification_sent.is.null,notification_sent.eq.false") \
            .execute()
        unnotified = result.count if hasattr(result, 'count') and result.count is not None else len(result.data or [])
        log.info(f"  🔔 Unnotified messages: {unnotified}")

    except Exception as e:
        log.error(f"  ❌ Database error: {e}")

    # Telegram check
    log.info("\n🤖 Telegram check...")
    try:
        resp = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe", timeout=5)
        bot_info = resp.json()
        if bot_info.get("ok"):
            bot = bot_info["result"]
            log.info(f"  ✅ Bot: @{bot.get('username', 'unknown')} ({bot.get('first_name', '')})")
        else:
            log.error(f"  ❌ Bot token invalid: {bot_info.get('description', 'Unknown error')}")
    except Exception as e:
        log.error(f"  ❌ Telegram error: {e}")

    log.info(f"\n{'=' * 50}")
    log.info("To start sending notifications, run:")
    log.info("  python scripts/push_sender.py")
    log.info("\nTo send a test notification:")
    log.info("  python scripts/push_sender.py --test")


# ─── SEND CUSTOM PUSH (for admin/manual use) ────────────────────────

def send_custom(title: str, body: str, channel: str = "trades", url: str = "/"):
    """Send a custom push notification to all subscribers of a channel."""
    log.info(f"📤 Sending custom notification: '{title}'")

    subscribers = get_subscribers(channel)
    if not subscribers:
        log.warning(f"No subscribers for channel: {channel}")
        return

    payload = {
        "title": title,
        "body": body,
        "icon": "/bullmoney-logo.png",
        "badge": "/B.png",
        "tag": f"custom-{int(time.time())}",
        "url": url,
        "channel": channel,
        "requireInteraction": True,
    }

    sent, failed = send_push_to_all(subscribers, payload)
    log.info(f"✅ Sent: {sent}  ❌ Failed: {failed}")


# ─── CLEANUP DEAD SUBSCRIPTIONS ─────────────────────────────────────

def cleanup_subscriptions():
    """
    Test each subscription with a silent push and remove dead ones.
    This purges 410/404 subscriptions that have expired or been revoked.
    """
    log.info("🧹 CLEANUP: Testing all subscriptions...")
    log.info("=" * 50)

    supabase = get_supabase()
    result = supabase.table("push_subscriptions") \
        .select("endpoint, p256dh, auth, is_active, user_agent, created_at") \
        .execute()

    subs = result.data or []
    log.info(f"📱 Total subscriptions in DB: {len(subs)}")

    if not subs:
        log.info("No subscriptions to clean up")
        return

    alive = 0
    dead = 0

    for sub in subs:
        # Send a tiny silent test push
        ok = send_push(sub, {
            "title": "Connection Test",
            "body": "Verifying subscription...",
            "tag": "cleanup-test",
            "silent": True,
        })

        ep_short = sub["endpoint"][-30:]
        ua = (sub.get("user_agent") or "")[:40]

        if ok:
            alive += 1
            log.info(f"  ✅ Alive: ...{ep_short}  ({ua})")
        else:
            dead += 1
            log.info(f"  🗑️  Dead:  ...{ep_short}  ({ua})")
            # Force delete from DB (send_push tries too, but be thorough)
            try:
                supabase.table("push_subscriptions") \
                    .delete() \
                    .eq("endpoint", sub["endpoint"]) \
                    .execute()
            except Exception:
                pass

    log.info(f"\n{'=' * 50}")
    log.info(f"✅ Alive: {alive}")
    log.info(f"🗑️  Removed: {dead}")
    log.info(f"📱 Remaining active: {alive}")


# ─── ENTRY POINT ─────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="BullMoney Push Notification Engine — sends REAL device notifications",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/push_sender.py              # Run daemon (polls Telegram every 30s)
  python scripts/push_sender.py --test       # Send test push to all subscribers
  python scripts/push_sender.py --status     # Check system health
  python scripts/push_sender.py --once       # Run one cycle and exit
  python scripts/push_sender.py --send "🚀 BTC Long Entry" "Entry: 95000, TP: 100000"
        """,
    )
    parser.add_argument("--test", action="store_true", help="Send a test notification")
    parser.add_argument("--status", action="store_true", help="Check system status")
    parser.add_argument("--once", action="store_true", help="Run one poll cycle and exit")
    parser.add_argument("--cleanup", action="store_true", help="Test & remove dead subscriptions")
    parser.add_argument("--send", nargs=2, metavar=("TITLE", "BODY"), help="Send custom notification")
    parser.add_argument("--channel", default="trades", help="Channel for --send (trades/main/shop/vip)")
    parser.add_argument("--interval", type=int, default=None, help="Override poll interval (seconds)")

    args = parser.parse_args()

    global POLL_INTERVAL
    if args.interval:
        POLL_INTERVAL = args.interval

    if args.status:
        check_status()
    elif args.test:
        run_test()
    elif args.once:
        stats = run_notification_cycle()
        log.info(f"📊 Results: {json.dumps(stats, indent=2)}")
    elif args.cleanup:
        cleanup_subscriptions()
    elif args.send:
        send_custom(args.send[0], args.send[1], channel=args.channel)
    else:
        run_daemon()


if __name__ == "__main__":
    main()
