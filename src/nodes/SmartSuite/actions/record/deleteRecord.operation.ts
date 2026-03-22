// src/nodes/SmartSuite/actions/record/deleteRecord.operation.ts

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getTableId } from '../../helpers/validation';
import { tableInput } from '../../shared/resourceInputs';

export const description = [
  {
    tableInput,
    displayOptions: { show: { resource: ['record'], operation: ['deleteRecord'] } },
  },
  {
    displayName: 'Record ID',
    name: 'recordId',
    type: 'string',
    default: '',
    required: true,
    noDataExpression: false,
    displayOptions: { show: { resource: ['record'], operation: ['deleteRecord'] } },
    description: 'The SmartSuite Record ID to delete',
  },
] as const;

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const tableId = await getTableId.call(this, 0);

  debugLog('[Record] deleteRecord.execute called', this.getNode().parameters);
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const recordId = asIdString(this.getNodeParameter('recordId', i));
    if (!recordId.trim()) {
      throw new NodeOperationError(
        this.getNode(),
        'Record ID is required for Delete Record operation.',
        { itemIndex: i },
      );
    }

    try {
      await apiRequest.call(
        this,
        'DELETE',
        `/applications/${tableId}/records/${recordId}/`,
      );
      returnData.push(...this.helpers.returnJsonArray([{ success: true }]));
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('Not found')) {
        throw new NodeOperationError(
          this.getNode(),
          'Record ID is not valid',
          { itemIndex: i },
        );
      }
      throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
    }
  }

  return returnData;
}
