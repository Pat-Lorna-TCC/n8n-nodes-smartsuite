// src/nodes/SmartSuite/__tests__/actions/table/listTable.test.ts

// 1. Hoist mocks before imports
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
}));
jest.mock('../../../transport/smartSuiteApi', () => {
  const original = jest.requireActual('../../../transport/smartSuiteApi');
  return {
    ...original,
    apiRequest:       jest.fn(),
    paginatedRequest: jest.fn(),
  };
});

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as listTable } from '../../../actions/table/listTable.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';

// Retrieve the mocked functions
const { apiRequest, paginatedRequest } = require('../../../transport/smartSuiteApi') as {
  apiRequest: jest.Mock;
  paginatedRequest: jest.Mock;
};

describe('SmartSuite – listTable Operation', () => {
  let executeMock: IExecuteFunctions;
  const fakeTables = [
    { name: 'Table A', id: 'a1' },
    { name: 'Table B', id: 'b2' },
    { name: 'Table C', id: 'c3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when returnAll=false', () => {
    beforeEach(() => {
      executeMock = createMockExecuteWithResources({
        apiRequestResponse: { results: fakeTables.slice(0, 2) },
        inputData:          [{ json: {} }],
        parameters:         { returnAll: false, limit: 2, solutionId: 'dummy-solution-id' },
      });
    });

    it('should return only the tables in results[] as separate items', async () => {
      apiRequest.mockResolvedValue({ results: fakeTables.slice(0, 2) });
      const result = await listTable.call(executeMock);
      expect(result).toEqual([
        { json: fakeTables[0] },
        { json: fakeTables[1] },
      ]);
    });

    it('should throw if API request fails', async () => {
      apiRequest.mockRejectedValue(new Error('Table fetch failed'));
      await expect(listTable.call(executeMock))
        .rejects.toThrow('Table fetch failed');
    });
  });

  describe('when returnAll=true', () => {
    beforeEach(() => {
      executeMock = createMockExecuteWithResources({
        apiRequestResponse: {},  // ignored
        inputData:          [{ json: {} }],
        parameters:         { returnAll: true, limit: 2, solutionId: 'dummy-solution-id' },
      });
    });

    it('should return every table via pagination', async () => {
      paginatedRequest.mockResolvedValue(fakeTables);
      const result = await listTable.call(executeMock);
      expect(result).toHaveLength(fakeTables.length);
      expect(result.map(i => i.json)).toEqual(fakeTables);
    });

    it('should throw NodeOperationError if no tables', async () => {
      paginatedRequest.mockResolvedValue([]);
      await expect(listTable.call(executeMock))
        .rejects.toThrow('No tables found for Solution: dummy-solution-id');
    });

    it('should throw if paginatedRequest errors', async () => {
      paginatedRequest.mockRejectedValue(new Error('Pagination failed'));
      await expect(listTable.call(executeMock))
        .rejects.toThrow('Pagination failed');
    });
  });
});
