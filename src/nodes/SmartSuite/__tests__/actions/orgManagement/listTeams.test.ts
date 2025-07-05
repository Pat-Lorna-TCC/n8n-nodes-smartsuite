// src/nodes/SmartSuite/__tests__/actions/orgManagement/listTeams.test.ts
import type { INodeExecutionData, IDataObject } from 'n8n-workflow';

// Pull in your transport and utils via require() to avoid TS export issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const transport: { apiRequest: jest.Mock<Promise<{ items: IDataObject[] }>, any[]> } =
  require('../../../transport/smartSuiteApi');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils: { debugLog: jest.Mock } = require('../../../helpers/utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const listTeamsModule: any = require('../../../actions/orgManagement/listTeams.operation');

// Grab whichever export holds your function
const listTeams: (this: any) => Promise<INodeExecutionData[]> =
  listTeamsModule.execute ?? listTeamsModule.default ?? listTeamsModule.listTeams;

describe('SmartSuite – listTeams Operation', () => {
  const fakeTeams: IDataObject[] = [
    { id: 'team-1', name: 'Team Alpha' },
    { id: 'team-2', name: 'Team Beta' },
  ];

  let ctx: {
    getNode: jest.Mock;
    helpers: {
      returnJsonArray: jest.Mock<INodeExecutionData[], [IDataObject[]]>;
    };
  };

  beforeEach(() => {
    ctx = {
      getNode: jest.fn(),
      helpers: {
        returnJsonArray: jest.fn((data: IDataObject[]) =>
          data.map(item => ({ json: item })),
        ),
      },
    };

    // Stub the API to return our fake teams
    jest.spyOn(transport, 'apiRequest').mockResolvedValue({ items: fakeTeams });
    // Silence any debug logs
    jest.spyOn(utils, 'debugLog').mockImplementation(() => {});
  });

  it('should return each team as a separate output item', async () => {
    // cast to any so TS ignores missing IExecuteFunctions props
    const result = await listTeams.call(ctx as any);

    // 1) Was the API called with the correct endpoint?
    expect(transport.apiRequest).toHaveBeenCalledWith('POST', '/teams/list/');

    // 2) Did we hand the raw array to returnJsonArray?
    expect(ctx.helpers.returnJsonArray).toHaveBeenCalledWith(fakeTeams);

    // 3) Does the final output match our fakeTeams?
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(fakeTeams.length);
    expect(
      result.map((r: INodeExecutionData) => r.json),
    ).toEqual(fakeTeams);
  });
});
