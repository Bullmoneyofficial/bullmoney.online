"use client";

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  TrendingUp, 
  Trophy, 
  Clock,
  Sparkles
} from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

export type FeedTab = 'hot' | 'top' | 'smart_money' | 'fresh';

interface FeedFiltersProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  counts?: {
    hot?: number;
    top?: number;
    smart_money?: number;
    fresh?: number;
  };
}

const tabs: { id: FeedTab; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'hot', 
    label: 'Hot', 
    icon: <Flame className="w-4 h-4" />,
    description: 'Trending now'
  },
  { 
    id: 'top', 
    label: 'Top', 
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Highest rated'
  },
  { 
    id: 'smart_money', 
    label: 'Smart Money', 
    icon: <Trophy className="w-4 h-4" />,
    description: 'From verified traders'
  },
  { 
    id: 'fresh', 
    label: 'Fresh', 
    icon: <Clock className="w-4 h-4" />,
    description: 'Most recent'
  },
];

export const FeedFilters = memo(({
  activeTab,
  onTabChange,
  counts,
}: FeedFiltersProps) => {
  const handleTabClick = useCallback((tab: FeedTab) => {
    SoundEffects.click();
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts?.[tab.id];
        
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabClick(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              whitespace-nowrap transition-all duration-200
              ${isActive 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }
            `}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-blue-500 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            
            <span className={isActive ? 'text-white' : ''}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            
            {/* Count badge */}
            {count !== undefined && count > 0 && (
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-neutral-700 text-neutral-400'
                }
              `}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

FeedFilters.displayName = 'FeedFilters';

// Market filter component
interface MarketFilterProps {
  activeMarkets: string[];
  onMarketToggle: (market: string) => void;
}

const markets = [
  { id: 'all', label: 'All', color: 'bg-blue-500' },
  { id: 'forex', label: 'Forex', color: 'bg-green-500' },
  { id: 'crypto', label: 'Crypto', color: 'bg-orange-500' },
  { id: 'stocks', label: 'Stocks', color: 'bg-blue-500' },
  { id: 'indices', label: 'Indices', color: 'bg-purple-500' },
];

export const MarketFilter = memo(({
  activeMarkets,
  onMarketToggle,
}: MarketFilterProps) => {
  const handleClick = useCallback((marketId: string) => {
    SoundEffects.click();
    onMarketToggle(marketId);
  }, [onMarketToggle]);

  const isAllActive = activeMarkets.length === 0 || activeMarkets.includes('all');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {markets.map((market) => {
        const isActive = market.id === 'all' 
          ? isAllActive 
          : activeMarkets.includes(market.id);
        
        return (
          <motion.button
            key={market.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(market.id)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200
              ${isActive 
                ? `${market.color} text-white` 
                : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800'
              }
            `}
          >
            {market.label}
          </motion.button>
        );
      })}
    </div>
  );
});

MarketFilter.displayName = 'MarketFilter';

// Content type filter
interface ContentTypeFilterProps {
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
}

const contentTypes = [
  { id: 'all', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'deep_dive', label: 'Deep Dives', icon: '📊' },
  { id: 'market_pulse', label: 'Pulses', icon: '⚡' },
  { id: 'blog_post', label: 'Blogs', icon: '📝' },
];

export const ContentTypeFilter = memo(({
  activeTypes,
  onTypeToggle,
}: ContentTypeFilterProps) => {
  const handleClick = useCallback((typeId: string) => {
    SoundEffects.click();
    onTypeToggle(typeId);
  }, [onTypeToggle]);

  const isAllActive = activeTypes.length === 0 || activeTypes.includes('all');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {contentTypes.map((type) => {
        const isActive = type.id === 'all' 
          ? isAllActive 
          : activeTypes.includes(type.id);
        
        return (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(type.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${isActive 
                ? 'bg-neutral-700 text-white' 
                : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800'
              }
            `}
          >
            <span>{typeof type.icon === 'string' ? type.icon : type.icon}</span>
            <span>{type.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

ContentTypeFilter.displayName = 'ContentTypeFilter';

export default FeedFilters;
