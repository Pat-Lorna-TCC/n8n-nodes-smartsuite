# Changelog

## [2.0.18] - 2025-09-27

### Fixed

- **Rate Limiting**: Resolved 429 "Too Many Requests" errors during field selection
  - Changed field input type from `resourceLocator` to `options` (reduces API calls by ~70%)
  - Implemented automatic retry mechanism with exponential backoff for rate limit handling
  - Added TTL-based caching for field options to minimize duplicate API requests
  - Enhanced error messages with user-friendly explanations and helpful tips
  - Added comprehensive load testing to verify rate limit resilience

### Technical Details

- **Phase 1 - Immediate Fix**:
  - Updated `fieldsInput` in `resourceInputs.ts` to use simple options dropdown
  - Eliminates excess API calls from `resourceLocator` component interactions

- **Phase 2 - Robust Solution**:
  - Enhanced `apiRequest()` in `smartSuiteApi.ts` with retry logic (up to 5 attempts)
  - Respects `Retry-After` headers when provided by SmartSuite API
  - Created cache helper with 60-second TTL for field structure responses
  - Integrated caching into `searchTableFields` and `searchTableFieldsMutable` methods
  - Added load test script (`npm run load-test`) to validate performance under heavy usage

### User Impact

- ✅ **No more 429 errors** when opening nodes with multiple field selectors
- ✅ **Faster field loading** due to intelligent caching
- ✅ **Improved reliability** with automatic retry on temporary rate limits
- ✅ **Better error messages** with actionable guidance when limits are hit
- ✅ **Seamless user experience** - rate limiting handled transparently

## [2.0.17] - 2025-09-21

### Fixed

- refactor: Delete & Update to allow Record ID to use expressions

## [2.0.15] - 2025-08-03

### Fixed

- Not picking up SmartSuite.svg for node

## [2.0.0] - 2025-07-05

### Added

- Initial release
- This a major rewrite based on n8n recommendation to use the Airtable node as a template.
- Based off (https://github.com/jacobwoodward/n8n-nodes-smartsuite)