// src/nodes/SmartSuite/actions/table/createTable.operation.ts
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getSolutionId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  debugLog('[Table] createTable.execute called', this.getNode().parameters, 2);
  // 1) Validate solution
  const solutionId = await getSolutionId.call(this, 0);

  // 2) Gather inputs
  const tableName        = this.getNodeParameter('tableName', 0) as string;
  const tableDescription = this.getNodeParameter('tableDescription', 0) as string;
  const icon             = this.getNodeParameter('icon', 0) as string;

  if (!tableName.trim()) {
    throw new NodeOperationError(this.getNode(), 'Table name cannot be blank.');
  }

  // 3) Build payload
  const body: IDataObject = {
    name:        tableName,
    solution:    solutionId,
    description: tableDescription,
    icon,
    structure: [
      {
        slug:       'title',
        label:      'Title',
        field_type: 'recordtitlefield',
      },
    ],
  };
  debugLog('[Table] createTable.payload', body, 2);

  const returnData: INodeExecutionData[] = [];
  try {
    const response = await apiRequest.call(
      this,
      'POST',
      '/applications/',
      body,
    ) as IDataObject;
    debugLog('[Table] createTable.response', response, 2);
    returnData.push({ json: { success: true, data: response } });
  } catch (err: any) {
    throw new NodeOperationError(this.getNode(), err.message);
  }

  return returnData;
}
