// src/nodes/SmartSuite/actions/orgManagement/listMembers.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport/smartSuiteApi';
import { debugLog } from '../../helpers/utils';

/**
 * SmartSuite Org Management → List Members
 */
export const description = [
  {
    displayName: 'List Members',
    name: 'listMembers',
    type: 'operation',
    displayOptions: {
      show: {
        resource: ['orgManagement'],
        operation: ['listMembers'],
      },
    },
    default: true,
    description: 'Retrieve members from Org Management',
  },
] as const;

interface MemberResponse {
  items: IDataObject[];
}

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  try {
    debugLog('[OrgMgmt] listMembers.execute called', null, 1);

    const response = (await apiRequest.call(this, 'POST', '/members/list/')) as MemberResponse;
    debugLog('[OrgMgmt] API response', response, 3); // verbose

    const members = Array.isArray(response?.items) ? response.items : [];
    debugLog('[OrgMgmt] Flattened member list count', members.length, 2);

    return this.helpers.returnJsonArray(members);
  } catch (error) {
    debugLog('[OrgMgmt] listMembers error', error, 1);
    throw new NodeOperationError(
      this.getNode(),
      error instanceof Error ? error.message : JSON.stringify(error),
    );
  }
}
