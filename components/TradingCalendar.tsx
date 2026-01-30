'use client';

import React, { useState, useMemo } from 'react';
import { TradeDB } from '@/types/tradingJournal';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingCalendarProps {
  trades: TradeDB[];
  tradeImages: {[tradeId: string]: string[]};
  onTradeClick: (trade: TradeDB) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function TradingCalendar({
  trades,
  tradeImages,
  onTradeClick,
  selectedDate,
  onDateChange,
}: TradingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar data
  const { calendarDays, monthTrades } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Filter trades for current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const filteredTrades = trades.filter(t => {
      const tradeDate = new Date(t.trade_date);
      return tradeDate >= monthStart && tradeDate <= monthEnd;
    });

    return { calendarDays: days, monthTrades: filteredTrades };
  }, [currentMonth, trades]);

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const grouped: { [key: string]: TradeDB[] } = {};
    
    trades.forEach(trade => {
      const dateKey = new Date(trade.trade_date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(trade);
    });

    return grouped;
  }, [trades]);

  // Calculate daily P&L
  const dailyPnL = useMemo(() => {
    const pnl: { [key: string]: number } = {};
    
    Object.entries(tradesByDate).forEach(([date, dateTrades]) => {
      pnl[date] = dateTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    });

    return pnl;
  }, [tradesByDate]);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getDayTrades = (date: Date) => {
    return tradesByDate[date.toDateString()] || [];
  };

  const getDayPnL = (date: Date) => {
    return dailyPnL[date.toDateString()] || 0;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate month statistics
  const monthStats = useMemo(() => {
    const wins = monthTrades.filter(t => t.outcome === 'win').length;
    const losses = monthTrades.filter(t => t.outcome === 'loss').length;
    const totalPnL = monthTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

    return { wins, losses, totalPnL, winRate, total: monthTrades.length };
  }, [monthTrades]);

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Calendar Header */}
      <div className="bg-black rounded-lg md:rounded-xl border border-white/30 p-3 md:p-6" style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <button
            onClick={previousMonth}
            className="p-1.5 md:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
          >
            <ChevronLeft className="text-white" size={20} style={{ filter: 'drop-shadow(0 0 2px #ffffff)' }} />
          </button>

          <div className="text-center">
            <h2 className="text-lg md:text-2xl font-bold text-white neon-blue-text" style={{ textShadow: '0 0 4px #ffffff' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm">
              <span className="text-white">
                {monthStats.wins}W
              </span>
              <span className="text-red-400">
                {monthStats.losses}L
              </span>
              <span className={monthStats.totalPnL >= 0 ? 'text-white' : 'text-red-400'}>
                ${monthStats.totalPnL.toFixed(0)}
              </span>
            </div>
          </div>

          <button
            onClick={nextMonth}
            className="p-1.5 md:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
          >
            <ChevronRight className="text-white" size={20} style={{ filter: 'drop-shadow(0 0 2px #ffffff)' }} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-[10px] md:text-sm font-medium text-white/70 py-1 md:py-2"
            >
              {day.substring(0, 3)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayTrades = getDayTrades(date);
            const dayPnL = getDayPnL(date);
            const hasWins = dayTrades.some(t => t.outcome === 'win');
            const hasLosses = dayTrades.some(t => t.outcome === 'loss');
            const dayImages = dayTrades.flatMap(t => tradeImages[t.id] || []).slice(0, 1);

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                onClick={() => onDateChange(date)}
                className={`
                  relative aspect-square rounded-md md:rounded-lg p-1 md:p-2 cursor-pointer transition-all overflow-hidden
                  ${isCurrentMonth(date) ? 'bg-black border border-white/30' : 'bg-black/50 border border-white/10'}
                  ${isToday(date) ? 'ring-1 md:ring-2 ring-white' : ''}
                  ${isSelected(date) ? 'ring-1 md:ring-2 ring-white' : ''}
                  ${!isCurrentMonth(date) ? 'opacity-40' : ''}
                  hover:bg-white/10
                `}
                style={{ boxShadow: isCurrentMonth(date) ? '0 0 4px rgba(255, 255, 255, 0.2)' : 'none' }}
              >
                {/* Background image if exists */}
                {dayImages.length > 0 && (
                  <div className="absolute inset-0 opacity-20">
                    <img
                      src={dayImages[0]}
                      alt="Trade"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Date number */}
                <div className={`relative text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 ${
                  isToday(date) ? 'text-white neon-blue-text' : 'text-white'
                }`}>
                  {date.getDate()}
                </div>

                {/* Trade indicators */}
                {dayTrades.length > 0 && (
                  <div className="relative space-y-0.5 md:space-y-1">
                    <div className="flex items-center justify-center gap-0.5 md:gap-1">
                      {hasWins && (
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white" style={{ boxShadow: '0 0 4px #ffffff' }} />
                      )}
                      {hasLosses && (
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-red-500" style={{ boxShadow: '0 0 4px #ef4444' }} />
                      )}
                    </div>
                    
                    <div className={`text-[8px] md:text-xs font-semibold text-center ${
                      dayPnL >= 0 ? 'text-white' : 'text-red-400'
                    }`}>
                      {dayPnL >= 0 ? '+' : ''}{Math.abs(dayPnL) > 999 ? (dayPnL/1000).toFixed(1) + 'k' : dayPnL.toFixed(0)}
                    </div>

                    <div className="hidden md:block text-[8px] text-white/70 text-center">
                      {dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {getDayTrades(selectedDate).length > 0 && (
        <div className="bg-black rounded-lg md:rounded-xl border border-white/30 p-3 md:p-6" style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 neon-blue-text" style={{ textShadow: '0 0 4px #ffffff' }}>
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>

          <div className="space-y-2 md:space-y-3">
            {getDayTrades(selectedDate).map(trade => {
              const tradeImgs = tradeImages[trade.id] || [];
              return (
              <motion.div
                key={trade.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onTradeClick(trade)}
                className="bg-black/50 rounded-lg p-3 md:p-4 cursor-pointer hover:bg-white/10 transition-all
                         border border-white/30"
                style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                      <span className="text-sm md:text-lg font-bold text-white neon-blue-text" style={{ textShadow: '0 0 2px #ffffff' }}>
                        {trade.asset_symbol}
                      </span>
                      <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-medium ${
                        trade.direction === 'long' 
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {trade.direction.toUpperCase()}
                      </span>
                      <span className="text-[10px] md:text-sm text-white/70">
                        {trade.asset_type}
                      </span>
                    </div>

                    {/* Images preview */}
                    {tradeImgs.length > 0 && (
                      <div className="flex gap-1 mb-2 overflow-x-auto">
                        {tradeImgs.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Trade ${idx + 1}`}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded border border-white/30"
                            style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)' }}
                          />
                        ))}
                        {tradeImgs.length > 3 && (
                          <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/20 rounded border border-white/30 text-[10px] md:text-xs text-white">
                            +{tradeImgs.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 md:gap-3 text-[10px] md:text-sm">
                      <div>
                        <div className="text-white/70">Entry</div>
                        <div className="text-white font-medium">
                          ${trade.entry_price.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/70">Exit</div>
                        <div className="text-white font-medium">
                          {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'Open'}
                        </div>
                      </div>
                      <div className="md:hidden">
                        <div className="text-white/70">P&L</div>
                        <div className={`font-bold ${
                          (trade.net_pnl || 0) >= 0 ? 'text-white' : 'text-red-400'
                        }`}>
                          {trade.net_pnl ? `$${trade.net_pnl.toFixed(2)}` : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-2">
                      <div>
                        <div className="text-white/70">Quantity</div>
                        <div className="text-white font-medium">
                          {trade.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/70">P&L</div>
                        <div className={`font-bold ${
                          (trade.net_pnl || 0) >= 0 ? 'text-white' : 'text-red-400'
                        }`}>
                          {trade.net_pnl ? `$${trade.net_pnl.toFixed(2)}` : '-'}
                        </div>
                      </div>
                    </div>

                    {trade.strategy && (
                      <div className="mt-2 text-[10px] md:text-sm text-white/70">
                        <span className="text-white">{trade.strategy}</span>
                      </div>
                    )}
                  </div>

                  {trade.outcome && (
                    <div className="ml-2 flex-shrink-0">
                      {trade.outcome === 'win' ? (
                        <TrendingUp className="text-white" size={16} style={{ filter: 'drop-shadow(0 0 2px #ffffff)' }} />
                      ) : trade.outcome === 'loss' ? (
                        <TrendingDown className="text-red-400" size={16} style={{ filter: 'drop-shadow(0 0 2px #ef4444)' }} />
                      ) : (
                        <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-gray-500/20" />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
            })}
          </div>

          {/* Day Summary */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/30">
            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
              <div>
                <div className="text-white/70 text-[10px] md:text-sm">Trades</div>
                <div className="text-white text-base md:text-xl font-bold neon-blue-text" style={{ textShadow: '0 0 2px #ffffff' }}>
                  {getDayTrades(selectedDate).length}
                </div>
              </div>
              <div>
                <div className="text-white/70 text-[10px] md:text-sm">Win Rate</div>
                <div className="text-white text-base md:text-xl font-bold">
                  {((getDayTrades(selectedDate).filter(t => t.outcome === 'win').length / 
                    getDayTrades(selectedDate).length) * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-white/70 text-[10px] md:text-sm">P&L</div>
                <div className={`text-base md:text-xl font-bold ${
                  getDayPnL(selectedDate) >= 0 ? 'text-white' : 'text-red-400'
                }`}>
                  ${getDayPnL(selectedDate).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
