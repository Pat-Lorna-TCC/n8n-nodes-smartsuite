// src/nodes/SmartSuite/__tests__/actions/solution/getSolution.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as getSolution } from '../../../actions/solution/getSolution.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; 

describe('SmartSuite – getSolution Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeAll(() => {
    // Stub out getNodeParameter to return a known ID using mockResourceInputs:
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {
        id: 'sol-123',
        name: 'My Test Solution',
        description: '🔧',
      },
      parameters: {
        solutionId: 'sol-123', // Ensure we pass the solutionId directly to match the function's expectation
      },
    });
  });

  it('should fetch and return the solution by ID', async () => {
    const items = await getSolution.call(executeMock);

    expect(items).toHaveLength(1);
    expect(items[0].json).toMatchObject({
      id: 'sol-123',
      name: 'My Test Solution',
      description: '🔧',
    });
  });

  it('should throw an error if solutionId is not provided', async () => {
    // Override the solutionId parameter to simulate an empty input
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      parameters: {
        solutionId: undefined, // Simulating missing solutionId
      },
    });

    await expect(getSolution.call(executeMock)).rejects.toThrowError('Solution must be selected.');
  });

  it('should handle additional fields in the API response', async () => {
    // Simulate an API response with extra fields
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {
        id: 'sol-123',
        name: 'My Test Solution',
        description: '🔧',
        additionalField: 'extra data', // New field added to the response
      },
      parameters: {
        solutionId: 'sol-123',
      },
    });

    const items = await getSolution.call(executeMock);

    expect(items[0].json).toHaveProperty('additionalField', 'extra data');
  });
});
