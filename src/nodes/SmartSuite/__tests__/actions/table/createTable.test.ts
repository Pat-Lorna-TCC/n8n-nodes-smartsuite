// src/nodes/SmartSuite/__tests__/actions/table/createTable.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as createTable } from '../../../actions/table/createTable.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Use the new mock helper

// Mock getSolutionId to always return a valid solution ID
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
}));

describe('SmartSuite – createTable Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: '123', name: 'Test Table' },
      inputData: [{ json: {} }],
      parameters: {
        tableName: 'Test Table',
        tableDescription: 'Test Description',
        icon: 'Test Icon',
      },
    });
  });

  it('should execute without errors', async () => {
    const result = await createTable.call(executeMock);
    expect(result).toBeDefined();
    expect(result[0].json.success).toBe(true);
  });

  it('should throw NodeOperationError when request fails', async () => {
    jest.spyOn((executeMock.helpers as any), 'httpRequest')
      .mockRejectedValueOnce(new Error('API request failed'));

    await expect(createTable.call(executeMock))
      .rejects
      .toThrow('API request failed');
  });

  it('should return an error when required parameters are missing', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: '123', name: 'Test Table' },
      inputData: [{ json: {} }],
      parameters: {
        tableName: '', // Empty tableName
        tableDescription: 'Test Description',
        icon: 'Test Icon',
      },
    });

    await expect(createTable.call(executeMock))
      .rejects
      .toThrow('Table name cannot be blank.');
  });
});
