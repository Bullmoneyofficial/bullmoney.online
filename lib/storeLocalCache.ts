/**
 * Store Local Cache
 * 
 * Caches store-related SQL data locally (orders, addresses, settings, cart, wishlist)
 * so users don't re-fetch on every page load or navigation between app↔store.
 * 
 * Data is stored in localStorage with timestamps for staleness checking.
 * Cache is invalidated after mutations (place order, update address, etc.).
 */

const STORE_CACHE_PREFIX = 'bullmoney_store_cache_';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes default TTL

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  email: string; // scoped per-user
}

// ============================================================================
// GENERIC CACHE HELPERS
// ============================================================================

function getCacheKey(type: string, email: string): string {
  return `${STORE_CACHE_PREFIX}${type}_${email.toLowerCase()}`;
}

function setCache<T>(type: string, email: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      email: email.toLowerCase(),
    };
    localStorage.setItem(getCacheKey(type, email), JSON.stringify(entry));
  } catch (e) {
    // Quota exceeded - silently fail, Supabase will be queried instead
  }
}

function getCache<T>(type: string, email: string, ttl: number = CACHE_TTL): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getCacheKey(type, email));
    if (!raw) return null;
    
    const entry: CacheEntry<T> = JSON.parse(raw);
    
    // Check if expired
    if (Date.now() - entry.timestamp > ttl) {
      localStorage.removeItem(getCacheKey(type, email));
      return null;
    }
    
    // Check if same user
    if (entry.email !== email.toLowerCase()) {
      localStorage.removeItem(getCacheKey(type, email));
      return null;
    }
    
    return entry.data;
  } catch (e) {
    return null;
  }
}

function invalidateCache(type: string, email: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getCacheKey(type, email));
  } catch (e) {
    // Ignore
  }
}

// ============================================================================
// SPECIFIC CACHE TYPES
// ============================================================================

// Orders
export function cacheOrders(email: string, orders: any[]): void {
  setCache('orders', email, orders);
}

export function getCachedOrders(email: string): any[] | null {
  return getCache<any[]>('orders', email);
}

export function invalidateOrders(email: string): void {
  invalidateCache('orders', email);
}

// Addresses
export function cacheAddresses(email: string, addresses: any[]): void {
  setCache('addresses', email, addresses);
}

export function getCachedAddresses(email: string): any[] | null {
  return getCache<any[]>('addresses', email);
}

export function invalidateAddresses(email: string): void {
  invalidateCache('addresses', email);
}

// User Settings (from recruits table)
export function cacheUserSettings(email: string, settings: Record<string, any>): void {
  setCache('settings', email, settings);
}

export function getCachedUserSettings(email: string): Record<string, any> | null {
  return getCache<Record<string, any>>('settings', email);
}

export function invalidateUserSettings(email: string): void {
  invalidateCache('settings', email);
}

// Cart
export function cacheCart(email: string, cart: any[]): void {
  setCache('cart', email, cart);
}

export function getCachedCart(email: string): any[] | null {
  return getCache<any[]>('cart', email);
}

export function invalidateCart(email: string): void {
  invalidateCache('cart', email);
}

// Wishlist
export function cacheWishlist(email: string, wishlist: any[]): void {
  setCache('wishlist', email, wishlist);
}

export function getCachedWishlist(email: string): any[] | null {
  return getCache<any[]>('wishlist', email);
}

export function invalidateWishlist(email: string): void {
  invalidateCache('wishlist', email);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Clear all store caches for a user (e.g., on sign-out)
 */
export function clearAllStoreCache(email: string): void {
  if (typeof window === 'undefined') return;
  const types = ['orders', 'addresses', 'settings', 'cart', 'wishlist'];
  types.forEach(type => invalidateCache(type, email));
}

/**
 * Clear all store caches globally (e.g., on cache bust)
 */
export function clearAllStoreCaches(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORE_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Ignore
  }
}
