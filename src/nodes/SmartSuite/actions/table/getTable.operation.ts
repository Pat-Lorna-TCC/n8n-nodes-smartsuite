// src/nodes/SmartSuite/actions/table/getTable.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getTableId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  debugLog('[Table] getTable.execute called', this.getNode().parameters, 2);
  const returnData: INodeExecutionData[] = [];

  const tableId = await getTableId.call(this, 0);

  try {
    const response = await apiRequest.call(
      this,
      'GET',
      `/applications/${tableId}/`,
    ) as IDataObject;
    debugLog('[Table] getTable.response', response, 2);

    returnData.push({ json: response });
  } catch (err: any) {
    throw new NodeOperationError(this.getNode(), err.message);
  }

  return returnData;
}
