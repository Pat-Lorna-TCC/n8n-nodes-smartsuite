// src/nodes/SmartSuite/actions/table/listTable.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest, paginatedRequest } from '../../transport/smartSuiteApi';
import { getSolutionId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  debugLog('[Table] listTable.execute called', this.getNode().parameters, 2);
  const items     = this.getInputData();
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit     = returnAll
    ? undefined
    : (this.getNodeParameter('limit', 0) as number);

  const returnData: INodeExecutionData[] = [];
  for (let i = 0; i < items.length; i++) {
    const solutionId = await getSolutionId.call(this, i);

    const qs: IDataObject = { solution: solutionId };
    if (!returnAll) {
      qs.limit = limit;
    }

    let tablesArray: IDataObject[];
    if (returnAll) {
      tablesArray = await paginatedRequest.call(
        this,
        'GET',
        '/applications/',
        {},
        qs,
      );
    } else {
      const resp = await apiRequest.call(
        this,
        'GET',
        '/applications/',
        {},
        qs,
      );
      tablesArray = Array.isArray((resp as any).results)
        ? (resp as any).results
        : Array.isArray(resp)
        ? (resp as IDataObject[])
        : [];
    }

    if (!tablesArray.length) {
      throw new NodeOperationError(
        this.getNode(),
        `No tables found for Solution: ${solutionId}`,
        { itemIndex: i },
      );
    }

    returnData.push(...this.helpers.returnJsonArray(tablesArray));
  }

  return returnData;
}
