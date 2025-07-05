// src/nodes/SmartSuite/__tests__/actions/solution/listSolution.test.ts

// Mock transport helpers before imports
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
  paginatedRequest: jest.fn(),
}));

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as listSolution } from '../../../actions/solution/listSolution.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';
import { apiRequest, paginatedRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – listSolution Operation', () => {
  let executeMock: IExecuteFunctions;
  const fakeSolutions = [
    { id: 'sol-1', name: 'One' },
    { id: 'sol-2', name: 'Two' },
    { id: 'sol-3', name: 'Three' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle no solutions available', async () => {
    executeMock = createMockExecuteWithResources({ parameters: { returnAll: true, limit: 3 } });
    (paginatedRequest as jest.Mock).mockResolvedValue([]);

    const result = await listSolution.call(executeMock);
    expect(result).toEqual([]);
  });

  it('should handle API request failure gracefully', async () => {
    executeMock = createMockExecuteWithResources({ parameters: { returnAll: true, limit: 3 } });
    (paginatedRequest as jest.Mock).mockRejectedValue(new Error('API request failed'));

    await expect(listSolution.call(executeMock)).rejects.toThrow('API request failed');
  });

  it('should return every solution when returnAll=true', async () => {
    executeMock = createMockExecuteWithResources({ parameters: { returnAll: true, limit: 5 } });
    (paginatedRequest as jest.Mock).mockResolvedValue(fakeSolutions);

    const result = await listSolution.call(executeMock);
    expect(result).toHaveLength(fakeSolutions.length);
    expect(result.map(i => i.json)).toEqual(fakeSolutions);
  });

  it('should return only the solutions in results[] when returnAll=false', async () => {
    executeMock = createMockExecuteWithResources({ parameters: { returnAll: false, limit: 2 } });
    (apiRequest as jest.Mock).mockResolvedValue({ results: fakeSolutions });

    const result = await listSolution.call(executeMock);
    expect(result).toHaveLength(2);
    expect(result.map(i => i.json)).toEqual(fakeSolutions.slice(0, 2));
  });
});
