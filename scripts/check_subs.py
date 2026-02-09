#!/usr/bin/env python3
"""Quick check for active push subscriptions"""
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
from supabase import create_client
sb = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL",""), os.getenv("SUPABASE_SERVICE_ROLE_KEY","") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY",""))
r = sb.table("push_subscriptions").select("endpoint, is_active, created_at").eq("is_active", True).execute()
subs = r.data or []
print(f"Active subs: {len(subs)}")
for s in subs:
    print(f"  ...{s['endpoint'][-30:]}  created={s['created_at'][:19]}")
if not subs:
    print("No active subscribers — visit localhost:3000 and allow notifications!")
