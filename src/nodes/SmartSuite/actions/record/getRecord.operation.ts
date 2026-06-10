// src/nodes/SmartSuite/actions/record/getRecord.operation.ts
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getSolutionId, getTableId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const solutionId = await getSolutionId.call(this, 0);
  const tableId    = await getTableId.call(this, 0);

  debugLog('[Record] getRecord.execute called', this.getNode().parameters, 2);
  const items      = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const rawRecordId = this.getNodeParameter('recordId', i);
    const recordId = asIdString(rawRecordId);
    if (!recordId.trim()) {
      throw new NodeOperationError(
        this.getNode(),
        `Record ID is required for Get Record operation. Received: ${JSON.stringify(rawRecordId)}`,
        { itemIndex: i },
      );
    }

    const hydrated = this.getNodeParameter('hydrated', i) as boolean;
    const qs: IDataObject = {};
    if (hydrated) {
      qs.hydrated = true;
    }

    debugLog('[Record] getRecord.request', { solutionId, tableId, recordId, hydrated }, 2);
    const response = (await apiRequest.call(
      this,
      'GET',
      `/applications/${tableId}/records/${recordId}`,
      {},
      qs,
    )) as IDataObject;
    debugLog('[Record] getRecord.response', response, 2);

    returnData.push(...this.helpers.returnJsonArray([response]));
  }

  return returnData;
}
