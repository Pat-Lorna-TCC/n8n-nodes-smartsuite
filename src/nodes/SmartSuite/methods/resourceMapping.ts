// src/nodes/SmartSuite/methods/resourceMapping.ts

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

/* ---------- Record ---------- */
import * as recordCreate from '../actions/record/createRecord.operation';
import * as recordList   from '../actions/record/listRecord.operation';
import * as recordSearch from '../actions/record/searchRecord.operation';
import * as recordGet    from '../actions/record/getRecord.operation';
import * as recordUpdate from '../actions/record/updateRecord.operation';
import * as recordUpsert from '../actions/record/upsertRecord.operation';
import * as recordDelete from '../actions/record/deleteRecord.operation';

/* ---------- Table ---------- */
import * as tableList        from '../actions/table/listTable.operation';
import * as tableGet         from '../actions/table/getTable.operation';
import * as tableCreateField from '../actions/table/createTableField.operation';
import * as tableCreate      from '../actions/table/createTable.operation';

/* ---------- Solution ---------- */
import * as solutionList from '../actions/solution/listSolution.operation';
import * as solutionGet  from '../actions/solution/getSolution.operation';

/* ---------- Org Management ---------- */
import * as orgListMembers from '../actions/orgManagement/listMembers.operation';
import * as orgListTeams   from '../actions/orgManagement/listTeams.operation';
import * as orgGetCurrent  from '../actions/orgManagement/getCurrentUser.operation';

/* ---------- API Request ---------- */
import makeApiRequest from '../actions/api/makeApiRequest.operation';

export const resourceMapping = {
  record: {
    createRecord: recordCreate.execute,
    listRecord:   recordList.execute,
    searchRecord: recordSearch.execute,
    getRecord:    recordGet.execute,
    updateRecord: recordUpdate.execute,
    upsertRecord: recordUpsert.execute,
    deleteRecord: recordDelete.execute,
  },
  table: {
    listTable:        tableList.execute,
    getTable:         tableGet.execute,
    createTableField: tableCreateField.execute,
    createTable:      tableCreate.execute,
  },
  solution: {
    listSolution: solutionList.execute,
    getSolution:  solutionGet.execute,
  },
  orgManagement: {
    listMembers:    orgListMembers.execute,
    listTeams:      orgListTeams.execute,
    getCurrentUser: orgGetCurrent.execute,
  },
  apiRequest: {
    make: makeApiRequest,
  },
} as const;

export async function callResource(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
  // 1) Which resource did the user pick?
  const resource = this.getNodeParameter('resource', 0) as keyof typeof resourceMapping;

  // 2) Pick the correct handler function
  let handlerFn: (this: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;

  if (resource === 'apiRequest') {
    // For API Request, always call `make`
    handlerFn = resourceMapping.apiRequest.make;
  } else {
    // For other resources, use the "<resource>Operation" parameter
    const operationParam = `${resource}Operation` as const;
    const operation      = this.getNodeParameter(operationParam, 0) as string;
    handlerFn = (resourceMapping as any)[resource][operation] as (this: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;
  }

  if (typeof handlerFn !== 'function') {
    throw new Error(`No handler found for resource "${resource}"`);
  }

  // 3) Execute per incoming item and collect results
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = await handlerFn.call(this, i);
    if (Array.isArray(result)) {
      returnData.push(...result);
    }
  }

  return [returnData];
}
