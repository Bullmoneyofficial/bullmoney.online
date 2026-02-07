import { Sparkles, TrendingUp } from 'lucide-react';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'best_selling', label: 'Best Selling' },
] as const;

export const CATEGORIES = [
  { value: '', label: 'All Products', icon: Sparkles },
  { value: 'apparel', label: 'Apparel', icon: null },
  { value: 'accessories', label: 'Accessories', icon: null },
  { value: 'tech-gear', label: 'Tech & Gear', icon: null },
  { value: 'home-office', label: 'Home Office', icon: null },
  { value: 'drinkware', label: 'Drinkware', icon: null },
  { value: 'limited-edition', label: 'Limited Edition', icon: TrendingUp },
] as const;

export const MOBILE_COLUMN_OPTIONS = [1, 2, 3, 4] as const;
export const DESKTOP_COLUMN_OPTIONS = [4, 5, 6, 7, 8, 9] as const;
export const GRID_ROW_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const FOCUS_LAYOUT_OPTIONS = [1, 2, 3] as const;
