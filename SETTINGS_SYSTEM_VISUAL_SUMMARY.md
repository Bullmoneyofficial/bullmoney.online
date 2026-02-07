# 🎯 Dashboard Settings System - Visual Summary

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ QuotesSection    │  │ NewsSection      │  │ TelegramSect │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────┤ │
│  │ • Auto Refresh   │  │ • Auto Refresh   │  │ • Auto Refre │ │
│  │ • Alert Button   │  │ • Alert Button   │  │ • Alert Butt │ │
│  │ • Filter Menu    │  │ • Priority Menu  │  │ • Group Filt │ │
│  │ • Watchlist      │  │ • Fetch Timer    │  │ • Notify Set │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
└───────────┼─────────────────────┼────────────────────┼─────────┘
            │                     │                    │
            └─────────────────────┴────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │  useDashboardPreferences   │
                    │        (React Hook)        │
                    ├────────────────────────────┤
                    │ • Load preferences         │
                    │ • Auto-save changes        │
                    │ • Manage sections          │
                    │ • localStorage backup      │
                    └──────────┬─────────────────┘
                               │
                               ├──────────┬──────────────┐
                               │          │              │
                ┌──────────────▼──┐       │   ┌─────────▼─────────┐
                │ API: GET /prefs │       │   │ API: POST /prefs  │
                ├─────────────────┤       │   ├───────────────────┤
                │ • Auth check    │       │   │ • Auth check      │
                │ • Fetch from DB │       │   │ • Validate data   │
                │ • Return JSON   │       │   │ • Save to DB      │
                └────────┬────────┘       │   └─────────┬─────────┘
                         │                │             │
                         └────────────────┴─────────────┘
                                          │
                        ┌─────────────────▼────────────────┐
                        │   PostgreSQL (Supabase)          │
                        ├──────────────────────────────────┤
                        │  recruits.dashboard_preferences  │
                        │         (JSONB column)           │
                        ├──────────────────────────────────┤
                        │ {                                │
                        │   quotes: {...},                 │
                        │   news: {...},                   │
                        │   telegram: {...},               │
                        │   watchlist: [...]               │
                        │ }                                │
                        └──────────────────────────────────┘
```

---

## Data Flow

### 1. User Opens Settings Modal
```
User clicks ⚙️ → UnifiedSettingsModal opens → Displays preferences from hook
```

### 2. User Changes Setting
```
Toggle switch → updateQuotesPrefs() → Hook updates state → Auto-saves to API
                                                         ↓
                                              localStorage backup ← Fallback
```

### 3. Section Auto-Refresh
```
Component mounts → useEffect reads preferences → Sets interval timer
                                                       ↓
Timer fires → Fetch data from API → Update component state → Show notification?
                                                                      ↓
                                              preferences.notifications === true?
                                                      ↓                    ↓
                                                    Yes                   No
                                                      ↓                    ↓
                                              showToast(...)        Skip notification
```

---

## Settings Structure

```typescript
{
  quotes: {
    autoRefresh: boolean,        // Enable/disable auto-refresh
    refreshInterval: number,     // 10000-120000ms (10s-2min)
    notifications: boolean,      // Show price alerts
    soundEnabled: boolean,       // Play alert sounds
    category: string            // Filter: 'all', 'stocks', 'crypto', 'forex'
  },
  
  news: {
    autoRefresh: boolean,        // Enable/disable auto-refresh
    refreshInterval: number,     // 15000-180000ms (15s-3min) [Display]
    pullInterval: number,        // 60000-1800000ms (1min-30min) [Fetch]
    notifications: boolean,      // Show news alerts
    soundEnabled: boolean,       // Play alert sounds
    priority: string            // Filter: 'all', 'high', 'critical'
  },
  
  telegram: {
    autoRefresh: boolean,        // Enable/disable auto-refresh
    refreshInterval: number,     // 15000-150000ms (15s-2.5min)
    notifications: boolean,      // Show signal alerts
    soundEnabled: boolean,       // Play alert sounds
    enabledGroups: string[],    // ['vip', 'free', 'signals', 'analysis']
    notifyGroups: string[],     // Which groups trigger notifications
    visibility: string          // Filter: 'all', 'vip-only', 'free-only'
  },
  
  watchlist: string[]           // ['BTC', 'ETH', 'AAPL', ...]
}
```

---

## File Inventory

### ✅ Created Files
| File | Purpose | Status |
|------|---------|--------|
| `/sql/dashboard_preferences.sql` | Database migration | Ready to run |
| `/app/api/dashboard/preferences/route.ts` | API endpoints (GET/POST) | Complete |
| `/hooks/useDashboardPreferences.ts` | React preference hook | Complete |
| `/IMPLEMENTATION_NEXT_STEPS.md` | Step-by-step guide | Complete |
| `/ENHANCED_SETTINGS_MODAL.tsx` | Reference component | Complete |

### ✏️ Modified Files
| File | Changes | Status |
|------|---------|--------|
| `PageSections.tsx` | • Added useDashboardPreferences import<br>• Replaced UnifiedSettingsModal | Complete |

### 🔄 Pending Modifications
| File | Required Changes |
|------|------------------|
| `PageSections.tsx` | • Add auto-refresh to QuotesSection<br>• Add auto-refresh to BreakingNewsSection<br>• Add auto-refresh to TelegramSection<br>• Replace useWatchlist with SQL version<br>• Wire alert buttons to preferences |

---

## Feature Matrix

| Feature | Settings Modal | API | Hook | Section Integration |
|---------|---------------|-----|------|---------------------|
| **Auto Refresh** | ✅ Toggle switches | ✅ Save/load | ✅ State management | 🔄 Add useEffect timers |
| **Refresh Intervals** | ✅ Range sliders | ✅ Save/load | ✅ State management | 🔄 Use in setInterval |
| **Notifications** | ✅ Toggle switches | ✅ Save/load | ✅ State management | 🔄 Wire showToast |
| **Sound Alerts** | ✅ Toggle switches | ✅ Save/load | ✅ State management | 🔄 Pass to showToast |
| **News Pull Interval** | ✅ Range slider | ✅ Save/load | ✅ State management | 🔄 Fetch timer |
| **Telegram Groups** | ✅ Checkboxes | ✅ Save/load | ✅ State management | 🔄 Filter signals |
| **Notify Groups** | ✅ Checkboxes | ✅ Save/load | ✅ State management | 🔄 Notification logic |
| **Watchlist** | ❌ N/A (in modal) | ✅ Save/load | ✅ State management | 🔄 Replace useWatchlist |

**Legend:**
- ✅ Complete
- 🔄 Pending
- ❌ Not applicable

---

## UI Components

### Enhanced Settings Modal Features

```
┌─────────────────────────────────────────────────┐
│ ⚙️  Dashboard Settings              [Saving...] │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📊 Market Quotes                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⟳ Auto Refresh                    [●─────] │ │
│ │ ⏱️ Refresh Interval        30s  [■■■□□□□□] │ │
│ │ 🔔 Price Alerts                   [─────●] │ │
│ │ 🔊 Sound Alerts                   [─────●] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📻 Breaking News                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⟳ Auto Refresh                    [●─────] │ │
│ │ ⏱️ Display Refresh     30s  [■■■□□□□□]     │ │
│ │ 🕐 Fetch New Articles  5min [■■■■□□□□]     │ │
│ │ 🔔 News Alerts                    [●─────] │ │
│ │ 🔊 Sound Alerts                   [●─────] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 👥 Community Signals                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⟳ Auto Refresh                    [●─────] │ │
│ │ ⏱️ Refresh Interval        45s  [■■■■□□□□] │ │
│ │                                             │ │
│ │ Enabled Groups                              │ │
│ │ ⚡ VIP Signals            [✓]               │ │
│ │ 👥 Free Signals           [✓]               │ │
│ │ 🔔 General Signals        [ ]               │ │
│ │ 📊 Market Analysis        [ ]               │ │
│ │                                             │ │
│ │ Notify From Groups                          │ │
│ │ 🔔 VIP Signals            [✓]               │ │
│ │ 🔔 Free Signals           [ ]               │ │
│ │ 🔔 General Signals        [ ]               │ │
│ │ 🔔 Market Analysis        [ ]               │ │
│ │                                             │ │
│ │ 🔔 Signal Alerts                  [●─────] │ │
│ │ 🔊 Sound Alerts                   [─────●] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│ Settings saved automatically        [Done]      │
└─────────────────────────────────────────────────┘
```

---

## Timeline

### Phase 1: Foundation ✅ COMPLETE
- [x] Database schema (SQL migration)
- [x] API endpoints (GET/POST with auth)
- [x] React hook (state management)
- [x] Enhanced settings modal (full UI)

### Phase 2: Integration 🔄 IN PROGRESS
- [ ] Run SQL migration in Supabase
- [ ] Add auto-refresh to QuotesSection
- [ ] Add auto-refresh to BreakingNewsSection
- [ ] Add auto-refresh to TelegramSection
- [ ] Replace useWatchlist with SQL-backed version
- [ ] Wire alert buttons to preferences
- [ ] Test all functionality

### Phase 3: Polish 📋 PLANNED
- [ ] Add loading states during preference fetch
- [ ] Add error handling for failed saves
- [ ] Add success toast on preference save
- [ ] Add "Reset to defaults" button
- [ ] Add export/import settings feature
- [ ] Performance optimization (debounce sliders)

---

## Quick Start Commands

```bash
# 1. Run SQL migration
psql -h [supabase-host] -U postgres -d postgres < sql/dashboard_preferences.sql

# OR in Supabase Dashboard:
# Go to SQL Editor → New Query → Paste contents of /sql/dashboard_preferences.sql → Run

# 2. Test API locally
npm run dev

# 3. Test API endpoint
curl http://localhost:3000/api/dashboard/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Build production
npm run build
npm start
```

---

## Key Integration Points

### 1. Import the Hook
```typescript
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
```

### 2. Destructure in Component
```typescript
const { preferences, updateQuotesPrefs, updateNewsPrefs, updateTelegramPrefs } = useDashboardPreferences();
```

### 3. Add Auto-Refresh Timer
```typescript
useEffect(() => {
  if (!preferences.quotes.autoRefresh) return;
  
  const fetchData = async () => { /* ... */ };
  fetchData();
  
  const interval = setInterval(fetchData, preferences.quotes.refreshInterval);
  return () => clearInterval(interval);
}, [preferences.quotes.autoRefresh, preferences.quotes.refreshInterval]);
```

### 4. Wire Alert Button
```typescript
<button onClick={() => updateQuotesPrefs({ notifications: !preferences.quotes.notifications })}>
  <Bell className={preferences.quotes.notifications ? 'text-blue-400' : 'text-white/60'} />
</button>
```

---

## Success Metrics

How to know it's working:

✅ **Settings persist across page reloads**
- Open settings → Change value → Refresh page → Value still changed

✅ **Auto-refresh works at correct intervals**
- Change interval to 10s → Observe network tab → See requests every 10s

✅ **Notifications appear when enabled**
- Enable notifications → Wait for price change → See toast notification

✅ **Group filtering works**
- Uncheck "VIP Signals" → VIP messages disappear from feed

✅ **Alert buttons toggle preferences**
- Click bell icon → Icon color changes → Toast shows status

✅ **Watchlist persists to database**
- Add symbol → Reload page → Symbol still in watchlist

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| "Cannot read property 'autoRefresh'" | Hook didn't load preferences yet. Add loading check. |
| Settings not saving | Check Network tab for 401 (auth issue) or 500 (server error) |
| Auto-refresh not working | Verify `autoRefresh` is `true` in preferences |
| Notifications not showing | Check `preferences.quotes.notifications` is `true` |
| Watchlist not persisting | Verify SQL migration ran successfully |
| Sliders not updating intervals | Check `updateQuotesPrefs` is being called |
| Groups not filtering | Verify `enabledGroups` array includes group IDs |
| API returns null | User might not be authenticated - check auth token |

---

## Next Steps

👉 **Start Here:** [IMPLEMENTATION_NEXT_STEPS.md](IMPLEMENTATION_NEXT_STEPS.md)

That file has:
- Step-by-step integration guide
- Copy-paste code snippets
- Testing checklist
- Troubleshooting tips

**Estimated time:** 30-45 minutes
**Difficulty:** Medium
**Dependencies:** SQL migration must run first

🚀 **Ready to go!**
