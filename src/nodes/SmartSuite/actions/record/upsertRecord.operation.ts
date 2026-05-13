// src/nodes/SmartSuite/actions/record/upsertRecord.operation.ts
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog, asIdString, isReservedField, tryParseJson, parseFullName } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getTableIdWithStructure } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  // Get the table ID (application ID) and field structure
  const { id: tableId, structure } = await getTableIdWithStructure.call(this, 0);
  const fieldTypeMap               = new Map(structure.map((f) => [f.slug, f.field_type]));
  debugLog('[UpsertRecord] execute', { tableId }, 2);

  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    // 1) Matching criteria
    const matchingField = this.getNodeParameter('matchingField', i) as string;
    const condition     = this.getNodeParameter('condition',     i) as string;
    const matchValue    = this.getNodeParameter('matchValue',    i) as string;
    if (!matchingField || !condition || !matchValue) {
      throw new NodeOperationError(
        this.getNode(),
        'Matching Field, Condition, and Match Value are required for Upsert Record',
        { itemIndex: i },
      );
    }

    // 2) Fields to upsert
    const fieldsArr = this.getNodeParameter(
      'fieldsUiUpdate.fieldsValues',
      i,
      [],
    ) as Array<{ field: string; value: any }>;
    if (!fieldsArr.length) {
      throw new NodeOperationError(
        this.getNode(),
        'You must provide at least one field to upsert',
        { itemIndex: i },
      );
    }

    // 3) Prevent reserved fields
    for (const { field } of fieldsArr) {
      const slug = asIdString(field);
      if (isReservedField(slug)) {
        throw new NodeOperationError(
          this.getNode(),
          `Cannot upsert system field “${slug}”.`,
          { itemIndex: i },
        );
      }
    }

    // 4) Build filter for existing-record lookup
    const filter: IDataObject = {
      operator: 'and',
      fields: [{ field: matchingField, comparison: condition, value: matchValue }],
    };
    debugLog('[UpsertRecord] searching for existing record', filter, 3);

    // 5) List with limit=1 to find an existing record
    const query: IDataObject = { limit: 1, offset: 0 };
    const listResponse = (await apiRequest.call(
      this,
      'POST',
      `/applications/${tableId}/records/list/`,
      { filter },
      query,
    )) as IDataObject;
    const results = (listResponse.items as IDataObject[]) || [];

    // 6) Prepare payload
    const payload = fieldsArr.reduce((obj: IDataObject, { field, value }) => {
      const slug = asIdString(field);
      let processed: unknown = typeof value === 'string' ? tryParseJson(value) ?? value : value;
      if (fieldTypeMap.get(slug) === 'fullnamefield' && typeof processed === 'string') {
        processed = parseFullName(processed);
      }
      obj[slug] = processed as IDataObject[string];
      return obj;
    }, {} as IDataObject);

    let response: IDataObject;

    if (results.length > 0) {
      // 7a) Update existing
      const existingId = results[0].id as string;
      debugLog(`[UpsertRecord] updating record ${existingId}`, payload, 2);
      response = (await apiRequest.call(
        this,
        'PATCH',
        `/applications/${tableId}/records/${existingId}/`,
        payload,
      )) as IDataObject;
    } else {
      // 7b) Create new
      debugLog('[UpsertRecord] creating new record', payload, 2);
      response = (await apiRequest.call(
        this,
        'POST',
        `/applications/${tableId}/records/`,
        payload,
      )) as IDataObject;
    }

    debugLog('[UpsertRecord] response', response, 2);
    returnData.push(...this.helpers.returnJsonArray([response]));
  }

  return returnData;
}
