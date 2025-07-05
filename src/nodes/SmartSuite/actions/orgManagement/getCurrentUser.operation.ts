// src/nodes/SmartSuite/actions/orgManagement/getCurrentUser.operation.ts

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';

/**
 * SmartSuite Org Management → Get Current User
 */
export const description = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'hidden',
    default: 'getCurrentUser',
    displayOptions: {
      show: {
        resource: ['orgManagement'],
        operation: ['getCurrentUser'],
      },
    },
    description: 'Retrieve details of the current authenticated user',
  },
] as const;

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  try {
    debugLog('[OrgMgmt] getCurrentUser.execute called', null, 1);

    const user = (await apiRequest.call(this, 'GET', '/users/me/')) as IDataObject;
    debugLog('[OrgMgmt] Current user data', user, 3);

    return this.helpers.returnJsonArray([user]);
  } catch (error) {
    debugLog('[OrgMgmt] getCurrentUser error', error, 1);
    throw new NodeOperationError(
      this.getNode(),
      error instanceof Error ? error.message : JSON.stringify(error),
    );
  }
}
