// src/nodes/SmartSuite/SmartSuiteTrigger.node.ts

import {
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from 'n8n-workflow';
import type {
  IPollFunctions,
  ICredentialTestFunctions,
  INodeCredentialTestResult,
  IDataObject,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { apiRequest } from './transport/smartSuiteApi';
import { asIdString, debugLog } from './helpers/utils';
import {
  getOperations,
  getTableFields,
  getMutableTableFields,
  getFilterOptionsForFieldType,
} from './methods/loadOptions';
import { solutionSearch, tableSearch } from './methods/listSearch';

export class SmartSuiteTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SmartSuite Trigger',
    name: 'smartSuiteTrigger',
    icon: 'file:SmartSuite.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Watch for new or updated records in SmartSuite',
    defaults: { name: 'SmartSuite Trigger' },
    credentials: [
      {
        name: 'smartSuiteApi',
        required: true,
        testedBy: 'smartSuiteApiTest',
      },
    ],
    polling: true,
    inputs:  [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [
      {
        displayName: 'Solution',
        name: 'solutionId',
        type: 'resourceLocator',
        noDataExpression: false,
        default: { mode: 'list', value: '' },
        modes: [
          {
            name: 'list',
            displayName: 'From List',
            type: 'list',
            typeOptions: {
              searchListMethod: 'solutionSearch',
              searchable: true,
            },
          },
          {
            name: 'id',
            displayName: 'By ID',
            type: 'string',
            placeholder: 'Solution ID',
          },
        ],
        description: 'Select the SmartSuite solution to watch',
      },
      {
        displayName: 'Table',
        name: 'tableId',
        type: 'resourceLocator',
        noDataExpression: false,
        default: { mode: 'list', value: '' },
        modes: [
          {
            name: 'list',
            displayName: 'From List',
            type: 'list',
            typeOptions: {
              searchListMethod: 'tableSearch',
              searchable: true,
            },
          },
          {
            name: 'id',
            displayName: 'By ID',
            type: 'string',
            placeholder: 'Table ID',
          },
        ],
        description: 'Select the table to watch',
      },
      {
        displayName: 'Trigger Field',
        name: 'triggerField',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'First Created', value: 'first_created', description: 'Trigger when a record is first created' },
          { name: 'Last Updated',  value: 'last_updated',  description: 'Trigger when a record is updated' },
        ],
        default: 'last_updated',
        description: 'Which timestamp to use for change detection',
      },
    ],
  };

  methods = {
    credentialTest: {
      async smartSuiteApiTest(
        this: ICredentialTestFunctions,
      ): Promise<INodeCredentialTestResult> {
        try {
          await apiRequest.call(
            this as unknown as IExecuteFunctions,
            'GET',
            '/solutions/',
            {} as any,
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
    },
    listSearch: {
      solutionSearch,
      tableSearch,
    },
  };

  async poll(
    this: IPollFunctions,
  ): Promise<INodeExecutionData[][] | null> {
    const staticData = this.getWorkflowStaticData('node') as IDataObject;
    const mode = this.getMode();

    let runPrefix = '';
    if (mode !== 'manual') {
      const prevCount = (staticData.runCount as number) || 0;
      const runCount = prevCount + 1;
      staticData.runCount = runCount;
      const runIndex = String(runCount).padStart(3, '0');
      runPrefix = `${runIndex}-`;
    }
    debugLog(
      `[SmartSuiteTrigger] Trigger Run-${runPrefix}${new Date().toISOString()}`,
      {},
      3,
    );

    const tableId = asIdString(this.getNodeParameter('tableId', 0));
    const triggerField = this.getNodeParameter('triggerField', 0) as string;

    const path = `/applications/${tableId}/records/list/`;
    const qs: IDataObject = {};
    const body: IDataObject = {};
    if (mode === 'manual') {
      qs.limit = 1;
    } else {
      body.filter = {
        operator: 'and',
        fields: [
          { field: triggerField, comparison: 'is_on_or_after', value: { date_mode: 'today', date_mode_value: null } },
        ],
      };
    }

    const response = await apiRequest.call(this, 'POST', path, body, qs);
    const rawItems = (response as any).records ?? (response as any).items ?? [];

    let filtered = rawItems;
    if (mode !== 'manual') {
      const lastCheckedRaw = (staticData.LastCheckedDate as string) || new Date(0).toISOString();
      const lastMs = new Date(lastCheckedRaw).getTime();
      filtered = rawItems.filter((item: any) => {
        const on = item[triggerField]?.on;
        return typeof on === 'string' && new Date(on).getTime() > lastMs;
      });
      if (filtered.length) {
        const newest = filtered
          .map((i: any) => i[triggerField].on)
          .sort()
          .pop() as string;
        staticData.LastCheckedDate = newest;
        debugLog(`[SmartSuiteTrigger] Updated LastCheckedDate = ${newest}`, {}, 3);
      }
    }

    debugLog('[SmartSuiteTrigger] Records →', filtered, 3);
    if (filtered.length) {
      return [this.helpers.returnJsonArray(filtered)];
    }
    return null;
  }
}

export default SmartSuiteTrigger;
