// src/nodes/SmartSuite/__tests__/helpers/cache.test.ts

import {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  getCacheSize,
  cleanupExpiredCache,
  generateFieldsCacheKey,
} from '../../helpers/cache';

describe('Cache Helper', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearAllCache();
  });

  describe('setCache and getCache', () => {
    it('should store and retrieve values correctly', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Set cache
      const result = setCache(key, value);
      expect(result).toBe(value);

      // Get cache
      const retrieved = getCache(key);
      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const result = getCache('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should handle different data types', () => {
      setCache('string', 'test');
      setCache('number', 42);
      setCache('array', [1, 2, 3]);
      setCache('object', { foo: 'bar' });

      expect(getCache('string')).toBe('test');
      expect(getCache('number')).toBe(42);
      expect(getCache('array')).toEqual([1, 2, 3]);
      expect(getCache('object')).toEqual({ foo: 'bar' });
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return value before TTL expires', () => {
      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = 5000; // 5 seconds

      setCache(key, value);

      // Advance time by 3 seconds (less than TTL)
      jest.advanceTimersByTime(3000);

      const result = getCache(key, ttl);
      expect(result).toBe(value);
    });

    it('should return undefined after TTL expires', () => {
      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = 5000; // 5 seconds

      setCache(key, value);

      // Advance time by 6 seconds (more than TTL)
      jest.advanceTimersByTime(6000);

      const result = getCache(key, ttl);
      expect(result).toBeUndefined();
    });

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl-test';
      const value = 'test-value';

      setCache(key, value);

      // Advance time by 30 seconds (less than default 60 seconds)
      jest.advanceTimersByTime(30000);
      expect(getCache(key)).toBe(value);

      // Advance time by another 35 seconds (total 65 seconds, more than default)
      jest.advanceTimersByTime(35000);
      expect(getCache(key)).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should clear specific cache entries', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');

      expect(getCache('key1')).toBe('value1');
      expect(getCache('key2')).toBe('value2');

      const cleared = clearCache('key1');
      expect(cleared).toBe(true);

      expect(getCache('key1')).toBeUndefined();
      expect(getCache('key2')).toBe('value2');
    });

    it('should return false when clearing non-existent key', () => {
      const cleared = clearCache('non-existent');
      expect(cleared).toBe(false);
    });

    it('should clear all cache entries', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      setCache('key3', 'value3');

      expect(getCacheSize()).toBe(3);

      clearAllCache();

      expect(getCacheSize()).toBe(0);
      expect(getCache('key1')).toBeUndefined();
      expect(getCache('key2')).toBeUndefined();
      expect(getCache('key3')).toBeUndefined();
    });

    it('should report correct cache size', () => {
      expect(getCacheSize()).toBe(0);

      setCache('key1', 'value1');
      expect(getCacheSize()).toBe(1);

      setCache('key2', 'value2');
      expect(getCacheSize()).toBe(2);

      clearCache('key1');
      expect(getCacheSize()).toBe(1);
    });
  });

  describe('cleanupExpiredCache', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clean up expired entries and return count', () => {
      const ttl = 5000; // 5 seconds

      // Add some entries
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      setCache('key3', 'value3');

      expect(getCacheSize()).toBe(3);

      // Advance time to expire entries
      jest.advanceTimersByTime(6000);

      // Clean up expired entries
      const cleaned = cleanupExpiredCache(ttl);

      expect(cleaned).toBe(3);
      expect(getCacheSize()).toBe(0);
    });

    it('should not clean up non-expired entries', () => {
      const ttl = 5000; // 5 seconds

      setCache('key1', 'value1');

      // Advance time but not past TTL
      jest.advanceTimersByTime(3000);

      const cleaned = cleanupExpiredCache(ttl);

      expect(cleaned).toBe(0);
      expect(getCacheSize()).toBe(1);
      expect(getCache('key1', ttl)).toBe('value1');
    });
  });

  describe('generateFieldsCacheKey', () => {
    it('should generate correct cache key format', () => {
      const key = generateFieldsCacheKey('sol123', 'table456');
      expect(key).toBe('fields:sol123:table456');
    });

    it('should generate cache key with suffix', () => {
      const key = generateFieldsCacheKey('sol123', 'table456', 'mutable');
      expect(key).toBe('fields:sol123:table456:mutable');
    });

    it('should handle empty suffix', () => {
      const key = generateFieldsCacheKey('sol123', 'table456', '');
      expect(key).toBe('fields:sol123:table456');
    });
  });
});