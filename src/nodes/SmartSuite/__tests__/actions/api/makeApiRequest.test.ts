// src/nodes/SmartSuite/__tests__/actions/api/makeApiRequest.test.ts

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeMakeApiRequest } from '../../../actions/api/makeApiRequest.operation';
import * as smartSuiteApi from '../../../transport/smartSuiteApi';
import { mockExecuteFunctions } from '../../../shared/__testHelpers__/mockExecuteFunctions';

describe('SmartSuite – makeApiRequest Operation', () => {
  let executeMock: IExecuteFunctions;
  const fakeResponse = { foo: 'bar' };

  beforeAll(() => {
    executeMock = mockExecuteFunctions({
      apiRequestResponse: fakeResponse,
    });

    // stub out getNodeParameter for all parameters
    jest.spyOn(executeMock, 'getNodeParameter')
      .mockImplementation((name: string, _itemIndex?: number) => {
        switch (name) {
          case 'operation': return 'POST';
          case 'url': return '/some/endpoint';
          case 'sendQuery': return true;
          case 'specifyQuery': return 'json';
          case 'jsonQuery': return { q: 'test' };
          case 'sendHeaders': return true;
          case 'specifyHeaders': return 'json';
          case 'jsonHeaders': return { 'X-Custom': 'value' };
          case 'sendBody': return true;
          case 'specifyBody': return 'json';
          case 'jsonBody': return { hello: 'world' };
          default: return undefined;
        }
      });

    // mock the transport-layer apiRequest call
    jest.spyOn(smartSuiteApi, 'apiRequest').mockResolvedValue(fakeResponse);
  });

  it('should call apiRequest with the right args and return its result', async () => {
    const items = await executeMakeApiRequest.call(executeMock, 0);

    expect(smartSuiteApi.apiRequest).toHaveBeenCalledWith(
      'POST',
      '/some/endpoint',
      { hello: 'world' },
      { q: 'test' },
      { 'X-Custom': 'value' },
    );
    expect(items).toEqual([{ json: fakeResponse } as INodeExecutionData]);
  });
});
