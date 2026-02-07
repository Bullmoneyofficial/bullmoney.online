// Enhanced Unified Settings Modal Component
// Copy this to replace the existing UnifiedSettingsModal in PageSections.tsx

const UnifiedSettingsModal = memo(function UnifiedSettingsModal({
  isOpen,
  onClose
}: UnifiedSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const { preferences, isSaving, updateQuotesPrefs, updateNewsPrefs, updateTelegramPrefs } = useDashboardPreferences();
  
  // Telegram group options
  const telegramGroups = [
    { id: 'vip', label: 'VIP Signals', icon: Zap },
    { id: 'free', label: 'Free Signals', icon: Users },
    { id: 'signals', label: 'General Signals', icon: Bell },
    { id: 'analysis', label: 'Market Analysis', icon: BarChart3 },
  ];
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                     w-[90vw] max-w-2xl max-h-[85vh] z-[9999]
                     bg-[#0d0d0d] border border-white/10 rounded-2xl
                     shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Settings size={16} className="text-white/80" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white">Dashboard Settings</span>
                {isSaving && <span className="text-[10px] text-green-400 ml-2">Saving...</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} className="text-white/60" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-5 space-y-6">
            {/* Market Quotes Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-blue-400" />
                <h3 className="text-[13px] font-semibold text-white">Market Quotes</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Automatically update quotes</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.autoRefresh} 
                    onChange={(v) => updateQuotesPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Refresh Interval Slider */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Refresh Interval</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.quotes.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="120000"
                    step="5000"
                    value={preferences.quotes.refreshInterval}
                    onChange={(e) => updateQuotesPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>10s</span>
                    <span>2min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Price Alerts</div>
                      <div className="text-[10px] text-white/40">Get notified of price changes</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.notifications} 
                    onChange={(v) => updateQuotesPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Play sound for alerts</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.soundEnabled} 
                    onChange={(v) => updateQuotesPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
            
            {/* Breaking News Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio size={14} className="text-red-400" />
                <h3 className="text-[13px] font-semibold text-white">Breaking News</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Live news updates</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.autoRefresh} 
                    onChange={(v) => updateNewsPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Display Refresh Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Display Refresh</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.news.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="180000"
                    step="15000"
                    value={preferences.news.refreshInterval}
                    onChange={(e) => updateNewsPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>15s</span>
                    <span>3min</span>
                  </div>
                </div>
                
                {/* News Pull Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Fetch New Articles</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.news.pullInterval / 60000}min</span>
                  </div>
                  <input
                    type="range"
                    min="60000"
                    max="1800000"
                    step="60000"
                    value={preferences.news.pullInterval}
                    onChange={(e) => updateNewsPrefs({ pullInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>1min</span>
                    <span>30min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">News Alerts</div>
                      <div className="text-[10px] text-white/40">Breaking news notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.notifications} 
                    onChange={(v) => updateNewsPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Breaking news sound</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.soundEnabled} 
                    onChange={(v) => updateNewsPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
            
            {/* Community Signals Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-amber-400" />
                <h3 className="text-[13px] font-semibold text-white">Community Signals</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Live signal updates</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.autoRefresh} 
                    onChange={(v) => updateTelegramPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Refresh Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Refresh Interval</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.telegram.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="150000"
                    step="15000"
                    value={preferences.telegram.refreshInterval}
                    onChange={(e) => updateTelegramPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>15s</span>
                    <span>2.5min</span>
                  </div>
                </div>
                
                {/* Telegram Groups */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="text-[12px] text-white mb-2">Enabled Groups</div>
                  <div className="space-y-2">
                    {telegramGroups.map((group) => (
                      <label 
                        key={group.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <group.icon size={12} className="text-white/50" />
                          <span className="text-[11px] text-white/80">{group.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.telegram.enabledGroups.includes(group.id)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const newGroups = enabled
                              ? [...preferences.telegram.enabledGroups, group.id]
                              : preferences.telegram.enabledGroups.filter(g => g !== group.id);
                            updateTelegramPrefs({ enabledGroups: newGroups });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Notification Groups */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="text-[12px] text-white mb-2">Notify From Groups</div>
                  <div className="space-y-2">
                    {telegramGroups.map((group) => (
                      <label 
                        key={group.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={12} className="text-white/50" />
                          <span className="text-[11px] text-white/80">{group.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.telegram.notifyGroups.includes(group.id)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const newGroups = enabled
                              ? [...preferences.telegram.notifyGroups, group.id]
                              : preferences.telegram.notifyGroups.filter(g => g !== group.id);
                            updateTelegramPrefs({ notifyGroups: newGroups });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Signal Alerts</div>
                      <div className="text-[10px] text-white/40">New signal notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.notifications} 
                    onChange={(v) => updateTelegramPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Signal sound notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.soundEnabled} 
                    onChange={(v) => updateTelegramPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/40">
                {isSaving ? 'Saving to database...' : 'Settings saved automatically'}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 
                           text-[12px] font-medium text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});
