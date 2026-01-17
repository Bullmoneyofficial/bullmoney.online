"use client";

import { create } from 'zustand';
import type {
  Analysis,
  FeedFilter,
  ContentFilter,
  ReactionType,
  ReactionCounts,
} from '@/types/feed';

// ============================================================================
// FEED STORE - Bull Feed State Management
// ============================================================================

export interface FeedStore {
  // Feed data
  analyses: Analysis[];

  // Filters
  filter: FeedFilter;
  contentType: ContentFilter;
  ticker: string | null;

  // Pagination
  cursor: string | null;
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Selected analysis (for modal)
  selectedAnalysisId: string | null;

  // Actions
  setAnalyses: (analyses: Analysis[]) => void;
  appendAnalyses: (analyses: Analysis[]) => void;
  setFilter: (filter: FeedFilter) => void;
  setContentType: (contentType: ContentFilter) => void;
  setTicker: (ticker: string | null) => void;
  setCursor: (cursor: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedAnalysisId: (id: string | null) => void;

  // Optimistic updates
  addOptimisticReaction: (analysisId: string, type: ReactionType) => void;
  removeOptimisticReaction: (analysisId: string, type: ReactionType) => void;
  incrementCommentCount: (analysisId: string) => void;
  decrementCommentCount: (analysisId: string) => void;
  incrementViewCount: (analysisId: string) => void;
  updateAnalysis: (analysisId: string, updates: Partial<Analysis>) => void;

  // Reset
  resetFeed: () => void;
}

const initialState = {
  analyses: [],
  filter: 'fresh' as FeedFilter,
  contentType: 'all' as ContentFilter,
  ticker: null,
  cursor: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  selectedAnalysisId: null,
};

export const useFeedStore = create<FeedStore>()((set, get) => ({
  ...initialState,

  // Set analyses (replace)
  setAnalyses: (analyses) => set({ analyses }),

  // Append analyses (pagination)
  appendAnalyses: (newAnalyses) => set((state) => ({
    analyses: [...state.analyses, ...newAnalyses],
  })),

  // Filter setters
  setFilter: (filter) => set({ filter, cursor: null, hasMore: true }),
  setContentType: (contentType) => set({ contentType, cursor: null, hasMore: true }),
  setTicker: (ticker) => set({ ticker, cursor: null, hasMore: true }),

  // Pagination setters
  setCursor: (cursor) => set({ cursor }),
  setHasMore: (hasMore) => set({ hasMore }),

  // Loading state setters
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setError: (error) => set({ error }),

  // Selected analysis
  setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id }),

  // Optimistic reaction add
  addOptimisticReaction: (analysisId, type) => set((state) => ({
    analyses: state.analyses.map((analysis) => {
      if (analysis.id !== analysisId) return analysis;

      const currentCounts = analysis.reaction_counts || { bull: 0, bear: 0, save: 0 };
      const newCounts: ReactionCounts = {
        ...currentCounts,
        [type]: currentCounts[type] + 1,
      };

      return {
        ...analysis,
        reaction_counts: newCounts,
        user_reaction: type,
      };
    }),
  })),

  // Optimistic reaction remove
  removeOptimisticReaction: (analysisId, type) => set((state) => ({
    analyses: state.analyses.map((analysis) => {
      if (analysis.id !== analysisId) return analysis;

      const currentCounts = analysis.reaction_counts || { bull: 0, bear: 0, save: 0 };
      const newCounts: ReactionCounts = {
        ...currentCounts,
        [type]: Math.max(0, currentCounts[type] - 1),
      };

      return {
        ...analysis,
        reaction_counts: newCounts,
        user_reaction: null,
      };
    }),
  })),

  // Increment comment count
  incrementCommentCount: (analysisId) => set((state) => ({
    analyses: state.analyses.map((analysis) => {
      if (analysis.id !== analysisId) return analysis;
      return {
        ...analysis,
        comment_count: (analysis.comment_count || 0) + 1,
      };
    }),
  })),

  // Decrement comment count
  decrementCommentCount: (analysisId) => set((state) => ({
    analyses: state.analyses.map((analysis) => {
      if (analysis.id !== analysisId) return analysis;
      return {
        ...analysis,
        comment_count: Math.max(0, (analysis.comment_count || 0) - 1),
      };
    }),
  })),

  // Increment view count
  incrementViewCount: (analysisId) => set((state) => ({
    analyses: state.analyses.map((analysis) => {
      if (analysis.id !== analysisId) return analysis;
      return {
        ...analysis,
        view_count: (analysis.view_count || 0) + 1,
      };
    }),
  })),

  // Update a specific analysis
  updateAnalysis: (analysisId, updates) => set((state) => ({
    analyses: state.analyses.map((analysis) =>
      analysis.id === analysisId ? { ...analysis, ...updates } : analysis
    ),
  })),

  // Reset feed to initial state
  resetFeed: () => set(initialState),
}));

// Selector hooks for optimized re-renders
export const useAnalyses = () => useFeedStore((state) => state.analyses);
export const useFeedFilter = () => useFeedStore((state) => state.filter);
export const useFeedContentType = () => useFeedStore((state) => state.contentType);
export const useFeedTicker = () => useFeedStore((state) => state.ticker);
export const useIsFeedLoading = () => useFeedStore((state) => state.isLoading);
export const useFeedError = () => useFeedStore((state) => state.error);
export const useSelectedAnalysisId = () => useFeedStore((state) => state.selectedAnalysisId);

// Get a specific analysis by ID
export const useAnalysisById = (id: string | null) =>
  useFeedStore((state) => (id ? state.analyses.find((a) => a.id === id) : null));
