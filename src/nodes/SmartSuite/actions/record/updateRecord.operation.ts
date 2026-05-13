// src/nodes/SmartSuite/actions/record/updateRecord.operation.ts
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString, isReservedField, tryParseJson, parseFullName } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getSolutionId, getTableIdWithStructure } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const solutionId                 = await getSolutionId.call(this, 0);
  const { id: tableId, structure } = await getTableIdWithStructure.call(this, 0);
  const fieldTypeMap               = new Map(structure.map((f) => [f.slug, f.field_type]));

  debugLog('[Record] updateRecord.execute called', this.getNode().parameters, 2);
  const items      = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const recordId = asIdString(this.getNodeParameter('recordId', i));
    if (!recordId.trim()) {
      throw new NodeOperationError(
        this.getNode(),
        'Record ID is required for Update Record operation.',
        { itemIndex: i },
      );
    }

    const fieldsArr = this.getNodeParameter(
      'fieldsUiUpdate.fieldsValues',
      i,
      [],
    ) as Array<{ field: unknown; value: any }>;

    if (!fieldsArr.length) {
      throw new NodeOperationError(
        this.getNode(),
        'You must provide at least one field to update a record.',
        { itemIndex: i },
      );
    }

    // Prevent updating system fields
    for (const { field } of fieldsArr) {
      const slug = asIdString(field);
      if (isReservedField(slug)) {
        throw new NodeOperationError(
          this.getNode(),
          `Cannot update system field “${slug}”.`,
          { itemIndex: i },
        );
      }
    }

    // Build request payload
    const payload = fieldsArr.reduce((obj: IDataObject, { field, value }) => {
      const slug = asIdString(field);
      let processed: unknown = typeof value === 'string' ? tryParseJson(value) ?? value : value;
      if (fieldTypeMap.get(slug) === 'fullnamefield' && typeof processed === 'string') {
        processed = parseFullName(processed);
      }
      obj[slug] = processed as IDataObject[string];
      return obj;
    }, {});

    debugLog(
      '[Record] updateRecord.request',
      { solutionId, tableId, recordId, payload },
      2,
    );
    const response = (await apiRequest.call(
      this,
      'PATCH',
      `/applications/${tableId}/records/${recordId}/`,
      payload,
    )) as IDataObject;
    debugLog('[Record] updateRecord.response', response, 2);

    returnData.push(...this.helpers.returnJsonArray([response]));
  }

  return returnData;
}
