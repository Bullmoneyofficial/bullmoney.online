import type { ProductFilters } from '@/types/store';

/**
 * Utility functions for the store page
 */

export function getGridClasses(mobileColumns: number, desktopColumns: number): string {
  const desktopColClass = {
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    7: 'md:grid-cols-7',
    8: 'md:grid-cols-8',
    9: 'md:grid-cols-9',
  }[desktopColumns] || 'md:grid-cols-5';
  
  const mobileColClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[mobileColumns] || 'grid-cols-2';
  
  return `${mobileColClass} ${desktopColClass}`;
}

export function hasActiveFilters(
  filters: ProductFilters,
  debouncedSearch: string
): boolean {
  return !!(
    filters.category ||
    filters.min_price ||
    filters.max_price ||
    debouncedSearch
  );
}

export function buildUrlParams(
  filters: ProductFilters,
  debouncedSearch: string
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.min_price) params.set('min_price', filters.min_price.toString());
  if (filters.max_price) params.set('max_price', filters.max_price.toString());
  if (filters.sort_by && filters.sort_by !== 'newest') params.set('sort_by', filters.sort_by);
  if (debouncedSearch) params.set('search', debouncedSearch);
  return params;
}

export function getFocusMaxItems(
  isMobile: boolean,
  focusCardsLength: number,
  focusDesktopColumns: number,
  focusDesktopRows: number
): number {
  if (isMobile) {
    return Math.min(focusCardsLength, 9);
  }
  const columns = focusDesktopColumns;
  const rows = focusDesktopRows;
  return Math.max(1, columns * rows);
}

export function getGridViewProducts<T>(
  products: T[],
  isMobile: boolean,
  mobileColumns: number,
  desktopColumns: number,
  mobileRows: number,
  desktopRows: number
): T[] {
  const columns = isMobile ? mobileColumns : desktopColumns;
  const rows = isMobile ? mobileRows : desktopRows;
  if (!isFinite(rows)) return products;
  const maxItems = Math.max(1, columns * rows);
  return products.slice(0, maxItems);
}
