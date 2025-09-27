// src/nodes/SmartSuite/helpers/cache.ts

/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Used to cache API responses and reduce redundant calls
 */

type CacheKey = string;
type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

// Global cache storage
const cacheStore = new Map<CacheKey, CacheEntry<any>>();

// Default TTL in milliseconds (60 seconds)
const DEFAULT_TTL_MS = 60000;

/**
 * Get a value from cache if it exists and hasn't expired
 * @param key - The cache key
 * @param ttlMs - Optional TTL in milliseconds (defaults to 60 seconds)
 * @returns The cached value or undefined if not found/expired
 */
export function getCache<T>(key: CacheKey, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
  const entry = cacheStore.get(key);

  if (!entry) {
    return undefined;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  // Check if entry has expired
  if (age > ttlMs) {
    // Remove expired entry
    cacheStore.delete(key);
    return undefined;
  }

  return entry.value as T;
}

/**
 * Set a value in the cache with timestamp
 * @param key - The cache key
 * @param value - The value to cache
 * @returns The cached value
 */
export function setCache<T>(key: CacheKey, value: T): T {
  const entry: CacheEntry<T> = {
    value,
    timestamp: Date.now(),
  };

  cacheStore.set(key, entry);
  return value;
}

/**
 * Clear a specific cache entry
 * @param key - The cache key to clear
 */
export function clearCache(key: CacheKey): boolean {
  return cacheStore.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cacheStore.clear();
}

/**
 * Get the size of the cache
 * @returns Number of entries in the cache
 */
export function getCacheSize(): number {
  return cacheStore.size;
}

/**
 * Clean up expired cache entries
 * @param ttlMs - TTL to check against (defaults to 60 seconds)
 */
export function cleanupExpiredCache(ttlMs: number = DEFAULT_TTL_MS): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cacheStore.entries()) {
    const age = now - entry.timestamp;
    if (age > ttlMs) {
      cacheStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Generate a cache key for field options
 * @param solutionId - The solution ID
 * @param tableId - The table ID
 * @param suffix - Optional suffix for the key
 * @returns A formatted cache key
 */
export function generateFieldsCacheKey(
  solutionId: string,
  tableId: string,
  suffix?: string
): string {
  const baseKey = `fields:${solutionId}:${tableId}`;
  return suffix ? `${baseKey}:${suffix}` : baseKey;
}