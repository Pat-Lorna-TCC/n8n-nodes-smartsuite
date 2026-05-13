// src/nodes/SmartSuite/actions/record/createRecord.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString, isReservedField, tryParseJson, parseFullName } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getSolutionId, getTableIdWithStructure } from '../../helpers/validation';
import { solutionInput, tableInput, fieldsInput } from '../../shared/resourceInputs';

export const description = [
  {
    ...solutionInput,
    displayOptions: { show: { resource: ['record'], operation: ['createRecord'] } },
  },
  {
    ...tableInput,
    displayOptions: { show: { resource: ['record'], operation: ['createRecord'] } },
  },
  {
    ...fieldsInput,
    displayOptions: { show: { resource: ['record'], operation: ['createRecord'] } },
  },
] as const;

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const solutionId                 = await getSolutionId.call(this, 0);
  const { id: tableId, structure } = await getTableIdWithStructure.call(this, 0);
  const fieldTypeMap               = new Map(structure.map((f) => [f.slug, f.field_type]));

  debugLog('[Record] createRecord.execute called', this.getNode().parameters);
  const items      = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const fieldsArr = this.getNodeParameter('fieldsUi.fieldsValues', i, []) as Array<{
      field: unknown;
      value: any;
    }>;

    if (!fieldsArr.length) {
      throw new NodeOperationError(
        this.getNode(),
        'You must provide at least one field to create a record.',
        { itemIndex: i },
      );
    }

    // Prevent setting system fields
    for (const { field } of fieldsArr) {
      const slug = asIdString(field);
      if (isReservedField(slug)) {
        throw new NodeOperationError(
          this.getNode(),
          `Cannot set system field “${slug}”.`,
          { itemIndex: i },
        );
      }
    }

    const payload = fieldsArr.reduce((obj: IDataObject, { field, value }) => {
      const slug = asIdString(field);
      let processed: unknown = typeof value === 'string' ? tryParseJson(value) ?? value : value;
      if (fieldTypeMap.get(slug) === 'fullnamefield' && typeof processed === 'string') {
        processed = parseFullName(processed);
      }
      obj[slug] = processed as IDataObject[string];
      return obj;
    }, {});

    debugLog('[Record] createRecord.request', { solutionId, tableId, payload });
    const response = await apiRequest.call(
      this,
      'POST',
      `/applications/${tableId}/records/`,
      payload,
    );
    debugLog('[Record] createRecord.response', response);

    const result = (response && typeof response === 'object') ? response : {};
    returnData.push(...this.helpers.returnJsonArray([result as IDataObject]));
  }

  return returnData;
}
