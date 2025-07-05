// src/nodes/SmartSuite/__tests__/actions/orgManagement/listMembers.test.ts
import type { INodeExecutionData, IDataObject } from 'n8n-workflow';
import * as transport from '../../../transport/smartSuiteApi';
import * as utils from '../../../helpers/utils';
import { execute as listMembers } from '../../../actions/orgManagement/listMembers.operation';

describe('SmartSuite – listMembers Operation', () => {
  let nodeMock: Partial<{
    getNode: jest.Mock;
    helpers: {
      returnJsonArray: jest.Mock<INodeExecutionData[], [IDataObject[]]>;
    };
  }>;

  const fakeMembers: IDataObject[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ];

  beforeEach(() => {
    nodeMock = {
      getNode: jest.fn(),
      helpers: {
        returnJsonArray: jest.fn((data: IDataObject[]) =>
          data.map(item => ({ json: item })),
        ),
      },
    };

    // Stub the API
    jest.spyOn(transport, 'apiRequest').mockResolvedValue({ items: fakeMembers });

    // Silence debug logging
    jest.spyOn(utils, 'debugLog').mockImplementation(() => {});
  });

  it('should return each member as a separate output item', async () => {
    // <<— cast to any so TS stops complaining about missing props
    const result = await listMembers.call(nodeMock as any);

    // 1) API call was made correctly
    expect(transport.apiRequest).toHaveBeenCalledWith('POST', '/members/list/');

    // 2) Helper was invoked with our fake members
    expect(nodeMock.helpers!.returnJsonArray).toHaveBeenCalledWith(fakeMembers);

    // 3) Final output matches
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(fakeMembers.length);
    expect(result.map(r => r.json)).toEqual(fakeMembers);
  });
});
