// src/nodes/SmartSuite/__tests__/actions/record/listRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as listRecord } from '../../../actions/record/listRecord.operation';
import { apiRequest, paginatedRequest } from '../../../transport/smartSuiteApi';
import { NodeOperationError } from 'n8n-workflow';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Import helper function

// Import validation helpers correctly
import * as validation from '../../../helpers/validation'; // Add this import

// Mock validation helpers
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),
}));

// Mock transport methods
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
  paginatedRequest: jest.fn(),
}));

describe('SmartSuite – listRecord Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return limited records when returnAll is false', async () => {
    const fakeRecords = [{ id: '1' }, { id: '2' }];
    (apiRequest as jest.Mock).mockResolvedValue({ items: fakeRecords });
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: true, returnAll: false, limit: 1 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      `/applications/dummy-table-id/records/list/`,
      { hydrated: true, limit: 1 },
    );
    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(fakeRecords[0]);
  });

  it('should return all records when returnAll is true', async () => {
    const fakeRecords = [{ id: '1' }, { id: '2' }, { id: '3' }];
    (paginatedRequest as jest.Mock).mockResolvedValue(fakeRecords);
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: false, returnAll: true },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(paginatedRequest).toHaveBeenCalledWith(
      'POST',
      `/applications/dummy-table-id/records/list/`,
      { hydrated: false },
    );
    expect(result).toHaveLength(fakeRecords.length);
    expect(result.map(r => r.json)).toEqual(fakeRecords);
  });

  it('should handle bare array response', async () => {
    const fakeRecords = [{ id: 'a' }, { id: 'b' }];
    (apiRequest as jest.Mock).mockResolvedValue(fakeRecords);
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: true, returnAll: false, limit: 5 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(result).toHaveLength(fakeRecords.length);
    expect(result.map(r => r.json)).toEqual(fakeRecords);
  });

  it('should handle data wrapper response', async () => {
    const fakeRecords = [{ id: 'x' }];
    (apiRequest as jest.Mock).mockResolvedValue({ data: fakeRecords });
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: false, returnAll: false, limit: 10 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(result).toHaveLength(fakeRecords.length);
    expect(result[0].json).toEqual(fakeRecords[0]);
  });

  it('should handle results wrapper response', async () => {
    const fakeRecords = [{ id: 'y' }, { id: 'z' }];
    (apiRequest as jest.Mock).mockResolvedValue({ results: fakeRecords });
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: true, returnAll: false, limit: 10 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(result).toHaveLength(fakeRecords.length);
    expect(result.map(r => r.json)).toEqual(fakeRecords);
  });

  it('should slice records to client-side limit', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    (apiRequest as jest.Mock).mockResolvedValue({ items: many });
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: false, returnAll: false, limit: 3 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(result).toHaveLength(3);
    expect(result.map(r => r.json)).toEqual(many.slice(0, 3));
  });

  it('should return empty array for undefined/empty responses', async () => {
    (apiRequest as jest.Mock).mockResolvedValue(undefined);
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: true, returnAll: false, limit: 5 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await listRecord.call(executeMock);

    expect(result).toEqual([]);
  });

  it('should throw NodeOperationError with correct message on failure', async () => {
    (apiRequest as jest.Mock).mockRejectedValue(new Error('API Error'));
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: true, returnAll: false, limit: 10 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await expect(listRecord.call(executeMock)).rejects.toThrow('API Error');
  });

  it('should call getSolutionId and getTableId once per execution', async () => {
    (apiRequest as jest.Mock).mockResolvedValue({ items: [] });
    executeMock = createMockExecuteWithResources({
      parameters: { hydrated: false, returnAll: false, limit: 1 },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await listRecord.call(executeMock);

    expect(validation.getSolutionId).toHaveBeenCalledTimes(1);
    expect(validation.getTableId).toHaveBeenCalledTimes(1);
  });
});
