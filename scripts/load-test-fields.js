#!/usr/bin/env node

/**
 * Load Test Script for SmartSuite Field Loading
 *
 * This script simulates rapid field dropdown interactions to test:
 * 1. Rate limiting with retry mechanism
 * 2. Cache effectiveness
 * 3. Concurrent request handling
 * 4. Error resilience
 */

const { performance } = require('perf_hooks');

// Mock the SmartSuite API and loadOptions functionality
class MockSmartSuiteLoadTest {
  constructor() {
    this.requestCount = 0;
    this.rateLimitHits = 0;
    this.cacheHits = 0;
    this.cache = new Map();
    this.requestLog = [];

    // Simulate SmartSuite rate limiting (allow 10 requests per second)
    this.rateLimitWindowMs = 1000;
    this.rateLimitMax = 10;
    this.requestTimes = [];
  }

  // Simulate cache behavior
  generateFieldsCacheKey(solutionId, tableId, suffix = '') {
    const baseKey = `fields:${solutionId}:${tableId}`;
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  getCache(key, ttlMs = 60000) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const age = Date.now() - entry.timestamp;
    if (age > ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    this.cacheHits++;
    return entry.value;
  }

  setCache(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  // Simulate rate limiting check
  isRateLimited() {
    const now = Date.now();

    // Remove requests older than window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.rateLimitWindowMs);

    // Check if we've exceeded the limit
    if (this.requestTimes.length >= this.rateLimitMax) {
      return true;
    }

    this.requestTimes.push(now);
    return false;
  }

  // Simulate API request with retry logic
  async makeApiRequest(endpoint, retryCount = 0) {
    const maxRetries = 5;
    this.requestCount++;

    try {
      // Check rate limiting
      if (this.isRateLimited()) {
        this.rateLimitHits++;

        if (retryCount >= maxRetries) {
          throw new Error('Rate limit exceeded after maximum retries');
        }

        // Simulate exponential backoff
        const delayMs = Math.min(30000, 500 * Math.pow(2, retryCount));
        console.log(`Rate limited. Retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${retryCount + 1}/${maxRetries + 1})`);

        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.makeApiRequest(endpoint, retryCount + 1);
      }

      // Simulate successful API response
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Random latency

      return {
        structure: [
          { slug: 'name', label: 'Name', field_type: 'textfield' },
          { slug: 'email', label: 'Email', field_type: 'emailfield' },
          { slug: 'status', label: 'Status', field_type: 'statusfield' },
          { slug: 'created_date', label: 'Created Date', field_type: 'datefield' },
          { slug: 'description', label: 'Description', field_type: 'textfield' },
        ]
      };
    } catch (error) {
      this.requestLog.push({
        endpoint,
        timestamp: Date.now(),
        success: false,
        error: error.message,
        retryCount
      });
      throw error;
    }
  }

  // Simulate searchTableFields with caching
  async searchTableFields(solutionId, tableId, filter = '') {
    const cacheKey = this.generateFieldsCacheKey(solutionId, tableId);

    // Check cache first
    let structure = this.getCache(cacheKey);

    if (!structure) {
      // Make API request if not cached
      const response = await this.makeApiRequest(`/applications/${tableId}/`);
      structure = response.structure;

      // Cache the result
      this.setCache(cacheKey, structure);
    }

    // Apply filter
    const filtered = structure.filter(f =>
      !filter ||
      f.label.toLowerCase().includes(filter.toLowerCase()) ||
      f.slug.toLowerCase().includes(filter.toLowerCase())
    );

    this.requestLog.push({
      endpoint: `/applications/${tableId}/`,
      timestamp: Date.now(),
      success: true,
      cached: structure !== undefined,
      filtered: filtered.length,
      retryCount: 0
    });

    return { results: filtered.map(f => ({ name: `${f.label} (${f.field_type})`, value: f.slug })) };
  }
}

// Load test scenarios
class FieldLoadTestRunner {
  constructor() {
    this.api = new MockSmartSuiteLoadTest();
  }

  // Test 1: Rapid field loading (simulates opening node with many fields)
  async testRapidFieldLoading() {
    console.log('\n🧪 Test 1: Rapid Field Loading');
    console.log('Simulating opening a node with 15 field selectors...');

    const start = performance.now();
    const promises = [];

    // Simulate 15 field dropdowns loading simultaneously
    for (let i = 0; i < 15; i++) {
      promises.push(
        this.api.searchTableFields('solution123', 'table456', '')
      );
    }

    try {
      await Promise.all(promises);
      const end = performance.now();
      console.log(`✅ Completed in ${(end - start).toFixed(1)}ms`);
      console.log(`📊 Requests: ${this.api.requestCount}, Cache hits: ${this.api.cacheHits}, Rate limits: ${this.api.rateLimitHits}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  // Test 2: Burst requests (simulates adding fields rapidly)
  async testBurstRequests() {
    console.log('\n🧪 Test 2: Burst Field Addition');
    console.log('Simulating rapidly adding 25 new field selectors...');

    this.api.requestCount = 0;
    this.api.cacheHits = 0;
    this.api.rateLimitHits = 0;

    const start = performance.now();

    // Add fields one by one quickly (simulates user clicking "Add Field" rapidly)
    for (let i = 0; i < 25; i++) {
      try {
        await this.api.searchTableFields('solution123', 'table456', '');

        // Small delay to simulate UI rendering time
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.log(`❌ Field ${i + 1} failed: ${error.message}`);
        break;
      }
    }

    const end = performance.now();
    console.log(`✅ Completed in ${(end - start).toFixed(1)}ms`);
    console.log(`📊 Requests: ${this.api.requestCount}, Cache hits: ${this.api.cacheHits}, Rate limits: ${this.api.rateLimitHits}`);
  }

  // Test 3: Mixed workload (different tables and solutions)
  async testMixedWorkload() {
    console.log('\n🧪 Test 3: Mixed Workload');
    console.log('Simulating multiple tables and solutions...');

    this.api.requestCount = 0;
    this.api.cacheHits = 0;
    this.api.rateLimitHits = 0;

    const start = performance.now();
    const promises = [];

    // Mix of different solution/table combinations
    const combinations = [
      ['solution1', 'table1'],
      ['solution1', 'table2'],
      ['solution2', 'table1'],
      ['solution2', 'table2'],
      ['solution3', 'table3'],
    ];

    // Create multiple requests for each combination
    for (let round = 0; round < 5; round++) {
      for (const [solutionId, tableId] of combinations) {
        promises.push(
          this.api.searchTableFields(solutionId, tableId, '')
        );
      }
    }

    try {
      await Promise.all(promises);
      const end = performance.now();
      console.log(`✅ Completed ${promises.length} requests in ${(end - start).toFixed(1)}ms`);
      console.log(`📊 Requests: ${this.api.requestCount}, Cache hits: ${this.api.cacheHits}, Rate limits: ${this.api.rateLimitHits}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  // Test 4: Cache effectiveness test
  async testCacheEffectiveness() {
    console.log('\n🧪 Test 4: Cache Effectiveness');
    console.log('Testing cache hit rate with repeated requests...');

    this.api.requestCount = 0;
    this.api.cacheHits = 0;
    this.api.rateLimitHits = 0;

    const start = performance.now();

    // First request - should miss cache
    await this.api.searchTableFields('cacheTest', 'table123', '');

    // Multiple subsequent requests - should hit cache
    for (let i = 0; i < 20; i++) {
      await this.api.searchTableFields('cacheTest', 'table123', '');
    }

    const end = performance.now();
    const hitRate = (this.api.cacheHits / (this.api.cacheHits + this.api.requestCount)) * 100;

    console.log(`✅ Completed in ${(end - start).toFixed(1)}ms`);
    console.log(`📊 Cache hit rate: ${hitRate.toFixed(1)}% (${this.api.cacheHits} hits, ${this.api.requestCount} API calls)`);
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting SmartSuite Field Loading Load Tests');
    console.log('============================================');

    await this.testRapidFieldLoading();
    await this.testBurstRequests();
    await this.testMixedWorkload();
    await this.testCacheEffectiveness();

    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`Total API requests made: ${this.api.requestCount}`);
    console.log(`Total cache hits: ${this.api.cacheHits}`);
    console.log(`Total rate limit hits: ${this.api.rateLimitHits}`);
    console.log(`Cache size: ${this.api.cache.size} entries`);

    const successRate = (this.api.requestLog.filter(r => r.success).length / this.api.requestLog.length) * 100;
    console.log(`Overall success rate: ${successRate.toFixed(1)}%`);

    if (this.api.rateLimitHits > 0) {
      console.log('✅ Retry mechanism successfully handled rate limiting');
    }

    if (this.api.cacheHits > 0) {
      console.log('✅ Caching mechanism successfully reduced API calls');
    }

    console.log('\n🎉 Load tests completed!');
  }
}

// Run the tests
if (require.main === module) {
  const runner = new FieldLoadTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = { FieldLoadTestRunner, MockSmartSuiteLoadTest };