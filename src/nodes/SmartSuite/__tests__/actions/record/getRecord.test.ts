// src/nodes/SmartSuite/__tests__/actions/record/getRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as getRecord } from '../../../actions/record/getRecord.operation';
import { NodeOperationError } from 'n8n-workflow';
import * as utils from '../../../helpers/utils';
import * as validation from '../../../helpers/validation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';

// Import getSolutionId
import { getSolutionId } from '../../../helpers/validation'; // Import missing function

// Mock validation helpers to return dummy IDs
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),
}));

// Mock the transport apiRequest function
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – getRecord Operation', () => {
  let executeMock: IExecuteFunctions;
  const fakeRecord = { id: 'abc', name: 'Test' };

  beforeEach(() => {
    jest.clearAllMocks();
    // default apiRequest resolves to fakeRecord
    (apiRequest as jest.Mock).mockResolvedValue(fakeRecord);
  });

  it('should call apiRequest with correct args and return the record', async () => {
    const recordId = 'record-id';
    executeMock = createMockExecuteWithResources({
      parameters: { 
        recordId, 
        solutionId: 'dummy-solution-id', 
        hydrated: false 
      },
      apiRequestResponse: fakeRecord,
      inputData: [{ json: {} }]
    });

    const result = await getRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'GET',
      `/applications/dummy-table-id/records/${recordId}`,
      {},
      {}
    );
    expect(result).toEqual([{ json: fakeRecord }]);
  });

  it('should include hydrated query parameter when hydrated is true', async () => {
    const recordId = 'record-id';
    executeMock = createMockExecuteWithResources({
      parameters: { 
        recordId, 
        solutionId: 'dummy-solution-id', 
        hydrated: true 
      },
      apiRequestResponse: fakeRecord,
      inputData: [{ json: {} }]
    });

    const result = await getRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'GET',
      `/applications/dummy-table-id/records/${recordId}`,
      {},
      { hydrated: true }
    );
    expect(result).toEqual([{ json: fakeRecord }]);
  });

  it('should throw if recordId is blank or whitespace', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: { 
        recordId: '   ', 
        solutionId: 'dummy-solution-id' 
      },
      apiRequestResponse: {},
      inputData: [{ json: {} }]
    });

    await expect(getRecord.call(executeMock)).rejects.toThrow(
      'Record ID is required for Get Record operation.'
    );
    await expect(getRecord.call(executeMock)).rejects.toThrow('Received: "   "');
  });

  it('should include undefined in error message when recordId is undefined', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {},
      apiRequestResponse: {},
      inputData: [{ json: {} }]
    });

    jest.spyOn(executeMock, 'getNodeParameter').mockImplementation((name: string) => {
      if (name === 'recordId') return undefined;
      if (name === 'hydrated') return false;
      if (name === 'solutionId') return 'dummy-solution-id';
      return undefined;
    });

    await expect(getRecord.call(executeMock)).rejects.toThrow('Received: undefined');
  });

  it('should return an empty array when there are no input items', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {},
      apiRequestResponse: fakeRecord,
      inputData: [],
    });

    const result = await getRecord.call(executeMock);

    expect(apiRequest).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should throw if getSolutionId fails', async () => {
    (getSolutionId as jest.Mock).mockRejectedValueOnce(new Error('no solution'));

    executeMock = createMockExecuteWithResources({
      parameters: { 
        recordId: 'id', 
        solutionId: 'dummy-solution-id', 
        hydrated: false 
      },
      apiRequestResponse: fakeRecord,
      inputData: [{ json: {} }]
    });

    await expect(getRecord.call(executeMock)).rejects.toThrow('no solution');
  });

  it('should propagate API errors', async () => {
    const apiError = new Error('API failure');
    (apiRequest as jest.Mock).mockRejectedValueOnce(apiError);

    executeMock = createMockExecuteWithResources({
      parameters: { 
        recordId: 'bad-id', 
        solutionId: 'dummy-solution-id' 
      },
      apiRequestResponse: {},
      inputData: [{ json: {} }]
    });

    await expect(getRecord.call(executeMock)).rejects.toThrow(apiError);
  });

  it('should get multiple records for multiple items', async () => {
    const ids = ['one', 'two', 'three'];
    (apiRequest as jest.Mock).mockResolvedValue({ foo: 'bar' });

    executeMock = createMockExecuteWithResources({
      parameters: {},
      apiRequestResponse: { foo: 'bar' },
      inputData: ids.map(() => ({ json: {} })),
    });

    // Override getNodeParameter to return each recordId and hydrated flag per index
    const originalGetNodeParameter = executeMock.getNodeParameter.bind(executeMock as any);
    (executeMock as any).getNodeParameter = (name: string, index: number) => {
      if (name === 'recordId') return ids[index];
      if (name === 'hydrated') return false;
      if (name === 'solutionId') return 'dummy-solution-id';  // Added solutionId handling
      return originalGetNodeParameter(name, index);
    };

    const result = await getRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledTimes(ids.length);
    expect(result).toEqual(ids.map(() => ({ json: { foo: 'bar' } })));
  });
});
