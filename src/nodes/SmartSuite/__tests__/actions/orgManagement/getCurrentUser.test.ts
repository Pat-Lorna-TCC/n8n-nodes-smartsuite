// src/nodes/SmartSuite/__tests__/actions/orgManagement/getCurrentUser.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as getCurrentUser } from '../../../actions/orgManagement/getCurrentUser.operation';
import { mockExecuteFunctions } from '../../../shared/__testHelpers__/mockExecuteFunctions';

describe('SmartSuite – getCurrentUser Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeAll(() => {
    executeMock = mockExecuteFunctions({
      apiRequestResponse: { id: 'u-123', name: 'Alice Admin', email: 'alice@example.com' },  // Mock valid response
    });
  });

  it('should return the current user as a single output item', async () => {
    const [item] = await getCurrentUser.call(executeMock);
    expect(item.json).toMatchObject({
      id: 'u-123',
      name: 'Alice Admin',
      email: 'alice@example.com',
    });
  });
});
