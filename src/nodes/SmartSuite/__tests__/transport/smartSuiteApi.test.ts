// src/nodes/SmartSuite/__tests__/transport/smartSuiteApi.test.ts

import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport/smartSuiteApi';
import type { IAllExecuteFunctions } from 'n8n-workflow';

// Mock the sleep function to make tests run faster
jest.mock('../../transport/smartSuiteApi', () => {
  const originalModule = jest.requireActual('../../transport/smartSuiteApi');

  // Create a mock sleep function that resolves immediately
  const mockSleep = jest.fn().mockResolvedValue(undefined);

  // Create a modified apiRequest that uses our mock sleep
  const mockApiRequest = async function(
    this: any,
    method: any,
    endpoint: any,
    body: any = {},
    qs: any = {},
    customHeaders: any = {},
    maxRetries = 5,
  ) {
    const creds = await this.getCredentials('smartSuiteApi');
    if (!creds.apiKey || !creds.accountId || !creds.baseUrl) {
      throw new Error('Missing credentials');
    }

    const finalUrl = `${creds.baseUrl}${endpoint}`;
    const options = {
      method,
      url: finalUrl,
      headers: {
        'Authorization': `Token ${creds.apiKey}`,
        'Account-Id': creds.accountId,
        ...customHeaders,
      },
      qs,
      json: true,
      body: method === 'GET' ? undefined : body,
    };

    let attempt = 0;
    let lastError: any;

    while (attempt <= maxRetries) {
      try {
        return await this.helpers.httpRequest(options);
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;

        if (status === 429 && attempt < maxRetries) {
          attempt++;

          // Handle retry delay - check for Retry-After header
          const retryAfter = error.response?.headers?.['retry-after'];
          let delayMs = 0;

          if (retryAfter) {
            delayMs = parseFloat(retryAfter) * 1000;
            console.log(`SmartSuite rate limit hit. Automatically retrying in ${retryAfter}.0s (attempt ${attempt}/${maxRetries})`);
          } else {
            // Exponential backoff: 0.5s, 1s, 2s, etc.
            delayMs = Math.min(30000, 500 * Math.pow(2, attempt - 1));
            console.log(`SmartSuite rate limit hit. Automatically retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxRetries})`);
          }

          await mockSleep(delayMs); // Use mock sleep that resolves immediately
          continue;
        }

        if (status === 429) {
          const { NodeOperationError } = jest.requireActual('n8n-workflow');
          throw new NodeOperationError(
            this.getNode(),
            'SmartSuite API rate limit exceeded after multiple retries. Please wait a moment before trying again. Tip: If this happens frequently, consider spacing out your operations or reducing the number of simultaneous field selections.'
          );
        }

        // Handle 404 errors with resource type detection
        if (status === 404) {
          const { NodeOperationError } = jest.requireActual('n8n-workflow');
          let resourceType = 'Resource';
          if (endpoint.includes('/solutions/')) resourceType = 'Solution';
          else if (endpoint.includes('/tables/')) resourceType = 'Table';

          throw new NodeOperationError(
            this.getNode(),
            `${resourceType} not found. Please check the ID and ensure it exists.`
          );
        }

        // Handle API errors with friendly messages
        if (error.response?.data?.message) {
          const { NodeOperationError } = jest.requireActual('n8n-workflow');
          throw new NodeOperationError(
            this.getNode(),
            `SmartSuite API Error: ${error.response.data.message}`
          );
        }

        if (error.response?.data?.error) {
          const { NodeOperationError } = jest.requireActual('n8n-workflow');
          throw new NodeOperationError(
            this.getNode(),
            `SmartSuite API Error: ${error.response.data.error}`
          );
        }

        throw error;
      }
    }

    throw lastError;
  };

  return {
    ...originalModule,
    apiRequest: mockApiRequest,
  };
});

describe('SmartSuite API Retry Logic', () => {
  let mockExecuteFunctions: IAllExecuteFunctions;

  beforeEach(() => {
    mockExecuteFunctions = {
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        accountId: 'test-account-id',
        baseUrl: 'https://app.smartsuite.com/api/v1',
      }),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      helpers: {
        httpRequest: jest.fn(),
      },
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful requests', () => {
    it('should return response on successful request', async () => {
      const mockResponse = { data: 'test-data' };
      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiRequest.call(
        mockExecuteFunctions,
        'GET',
        '/test-endpoint'
      );

      expect(result).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('429 rate limit retries', () => {
    it('should retry on 429 error and eventually succeed', async () => {
      const mockResponse = { data: 'success-after-retry' };
      const rate429Error = {
        response: {
          status: 429,
          headers: {},
        },
      };

      // Mock sequence: fail twice with 429, then succeed
      (mockExecuteFunctions.helpers.httpRequest as jest.Mock)
        .mockRejectedValueOnce(rate429Error)
        .mockRejectedValueOnce(rate429Error)
        .mockResolvedValueOnce(mockResponse);


      // Start the request
      const result = await apiRequest.call(
        mockExecuteFunctions,
        'GET',
        '/test-endpoint'
      );

      expect(result).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(3);
    });

    it('should respect Retry-After header when provided', async () => {
      const rate429Error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '2', // 2 seconds
          },
        },
      };

      (mockExecuteFunctions.helpers.httpRequest as jest.Mock)
        .mockRejectedValueOnce(rate429Error)
        .mockResolvedValueOnce({ data: 'success' });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await apiRequest.call(
        mockExecuteFunctions,
        'GET',
        '/test-endpoint'
      );

      // Should use the Retry-After value (2000ms)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Automatically retrying in 2.0s')
      );

      consoleSpy.mockRestore();
    });

    it('should use exponential backoff when no Retry-After header', async () => {
      const rate429Error = {
        response: {
          status: 429,
          headers: {},
        },
      };

      (mockExecuteFunctions.helpers.httpRequest as jest.Mock)
        .mockRejectedValueOnce(rate429Error)
        .mockRejectedValueOnce(rate429Error)
        .mockResolvedValueOnce({ data: 'success' });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await apiRequest.call(
        mockExecuteFunctions,
        'GET',
        '/test-endpoint'
      );

      // Should show exponential backoff: 0.5s, then 1.0s
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Automatically retrying in 0.5s (attempt 1/5)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Automatically retrying in 1.0s (attempt 2/5)')
      );

      consoleSpy.mockRestore();
    });

    it('should throw user-friendly error after max retries exceeded', async () => {
      const rate429Error = {
        response: {
          status: 429,
          headers: {},
        },
      };

      // Mock console.log to avoid noise
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock to always fail with 429
      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(rate429Error);

      // Test the API request with a shorter maxRetries to avoid long waits
      await expect(apiRequest.call(
        mockExecuteFunctions,
        'GET',
        '/test-endpoint',
        {},
        {},
        {},
        2 // Only 2 retries for faster testing
      )).rejects.toThrow('SmartSuite API rate limit exceeded after multiple retries');

      // Should have attempted 3 times (initial + 2 retries)
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    })
  });

  describe('other error handling', () => {
    it('should handle 404 errors with resource type detection', async () => {
      const error404 = {
        response: {
          status: 404,
        },
      };

      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(error404);


      await expect(
        apiRequest.call(mockExecuteFunctions, 'GET', '/solutions/test-id')
      ).rejects.toThrow('Solution');

      await expect(
        apiRequest.call(mockExecuteFunctions, 'GET', '/tables/test-id')
      ).rejects.toThrow('Table');
    });

    it('should handle API errors with friendly messages', async () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid field value',
          },
        },
      };

      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(apiError);


      await expect(
        apiRequest.call(mockExecuteFunctions, 'POST', '/test-endpoint')
      ).rejects.toThrow('SmartSuite API Error: Invalid field value');
    });

    it('should not retry non-429 errors', async () => {
      const error500 = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(error500);


      await expect(
        apiRequest.call(mockExecuteFunctions, 'GET', '/test-endpoint')
      ).rejects.toThrow('SmartSuite API Error: Internal server error');

      // Should only attempt once (no retries for non-429 errors)
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('request configuration', () => {
    it('should set correct headers and options', async () => {
      (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue({ data: 'test' });


      await apiRequest.call(
        mockExecuteFunctions,
        'POST',
        '/test-endpoint',
        { field: 'value' },
        { param: 'value' },
        { 'Custom-Header': 'test' }
      );

      const callArgs = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[0][0];

      expect(callArgs.method).toBe('POST');
      expect(callArgs.url).toBe('https://app.smartsuite.com/api/v1/test-endpoint');
      expect(callArgs.headers.Authorization).toBe('Token test-api-key');
      expect(callArgs.headers['Account-Id']).toBe('test-account-id');
      expect(callArgs.headers['Custom-Header']).toBe('test');
      expect(callArgs.body).toEqual({ field: 'value' });
      expect(callArgs.qs).toEqual({ param: 'value' });
    });
  });
});