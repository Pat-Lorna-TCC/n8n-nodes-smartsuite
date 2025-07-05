// src/nodes/SmartSuite/SmartSuite.node.ts

import {
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from 'n8n-workflow';
import type {
  IExecuteFunctions,
  ICredentialTestFunctions,
  INodeCredentialTestResult,
  INodeExecutionData,
} from 'n8n-workflow';
import { router } from './methods/router';
import { apiRequest } from './transport/smartSuiteApi';

// loadOptions & listSearch imports
import {
  getOperations,
  getTableFields,
  getMutableTableFields,
  getFilterOptionsForFieldType,
  searchTableFields,
  searchTableFieldsMutable,
} from './methods/loadOptions';
import { getAllFilterConditions } from './helpers/getValidFilters';
import { solutionSearch, tableSearch } from './methods/listSearch';

// resource descriptions
import { recordDescription } from './actions/record/RecordDescription';
import { tableOperations, tableFields } from './actions/table/TableDescription';
import { solutionDescription } from './actions/solution/SolutionDescription';
import { orgManagementDescription } from './actions/orgManagement/OrgManagementDescription';

// API Request UI + executor
import { apiRequestDescription } from './actions/api/ApiRequestDescription';
import { executeMakeApiRequest } from './actions/api/makeApiRequest.operation';

export class SmartSuite implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SmartSuite',
    name:        'smartsuite',
    icon:        'file:SmartSuite.svg',
    group:       ['transform'],
    version:     2,
    subtitle:    '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with SmartSuite API',
    defaults:    { name: 'SmartSuite' },
    // disable the "inputs must be ['main']" lint rule for these lines
    // eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
    inputs:      [NodeConnectionType.Main],
    // eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
    outputs:     [NodeConnectionType.Main],
    credentials: [
      {
        name:     'smartSuiteApi',
        required: true,
        testedBy: 'smartSuiteApiTest',
      },
    ],
    properties: [
      // 1) Resource selector
      {
        displayName:      'Resource',
        name:             'resource',
        type:             'options',
        noDataExpression: true,
        default:          'record',
        options: [
          { name: 'Record',         value: 'record'         },
          { name: 'Table',          value: 'table'          },
          { name: 'Solution',       value: 'solution'       },
          { name: 'Org Management', value: 'orgManagement'  },
          { name: 'API Request',    value: 'apiRequest'     },
        ],
        description: 'Which SmartSuite resource to operate on',
      },

      // 2) Existing-resource UIs
      ...recordDescription,
      ...tableOperations,
      ...tableFields,
      ...solutionDescription,
      ...orgManagementDescription,

      // 3) API-Request UI (HTTP methods as operations + Query/Header/Body toggles)
      ...apiRequestDescription,
    ],
  };

  methods = {
    credentialTest: {
      async smartSuiteApiTest(
        this: ICredentialTestFunctions,
      ): Promise<INodeCredentialTestResult> {
        try {
          // simple test endpoint
          await apiRequest.call(
            this as unknown as IExecuteFunctions,
            'GET',
            '/solutions/',
            {},
            { limit: 1, offset: 0 },
          );
          return { status: 'OK', message: 'Connection successful!' };
        } catch (err: any) {
          return { status: 'Error', message: err.message };
        }
      },
    },
    loadOptions: {
      getOperations,
      getTableFields,
      getMutableTableFields,
      getFilterOptionsForFieldType,
      getAllFilterConditions,
      searchTableFields,
      searchTableFieldsMutable,
    },
    listSearch: {
      solutionSearch,
      tableSearch,
    },
  };

  async execute(
    this: IExecuteFunctions,
  ): Promise<INodeExecutionData[][]> {
    const resource = this.getNodeParameter('resource', 0) as string;

    if (resource === 'apiRequest') {
      // call our single-operation executor at index 0
      const output = await executeMakeApiRequest.call(this, 0);
      return [output];
    }

    // otherwise fall back to the router
    return router.call(this);
  }
}

export default SmartSuite;
