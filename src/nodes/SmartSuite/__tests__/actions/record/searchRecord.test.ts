// src/nodes/SmartSuite/__tests__/actions/record/searchRecord.test.ts

import { IExecuteFunctions } from 'n8n-workflow';
import { execute as searchRecord } from '../../../actions/record/searchRecord.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Import the helper function
import { apiRequest } from '../../../transport/smartSuiteApi';
import * as validation from '../../../helpers/validation';

// Mock transport methods
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('../../../helpers/validation', () => ({
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'), // Mock getTableId here
}));

describe('SmartSuite – searchRecord Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({ items: [] });
  });

  it('should search records and return results', async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({ items: [{ id: 'record-1', name: 'Test Record' }] });

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: true,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'test@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    const result = await searchRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/tables/dummy-table-id/records/list/',
      {
        hydrated: true,
        offset: 0,
        limit: 50,
        filter: {
          operator: 'and',
          fields: [
            { field: 'email', comparison: 'equals', value: 'test@example.com' },
          ],
        },
      }
    );
    expect(result).toEqual([{ json: { id: 'record-1', name: 'Test Record' } }]);
  });

  it('should handle no matching records', async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({ items: [] });

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: false,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'nonexistent@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    const result = await searchRecord.call(executeMock);

    expect(result).toEqual([{ json: { search: 'No records match' } }]);
  });

  it('should handle errors from API', async () => {
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: true,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'error@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    await expect(searchRecord.call(executeMock)).rejects.toThrow('API Error');
  });

  it('should throw if getTableId fails', async () => {
    (validation.getTableId as jest.Mock).mockRejectedValueOnce(new Error('bad table'));

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {},
      apiRequestResponse: {},
    });

    await expect(searchRecord.call(executeMock)).rejects.toThrow('bad table');
  });

  // Test for empty response from API with returnAll=false
  it('should not paginate if returnAll=false even when API returns no results', async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({ items: [] });

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: false,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'test@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    const result = await searchRecord.call(executeMock);

    expect(result).toEqual([{ json: { search: 'No records match' } }]);
    expect(apiRequest).toHaveBeenCalledTimes(1);  // Ensure no pagination was done
  });

  // Test handling of unexpected empty API response
  it('should handle missing expected fields in API response', async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({});  // Malformed response instead of expected data

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: true,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'test@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    const result = await searchRecord.call(executeMock);

    expect(result).toEqual([{ json: { search: 'No records match' } }]);
  });

  // Test if hydrated flag works correctly
  it('should pass hydrated=true in the request when hydrated flag is true', async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({ items: [{ id: 'record-1', name: 'Test Record' }] });

    executeMock = createMockExecuteWithResources({
      inputData: [{ json: {} }],
      parameters: {
        returnAll: true,
        limit: 50,
        searchOperator: 'and',
        hydrated: true,  // Ensure hydrated flag is true
        filters: {
          filter: [
            { field: 'email', condition: 'equals', value: 'test@example.com' },
          ],
        },
      },
      apiRequestResponse: {},
    });

    const result = await searchRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/tables/dummy-table-id/records/list/',
      {
        hydrated: true,  // Ensure hydrated flag is passed in the API request
        offset: 0,
        limit: 50,
        filter: {
          operator: 'and',
          fields: [
            { field: 'email', comparison: 'equals', value: 'test@example.com' },
          ],
        },
      }
    );
    expect(result).toEqual([{ json: { id: 'record-1', name: 'Test Record' } }]);
  });
});
