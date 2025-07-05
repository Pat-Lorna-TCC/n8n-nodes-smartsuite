// src/nodes/SmartSuite/actions/orgManagement/listTeams.operation.ts

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';

/**
 * SmartSuite Org Management → List Teams
 */
export const description = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'hidden',
    default: 'listTeams',
    displayOptions: {
      show: {
        resource: ['orgManagement'],
        operation: ['listTeams'],
      },
    },
    description: 'Retrieve list of teams from Org Management',
  },
] as const;

interface TeamResponse {
  items: IDataObject[];
}

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  try {
    debugLog('[OrgMgmt] listTeams.execute called', null, 1);

    const response = (await apiRequest.call(this, 'POST', '/teams/list/')) as TeamResponse;
    debugLog('[OrgMgmt] API response', response, 3);

    const teams = Array.isArray(response?.items) ? response.items : [];
    debugLog('[OrgMgmt] Flattened team list count', teams.length, 2);

    return this.helpers.returnJsonArray(teams);
  } catch (error) {
    debugLog('[OrgMgmt] listTeams error', error, 1);
    throw new NodeOperationError(
      this.getNode(),
      error instanceof Error ? error.message : JSON.stringify(error),
    );
  }
}
