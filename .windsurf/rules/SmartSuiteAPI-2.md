---
trigger: always_on
---

# SmartSuite API Integration Rules - Part 2

## Table of Contents
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)

## Best Practices

1. **Request Optimization**
   - Use `hydrated` parameter when you need related data
   - Only request necessary fields
   - Implement pagination for large datasets

2. **Error Handling**
   - Handle 429 (Too Many Requests) with exponential backoff
   - Log detailed error information
   - Provide user-friendly error messages

3. **Data Consistency**
   - Use ETags for optimistic concurrency control
   - Implement retry logic for failed requests
   - Cache responses when appropriate

## Error Handling

### Common Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded

### Error Response Format
- [Errors](https://developers.smartsuite.com/docs/errors)
```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message"
  }
}
```

## Rate Limiting
[Rate Limits Documentation](https://developers.smartsuite.com/docs/rate-limits)

### Rate Limit Details
- **Default Limit**: 60 requests per minute per access token
- **Response Headers**:
  - `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
  - `X-RateLimit-Remaining`: Remaining requests in the current window
  - `X-RateLimit-Reset`: Timestamp when the rate limit resets

### Best Practices
- Implement exponential backoff with jitter for retries
- Cache responses when possible to reduce API calls
- Handle 429 responses gracefully with appropriate retry logic
- Monitor your usage to stay within limits

### Example Retry Logic
```typescript
async function makeRequestWithRetry(requestFn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status !== 429) throw error;
      
      // Calculate wait time with exponential backoff and jitter
      const waitTime = Math.min(
        Math.pow(2, i) * 1000 + Math.random() * 1000,
        30000 // Max 30 seconds
      );
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      lastError = error;
    }
  }
  
  throw lastError;
}
```

## Testing

1. **Unit Tests**
   - Mock all API responses
   - Test error conditions
   - Verify request/response formats

2. **Integration Tests**
   - Use test credentials
   - Clean up test data
   - Test rate limiting scenarios

## Development Notes

- Always use HTTPS
- Keep API client up to date
- Monitor API versioning
- Document any workarounds or known issues

---
*Last Updated: 2025-05-22*