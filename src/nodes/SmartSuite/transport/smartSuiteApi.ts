// src/nodes/SmartSuite/transport/smartSuiteApi.ts

import type {
  IAllExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Core HTTP request function.
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
    const status = error.response?.status;
    const apiError = error.response?.data as Record<string, unknown> | undefined;

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
      throw new NodeOperationError(
        this.getNode(),
        `SmartSuite API Error (${status}): ${JSON.stringify(apiError)}`,
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
