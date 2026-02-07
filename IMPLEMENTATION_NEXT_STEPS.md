# Dashboard Settings Implementation - Next Steps

## ✅ Completed
1. SQL migration schema (`/sql/dashboard_preferences.sql`)
2. API endpoint with authentication (`/app/api/dashboard/preferences/route.ts`)
3. React hook for preferences (`/hooks/useDashboardPreferences.ts`)
4. Enhanced UnifiedSettingsModal with all controls **✨ JUST COMPLETED**

## 🔄 Pending Implementation

### Step 1: Run SQL Migration
```bash
# In Supabase SQL Editor, run:
/sql/dashboard_preferences.sql
```

This adds the `dashboard_preferences` JSONB column to your `recruits` table.

---

### Step 2: Test API Endpoint
```bash
# Test GET request (get preferences)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/dashboard/preferences

# Test POST request (save preferences)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quotes":{"autoRefresh":true}}' \
  https://yourdomain.com/api/dashboard/preferences
```

---

### Step 3: Integrate Auto-Refresh into QuotesSection

**Location:** `PageSections.tsx` - Find the `QuotesSection` component

**Add these hooks at the top of QuotesSection:**
```typescript
const QuotesSection = memo(function QuotesSection() {
  // ⬇️ ADD THESE LINES
  const { preferences } = useDashboardPreferences();
  const { showToast } = useToast();
  
  // Existing state...
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ⬇️ ADD AUTO-REFRESH EFFECT
  useEffect(() => {
    if (!preferences.quotes.autoRefresh) return;
    
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/quotes');
        const data = await response.json();
        setQuotes(data);
        
        // Show notification if enabled
        if (preferences.quotes.notifications) {
          const significantChanges = data.filter(q => Math.abs(q.change) > 5);
          if (significantChanges.length > 0) {
            showToast(
              `${significantChanges.length} significant price movements`,
              'info',
              preferences.quotes.soundEnabled
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
      }
    };
    
    // Initial fetch
    fetchQuotes();
    
    // Set up interval timer
    const interval = setInterval(fetchQuotes, preferences.quotes.refreshInterval);
    
    return () => clearInterval(interval);
  }, [preferences.quotes.autoRefresh, preferences.quotes.refreshInterval, 
      preferences.quotes.notifications, preferences.quotes.soundEnabled, showToast]);
  
  // Rest of component...
});
```

**Wire alert button:**
```typescript
// Find the alert button in QuotesSection header
// REPLACE:
<button onClick={toggleAlerts} className="...">
  <Bell size={14} />
</button>

// WITH:
<button 
  onClick={() => {
    const newState = !preferences.quotes.notifications;
    updateQuotesPrefs({ notifications: newState });
    showToast(
      `Price alerts ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false
    );
  }} 
  className="..."
>
  <Bell 
    size={14} 
    className={preferences.quotes.notifications ? 'text-blue-400' : 'text-white/60'} 
  />
</button>
```

---

### Step 4: Integrate Auto-Refresh into BreakingNewsSection

**Add these to BreakingNewsSection:**
```typescript
const BreakingNewsSection = memo(function BreakingNewsSection() {
  const { preferences } = useDashboardPreferences();
  const { showToast } = useToast();
  
  const [news, setNews] = useState<any[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  
  // ⬇️ NEWS DATA FETCHING (pull interval)
  useEffect(() => {
    if (!preferences.news.autoRefresh) return;
    
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        
        // Apply priority filter from preferences
        const filtered = data.filter(item => {
          if (preferences.news.priority === 'high') {
            return item.priority === 'high' || item.priority === 'critical';
          }
          return true; // Show all if no filter
        });
        
        setNews(filtered);
        
        // Notify about high-priority news
        if (preferences.news.notifications) {
          const critical = filtered.filter(n => n.priority === 'critical');
          if (critical.length > 0) {
            showToast(
              `🚨 ${critical.length} critical news alerts`,
              'error',
              preferences.news.soundEnabled
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };
    
    fetchNews();
    const interval = setInterval(fetchNews, preferences.news.pullInterval);
    
    return () => clearInterval(interval);
  }, [preferences.news.autoRefresh, preferences.news.pullInterval, 
      preferences.news.notifications, preferences.news.soundEnabled, 
      preferences.news.priority, showToast]);
  
  // ⬇️ DISPLAY ROTATION (refresh interval)
  useEffect(() => {
    if (news.length === 0) return;
    
    const interval = setInterval(() => {
      setDisplayIndex(prev => (prev + 1) % news.length);
    }, preferences.news.refreshInterval);
    
    return () => clearInterval(interval);
  }, [news.length, preferences.news.refreshInterval]);
  
  // Rest of component...
});
```

**Wire alert button:**
```typescript
<button 
  onClick={() => {
    const newState = !preferences.news.notifications;
    updateNewsPrefs({ notifications: newState });
    showToast(
      `News alerts ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false
    );
  }}
  className="..."
>
  <Bell 
    size={14} 
    className={preferences.news.notifications ? 'text-red-400' : 'text-white/60'} 
  />
</button>
```

---

### Step 5: Integrate Auto-Refresh into TelegramSection

**Add these to TelegramSection:**
```typescript
const TelegramSection = memo(function TelegramSection() {
  const { preferences } = useDashboardPreferences();
  const { showToast } = useToast();
  
  const [signals, setSignals] = useState<any[]>([]);
  
  // ⬇️ TELEGRAM SIGNALS FETCHING
  useEffect(() => {
    if (!preferences.telegram.autoRefresh) return;
    
    const fetchSignals = async () => {
      try {
        const response = await fetch('/api/telegram/signals');
        const data = await response.json();
        
        // Filter by enabled groups
        const filtered = data.filter(signal => 
          preferences.telegram.enabledGroups.includes(signal.groupId)
        );
        
        setSignals(filtered);
        
        // Notify about new signals from selected groups
        if (preferences.telegram.notifications) {
          const newSignals = filtered.filter(s => {
            const isNew = Date.now() - new Date(s.timestamp).getTime() < 60000; // Last minute
            const shouldNotify = preferences.telegram.notifyGroups.includes(s.groupId);
            return isNew && shouldNotify;
          });
          
          if (newSignals.length > 0) {
            showToast(
              `⚡ ${newSignals.length} new trading signals`,
              'success',
              preferences.telegram.soundEnabled
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch signals:', error);
      }
    };
    
    fetchSignals();
    const interval = setInterval(fetchSignals, preferences.telegram.refreshInterval);
    
    return () => clearInterval(interval);
  }, [preferences.telegram.autoRefresh, preferences.telegram.refreshInterval,
      preferences.telegram.enabledGroups, preferences.telegram.notifyGroups,
      preferences.telegram.notifications, preferences.telegram.soundEnabled, showToast]);
  
  // Rest of component...
});
```

**Wire alert button:**
```typescript
<button 
  onClick={() => {
    const newState = !preferences.telegram.notifications;
    updateTelegramPrefs({ notifications: newState });
    showToast(
      `Signal alerts ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false
    );
  }}
  className="..."
>
  <Bell 
    size={14} 
    className={preferences.telegram.notifications ? 'text-amber-400' : 'text-white/60'} 
  />
</button>
```

---

### Step 6: Integrate Watchlist with SQL

**Find the useWatchlist hook (around line 100) and replace it:**

```typescript
// BEFORE: localStorage-based watchlist
const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('bullmoney_watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);
  
  const addToWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const updated = [...prev, symbol];
      localStorage.setItem('bullmoney_watchlist', JSON.stringify(updated));
      return updated;
    });
  };
  
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(s => s !== symbol);
      localStorage.setItem('bullmoney_watchlist', JSON.stringify(updated));
      return updated;
    });
  };
  
  return { watchlist, addToWatchlist, removeFromWatchlist };
};

// AFTER: SQL-backed watchlist using preferences
const useWatchlist = () => {
  const { preferences, updateWatchlist } = useDashboardPreferences();
  
  const addToWatchlist = useCallback((symbol: string) => {
    if (!preferences.watchlist.includes(symbol)) {
      updateWatchlist([...preferences.watchlist, symbol]);
    }
  }, [preferences.watchlist, updateWatchlist]);
  
  const removeFromWatchlist = useCallback((symbol: string) => {
    updateWatchlist(preferences.watchlist.filter(s => s !== symbol));
  }, [preferences.watchlist, updateWatchlist]);
  
  const isInWatchlist = useCallback((symbol: string) => {
    return preferences.watchlist.includes(symbol);
  }, [preferences.watchlist]);
  
  return { 
    watchlist: preferences.watchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    isInWatchlist
  };
};
```

---

## 📋 Testing Checklist

After implementation, test these:

- [ ] Settings modal opens and displays current preferences
- [ ] Changing toggle switches updates settings in real-time
- [ ] Refresh interval sliders update displayed intervals
- [ ] Telegram group checkboxes work correctly
- [ ] Settings persist after page reload
- [ ] Auto-refresh timers work with configured intervals
- [ ] Alert buttons toggle notifications on/off
- [ ] Watchlist persists to database
- [ ] Notifications appear when enabled
- [ ] Sounds play when sound alerts enabled
- [ ] Disabled groups don't show signals
- [ ] Only selected groups trigger notifications
- [ ] News pull interval affects data freshness
- [ ] Display refresh interval affects rotation speed

---

## 🎯 Summary

**What's Working Now:**
- ✅ Enhanced settings modal with all controls (sliders, checkboxes, toggles)
- ✅ SQL schema ready to deploy
- ✅ API endpoints authenticated and ready
- ✅ React hook with auto-save

**What To Do:**
1. Run SQL migration in Supabase
2. Copy & paste the useEffect code into each section component
3. Replace alert button onClick handlers
4. Replace useWatchlist hook with SQL version
5. Test all functionality

**Estimated Time:** 30-45 minutes

**Difficulty:** Medium (mostly copy-paste with minor adjustments)

---

## 🐛 Troubleshooting

**Settings not saving:**
- Check browser console for API errors
- Verify SQL migration ran successfully
- Confirm user is authenticated (check Network tab)

**Auto-refresh not working:**
- Make sure autoRefresh toggle is enabled
- Check console for fetch errors
- Verify API endpoints return data

**Watchlist not persisting:**
- Confirm useDashboardPreferences hook is imported
- Check that preferences.watchlist exists in default state
- Verify updateWatchlist is called correctly

**Notifications not appearing:**
- Ensure showToast is imported from useToast
- Check that notifications toggle is enabled in settings
- Verify ToastProvider wraps the component tree

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all imports are present
3. Ensure SQL migration completed successfully
4. Test API endpoint with curl commands above
5. Review TypeScript errors in terminal

Good luck! 🚀
