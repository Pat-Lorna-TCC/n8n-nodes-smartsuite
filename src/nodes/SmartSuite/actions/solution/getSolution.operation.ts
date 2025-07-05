// src/nodes/SmartSuite/actions/solution/getSolution.operation.ts

import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getSolutionId } from '../../helpers/validation';
import { solutionInput } from '../../shared/resourceInputs';

export const description: INodeProperties[] = [
  {
    ...solutionInput,
    required: true,
    displayOptions: { show: { resource: ['solution'], operation: ['getSolution'] } },
    description: 'The Solution to retrieve',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  // 1) Validate & get solutionId
  const solutionId = await getSolutionId.call(this, 0);

  // 2) Fetch solution data
  const response = (await apiRequest.call(
    this,
    'GET',
    `/solutions/${solutionId}/`,
  )) as IDataObject;

  // 3) Return the single solution object
  return this.helpers.returnJsonArray([response]);
}
