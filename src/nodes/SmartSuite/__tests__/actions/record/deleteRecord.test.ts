// src/nodes/SmartSuite/__tests__/actions/record/deleteRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as deleteRecord } from '../../../actions/record/deleteRecord.operation';
import { NodeOperationError } from 'n8n-workflow';
import * as utils from '../../../helpers/utils';
import * as validation from '../../../helpers/validation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';

// Mock the validation helper to return a dummy table ID
jest.mock('../../../helpers/validation', () => ({
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),
}));

// Mock the transport apiRequest function
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – deleteRecord Operation', () => {
  let executeMock: IExecuteFunctions;
  const fakeRecordId = 'record-id';

  beforeEach(() => {
    jest.clearAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({}); // Default mock response for apiRequest
  });

  it('should call apiRequest with correct args and return success', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: { recordId: fakeRecordId },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    const result = await deleteRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'DELETE',
      `/applications/dummy-table-id/records/${fakeRecordId}/`,
    );
    expect(result).toEqual([{ json: { success: true } }]);
  });

  it('should return empty array when no items passed', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [],
    });

    const result = await deleteRecord.call(executeMock);
    expect(result).toEqual([]);
  });

  it('should call debugLog at start', async () => {
    const debugSpy = jest.spyOn(utils, 'debugLog');
    executeMock = createMockExecuteWithResources({
      parameters: { recordId: fakeRecordId },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await deleteRecord.call(executeMock);

    expect(debugSpy).toHaveBeenCalledWith(
      '[Record] deleteRecord.execute called',
      executeMock.getNode().parameters,
    );
  });

  it('should only resolve tableId once', async () => {
    const tableIdSpy = jest.spyOn(validation, 'getTableId');
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }, { json: {} }],
    });

    // override recordId for valid inputs
    // @ts-ignore
    executeMock.getNodeParameter = (_name: string, _i: number) => 'id';

    await deleteRecord.call(executeMock);

    expect(tableIdSpy).toHaveBeenCalledTimes(1);
    expect(tableIdSpy).toHaveBeenCalledWith(0);
  });

  it('should throw if recordId is blank or whitespace', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: { recordId: '   ' },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await expect(deleteRecord.call(executeMock)).rejects.toThrow(
      'Record ID is required for Delete Record operation.',
    );
  });

  it('should throw "Record ID is not valid" when API returns 404 status', async () => {
    (apiRequest as jest.Mock).mockRejectedValueOnce({ status: 404 });

    executeMock = createMockExecuteWithResources({
      parameters: { recordId: 'missing-id' },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await expect(deleteRecord.call(executeMock)).rejects.toThrow(
      'Record ID is not valid',
    );
  });

  it('should throw raw API error for non-404 failures', async () => {
    const err = new Error('Unexpected failure');
    (apiRequest as jest.Mock).mockRejectedValueOnce(err);

    executeMock = createMockExecuteWithResources({
      parameters: { recordId: 'bad-id' },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await expect(deleteRecord.call(executeMock)).rejects.toThrow(
      'Unexpected failure',
    );
  });

  it('should surface correct itemIndex on blank-ID error for second item', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }, { json: {} }],
    });

    // override so index 1 returns blank
    // @ts-ignore
    executeMock.getNodeParameter = (_name, idx) => (idx === 1 ? '  ' : 'good-id');

    try {
      await deleteRecord.call(executeMock);
    } catch (error: any) {
      expect(error).toBeInstanceOf(NodeOperationError);
      expect((error as any).context?.itemIndex).toBe(1);
    }
  });

  it('should delete multiple records when multiple items passed', async () => {
    const ids = ['one', 'two', 'three'];
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: ids.map(() => ({ json: {} })),
    });

    // override recordId per index
    const originalGetNodeParam = executeMock.getNodeParameter.bind(executeMock);

    // @ts-ignore
    executeMock.getNodeParameter = (name: string, index: number) => ids[index];

    const result = await deleteRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledTimes(ids.length);
    expect(apiRequest).toHaveBeenNthCalledWith(
      1,
      'DELETE',
      `/applications/dummy-table-id/records/${ids[0]}/`,
    );
    expect(apiRequest).toHaveBeenNthCalledWith(
      ids.length,
      'DELETE',
      `/applications/dummy-table-id/records/${ids[ids.length - 1]}/`,
    );
    expect(result).toEqual(ids.map(() => ({ json: { success: true } })));
  });
});
