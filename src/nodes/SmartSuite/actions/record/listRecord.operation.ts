// src/nodes/SmartSuite/actions/record/listRecord.operation.ts
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest, paginatedRequest } from '../../transport/smartSuiteApi';
import type { SmartSuiteRecord, SmartSuiteListPayload } from '../../types';
import { getSolutionId, getTableId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const solutionId = await getSolutionId.call(this, 0);
  const tableId    = await getTableId.call(this, 0);

  debugLog('[Record] listRecord.execute called', this.getNode().parameters, 2);
  const items      = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const hydrated  = this.getNodeParameter('hydrated', i) as boolean;
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;
    const limit     = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);

    debugLog(
      '[Record] listRecord.request',
      { solutionId, tableId, hydrated, returnAll, limit },
      2,
    );

    let recordsArray: IDataObject[] = [];

    try {
      const body: Record<string, any> = { hydrated };

      if (returnAll) {
        // fetch all pages
        recordsArray = await paginatedRequest.call(
          this,
          'POST',
          `/applications/${tableId}/records/list/`,
          body,
        );
        returnData.push(...this.helpers.returnJsonArray(recordsArray));
        continue;
      }

      // single‐page case
      body.limit = limit;
      const resp = (await apiRequest.call(
        this,
        'POST',
        `/applications/${tableId}/records/list/`,
        body,
      )) as SmartSuiteListPayload<SmartSuiteRecord>;

      if (Array.isArray(resp)) {
        recordsArray = resp;
      } else if (resp && typeof resp === 'object') {
        recordsArray = resp.data ?? resp.items ?? resp.results ?? [];
      }

      // enforce client‐side limit
      if (limit !== undefined && recordsArray.length > limit) {
        const sliced = recordsArray.slice(0, limit);
        returnData.push(...this.helpers.returnJsonArray(sliced));
      } else {
        returnData.push(...this.helpers.returnJsonArray(recordsArray));
      }
    } catch (error: any) {
      throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
    }
  }

  return returnData;
}
