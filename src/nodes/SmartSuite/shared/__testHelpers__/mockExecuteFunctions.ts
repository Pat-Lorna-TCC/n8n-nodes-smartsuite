// src/shared/__testHelpers__/mockExecuteFunctions.ts

import { IExecuteFunctions, INodeExecutionData, INode } from 'n8n-workflow';

// A minimal INode stub for NodeOperationError
const mockNode: INode = {
  id: '1',
  name: 'mockNode',
  type: 'mockType',
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
};

/**
 * Provides a mocked IExecuteFunctions context for n8n nodes.
 */
export function mockExecuteFunctions(overrides: {
  apiRequestResponse: any;
  inputData?: INodeExecutionData[];
  parameters?: Record<string, any>;
}): IExecuteFunctions {
  return {
    getNode(): INode {
      return mockNode;
    },

    getInputData(): INodeExecutionData[] {
      return overrides.inputData ?? [];
    },

    getNodeParameter(name: string, itemIndex: number = 0): any {
      // 1) Handle nested parameters like 'filters.filter'
      if (overrides.parameters) {
        const keys = name.split('.');
        let value = overrides.parameters;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined) break;
        }
        if (value !== undefined) return value;
      }

      // 2) Default dummy values for non-nested parameters
      switch (name) {
        case 'solution':
          return 'dummy-solution-id';
        case 'tableName':
          return 'Test Table';
        case 'tableDescription':
          return 'Test Description';
        case 'icon':
          return 'Test Icon';
        case 'returnAll':
          return false;
        case 'limit':
          return 50;
        case 'hydrated':
          return false;
        case 'searchOperator':
          return 'and'; // Ensure this is always returned
        case 'filters.filter':
          return []; // Default to an empty array if not set
        case 'fieldsUiUpdate.fieldsValues': // Ensure fieldsUiUpdate fields are always an empty array or valid value
          return overrides.parameters?.['fieldsUiUpdate.fieldsValues'] || []; 
        default:
          return undefined;
      }
    },

    getCredentials(_credentialName: string) {
      return {
        apiKey: 'dummy',
        accountId: 'dummy',
        baseUrl: 'https://dummy',
      };
    },

    helpers: {
      makeApiRequest(
        _method: string,
        _path: string,
        _body?: any,
        _query?: any,
        _headers?: any,
      ) {
        return Promise.resolve(overrides.apiRequestResponse);
      },

      httpRequest(_opts?: any) {
        return Promise.resolve(overrides.apiRequestResponse);
      },

      returnJsonArray(data: any[]): INodeExecutionData[] {
        return data.map((d) => ({ json: d } as INodeExecutionData));
      },
    },
  } as unknown as IExecuteFunctions;
}
