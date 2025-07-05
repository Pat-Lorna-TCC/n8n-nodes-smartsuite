// src/nodes/SmartSuite/actions/record/searchRecord.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getTableId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  // Read parameters
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit     = this.getNodeParameter('limit',     0, 50) as number;
  const searchOp  = (this.getNodeParameter('searchOperator', 0) as string).toLowerCase();
  const hydrated  = this.getNodeParameter('hydrated',     0) as boolean;

  const tableId    = await getTableId.call(this, 0);

  // Build filters
  const uiFilters = this.getNodeParameter('filters.filter', 0, []) as Array<{
    field: string;
    condition: string;
    value: string;
  }>;
  const apiFilters = uiFilters.map(f => ({
    field:      asIdString(f.field),
    comparison: f.condition,
    value:      f.value,
  }));

  let recordsArray: IDataObject[] = [];

  try {
    // First page
    const body: any = { hydrated, offset: 0, limit };
    if (apiFilters.length) {
      body.filter = { operator: searchOp, fields: apiFilters };
    }

    debugLog(
      '[Record] apiRequest →',
      { method: 'POST', endpoint: `/tables/${tableId}/records/list/`, body },
      3,
    );
    const resp = (await apiRequest.call(
      this,
      'POST',
      `/tables/${tableId}/records/list/`,
      body,
    )) as any;
    debugLog('[Record] apiResponse ←', resp, 3);

    // Normalize
    recordsArray = Array.isArray(resp)
      ? resp
      : resp.data ?? resp.items ?? resp.results ?? [];

    // If Return All is on, page through
    if (returnAll) {
      let offset = recordsArray.length;
      while (recordsArray.length % limit === 0) {
        const nextBody = { hydrated, offset, limit, filter: body.filter };
        debugLog('[Record] apiRequest (next page) →', { nextBody }, 3);
        const nextResp = (await apiRequest.call(
          this,
          'POST',
          `/tables/${tableId}/records/list/`,
          nextBody,
        )) as any;
        debugLog('[Record] apiResponse (next page) ←', nextResp, 3);
        const pageItems = Array.isArray(nextResp)
          ? nextResp
          : nextResp.data ?? nextResp.items ?? nextResp.results ?? [];
        if (!pageItems.length) {
          break;
        }
        recordsArray.push(...pageItems);
        offset += pageItems.length;
      }
    }
  } catch (error: any) {
    debugLog('[Record] caught error', error, 3);
    if (
      error.statusCode === 400 &&
      error.message?.toLowerCase().includes('not allowed comparison')
    ) {
      throw new NodeOperationError(
        this.getNode(),
        'Invalid comparison for that field type.',
        {
          description:
            '[See valid operators](https://developers.smartsuite.com/docs/solution-data/records/sort-filter#operators-by-field-type)',
        },
      );
    }
    throw new NodeOperationError(this.getNode(), error.message);
  }

  // Enforce client-side limit
  if (!returnAll && recordsArray.length > limit) {
    recordsArray = recordsArray.slice(0, limit);
  }

  // If no records found
  if (recordsArray.length === 0) {
    return this.helpers.returnJsonArray([{ search: 'No records match' }]);
  }

  // Emit records
  return this.helpers.returnJsonArray(recordsArray);
}
