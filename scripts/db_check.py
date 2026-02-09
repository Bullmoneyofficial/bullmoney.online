#!/usr/bin/env python3
"""Direct DB check - what's actually in push_subscriptions?"""
import os, json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
from supabase import create_client

sb = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL",""), os.getenv("SUPABASE_SERVICE_ROLE_KEY","") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY",""))

# Get ALL subscriptions
result = sb.table("push_subscriptions").select("endpoint, is_active, user_agent, created_at, channel_trades").execute()
subs = result.data or []
print(f"Total rows: {len(subs)}")
for s in subs:
    ep = s["endpoint"][-40:]
    active = s.get("is_active")
    ua = (s.get("user_agent") or "")[:50]
    trades = s.get("channel_trades")
    created = s.get("created_at", "")[:16]
    print(f"  {'✅' if active else '❌'} ...{ep}  active={active}  trades={trades}  ({created})  {ua}")

# Also try to delete ALL inactive ones
print(f"\nDeleting all inactive subscriptions...")
del_result = sb.table("push_subscriptions").delete().eq("is_active", False).execute()
print(f"Deleted: {len(del_result.data or [])} inactive rows")

# Show remaining
result2 = sb.table("push_subscriptions").select("endpoint, is_active").execute()
print(f"Remaining: {len(result2.data or [])} rows")
