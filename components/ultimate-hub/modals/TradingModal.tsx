import { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Calendar, Filter, X } from 'lucide-react';
import { TRADING_SYMBOLS, CALENDAR_COUNTRIES } from '@/components/ultimate-hub/constants';
import type { CalendarCountry, CalendarImpact } from '@/components/ultimate-hub/types';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { ModalWrapper } from '@/components/ultimate-hub/modals/ModalWrapper';

export const TradingModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [activeChart, setActiveChart] = useState('xauusd');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<CalendarImpact>('all');
  const [calendarCountry, setCalendarCountry] = useState<CalendarCountry>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Build calendar URL with filters
  const calendarUrl = useMemo(() => {
    let url = 'https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22';
    
    if (calendarCountry !== 'all') {
      url += `%2C%22currencyFilter%22%3A%22${calendarCountry}%22`;
    }
    if (calendarImpact !== 'all') {
      const impactMap = { high: '3', medium: '2', low: '1' };
      url += `%2C%22importanceFilter%22%3A%22${impactMap[calendarImpact]}%22`;
    }
    
    return url + '%7D';
  }, [calendarCountry, calendarImpact]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="p-3 border-b border-black/10 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-black" />
            <h3 className="text-sm font-bold text-black">Trading Quick Access</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-white hover:bg-black/5 border border-black/10"
          >
            <X className="w-4 h-4 text-black" />
          </motion.button>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="p-3 border-b border-black/10">
        <div className="flex gap-2">
          {TRADING_SYMBOLS.map(sym => {
            const Icon = sym.icon;
            return (
              <button
                key={sym.id}
                onClick={() => { setActiveChart(sym.id); setShowCalendar(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeChart === sym.id && !showCalendar
                    ? 'bg-white border border-black/15 shadow-sm'
                    : 'bg-white/60 border border-black/5 hover:border-black/10'
                }`}
              >
                <Icon className="w-4 h-4 text-black" />
                <span className="text-black">{sym.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-white flex-1 min-h-0">
        <div className="w-full h-[300px]" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
          {!showCalendar ? (
            <iframe
              src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${TRADING_SYMBOLS.find(s => s.id === activeChart)?.symbol}&interval=15&hidesidetoolbar=0&theme=dark&style=1&timezone=Etc%2FUTC`}
              style={{ width: '100%', height: '100%', border: 'none', touchAction: 'pan-y pinch-zoom' }}
              allowFullScreen
            />
          ) : (
            <iframe
              key={`calendar-${calendarCountry}-${calendarImpact}`}
              src={calendarUrl}
              style={{ width: '100%', height: '100%', border: 'none', touchAction: 'pan-y pinch-zoom' }}
              allowFullScreen
            />
          )}
        </div>
      </div>

      {/* Calendar Toggle & Filters */}
      <div className="p-3 border-t border-black/10 space-y-2">
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowCalendar(!showCalendar)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              showCalendar ? 'bg-white border border-black/15 shadow-sm' : 'bg-white/60 hover:bg-white border border-black/5'
            }`}
          >
            <Calendar className="w-4 h-4 text-black" />
            <span className="text-black">{showCalendar ? 'Show Charts' : 'Economic Calendar'}</span>
          </motion.button>
          
          {showCalendar && (
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                showFilters ? 'bg-white border border-black/15 shadow-sm' : 'bg-white/60 hover:bg-white border border-black/5'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-black" />
              <span className="text-black">Filters</span>
            </motion.button>
          )}
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showCalendar && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Impact Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-black/50 w-14">Impact:</span>
                <div className="flex gap-1 flex-1">
                  {(['all', 'high', 'medium', 'low'] as CalendarImpact[]).map(impact => (
                    <button
                      key={impact}
                      onClick={() => setCalendarImpact(impact)}
                      className={`flex-1 py-1 px-2 rounded text-[9px] font-semibold transition-all ${
                        calendarImpact === impact
                          ? impact === 'high' ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                          : impact === 'medium' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : impact === 'low' ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                          : 'bg-white text-black border border-black/15 shadow-sm'
                          : 'bg-white/60 text-black/50 border border-black/5 hover:bg-white'
                      }`}
                    >
                      {impact === 'all' ? 'All' : impact.charAt(0).toUpperCase() + impact.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-black/50 w-14">Currency:</span>
                <div className="flex gap-1 flex-1 overflow-x-auto overflow-y-hidden pb-1 scrollbar-none [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]" style={{ touchAction: 'pan-x pinch-zoom' }}>
                  {CALENDAR_COUNTRIES.map(country => (
                    <button
                      key={country.id}
                      onClick={() => setCalendarCountry(country.id)}
                      className={`flex items-center gap-0.5 py-1 px-1.5 rounded text-[9px] font-semibold transition-all whitespace-nowrap ${
                        calendarCountry === country.id
                          ? 'bg-white text-black border border-black/15 shadow-sm'
                          : 'bg-white/60 text-black/50 border border-black/5 hover:bg-white'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalWrapper>
  );
});
TradingModal.displayName = 'TradingModal';
