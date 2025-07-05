// src/nodes/SmartSuite/actions/api/makeApiRequest.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport/smartSuiteApi';

export async function executeMakeApiRequest(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  try {
    // 1) HTTP method comes from the "operation" dropdown now
    const method = this.getNodeParameter('operation', index) as string;
    const url    = this.getNodeParameter('url', index) as string;

    // 2) Build `qs`
    let qs: IDataObject = {};
    if (this.getNodeParameter('sendQuery', index)) {
      if (this.getNodeParameter('specifyQuery', index) === 'fields') {
        const items = this.getNodeParameter(
          'queryParameters.parameter',
          index,
          [],
        ) as Array<{ name: string; value: string }>;
        items.forEach(({ name, value }) => {
          if (name) qs[name] = value;
        });
      } else {
        qs = this.getNodeParameter('jsonQuery', index) as IDataObject;
      }
    }

    // 3) Build `headers`
    let headers: IDataObject = {};
    if (this.getNodeParameter('sendHeaders', index)) {
      if (this.getNodeParameter('specifyHeaders', index) === 'fields') {
        const items = this.getNodeParameter(
          'headerParameters.parameter',
          index,
          [],
        ) as Array<{ name: string; value: string }>;
        items.forEach(({ name, value }) => {
          if (name) headers[name] = value;
        });
      } else {
        headers = this.getNodeParameter('jsonHeaders', index) as IDataObject;
      }
    }

    // 4) Build `body`
    let body: IDataObject = {};
    if (this.getNodeParameter('sendBody', index)) {
      if (this.getNodeParameter('specifyBody', index) === 'fields') {
        const items = this.getNodeParameter(
          'bodyParameters.parameter',
          index,
          [],
        ) as Array<{ name: string; value: string }>;
        items.forEach(({ name, value }) => {
          if (name) body[name] = value;
        });
      } else {
        body = this.getNodeParameter('jsonBody', index) as IDataObject;
      }
    }

    // 5) Delegate to generic helper
    const response = await apiRequest.call(
      this,
      method as any,
      url,
      body,
      qs,
      headers,
    );

    // 6) Return JSON array
    return this.helpers.returnJsonArray(
      Array.isArray(response) ? response : [response],
    );
  } catch (error) {
    throw new NodeOperationError(this.getNode(), error as Error);
  }
}

// for compatibility, also export as default
export default executeMakeApiRequest;
