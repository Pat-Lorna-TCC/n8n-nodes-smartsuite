// src/nodes/SmartSuite/methods/router.ts

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../helpers/utils';

export async function router(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
  // 1) Pull resource & operation
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0) as string;

  // log for debugging
  debugLog(`📝 router: resource=${resource}, operation=${operation}`, undefined, 1);

  // 2) Dynamically import the module
  let actionModule: { execute?: () => Promise<INodeExecutionData[]> };
  try {
    actionModule = await import(
      /* webpackIgnore: true */
      `../actions/${resource}/${operation}.operation`
    );
  } catch (err) {
    debugLog('❌ Failed to import action module:', err, 3);
    throw new NodeOperationError(
      this.getNode(),
      `Could not load actions/${resource}/${operation}.operation.ts`,
    );
  }

  // 3) Validate it has an execute()
  if (typeof actionModule.execute !== 'function') {
    throw new NodeOperationError(
      this.getNode(),
      `Missing execute() in actions/${resource}/${operation}.operation.ts`,
    );
  }

  // 4) Execute it and return
  const result = await actionModule.execute.call(this);
  return [result];
}
