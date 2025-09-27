// src/nodes/SmartSuite/transport/smartSuiteApi.ts

import type {
  IAllExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Helper function to delay execution for retry logic
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core HTTP request function with retry logic for rate limiting.
 * - Implements exponential backoff for 429 errors
 * - Respects Retry-After headers when provided
 * - customHeaders: extra headers to merge in
 * - absolute-URL detection
 */
export async function apiRequest<T = any>(
  this: IAllExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  customHeaders: IDataObject = {},
  maxRetries = 5,
): Promise<T> {
  const creds = await this.getCredentials('smartSuiteApi');
  if (!creds.apiKey || !creds.accountId || !creds.baseUrl) {
    throw new NodeOperationError(
      this.getNode(),
      'Missing required SmartSuite credentials. Please check API Key, Account ID, and Base URL.',
    );
  }

  const originalEndpoint = endpoint;
  let urlPath = endpoint;
  if (urlPath.startsWith('/tables/')) {
    urlPath = urlPath.replace(/^\/tables\//, '/applications/');
  }

  let finalUrl: string;
  if (/^https?:\/\//.test(urlPath)) {
    finalUrl = urlPath;
  } else {
    if (
      !creds.baseUrl ||
      typeof creds.baseUrl !== 'string' ||
      !creds.baseUrl.startsWith('http')
    ) {
      throw new NodeOperationError(
        this.getNode(),
        `SmartSuite baseUrl is missing or malformed: ${creds.baseUrl}`,
      );
    }
    finalUrl = `${creds.baseUrl}${urlPath}`;
  }

  const options: IHttpRequestOptions = {
    method,
    url: finalUrl,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Token ${creds.apiKey}`,
      'Account-Id': creds.accountId,
      ...customHeaders,
    },
    qs,
    json: true,
    body: method === 'GET' ? undefined : body,
  };

  // Retry loop with exponential backoff for rate limiting
  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
      const httpRequest = this.helpers.httpRequest;
      if (typeof httpRequest !== 'function') {
        throw new NodeOperationError(
          this.getNode(),
          'HTTP Request helper not available',
        );
      }
      return (await httpRequest(options)) as T;
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const apiError = error.response?.data as Record<string, unknown> | undefined;

      // Handle rate limiting with retry
      if (status === 429 && attempt < maxRetries) {
        attempt++;

        // Check for Retry-After header
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        let delayMs: number;

        if (retryAfterHeader) {
          // Retry-After can be in seconds or HTTP date format
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(retryAfterSeconds)) {
            delayMs = retryAfterSeconds * 1000;
          } else {
            // Try to parse as date
            const retryDate = new Date(retryAfterHeader);
            if (!isNaN(retryDate.getTime())) {
              delayMs = Math.max(0, retryDate.getTime() - Date.now());
            } else {
              // Fallback to exponential backoff
              delayMs = Math.min(30000, 500 * Math.pow(2, attempt - 1));
            }
          }
        } else {
          // Exponential backoff: 0.5s, 1s, 2s, 4s, 8s... capped at 30s
          delayMs = Math.min(30000, 500 * Math.pow(2, attempt - 1));
        }

        // Log the retry attempt - helpful for debugging
        console.log(`SmartSuite rate limit hit. Automatically retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxRetries})`);

        await sleep(delayMs);
        continue; // Retry the request
      }

      // Handle other errors (non-429 or max retries exceeded)
      if (status === 429) {
        // Max retries exceeded for rate limiting
        throw new NodeOperationError(
          this.getNode(),
          'SmartSuite API rate limit exceeded after multiple retries. ' +
          'Please wait a moment before trying again. ' +
          'Tip: If this happens frequently, consider spacing out your operations or reducing the number of simultaneous field selections.',
          {
            description: 'The SmartSuite API is temporarily limiting requests. This is normal when making many rapid changes.'
          },
        );
      }

      if (
        status === 400 &&
        apiError &&
        Object.values(apiError)[0] === 'Not allowed comparison.'
      ) {
        throw new NodeOperationError(
          this.getNode(),
          'Invalid comparison for that field type. See https://developers.smartsuite.com/docs/solution-data/records/sort-filter#operators-by-field-type for valid operators.',
        );
      }

      if (apiError && typeof apiError === 'object') {
        // Format the error message more user-friendly
        let errorMessage = 'SmartSuite API Error: ';

        // Try to extract a meaningful error message from the API response
        if (apiError.message) {
          errorMessage += apiError.message;
        } else if (apiError.error) {
          errorMessage += apiError.error;
        } else if (apiError.detail) {
          errorMessage += apiError.detail;
        } else {
          // Fallback to stringified error
          errorMessage += JSON.stringify(apiError);
        }

        throw new NodeOperationError(
          this.getNode(),
          errorMessage,
          {
            description: `HTTP ${status} error from SmartSuite API`
          },
        );
      }

      if (status === 404) {
        let resourceType = 'Record';
        if (originalEndpoint.startsWith('/solutions/')) {
          resourceType = 'Solution';
        } else if (originalEndpoint.startsWith('/tables/')) {
          resourceType = 'Table';
        }
        const parts = finalUrl.split('/');
        const id = parts[parts.length - 1] || parts[parts.length - 2];
        throw new NodeOperationError(
          this.getNode(),
          `The resource you are requesting could not be found
${id} is not a valid ${resourceType} ID`,
        );
      }

      throw error;
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Fetch all items from a paginated endpoint (limit/offset).
 */
export async function paginatedRequest(
  this: IAllExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  pageSize = 100,
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let offset = 0;

  while (true) {
    const response = await apiRequest.call(
      this,
      method,
      endpoint,
      body,
      { ...qs, limit: pageSize, offset },
    );

    let pageArray: any[] = [];
    if (Array.isArray(response)) {
      pageArray = response;
    } else if (Array.isArray((response as any).data)) {
      pageArray = (response as any).data;
    } else if (Array.isArray((response as any).results)) {
      pageArray = (response as any).results;
    } else if (response != null && typeof response === 'object') {
      pageArray = [response as any];
    }

    allItems.push(...pageArray);
    if (pageArray.length < pageSize) break;
    offset += pageSize;
  }

  return allItems;
}

export { paginatedRequest as apiRequestAllItems };
