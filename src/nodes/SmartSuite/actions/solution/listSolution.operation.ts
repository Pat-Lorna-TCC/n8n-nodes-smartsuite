// src/nodes/SmartSuite/actions/solution/listSolution.operation.ts

import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest, paginatedRequest } from '../../transport/smartSuiteApi';

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name:        'returnAll',
    type:        'boolean',
    default:     false,
    description: 'Return all solutions (paginated)',
    displayOptions: {
      show: { resource: ['solution'], operation: ['listSolution'] },
    },
  },
  {
    displayName: 'Limit',
    name:        'limit',
    type:        'number',
    default:     50,
    typeOptions: { minValue: 1, maxValue: 1000 },
    description: 'Max number of results to return when not returning all',
    displayOptions: {
      show: {
        resource:   ['solution'],
        operation:  ['listSolution'],
        returnAll:  [false],
      },
    },
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit     = this.getNodeParameter('limit', 0, 50) as number;

  const endpoint = '/solutions/';

  if (returnAll) {
    // Use native paginatedRequest helper for all pages
    const allResults = await paginatedRequest.call(
      this,
      'GET',
      endpoint,
      {},
      { limit, offset: 0 } as IDataObject,
    );
    return this.helpers.returnJsonArray(allResults as IDataObject[]);
  } else {
    // Single-page mode via apiRequest
    const qs: IDataObject = { limit, offset: 0 };
    const resp = (await apiRequest.call(
      this,
      'GET',
      endpoint,
      {},
      qs,
    )) as any;

    const pageItems: IDataObject[] = Array.isArray(resp)
      ? resp
      : resp.response ?? resp.results ?? resp.items ?? resp.solutions ?? [];

    const limited = pageItems.slice(0, limit);
    return this.helpers.returnJsonArray(limited);
  }
}
