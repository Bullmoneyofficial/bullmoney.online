// Bull Algo - Ranking calculations for Bull Feed
// Score = (Views * 0.1) + (Bulls * 1) + (Bears * 0.5) + (Comments * 2) + (Saves * 3) + (AuthorRep * 0.01)

import type { Analysis, ReactionCounts } from '@/types/feed';
import type { UserProfile } from '@/types/user';

interface ScoreComponents {
  viewScore: number;
  bullScore: number;
  bearScore: number;
  commentScore: number;
  saveScore: number;
  reputationScore: number;
  total: number;
}

// Weights for different engagement types
const WEIGHTS = {
  views: 0.1,
  bulls: 1.0,
  bears: 0.5, // Bears still count as engagement
  comments: 2.0,
  saves: 3.0,
  authorReputation: 0.01,
} as const;

/**
 * Calculate the bull score for an analysis
 */
export function calculateBullScore(
  viewCount: number,
  reactionCounts: ReactionCounts,
  commentCount: number,
  authorReputation: number = 0
): number {
  const viewScore = viewCount * WEIGHTS.views;
  const bullScore = reactionCounts.bull * WEIGHTS.bulls;
  const bearScore = reactionCounts.bear * WEIGHTS.bears;
  const commentScore = commentCount * WEIGHTS.comments;
  const saveScore = reactionCounts.save * WEIGHTS.saves;
  const reputationScore = authorReputation * WEIGHTS.authorReputation;

  return Math.round(
    viewScore + bullScore + bearScore + commentScore + saveScore + reputationScore
  );
}

/**
 * Calculate score breakdown for display
 */
export function getScoreBreakdown(
  viewCount: number,
  reactionCounts: ReactionCounts,
  commentCount: number,
  authorReputation: number = 0
): ScoreComponents {
  const viewScore = viewCount * WEIGHTS.views;
  const bullScore = reactionCounts.bull * WEIGHTS.bulls;
  const bearScore = reactionCounts.bear * WEIGHTS.bears;
  const commentScore = commentCount * WEIGHTS.comments;
  const saveScore = reactionCounts.save * WEIGHTS.saves;
  const reputationScore = authorReputation * WEIGHTS.authorReputation;

  return {
    viewScore,
    bullScore,
    bearScore,
    commentScore,
    saveScore,
    reputationScore,
    total: Math.round(viewScore + bullScore + bearScore + commentScore + saveScore + reputationScore),
  };
}

/**
 * Calculate "hot" score based on engagement velocity
 * Used for the "Hot" tab - ranks by engagement per hour
 */
export function calculateHotScore(
  reactionCounts: ReactionCounts,
  commentCount: number,
  createdAt?: Date | string | null
): number {
  // Handle null/undefined createdAt - default to now (gives score of 0 hours)
  if (!createdAt) {
    createdAt = new Date();
  }
  const createdTime = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  
  // Handle invalid date
  if (isNaN(createdTime.getTime())) {
    return 0;
  }
  
  const now = new Date();
  const hoursSincePost = Math.max(1, (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60));

  const totalEngagement = reactionCounts.bull + reactionCounts.bear + commentCount;

  // Velocity: engagement per hour, with decay
  const velocity = totalEngagement / hoursSincePost;

  // Apply gravity (older posts decay faster)
  // Gravity factor increases as time passes
  const gravity = 1.8;
  const decayedScore = totalEngagement / Math.pow(hoursSincePost + 2, gravity);

  return velocity * 10 + decayedScore * 100;
}

/**
 * Sort analyses by "Hot" (trending)
 */
export function sortByHot<T extends { reaction_counts?: ReactionCounts; comment_count?: number; created_at: string }>(
  analyses: T[]
): T[] {
  return [...analyses].sort((a, b) => {
    const aReactions = a.reaction_counts || { bull: 0, bear: 0, save: 0 };
    const bReactions = b.reaction_counts || { bull: 0, bear: 0, save: 0 };

    const aHot = calculateHotScore(aReactions, a.comment_count || 0, a.created_at);
    const bHot = calculateHotScore(bReactions, b.comment_count || 0, b.created_at);

    return bHot - aHot;
  });
}

/**
 * Sort analyses by "Top Rated" (bull_score)
 */
export function sortByTopRated<T extends { bull_score: number }>(analyses: T[]): T[] {
  return [...analyses].sort((a, b) => b.bull_score - a.bull_score);
}

/**
 * Sort analyses by "Fresh" (newest first)
 */
export function sortByFresh<T extends { created_at: string }>(analyses: T[]): T[] {
  return [...analyses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Filter for "Smart Money" - verified traders with high win rate
 */
export function filterSmartMoney<T extends { author?: UserProfile | null }>(
  analyses: T[],
  minWinRate: number = 65,
  minTrades: number = 20
): T[] {
  return analyses.filter((analysis) => {
    if (!analysis.author) return false;
    if (!analysis.author.is_smart_money) return false;

    const winRate = analysis.author.win_rate ?? 0;
    const totalTrades = analysis.author.total_trades ?? 0;

    return winRate >= minWinRate && totalTrades >= minTrades;
  });
}

/**
 * Calculate user reputation based on their content performance
 */
export function calculateUserReputation(analyses: Analysis[]): number {
  if (analyses.length === 0) return 0;

  const totalScore = analyses.reduce((sum, a) => sum + (a.bull_score || 0), 0);
  const avgScore = totalScore / analyses.length;

  // Base reputation from average score
  let reputation = avgScore;

  // Bonus for volume (more quality content = higher reputation)
  const volumeBonus = Math.min(analyses.length * 2, 100);
  reputation += volumeBonus;

  // Bonus for high bull ratio
  const totalBulls = analyses.reduce((sum, a) => sum + (a.reaction_counts?.bull || 0), 0);
  const totalBears = analyses.reduce((sum, a) => sum + (a.reaction_counts?.bear || 0), 0);
  if (totalBulls + totalBears > 0) {
    const bullRatio = totalBulls / (totalBulls + totalBears);
    if (bullRatio > 0.7) {
      reputation *= 1.2; // 20% bonus for 70%+ approval
    }
  }

  return Math.round(reputation);
}

/**
 * Format score for display (1.2k, 3.5M, etc.)
 */
export function formatScore(score: number): string {
  if (score < 1000) return score.toString();
  if (score < 1000000) return `${(score / 1000).toFixed(1)}k`;
  return `${(score / 1000000).toFixed(1)}M`;
}

/**
 * Get engagement rate as percentage
 */
export function getEngagementRate(
  reactionCounts: ReactionCounts,
  commentCount: number,
  viewCount: number
): number {
  if (viewCount === 0) return 0;

  const totalEngagement = reactionCounts.bull + reactionCounts.bear + reactionCounts.save + commentCount;
  return Math.round((totalEngagement / viewCount) * 100);
}
