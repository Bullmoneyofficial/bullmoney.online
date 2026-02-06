"use client";

import React, { memo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Eye,
  Trophy,
  CheckCircle,
  Lock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Analysis, ReactionType } from '@/types/feed';
import type { UserProfile } from '@/types/user';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAuthModalUI } from '@/contexts/UIStateContext';

// Market badge colors
const marketColors: Record<string, string> = {
  forex: 'bg-white/90',
  crypto: 'bg-orange-500/90',
  stocks: 'bg-white/90',
  indices: 'bg-white/90',
};

// Content type badges
const contentTypeLabels: Record<string, { label: string; icon: string }> = {
  deep_dive: { label: 'Deep Dive', icon: '📊' },
  market_pulse: { label: 'Pulse', icon: '⚡' },
  blog_post: { label: 'Blog', icon: '📝' },
};

interface FeedCardProps {
  analysis: Analysis;
  onOpenAnalysis: (analysis: Analysis) => void;
  onReaction?: (analysisId: string, type: ReactionType) => void;
  currentUserId?: string;
  variant?: 'default' | 'compact';
}

export const FeedCard = memo(({
  analysis,
  onOpenAnalysis,
  onReaction,
  currentUserId,
  variant = 'default',
}: FeedCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionType | null>(
    analysis.user_reaction || null
  );
  
  // Auth hooks for requiring sign-in
  const { isAuthenticated } = useRecruitAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();

  const handleClick = useCallback(() => {
    SoundEffects.click();
    onOpenAnalysis(analysis);
  }, [analysis, onOpenAnalysis]);

  const handleReaction = useCallback((e: React.MouseEvent, type: ReactionType) => {
    e.stopPropagation();
    SoundEffects.click();
    
    // Require authentication before reacting
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    if (localReaction === type) {
      setLocalReaction(null);
    } else {
      setLocalReaction(type);
    }
    
    onReaction?.(analysis.id, type);
  }, [analysis.id, localReaction, onReaction, isAuthenticated, setAuthModalOpen]);

  const author = analysis.author;
  const reactionCounts = analysis.reaction_counts || { bull: 0, bear: 0, save: 0 };
  const timeAgo = formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true });

  // Get chart image or placeholder
  const chartImage = analysis.image_url || 
    analysis.attachments?.find(a => a.type === 'image')?.url ||
    null;

  // Extract tickers for display
  const displayTickers = analysis.tickers?.slice(0, 3) || [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl bg-linear-to-b from-neutral-900/90 to-black/90 border border-neutral-800/50 hover:border-white/30 overflow-hidden transition-all duration-300"
    >
      {/* Chart/Image Section */}
      <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
        {chartImage ? (
          <img 
            src={chartImage} 
            alt={analysis.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-neutral-800 to-neutral-900">
            <div className="text-6xl opacity-30">
              {analysis.direction === 'bullish' ? '📈' : analysis.direction === 'bearish' ? '📉' : '📊'}
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Market & Direction Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${marketColors[analysis.market] === 'bg-orange-500/90' ? 'text-white bg-orange-500/90' : 'text-black bg-white/90'}`}>
            {analysis.market}
          </span>
          {analysis.direction === 'bullish' && (
            <span className="px-2 py-1 rounded-lg bg-white/90 text-black text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> LONG
            </span>
          )}
          {analysis.direction === 'bearish' && (
            <span className="px-2 py-1 rounded-lg bg-red-500/90 text-white text-xs font-bold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> SHORT
            </span>
          )}
        </div>
        
        {/* Pro Badge */}
        {analysis.is_pro_only && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-lg bg-linear-to-r from-white to-pink-500 text-white text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> PRO
            </span>
          </div>
        )}
        
        {/* Tickers Overlay */}
        {displayTickers.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {displayTickers.map((ticker) => (
              <span 
                key={ticker}
                className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-mono font-bold"
              >
                ${ticker}
              </span>
            ))}
          </div>
        )}
        
        {/* Pair */}
        <div className="absolute bottom-3 right-3">
          <span className="text-white font-bold text-lg drop-shadow-lg">
            {analysis.pair}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {/* Author Row */}
        {author && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-white to-white flex items-center justify-center overflow-hidden">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {author.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-medium text-sm truncate">
                  @{author.username}
                </span>
                {author.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                )}
                {author.is_smart_money && (
                  <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                )}
              </div>
              {author.win_rate !== null && author.win_rate !== undefined && (
                <span className="text-xs text-white">
                  {author.win_rate.toFixed(0)}% Win Rate
                </span>
              )}
            </div>
            <span className="text-xs text-neutral-500 flex-shrink-0">
              {timeAgo}
            </span>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-white font-bold text-base line-clamp-2 mb-2 group-hover:text-white transition-colors">
          {analysis.title}
        </h3>
        
        {/* Content Preview */}
        {variant === 'default' && (
          <p className="text-neutral-400 text-sm line-clamp-2 mb-3">
            {analysis.content}
          </p>
        )}
        
        {/* Content Type Badge */}
        {analysis.content_type && contentTypeLabels[analysis.content_type] && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-xs mb-3">
            {contentTypeLabels[analysis.content_type].icon}
            {contentTypeLabels[analysis.content_type].label}
          </span>
        )}
        
        {/* Engagement Row */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            {/* Bull React */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleReaction(e, 'bull')}
              className={`flex items-center gap-1 text-sm transition-colors ${
                localReaction === 'bull' 
                  ? 'text-white' 
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <span>🐂</span>
              <span>{reactionCounts.bull + (localReaction === 'bull' ? 1 : 0)}</span>
            </motion.button>
            
            {/* Bear React */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleReaction(e, 'bear')}
              className={`flex items-center gap-1 text-sm transition-colors ${
                localReaction === 'bear' 
                  ? 'text-red-400' 
                  : 'text-neutral-500 hover:text-red-400'
              }`}
            >
              <span>🐻</span>
              <span>{reactionCounts.bear + (localReaction === 'bear' ? 1 : 0)}</span>
            </motion.button>
            
            {/* Comments */}
            <span className="flex items-center gap-1 text-neutral-500 text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>{analysis.comment_count || 0}</span>
            </span>
          </div>
          
          {/* Views */}
          <span className="flex items-center gap-1 text-neutral-600 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>{analysis.view_count || 0}</span>
          </span>
        </div>
      </div>
    </motion.article>
  );
});

FeedCard.displayName = 'FeedCard';

export default FeedCard;
