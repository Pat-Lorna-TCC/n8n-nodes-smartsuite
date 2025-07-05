// src/nodes/SmartSuite/__tests__/actions/table/getTable.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as getTable } from '../../../actions/table/getTable.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';

// Mock the validation helper to return a dummy table ID
jest.mock('../../../helpers/validation', () => ({
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),
}));

describe('SmartSuite – getTable Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeAll(() => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: 'dummy-table-id', name: 'Test Table' },
      inputData: [{ json: {} }],
      parameters: { solutionId: 'dummy-solution-id' }, // Added solutionId here
    });
  });

  it('should call httpRequest with correct args and return table data', async () => {
    const httpSpy = jest.spyOn((executeMock.helpers as any), 'httpRequest');

    const result = await getTable.call(executeMock);

    // Verify the HTTP request was made once
    expect(httpSpy).toHaveBeenCalledTimes(1);
    const httpOpts = (httpSpy.mock.calls[0][0] as any);

    // Check method and URL
    expect(httpOpts.method).toBe('GET');
    expect(httpOpts.url).toContain(`/applications/dummy-table-id/`);
    // GET requests should not have a body
    expect(httpOpts.body).toBeUndefined();

    // Confirm the operation returns the mocked table data
    expect(result).toEqual([
      { json: { id: 'dummy-table-id', name: 'Test Table' } },
    ]);
  });

  it('should handle empty response gracefully', async () => {
    // Mock an empty response from the API
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: { solutionId: 'dummy-solution-id' }, // Added solutionId here
    });

    const result = await getTable.call(executeMock);

    // Ensure that the result is still valid, even if empty
    expect(result).toEqual([{ json: {} }]);
  });

  it('should handle errors from the API request', async () => {
    // Mock an error in the API request
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: { solutionId: 'dummy-solution-id' }, // Added solutionId here
    });

    // Mock httpRequest to throw an error
    jest.spyOn(executeMock.helpers, 'httpRequest').mockRejectedValueOnce(new Error('API Error'));

    // Expect the operation to throw an error
    await expect(getTable.call(executeMock)).rejects.toThrow('API Error');
  });

  it('should handle unexpected API response structure', async () => {
    // Mock an unexpected API response
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { unexpectedField: 'unexpectedValue' },
      inputData: [{ json: {} }],
      parameters: { solutionId: 'dummy-solution-id' }, // Added solutionId here
    });

    const result = await getTable.call(executeMock);

    // Assert that the result contains the unexpected data correctly
    expect(result).toEqual([{ json: { unexpectedField: 'unexpectedValue' } }]);
  });
});
